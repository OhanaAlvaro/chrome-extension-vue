<template>
  <div class="size-wrapper">
    <div>
      <h2>Create new filters</h2>
      <span class="menu">
        <span @click="go2Login()">
          <v-icon small>mdi-account</v-icon>
        </span>
      </span>
    </div>

    <!-- this is a dialog used for new scenes only. Rest of the time it's hidden -->
    <!-- existing scenes use the wizard from the scenes editor-->
    <tags-wizard
      :tags="new_scene_tags"
      v-model="new_scene_wizard"
      @change="newSceneTagsChange"
    ></tags-wizard>

    <div v-if="zero_scenes" align="center" justify="center" style="width:100%">
      <br /><br /><br /><br /><br />
      No filters for this film. Be the first one to add one!
    </div>
    <div v-else>
      <scenes-editor v-model="data.scenes"></scenes-editor>
    </div>

    <v-btn text small @click="shield_visible = !shield_visible">
      <fc-tooltip text="Click to define filter status">
        <v-icon>mdi-shield-half-full</v-icon>Filter status
      </fc-tooltip>
    </v-btn>

    <!-- New scene button-->

    <fc-tooltip text="(Alt+N)">
      <v-btn color="black" @click="markCurrentTime()" text small>
        <div v-if="isCreatingScene == false"><v-icon>mdi-plus</v-icon>New filter</div>
        <div v-else><v-icon>mdi-check</v-icon>End Filter</div>
      </v-btn>
    </fc-tooltip>

    <!-- Shield dialog -->
    <shield-vue :visible="shield_visible" @hide="shield_visible = false"></shield-vue>

    <div id="bottom">
      <h3>Player controls</h3>
      <!-- Play/Pause button -->

      <v-btn
        @click="sendMessage({ msg: 'seek-diff', diff: -5000 })"
        class="no-uppercase"
        text
        small
      >
        -5s
      </v-btn>

      <v-btn @click="sendMessage({ msg: 'play-pause' })" text small>
        <v-icon fab>mdi-play</v-icon>Play/Pause
      </v-btn>

      <v-btn @click="sendMessage({ msg: 'seek-diff', diff: 5000 })" class="no-uppercase" text small>
        +5s
      </v-btn>

      <div style="display: flex;">
        <!-- Mute video while marking scene-->
        <v-checkbox
          v-model="mute_on_mark"
          :label="`Mute on mark`"
          @change="changeMute"
        ></v-checkbox>
        <!-- Blur slider: allow user to control the blur right from here -->
        <v-slider
          v-model="sliderValue"
          inverse-label
          :min="0"
          :max="40"
          thumb-label
          :label="`Blur on mark`"
          step="2"
          @change="changeBlur"
        >
          <template v-slot:thumb-label="{ value }">{{ 2.5 * value + '%' }}</template>
        </v-slider>
      </div>

      <v-snackbar top right v-model="snackbar" :timeout="snackbarTimeout" color="info">{{
        snackbarText
      }}</v-snackbar>
    </div>
  </div>
</template>

<script>
import ScenesEditor from '../components/ScenesEditor'
import ShieldVue from '../components/Shield.vue'
import TagsWizard from '../components/TagsWizard'

import fclib from '../js/fclib'
export default {
  name: 'Editor',
  components: {
    ScenesEditor,
    TagsWizard,
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
  data() {
    return {
      zero_scenes: false,
      auxx: '',
      snackbarText: '',
      snackbar: false,
      snackbarTimeout: 6000,
      isCreatingScene: false,
      isEditing: false,

      //when adding a new scene:

      new_scene_wizard: false,
      new_scene_tags: [],
      new_scene_index: 0,

      //shield
      shield_visible: false
    }
  },

  props: {
    data: Object
  },

  computed: {
    sliderValue() {
      return this.data.settings.blur_level
    },
    mute_on_mark() {
      return this.data.settings.mute_on_mark
    },
    scenes() {
      return this.data.scenes
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

      this.sendMessage({ msg: 'blur', blur_level: newValue }, response => {
        console.log('blur response', response)
      })
    },

    changeMute(newValue) {
      console.log('change mute', this.mute_on_mark)

      this.data.settings.mute_on_mark = this.mute_on_mark

      this.sendMessage({ msg: 'update-settings', settings: this.data.settings }, response => {
        console.log('save settings response', response)
        if (response == false) {
          this.mute_on_mark = oldValue
          this.data.settings.mute_on_mark = oldValue
        }
      })

      this.sendMessage({ msg: 'mute', state: this.mute_on_mark }, response => {
        console.log('mute: ', response)
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
          //this.snackbarText = msg[Math.floor(Math.random() * msg.length)]
          this.snackbar = false // Hide any previous snackbar
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
          this.isEditing = true
          console.log('[mark-current-time] No scene, assuming start')
          this.snackbarText = 'Press again to mark the end of the scene'
          this.snackbar = true
        }
      })
    },

    //Generic methods:
    sendMessage(msg, callback) {
      console.log('[sendMessage-Editor]: ', msg)
      chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
        chrome.tabs.sendMessage(tabs[0].id, msg, function(response) {
          if (callback) callback(response)
        })
      })
    }
  }
}
</script>

<style scoped>
.size-wrapper {
  height: 96vh;
  width: 100vw -20px;
}

.no-uppercase {
  text-transform: none;
}

.bordered {
  border-style: solid;
  padding: 6px;
  border-width: 1px;
  width: 100%;
}

#bottom {
  position: absolute;
  width: 90%;
  bottom: 10px;
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
