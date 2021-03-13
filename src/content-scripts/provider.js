var pid = {
  match: function(regex, haystack) {
    var str = haystack.match(regex)
    return str ? str[1] : ''
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

  getID: function(url) {
    url = new URL(url)
    let host = url.hostname
    let path = url.pathname
    let urlParams = new URLSearchParams(url.search)

    let provider = host
    let id = ''
    let title = ''

    if (host.includes('netflix')) {
      provider = 'netflix'
      id = pid.match(/watch\/([0-9]+)/, path)
      title = ''
    } else if (host.includes('youtube')) {
      provider = 'youtube'
      id = urlParams.get('v')
    } else if (host.includes('disneyplus')) {
      provider = 'disneyplus'
      title = pid.match(/movies\/(.+)\//, path)
      if(!title) title = pid.match(/series\/(.+)\//, path)
      id = pid.match(/([0-9a-zA-Z]+)$/, path)
    } else if (host.includes('hbo')) {
      // /series/superman-lois/baab9ad7-cd42-477f-a142-b4165921b7a3
      provider = 'hbo'
      id = pid.match(/\/([0123456789abcdef-]+)$/, path)
      title = pid.match(/series\/(.+)\//,path)
    } else if (host.includes('movistarplus')) {
      provider = 'movistarplus'
      id = urlParams.get('id')
      console.log(provider, id)
    } else if (host.includes('rakuten')) {
      provider = 'rakuten'
      var themoviedb = document.querySelectorAll('a[href^="https://www.themoviedb.org/movie"]')
      if (themoviedb.length == 1) {
        id = pid.match(/\/([0123456789]+)/, themoviedb)
      }
      console.log(provider, id)
    }
    return {
      provider: provider,
      id: '' + id,
      src: provider + '_' + id,
      title: title
    }
  }
}

module.exports.getID = pid.getID
module.exports.getLinks = pid.getLinks
