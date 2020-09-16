<template>
  <div>
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

              <v-btn color="gray" icon small @click="sendMessage({ msg: 'remove', id: scene.id })">
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
import TagsEditor from '../components/TagsEditor'

export default {
  components: {
    TimeEditor,
    TagsEditor
  },
  props: {
    scenes: {
      type: Array,
      default: function() {
        return []
      }
    }
  },
  data() {
    return {
      data: { msg: '', scenes: [], settings: [] },
      tags_wizard: false,
      dialog: false,
      tags_aux: []
    }
  },

  methods: {
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
  },
  mounted() {
    /*
    this.sendMessage({ msg: 'get-data' }, response => {
      this.data = response
    })
    */
  }
}
</script>

<style lang="scss" scoped>
@import '/v0/popup.css';
@import '/v0/multichip.css';
</style>
