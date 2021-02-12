'use strict'

import { getFc } from './fc-main.js';
import { getBrowser } from './browser.js';

var fc = getFc()
var browser = getBrowser()

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

export function getUtils() {
  return utils;
}

/*
  #chat-wrapper {
    width: 288px !important;
    height: 100% !important;
    background: #1a1a1a;
    position: fixed !important;
    top: 0 !important;
    left: auto !important;
    right: 0 !important;
    bottom: 0 !important;
    cursor: auto;
    user-select: text;
    -webkit-user-select: text;
    z-index: 9999999999 !important;
  }
  
  #chat-wrapper #chat-container {
    // width: 228px;
    height: 100%;
    position: relative;
    left: 0;
    right: 0;
    margin: 0 auto;
  }
  
  */
