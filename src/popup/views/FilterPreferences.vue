<template>
  <div style="min-width: 340px;">
    <!-- 1. HEADER -->
    <div>
      <h2>
        Welcome to Ohana!
        <router-link style="font-size: 70%" to="/" v-if="data.hasFilm">Back</router-link>
      </h2>

      <v-spacer></v-spacer>
      <span class="menu">
        <!-- 
          <v-btn @click="go2Login()" color="grey" fab x-small dark depressed>
          <v-icon>mdi-account</v-icon>
        </v-btn>
        -->
        <a @click="go2Login()">
          <v-icon class="pb-1" small>mdi-account</v-icon>
          <b>{{ data.settings.username }}</b>
        </a>
      </span>
    </div>

    <!-- hasFilm: {{ data.hasFilm }} -->

    <!--
    {{ protection }}

    {{ protectionLevels }}

    <br />
    {{ selectedTags }}

    <br />
    {{ skipTags }}
    -->

    <!-- 2. INTRO TEXT-->
    <div style="margin-top: 5px; font-size: 95%">
      You decide what <b>"safe"</b> means, by letting us know what content you want to avoid. Then
      we will skip it by default.
    </div>
    <!-- 3. CATEGORY OPTIONS  -->
    <!-- 3.1 Category Header -->
    <div
      style="max-height: 350px; overflow-y: auto; border-bottom: solid 1px black; border-top: solid 1px black; padding: 2px"
    >
      <div
        id="Sliders"
        v-for="(cat, index) in categories"
        :key="index"
        style="border: solid 1px lightgrey; margin-bottom: 3px; margin-top: 3px; padding: 5px; "
      >
        <v-switch
          hide-details
          :label="`Avoid '` + cat + `'`"
          v-model="protection[index]"
          dense
          class="py-0 ma-0"
        >
          <template v-slot:label="{ value }">
            <!--TODO: do we want to use this slot to make the label more custom?-->
            <div>
              <span>{{ value }}</span>
              {{ value }}
            </div>
          </template>
        </v-switch>

        <!-- 3.2 Cat expansion panel, with SLIDER -->
        <v-expand-transition>
          <div v-if="protection[index]">
            <v-slider
              class="mb-3"
              hide-details
              v-model="protectionLevels[index]"
              :tick-labels="severities[index]"
              :disabled="!protection[index]"
              track-fill-color="green"
              track-color="black"
              color="green"
              dense
              :max="3"
              step="1"
              ticks="always"
              tick-size="5"
            >
            </v-slider>
            <span style="font-size: 95%">
              <!-- <b>{{ severities[index][protectionLevels[index]] }}: </b>-->
              {{ descriptions[index][protectionLevels[index]] }}
            </span>
          </div>
        </v-expand-transition>
      </div>
    </div>

    <!-- 4. ICONS EXPLANATION-->
    <div style="margin-top: 5px; font-size: 95%">
      These will apply to all content you watch on compatible providers. For each movie, we will let
      you know if it is:
      <br />
      <v-icon color="green" small>mdi-emoticon-happy</v-icon><b>Clean:</b> Content was originally
      safe, it didn't need to be cut.
      <br />
      <v-icon color="green" small>mdi-content-cut</v-icon><b>Cut:</b> There was unsafe content, but
      we will skip it all for you.
      <br />
      <v-icon color="red" small>mdi-flag-variant</v-icon><b>Unsafe:</b> Unwanted content was
      flagged, but it's not cut yet.
      <br />
      <v-icon color="gray" small>mdi-help-rhombus</v-icon><b>Unknown:</b> We can't help as we don't
      have information yet.
    </div>

    <!-- ACTION BUTTONS -->
    <div>
      <v-row>
        <v-col class="pb-0">
          <v-btn dark block dense depressed tile color="success" @click="donePressed()">
            Save
          </v-btn>
        </v-col>
      </v-row>
    </div>

    <v-row v-if="false">
      <v-col class="pb-0 pt-1">
        <v-btn
          dark
          block
          dense
          depressed
          tile
          color="primary"
          href="https://www.patreon.com/ohanamovies"
          target="_blank"
        >
          Donate
        </v-btn>
      </v-col>
      <v-col class="pb-0 pt-1">
        <v-btn color="success" block dense depressed tile @click="saveSkipTagsSettings(false)"
          >Save</v-btn
        >
      </v-col>
    </v-row>
  </div>
