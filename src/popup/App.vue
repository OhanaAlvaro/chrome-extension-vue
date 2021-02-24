<template>
  <div>
    <v-app>
      <v-main>
        <v-container>
          <!-- Use :data="data" to pass "data" as a property to router views-->
          <router-view :data="data"></router-view>
        </v-container>
      </v-main>
    </v-app>
  </div>
</template>

<script>
export default {
  name: 'PopupApp',
  data() {
    return {
      data: { msg: '', scenes: [], settings: [], shield: 'unkown', hasFilm: false } //default values, to avoid missing keys
    }
  },
  methods: {
    go2Login() {
      if (this.$route.name == 'Login') {
        this.$router.go(-1) //go back to whatever route we were before :)  | (just in case at some point we have more than Home/Login)
      } else {
        this.$router.push('/login')
      }
    },
    sendMessage(msg, callback) {
      console.log('[sendMessage-App.vue]: ', msg)
      chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
        chrome.tabs.sendMessage(tabs[0].id, msg, function(response) {
          if (callback) callback(response)
        })
      })
    },
    listenToMessages() {
      chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        console.log('[listen-App.vue] Received request: ', request)
        if (request.msg == 'new-data') this.getData()
        sendResponse({ success: true, source: this.$route.name })
      })
    },
    inIframe() {
      try {
        return window.self !== window.top
      } catch (e) {
        return true
      }
    },
    getData(firstTime) {
      this.sendMessage({ msg: 'get-data' }, response => {
        console.log('data-received in App.vue', response, this.$route.name)

        // If there is no response (or it is incomplete) open wrongsite/nomovie pages
        if (!response) {
          return this.$router.push('/wrongsite')
        } /* else if (!response.settings || !response.scenes) {
          return this.$router.push('/no-movie')
        }*/

        if (firstTime) {
          response.scenes.sort(function(a, b) {
            //make sure default scenes are shown first, and the rest sorted by start time
            if (a.default_skip && !b.default_skip) return -1
            if (!a.default_skip && b.default_skip) return 1
            return a.start - b.start
          })
        }

        // Make data globally accesible
        this.data = response

        // If we are on an iframe (i.e. on the sidebar), open de editor
        if (this.inIframe()) {
          if (!response.settings.username) return this.$router.push('/settings')
          return this.$router.push('/editor')
        }

        // Scape WrongSite and NoMovie pages if data was updated
        if (['WrongSite', 'NoMovie'].includes(this.$route.name)) {
          this.router.push('/home')
        }
      })
    }
  },
  mounted() {
    this.getData(true)
    this.listenToMessages()
    this.sendMessage({ msg: 'pause' })
  },
  beforeUnmount() {
    // TODO: This would be cool, but some reason it is not being detected
    this.sendMessage({ msg: 'play' })
  }
}
</script>

<style lang="scss">
html {
  background: white;
  overflow: hidden !important;
}

.v-label {
  font-size: 12px !important;
}

//HANDLE POPUP SIZE

.v-main__wrap {
  flex: none !important;
}

main.v-main {
  flex: none !important;
  padding: 0px 0px 0px 0px !important;
}

.v-application--wrap {
  flex: none !important;
  min-height: 0px !important;
}

.v-card__text {
  line-height: 1rem !important;
}
</style>
