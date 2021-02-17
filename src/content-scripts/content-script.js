/*
This file implements 4 objects:
  + player: controls and interacts with the video player
  + server: communicates with the server
  + browser: communicates with the browser (popup, background and storage)
  + fc: main family cinema object, it keeps everything running, serving as main data hub for the other objects
*/

/*
 
 Main family cinema object
  
*/
'use strict'

var fc = {
  default_settings: {
    username: '',
    password: '',
    blur_level: 40,
    skip_tags: [],
    autosave_after: 2500,
    ignore_default_settings: true,
    pause_after_adding_scene: false,
    playbackRate_on_mark: 1.5,
    mute_on_mark: true,
    blur_on_frame_seek: false // if false, it uses settings.blur_level
  },

  settings: false,
  scenes: false,
  metadata: false,
  next_share: Infinity,
  marking_started: false,
  preview_skip: false,
  skipping: false,
  frame_seeked: false,
  skip_ids: {},
  tagged: {},

  previewScene: function(scene) {
    console.log('Previewing scene: ', scene)
    fc.preview_skip = scene
    player.play()
    player.seek(fc.preview_skip.start - 2500)
    return true
  },

  updateScene: function(scene, field) {
    var i = utils.idToIndex(scene.id)
    console.log('[updateScene]: Updating ', scene, field)
    if (field == 'start') {
      player.seek(scene.start, 'frame')
    } else if (field == 'end') {
      player.seek(scene.end, 'frame')
    } else if (field == 'skip') {
      fc.skip_ids[scene.id] = scene.skip
    }

    fc.scenes[i] = scene
    fc.onContentEdit(field)
    return true
  },

  removeScene: function(id) {
    console.log('Removing scene: ', id)
    var i = utils.idToIndex(id)
    fc.scenes.splice(i, 1)
    fc.onContentEdit('remove')
    return true
  },

  // Add new scene to the list of scenes
  addScene: function(scene) {
    // Decide if new scenes requires skipping
    scene = fc.decideSkip([scene])[0]
    // Add scene
    fc.scenes.push(scene)
    // Trigger content edit
    fc.onContentEdit('add')
    return true
  },

  updateShield: function() {
    console.log('[updateShield] updating')
    var shield = 'done'
    var skip_tags = fc.settings.skip_tags
    for (var i = 0; i < skip_tags.length; i++) {
      if (!fc.tagged[skip_tags[i]]) {
        shield = 'unkown'
      } else if (fc.tagged[skip_tags[i]].status == 'missing') {
        shield = 'missing'
        break
      } else if (fc.tagged[skip_tags[i]].status == 'unkown') {
        shield = 'unkown'
      }
    }
    fc.shield = shield
    console.log('[updateShield] new status ', fc.shield)
    browser.sendMessage({ msg: 'shield-status', status: fc.shield })
  },

  unload: function() {
    console.log('[unload] Clearing any previous content')
    if (fc.next_share != Infinity) server.setMovie()
    fc.scenes = null
    fc.metadata = null
    fc.tagged = {}
    fc.skip_ids = {}
    player.video = null
    fc.preview_skip = null
  },

  decideSkip: function(scenes) {
    if (!scenes) return []
    for (var i = 0; i < scenes.length; i++) {
      scenes[i].default_skip = utils.includesAny(scenes[i].tags, fc.settings.skip_tags)
      var id = scenes[i].id
      if (fc.skip_ids[id] !== undefined) {
        scenes[i].skip = fc.skip_ids[id]
      } else {
        scenes[i].skip = scenes[i].default_skip
      }
      scenes[i].hidden = false
    }
    return scenes
  },

  loadSettings: function(settings) {
    if (settings && settings.ignore_default_settings) {
      for (var key in fc.default_settings) {
        if (typeof fc.default_settings[key] !== typeof settings[key]) {
          settings[key] = fc.default_settings[key]
        }
      }
      fc.settings = settings
    } else {
      console.warn('Setting default settings instead of: ', settings)
      fc.settings = fc.default_settings
    }
    fc.onContentEdit('settings')
  },

  onContentEdit: function(edit) {
    // Propagate edit to server
    if (edit != 'server' && edit != 'skip' && edit != 'settings') {
      fc.next_share = Date.now() + fc.settings.autosave_after
    }

    if (edit != 'start' && edit != 'end') {
      // Update skip
      fc.scenes = fc.decideSkip(fc.scenes)

      // Update shield
      fc.updateShield()

      // Update badge
      browser.updateBadge()
    }

    // Propagate edit to user interface/browser
    browser.sendMessage({ msg: 'new-data', edit: edit })

    // Store 'Local' scenes, 'skip_ids'...
    browser.setMovie()
  },

  periodicCheck: function() {
    // Check we have the right metadata
    if (!fc.metadata || fc.metadata.url != window.location.href) {
      server.getMovie()
    }

    // Save data when needed
    if (Date.now() > fc.next_share) {
      server.setMovie()
    }

    // Check video player controller is working
    if (!player.video || !player.video.duration) {
      if (!player.load()) return
    }

    // Check if the current time needs to be skipped
    fc.check_needs_skip()
  },

  getVideoID: function() {
    // Extract metadata
    var url = window.location.href
    var host = window.location.hostname
    var m = { provider: '', pid: 0, duration: null, url: url, src: '' }
    var queryString = window.location.search
    var urlParams = new URLSearchParams(queryString)

    function match(regex, haystack) {
      if (!haystack) haystack = url
      var str = haystack.match(regex)
      return str ? str[1] : ''
    }

    if (host.includes('netflix')) {
      m.provider = 'netflix'
      m.pid = match(/watch\/([0-9]+)/)
    } else if (host.includes('amazon')) {
      m.provider = 'amazon'
      //m.pid = 'test'
    } else if (host.includes('youtube')) {
      m.provider = 'youtube'
      m.pid = urlParams.get('v')
    } else if (host.includes('disneyplus')) {
      m.provider = 'disneyplus'
      m.pid = match(/video\/([0-9abcdef\-]+)/)
    } else if (host.includes('hbo')) {
      m.provider = 'hbo'
      m.pid = match(/\/([0123456789abcdef-]+)\/play/)
    } else if (host.includes('movistarplus')) {
      m.provider = 'movistarplus'
      m.pid = urlParams.get('id')
    } else if (host.includes('rakuten')) {
      m.provider = 'rakuten'
      var themoviedb = document.querySelectorAll('a[href^="https://www.themoviedb.org/movie"]')
      //m.pid = 'test'
      if (themoviedb.length == 1) {
        m.pid = match(/\/([0123456789]+)/, themoviedb)
      }
    } else {
      m.provider = host
      //m.pid = 'test'
    }

    if (!m.src && m.pid) m.src = m.provider + '_' + m.pid

    if (player.video && player.video.duration) {
      m.duration = player.video.duration * 1000
    }
    fc.metadata = m
    console.log('[getVideoID]', fc.metadata)
  },

  mark_current_time: function(tags) {
    if (!tags) tags = []
    var start = fc.marking_started
    var time = Math.round(player.getTime() / 50) * 50
    if (!start) {
      fc.marking_started = player.video.paused ? time : time - 2000
      player.video.playbackRate = fc.settings.playbackRate_on_mark
      player.blur(fc.settings.blur_level)
      if (fc.settings.mute_on_mark) player.mute(true)
      console.log('Scene start marked at ', fc.marking_started)
    } else {
      var end = player.video.paused ? time : time - 2000
      var scene = { tags: tags, start: start, end: end, id: utils.random_id() }
      fc.addScene(scene)
      fc.marking_started = false
      player.video.playbackRate = 1
      player.blur(0)
      if (fc.settings.pause_after_adding_scene) player.pause()
      player.mute(false)
      console.log('Scene added ', start, ' -> ', end)
      return { msg: 'marked-scene', scene: scene }
    }
  },

  check_needs_skip: function() {
    var now = player.getTime()
    var next_good = 0

    if (fc.frame_seeked) {
      if (player.video.paused || Date.now() < fc.frame_seeked + 500) return
      player.blur(0)
      fc.frame_seeked = false
    }

    // Our skip_list is the main skip_list, unless we are on preview mode
    var skip_list = fc.scenes
    if (fc.preview_skip) {
      skip_list = [fc.preview_skip] // should we replace or add it as a new one?
    }

    if (!skip_list) return

    // Check if we are on a bad time
    for (var i = 0; i < skip_list.length; i++) {
      if (!fc.preview_skip && !skip_list[i].skip) continue
      var start = skip_list[i].start - 40
      var end = skip_list[i].end - 40
      // Math.max(next_good+500,now) if the scene starts 0.5s after the end of the skip, consider they overlap
      if (Math.max(next_good + 500, now) > start && now < end) {
        next_good = Math.max(next_good, end)
      }
    }

    // Go back to normal or skip content when needed
    if (next_good === 0 && fc.skipping) {
      console.log('[check_needs_skip] Back to normal')
      fc.preview_skip = null
      player.video.style.visibility = 'visible'
      player.mute(false)
      fc.skipping = false
    } else if (next_good !== 0 && !fc.skipping) {
      console.log('[check_needs_skip] It does!')
      player.video.style.visibility = 'hidden'
      player.mute(true)
      player.seek(next_good)
      fc.skipping = true
    }
  }
}

