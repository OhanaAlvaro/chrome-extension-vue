var provider = require('./provider')
//TODO: If no skipTags, we should remove all icons!

var w2w = {
  tagged: {},
  num_links: 0,
  init: function function_name(skip_tags, api, force) {
    if (!w2w.api) w2w.api = api
    w2w.skip_tags = skip_tags
    if (skip_tags.length) {
      document.body.classList.remove('hide-shields')
    } else {
      document.body.classList.add('hide-shields')
    }
    w2w.add_shields(force)
  },

  match: function(regex, haystack) {
    if (!haystack) haystack = url
    var str = haystack.match(regex)
    return str ? str[1] : ''
  },

  add_shields: function(force) {
    let links = provider.getLinks()

    // Avoid going over every single item if we have already done so
    if (!force && w2w.num_links == links.length) {
      return
      /*var shields = document.getElementsByClassName('ohana-shield')
      if (shields.length == links.length) return
      if (shields.length > links.length) return console.error('[w2w] more shilds than links...?')
      console.log('recomputing', shields.length, links.length)*/
    }
    w2w.num_links = links.length
    console.log('Adding ', links.length, ' shields. Force ', force, w2w.skip_tags)

    // Add shields
    var missing_id = []
    for (var i = 0; i < links.length; i++) {
      var id = provider.parseURL(links[i].href).id
      if (!w2w.tagged[id]) {
        missing_id.push(id)
        w2w.tagged[id] = {} // This stops items from being added again as missing
      }
      w2w.add_shield(links[i], w2w.tagged[id])
    }

    if (missing_id.length == 0) return
    w2w.api.request_tagged(missing_id, function(response) {
      if (response.statusCode >= 300) return console.log('[w2w] unable to retrieve data')
      // Update tagged data/cache
      for (var key in response.body) w2w.tagged['' + key] = response.body[key]
      // Add shields to the interface
      w2w.add_shields(true)
    })
  },

  joinStatus: function(tagged, skipTags) {
    if (!tagged) return {status: 'unknown', cuts: 0, level: 0}
    if (!skipTags || !skipTags.length) return {status: 'unset', cuts: 0, level: 0}
    let status = 'done'
    let cuts = 0
    let level = Infinity
    for (var tag of skipTags) {
      // Set default
      let s = tagged[tag] || {}
      // Set num cuts/scenes & min user level
      if (s.cuts) cuts += s.cuts
      level = Math.min(level, s.level || 0)
      // Set watchability status
      if (s.status == 'missing') {
        status = 'missing'
      } else if (s.status != 'done') {
        status = 'unknown'
      }
    }
    return { status: status, cuts: cuts, level: level }
  },

  add_shield: function(elem, tagged) {
    let join = w2w.joinStatus(tagged.status, w2w.skip_tags)

    if (join.status == 'done' && join.cuts) {
      return w2w.update_shield(elem, 'mdi-content-cut', 'done')
    } else if (join.status == 'done') {
      return w2w.update_shield(elem, 'mdi-emoticon-happy', 'done')
    } else if (join.status == 'missing') {
      return w2w.update_shield(elem, 'mdi-flag-variant', 'missing')
    } else {
      w2w.update_shield(elem, 'mdi-progress-question', 'unknown')
    }
  },

  update_shield: function(elem, icon, cls) {
    var img = elem.getElementsByClassName('ohana-shield')[0]
    if (!img) {
      console.log('adding new shield')
      img = document.createElement('img')
      img.classList.add('ohana-shield')
      elem.appendChild(img)
    }
    if (!elem.classList.contains(cls)) {
      elem.classList.remove('done', 'missing', 'unknown')
      elem.classList.add(cls)
      img.src = chrome.runtime.getURL('icons/' + icon + '.png')
    }
  }
}

module.exports.init = w2w.init

/*

var tagged = {
  '80241181': {
    missing: [],
    done: [],
    unknown: []
  }
}
*/
