<template>
  <div>
    <h1>Alex test</h1>

    <v-btn color="success" @click="togglePlay()">togglePlay</v-btn>
    <v-btn color="success" @click="loadData()">loadData</v-btn>

    <scenes-editor :scenes="data.scenes"></scenes-editor>
  </div>
</template>

<script>
import ScenesEditor from '../components/ScenesEditor'
export default {
  name: 'Home',
  name: 'App',
  components: {
    ScenesEditor
  },
  data() {
    return {
      data: { msg: 'kaixo', scenes: [], settings: [] }
    }
  },
  methods: {
    togglePlay() {
      //var data = { msg: 'update-badge', numDisplayedScenes: 34 }
      var data2 = { msg: 'play-pause' }

      this.sendMessage(data2, function(response) {
        console.log('Alex play-pause!', response)
      })
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
    this.sendMessage({ msg: 'get-data' }, response => {
      this.data = response
    })
  }
}
</script>

<style lang="scss" scoped></style>