/*
  Browser object, interacts with the browser (popup, background, storage). Implements:
    - sendMessage
    - addListeners: add listeners for the following events
      * mark-current-time
      * preview
      * remove
      * update-scene
      * get-data
      * update-settings
      * play-pause
      * pause
      * play
    - setData
    - getData
*/
var browser = {
  // Send message to the interface and background script
  sendMessage: function(msg) {
    chrome.runtime.sendMessage(msg, function(response) {
      console.log('[sendMessage-content-script] msg: ', msg, '; response: ', response)
    })
  },

  // Starts listening to messages from interface and background script
  addListeners: function() {
    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
      console.log('[listen] Received request: ', request)
      try {
        if (request.msg == 'mark-current-time') {
          return sendResponse(fc.mark_current_time(request.tags))
        } else if (request.msg == 'get-time') {
          return sendResponse({
            success: true,
            time: player.getTime()
          })
        } else if (request.msg == 'show-sidebar') {
          show_sidebar()
        } else if (request.msg == 'preview') {
          fc.previewScene(request.scene)
        } else if (request.msg == 'remove') {
          fc.removeScene(request.id)
        } else if (request.msg == 'update-scene') {
          fc.updateScene(request.scene, request.field)
        } else if (request.msg == 'get-data') {
          return sendResponse({
            success: true,
            msg: 'new-data',
            scenes: fc.scenes,
            settings: fc.settings,
            tagged: Object.assign({}, fc.tagged), // Make sure this is an object
            shield: fc.shield,
            metadata: fc.metadata,
            state: {
              marking: fc.marking_started
            }
          })
        } else if (request.msg == 'update-settings') {
          fc.loadSettings(request.settings)
          browser.setData('settings', fc.settings)
        } else if (request.msg == 'set-tagged') {
          fc.tagged = request.tagged
          fc.onContentEdit('tagged')
        } else if (request.msg == 'play-pause') {
          player.togglePlay()
        } else if (request.msg == 'pause') {
          player.pause()
        } else if (request.msg == 'play') {
          player.play()
        } else if (request.msg == 'mute') {
          player.mute(request.state)
        } else if (request.msg == 'blur') {
          player.blur(request.blur_level)
          // This is not really true, but it keeps the blur level while movie is paused
          if (!fc.marking_started) fc.frame_seeked = Date.now()
        } else if (request.msg == 'seek-frame') {
          player.seek(request.time, 'frame')
        } else if (request.msg == 'seek-diff') {
          player.seek(request.diff + player.getTime(), 'frame')
        } else if (request.msg == 'login') {
          server.send(
            {
              action: 'login',
              username: request.username,
              password: request.password
            },
            function(response) {
              sendResponse(response)
            }
          )
          return true
        } else if (request.msg == 'newuser') {
          server.send(
            {
              action: 'newuser',
              username: request.username,
              password: request.password,
              email: request.email
            },
            function(response) {
              sendResponse(response)
            }
          )
          return true
        } else if (request.msg == 'newpass') {
          server.send(
            {
              action: 'newpass',
              username: request.username,
              password: request.password,
              newpassword: request.newpassword
            },
            function(response) {
              sendResponse(response)
            }
          )
          return true
        } else {
          console.log('Unkown request: ', request)
        }
        console.log('sending default response')
        sendResponse({ success: true })
      } catch (e) {
        console.log('[listen] Error: ', e)
        sendResponse({ success: false, error: e })
      }
    })
  },

  updateBadge: function() {
    // Update badge
    var count = 0
    for (var i = 0; i < fc.scenes.length; i++) {
      if (fc.scenes[i].skip) count++
    }
    browser.sendMessage({ msg: 'update-badge', numDisplayedScenes: count })
  },

  setMovie: function() {
    if (!fc.scenes || !fc.metadata || !fc.metadata.src) {
      return console.log('[browser.setMovie] Unable locally store scenes')
    }
    var localData = {
      scenes: fc.scenes.filter(scene => scene.tags.includes('Local')),
      skip_ids: fc.skip_ids
    }
    console.log(localData)
    browser.setData(fc.metadata.src, localData)
  },

  // sets data on chrome sync storage
  setData: function(id, data) {
    var query = {}
    query[id] = JSON.stringify(data)
    chrome.storage.sync.set(query, function() {
      console.log('[setLocalData] ', id, data)
    })
  },

  // gets data on chrome sync storage
  getData: function(id, callback) {
    chrome.storage.sync.get(id, function(data) {
      console.log('[getLocalData] ', id, data)
      callback(utils.parseJSON(data[id]))
    })
  }
}

