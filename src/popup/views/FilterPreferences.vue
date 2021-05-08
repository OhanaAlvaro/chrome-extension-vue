<template>
  <div style="min-width: 340px;">
    <!-- 1. HEADER -->
    <div>
      <h2>What do you want to skip?</h2>

      <v-spacer></v-spacer>
      <span class="menu">
        <a @click="go2Login()">
          <v-icon class="pb-1" small>mdi-account</v-icon>
          <b style="color: #616161"> {{ data.settings.username }}</b>
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

    <!-- 2. INTRO TEXT
    <div style="margin-top: 5px; font-size: 95%">
      You decide what <b>"safe"</b> means, by letting us know what content you want to avoid. We will skip any unwanted content.
    </div>-->
    <!-- 3. CATEGORY OPTIONS  -->
    <!-- 3.1 Category Header -->
    <div style="max-height: 350px; overflow-y: auto; padding: 2px">
      <div id="Sliders" v-for="(cat, index) in categories" :key="index">
        <!-- TODO: ugly way of removing other...-->
        <div
          v-if="cat != 'Other'"
          style="border: solid 1px lightgrey; margin-bottom: 3px; margin-top: 3px; padding: 5px; background-color: #F6F6F6 "
        >
          <v-switch
            hide-details
            :label="`Skip '` + cat + `'`"
            v-model="protection[index]"
            dense
            @change="saveSkipTagsSettings()"
            class="py-0 ma-0"
          >
            <!--<template v-slot:label="{ value }">
              <!- -TODO: do we want to use this slot to make the label more custom?- ->
              <div>
                <span>{{ value }}</span>
                {{ value }}
              </div>
            </template>-->
          </v-switch>

          <!-- 3.2 Cat expansion panel, with SLIDER -->
          <v-expand-transition>
            <div v-show="protection[index]">
              <v-slider
                class="mb-3"
                hide-details
                v-model="protectionLevels[index]"
                :tick-labels="sliderTicks"
                :disabled="!protection[index]"
                track-fill-color="green"
                track-color="black"
                color="green"
                dense
                max="3"
                step="1"
                ticks="always"
                tick-size="5"
                @change="saveSkipTagsSettings()"
              >
              </v-slider>
              <span style="font-size: 96%">
                <!-- <b>{{ severities[index][protectionLevels[index]] }}: </b>-->
                <b>This will skip:</b> {{ descriptions[index][protectionLevels[index]] }}
              </span>
            </div>
          </v-expand-transition>
        </div>
      </div>
    </div>

    <!-- 4. ICONS EXPLANATION-->
    <div style="margin: 5px;">
      <div style="margin-top: 5px;">
        You can now relax and enjoy watching movies as usual! We will automagically skip any
        unwanted scene.
      </div>

      <div style="margin-top: 5px; margin-bottom: 1px;">
        On every movie, we will let you know if it is:
      </div>

      <div style="margin-left: 5px;">
        <v-icon color="green" small>mdi-emoticon-happy</v-icon> <b>Clean:</b> No need to skip
        anything.
        <br />
        <v-icon color="green" small>mdi-content-cut</v-icon> <b>Cut:</b> All unwanted scenes will be
        skipped.
        <br />
        <v-icon color="red" small>mdi-flag-variant</v-icon> <b>Unsafe:</b> Beware! We can't skip all
        unwanted scenes yet.
        <br />
        <v-icon color="gray" small>mdi-progress-question</v-icon> <b>Unknown:</b> Careful! Movie
        might have unwanted scenes.
      </div>
    </div>

    <!-- ACTION BUTTONS -->
    <div style="margin: 10px 5px 0 5px">
      <!--<b>Help us improve</b>-->
      <v-btn plain text href="https://forms.gle/cPr7XQhdS7x1y9hx7" target="_blank">
        Feekback
      </v-btn>

      <v-btn plain text color="primary" href="https://www.patreon.com/ohanamovies" target="_blank">
        Donate
      </v-btn>

      <v-btn v-if="data.hasFilm" plain text color="success" to="/"> Back</v-btn>
      <v-btn v-else plain text color="success" @click="closePopup()"> Close </v-btn>
    </div>
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
      handler(newValue, oldValue) {
        //1. hasFilm might get detected late, so when detected let's go to the home view
        if (!oldValue.hasFilm && newValue.hasFilm) {
          this.$router.push('/')
          return
        }
        //populate values to UI
        this.skipTags2ui()
      }
    },
    protection: {
      deep: true,
      handler(newValue, oldValue) {
        if (newValue != oldValue) {
          console.log('test')
        }

        //
      }
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

      sliderTicks: ['Severe', 'Moderate', 'Mild', 'Slight'],

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
      //this.selectedTags = new_selectedTags
      this.skipTags = new_skipTags
    },
    skipTags2ui() {
      console.log('[skipTags2ui]', this.data.settings.skip_tags)
      //This is triggered everytime this.data changes (watcher)

      let skip_tags = this.data.settings.skip_tags

      //settings I have skip_tags, which all the tags together. We need to map them to match the numbers in the slider.
      //We assume tags come in the order: severe to none.

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
      fclib.sendMessage({ msg: 'play' })
      window.close()
    },

    saveSkipTagsSettings() {
      this.ui2skipTags()

      var xx = this.data.settings
      xx.skip_tags = this.skipTags
      console.log('skip tags: ', xx.skip_tags)

      fclib.sendMessage({ msg: 'update-settings', settings: xx }, response => {
        if (!response) console.error('Error saving settings', response)
      })
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

<style lang="scss">
.v-slider__thumb {
  height: 20px;
  width: 20px;
}

.v-slider__thumb:before {
  display: none;
}

.v-slider__track-container {
  height: 3px !important;
}
</style>
