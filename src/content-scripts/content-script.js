/*
This file implements 4 objects:
  + player: controls and interacts with the video player
  + server: communicates with the server
  + browser: communicates with the browser (popup, background and storage)
  + fc: main family cinema object, it keeps everything running, serving as main data hub for the other objects
*/

/*
 Main family cineam object, implements
  + previewScene
  + updae

*/
var fc = {
  default_settings: {
    username: 'guest',
    password: 'guest',
    blur_level: 40,
    skip_tags: ['All'],
    autosave_after: 2500,
    ignore_default_settings: true,
    pause_after_adding_scene: false
  },

  settings: false,
  scenes: false,
  metadata: false,
  next_share: Infinity,
  marking_started: false,
  preview_skip: false,
  skipping: false,
  frame_seeked: false,

  previewScene: function(id) {
    for (var i = 0; i < fc.scenes.length; i++) {
      if (fc.scenes[i].id == id) {
        fc.preview_skip = fc.scenes[i]
        console.log('Previewing scene: ', fc.preview_skip)
        player.play()
        player.seek(fc.preview_skip.start - 2500)
        return
      }
    }
    console.error('Unable to preview scene: ', id)
  },

  updateScene: function(scene, field) {
    for (var i = 0; i < fc.scenes.length; i++) {
      if (fc.scenes[i].id == scene.id) {
        console.log('[updateScene]: Updating ', scene, field)

        fc.scenes[i] = scene
        fc.onContentEdit(field)

        if (field == 'start') {
          player.seek(scene.start, 'frame')
        } else if (field == 'end') {
          player.seek(scene.end, 'frame')
        }
        return true
      }
    }
    console.error('[updateScene]: Unkown scene ', scene.id)
    return false
  },

  removeScene: function(id) {
    console.log('Removing scene: ', id)
    for (var i = 0; i < fc.scenes.length; i++) {
      if (fc.scenes[i].id == id) {
        fc.scenes.splice(i, 1)
      }
    }
    fc.onContentEdit()
  },

  // Add new scene to the list of scenes
  addScene: function(scene) {
    // Decide if new scenes requires skipping
    var scenes = fc.decideSkip([scene])
    // Add scene
    fc.scenes.push(scenes[0])
    // Trigger content edit
    fc.onContentEdit()
  },

  unload: function() {
    console.log('[unload] Unloading')
    server.setData()
    fc.scenes = null
    fc.metadata = null
    player.video = null
    fc.preview_skip = null
  },

  decideSkip: function(scenes) {
    if (!scenes) return []
    for (var i = 0; i < scenes.length; i++) {
      scenes[i].skip = fc.includesAny(scenes[i].tags, fc.settings.skip_tags)
    }
    return scenes
  },

  loadSettings: function(settings) {
    if (settings && settings.ignore_default_settings) {
      for (key in fc.default_settings) {
        if (typeof fc.default_settings[key] !== typeof settings[key]) {
          settings[key] = fc.default_settings[key]
        }
      }
      fc.settings = settings
    } else {
      console.warn('Setting default settings instead of: ', settings)
      fc.settings = fc.default_settings
    }
    fc.scenes = fc.decideSkip(fc.scenes)
    fc.onContentEdit('settings')
  },

  onContentEdit: function(edit) {
    // Propagate updated data to server and browser
    if (edit != 'server') fc.next_share = Date.now() + fc.settings.autosave_after // Update server
    browser.sendMessage({ msg: 'new-data' }) // Update interface

    // Update badge
    if (edit == 'start' || edit == 'end') return
    var count = 0
    for (var i = 0; i < fc.scenes.length; i++) {
      if (fc.scenes[i].skip) count++
    }
    browser.sendMessage({ msg: 'update-badge', numDisplayedScenes: count })
  },

  periodicCheck: function() {
    // Check we have the right metadata
    if (!fc.metadata || fc.metadata.url != window.location.href) {
      server.getData()
    }

    // Check video player controller is working
    if (!player.video || !player.video.duration) {
      player.load()
    }

    // Save data when needed
    if (Date.now() > fc.next_share) {
      server.setData()
    }

    // Check if the current time needs to be skipped
    fc.check_needs_skip()
  },

  getVideoID: function() {
    // Extract metadata
    var url = window.location.href
    var m = { provider: '', pid: 0, duration: null, url: url, src: '' }

    if (url.indexOf('netflix') != -1) {
      m.provider = 'netflix'
      match = url.match(/watch\/([0-9]+)/)
      m.pid = match ? match[1] : ''
    } else if (url.indexOf('amazon') != -1) {
      m.provider = 'amazon'
    } else if (url.indexOf('youtube') != -1) {
      m.provider = 'youtube'
      const queryString = window.location.search
      const urlParams = new URLSearchParams(queryString)
      m.pid = urlParams.get('v')
    } else if (url.indexOf('disneyplus') != -1) {
      m.provider = 'disneyplus'
      match = url.match(/video\/([0-9abcdef\-]+)/)
      m.pid = match ? match[1] : ''
    } else {
      m.provider = url.match(/www.([^\/]+)/) ? url.match(/www.([^\/]+)/)[1] : null
    }

    if (!m.src && m.pid) m.src = m.provider + '_' + m.pid

    if (player.video && player.video.duration) {
      m.duration = player.video.duration * 1000
    }
    fc.metadata = m
    console.log('[getVideoID]', fc.metadata)
  },

  mark_current_time: function(tags) {
    var start = fc.marking_started
    var time = Math.round(player.getTime())
    if (!start) {
      fc.marking_started = player.video.paused ? time : time - 2000
      player.video.playbackRate = 2
      player.video.style.webkitFilter = 'blur(' + parseInt(fc.settings.blur_level) + 'px)'
      player.mute(true)
      console.log('Scene start marked at ', fc.marking_started)
    } else {
      var end = player.video.paused ? time : time - 2000
      if (!tags) tags = []
      tags.push('pending')
      var scene = {
        tags: tags,
        start: Math.round(start / 50) * 50,
        end: Math.round(end / 50) * 50,
        id: fc.random_id()
      }
      fc.addScene(scene)
      fc.marking_started = false
      player.video.playbackRate = 1
      player.video.style.webkitFilter = 'blur(0px)'
      if (fc.settings.pause_after_adding_scene) player.pause()
      player.mute(false)
      console.log('Scene added ', start, ' -> ', end)
      return { msg: 'marked-scene', scene: scene }
    }
  },

  check_needs_skip: function() {
    var now = player.getTime()
    var next_good = 0

    if (player.video.paused && fc.frame_seeked) return
    fc.frame_seeked = false

    // Our skip_list is the main skip_list, unless we are on preview mode
    if (fc.preview_skip) {
      var skip_list = [fc.preview_skip] // should we replace or add it as a new one?
    } else {
      var skip_list = fc.scenes
    }

    if (!skip_list) return

    // Check if we are on a bad time
    for (var i = 0; i < skip_list.length; i++) {
      if (!fc.preview_skip && !skip_list[i].skip) continue
      var start = skip_list[i].start - 40
      var end = skip_list[i].end - 40
      // Math.max(next_good+500,now) if the scene starts 0.5s after the end of the skip, consider they overlap
      if (Math.max(next_good + 500, now) > start && now < end) {
        //if ( now < end && (now >= start || next_good + 500 > start) ) {
        next_good = Math.max(next_good, end)
      }
    }

    if (next_good == 0 && fc.skipping) {
      console.log('[check_needs_skip] Back to normal')
      fc.preview_skip = null
      player.video.style.visibility = 'visible'
      player.mute(false)
      fc.skipping = false
    } else if (next_good != 0 && !fc.skipping) {
      if (player.video.paused && fc.frame_seeked) return
      console.log('[check_needs_skip] It does!')
      player.video.style.visibility = 'hidden'
      player.mute(true)
      player.seek(next_good)
      fc.skipping = true
    }
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
      data = JSON.parse(json)
      return data
    } catch (e) {
      console.error('Invalid JSON ', json, e)
      return false
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
      console.log('[sendMessage] response: ', response)
    })
  },

  // Starts listening to messages from interface and background script
  addListeners: function() {
    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
      console.log('[listen] Received request: ', request)
      if (request.msg == 'mark-current-time') {
        return sendResponse(fc.mark_current_time(request.tags))
      } else if (request.msg == 'preview') {
        fc.previewScene(request.id)
      } else if (request.msg == 'remove') {
        fc.removeScene(request.id)
      } else if (request.msg == 'update-scene') {
        fc.updateScene(request.scene, request.field)
      } else if (request.msg == 'get-data') {
        return sendResponse({
          msg: 'new-data',
          scenes: fc.scenes,
          settings: fc.settings,
          metadata: fc.metadata
        })
      } else if (request.msg == 'update-settings') {
        fc.loadSettings(request.settings)
        browser.setData('settings', fc.settings)
      } else if (request.msg == 'play-pause') {
        player.togglePlay()
      } else if (request.msg == 'pause') {
        player.pause()
      } else if (request.msg == 'play') {
        player.play()
      } else {
        console.log('Unkown request: ', request)
      }
      sendResponse(true)
    })
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
      callback(fc.parseJSON(data[id]))
    })
  }
}

