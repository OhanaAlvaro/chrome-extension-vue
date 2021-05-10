/*
This file implements 4 objects:
  + player: controls and interacts with the video player
  + server: communicates with the server
  + browser: communicates with the browser (popup, background and storage)
  + fc: main Ohana object, it keeps everything running, serving as main data hub for the other objects
*/

var what2watch = require('./what2watch')
var provider = require('./provider')

/*
 
 Main Ohana object
  
*/
;('use strict')

var fc = {
  default_settings: {
    username: '',
    blur_level: 20,
    skip_tags: [],
    ignore_default_settings: true,
    pause_after_adding_scene: false,
    playbackRate_on_mark: 1.5,
    mute_on_mark: true,
    level: 0,
    token: null,
    blur_on_frame_seek: false // if false, it uses settings.blur_level
  },

  settings: false,
  scenes: false,
  metadata: false,
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
    player.seek(fc.preview_skip.start - 5000)
    return true
  },

  updateScene: function(scene, field) {
    console.log('Updating scene: ', scene)
    // Share data with server
    server.setData('updateScene', scene)

    if (field == 'skip') {
      fc.skip_ids[scene.id] = scene.skip
    }
    // Add scene
    var i = utils.idToIndex(scene.id)
    fc.scenes[i] = scene
    // Propagate change and return
    fc.onContentEdit(field)
    return true
  },

  removeScene: function(id) {
    var i = utils.idToIndex(id)
    // Share remove with server
    server.setData('removeScene', fc.scenes[i])
    // Remove scene
    fc.scenes.splice(i, 1)
    // Propagate change and return
    fc.onContentEdit('remove')
    return true
  },

  // Add new scene to the list of scenes
  addScene: function(scene) {
    // Share scene with server
    server.setData('addScene', scene)
    // Add scene
    fc.scenes.push(scene)
    // Propagate change and return
    fc.onContentEdit('add')
    return true
  },

  updateShield: function() {
    //TODO: to be safest, it'd be useful to do this in a way unexpected values result in "unknown" and not in "done"! (e.g.: happenes for legacy scenes with "unkown" instead of "unknown").
    console.log('[updateShield] updating')
    var shield = 'done'
    var skip_tags = fc.settings.skip_tags
    for (var i = 0; i < skip_tags.length; i++) {
      if (!fc.tagged[skip_tags[i]]) {
        shield = 'unknown'
      } else if (fc.tagged[skip_tags[i]].status == 'missing') {
        shield = 'missing'
        break
      } else if (fc.tagged[skip_tags[i]].status == 'done') {
        // this is okay
      } else {
        shield = 'unknown'
      }
    }
    //------------
    let count = 0
    let override = ''
    for (var i = 0; i < fc.scenes.length; i++) {
      if (fc.scenes[i].skip) count++
    }
    if (shield == 'done' && count == 0) override = 'clean'
    if (skip_tags.length == 0) override = 'inactive2' //Alex: workaournd for now, to avoid pretending it's EVERYHTING is safe (no skip_tags) | check background.js
    //--------
    fc.shield = shield
    console.log('[updateShield] new status ', fc.shield)
    browser.sendMessage({ msg: 'shield-status', status: fc.shield, override: override })
  },

  unload: function() {
    console.log('[unload] Clearing any previous content')
    fc.scenes = null
    fc.metadata = {}
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
      console.log(fc.skip_ids)
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
      console.warn('Setting default settings instead of : ', settings)
      fc.settings = fc.default_settings
    }
    fc.onContentEdit('settings')
  },

  onContentEdit: function(edit) {
    if (edit != 'start' && edit != 'end') {
      // Update skip
      fc.scenes = fc.decideSkip(fc.scenes)
      // Update shield
      fc.updateShield()
      // Update badge
      browser.updateBadge()
    }

    if (edit == 'settings') {
      what2watch.init(fc.settings.skip_tags, server, true)
    }

    // Propagate edit to user interface/browser
    browser.sendMessage({ msg: 'new-data', edit: edit })

    // Store 'Local' scenes, 'skip_ids'...
    browser.setMovie()
  },

  periodicCheck: function() {
    // Check we have the right metadata
    if (!fc.metadata || fc.metadata.url != window.location.href) {
      fc.loadNewMedia()
    }

    if (!fc.metadata.id) {
      return what2watch.init(fc.settings.skip_tags, server)
    }

    // Check video player controller is working
    if (!player.video || !player.video.duration) {
      if (!player.load()) return
    }

    // Check if the current time needs to be skipped
    fc.check_needs_skip()
  },

  loadNewMedia: function() {
    fc.unload()
    fc.metadata.url = window.location.href
    // Extract metadata
    provider.getID().then(metadata => {
      fc.metadata = metadata
      if (!metadata.id) return
      if (player.video && player.video.duration) {
        fc.metadata.duration = player.video.duration * 1000
      }
      server.getMovie()
      console.log('[getVideoID]', fc.metadata)
    })
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
      //player.blur(0)
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
      * show-sidebar
      * preview
      * remove
      * update-scene
      * get-data
      * update-settings
      * set-tagged
      * play-pause
      * pause
      * mute
      * blur
      * seek-frame
      * seek-diff
      * login
      * newuser
      * newpass
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
          show_sidebar(request.show)
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
          server.setData('setTagged', request.tagged) //TODO: changed by Alex: @arrietaeguren please review! (was getting error of "tagged" alone not being defined. I guess you referred to that one :)
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
        } else if (request.msg == 'seek-frame') {
          player.seek(request.time, 'frame')
        } else if (request.msg == 'seek-diff') {
          player.seek(request.diff + player.getTime(), 'frame')
        } else if (request.msg == 'login') {
          return server.auth('login', request, sendResponse)
        } else if (request.msg == 'newuser') {
          return server.auth('newuser', request, sendResponse)
        } else if (request.msg == 'newpass') {
          return server.auth('newpass', request, sendResponse)
        } else if (request.msg == 'logout') {
          fc.settings.username = ''
          fc.settings.token = ''
          browser.setData('settings', fc.settings)
          fc.onContentEdit('settings')
        } else {
          console.log('unknown request: ', request)
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
    if (!fc.scenes || !fc.metadata || !fc.metadata.id) {
      return console.log('[browser.setMovie] Unable locally store scenes')
    }
    var localData = {
      scenes: fc.scenes.filter(scene => scene.tags.includes('Local')),
      skip_ids: fc.skip_ids || {}
    }
    console.log(localData)
    browser.setData(fc.metadata.id, localData)
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
      if (!data[id]) return callback({})
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
  setData: function(action, data) {
    if (!fc.metadata || !fc.metadata.id) {
      return console.log('[removeScene] Missing metadata, unable to upload data...')
    }

    if (action == 'updateScene' && data.tags.includes('Local')) {
      return
      //action == 'removeScene'
    }

    server.send({
      action: action,
      id: fc.metadata.id,
      username: fc.settings.username,
      token: fc.settings.token,
      password: fc.settings.password,
      data: JSON.stringify(data)
    })
  },

  auth: function(action, request, callback) {
    console.log('[auth] ', action, request)
    server.send(
      {
        action: action,
        username: request.username,
        password: request.password,
        email: request.email,
        newpassword: request.newpassword
      },
      function(response) {
        if (response.statusCode == 200) {
          fc.settings.token = response.body.token
          fc.settings.level = response.body.level
          fc.settings.username = request.username
          console.log('updating settings ', fc.settings)
          fc.loadSettings(fc.settings)
          browser.setData('settings', fc.settings)
        }
        callback(response)
      }
    )
    return true
  },

  getMovie: function() {
    if (!fc.metadata || !fc.metadata.id) {
      console.warn('[getMovie] Invalid metadata ', fc.metadata)
      browser.sendMessage({ msg: 'update-badge', numDisplayedScenes: '' })
      return
    }
    console.log('[getMovie] Getting details for ', fc.metadata.id)

    // Get local data
    browser.getData(fc.metadata.id, function(localData) {
      if (!localData) return console.log('No local data for this movie')
      fc.skip_ids = localData.skip_ids || {}
      fc.scenes = utils.merge(fc.scenes, localData.scenes)
      fc.onContentEdit('server')
    })

    // Get servers data
    var query = {
      action: 'getMovie',
      id: fc.metadata.id,
      season: fc.metadata.season,
      episode: fc.metadata.episode,
      title: fc.metadata.title
    }
    server.send(query, function(result) {
      if (!result || !result.body || !result.body.scenes) {
        console.log(result)
        return console.error('[getMovie] Something is wrong with the server...')
      }
      fc.scenes = utils.merge(result.body.scenes, fc.scenes)
      fc.tagged = Object.assign({}, result.body.tagged)
      Object.assign(fc.metadata, result.body.metadata)
      fc.onContentEdit('server')
    })
  },

  request_tagged(missing, callback) {
    if (missing.length == 0) return
    server.send({ action: 'getTagged', ids: JSON.stringify(missing) }, function(response) {
      callback(response)
    })
  },

  send: function(query, callback) {
    var url = server.buildURL(query)
    fetch(url).then(response => {
      response.json().then(body => {
        let res = { statusCode: response.status, body: body }
        console.warn('[server.send] Url:', url, '. Query: ', query, '. Response: ', res)
        if (callback) callback(res)
      })
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
      if (query.hasOwnProperty(key) && query[key] != null) {
        out.push(key + '=' + encodeURIComponent(query[key]))
      }
    }
    var url = 'https://api.ohanamovies.org/dev?' + out.join('&')
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
      player.video.pause()
    }
  },

  play: function() {
    if (fc.metadata.provider == 'netflix') {
      document.dispatchEvent(
        new CustomEvent('netflix-video-controller', { detail: { play: true } })
      )
    } else {
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
    if (!fc.metadata.duration && player.video) {
      fc.metadata.duration = player.video.duration * 1000
    }
    if (!time || time < 0 || (fc.metadata.duration && time > fc.metadata.duration)) {
      console.log('Invalid time ', time, ', video length is ', fc.metadata.duration)
      return
    }

    // Pause player if it is framed seeked
    if (mode == 'frame') {
      console.log('Frame seeking!')
      fc.frame_seeked = Date.now()
      /*if (fc.settings.blur_on_frame_seek) {
        player.blur(fc.settings.blur_on_frame_seek)
      }
      player.pause()*/
    }

    // Seek requested time
    if (fc.metadata.provider == 'netflix') {
      document.dispatchEvent(
        new CustomEvent('netflix-video-controller', { detail: { time: time } })
      )
    } else {
      player.video.currentTime = time / 1000
    }

    /*if (mode == 'frame') player.pause()*/
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

browser.getData('settings', function(settings) {
  fc.loadSettings(settings)
})

function show_sidebar(show) {
  console.log('[show-sidebar] ', show)
  // Remove fc-active class (this will hide the sidebar)
  if (!show) return document.body.classList.remove('fc-active')

  // Do not show sidebar if there is no movie
  if (!fc.metadata.id)
    return console.error('[show_sidebar] No point to show sidebar when there is no movie')

  // Add fc-active class (this will show the sidebar)
  document.body.classList.add('fc-active')

  // Inject iframe (if it is not already there)
  if (!document.getElementById('fc-iframe')) {
    console.log('injecting iframe')
    var iframe = document.createElement('iframe')
    iframe.src = chrome.runtime.getURL('popup.html')
    iframe.id = 'fc-iframe'
    iframe.style = 'display: none;'
    document.body.appendChild(iframe)
  }
}
