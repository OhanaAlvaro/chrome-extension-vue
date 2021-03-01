<template>
  <!-- This element is intended to be a quick overview on the scenes that will be skipped by the user with their settings -->
  <!-- This is different vs the Editor mode. This is read-only, and aimed at normal users to be better informed.  -->

  <!-- //TODO: users should be able to override specific scenes. That should work + reflect on the main page (challenging)-->
  <!-- //TODO: Think how to avoid tempting people to watch the bad scenes if offering the minute and the description... -->

  <div style="min-width: 300px;">
    <h2>Scenes for {{ categories[category_index] }} ({{ scenes.length }})</h2>

    <p style="color: grey; font-size: 90%">
      Here you can take a quik look to the scenes, and better understand what we will skip based on
      your settings from the previous page.
    </p>

    <!--

    {{ scenes }}
    <br />
    <br />
    {{ category_index }}
    -->

    <!-- -->

    <v-list dense style="max-height: 250px" class="overflow-y-auto">
      <v-list-item-group>
        <v-list-item
          class="px-0 mx-0 pb-5"
          three-line
          v-for="(scene, index) in scenes"
          :key="index"
          @mouseenter="sceneToDescribe = scene"
          @mouseleave="
            sceneToDescribe = {}
            showSpoiler = false
          "
          @click="showSpoiler = !showSpoiler"
        >
          <v-list-item-content>
            <v-list-item-title style="font-size: 110%; padding-bottom: 1px; pading-top: 2px"
              >Scene #{{ index + 1 }} - {{ getSeverity(scene).join(', ') }}</v-list-item-title
            >
            <v-list-item-subtitle style="font-size:95%"
              ><b>Context: </b>{{ getContext(scene).join(' + ') }}</v-list-item-subtitle
            >
            <v-list-item-subtitle style="font-size:95%"
              ><b>Duration:</b> {{ prettyTime(scene.end - scene.start) }} | <b>Start:</b>
              {{ prettyTime(scene.start) }}
            </v-list-item-subtitle>
          </v-list-item-content>
          <v-list-item-action>
            <v-checkbox v-model="scene.skip" disabled label="Skip" small></v-checkbox>
          </v-list-item-action>
        </v-list-item>
      </v-list-item-group>
    </v-list>

    <div style="padding-top: 10px; min-height: 30px">
      <v-divider class="mb-2"></v-divider>
      <div v-if="Object.keys(sceneToDescribe).length == 0">
        <span style="color:grey"> Hover over a scene to see its description</span>
      </div>
      <div v-else>
        <div v-if="sceneToDescribe.spoiler">
          <span style="color:red"><b>[WARNING: SPOLIERS] </b></span>
          <span>
            <b>{{ showSpoiler ? 'Click hide' : 'Click to show' }}</b>
          </span>
          <br />
        </div>
        <div v-if="showSpoiler || !sceneToDescribe.spoiler">
          <b>Description: </b
          >{{ sceneToDescribe.comments ? sceneToDescribe.comments : 'No description' }}
        </div>
      </div>
    </div>

    <v-row>
      <v-col>
        <v-btn color="primary" dark block depressed tile to="/">&lt; Back</v-btn>
      </v-col>
      <v-col>
        <v-btn color="dark" dark block depressed tile @click="showSidebar(true)"
          >Improve Filters</v-btn
        >
      </v-col>
    </v-row>
  </div>
</template>

<script>
import fclib from '../js/fclib'
import Home from './Home.vue'

var raw = require('../js/raw_tags')

export default {
  props: {
    data: {
      type: Object
    },
    categoryIndex: {
      //category index on the raw-tags array
      type: String,
      default: '0'
    }
  },
  data() {
    return {
      tags: [],
      severities: [],
      categories: [],
      context: [],

      showSpoiler: false,
      sceneToDescribe: {}
    }
  },

  computed: {
    category_index() {
      return parseInt(this.categoryIndex)
    },
    scenes() {
      var xx = []
      if (this.data.scenes) {
        this.data.scenes.forEach(scene => {
          if (scene.tags.includes(this.categories[this.category_index])) {
            console.log('trueeeeee')
            xx.push(scene)
          } else {
            console.log('falseeeeeeeee')
          }
        })
      }
      return xx
    }
  },

  methods: {
    showSidebar(close = false) {
      fclib.sendMessage({ msg: 'show-sidebar', show: true })
      if (close) window.close()
    },
    getSeverity(scene) {
      var xx = [] //do it should always be just 1 value
      scene.tags.forEach(tag => {
        if (this.severities[this.category_index].includes(tag)) {
          xx.push(tag)
        }
      })
      return xx
    },
    getContext(scene) {
      var xx = []
      scene.tags.forEach(tag => {
        if (this.context[this.category_index].includes(tag)) {
          xx.push(tag)
        }
      })
      return xx
    },
    prettyTime(time) {
      var mins = Math.floor(time / 1000 / 60)
      if (mins < 10) mins = '0' + mins
      var secs = Math.round(time / 1000 - mins * 60)
      if (secs < 10) secs = '0' + secs
      return '' + mins + ':' + secs
    }
  },

  created() {
    this.tags = raw.content
    this.categories = raw.categories
    this.severities = raw.severities
    this.context = raw.context

    //this.loadTagsFromSettings()  // -> this is better triggered when data changes
  }
}
</script>

<style lang="scss" scoped>
@import '/css/popup.css';
</style>
