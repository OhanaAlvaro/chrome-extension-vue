<template>
  <!-- note: not returning a div, so this stays inline-->
  <v-tooltip top color="black">
    <template v-slot:activator="{ on, attrs }">
      <span v-bind="attrs" v-on="on">
        <slot>
          <!-- by using <fc-tooltip>xxxx</fc-tooltip>, xxxx will be set here -->
        </slot>
      </span>
    </template>
    <span style="font-size: 11px;">
      {{ text }}
    </span>
  </v-tooltip>
</template>

<script>
export default {
  props: {
    text: {
      type: String,
      default: ''
    }
  }
}
</script>

<style lang="scss" scoped>
</style>
