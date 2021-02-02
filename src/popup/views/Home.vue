<template>
  <div style="min-width: 300px;">
    <div>
      <h2>Choose what to filter out</h2>
      <span class="menu">
        <span @click="go2Settings()">
          <v-icon small>mdi-account</v-icon>
        </span>

        <span @click="sendMessage({ msg: 'show-sidebar' })">
          <v-icon small>mdi-pencil</v-icon>
        </span>

        <span>
          <v-icon small>mdi-cog</v-icon>
        </span>
      </span>
    </div>
    <br />

    <div class="sliders">
      <span class="section">
        Sex & Nudity
      </span>
      <div class="range">
        <input type="range" min="0" max="4" value="3" class="slider" />
        <div class="sliderticks">
          <p>Watch All</p>
          <p></p>
          <p>Skip Some</p>
          <p></p>
          <p>Skip All</p>
        </div>
      </div>


      <span class="section">Violence</span>
      <div class="range">
        <input type="range" min="0" max="4" value="2" class="slider" />
        <div class="sliderticks">
          <p>Watch All</p>
          <p></p>
          <p></p>
          <p></p>
          <p>Skip All</p>
        </div>
      </div>

      <span class="section">Profanity</span>
      <div class="range">
        <input type="range" min="0" max="4" value="1" class="slider" />
        <div class="sliderticks">
          <p>Watch All</p>
          <p></p>
          <p></p>
          <p></p>
          <p>Skip All</p>
        </div>
      </div>
    </div>

    <br />
    <div align="center" justify="center" style="width:300px">
      <span v-if="data.shield == `done`">
        <b style="color: #00b359">Grab some popcorn and enjoy!</b> We will skip all unwanted scenes  
      </span>
      <span v-if="data.shield == `unkown` && false">
        <b style="color: orangered">Careful!</b> We might not be able to skip all unwanted scenes  
      </span>
      <span v-if="data.shield == `missing` || true">
        <b style="color: red">Beware!</b> We won't be able to skip all unwanted scenes
      </span>
      <fc-tooltip text="This and that content will be skipped">
        <v-icon color="blue" small>mdi-information</v-icon>
      </fc-tooltip>
    </div>
    <!--<div v-else>
      <scenes-viewer v-model="data.scenes"></scenes-viewer>
    </div>-->

      <!-- Shield -->

      <!--<v-btn text small class="no-uppercase">
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
      </v-btn>-->

      <!--<v-btn @click="sendMessage({ msg: 'play-pause' })" text small>
        <v-icon fab>mdi-play</v-icon>Play/Pause
      </v-btn>-->


      <!-- Shield dialog
      <shield-vue :visible="shield_visible" @hide="shield_visible = false"></shield-vue>-->

      <v-snackbar top right v-model="snackbar" :timeout="snackbarTimeout" color="info">{{
        snackbarText
      }}</v-snackbar>
  </div>
</template>

<script>
/*import ScenesViewer from '../components/ScenesViewer'
import ShieldVue from '../components/Shield.vue'*/
import fclib from '../js/fclib'
var raw = require('../js/raw_tags')
export default {
  name: 'Home',
  /*components: {
    //ScenesViewer,
    ShieldVue
  },*/

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
          if (!response.settings.username) {
            return this.$router.push('/settings')
          }
          return this.$router.push('/editor')
        } else if (!response) {
          return this.$router.push('/wrongsite')
        } else if (!response.settings || !response.scenes) {
          return this.$router.push('/no-movie')
        }

        this.sendMessage({ msg: 'pause' })
        this.username = response.settings.username

        /*if (firstTime) {
          
          response.scenes.sort(function(a, b) {
            //make sure default scenes are shown first, and the rest sorted by start time
            if (a.default_skip && !b.default_skip) return -1
            if (!a.default_skip && b.default_skip) return 1
            return a.start - b.start
          })
        }*/

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
.menu {
  position: absolute;
  top: 15px;
  right: 15px;
}

.menu > span {
  cursor: pointer;
  padding: 5px;
}

.section{
  text-transform: uppercase;
}

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

.sliders {
  display: grid;
  padding: 10px;
  grid-template-columns: 80px 220px;
  grid-column-gap: 15px;
  grid-row-gap: 15px;
}

.slider {
  -webkit-appearance: none;
  width: 100%;
  height: 10px;
  border-radius: 5px;
  background: #d3d3d3;
  outline: none;
  opacity: 0.7;
  -webkit-transition: 0.2s;
  transition: opacity 0.2s;
}

.slider:hover {
  opacity: 1;
}

.sliderticks {
  display: flex;
  justify-content: space-between;
  padding: 0 10px;
}

.sliderticks p {
  white-space: nowrap;
  position: relative;
  display: flex;
  justify-content: center;
  text-align: center;
  width: 1px;
  background: #d3d3d3;
  height: 5px;
  line-height: 40px;
  margin: 0 0 20px 0;
  font-size: 11px;
}
</style>

<style lang="scss" scoped>
@import '/v0/popup.css';
</style>
