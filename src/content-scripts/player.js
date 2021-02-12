'use strict'

import { getFc } from './fc-main.js'

var fc = getFc()

var player = {
  video: false,

  load: function() {
    var video = document.getElementsByTagName('video')
    if (video.length != 1) {
      //console.warn('[load] We have ', video.length, ' videos tags...')
      return false
    }
    player.video = video[0]
    fc.metadata.duration = player.video.duration * 1000

    if (fc.metadata.provider == 'netflix') {
      if (!document.getElementById('fc-netflix-video-controller')) {
        var script = document.createElement('script')
        script.id = 'fc-netflix-video-controller'
        script.innerHTML = `
            document.addEventListener('netflix-video-controller', function (e) {
              var data = e.detail;
              var videoPlayer = netflix.appContext.state.playerApp.getAPI().videoPlayer;
              var allSessions = videoPlayer.getAllPlayerSessionIds();
              for (var i = allSessions.length - 1; i >= 0; i--) {
                var netflix_player = videoPlayer.getVideoPlayerBySessionId(allSessions[i]);
                console.log('[netflix-video-controller] Received: ', data, netflix_player);
                if (data.pause) {
                  netflix_player.pause();
                } else if (data.play) {
                  netflix_player.play();
                }
                if (data.time) {
                  netflix_player.seek(data.time);
                }
              }
            });`
        document.head.appendChild(script)
      }
    }
    return true
  },

  mute: function(state) {
    player.video.muted = state
  },

  blur: function(blur_level) {
    if (!blur_level) blur_level = 0
    player.video.style.webkitFilter = 'blur(' + parseInt(blur_level) + 'px)'
  },

  pause: function() {
    if (fc.metadata.provider == 'netflix') {
      document.dispatchEvent(
        new CustomEvent('netflix-video-controller', { detail: { pause: true } })
      )
    } else {
      player.video.pause()
    }
  },

  play: function() {
    console.log('play')
    if (fc.metadata.provider == 'netflix') {
      document.dispatchEvent(
        new CustomEvent('netflix-video-controller', { detail: { play: true } })
      )
    } else {
      player.video.play()
    }
  },

  togglePlay: function() {
    if (player.video.paused) {
      player.play()
    } else {
      player.pause()
    }
  },

  seek: function(time, mode) {
    console.log('[seek_time] seeking time ', time)
    // Check objective time is within range
    if (!time || time < 0 || time > fc.metadata.duration) {
      console.log('Invalid time ', time, ', video length is ', fc.metadata.duration)
      return
    }

    if (fc.metadata.provider == 'netflix') {
      document.dispatchEvent(
        new CustomEvent('netflix-video-controller', { detail: { time: time } })
      )
    } else {
      player.video.currentTime = time / 1000
    }

    if (mode == 'frame') {
      fc.frame_seeked = true
      var blur_level = fc.settings.blur_level_on_frame_seek
      if (!blur_level) blur_level = fc.settings.blur_level / 3
      player.blur(blur_level)
      player.pause()
    }
  },

  // Get current time in milliseconds (all times are always in milliseconds!)
  getTime: function() {
    return player.video.currentTime * 1000
  }
}

export function getPlayer() {
  return player
}