/*
  Server object, handles communications with the server, all communications are authenticated, implements
  + setMovie: shares current data with the server
  + getMovie: downloads servers data for current movie
  + send: send any query to the server
  + buildUrl: helper function

*/
var server = {
  setMovie: function() {
    if (!fc.scenes || !fc.metadata || !fc.metadata.src) {
      return console.log('[setData] Unable to upload scenes')
    }

    // Server
    var data = {
      metadata: {
        pid: fc.metadata.pid,
        src: fc.metadata.src,
        provider: fc.metadata.provider,
        duration: fc.metadata.duration
      },
      scenes: fc.scenes.filter(scene => !scene.tags.includes('Local')),
      tagged: fc.tagged
    }

    server.send({
      action: 'setData',
      id: fc.metadata.src,
      username: fc.settings.username,
      password: fc.settings.password,
      data: JSON.stringify(data)
    })
    fc.next_share = Infinity
  },

  getMovie: function() {
    fc.unload()
    fc.getVideoID()
    if (!fc.metadata || !fc.metadata.src) {
      console.warn('[getMovie] Invalid metadata ', fc.metadata)
      browser.sendMessage({ msg: 'update-badge', numDisplayedScenes: '' })
      return
    }
    console.log('[getMovie] Getting details for ', fc.metadata.src)

    // Get local data
    browser.getData(fc.metadata.src, function(localData) {
      if (!localData) return console.log('No local data for this movie')
      fc.skip_ids = localData.skip_ids
      fc.scenes = utils.merge(fc.scenes, localData.scenes)
      fc.onContentEdit('server')
    })

    // Get servers data
    server.send({ action: 'getData', id: fc.metadata.src }, function(result) {
      if (result.status != 200 || !result.data || !result.data.scenes) {
        return console.error('[getData] Something is wrong with the server...')
      }
      fc.scenes = utils.merge(result.data.scenes, fc.scenes)
      fc.tagged = Object.assign({}, result.data.tagged)
      fc.onContentEdit('server')
    })
  },

  send: function(query, callback) {
    console.log('[send] ', query)
    var url = server.buildURL(query)
    fetch(url)
      .then(r => r.text())
      .then(data => {
        if (callback) callback(utils.parseJSON(data))
      })
  },

  // Helper function to build the url/end point for the given query
  buildURL: function(query) {
    try {
      query.version = chrome.runtime.getManifest().version
    } catch (e) {
      console.log(e)
    }

    // Build url
    var out = []
    for (var key in query) {
      if (query.hasOwnProperty(key)) {
        out.push(key + '=' + encodeURIComponent(query[key]))
      }
    }
    var url = 'https://www.arrietaeguren.es/movies/api?' + out.join('&')
    console.log('[buildURL]', url)
    return url
  }
}

