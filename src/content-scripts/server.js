/*
  Server object, handles communications with the server, all communications are authenticated, implements
  + setMovie: shares current data with the server
  + getMovie: downloads servers data for current movie
  + send: send any query to the server
  + buildUrl: helper function

*/

'use strict'

import { getFc } from './fc-main.js'
import { getUtils } from './utils.js'
import { getBrowser } from './browser.js'

var fc = getFc()
var utils = getUtils()
var browser = getBrowser()

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
      fc.tagged = result.data.tagged
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

export function getServer() {
  return server
}
