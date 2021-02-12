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

'use strict'

import { getFc } from './fc-main.js'
import { getPlayer } from './player.js'
import { getUtils } from './utils.js'
import { getServer } from './server.js'

var fc = getFc()
var player = getPlayer()
var utils = getUtils()
var server = getServer()

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
        } else if (request.msg == 'show-sidebar') {
          show_sidebar()
        } else if (request.msg == 'preview') {
          fc.previewScene(request.id)
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
            tagged: fc.tagged,
            shield: fc.shield,
            metadata: fc.metadata
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
          if (!fc.marking_started) fc.frame_seeked = true
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

export function getBrowser() {
  return browser
}