var player = {
  video: false,

  load: function() {
    var video = document.getElementsByTagName('video')
    if (video.length != 1) {
      //console.warn('[load] We have ', video.length, ' videos tags...')
      return false
    }
    player.video = video[0]
    fc.metadata.duration = player.video.duration * 1000

    if (fc.metadata.provider == 'netflix') {
      if (!document.getElementById('fc-netflix-video-controller')) {
        var script = document.createElement('script')
        script.id = 'fc-netflix-video-controller'
        script.innerHTML = `
          document.addEventListener('netflix-video-controller', function (e) {
            var data = e.detail;
            var videoPlayer = netflix.appContext.state.playerApp.getAPI().videoPlayer;
            var allSessions = videoPlayer.getAllPlayerSessionIds();
            for (var i = allSessions.length - 1; i >= 0; i--) {
              var netflix_player = videoPlayer.getVideoPlayerBySessionId(allSessions[i]);
              console.log('[netflix-video-controller] Received: ', data, netflix_player);
              if (data.pause) {
                netflix_player.pause();
              } else if (data.play) {
                netflix_player.play();
              }
              if (data.time) {
                netflix_player.seek(data.time);
              }
            }
          });`
        document.head.appendChild(script)
      }
    }
    return true
  },

  mute: function(state) {
    player.video.muted = state
  },

  blur: function(blur_level) {
    if (!blur_level) blur_level = 0
    player.video.style.webkitFilter = 'blur(' + parseInt(blur_level) + 'px)'
  },

  pause: function() {
    if (fc.metadata.provider == 'netflix') {
      document.dispatchEvent(
        new CustomEvent('netflix-video-controller', { detail: { pause: true } })
      )
    } else {
      console.log('pausing video')
      player.video.pause()
    }
  },

  play: function() {
    console.log('play')
    if (fc.metadata.provider == 'netflix') {
      document.dispatchEvent(
        new CustomEvent('netflix-video-controller', { detail: { play: true } })
      )
    } else {
      console.log('playing video')
      player.video.play()
    }
  },

  togglePlay: function() {
    if (player.video.paused) {
      player.play()
    } else {
      player.pause()
    }
  },

  seek: function(time, mode) {
    console.log('[seek_time] seeking time ', time)

    // Check objective time is within range
    if (!time || time < 0 || time > fc.metadata.duration) {
      console.log('Invalid time ', time, ', video length is ', fc.metadata.duration)
      return
    }

    // Pause player if it is framed seeked
    if (mode == 'frame') {
      console.log('Frame seeking!')
      fc.frame_seeked = Date.now()
      if (fc.settings.blur_on_frame_seek) {
        player.blur(fc.settings.blur_on_frame_seek)
      }
      player.pause()
    }

    // Seek requested time
    if (fc.metadata.provider == 'netflix') {
      document.dispatchEvent(
        new CustomEvent('netflix-video-controller', { detail: { time: time } })
      )
    } else {
      player.video.currentTime = time / 1000
    }

    if (mode == 'frame') player.pause()
  },

  // Get current time in milliseconds (all times are always in milliseconds!)
  getTime: function() {
    return player.video.currentTime * 1000
  }
}

