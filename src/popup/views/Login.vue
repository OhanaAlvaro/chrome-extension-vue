<template>
  <div class="size-wrapper">
  <v-app-bar app color="#00b359" dark dense height="34px" flat>
    <div class="d-flex align-center">
      <h3 v-if="username">{{ username }} @ {{ extensionName }}</h3>
      <h3 v-else>{{ extensionName }}</h3>
    </div>

    <v-spacer></v-spacer>

    <v-icon small @click="$router.push('/')">mdi-movie</v-icon>
  </v-app-bar>

    <v-snackbar top right v-model="snackbar" :timeout="snackbarTimeout" :color="snackbarColor">{{
      snackbarText
    }}</v-snackbar>

    <br />
    <v-row>
      <v-col cols="4" class="mt-2">
        <login
          :username="settings.username"
          :password="settings.password"
          @success="loginSuccess"
          @error="logginError"
        ></login>
      </v-col>

      <v-col cols="8">
        <!--<div @click="dialog = true" style="cursor: pointer;">
          <b style="font-size:120%">2. Choose what to filter out </b>
          <fc-tooltip text="You can customize this for specific scenes in film view">
            <v-icon color="info" dark small class="pb-1">mdi-help-circle</v-icon>
          </fc-tooltip>

          <br />
          <v-chip
            v-for="(skip_tag, index) in settings.skip_tags"
            :key="index"
            x-small
            dark
            :color="getTagColor(skip_tag)"
            >{{ skip_tag }}</v-chip
          >-->

          <!-- If no tag selected
          <v-chip v-if="settings.skip_tags.length == 0" x-small dark
            >Skip nothing
            <v-icon right x-small>mdi-pencil</v-icon>
          </v-chip>
        </div>
        <br />-->
        <b style="font-size:120%">3. Enjoy!</b><br />

        Enjoy movies as usual. Family Cinema will be working for you in the background, seamlessly
        skipping any unwanted content.<br /><br />

        If you spot any unwanted content, press "Alt+N" or "New filter" to flag it and help other
        users like you.<br /><br />

        <span v-if="settings.username">
          You can see all flagged scenes on the <a @click="$router.push('/')">film view.</a>
        </span>
        <span v-else>
          You can see all flagged scenes on the film view (log in required).
        </span>
      </v-col>
    </v-row>


    <!-- WIZARD (dialog) -->
    <v-dialog
      v-model="dialog"
      scrollable
      persistent
      :overlay="false"
      max-width="500px"
      transition="dialog-transition"
    >
      <v-card>
        <!--<v-card-title primary-title>{{ page.title }}</v-card-title>-->
        <v-card-title>{{ page.title }} </v-card-title>

        <v-card-text>
          <!-- content tags -->
          <div v-for="(cat, index) in content_tags" :key="index">
            <div v-if="page.id == cat.value + '_severity'">
              <label v-for="(s, index2) in cat.severity" :key="index2">
                <input
                  type="checkbox"
                  :name="cat + '_severity'"
                  :value="s.value"
                  v-model="settings.skip_tags"
                />
                <b>&nbsp;{{ s.title }}</b>
                <span v-if="s.description != ''">&nbsp;- {{ s.description }}</span>
                <br />
              </label>
            </div>

            <!--  Types : Don't add types for now (nonsense if not smarterly linked to severity) -->
            <div v-if="page.id == cat.value + '_types'">
              <label v-for="(s, index3) in cat.types" :key="index3">
                <input
                  type="checkbox"
                  :name="cat + '_types'"
                  :value="s.value"
                  v-model="settings.skip_tags"
                />
                <b>&nbsp;{{ s.title }}</b>
                <span v-if="s.description != ''">&nbsp;- {{ s.description }}</span>
                <br />
              </label>
            </div>
          </div>

          <!-- action tags: right now removed from pages, so they will not appear... -->
          <!-- what to dos -->
          <div v-if="page.id == 'what-to-do'">
            <label v-for="(s, index4) in action_tags.types" :key="index4">
              <input
                type="checkbox"
                :name="'what-to-do'"
                :value="s.value"
                v-model="settings.skip_tags"
              />
              <b>&nbsp;{{ s.title }}</b>
              <span v-if="s.description != ''">&nbsp;- {{ s.description }}</span>
              <br />
            </label>
          </div>
        </v-card-text>

        <div></div>

        <v-card-actions>
          <v-btn color="error" @click="cancelWizard()" text>Cancel</v-btn>

          <v-spacer></v-spacer>
          <v-btn color="primary" @click="step--" text>Prev</v-btn>
          <v-btn color="primary" @click="step++" text>Next</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
