<template>
  <div>
    <!--<h3>Auto filtered</h3>-->

    <!-- this is a dialog used for new scenes only. Rest of the time is hidden -->
    <tags-wizard
      :tags="new_scene_tags"
      v-model="new_scene_wizard"
      @change="newSceneTagsChange"
    ></tags-wizard>

    <div v-if="zero_scenes">
      <br />
      <!-- br as temp fix -->
      <p style="font-size:110%">No filters for this film. Be the first one to add one!</p>
    </div>
    <div v-else>
      <scenes-editor v-model="data.scenes"></scenes-editor>
    </div>
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

    <v-footer fixed color="white" dense>
      <!-- New scene button-->
      <v-tooltip top>
        <template v-slot:activator="{ on, attrs }">
          <v-btn
            color="black"
            @click="markCurrentTime()"
            text
            small
            class="no-uppercase"
            v-bind="attrs"
            v-on="on"
          >
            <div v-if="isCreatingScene == false"><v-icon>mdi-plus</v-icon>New filter</div>
            <div v-else><v-icon>mdi-check</v-icon>End Filter</div>
          </v-btn>
        </template>
        <span>(Ctrl+Shift+L)</span> </v-tooltip
      >|
      <!-- Play/Pause button -->
      <v-btn
        color="black"
        @click="sendMessage({ msg: 'play-pause' })"
        text
        small
        class="no-uppercase"
      >
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
      <v-snackbar top right v-model="snackbar" :timeout="snackbarTimeout" color="info">{{
        snackbarText
      }}</v-snackbar>
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
  data() {
    return {
      data: { msg: '', scenes: [], settings: [] }, //default values, to avoid missing keys
      zero_scenes: false,
      auxx: '',
      snackbarText: '',
      snackbar: false,
      snackbarTimeout: 6000,
      isCreatingScene: false,

      //when adding a new scene:

      new_scene_wizard: false,
      new_scene_tags: [],
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
      console.log('updating tags in new scene -> careful, we use INDEX!!!')

      //make a copy of the scene with the changes:
      var new_scene = this.data.scenes[this.new_scene_index]
      new_scene.tags = tagsSoFar

      //send this new scene
      this.sendMessage({ msg: 'update-scene', scene: new_scene, field: 'tags' }, response => {
        console.log('update-scene', response)
        //if response is success, then NOW  we apply the change to the UI
        if (response.success) {
          this.data.scenes[this.new_scene_index].tags = tagsSoFar //apply the change to the main OBJECT
        }
      })
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
          this.new_scene_tags = []
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
          this.getData(false)
        }
        sendResponse(true)
      })
    },
    getData(firstTime) {
      this.sendMessage({ msg: 'get-data' }, response => {
        console.log('data-received', response)

        if (!response) {
          this.$router.push('/about')
        } else if (!response.settings || !response.scenes) {
          this.$router.push('/no-movie')
        }

        /* careful: when adding a new scene, this makes it hard to identify it (now instead of going at the end, it appears in position xx)
         
*/
        if (firstTime) {
          response.scenes.sort(function(a, b) {
            //make sure default scenes are shown first, and the rest sorted by start time
            if (a.default_skip && !b.default_skip) return -1
            if (!a.default_skip && b.default_skip) return 1
            return a.start - b.start
          })
        }

        this.data = response

        this.sliderValue = response.settings.blur_level
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

<style lang="scss" scoped>
.no-uppercase {
  text-transform: none;
}
</style>
