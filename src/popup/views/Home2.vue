<template>
  <div style="min-width: 300px;">
    <div>
      <h2>What do you want to skip?</h2>

      <span class="menu">
        <span @click="go2Login()">
          <v-icon small>mdi-account</v-icon>
        </span>

        <!--ADD  window.close(); to close popup (beware you will have to make the windows object accessible to within vue)-->
        <span @click="sendMessage({ msg: 'show-sidebar' })">
          <v-icon small>mdi-pencil</v-icon>
        </span>

        <span>
          <v-icon small @click="$router.push('/login')">mdi-cog</v-icon>
        </span>
      </span>
    </div>
    <br />

    <div id="alex-dropdowns">
      <div v-for="(cat, index) in tags" :key="index">
        <v-select dense :label="cat.title" :items="ticks" style="margin-bottom: 0px">
          <template
            v-slot:item="{
              parent,
              item
            }"
          >
            <fc-tooltip
              position="bottom"
              :text="'There are ' + Math.floor(Math.random() * 11) + ' filters'"
            >
              {{ item }}
            </fc-tooltip>
            <v-spacer></v-spacer>
            <span style="font-size: 9px; color: gray">{{
              '(' + Math.floor(Math.random() * 11) + ' filters)'
            }}</span>

            <!--
            <v-spacer></v-spacer>

            <fc-tooltip position="left" :text="'We are good to go'">
              <v-icon small color="error" v-if="Math.floor(Math.random() * 11) < 1"
                >mdi-alert-box</v-icon
              >
              <v-icon small color="success" v-else-if="Math.floor(Math.random() * 11) < 8"
                >mdi-checkbox-marked</v-icon
              >
              <v-icon small v-else color="orange">mdi-help-box</v-icon>
            </fc-tooltip>
            -->
          </template>
          <!--
          <template v-slot:message="{ message, key }">
            <span style="color: green; font-size: 10px"
              >All good, we will skip {{ Math.round(Math.random(0, 10), 2) * 100 }} scenes!</span
            >
          </template>-->

          <template v-slot:append-outer>
            <div>
              <v-chip x-small dark color="green">
                {{ Math.floor(Math.random() * 11) }} filters
              </v-chip>
            </div>
          </template>
        </v-select>
      </div>
    </div>

    <div align="left" justify="center" style="width:300px">
      <span v-if="data.shield == `done`">
        <b style="color: #00b359">Grab some popcorn and enjoy!</b> We will skip all unwanted scenes
      </span>
      <span v-if="data.shield == `unkown` && false">
        <b style="color: orangered">Careful!</b> We might not be able to skip all unwanted scenes
      </span>
      <span v-if="!data.hasFilm">
        <b style="color: red">No movie!</b> Open a specific movie/show to start using Family Cinema.
        If you've already opened a movie, try refreshing the page.
      </span>
    </div>

    <div>
      <v-row>
        <v-col>
          <v-btn color="black" dark block dense depressed tile>Report an error</v-btn>
        </v-col>
        <v-col>
          <v-btn color="primary" block dense depressed tile>Donate</v-btn>
        </v-col>
      </v-row>

      <v-row>
        <v-col style="padding-top: 0px; padding-bottom: 0px">
          <v-btn color="success" block dense depressed tile>Watch</v-btn>
        </v-col>
      </v-row>
    </div>

    <v-snackbar top right v-model="snackbar" :timeout="snackbarTimeout" color="info">{{
      snackbarText
    }}</v-snackbar>
  </div>
</template>

<script>
/*import ScenesViewer from '../components/ScenesViewer'
import ShieldVue from '../components/Shield.vue'*/
import fclib from '../js/fclib'

var raw = require('../js/raw_tags.js')

var raw2 = require('../js/tags_v2.js')
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

      tags: [],
      ticks: [
        "Don't skip",
        'Skip Severe only',
        'Skip Severe and Mild',
        'Skip Severe, Mild, and Moderate'
      ]
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
    }
  },
  created() {
    this.tags = raw2.tags
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

.v-select__selection {
  font-size: 12px;
}

/*
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
}*/
</style>

<style lang="scss" scoped>
@import '/css/popup.css';
</style>
