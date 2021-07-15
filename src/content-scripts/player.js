let player = {
  video: false,
  controller: 'html5', // html5 | netflix | cast
  script: false,

  isLoaded: function() {
    let loaded = false
    if (player.controller == 'cast') {
      loaded = player.isCasting()
    } else {
      loaded = !!(player.video && player.video.duration)
    }
    return loaded
  },

  isCasting() {
    /* Actions performed on the casting controller set the dataset.isCasting to true if they work, and to false if they fail to execute
    Alternative approach would be to check cast.framework.CastContext.getInstance().getSessionState() | getCastState()
    To check for the current session|cast state https://developers.google.com/cast/docs/reference/web_sender/cast.framework#.SessionState | CastState 
    */
    try {
      // dataset stores values as strings, so true becomes 'true'
      return player.script.dataset.isCasting == 'true'
    } catch (e) {
      console.log(e)
      return false
    }
  },

  load: function() {
    console.warn('loading player!!')
    player.inject_video_controller()
    // Perform some random action to check if the cast controller is active
    player.dispatch('cast-video-controller', { getTime: true })

    // Check if we are casting
    if (player.isCasting()) {
      player.controller = 'cast'
      console.warn('Using casting video controller')
      return true
    }

    // Otherwise, load the local video
    var video = document.getElementsByTagName('video')
    if (video.length != 1) return false
    player.video = video[0]

    // And choose between netflix or html5 controller
    let host = window.location.hostname
    if (host.includes('netflix')) {
      player.controller = 'netflix'
      console.warn('Using netflix video controller')
    } else {
      player.controller = 'html5'
      console.warn('Using html5 video controller')
    }

    console.log(player.controller)

    return true
  },

  inject_video_controller: function() {
    if (document.getElementById('fc-video-controller')) return false
    console.log('injecting video controller script')
    player.script = document.createElement('script')
    player.script.id = 'fc-video-controller'
    player.script.innerHTML = `var script = document.getElementById('fc-video-controller')

    /* Netflix video controller */
    document.addEventListener('netflix-video-controller', function(e) {
      var data = e.detail
      var videoPlayer = netflix.appContext.state.playerApp.getAPI().videoPlayer
      var allSessions = videoPlayer.getAllPlayerSessionIds()
      for (var i = allSessions.length - 1; i >= 0; i--) {
        var netflix_player = videoPlayer.getVideoPlayerBySessionId(allSessions[i])
        console.log('[netflix-video-controller] Received: ', data, netflix_player)
        if (data.pause) {
          netflix_player.pause()
        } else if (data.play) {
          netflix_player.play()
        }
        if (data.seek) {
          netflix_player.seek(data.seek)
        }
      }
    })
    /* Chrome cast video controller */
    document.addEventListener('cast-video-controller', function(e) {
      try {
        var data = e.detail
        var currentMediaSession = cast.framework.CastContext.getInstance()
          .getCurrentSession()
          .getMediaSession()
        //console.log('[cast-video-controller] Received: ', data, currentMediaSession)
        if (data.play) {
          currentMediaSession.play()
        } else if (data.pause) {
          currentMediaSession.pause()
        } else if (data.togglePlay) {
          if (currentMediaSession.playerState == 'PAUSED') {
            currentMediaSession.play()
          } else {
            currentMediaSession.pause()
          }
        } else if (data.mute) {
          /*var player = new cast.framework.RemotePlayer();
          var playerController = new cast.framework.RemotePlayerController(player);
          playerController.muteOrUnmute()*/
        } else if (data.seek) {
          var request = new chrome.cast.media.SeekRequest()
          request.currentTime = data.seek / 1000
          currentMediaSession.seek(request)
        } else if (data.getTime) {
          script.dataset.time = currentMediaSession.getEstimatedTime() * 1000
        } else if (data.getMetadata) {
          try {
            let media = cast.framework.CastContext.getInstance().getCurrentSession().c.media[0].media
            script.dataset.metadata = JSON.stringify({
              pid: media.contentId,
              title: media.metadata.title,
              season: media.metadata.season,
              episode: media.metadata.episode
            })
          } catch (e) {
            console.log('Unable to get metadata', e)
          }
        }
        script.dataset.isCasting = true
      } catch (e) {
        script.dataset.isCasting = false
        //console.error('[cast-video-controller] ', e)
      }
    })
    `
    document.head.appendChild(player.script)
    return true
  },

  dispatch: function(name, detail) {
    document.dispatchEvent(new CustomEvent(name, { detail: detail }))
  },

  hidden: function(state) {
    if (player.controller == 'cast') {
      return console.log('Unable to set visibility while casting')
    } else if (player.video) {
      player.video.style.visibility = state ? 'hidden' : 'visible'
      return player.video.style.visibility
    }
  },

  rate: function(rate) {
    if (player.controller == 'cast') {
      player.dispatch('cast-video-controller', { playbackRate: rate })
    } else if (player.video) {
      player.video.playbackRate = rate ? rate : 1
      return player.video.playbackRate
    }
  },

  duration: function() {
    if (player.controller == 'cast') {
      //console.error('Unable to get duration while casting')
      return Infinity
    } else if (player.video) {
      return player.video.duration * 1000
    }
  },

  volume: function(vol) {
    if (player.controller == 'cast') {
      console.log('Unable to change volume while casting (so far at least)')
    } else if (player.video) {
      let old = player.video.volume
      player.video.volume = vol
      return old
    }
  },

  mute: function(state) {
    if (player.controller == 'cast') {
      player.dispatch('cast-video-controller', { mute: true, state: state })
    } else if (player.video) {
      player.video.muted = state
    }
  },

  blur: function(blur_level) {
    if (player.controller == 'cast') {
      return console.log('Unable to blur while casting')
    } else if (player.video) {
      let blur = parseInt(blur_level) || 0
      player.video.style.webkitFilter = 'blur(' + blur + 'px)'
    }
  },

  pause: function() {
    if (player.controller == 'cast') {
      player.dispatch('cast-video-controller', { pause: true })
    } else if (player.controller == 'netflix') {
      player.dispatch('netflix-video-controller', { pause: true })
    } else if (player.video) {
      player.video.pause()
    }
  },

  play: function() {
    if (player.controller == 'cast') {
      player.dispatch('cast-video-controller', { play: true })
    } else if (player.controller == 'netflix') {
      player.dispatch('netflix-video-controller', { play: true })
    } else {
      player.video.play()
    }
  },

  togglePlay: function() {
    if (player.controller == 'cast') {
      player.dispatch('cast-video-controller', { togglePlay: true })
    } else {
      if (player.video.paused) {
        player.play()
      } else {
        player.pause()
      }
    }
  },

  seek: function(time, mode) {
    console.log('[seek_time] seeking time ', time)

    // Check objective time is within range
    if (!time || time < 0 || time > player.duration()) {
      console.log('Invalid time ', time, ', video length is ', player.duration())
      return
    }

    // Seek requested time
    if (player.controller == 'cast') {
      player.dispatch('cast-video-controller', { seek: time })
    } else if (player.controller == 'netflix') {
      player.dispatch('netflix-video-controller', { seek: time })
    } else {
      player.video.currentTime = time / 1000
    }
  },

  getCastingMetadata: function() {
    if (player.controller != 'cast')
      return console.warn('[getCastingMetadata] We are not casting...')
    player.dispatch('cast-video-controller', { getMetadata: true })
    let metadata = JSON.parse(player.script.dataset.metadata)
    console.log('[getCastingMetadata]', metadata)
    return metadata
  },

  // Get current time in milliseconds (all times are always in milliseconds!)
  getTime: function() {
    if (player.controller == 'cast') {
      player.dispatch('cast-video-controller', { getTime: true })
      // this time is probably outdated but as we do this every 100ms, it should be too bad
      return parseFloat(player.script.dataset.time) || 0
    } else {
      return player.video.currentTime * 1000
    }
  }
}

module.exports = player
