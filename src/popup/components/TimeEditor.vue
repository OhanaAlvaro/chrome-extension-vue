<template>
  <div>
    <input type="time" step="0.050" v-model="time2" />
  </div>
</template>

<script>
var fclib = require('../js/fclib')
export default {
  data() {
    return {
      timeFormatted: 0
    }
  },
  props: {
    value: {
      //here we expect in v-model the time in ms. We handle conversion to input:time from this file :)
      type: Number,
      default: 0
    }
  },

  computed: {
    time2: {
      get: function() {
        return fclib.ms2time(this.value)
      },
      set: function(newValue) {
        //console.log('time-changed', newValue, this.time2)
        console.log('newValue', newValue)
        var new_ms = fclib.time2ms(newValue)
        var old_ms = fclib.time2ms(this.time2) //value before updated

        var fixed_ms = fclib.fixTime(new_ms, old_ms)

        //  ms = this.fixTime(newValue)
        //this.value = fclib.time2ms(newValue)
        this.$emit('input', fixed_ms)
        this.$emit('change', fixed_ms)
      }
    }
  },

  mounted() {
    this.timeFormatted = fclib.ms2time(parseInt(this.value))
  }
}
</script>

<style lang="scss" scoped></style>
