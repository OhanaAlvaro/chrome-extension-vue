<template>
  <div>
    <v-app>
      <v-app-bar app color="#00b359" dark dense height="34px" flat>
        <!-- <v-btn icon @click="drawer = !drawer">
          <v-icon small>mdi-menu</v-icon>
        </v-btn>

        -->
        <div class="d-flex align-center" @click="$router.push('/')">
          <h3>{{ username }} @ {{ extensionName }}</h3>
        </div>

        <v-spacer></v-spacer>

        <v-icon small @click="go2Settings()">mdi-cog</v-icon>
      </v-app-bar>

      <!-- NAV DRAWER -->

      <!--
      <v-navigation-drawer v-model="drawer" left app temporary>
        <v-list-item>
          <v-list-item-content>
            <v-list-item-title class="title">Family Cinema</v-list-item-title>
            <v-list-item-subtitle>Decide what you watch</v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>

        <v-divider></v-divider>

        <v-list dense nav app>
          <v-list-item link to="/">
            <v-list-item-icon>
              <v-icon>mdi-home-outline</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title>Home</v-list-item-title>
            </v-list-item-content>
          </v-list-item>

          <
          <v-list-item link href="https://www.familycinema.netlify.app" target="_blank">
            <v-list-item-icon>
              <v-icon>mdi-web</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title>Family Cinema Website</v-list-item-title>
            </v-list-item-content>
          </v-list-item>
          
        </v-list>
      </v-navigation-drawer>

      -->

      <!-- -->
      <v-main>
        <v-container>
          <!--
          <router-link to="/">Home</router-link>|
          <router-link to="/about">About</router-link>|
          <router-link to="/jarri">Jarri</router-link>|
          <router-link to="/no-movie">No Movie</router-link>|
          <router-link to="/settings">Settings</router-link>
          -->

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
  computed: {
    extensionName() {
      return browser.i18n.getMessage('extName')
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
      console.log('[sendMessage]: ', msg)
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
  width: 600px;
}

* {
  font-size: 12px;
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
  padding: 10px 0px 0px 0px !important;
}

.v-application--wrap {
  flex: none !important;
  min-height: 0px !important;
}

.v-card__text {
  line-height: 1rem !important;
}
</style>
