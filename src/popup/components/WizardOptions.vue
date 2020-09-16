<template>
  <div>
    <p>radio: {{ radio_value }}</p>
    <p>checbox: {{ checkbox_value }}</p>
    <div>
      <label v-for="(option, index) in options" :key="index">
        <input type="radio" name="xxx" :value="option.value" v-model="radio_value" />
        <b>{{ option.title }}</b>
        - {{ option.description }}
        <br />
      </label>
    </div>
  </div>
</template>

<script>
import TagsEditorVue from './TagsEditor.vue'
export default {
  props: {
    value: {
      //all tags
      type: Array,
      default: function() {
        return []
      }
    },
    options: {
      type: Array,
      default: function() {
        return []
      }
    },
    type: {
      type: String,
      default: 'radio' //checkbox|radio
    }
  },
  computed: {
    returnTags: {
      get: function() {
        if (this.type == 'checkbox') {
          return checkbox_value
        } else {
          //remove options from tags, and add again the one selected in the radio
          var indexes = []
          var i = 0
          this.value.forEach(tag => {
            this.options.forEach(option => {
              if (tag == option) {
                indexes.push(i)
              }
            })
          })
          indexes.forEach(i => {
            this.value.slice(i, 1)
          })
          // this.value.push(this.radio_value)
          return this.value
        }
      },
      set: function(value) {
        this.$emit('input', value)
      }
    }
  },
  data() {
    return {
      radio_value: '',
      checkbox_value: ''
    }
  },
  mounted() {
    this.checkbox_value = this.value //we can just use all tags with checkboxes.
    this.options.forEach(option => {
      this.value.forEach(tag => {
        if (tag == option) {
          this.radio_value = tag
        }
      })
    })
  }
}
</script>

<style lang="scss" scoped></style>
