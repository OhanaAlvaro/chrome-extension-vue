<template>
  <div>
    <h3>DEPRECATED ROOT COMPONENT - Hello World Component</h3>
    <p>{{ defaultText }}</p>
    <span>...end of hello-world component</span>
  </div>
</template>

<script>
export default {
  name: 'HelloWorld',
  mounted() {
    browser.runtime.sendMessage({})
  },
  computed: {
    defaultText() {
      return browser.i18n.getMessage('extName')
    }
  }
}
</script>

<style scoped>
p {
  font-size: 20px;
}
</style>
