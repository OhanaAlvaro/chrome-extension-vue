<template>
  <div>
    <v-app>
      <v-main>
        <v-container>
          <router-view></router-view>
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
      drawer: false,
      username: '',
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
        if (request.msg == 'new-data') {
          this.getData()
        }
        sendResponse(true)
      })
    },
    getData() {
      this.sendMessage({ msg: 'get-data' }, response => {
        console.log('data-received in App.vue', response)

        /* This is done in the Home (might make sense to do it here... )
        if (!response) {
          this.$router.push('/about')
        } else if (!response.settings || !response.scenes) {
          this.$router.push('/no-movie')
        }
        */

        this.username = response.settings.username

        this.data = response
      })
    }
  },
  mounted() {
    this.getData()
    this.listenToMessages()
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
