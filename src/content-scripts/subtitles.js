let player = require('./player')

let sub = {
  subtitle_observer: '', //This is the current subtitles observer

  loaded: false, //True if the subtitles are loaded onto the page

  profanity_volume: '', //This is the video's volume before being muted because of profanity

  profane_words: [],

  provider: false, // Which provider we are at netflix|hbo|...

  container: false,

  /*** This function mutes profanity if the user has activated the skip profanity option ***/
  mute_profanity: function() {
    try {
      if (!sub.profane_words.length) return console.log('Profanity list empty')

      var subtitle_container = ''
      var text = ''
      var subtitles = ''
      var text_next = ''

      //Depending on the provider, we look for the subtitles' text:
      if (sub.provider == 'netflix') {
        subtitle_container = document.getElementsByClassName('player-timedtext-text-container')[0]

        if (subtitle_container) subtitles = subtitle_container.getElementsByTagName('span')[0]
      } else if (sub.provider == 'disneyplus') {
        subtitle_container = document.querySelector('video').textTracks[0]

        if (subtitle_container) {
          if (subtitle_container.activeCues[0]) {
            text = subtitle_container.activeCues[0].text
            let cues_array = Array.from(document.querySelector('video').textTracks[0].cues)
            var index = cues_array.indexOf(subtitle_container.activeCues[0])

            //In Disney+'s case you cannot censor the current subtitle, so we censor preemptively the next one
            if (index + 1 < cues_array.length)
              text_next = document.querySelector('video').textTracks[0].cues[index + 1].text
          }
        }
      } else if (sub.provider == 'hboespana') {
        subtitle_container = document.getElementsByClassName('clpp-subtitles-container')[0]
        if (subtitle_container)
          subtitles = subtitle_container.getElementsByClassName('clpp-subtitles')[0]
      } else if (sub.provider == 'primevideo') {
        subtitle_container = document.getElementsByClassName('fk87jrb')[0]
        if (subtitle_container) subtitles = subtitle_container.getElementsByClassName('fg8afi5')[0]
      }

      if (subtitles) text = subtitles.innerHTML

      //This is the RegEx rule that includes all the profane words on the list
      let reg = new RegExp(sub.profane_words.join('|') + '|\\*\\*\\*\\*\\*')
      let reg_censored = new RegExp('\\*\\*\\*\\*\\*')

      //If the current subtitle's text (or the next one's in Disney+) is already censored we return
      if (reg_censored.test(text) || reg_censored.test(text_next)) {
        return
      }

      //If the text matches the regular expression (there is a profane word):
      if (reg.test(text)) {
        //We save an array containing the profane words in the text
        const words_array = [...text.matchAll(sub.profane_words.join('|'))]
        let replacement_str = text
        //We replace every profane word with '*****'
        for (word of words_array) {
          replacement_str = replacement_str.replace(word, '*****')
        }

        //Then we override the original text with the censored one
        if (sub.provider == 'disneyplus') {
          document.querySelector('video').textTracks[0].activeCues[0].text = replacement_str
        } else if (sub.provider == 'primevideo') {
          subtitles.textContent = replacement_str
        } else {
          subtitles.innerHTML = replacement_str
        }

        console.log('Subtitles censored successfully')
        if (sub.profanity_volume) return
        sub.profanity_volume = player.volume(0)
      }

      //If there isn't any profane words but the sound is muted we restore the original volume
      else if (sub.profanity_volume) {
        player.volume(sub.profanity_volume)
        sub.profanity_volume = 0
      }

      //In Disney+'s case we also censor or not the next subtitle
      if (reg.test(text_next)) {
        const words_array = [...text_next.matchAll(sub.profane_words.join('|'))]
        let replacement_str = text_next

        for (word of words_array) {
          replacement_str = replacement_str.replace(word, '*****')
        }
        document.querySelector('video').textTracks[0].cues[index + 1].text = replacement_str
      }
    } catch (e) {
      console.log(e)
    }
  },

  //TODO use a different profanity list for each setting level and maybe let the user change the list
  getProfaneWords: function( skip_tags ){
    return []
  },

  load: function(skip_tags, provider) {
    if (provider && sub.loading) return
    if (skip_tags) sub.profane_words = sub.getProfaneWords(skip_tags)
    sub.provider = provider || sub.provider || ''
    sub.container = false

    if (sub.provider == 'netflix') {
      sub.container = document.getElementsByClassName('player-timedtext')[0]
    } else if (sub.provider == 'hboespana') {
      sub.container = document.getElementsByClassName('clpp-subtitles-container')[0]
    } else if (sub.provider == 'disneyplus') {
      sub.container = document.querySelector('video').textTracks[0]
    } else if (sub.provider == 'primevideo') {
      sub.container = document.getElementsByClassName('fk87jrb')[0]
    }

    //If the subtitles exist:
    if (sub.container) {
      //We set the subtitle censorship if necessary
      console.log('successfully loaded subtitles ', sub.profane_words )
      sub.set_observer()
      sub.loaded = true
      if( sub.loading ) clearInterval(sub.loading)
      sub.loading = false
    } else {
      console.log('unable to load subtitles...' )
      sub.loaded = false
      if (!sub.loading) sub.loading = setInterval(sub.load, 5000)
    }
  },

  /*** This function, if needed, starts observing and monitoring subtitle changes in order to mute them or not ***/
  set_observer: function() {
    //If the user has included skip profanity in his settings:
    if (sub.profane_words.length) {
      var subtitle_container = ''

      //We disconnect any previous subtitle observer, otherwise it interferes with the new one
      if (sub.subtitle_observer) sub.subtitle_observer.disconnect()

      //We proceed to locate the subtitle's container depending on the provider
      if (sub.provider == 'netflix') {
        subtitle_container = document.getElementsByClassName('player-timedtext')[0]
      } else if (sub.provider == 'hboespana') {
        subtitle_container = document.getElementsByClassName('clpp-subtitles-container')[0]
      } else if (sub.provider == 'disneyplus') {
        //On Disney+, because of how their subtitles work, there is already an attribute tha deals with changes
        if (document.querySelector('video'))
          document.querySelector('video').textTracks[0].oncuechange = sub.mute_profanity
      } else if (sub.provider == 'primevideo') {
        subtitle_container = document.getElementsByClassName('fk87jrb')[0]
      }

      //If the subtitle's container exists
      if (subtitle_container) {
        //We create a mutation observer that activates the function mute_profanity when the current subtitles change
        const config = { attributes: true, childList: true, subtree: true }
        sub.subtitle_observer = new MutationObserver(sub.mute_profanity)
        sub.subtitle_observer.observe(subtitle_container, config)
      }
    }

    //Else the user doesn't want to skip profanity:
    else {
      //Disconnect the observer if any
      if (sub.subtitle_observer) sub.subtitle_observer.disconnect()
      //Same for Disney+'s oncuechange
      else if (document.querySelector('video') && sub.provider == 'disneyplus') {
        if (document.querySelector('video').textTracks[0].oncuechange)
          document.querySelector('video').textTracks[0].oncuechange = null
      }

      //If the video was muted before, unmute it
      if (sub.profanity_volume) {
        player.volume(sub.profanity_volume)
        sub.profanity_volume = 0
      }
    }
  }
}

module.exports = sub
