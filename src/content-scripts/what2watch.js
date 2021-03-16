var provider = require('./provider')

var w2w = {
  tagged: {},
  num_links: 0,
  init: function function_name(skip_tags, api, force) {
    if(!w2w.api) w2w.api = api
    w2w.skip_tags = skip_tags
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
    console.log('Adding ', links.length, ' shields. Force ', force)

    // Add shields
    var missing_id = []
    for (var i = 0; i < links.length; i++) {
      var id = provider.getID(links[i].href).src
      if (!w2w.tagged[id]) {
        missing_id.push(id)
        w2w.tagged[id] = { done: [], missing: [] } // This stops item from being added again as missing
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

  add_shield: function(elem, tagged) {
    // If EVERY skip_tag is included in tagged.done
    if (w2w.skip_tags.every(x => tagged.done.includes(x))) {
      return w2w.update_shield(elem, 'done', 'done')
    }

    // If ANY skip_tag is included in tagged.missing
    if (w2w.skip_tags.some(x => tagged.missing.includes(x))) {
      return w2w.update_shield(elem, 'missing', 'missing')
    }

    // Otherwise
    w2w.update_shield(elem, 'unknown', 'unknown')
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
      elem.classList.remove(['done', 'missing', 'unknown'])
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
