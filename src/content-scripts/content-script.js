/*
Main Ohana file containing the injected js code
  + player: controls and interacts with the video player
  + server: communicates with the server
  + browser: communicates with the browser (popup, background and storage)
  + subtitles:

  + fc: main Ohana object, it keeps everything running, serving as main data hub for the other objects
*/

let what2watch = require('./what2watch')
let provider = require('./provider')
let player = require('./player')
let subtitles = require('./subtitles')
let thumbnail = require('./thumbnail')

/*
 
 Main Ohana object
  
*/
;('use strict')

var fc = {
  default_settings: {
    username: '',
    skip_tags: [],
    ignore_default_settings: true,
    pause_after_adding_scene: false,
    playbackRate_on_mark: 1.5,
    mute_on_mark: true,
    blur_on_mark: 12,
    mute_on_edit: true,
    blur_on_edit: 8,
    level: 0,
    authToken: ''
  },

  settings: false,
  scenes: false,
  metadata: false,
  marking_started: false,
  preview_skip: false,
  skipping: false,
  frame_seeked: false,
  editing: false,
  skip_ids: {},
  tagged: {},

  previewScene: function(scene) {
    console.log('Previewing scene: ', scene)
    fc.preview_skip = scene
    player.seek(fc.preview_skip.start - 4000)
    player.play()
    setTimeout(function() {
      fc.view_mode()
      fc.preview_skip = scene
    }, 500)
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

  mark_current_time: function(tags) {
    if (!tags) tags = []
    var start = fc.marking_started
    var time = Math.round(player.getTime() / 50) * 50
    if (!start) {
      fc.marking_started = player.video.paused ? time : time - 1500
      player.rate(fc.settings.playbackRate_on_mark)
      fc.view_mode('mark')
      player.play()
      console.log('Scene start marked at ', fc.marking_started)
    } else {
      var end = player.video.paused ? time : time
      var scene = { tags: tags, start: start, end: end, id: utils.random_id() }
      fc.addScene(scene)
      fc.marking_started = false
      fc.view_mode(false)
      player.rate(1)
      if (fc.settings.pause_after_adding_scene) player.pause()
      console.log('Scene added ', start, ' -> ', end)
      return { msg: 'marked-scene', scene: scene }
    }
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

    if (!fc.metadata.id) override = 'inactive'
    if (shield == 'done' && count == 0) override = 'clean'
    if (skip_tags.length == 0) override = 'inactive' //Alex: workaournd for now, to avoid pretending it's EVERYHTING is safe (no skip_tags) | check background.js
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

  loadSettings: function(settings, silent) {
    if (settings && settings.ignore_default_settings) {
      // Force default values if any key has a different data type
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
    if (!silent) fc.onContentEdit('settings')
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
      // Refresh w2w icons when settings are updated
      what2watch.load(fc.settings.skip_tags, server, true)
      //If the user changed his settings, he may have changed the profanity censorship
      subtitles.load(fc.settings.skip_tags, fc.metadata.provider)
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

    // Check if we are on the main view
    if (!fc.metadata.id) {
      what2watch.load(fc.settings.skip_tags, server)
    }

    // Check video player controller is working
    if (!player.isLoaded()) {
      if (!player.load()) return false

      console.error('player loaded')

      // The first time the player is loaded, load HBO specific stuff (in we are on HBO)
      if (fc.metadata.provider == 'hboespana') fc.loadHBO()
      if (fc.metadata.provider == 'primevideo'){
        provider.getID().then(metadata => {
          fc.metadata = metadata
          if (!metadata.id) return
          fc.metadata.duration = player.duration()
          server.getMovie()
          console.log('[getVideoID]', fc.metadata)
        })
      }

      // Load subtitles
      subtitles.load(fc.settings.skip_tags, fc.metadata.provider)
    }

    // Check if the current time needs to be skipped
    fc.check_needs_skip()
  },

  loadHBO: function() {
    if (player.isCasting()) {
      // On HBO, when player is casting, the url is reseted to home
      // So we need to get the video metadata from the player
      let metadata = player.getCastingMetadata()
      metadata.provider = 'hboespana'
      metadata.id = metadata.provider + '_' + metadata.pid
      metadata.duration = player.duration()
      console.log('Loaded metadata: ', metadata, metadata.pid)
      fc.metadata = Object.assign({}, metadata)
      server.getMovie()
    } else {
      // When we aren't casting, we hide the thumbnails
      thumbnail.load(fc)
    }
  },

  loadNewMedia: function() {
    fc.unload()
    fc.metadata.url = window.location.href
    // Extract metadata
    provider.getID().then(metadata => {
      fc.metadata = metadata
      if (!metadata.id) return
      fc.metadata.duration = player.duration()
      server.getMovie()
      console.log('[getVideoID]', fc.metadata)
    })
  },

  /* Sets the viewing mode mark|edit|seek|normal, this sets
      the mute/blur/... levels */
  view_mode: function(mode) {
    if (mode == 'mark') {
      player.blur(fc.settings.blur_on_mark)
      if (fc.settings.mute_on_mark) player.mute(true)
      fc.editing = true
    } else if (mode == 'edit') {
      player.blur(fc.settings.blur_on_edit)
      if (fc.settings.mute_on_edit) player.mute(true)
      fc.editing = true
    } else if (mode == 'seek') {
      if (fc.preview_skip) return
      fc.view_mode('edit')
    } else {
      fc.preview_skip = null
      player.blur(0)
      player.hidden(false)
      player.mute(false)
      fc.editing = false
      fc.skipping = false
      fc.show_plot(false)
    }
  },

  /* For a given scene, work out what the desired skip action is */
  skip_action: function(scene) {
    try {
      let tags = scene.tags || []
      if (fc.preview_skip && scene.actionTag) {
        tags = [scene.actionTag]
      }
      if (!tags) return 'skip'
      if (tags.includes('Mute')) return 'mute'
      if (player.isCasting()) return 'skip' // When casting, we default to skip instead of black/text
      if (tags.includes('Black screen')) return 'black'
      if (tags.includes('Just text')) return 'text'
    } catch (e) {
      console.error('[skip_action] Error: ', e, scene)
    }
    return 'skip'
  },

  /* Show  */
  show_plot: function(plot) {
    try {
      let div = document.getElementById('fc-plot')
      if (!plot) {
        if (div) div.style.display = 'none'
        return
      }

      console.log('[show_plot] ', plot)
      if (!div) {
        div = document.createElement('div')
        div.id = 'fc-plot'
        player.video.parentNode.appendChild(div)
      }

      div.textContent = plot
      div.style.display = 'block'
    } catch (e) {
      console.log(e)
    }
  },

  best_action: function(skip_list, time) {
    var safety_margin = fc.preview_skip !== null ? 0 : 160
    var next_edge = Infinity
    var action = ''
    var plot = ''

    // Check if we are on a bad time
    for (var i = 0; i < skip_list.length; i++) {
      if (!fc.preview_skip && !skip_list[i].skip) continue
      var start = skip_list[i].start - safety_margin
      var end = skip_list[i].end + safety_margin

      // Action for the current time
      if (start < time && time < end) {
        let new_action = fc.skip_action(skip_list[i])
        plot = skip_list[i].plot_description || plot || ''
        //console.log('[best_action] ', plot, ', ', action, ', ', new_action, ', ', time, ', ', start, ', ', safety_margin)
        if (action && action != new_action) {
          //console.log('[best_action] plot= ', plot, ', action= ', action, ', edge= ', next_edge)
          action = plot ? 'text' : 'skip'
        } else {
          action = new_action
        }
        next_edge = Math.min(next_edge, end)
      }
    }
    return { edge: next_edge, action: action, plot: plot }
  },

  overlaps: function(skip_list, time, edge) {
    var safety_margin = fc.preview_skip !== null ? 0 : 160
    for (var i = skip_list.length - 1; i >= 0; i--) {
      if (!fc.preview_skip && !skip_list[i].skip) continue
      let start = skip_list[i].start - safety_margin
      if (time + 500 < start && start < edge - 500) {
        //console.log('[overlaps] ',', start: ', start,', time: ', time,', edge: ', edge )
        edge = Math.min(edge, start)
      }
    }
    return edge
  },

  check_needs_skip: function() {
    if (fc.editing) return
    var now = player.getTime()
    if (!now) return

    // Our skip_list is the main skip_list, unless we are on preview mode
    var skip_list = fc.scenes
    if (fc.preview_skip) {
      skip_list = [fc.preview_skip] // should we replace or add it as a new one?
    }
    if (!skip_list) return

    // Find best action
    let ba = fc.best_action(skip_list, now)

    // Check if it overlaps with another scene
    if (fc.preview_skip) {
      if (ba.action) ba.edge = fc.overlaps(skip_list, now, ba.edge)
    }

    // Go back to normal or skip content when needed
    if (ba.edge === Infinity) {
      if (!fc.skipping) return
      console.log('[check_needs_skip] Back to normal @ ', now, ', ba: ', ba)
      player.hidden(false)
      player.mute(false)
      fc.skipping = false
      fc.preview_skip = false
      fc.show_plot(false)
    } else {
      let key = ba.action + '_' + ba.plot + '_' + ba.edge
      if (fc.skipping == key) return
      console.log('[check_needs_skip] Skipping/muting/... content! @ ', now, ', ba: ', ba)
      if (ba.action == 'mute') {
        player.hidden(false)
        player.mute(true)
        fc.show_plot(ba.plot)
      } else if (ba.action == 'black') {
        player.hidden(true)
        player.mute(false)
        fc.show_plot(ba.plot)
      } else if (ba.action == 'text' && ba.plot) {
        player.hidden(true)
        player.mute(true)
        fc.show_plot(ba.plot)
        let words = ba.plot.split(' ').length
        let reading_time = Math.max(2000, (words / 400) * 60 * 1000)
        console.log('reading_time ', words, reading_time)
        if (ba.edge - reading_time > now) player.seek(ba.edge - reading_time)
      } else {
        player.hidden(true)
        player.mute(true)
        player.seek(ba.edge - 50) // TODO. test
      }
      fc.skipping = key
    }
  }
}

/*
  Browser object, interacts with the browser (popup, background, storage). Implements:
    - sendMessage
    - addListeners: add listeners for the following events
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
      if (request && request.msg != 'get-time') console.log('[listen] Received request: ', request)
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
          fc.loadSettings(request.settings, request.silent)
          browser.setData('settings', fc.settings)
        } else if (request.msg == 'enforce-safety') {
          if (fc.settings.blur_on_edit < 8) fc.settings.blur_on_edit = 8
          if (fc.settings.blur_on_mark < 12) fc.settings.blur_on_mark = 12
          fc.settings.mute_on_edit = true
          fc.settings.mute_on_mark = true
          fc.loadSettings(fc.settings)
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
        } else if (request.msg == 'view-mode') {
          fc.view_mode(request.mode)
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
          fc.settings.authToken = ''
          console.log('[logout]', fc.settings)
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
    if (!fc.metadata.id) count = ''
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

    server.send(
      {
        action: action,
        id: fc.metadata.id,
        username: fc.settings.username,
        token: fc.settings.authToken,
        password: fc.settings.password,
        data: JSON.stringify(data)
      },
      function(response) {
        if (response.statusCode == 200) {
          browser.sendMessage({ msg: 'snackbar', color: 'success', text: response.body.text })
        } else {
          browser.sendMessage({
            msg: 'snackbar',
            color: 'error',
            text: 'Oops, something went wrong...'
          })
        }
      }
    )
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
          fc.settings.authToken = response.body.token
          fc.settings.level = response.body.level
          fc.settings.username = request.username
          console.log('[auth] updating settings ', fc.settings)
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
    fetch(url)
      .then(response => {
        response.json().then(body => {
          let res = { statusCode: response.status, body: body }
          console.warn('[server.send] Url:', url, '. Query: ', query, '. Response: ', res)
          if (callback) callback(res)
        })
      })
      .catch(x => {
        console.log(x)
        if (callback) callback(x)
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

var utils = {
  merge: function(official, local) {
    console.log('[merge] merging: ', official, local)
    if (!official) return local
    official = utils.toNewFields(official)
    if (!local) return official

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

  toNewFields: function(scenes) {
    function intersect(a, b) {
      return a.filter(x => b.includes(x))
    }

    for (var i = 0; i < scenes.length; i++) {
      if (!scenes[i].tags) continue
      if (intersect(['Skip', 'Mute', 'Black screen', 'Just text'], scenes[i].tags).length) {
        continue
      } else if (
        intersect(['Mild plot', 'Strong plot', 'Audio only'], scenes[i].tags).length >= 2
      ) {
        scenes[i].tags.push('Mute')
      } else if (
        intersect(['Mild plot', 'Strong plot', 'Video only'], scenes[i].tags).length >= 2
      ) {
        scenes[i].tags.push('Black screen')
      } else if (
        intersect(['Mild plot', 'Strong plot', 'Video and audio'], scenes[i].tags).length >= 2
      ) {
        scenes[i].tags.push('Just text')
      }
    }
    console.log('toNewFields ', scenes)
    return scenes
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
  if (!settings.authToken) settings.username = '' // TODO remove this after a while
  fc.loadSettings(settings)
})

function show_sidebar(show) {
  console.log('[show-sidebar] ', show)
  // Remove fc-active class (this will hide the sidebar)
  if (!show) return document.body.classList.remove('fc-active')

  // Do not show sidebar if there is no movie
  /*  if (!fc.metadata.id)
    return console.error('[show_sidebar] No point to show sidebar when there is no movie')*/

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
