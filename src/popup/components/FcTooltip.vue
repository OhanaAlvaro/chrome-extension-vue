<template>
  <!-- note: not returning a div, so this stays inline-->
  <v-tooltip top color="black">
    <template v-slot:activator="{ on, attrs }">
      <v-icon color="primary" dark v-bind="attrs" v-on="on" small class="pb-1">{{ icon }}</v-icon>
    </template>
    <span style="font-size:90%;" v-html="text"></span>
  </v-tooltip>
</template>

<script>
export default {
  props: {
    text: {
      type: String,
      default: ''
    },
    icon: {
      type: String,
      default: 'mdi-information'
    }
  }
}
</script>

<style lang="scss" scoped></style>