</template>

<script>
import fclib from '../js/fclib'

var raw = require('../js/raw_tags')
export default {
  props: {
    data: Object,
    default: function() {
      return { settings: { skip_tags: [] } }
    }
  },
  watch: {
    data: {
      deep: true,
      handler() {
        this.skipTags2ui()
      }
    },
    protectionLevels() {
      this.ui2skipTags()
    },
    protection() {
      this.ui2skipTags()
    }
  },
  computed: {
    windowHistory() {
      return window.history
    }
  },
  data() {
    return {
      protection: [false, false, false], //will reset and potentially resize when settings in data change
      protectionLevels: [0, 0, 0], //will reset and potentially resize when settings in data change

      selectedTags: [[]],
      skipTags: [],

      save_preferences: true,

      tags: [],

      categories: [],
      severities: [],
      descriptions: []
    }
  },

  methods: {
    ui2skipTags() {
      console.log('hey')
      let new_skipTags = []
      let new_selectedTags = []
      for (let i = 0; i < this.categories.length; i++) {
        console.log('aaarg')
        new_selectedTags.push([])
        if (this.protection[i]) {
          console.log('zxcv: ' + this.protectionLevels[i])
          for (let j = 0; j <= this.protectionLevels[i]; j++) {
            new_skipTags.push(this.severities[i][j])
            new_selectedTags[i].push(this.severities[i][j])
          }
        }
      }
      this.selectedTags = new_selectedTags
      this.skipTags = new_skipTags
    },
    skipTags2ui() {
      //This is triggered everytime this.data changes (watcher)

      let skip_tags = this.data.settings.skip_tags

      //settings I have skip_tags, which all the tags together. We need to map them to match the numbers in the slider.
      //We assume tags come in the  order: severe to none.

      let protection = []
      let protectionLevels = []
      for (let i = 0; i < this.categories.length; i++) {
        const cat = this.categories[i]
        protection.push(false) //default (will override if a severity of this category is in skip_tags setting)
        protectionLevels.push(-1) //default (will override if a severity is in skip_tags)

        for (let j = 0; j < this.severities[i].length; j++) {
          const sev = this.severities[i][j]
          if (skip_tags.includes(sev)) {
            protection[i] = true
            protectionLevels[i] = j
          }
        }
      }
      this.protection = [...protection]
      this.protectionLevels = [...protectionLevels]
    },
    donePressed() {
      console.log('done pressed')
      if (this.data.hasFilm) {
        this.saveSkipTagsSettings(false)
        this.goTo('/')
      } else {
        this.saveSkipTagsSettings(true)
      }
    },
    /*sliderLabelsFromSev(index) {
      let x = []
      for (let i = this.severities[index].length - 1; i >= 0; i--) {
        x.push(this.severities[index][i])
      }
      return x
    },*/
    goTo(route) {
      if (route == -1) {
        this.$router.go(-1)
      } else {
        this.$router.push(route)
      }
    },
    go2Login() {
      if (this.$route.name == 'Login') {
        this.$router.go(-1) //go back to whatever route we were before :)  | (just in case at some point we have more than Home/Login)
      } else {
        this.$router.push('/login')
      }
    },
    closePopup() {
      if (close) {
        fclib.sendMessage({ msg: 'play' })
        window.close()
      }
    },
    sendMessage(msg, callback) {
      fclib.sendMessage(msg, callback)
    },
    saveSkipTagsSettings(close = false) {
      var xx = this.data.settings
      xx.skip_tags = this.skipTags
      console.log('skip tags: ', xx.skip_tags)

      fclib.sendMessage({ msg: 'update-settings', settings: xx }, response => {
        if (response) {
          console.log('Settings saved!')
        } else {
          console.error('Error saving settings', response)
        }
      })

      if (close) {
        this.closePopup()
      }
    }
  },

  created() {
    this.tags = raw.content
    this.categories = raw.categories
    this.severities = raw.severitiesR
    this.context = raw.context

    this.descriptions = raw.descriptionsR

    //this.skipTags2ui()  // -> this is better triggered when data changes
  }
}
</script>

<style lang="scss" scoped></style>
