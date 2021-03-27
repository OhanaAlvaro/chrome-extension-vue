

/* Some useful info

HBO
===
Add '/play' for autoplay
+ Movie: https://es.hboespana.com/movies/aquaman/3b1f95c-013120ef33e/play
+ Series: https://es.hboespana.com/series/raised-by-wolves/607e39f2-6d7c-4d1a-85d2-278ad1e270a1
+ Episode: https://es.hboespana.com/series/raised-by-wolves/season-1/episode-1/3b1f95c-0139eef6c8a/play


Netflix
=======
+ Autowatch: https://www.netflix.com/watch/70158331
+ View title (redirects to series if episode) https://www.netflix.com/title/70158331
+ Browse by genre: https://www.netflix.com/browse/genre/34399
+ Search: https://www.netflix.com/search?q=rambo


*/


var provider = {
  match: function(regex, haystack) {
    var str = haystack.match(regex)
    return str ? ''+str[1] : ''
  },

  buildLink: function (meta) {
    for (let provider in meta){
      if (provider == 'netflix' ) {
        return 'https://www.netflix.com/title/'+meta.netflix
      } else if (provider == 'hboespana' ) {
        if (meta.type == 'show') {
          return 'https://es.hboespana.com'
        } else {
          return 'https://es.hboespana.com'
        }
      } else if (provider == 'disneyplus' ) {
        return 'https://www.disneyplus.com/'
      }
    }
    // body...
  },

  getLinks: function() {
    let host = window.location.hostname
    let links = []
    if (host.includes('netflix')) {
      links = document.querySelectorAll('[href^="/watch/"]')
    } else if (host.includes('disney') || host.includes('hbo')) {
      var movies = document.querySelectorAll('[href*="/movies/"]')
      var series = document.querySelectorAll('[href*="/series/"]')
      links = [...series, ...movies]
    }
    return links
  },

  parseURL: function (url) {
    let url_elems = new URL(url)
    let host = url_elems.hostname
    let path = url_elems.pathname
    let search = url_elems.search
    let urlParams = new URLSearchParams(search)

    let meta = { 
      url: url,
      provider: host,
      pid: path + search
    }

    if (host.includes('netflix')) {
      meta.provider = 'netflix'
      meta.pid = provider.match(/watch\/([0-9]+)/, path)
      if (!meta.pid) meta.pid = provider.match(/title\/([0-9]+)/, path)
    } else if (host.includes('youtube')) {
      meta.provider = 'youtube'
      meta.pid = urlParams.get('v')
    } else if (host.includes('disneyplus')) {
      meta.provider = 'disneyplus'
      meta.title = provider.match(/movies\/(.+)\//, path)
      if(!meta.title) meta.title = provider.match(/series\/(.+)\//, path)
      meta.pid = provider.match(/([0-9a-zA-Z]+)$/, path)
    } else if (host.includes('hboespana')) {
      meta.provider = 'hboespana'
      meta.pid = provider.match(/\/([0123456789abcdef-]+)$/, path)
      meta.title = provider.match(/series\/(.+)\//,path)
    } else if (host.includes('movistarplus')) {
      meta.provider = 'movistarplus'
      meta.pid = urlParams.get('id')
      console.log(meta.provider, meta.pid)
    } else if (host.includes('rakuten')) {
      meta.provider = 'rakuten'
    } else if (host.includes('primevideo')) {
      meta.provider = 'primevideo'
      meta.pid = urlParams.get('gti')
    } else if (host.includes('filmin')) {
      meta.provider = 'filmin'
    } else if (host.includes('itunes')) {
      meta.provider = 'itunes'
    } else if (host.includes('play.google')) {
      meta.provider = 'googleplay'
    } else if (host.includes('microsoft')) {
      meta.provider = 'microsoft'
      meta.pid = path // avoid the repetitive ctx=movie
    }
    if (!meta.id && meta.pid) meta.id = meta.provider + '_' + meta.pid
    //console.log(url,meta)
    return meta
  },

  // Here we are on the browser
  getID: async function() {
    let url = window.location.href
    let meta = provider.parseURL(url)
    
    // If we are on netflix, and we have a movie opened (we have pid)
    if (meta.provider == 'netflix' && meta.pid) {

      // Return empty meta if title isn't loaded yet
      var elem = document.getElementsByClassName('video-title')[0]
      if (!elem) return {}
      // Extract title, episode...
      meta.title = elem.getElementsByTagName('h4')[0].textContent
      var span = elem.getElementsByTagName('span')
      if (span.length) {
        meta.type = 'show'
        var p = span[0].textContent.split(':')
        meta.season = p[0].substring(1)
        meta.episode = p[1].substring(1)
        meta.episodeTitle = span[1].textContent
      } else {
        meta.type = 'movie'
      }
    } else if (meta.provider == 'rakuten') {
      var themoviedb = document.querySelectorAll('a[href^="https://www.themoviedb.org/movie"]')
      if (themoviedb.length == 1) {
        meta.pid = provider.match(/\/([0123456789]+)/, themoviedb)
      }
      //console.log(meta.provider, meta.pid)
    }
    //console.log(url,meta)
    return meta
  }
}

module.exports.getID = provider.getID
module.exports.parseURL = provider.parseURL
module.exports.getLinks = provider.getLinks
