
let server = {
  setData: function(action, data) {
    if (!fc.metadata || !fc.metadata.id) {
      return console.log('[removeScene] Missing metadata, unable to upload data...')
    }

    if (action == 'updateScene' && data.tags.includes('Local')) {
      return
      //action == 'removeScene'
    }

    server.send(
      {
        action: action,
        id: fc.metadata.id,
        username: fc.settings.username,
        token: fc.settings.authToken,
        password: fc.settings.password,
        data: JSON.stringify(data)
      },
      function(response) {
        if (response.statusCode == 200) {
          browser.sendMessage({ msg: 'snackbar', color: 'success', text: response.body.text })
        } else {
          browser.sendMessage({
            msg: 'snackbar',
            color: 'error',
            text: 'Oops, something went wrong...'
          })
        }
      }
    )
  },

  auth: function(action, request, callback) {
    console.log('[auth] ', action, request)
    server.send(
      {
        action: action,
        username: request.username,
        password: request.password,
        email: request.email,
        newpassword: request.newpassword
      },
      function(response) {
        if (response.statusCode == 200) {
          fc.settings.authToken = response.body.token
          fc.settings.level = response.body.level
          fc.settings.username = request.username
          console.log('[auth] updating settings ', fc.settings)
          fc.loadSettings(fc.settings)
          browser.setData('settings', fc.settings)
        }
        callback(response)
      }
    )
    return true
  },

  getMovie: function() {
    if (!fc.metadata || !fc.metadata.id) {
      console.warn('[getMovie] Invalid metadata ', fc.metadata)
      browser.sendMessage({ msg: 'update-badge', numDisplayedScenes: '' })
      return
    }
    console.log('[getMovie] Getting details for ', fc.metadata.id)

    // Get local data
    browser.getData(fc.metadata.id, function(localData) {
      if (!localData) return console.log('No local data for this movie')
      fc.skip_ids = localData.skip_ids || {}
      fc.scenes = utils.merge(fc.scenes, localData.scenes)
      fc.onContentEdit('server')
    })

    // Get servers data
    var query = {
      action: 'getMovie',
      id: fc.metadata.id,
      season: fc.metadata.season,
      episode: fc.metadata.episode,
      title: fc.metadata.title
    }
    server.send(query, function(result) {
      if (!result || !result.body || !result.body.scenes) {
        console.log(result)
        return console.error('[getMovie] Something is wrong with the server...')
      }
      fc.scenes = utils.merge(result.body.scenes, fc.scenes)
      fc.tagged = Object.assign({}, result.body.tagged)
      Object.assign(fc.metadata, result.body.metadata)
      fc.onContentEdit('server')
    })
  },

  request_tagged(missing, callback) {
    if (missing.length == 0) return
    server.send({ action: 'getTagged', ids: JSON.stringify(missing) }, function(response) {
      callback(response)
    })
  },

  send: function(query, callback) {
    var url = server.buildURL(query)
    fetch(url)
      .then(response => {
        response.json().then(body => {
          let res = { statusCode: response.status, body: body }
          console.warn('[server.send] Url:', url, '. Query: ', query, '. Response: ', res)
          if (callback) callback(res)
        })
      })
      .catch(x => {
        console.log(x)
        if (callback) callback(x)
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
      if (query.hasOwnProperty(key) && query[key] != null) {
        out.push(key + '=' + encodeURIComponent(query[key]))
      }
    }
    var url = 'https://api.ohanamovies.org/dev?' + out.join('&')
    return url
  }
}

