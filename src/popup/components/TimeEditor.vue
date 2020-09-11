<template>
  <div>
    <input type="time" step="0.050" :value="time" />
  </div>
</template>

<script>
var fclib = require('../js/fclib')
export default {
  props: {
    timeMs: {
      type: Number,
      default: 0
    }
  },
  computed: {
    time() {
      return fclib.ms2time(timeMs)
    }
  },

  methods: {
    ms2time_v2() {
      function ms2time(s) {
        s = Math.round(s)
        var ms = s % 1000
        s = (s - ms) / 1000
        var secs = s % 60
        s = (s - secs) / 60
        var mins = s % 60
        var hrs = (s - mins) / 60

        return pad(hrs, 2) + ':' + pad(mins, 2) + ':' + pad(secs, 2) + '.' + pad(ms, 3)
      }
    }
  }
}
</script>

<style lang="scss" scoped></style>
