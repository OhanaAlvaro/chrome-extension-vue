<template>
  <div class="size-wrapper">
    <div>
      <h2 v-if="data.settings.username">
        {{ $t('hi') }} {{ data.settings.username }}! ({{ rank[data.settings.level] }})
      </h2>
      <h2 v-else>{{ $t('welcomeTo') }}!</h2>
      <span v-if="!data.sidebar" class="menu">
        <a v-if="data.hasFilm" @click="goTo('/')">
          <v-icon class="pb-1" small>mdi-movie</v-icon>
        </a>
        <a @click="goTo('/preferences')">
          <v-icon class="pb-1" small>mdi-cog</v-icon>
        </a>
        <a @click="goTo('/login')" class="active-menu">
          <v-icon class="pb-1" small>mdi-account</v-icon>
        </a>
      </span>
      <span class="menu" v-else>
        <a @click="hideSidebar">
          <v-icon class="pb-1" small>mdi-close</v-icon>
        </a>
      </span>
    </div>

    <div v-if="!data.settings.username" style="text-align: center; margin: 10px;font-size: 120%;">
      {{ $t('loginRequired') }}
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

    <i v-if="data.settings.username">
      <div v-if="data.settings.level == 0">
        {{ $t('lowestLevel') }}
      </div>
      <div v-else-if="data.settings.level < 6">
        {{ $t('mediumLevel') }}
      </div>
      <div v-else>
        {{ $t('highLevel') }}
      </div>
    </i>

    <!-- ACTION BUTTONS -->
    <br />
    <b>{{ $t('helpUsImprove') }}</b>

    <div style="margin: 10px 5px 0 5px">
      <v-btn plain text href="https://forms.gle/cPr7XQhdS7x1y9hx7" target="_blank">
        {{ $t('btn_feedback') }}
      </v-btn>

      <v-btn
        v-if="!data.sidebar && data.hasFilm"
        plain
        text
        color="primary"
        @click="showSidebar(true)"
      >
        {{ $t('btn_edit') }}
      </v-btn>
      <v-btn v-else href="https://ohanamovies.org/" target="_blank" plain text color="primary">
        {{ $t('btn_learn') }}
      </v-btn>

      <v-btn plain text color="success" href="https://www.patreon.com/ohanamovies" target="_blank">
        {{ $t('btn_donate') }}
      </v-btn>
    </div>

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
      darkMode: false,

      rank: [
        'Youngling',
        'Padawan',
        'Jedi Knight',
        'Jedi Master',
        'Grand Master',
        'Baby Yoda',
        'Ashoka'
      ],

      dialog: false,

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
    hideSidebar() {
      this.sendMessage({ msg: 'show-sidebar', show: false })
    },
    goTo(route) {
      if (route == -1) {
        this.$router.go(-1)
      } else {
        this.$router.push(route)
      }
    },
    showSidebar(close = false) {
      fclib.sendMessage({ msg: 'show-sidebar', show: true })
      if (close) window.close()
    },
    //login
    showSnackbar(textt, color) {
      this.snackbar = false //previous message
      this.snackbarText = textt
      this.snackbarColor = color
      this.snackbarTimeout = 6000
      this.snackbar = true
    },
    loginSuccess(message) {
      this.showSnackbar(message, 'success')
    },
    logginError(message) {
      this.showSnackbar(message, 'error')
    },
    cancelSettings() {
      //this.$router.go(-1) //to previous page (just in case at some point we have more than Home/Settings)
      this.$router.back()
      //this.hideSidebar() //TODO: ugly workaround. Good approach would be to show the "close" button only if we are in side bar.
    },

    //Intereact with content-script (get/push data and messages)
    saveSettings() {
      console.log('saving settings...')
      fclib.sendMessage({ msg: 'update-settings', settings: this.data.settings }, response => {
        console.log('save settings response', response)
      })
    },
    sendMessage(msg) {
      fclib.sendMessage(msg)
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
