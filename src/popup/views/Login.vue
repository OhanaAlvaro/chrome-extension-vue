<template>
  <div class="size-wrapper">
    <div>
      <h1 v-if="data.settings.username">{{ data.settings.username }} @ {{ extensionName }}</h1>
      <h1 v-else>Welcome to {{ extensionName }}!</h1>
      <span class="menu">
        <span @click="cancelSettings">
          <v-icon small>mdi-account</v-icon>
        </span>
      </span>
    </div>

    <v-snackbar top right v-model="snackbar" :timeout="snackbarTimeout" :color="snackbarColor">{{
      snackbarText
    }}</v-snackbar>

    <br />
    <v-row>
      <v-col cols="4" class="mt-2">
        <login
          :username="data.settings.username"
          :password="data.settings.password"
          @success="loginSuccess"
          @error="logginError"
        ></login>
      </v-col>

      <v-col cols="8">
        <b style="font-size:120%">3. Enjoy!</b><br />

        Enjoy movies as usual. Ohana will be working for you in the background, seamlessly skipping
        any unwanted content.<br /><br />

        If you spot any unwanted content, press "Alt+N" or "New filter" to flag it and help other
        users like you.<br /><br />

        <span v-if="data.settings.username">
          You can see all flagged scenes on the <a @click="$router.push('/')">film view.</a>
        </span>
        <span v-else>
          You can see all flagged scenes on the film view (log in required).
        </span>
      </v-col>
    </v-row>
  </div>
</template>

<script>
import fclib from '../js/fclib'
import Login from '../components/Login'
export default {
  components: {
    Login
  },

  data() {
    return {
      settings: { skip_tags: [] },
      settings_backup: {},
      skip_tags_backup: [],

      dialog: false,


      //other settings
      show_password: false,

      //snackbar
      snackbar: false,
      snackbarTimeout: 6000,
      snackbarText: '',
      snackbarColor: 'info'
    }
  },

  props: {
    data: Object
  },

  computed: {
    extensionName() {
      return browser.i18n.getMessage('extName')
    }
  },
  methods: {
    //login
    showSnackbar(textt, color) {
      this.snackbar = false //previous message
      this.snackbarText = textt
      this.snackbarColor = color
      this.snackbarTimeout = 6000
      this.snackbar = true
    },
    loginSuccess(data, serverResponse) {
      console.log('loginSuccess')
      this.data.settings.username = data.username
      this.data.settings.password = data.password
      this.showSnackbar(serverResponse.data, 'info')
      this.saveSettings()
    },
    logginError(data, serverResponse) {
      console.log('logginError')
      this.data.settings.username = ''
      this.data.settings.password = ''
      this.showSnackbar(serverResponse.data, 'error')
      this.saveSettings()
    },
    cancelSettings() {
      this.$router.go(-1) //to previous page (just in case at some point we have more than Home/Settings)
    },

    //Intereact with content-script (get/push data and messages)
    saveSettings() {
      console.log('saving settings...')

      fclib.sendMessage({ msg: 'update-settings', settings: this.data.settings }, response => {
        console.log('save settings response', response)
      })
    }
  }
}
</script>

<style lang="scss" scoped>
//make sure this style is not scoped (then use important)

.bordered {
  border-style: solid;
  padding: 10px;
  border-width: 1px;
}

.no-uppercase {
  text-transform: none !important;
}

.size-wrapper {
  min-width: 500px;
}
</style>
