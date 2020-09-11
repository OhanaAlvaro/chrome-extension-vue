<template>
  <div>
    <h2>Scene Editor</h2>
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

        <tr v-for="scene in data.scenes" :key="scene.id">
          <p>{{ scene.start }}</p>
          <td>
            <time-editor v-model="scene.start"></time-editor>
            <input type="checkbox" :value="scene.skip" @change="updateScene(scene)" />
          </td>
          <td>
            <input type="time" step="0.050" v-model="scene.start" />
          </td>
          <td>
            <input type="time" step="0.050" :value="ms2time(scene.end)" />
          </td>
          <td style="width:300px">
            <div class="chip-input"></div>
          </td>
          <td>
            <img class="action" src="v0/img/preview.svg" />
            <img class="action" src="v0/img/delete.svg" />
          </td>
        </tr>
        <tbody></tbody>
      </table>
      <div class="controller">
        <span class="inline large-action tooltip" id="markCurrentTime">
          <div>
            <img src="v0/img/add.svg" />
          </div>
          <div>New filter</div>
          <span class="tooltiptext">(Ctrl+Shift+L)</span>
        </span>
        <span class="inline large-action" id="playPause">
          <div>
            <img src="v0/img/play.svg" />
          </div>
          <div>Play/Pause</div>
        </span>
        <h4 id="noscenes" style="width: 420px" class="inline-center"></h4>
        <span class="inline large-action tooltip" style="float: right; padding-right: 15px">
          <div>
            <img src="v0/img/verified.svg" />
          </div>
          <div>Unkown</div>
          <span class="tooltiptext" style="margin-left: -55px">Some content might be untagged</span>
        </span>
      </div>
    </div>
  </div>
</template>

<script>
var fclib = require('../js/fclib')
import TimeEditor from './TimeEditor'

export default {
  components: {
    TimeEditor
  },
  data() {
    return {
      data: { msg: '', scenes: [], settings: [] }
    }
  },

  methods: {
    ms2time(time) {
      return fclib.ms2time(time)
    },
    updateScene(scene) {
      console.log('update-sceneee', scene)
    },
    sendMessage(msg, callback) {
      console.log('[sendMessage]: ', msg)
      chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
        chrome.tabs.sendMessage(tabs[0].id, msg, function(response) {
          if (callback) callback(response)
        })
      })
    },
    changeData(newValue) {
      emitData()
    },
    emitData(value) {
      this.$emit('input', value)
    }
  },
  mounted() {
    this.sendMessage({ msg: 'get-data' }, response => {
      this.data = response
    })
  }
}
</script>

<style lang="scss" scoped>
@import '/v0/popup.css';
@import '/v0/multichip.css';
</style>
