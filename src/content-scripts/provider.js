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


PrimeVideo
==========
https://app.primevideo.com/detail?gti=amzn1.dv.gti.a6abf5b7-d0f1-8109-2390-94e030d1190b\u0026ie=UTF8\u0026linkCode=xm2\u0026tag=just0a7-21
https://app.primevideo.com/watch?gti=amzn1.dv.gti.a6abf5b7-d0f1-8109-2390-94e030d1190b\u0026ie=UTF8\u0026linkCode=xm2\u0026tag=just0a7-21


Itunes
======
https://itunes.apple.com/es/movie/shooter/id388888352?l=en\u0026uo=4\u0026at=1000l3V2


DisneyPlus
==========

+ Series: https://www.disneyplus.com/en-gb/video/088faf85-12fc-4caf-9913-b66aac296cb6
+ Movie:  https://www.disneyplus.com/en-gb/video/aa2c93d5-6e09-4e2b-84ae-9f0773cc0238 

"standard_web": "https://www.disneyplus.com/movies/star-wars-a-new-hope-episode-iv/12fVeZxD2fWJ",
"deeplink_web": "https://www.disneyplus.com/video/4c907f06-6bd1-4118-b34b-cff43a6948af"

https://www.disneyplus.com/en-gb/movies/steamboat-willie/1Lh1k4ammOG5
https://www.disneyplus.com/en-gb/series/the-avengers-united-they-stand/3ZG0V87P4Xsc

https://www.disneyplus.com/en-gb/series/star-wars-rebels/64MCZgAzY0Zw

https://www.disneyplus.com/en-gb/video/088faf85-12fc-4caf-9913-b66aac296cb6

*/

var provider = {
  match: function(regex, haystack) {
    var str = haystack.match(regex)
    return str ? '' + str[1] : ''
  },

  getURL: function(meta) {
    // In case we were giving the id instead of the metadata
    if (typeof meta == 'string') {
      var p = meta.split('_')
      meta = {
        [p[0]]: p[1],
        provider: p[0],
        id: meta
      }
    }

    for (let provider in meta) {
      if (provider == 'netflix') {
        return 'https://www.netflix.com/title/' + meta.netflix
      } else if (provider == 'hboespana') {
        if (meta.type == 'show') {
          return 'https://es.hboespana.com/search'
        } else {
          return 'https://es.hboespana.com/search'
        }
      } else if (provider == 'disneyplus') {
        return 'https://www.disneyplus.com/en-gb/video/'+meta.disneyplus
      } else if (provider == 'primevideo') {
        return 'https://primevideo.com/detail?gti=' + meta.primevideo
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

  parseURL: function(url) {
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
      // Are we playing a video or on the home view?
      meta.onHomeView = !path.includes('/watch/')
    } else if (host.includes('youtube')) {
      meta.provider = 'youtube'
      meta.pid = urlParams.get('v')
    } else if (host.includes('disneyplus')) {
      meta.provider = 'disneyplus'
      // Are we playing a video or on the home view?
      meta.onHomeView = !path.includes('/video/')
      // Get pid and title
      if (!meta.onHomeView) {
        meta.pid = provider.match(/video\/([^\/]+)/, path)
      } else if (path.includes('/movies/')) {
        meta.type = 'movie'
        meta.title = provider.match(/movies\/([^\/]+)\//, path)
        meta.pid = provider.match(/\/([^\/]+)$/, path)
      } else {
        meta.type = 'show'
        meta.title = provider.match(/series\/([^\/]+)\//, path)
        meta.pid = provider.match(/\/([^\/]+)$/, path)
      }
      // Clean title
      meta.title = provider.cleanTitle(meta.title)
    } else if (host.includes('hboespana')) {
      meta.provider = 'hboespana'
      meta.pid = provider.match(/\/([0123456789abcdef-]+)($|\/play)/, path)
      meta.onHomeView = !path.includes('/play')
      meta.title = provider.match(/series\/([^\/]+)\//, path)
      if (meta.title) {
        meta.season = provider.match(/season-([^\/]+)/, path)
        meta.episode = provider.match(/episode-([^\/]+)/, path)
        meta.type = 'show'
      } else {
        meta.title = provider.match(/movies\/([^\/]+)\//, path)
        meta.type = 'movie'
      }
      meta.title = provider.cleanTitle(meta.title)
    } else if (host.includes('movistarplus')) {
      meta.provider = 'movistarplus'
      meta.pid = urlParams.get('id')
    } else if (host.includes('rakuten')) {
      meta.provider = 'rakuten'
    } else if (host.includes('primevideo')) {
      meta.provider = 'primevideo'
      meta.pid = urlParams.get('gti')
    } else if (host.includes('filmin')) {
      meta.provider = 'filmin'
    } else if (host.includes('itunes')) {
      meta.provider = 'itunes'
      meta.pid = path
    } else if (host.includes('play.google')) {
      meta.provider = 'googleplay'
    } else if (host.includes('microsoft')) {
      meta.provider = 'microsoft'
      meta.pid = path // avoid the repetitive ctx=movie
    }
    if (!meta.id && meta.pid) meta.id = meta.provider + '_' + meta.pid
    //console.error(meta)
    return meta
  },

  cleanTitle: function(title) {
    if (typeof title !== 'string') return ''
    // Replace dividers
    title = title
      .replace(/-/g, ' ')
      .replace(/_/g, ' ')
      .replace(/  /g, ' ')
    // Capitalize
    return title.charAt(0).toUpperCase() + title.slice(1)
  },

  // Here we are on the browser
  getID: async function() {
    let url = window.location.href
    let meta = provider.parseURL(url)

    // If we are on netflix, and we have a movie opened (we have pid)
    if (meta.provider == 'netflix' && meta.pid) {
      // Return empty meta if title isn't loaded yet
      var elem = document.getElementsByClassName('video-title')[0]
      if (!elem) {
        console.error('missing title...')
        meta.id = false
        meta.url = false
        return meta
      }
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
    if (meta.onHomeView) {
      meta.id = false
      meta.pid = false
    }
    return meta
  }
}

module.exports.getID = provider.getID
module.exports.parseURL = provider.parseURL
module.exports.getLinks = provider.getLinks
module.exports.getURL = provider.getURL
