<template>
  <div>
    <v-dialog v-model="visible" width="500" max-width="100%" persistent fullscreen>
      <!-- feel free to test adding fullscreen prop on the dialog :) -->
      <v-card>
        <v-card-title primary-title>
          <h2>Scene editor</h2>
        </v-card-title>
        <v-card-text>
          <br />

          <h3>Describe the scene</h3>
          <v-select small label="Category" v-model="scene.category" :items="categories"></v-select>

          <v-select label="Severity" v-model="scene.severity" :items="severities"></v-select>

          <v-select
            v-model="scene.context"
            :items="context"
            attach
            chips
            label="Context"
            multiple
          ></v-select>

          <v-textarea label="Comments" v-model="scene.comments" auto-grow rows="2" row-height="15"></v-textarea>

          <!-- -->
          <br />
          <div style="display: flex;">
            <h3 style="margin: auto 0;">Fine tune the times</h3>
            <v-btn text @click="sendMessage({ msg: 'preview', scene: scene })">
              Preview
            </v-btn>
          </div>

          <div style="display: flex;">
            <span style="margin: auto 0;">Start</span>
            <time-editor v-model="scene.start" @change="seekFrame(scene.start)"></time-editor>
            <v-btn text small>Now</v-btn>
            <v-btn text small @click="seekFrame(scene.start)">Go</v-btn>
          </div>
          <div style="display: flex;">
            <span style="margin: auto 0;">End</span>
            <time-editor v-model="scene.end" @change="seekFrame(scene.end)"></time-editor>
            <v-btn text small>Now</v-btn>
            <v-btn text small @click="seekFrame(scene.end)">Go</v-btn>
          </div>

          <v-btn @click="seekForward(-5000)" class="no-uppercase" text small>
            -5s
          </v-btn>

          <v-btn @click="seekForward(-50)" class="no-uppercase" text small>
            -1
          </v-btn>

          <v-btn @click="sendMessage({ msg: 'play-pause' })" text small>
            <v-icon fab>mdi-play-pause</v-icon>
          </v-btn>

          <v-btn @click="seekForward(50)" class="no-uppercase" text small>
            +1
          </v-btn>

          <v-btn @click="seekForward(5000)" class="no-uppercase" text small>
            +5s
          </v-btn>

          <br>
          <br>

          <h3>Editor's safety</h3>

          <div style="display: flex;">
            <!-- Mute video while marking scene-->
            <v-checkbox
            style="margin: auto 0px;"
              v-model="mute_on_mark"
              :label="`Mute`"
              @change="changeMute"
            ></v-checkbox>
            <!-- Blur slider: allow user to control the blur right from here -->
            <v-slider
            style="margin: auto 0px;"
              v-model="sliderValue"
              inverse-label
              :min="0"
              :max="40"
              thumb-label
              :label="`Blur`"
              step="2"
              @change="changeBlur"
            >
              <template v-slot:thumb-label="{ value }">{{ 2.5 * value + '%' }}</template>
            </v-slider>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>

          <v-btn text small @click="removeScene()">
            Remove
          </v-btn>

          <v-btn text small @click="cancel()">
            Cancel
          </v-btn>
          <v-btn text small @click="save()">
            Save
          </v-btn>
          <v-btn color="primary" small text @click="save()">
            Publish
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import fclib from '../js/fclib'
import TimeEditor from '../components/TimeEditor.vue'
var raw = require('../js/raw_tags')
export default {
  components: {
    TimeEditor
  },
  props: {
    visible: {
      //here v-model is for whether or not this should be visible or not.
      type: Boolean,
      default: false
    },
    scene: {
      type: Object,
      default() {
        return { tags: [], start: 0, end: 0, id: '' }
      }
    }
  },

  data() {
    return {
      categories: ['Sex & Nudity', 'Violence', 'Profanity'],
      severities: ['Slight', 'Mild', 'Severe'],
      context: ['No consent', 'Unloving/objectifying', 'Non-procreative', 'Infidelity'],
      sliderValue: 4,
      mute_on_mark: false
    }
  },

  methods: {
    hide(){
      this.visible = false
      this.$emit('hide') // Not sure why/if this is needed
    },
    cancel() {
      this.hide()
    },
    save() {
      this.sendMessage({ msg: 'update-scene', scene: this.scene, field: 'all' })
      this.hide()
    },
    removeScene() {
      this.sendMessage({ msg: 'remove', id: this.scene.id })
      this.hide()
    },
    seekForward(diff) {
      this.sendMessage({ msg: 'seek-diff', diff: diff })
    },
    seekFrame(time){
      this.sendMessage({ msg: 'seek-frame', time: time })
    },
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

<style lang="scss" scoped></style>
