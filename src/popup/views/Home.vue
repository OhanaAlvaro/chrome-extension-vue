<template>
  <div style="min-height: 250px;">
    <div>
      <h2>Choose what to filter out</h2>
      <span @click="go2Settings()" style="position: absolute; top:15px;right:15px; cursor: pointer;">
        {{ username }} <v-icon small>mdi-account</v-icon>
      </span>
    </div>
    <br>

    <div @click="dialog = true" style="cursor: pointer;">
      <v-chip
        v-for="(skip_tag, index) in data.settings.skip_tags"
        :key="index"
        x-small
        dark
        :color="getTagColor(skip_tag)"
        >{{ skip_tag }}</v-chip
      >

      <!-- If no tag selected - ->
      <v-chip v-if="data.settings.skip_tags.length == 0" x-small dark
        >Skip nothing
        <v-icon right x-small>mdi-pencil</v-icon>
      </v-chip>-->
    </div>

    <div v-if="zero_scenes" align="center" justify="center" style="width:300px">
      <br /><br /><br /><br /><br />
      No filters for this film. Be the first one to add one!
    </div>
    <div v-else>
      <scenes-viewer v-model="data.scenes"></scenes-viewer>
    </div>

    <br />
    <br />
    <br />

    <v-footer fixed color="white" dense>
      <!-- Shield -->

      <v-btn text small class="no-uppercase" @click="shield_visible = !shield_visible">
        <fc-tooltip v-if="data.shield == `done`" text="All unwanted content will be removed!">
          <v-icon color="#00b359">mdi-shield-check</v-icon>Protected!
        </fc-tooltip>

        <fc-tooltip v-if="data.shield == `unkown`" text="There might be some unwanted content!">
          <v-icon>mdi-shield-half-full</v-icon>Unkown!
        </fc-tooltip>
        <fc-tooltip
          v-if="data.shield == `missing`"
          text="This movie contains unwanted content cannot be filtered at the moment!"
        >
          <v-icon color="red">mdi-shield-alert</v-icon>Missing!
        </fc-tooltip>
      </v-btn>

      <v-btn
        color="black"
        @click="sendMessage({ msg: 'show-sidebar' })"
        text
        small
        class="no-uppercase"
      >
        Editor's panel
      </v-btn>

      <v-btn @click="sendMessage({ msg: 'play-pause' })" text small>
        <v-icon fab>mdi-play</v-icon>Play/Pause
      </v-btn>

      <!-- Shield dialog -->
      <shield-vue :visible="shield_visible" @hide="shield_visible = false"></shield-vue>

      <br />
      <v-snackbar top right v-model="snackbar" :timeout="snackbarTimeout" color="info">{{
        snackbarText
      }}</v-snackbar>
    </v-footer>
  </div>
</template>

<script>
import ScenesViewer from '../components/ScenesViewer'
import ShieldVue from '../components/Shield.vue'
import fclib from '../js/fclib'
var raw = require('../js/raw_tags')
export default {
  name: 'Home',
  components: {
    ScenesViewer,
    ShieldVue
  },

  watch: {
    data: {
      deep: true,
      handler(newValue, oldValue) {
        if (newValue.scenes.length == 0) {
          this.zero_scenes = true
        } else {
          this.zero_scenes = false
        }
      }
    }
  },

  computed: {
    extensionName() {
      return browser.i18n.getMessage('extName')
    }
  },

  data() {
    return {
      data: { msg: '', scenes: [], settings: [], shield: 'unkown' }, //default values, to avoid missing keys
      zero_scenes: false,
      snackbarText: '',
      snackbar: false,
      snackbarTimeout: 6000,

      drawer: false,
      username: '',

      //shield
      shield_visible: false
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

    //Generic methods:
    sendMessage(msg, callback) {
      console.log('[sendMessage-Home]: ', msg)
      chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
        chrome.tabs.sendMessage(tabs[0].id, msg, function(response) {
          if (callback) callback(response)
        })
      })
    },
    listenToMessages() {
      chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        console.log('[listen-Home] Received request: ', request)
        if (request.msg == 'new-data') {
          this.getData(false)
        }
        sendResponse(true)
      })
    },

    getTagColor(value) {
      var color_value = 'gray' //default
      raw.content.forEach(item => {
        if (item.value == value) {
          color_value = item.color
        }
      })
      return color_value
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
        console.log('data-received in Home', response)
        console.log(window.innerWidth)

        if (this.inIframe()) {
          return this.$router.push('/editor')
        } else if (!response) {
          return this.$router.push('/wrongsite')
        } else if (!response.settings || !response.scenes) {
          return this.$router.push('/no-movie')
        } else if (!response.settings.username) {
          return this.$router.push('/settings')
        }

        this.username = response.settings.username

        if (firstTime) {
          response.scenes.sort(function(a, b) {
            //make sure default scenes are shown first, and the rest sorted by start time
            if (a.default_skip && !b.default_skip) return -1
            if (!a.default_skip && b.default_skip) return 1
            return a.start - b.start
          })
        }

        this.data = response
        this.scenes = response.scenes
      })
    }
  },

  mounted() {
    //Let's get the data as soon as mounted
    this.getData(true)
    this.listenToMessages()
  }
}
</script>

<style>
.no-uppercase {
  text-transform: none;
}

.v-messages.theme--light {
  display: none;
}

.v-input__slot {
  margin-bottom: 0px;
}

.v-input.theme--light.v-input--selection-controls.v-input--checkbox {
  margin-top: 0px;
  padding-top: 0px;
}
</style>

<style lang="scss" scoped>
@import '/v0/popup.css';
</style>
