<template>
  <div>
    <!--<h3>Auto filtered</h3>-->

    <!-- this is used for new scenes (wip) -->

    <tags-wizard :tags="new_scene_tags" v-model="new_scene_wizard" @change="newSceneTagsChange"></tags-wizard>

    <scenes-editor v-model="data.scenes"></scenes-editor>

    <!--
    <br />
    <br />

    
    <h1>Other scenes</h1>
    <scenes-editor v-model="data.scenes"></scenes-editor>
    -->

    <br />
    <br />
    <br />
    <br />
    <hr />
    <v-footer fixed color="white" dense>
      <!-- New scene button-->
      <v-tooltip top>
        <template v-slot:activator="{ on, attrs }">
          <v-btn
            color="black"
            @click="markCurrentTime()"
            text
            class="no-uppercase"
            v-bind="attrs"
            v-on="on"
          >
            <div v-if="isCreatingScene == false">
              <v-icon>mdi-plus</v-icon>New filter
            </div>
            <div v-else>
              <v-icon>mdi-check</v-icon>End Filter
            </div>
          </v-btn>
        </template>
        <span>(Ctrl+Shift+L)</span>
      </v-tooltip>|
      <!-- Play/Pause button -->
      <v-btn color="black" @click="sendMessage({ msg: 'play-pause' })" text class="no-uppercase">
        <v-icon fab>mdi-play</v-icon>Play/Pause
      </v-btn>
      <v-spacer></v-spacer>

      <!-- Blur slider -->
      <!--
      <v-slider v-model="sliderValue" :min="0" :max="100" thumb-label step="5" @change="changeBlur">
        <template v-slot:thumb-label="{ value }">{{ value + '%' }}</template>
      </v-slider>
      -->

      <!-- Shield -->
      <span class="inline large-action tooltip" style="float: right; padding-right: 15px">
        <div>
          <img src="v0/img/verified.svg" />
        </div>
        <div>Unkown</div>
        <span class="tooltiptext" style="margin-left: -55px">Some content might be untagged</span>
      </span>
      <br />
      <v-snackbar
        top
        right
        v-model="snackbar"
        :timeout="snackbarTimeout"
        color="info"
      >{{ snackbarText }}</v-snackbar>
    </v-footer>
  </div>
</template>

<script>
import ScenesEditor from '../components/ScenesEditor'
import TagsWizard from '../components/TagsWizard'

import fclib from '../js/fclib'
export default {
  name: 'Home',
  components: {
    ScenesEditor,
    TagsWizard
  },
  data() {
    return {
      data: { msg: '', scenes: [], settings: [] }, //default values, to avoid missing keys
      auxx: '',
      snackbarText: '',
      snackbar: false,
      snackbarTimeout: 6000,
      isCreatingScene: false,

      //when adding a new scene:

      new_scene_wizard: false,
      new_scene_tags: ['pending'],
      new_scene_index: 0,

      //slider
      sliderValue: 0
    }
  },

  methods: {
    //slider_
    changeBlur(newValue) {
      var oldValue = this.data.settings.blur_level
      console.log('change blur', newValue, oldValue)

      this.data.settings.blur_level = newValue

      this.sendMessage({ msg: 'update-settings', settings: this.data.settings }, response => {
        console.log('save settings response', response)
        if (response == false) {
          this.sliderValue = oldValue
          this.data.settings.blur_level = oldValue
        }
      })
    },

    //New Scene
    newSceneTagsChange(tagsSoFar) {
      this.data.scenes[this.new_scene_index].tags = tagsSoFar
    },
    markCurrentTime() {
      this.sendMessage({ msg: 'mark-current-time' }, response => {
        console.log(response)
        if (response && response.scene) {
          //scene created successfully (tbc: was it sent to the server before the response?)
          var msg = [
            'Wow! Did you just do that? Thank your for adding a new scene!',
            'You are absolutely awesome!',
            'Thank you!',
            'The world would be a better place if everyone was like you!'
          ]
          this.snackbarText = msg[Math.floor(Math.random() * msg.length)]
          this.snackbar = true
          this.data.scenes.push(response.scene)
          this.sendMessage({ msg: 'pause' })
          this.isCreatingScene = false

          //handle tags for new scene
          this.new_scene_tags = ['pending']
          this.new_scene_wizard = true
          this.new_scene_index = this.data.scenes.length - 1
        } else {
          //Begin of scene:
          this.isCreatingScene = true
          console.log('[mark-current-time] No scene, assuming start')
          this.snackbarText = 'Press again to mark the end of the scene'
          this.snackbar = true
        }
      })
    },

    //Generic methods:
    sendMessage(msg, callback) {
      console.log('[sendMessage]: ', msg)
      chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
        chrome.tabs.sendMessage(tabs[0].id, msg, function(response) {
          if (callback) callback(response)
        })
      })
    },
    listenToMessages() {
      chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        console.log('[listen-HOME] Received request: ', request)
        if (request.msg == 'new-data') {
          this.getData()
        }
        sendResponse(true)
      })
    },
    getData() {
      this.sendMessage({ msg: 'get-data' }, response => {
        console.log('data-received', response)
        this.data = response

        if (!response) {
          this.$router.push('/about')
        } else if (!response.settings || !response.scenes) {
          this.$router.push('/no-movie')
        }
        this.sliderValue = response.settings.blur_level
      })
    }
  },

  mounted() {
    //Let's get the data as soon as mounted
    this.getData()
    this.listenToMessages()
  }
}
</script>

<style lang="scss" scoped>
.no-uppercase {
  text-transform: none;
}
</style>
