<template>
  <div class="size-wrapper">
    <div>
      <h2 v-if="data.settings.username">
        Hi {{ data.settings.username }}! ({{ rank[data.settings.level] }})
      </h2>
      <h2 v-else>Welcome to {{ extensionName }}!</h2>
      <span class="menu">
        <a v-if="!data.sidebar" @click="cancelSettings()">
          <v-icon class="pb-1" small>mdi-arrow-left</v-icon>
          <b style="color: #616161">Back</b>
        </a>
        <span v-else @click="hideSidebar">
          <v-icon small>mdi-close</v-icon>
        </span>
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

    <div v-if="data.settings.username">
      <div v-if="data.settings.level == 0">
        <p>
          Welcome {{ data.settings.username }}, as a <i>{{ rank[data.settings.level] }}</i
          >, you are the lowest ranking Jedi. Some of your changes might require approval by higher
          ranking users.
        </p>

        <p>
          As you edit more movies and earn community recognition you will grow into the higher ranks
          of Ohana.
        </p>
      </div>
      <div v-else-if="data.settings.level < 6">
        Hi {{ data.settings.username }}, as a <i>{{ rank[data.settings.level] }}</i
        >, you can approve changes done by lower ranking users, but of your own changes might
        require approval by a higher ranking users.
      </div>
      <div v-else>
        Hi {{ data.settings.username }}, you are Master Yoda! You can do and undo all changes. With
        great power comes great responsibility!
      </div>
    </div>

    <div>
      Visit <a href="https://ohanamovies.org/" target="_blank">our website</a> to find out more
      about Ohana and skipping content.
    </div>

    <!--<v-row>
      <v-col>
        <h3>Manage your preferences</h3>
        <span>
          With Ohana, you decide what you watch. You can
          <router-link to="/preferences">review or change your preferences here</router-link> at any
          time.
        </span>
      </v-col>
    </v-row>

    <v-row>
      <v-col>
        <h3>Learn more</h3>
        <span
          >Visit <a href="https://ohanamovies.org/" target="_blank">Ohana Website</a> to find out
          more about skipping content.
        </span>
      </v-col>
    </v-row>

    <v-row>
      <v-col>
        <h3>Contact us</h3>
        <span
          >If you have ideas on how we can improve, or just want to say hi, please
          <a href="https://forms.gle/cPr7XQhdS7x1y9hx7" target="_blank">use this form</a>.
        </span>
      </v-col>
    </v-row>-->

    <!-- 
    <v-row>
      <v-col>
        <!- - <b style="font-size:120%">Enjoy!</b><br />-->

    <!--Enjoy movies as usual. Ohana will be working for you in the background, seamlessly skipping any unwanted content.<br /><br />

        If you spot any unwanted content, press <b>"Alt+N"</b> or <b>"Improve filters"</b> to flag
        it and help other users like you.<br /><br />

        <span v-if="data.settings.username">
          You can see all flagged scenes on the <a @click="$router.push('/')">film view.</a>
        </span>
        <span v-else>
          You can see all flagged scenes on the film view (log in required).
        </span> - ->
      </v-col>
    </v-row>
    -->

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

      rank: ['Youngling', 'Padawan', 'Jedi Knight', 'Jedi Master', 'Grand Master', 'Yoda'],

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
