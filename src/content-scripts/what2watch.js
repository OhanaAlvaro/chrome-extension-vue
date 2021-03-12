var w2w = {
  init: function function_name(skip_tags, api) {
    w2w.api = api
    w2w.skip_tags = skip_tags
    w2w.tagged = {}
    w2w.add_shields()
  },

  match: function(regex, haystack) {
    if (!haystack) haystack = url
    var str = haystack.match(regex)
    return str ? str[1] : ''
  },

  add_shields: function(tagged) {
    var host = window.location.hostname
    if (host.includes('netflix')) {
      var links = document.querySelectorAll('[href^="/watch/"]')
    } else if (host.includes('disney') || host.includes('hbo') ) {
      var movies = document.querySelectorAll('[href*="/movies/"]')
      var series = document.querySelectorAll('[href*="/series/"]')
      var links = [...series, ...movies]
    } else {
      return
    }


    // Avoid going over every single item if we have already done so
    var shields = document.getElementsByClassName('ohana-shield')
    if (shields.length == links.length) return
    console.log('recomputing',shields.length,links.length)
    //w2w.num_items = links.length

    //https://www.netflix.com/watch/80241181?tctx=1%2C0%2C%2C%2C%2C
    var missing_id = []
    for (var i = 0; i < links.length; i++) {
      if (links[i].getElementsByClassName('ohana-shield').length) continue
      var id = w2w.match(/watch\/([0-9]+)/, links[i].href)

      if (!w2w.tagged[id]) {
        missing_id.push(id)
      }
      w2w.add_shield(links[i], {})// w2w.tagged[id])
    }

    w2w.api.request_tagged(missing_id, function(tagged) {
      // Update tagged data/cache
      for (var key in tagged) w2w.tagged[key] = tagged[key]
      // Add shields to the interface
      w2w.add_shields()
    })
  },

  add_shield: function(elem, tagged) {
    var img = document.createElement('img')
    if (!tagged) {
      img.src = 'https://familycinema.netlify.app/fc/unknown.png'
      elem.classList.add('unknown')
    } else if (w2w.needs_skip(tagged.missing)) {
      img.src = 'https://familycinema.netlify.app/fc/missing.png'
      elem.classList.add('missing')
    } else if (w2w.needs_skip(tagged.unknown)) {
      img.src = 'https://familycinema.netlify.app/fc/unknown.png'
      elem.classList.add('unknown')
    } else {
      img.src = 'https://familycinema.netlify.app/fc/protected.png'
      elem.classList.add('done')
    }
    img.classList.add('ohana-shield')
    elem.appendChild(img)
  },

  needs_skip: function(a) {
    return Math.random() < 0.5
    var b = w2w.skip_tags
    return a.filter(x => b.includes(x)).length
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
