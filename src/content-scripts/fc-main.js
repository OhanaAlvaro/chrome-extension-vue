/*
 Main family cinema object, implements
  + previewScene
  + update

*/
'use strict'

import { getPlayer } from './player.js'
import { getUtils } from './utils.js'
import { getServer } from './server.js'
import { getBrowser } from './browser.js'

var player = getPlayer()
var utils = getUtils()
var server = getServer()
var browser = getBrowser()

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
    blur_level_on_frame_seek: false // if false, it uses settings.blur_level
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

  previewScene: function(id) {
    var i = utils.idToIndex(id)
    console.log('Previewing scene: ', fc.scenes[i])
    fc.preview_skip = fc.scenes[i]
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
      if (player.video.paused) return
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

// Trying to export fc for other instances idk if it is going to work :D
export function getFc() {
  return fc
}