/*
  Server object, handles communications with the server, all communications are authenticated, implements
  + setData: shares current data with the server
  + getData: downloads servers data for current movie
  + send: send any query to the server
  + buildUrl: helper function

*/
var server = {
  setData: function() {
    if (!fc.scenes || !fc.metadata || !fc.metadata.src) {
      return console.warn('[setData] Unable to upload scenes')
    }
    var data = {
      metadata: {
        pid: fc.metadata.pid,
        src: fc.metadata.src,
        provider: fc.metadata.provider,
        duration: fc.metadata.duration
      },
      scenes: fc.scenes
    }

    server.send({
      action: 'setData',
      id: fc.metadata.src,
      data: JSON.stringify(data)
    })
    fc.next_share = Infinity
  },

  getData: function() {
    console.log('[getData] Loading new scenes!')
    fc.unload()
    fc.getVideoID()
    if (!fc.metadata || !fc.metadata.src) {
      console.warn('[getData] Invalid metadata ', fc.metadata)
      browser.sendMessage({ msg: 'update-badge', numDisplayedScenes: '' })
      return
    }

    server.send({ action: 'getData', id: fc.metadata.src }, function(result) {
      if (result.status == 200 && result.data && result.data.scenes) {
        fc.scenes = fc.decideSkip(result.data.scenes)
      } else if (result.data == 'Unkown id') {
        console.warn('[getData] Creating empty scene array')
        fc.scenes = []
      } else {
        console.error('[getData] Something is wrong with the server...')
        fc.scenes = []
      }
      fc.onContentEdit('server')
    })
  },

  send: function(query, callback) {
    console.log('[send] ', query)
    var url = server.buildURL(query)
    fetch(url)
      .then(r => r.text())
      .then(data => {
        console.log('[send] response: ', data)
        if (callback) callback(fc.parseJSON(data))
      })
  },

  // Helper function to build the url/end point for the given query
  buildURL: function(query) {
    // Add username and password to every request
    query['username'] = fc.settings.username
    query['password'] = fc.settings.password
    // Build url
    var out = []
    for (var key in query) {
      if (query.hasOwnProperty(key)) {
        out.push(key + '=' + encodeURIComponent(query[key]))
      }
    }
    var url = 'https://www.arrietaeguren.es/movies/api?' + out.join('&')
    return url
  }
}

