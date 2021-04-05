<template>
  <!-- note: not returning a div, so this stays inline-->
  <v-tooltip :top="top" :bottom="bottom" :left="left" :right="right" color="black">
    <template v-slot:activator="{ on, attrs }">
      <span v-bind="attrs" v-on="on">
        <slot>
          <!-- by using <fc-tooltip>xxxx</fc-tooltip>, xxxx will be set here -->
        </slot>
      </span>
    </template>
    <span v-if="!html" :style="{ fontSize: fontSize + 'px' }">
      {{ text }}
    </span>
    <span v-else v-html="text" :style="{ fontSize: fontSize + 'px' }"></span>
  </v-tooltip>
</template>

<script>
export default {
  props: {
    text: {
      type: String,
      default: ''
    },
    position: {
      type: String,
      default: 'top'
    },
    html: {
      type: Boolean,
      default: false
    },
    fontSize: {
      type: Number,
      default: 11
    }
  },
  computed: {
    top() {
      return this.position == 'top'
    },
    bottom() {
      return this.position == 'bottom'
    },
    left() {
      return this.position == 'left'
    },
    right() {
      return this.position == 'right'
    }
  }
}
</script>

<style lang="scss">
span {
  line-height: normal !important; //tried, but I don't think this is working
}
</style>
