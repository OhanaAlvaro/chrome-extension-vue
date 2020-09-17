<template>
  <div>
    <v-btn color="success" @click="wizardVisible = !wizardVisible">showWizard</v-btn>
    <v-btn color="success" @click="tags_aux = { tags: ['Other'] }">reset tags-aux</v-btn>

    <div id="scenesEditor" style="margin-top: 15px">
      <table id="table" width="100%">
        <thead>
          <tr>
            <th>Skip</th>
            <th>Start time</th>
            <th>End time</th>
            <th>Tags</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="scene in scenes" :key="scene.id">
            <!-- Skip -->
            <td>
              <input type="checkbox" v-model="scene.skip" @change="updateScene(scene, 'skip')" />
            </td>

            <!-- Start Time -->
            <td>
              <time-editor v-model="scene.start" @change="updateScene(scene, 'start')"></time-editor>
            </td>

            <!-- End Time -->
            <td>
              <time-editor v-model="scene.end" @change="updateScene(scene, 'end')"></time-editor>
            </td>

            <!-- Tags -->
            <td style="width:300px">
              <tags-editor v-model="scene.tags" @change="updateScene(scene, 'tags')"></tags-editor>
            </td>

            <!-- ACTIONS -->
            <td>
              <v-btn color="gray" small icon @click="sendMessage({ msg: 'preview', id: scene.id })">
                <v-icon>mdi-eye</v-icon>
              </v-btn>

              <v-btn color="gray" icon small @click="removeScene(scene)">
                <v-icon>mdi-delete</v-icon>
              </v-btn>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
var fclib = require('../js/fclib')

import TimeEditor from './TimeEditor'
import TagsEditor from './TagsEditor'

export default {
  components: {
    TimeEditor,
    TagsEditor
  },

  props: {
    value: {
      //array with the scenes (data.scenes in the parent)
      type: Array,
      default: function() {
        return []
      }
    }
  },

  watch: {
    value: {
      deep: true,
      handler(newValue) {
        this.scenes = newValue
      }
    },
    scenes: {
      deep: true,
      handler(newValue) {
        this.$emit('input', newValue)
        this.$emit('change', newValue)
      }
    }
  },

  data() {
    return {
      tags_aux: { tags: ['Sex/Nudity', 'Violence', 'Cruelty'] },
      scenes: [],
      dialog: false,
      wizardVisible: false
    }
  },

  methods: {
    removeScene(scene) {
      this.sendMessage({ msg: 'remove', id: scene.id }, response => {
        //should check response to confirm it was removed...?
        for (var i = 0; i < this.scenes.length; i++) {
          if (this.scenes[i].id == scene.id) {
            this.scenes.splice(i, 1)
          }
        }
      })
    },
    updateScene(scene, field) {
      //console.log('shall update scene', scene, field)
      this.sendMessage({ msg: 'update-scene', scene: scene, field: field })
    },
    sendMessage(msg, callback) {
      console.log('[sendMessage]: ', msg)
      chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
        chrome.tabs.sendMessage(tabs[0].id, msg, function(response) {
          if (callback) callback(response)
        })
      })
    }
  }
}
</script>

<style lang="scss" scoped>
@import '/v0/popup.css';
@import '/v0/multichip.css';
</style>
