<template>
  <div>
    <v-app>
      <v-main>
        <v-container>
          <!-- Use :data="data" to pass "data" as a property to router views-->
          <router-view :data="data"></router-view>
          <v-snackbar
            app
            width="15px"
            v-model="snackbar"
            :timeout="snackbarTimeout"
            :color="snackbarColor"
          >
            {{ snackbarText }}
            <template v-slot:action="{ attrs }">
              <v-btn color="white" icon v-bind="attrs" @click="snackbar = false">
                <v-icon>mdi-close</v-icon>
              </v-btn>
            </template>
          </v-snackbar>
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
      data: {
        msg: '',
        scenes: [],
        settings: [],
        shield: 'unknown',
        hasFilm: false,
        state: {},
        success: false,
        dialog: false
      },
      //snackbar
      snackbar: false,
      snackbarTimeout: 3000,
      snackbarText: '',
      snackbarColor: 'info'
    }
  },
  watch: {
    $route(to, from) {
      this.getData() //Alex: before, if you switched from home to login, and back to home, data was not populated properly :/ | Ideally we should just use Vuex...
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
        if (request.msg == 'new-data') {
          console.log('[listen-App.vue] Received request: ', request)
          this.getData()
        } else if (request.msg == 'snackbar') {
          this.snackbar = false
          this.snackbarText = request.text
          this.snackbarColor = request.color
          //this.snackbarTimeout = 6000
          this.snackbar = true
        }
        //sendResponse({ success: true, source: this.$route.name })  //TODO: [Alex]: I don't understand why this is here for, but it seems that this.data gets overwriten with the content of this response...
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

        if (['Options'].includes(this.$route.name)) {
          return
        }

        // If there is no response (or it is incomplete) open wrongsite/nomovie pages
        if (!response) {
          return this.$router.push('/wrongsite')
        }

        if (firstTime && response.scenes) {
          response.scenes.sort(function(a, b) {
            //make sure default scenes are shown first, and the rest sorted by start time
            if (a.default_skip && !b.default_skip) return -1
            if (!a.default_skip && b.default_skip) return 1
            return a.start - b.start
          })
        }

        //TODO: @arrietaeguren, can you review? (you created the hasFilm key, but it seems not yet properly populated, I'm populating it here - a bit quick and dirty)
        if (response.metadata) {
          if (!response.metadata.pid) {
            response.hasFilm = false
          } else {
            response.hasFilm = true
          }
        }

        response.sidebar = this.inIframe()

        // Make data globally accesible
        this.data = response

        // If we are on an iframe (i.e. on the sidebar), open de login/editor
        if (response.sidebar) {
          if (!response.settings.username) {
            this.$router.replace('/login')
          } else if (!['Editor'].includes(this.$route.name)) {
            this.$router.replace('/editor')
          }
          return
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

.v-snack__wrapper {
  width: 100% !important;
  min-width: unset !important;
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
