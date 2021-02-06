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
      data: {}
    }
  },
  methods: {
    go2Settings() {
      if (this.$route.name == 'Settings') {
        this.$router.go(-1) //go back to whatever route we were before :)  | (just in case at some point we have more than Home/Settings)
      } else {
        this.$router.push('/settings')
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
        sendResponse(true)
      })
    },
    inIframe() {
      try {
        return window.self !== window.top
      } catch (e) {
        return true
      }
    },
    getData( firstTime ) {
      this.sendMessage({ msg: 'get-data' }, response => {
        console.log('data-received in App.vue', response)

        // If there is no response (or it is incomplete) open wrongsite/nomovie pages
        if (!response) {
          return this.$router.push('/wrongsite')
        } else if (!response.settings || !response.scenes) {
          return this.$router.push('/no-movie')
        }

        // Make data globally accesible
        this.data = response

        // If we are on an iframe (i.e. on the sidebar), open de editor
        if (this.inIframe()) {
          if (!response.settings.username) return this.$router.push('/settings')
          return this.$router.push('/editor')
        }

        // Scape WrongSite and NoMovie pages if data was updated
        if( ['WrongSite','NoMovie'].includes(this.$route.name) ){
          this.router.push('/home')
        }


      })
    }
  },
  mounted() {
    this.getData(true)
    this.listenToMessages()
    //this.sendMessage({ msg: 'pause' })
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