var utils = {
  merge: function(official, local) {
    console.log('[merge] merging: ', official, local)
    if (!local) return official
    if (!official) return local
    for (var i = 0; i < local.length; i++) {
      if (!official.some(e => e.id === local[i].id)) {
        official.push(local[i])
      }
    }
    // Quick sort
    official.sort(function(a, b) {
      return a.start - b.start
    })
    return official
  },

  random_id: function() {
    var text = ''
    var possible = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
    for (var i = 0; i < 10; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length))
    }
    return text
  },

  includesAny: function(arr1, arr2) {
    if (arr1.indexOf('All') !== -1) return true
    if (arr2.indexOf('All') !== -1) return true
    return arr1.some(v => arr2.indexOf(v) !== -1)
  },

  parseJSON: function(json) {
    try {
      var data = JSON.parse(json)
      return data
    } catch (e) {
      console.log('Invalid JSON ', json, e)
      return false
    }
  },

  idToIndex: function(id) {
    var i = fc.scenes.findIndex(x => x.id === id)
    if (i == -1) throw 'Unable to find index'
    return i
  }
}

browser.addListeners()

setInterval(fc.periodicCheck, 100)

document.addEventListener('unload', function() {
  fc.unload()
})

browser.getData('settings', function(settings) {
  fc.loadSettings(settings)
})

function show_sidebar() {
  console.log('injecting iframe')
  // Avoid recursive frame insertion...

  if (!document.getElementById('fc-iframe')) {
    var iframe = document.createElement('iframe')
    iframe.src = chrome.runtime.getURL('popup.html')
    console.log('injecting iframe: ', iframe.src)
    iframe.id = 'fc-iframe'
    document.body.appendChild(iframe)

    var style = document.createElement('style')
    style.innerHTML = `
    #hudson-wrapper, .sizing-wrapper, .app-container > div {
      right: 320px !important;
      width: calc(100% - 320px) !important;
    }
    #fc-iframe{
      position:fixed;
      top:0;
      right:0;
      display:block;
      width:320px;
      height:100%;
      z-index:1000;
    }
    `
    document.head.appendChild(style)
  }
}
