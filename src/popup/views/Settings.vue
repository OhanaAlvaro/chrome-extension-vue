<template>
  <div>
    <!-- skip_tags -->
    <div @click="dialog = true">
      What tags do you want to get filtered by default?
      <fc-tooltip text="You can always override this for each movie"></fc-tooltip>
      <br />
      <v-chip
        v-for="(skip_tag, index) in settings.skip_tags"
        :key="index"
        x-small
        dark
        :color="getTagColor(skip_tag)"
      >{{ skip_tag }}</v-chip>

      <!-- If no tag selected -->
      <v-chip v-if="settings.skip_tags.length == 0" x-small dark>None</v-chip>
      <v-btn color="primary" @click="dialog = true" text class="no-uppercase">Change...</v-btn>
    </div>
    <br />
    <br />

    <!-- ADVANCED SETTINGS-->
    <div id="a-advanced-settings">
      <h3>Advanced settings</h3>
      <v-row class="compact-form">
        <!-- COL1: BLUR / AUTOSAVE -->
        <v-col>
          <v-text-field
            name="blur_level"
            label="Blur Level"
            hint="How much to blur the video while you mark a new scene (0-100) "
            type="number"
            id="id"
            v-model.number="settings.blur_level"
          ></v-text-field>
          <v-text-field
            name="autosave_after"
            label="Autosave after..."
            hint="How often we perform the autosave action (milliseconds) "
            type="number"
            id="id"
            v-model.number="settings.autosave_after"
          ></v-text-field>
        </v-col>

        <!-- COL2: SWITCHES -->
        <v-col>
          <v-switch
            x-small
            label="Ignore deafult settings"
            v-model="settings.ignore_default_settings"
          ></v-switch>
          <v-switch label="Pause after adding a scene" v-model="settings.pause_after_adding_scene"></v-switch>
        </v-col>

        <!-- COL3: LOGIN -->
        <v-col>
          <div v-if="settings.username == 'guest'">
            <h3>
              You are using Family Cinema as a guest.
              <fc-tooltip
                text="The contributions you do will be recorded, but with very low credibility."
              ></fc-tooltip>
            </h3>
          </div>
          <v-text-field
            append-icon="mdi-account"
            name="username"
            label="username"
            v-model="settings.username"
          ></v-text-field>

          <v-text-field
            password
            label="Password"
            v-model="settings.password"
            clearable
            :append-icon="show_password ? 'mdi-eye' : 'mdi-eye-off'"
            :type="show_password ? 'text' : 'password'"
            @click:append="show_password = !show_password"
          ></v-text-field>

          <p>
            New user?
            <a
              href="https://familycinema.netlify.app/#/join-us"
              target="_blank"
            >Register now!</a>
          </p>
        </v-col>
      </v-row>
    </div>
    <br />

    <!-- settings: {{ settings }} settings_backup: {{ settings_backup }} -->
    <v-row>
      <v-col>
        <v-btn color="error" block depressed tile @click="cancelSettings()">Cancel</v-btn>
      </v-col>
      <v-col>
        <v-btn color="success" block depressed tile @click="saveSettings()">Save</v-btn>
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
        <v-toolbar color="primary" dark dense height="34px">
          <h3>{{ page.title }}</h3>
        </v-toolbar>
        <br />
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
            <!-- Types -->
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

          <!-- action tags -->
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
export default {
  data() {
    return {
      settings: {},
      settings_backup: {},
      skip_tags_backup: [],

      step: 0,
      dialog: false,

      content_tags: [], //read from the separated file (definitions)
      action_tags: [],

      //other settings
      show_password: false
    }
  },
  watch: {
    settings: {
      deep: true,
      handler(value) {
        this.removeTagAllIfOthersAreSelected()
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
          p.push({ id: ct.value + '_severity', title: 'Select the severity for ' + ct.title })
        if (ct.types.length > 0)
          p.push({
            id: ct.value + '_types',
            title: 'Select the type of ' + ct.title + ' scenes to skip'
          })
      })

      //actions
      p.push({ id: 'what-to-do', title: 'Always skip these?' })
      return p
    }
  },
  methods: {
    //handle tags/wizard
    removeTagAllIfOthersAreSelected() {
      //remove "All" if included and more than 1 scene. We execute this everytime tags are changed to be safe...
      var auxx = this.settings.skip_tags
      if (auxx.includes('All') && auxx.length > 1) {
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
      //this.saveSettings() <-- don't do this, since right now we decided to wait for "save" button click
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
      this.$router.push('/')
    },

    //Intereact with content-script (get/push data and messages)
    saveSettings() {
      this.sendMessage({ msg: 'update-settings', settings: this.settings }, response => {
        console.log('save settings response', response)
        if (response == true) {
          this.$router.push('/') //navigate to home
        } else {
          console.log('error with settings')
        }
      })
    },
    listenToMessages() {
      chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        console.log('[listen-SETTINGS] Received request: ', request)
        if (request.msg == 'new-data') {
          this.getData()
        }
        sendResponse(true)
      })
    },
    sendMessage(msg, callback) {
      console.log('[sendMessage]: ', msg)
      chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
        chrome.tabs.sendMessage(tabs[0].id, msg, function(response) {
          if (callback) callback(response)
        })
      })
    },
    getData() {
      this.sendMessage({ msg: 'get-data' }, response => {
        console.log('data-received', response)
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
.compact-form {
  //switches and text-fields are too big... this is not an elegant solution, but it's better than doing nothing
  transform: scale(0.85);
  transform-origin: left;
}

.no-uppercase {
  text-transform: none;
}
</style>
