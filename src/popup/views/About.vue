<template>
  <div>
    <h1>This is the popup about page</h1>
  </div>
</template>

<script>
export default {
  methods: {
    speak(msg) {
      chrome.runtime.sendMessage(msg, function(response) {
        console.log('[speak] response: ', response)
      })
    }
  },
  mounted() {
    this.speak('kaixo theeeeere')
  }
}
</script>

<style lang="scss" scoped></style>
