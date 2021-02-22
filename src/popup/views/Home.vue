<template>
  <div style="min-width: 300px;">
    <div>
      <h2>What do you want to skip?</h2>
      <span class="menu">
        <span @click="go2Login()">
          <v-icon small>mdi-account</v-icon>
        </span>
        <span @click="showSidebar">
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
      <select>
        <option v-for="tick in ticks" v-bind:key="tick">
          {{ tick }}
        </option>
      </select>
      <span class="section">
        Violence
      </span>
      <select>
        <option v-for="tick in ticks" v-bind:key="tick">
          {{ tick }}
        </option>
      </select>

      <span class="section">
        Profanity
      </span>
      <select>
        <option v-for="tick in ticks" v-bind:key="tick">
          {{ tick }}
        </option>
      </select>

      <!--<span class="section">Profanity</span>
      <div class="range">
        <input type="range" min="0" max="4" value="1" class="slider" />
        <div class="sliderticks">
          <p>Watch All</p>
          <p></p>
          <p></p>
          <p></p>
          <p>Skip All</p>
        </div>
      </div>-->
    </div>

    <br />
    <div align="center" justify="center" style="width:300px">
      <span v-if="data.shield == `done`">
        <b style="color: #00b359">Grab some popcorn and enjoy!</b> We will skip all unwanted scenes
      </span>
      <span v-if="data.shield == `unkown` && false">
        <b style="color: orangered">Careful!</b> We might not be able to skip all unwanted scenes
      </span>
      <span v-if="!data.hasFilm">
        <b style="color: red">No movie!</b> Open a specific movie/show to start using Ohana. If you've already opened a movie, try refreshing the page.
      </span>
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

  props: {
    data: Object
  },

  computed: {
    extensionName() {
      return browser.i18n.getMessage('extName')
    }
  },

  data() {
    return {
      snackbarText: '',
      snackbar: false,
      snackbarTimeout: 6000,

      ticks: ['All', 'Slight & Moderate & Severe', 'Moderate & Severe', 'Severe', 'Nothing']
    }
  },

  methods: {
    go2Login() {
      if (this.$route.name == 'Login') {
        this.$router.go(-1) //go back to whatever route we were before :)  | (just in case at some point we have more than Home/Login)
      } else {
        this.$router.push('/login')
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
    getTagColor(value) {
      var color_value = 'gray' //default
      raw.content.forEach(item => {
        if (item.value == value) {
          color_value = item.color
        }
      })
      return color_value
    },
    showSidebar(){
      this.sendMessage({ msg: 'show-sidebar', show: true });
      window.close()
    }
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

.section {
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

select {
  border-bottom: 1px dashed #555 !important;
  width: 100%;
  outline: none;
}
</style>

<style lang="scss" scoped>
@import '/css/popup.css';
</style>