var raw = require('../js/raw_tags')
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

      step: 0,
      dialog: false,

      content_tags: [], //read from the separated file (definitions)
      action_tags: [],

      //other settings
      show_password: false,

      //snackbar
      snackbar: false,
      snackbarTimeout: 6000,
      snackbarText: '',
      snackbarColor: 'info'
    }
  },
  watch: {
    settings: {
      deep: true,
      handler(value) {
        this.removeTagAllIfthere()
      }
    },
    dialog(newValue) {
      if (newValue) {
        //everytime dialog is opened.

        this.startedWizard()
      }
    }
  },

  computed: {
    extensionName() {
      return browser.i18n.getMessage('extName')
    },
    page() {
      if (this.step < this.pages.length) {
        return this.pages[this.step]
      } else {
        this.finishWizard()
        return this.pages[0] //just in case (not sure why otherwise it does something weird...)
      }
    },
    pages() {
      var p = []

      //content tags
      this.content_tags.forEach(ct => {
        if (ct.severity.length > 0)
          p.push({
            id: ct.value + '_severity',
            title: 'Select the severity for "' + ct.title + '"'
          })
        // don't add types for now
        if (ct.types.length > 0 && ct.value == 'Other')
          p.push({
            id: ct.value + '_types',
            title: 'Select the type of "' + ct.title + '" scenes to skip'
          })
      })

      //actions don't make sense here right now...
      //p.push({ id: 'what-to-do', title: 'Always skip these?' })
      return p
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
      this.settings.username = data.username
      this.settings.password = data.password
      this.showSnackbar(serverResponse.data, 'info')
      this.saveSettings()
    },
    logginError(data, serverResponse) {
      console.log('logginError')
      this.settings.username = ''
      this.settings.password = ''
      this.showSnackbar(serverResponse.data, 'error')
      this.saveSettings()
    },

    //handle tags/wizard
    resetSettings() {
      this.settings.ignore_default_settings = false
      this.saveSettings() //sending this as false, returns the default seetings
    },
    removeTagAllIfthere() {
      //remove "All" always (temp: @arrietaeguren removing this from the content.js)
      var auxx = this.settings.skip_tags
      if (auxx.includes('All')) {
        for (var i = 0; i < auxx.length; i++) {
          if (auxx[i] == 'All') {
            auxx.splice(i, 1)
          }
        }
        this.settings.skip_tags = auxx
      }
    },
    finishWizard() {
      this.step = 0
      this.skip_tags_backup = this.settings.skip_tags //save backup for next time
      this.dialog = false
      this.saveSettings() //<-- don't do this, since right now we decided to wait for "save" button click
    },
    cancelWizard() {
      this.step = 0
      this.settings.skip_tags = this.skip_tags_backup
      this.dialog = false
    },
    startedWizard() {
      // this.getData() //tbc--> this might be restarting the other fields...
      this.step = 0
      this.content_tags = raw.content
      this.action_tags = raw.actions
    },

    //other stuff:
    getTagColor(value) {
      var color_value = 'gray' //default
      this.content_tags.forEach(item => {
        if (item.value == value) {
          color_value = item.color
        }
      })
      return color_value
    },

    cancelSettings() {
      this.$router.go(-1) //to previous page (just in case at some point we have more than Home/Settings)
    },

    //Intereact with content-script (get/push data and messages)
    saveSettings() {
      console.log('saving settings...')

      this.sendMessage({ msg: 'update-settings', settings: this.settings }, response => {
        console.log('save settings response', response)
      })
    },
    listenToMessages() {
      chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        console.log('[listen-Settings] Received request: ', request)
        if (request.msg == 'new-data') {
          this.getData()
        }
        sendResponse(true)
      })
    },
    sendMessage(msg, callback) {
      console.log('[sendMessage-Settings]: ', msg)
      chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
        chrome.tabs.sendMessage(tabs[0].id, msg, function(response) {
          if (callback) callback(response)
        })
      })
    },
    getData() {
      this.sendMessage({ msg: 'get-data' }, response => {
        console.log('data-received in Settings', response)
        this.settings = response.settings
        this.settings_backup = response.settings
        this.skip_tags_backup = response.settings.skip_tags
      })
    }
  },
  beforeMount() {
    this.content_tags = raw.content // ´\_O.O_/`
    this.action_tags = raw.actions
  },
  mounted() {
    this.getData()
    this.listenToMessages()
    this.content_tags = raw.content
    this.action_tags = raw.actions
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

.size-wrapper{
  min-width: 500px;
}

</style>
