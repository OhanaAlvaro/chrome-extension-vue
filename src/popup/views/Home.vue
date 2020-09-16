<template>
  <div>
    <h1>Auto filtered</h1>
    <scenes-editor :scenes="data.scenes"></scenes-editor>

    <br />
    <br />
    <h1>Other scenes</h1>
    <scenes-editor :scenes="data.scenes"></scenes-editor>

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

    <v-btn color="success" @click="sendMessage({ msg: 'play-pause' })">Play/Pause</v-btn>
  </div>
</template>

<script>
import ScenesEditor from '../components/ScenesEditor'

import fclib from '../js/fclib'
export default {
  name: 'Home',
  components: {
    ScenesEditor
  },
  data() {
    return {
      data: { msg: '', scenes: [], settings: [] } //default values, to avoid missing keys
    }
  },

  methods: {
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
    //Let's get the data as soon as mounted
    this.sendMessage({ msg: 'get-data' }, response => {
      console.log('data-received', response)
      this.data = response
    })
  }
}
</script>

<style lang="scss" scoped></style>