var player = {
  video: false,

  load: function() {
    var video = document.getElementsByTagName('video')
    if (video.length != 1) return console.warn('[check] We have ', video.length, ' videos tags...')
    player.video = video[0]
    fc.metadata.duration = player.video.duration * 1000

    if (fc.metadata.provider == 'netflix') {
      var script = document.createElement('script')
      script.innerHTML = `var videoPlayer = netflix.appContext.state.playerApp.getAPI().videoPlayer
            var playerSessionId = videoPlayer.getAllPlayerSessionIds()[0]
            var netflix_player = videoPlayer.getVideoPlayerBySessionId(playerSessionId)
            console.log(netflix_player)
            document.addEventListener('netflix-video-controller', function(e) {
                var data = e.detail
                console.log('[netflix-video-controller] Received ', data)
                if (data.pause) {
                    netflix_player.pause()
                } else if (data.play) {
                    netflix_player.play()
                }
                if (data.time) {
                    netflix_player.seek(data.time)
                }

            })`
      document.head.appendChild(script)
    }
  },

  mute: function(state) {
    player.video.muted = state
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
    if (!time || time < 0 || time > fc.metadata.duration) {
      console.log('Invalid time ', time, ', video length is ', fc.metadata.duration)
      return
    }

    if (fc.metadata.provider == 'netflix') {
      document.dispatchEvent(
        new CustomEvent('netflix-video-controller', { detail: { time: time } })
      )
    } else {
      player.video.currentTime = time / 1000
    }

    if (mode == 'frame') {
      fc.frame_seeked = true
      player.pause()
    }
  },

  // Get current time in milliseconds (all times are always in milliseconds!)
  getTime: function() {
    return player.video.currentTime * 1000
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

console.log('CONTENT SCRIPT LOADED')
