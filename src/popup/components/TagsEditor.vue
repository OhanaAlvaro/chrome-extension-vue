<template>
  <div>
    <div @click="showWizard = true">
      <!-- Chips themselves -->
      <div v-if="!tags.length">click to classify scene</div>
      <v-chip
        x-small
        v-for="(tag, index) in tags"
        :key="index"
        :color="getTagColor(tag)"
        dark
      >{{ tag }}</v-chip>
    </div>

    <tags-wizard v-model="showWizard" :tags="tags" @change="tags = $event"></tags-wizard>
  </div>
</template>

<script>
var raw = require('../js/raw_tags')
import TagsWizard from './TagsWizard'
export default {
  components: {
    TagsWizard
  },
  props: {
    value: {
      type: Array,
      default: function() {
        return []
      }
    }
  },

  computed: {
    tags: {
      get: function() {
        return this.value
      },
      set: function(newValue) {
        this.$emit('input', newValue)
        this.$emit('change', newValue)
      }
    }
  },

  data() {
    return {
      showWizard: false, //true to show the wizard. false to hide

      //tags: [], //the actual value of the tags. They come in the prop and get updated by the wizard. When they change, we notify the parent with emit(input/change)
      content_tags: [{ title: '', value: '', color: '', severity: [], types: [] }],
      action_tags: { types: [] }
    }
  },
  methods: {
    getTagColor(value) {
      var color_value = 'gray' //default
      this.content_tags.forEach(item => {
        if (item.value == value) {
          color_value = item.color
        }
      })
      return color_value
    },
    loadDefinitions() {
      this.content_tags = raw.content
      this.action_tags = raw.actions
    }
  },

  mounted() {
    //this.tags = this.value //<-should refresh this in the watcher, otherwise doesn't refresh...

    //these is ok to refresh just once, since they don't really change:
    this.loadDefinitions()
  }
}
</script>

<style lang="scss" scoped></style>
