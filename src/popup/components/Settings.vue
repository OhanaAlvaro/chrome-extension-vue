<template>
  <div>
    <div id="settings" class="hidden">
      <h4 style="margin: 10 5 5 5px">Default filters:</h4>
      <div class="inline chip-input" id="defaultFilters"></div>
      <h4 style="margin: 10 5 5 5px">Advanced settings:</h4>
      <textarea id="options" rows="10" spellcheck="false"></textarea>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Settings'
}
</script>

<style lang="scss" scoped></style>
