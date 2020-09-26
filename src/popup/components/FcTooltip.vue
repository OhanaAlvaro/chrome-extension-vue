<template>
  <!-- note: not returning a div, so this stays inline-->
  <v-tooltip top color="black">
    <template v-slot:activator="{ on, attrs }">
      <v-icon :color="color" dark v-bind="attrs" v-on="on" small class="pb-1">{{ icon }}</v-icon>
    </template>

    <slot>
      <!-- by using <fc-tooltip>xxxx</fc-tooltip>, xxxx will be set here -->
    </slot>
  </v-tooltip>
</template>

<script>
export default {
  props: {
    icon: {
      type: String,
      default: 'mdi-information'
    },
    color: {
      type: String,
      default: 'info'
    }
  }
}
</script>

<style lang="scss" scoped>
* {
  font-size: 11px;
}
</style>
