<template>
  <div class="size-wrapper">
    <div>
      <h2 v-if="data.settings.username">{{ data.settings.username }} @ {{ extensionName }}</h2>
      <h2 v-else>Welcome to {{ extensionName }}!</h2>
      <span class="menu">
        <!--
        <v-btn color="grey" fab x-small dark depressed @click="cancelSettings">
          <v-icon>mdi-home</v-icon>
        </v-btn>
        -->

        <a @click="cancelSettings()" v-if="data.settings.username">
          <v-icon class="pb-1" small>mdi-arrow-left</v-icon>
          <b>Back</b>
        </a>
      </span>
    </div>

    <div v-if="!data.settings.username" style="text-align: center; margin: 10px;font-size: 120%;">
      Login/register is required before creating or editing filters
    </div>

    <v-snackbar
      app
      width="20px"
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
    <v-row>
      <v-col>
        <login :data="data" @success="loginSuccess" @error="logginError"></login>
      </v-col>
    </v-row>

    <v-row>
      <v-col>
        <span>
          With Ohana, you decide what you watch. Click here to review your settings or review what
          our icons mean!
        </span>
        <v-btn color="success" to="/preferences" depressed block tile>review preferences</v-btn>
      </v-col>
    </v-row>

    <v-row>
      <v-col>
        <!-- <b style="font-size:120%">Enjoy!</b><br />-->

        <!--Enjoy movies as usual. Ohana will be working for you in the background, seamlessly skipping any unwanted content.<br /><br />

        If you spot any unwanted content, press <b>"Alt+N"</b> or <b>"Improve filters"</b> to flag
        it and help other users like you.<br /><br />

        <span v-if="data.settings.username">
          You can see all flagged scenes on the <a @click="$router.push('/')">film view.</a>
        </span>
        <span v-else>
          You can see all flagged scenes on the film view (log in required).
        </span>-->
      </v-col>
    </v-row>

    <!--<v-row>
      <v-col>
        <v-switch label="Test Dark Mode" hide-details v-model="darkMode" class="mt-0"></v-switch>
      </v-col>
    </v-row>-->
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
      //settings: { skip_tags: [] },  //now using prop data
      //settings_backup: {},
      //skip_tags_backup: [],

      darkMode: false,

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

  watch: {
    darkMode(newValue, oldValue) {
      this.$vuetify.theme.dark = !this.$vuetify.theme.dark
    }
  },
  computed: {
    extensionName() {
      return browser.i18n.getMessage('extName')
    },
    windowHistory() {
      return window.history.length > 0
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
      this.showSnackbar(serverResponse, 'success')
      this.saveSettings()
    },
    logginError(data, serverResponse) {
      console.log('logginError')
      this.data.settings.username = ''
      this.data.settings.password = ''
      this.showSnackbar(serverResponse, 'error')
      this.saveSettings()
    },
    cancelSettings() {
      //this.$router.go(-1) //to previous page (just in case at some point we have more than Home/Settings)
      this.$router.back()
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
  min-width: 300px;
}
</style>
