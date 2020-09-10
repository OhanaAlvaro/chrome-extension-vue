<template>
  <div>
    <options-page></options-page>
  </div>
</template>

<script>
import OptionsPage from '@/components/OptionsPage.vue'

export default {
  name: 'Options',
  components: { OptionsPage }
}
</script>

<style>
html {
  width: 400px;
  height: 400px;
}
</style>
