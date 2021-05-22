<template>
  <div style="min-width: 320px;">
    <!-- TODO: I think we could have a different view to show list of scenes when user clicks on the chip with the scenes count-->
    <!-- 1. HEADER -->

    <div>
      <h2 @mouseover="mouseoverSample = 'Select the categories'" @mouseleave="mouseoverSample = ''">
        <span v-if="data.metadata && data.metadata.title">
          {{ data.metadata.title }}
        </span>
        <span v-else>
          Welcome to Ohana!
        </span>
      </h2>

      <v-spacer></v-spacer>
      <span class="menu">
        <a v-if="data.hasFilm" @click="goTo('/')"  class="active-menu">
          <v-icon class="pb-1" small>mdi-movie</v-icon>
        </a>
        <a @click="goTo('/preferences')">
          <v-icon class="pb-1" small>mdi-cog</v-icon>
        </a>
        <a @click="goTo('/login')">
          <v-icon class="pb-1" small>mdi-account</v-icon>
        </a>
      </span>
    </div>

    <!-- 2. CATEGORIES/SEVERITY SELECTION -->

    <!--<v-btn color="success" @click="test = !test">text</v-btn>-->

    <!--
    <v-tabs v-model="tab" fixed-tabs>
      <v-tab>preferences</v-tab>
      <v-tab>movie</v-tab>
      <v-tab>dev</v-tab>
    </v-tabs>
    -->

    <div id="TAB_MOVIE" v-if="tab != 0">
      <!-- 1. SAFE DEFINITION 
      <div id="SAFE_DEFINITION" style="font-size: 100%; margin-top: 5px;">
        Update <router-link to="/preferences">your settings</router-link>.
      </div>-->

      <!-- 2. TAGS EXPANSION BLOCKS -->
      <div id="EXPANSION-BLOCKS" style="margin-bottom: 10px; margin-top: 5px; " v-if="tab == 1">
        <!-- Expansion blocks -->
        <div v-for="(cat, index) in categories" :key="index">
          <div v-if="cat != 'Other'" style="border: solid 1px lightgrey; margin-bottom: 3px">
            <!-- Cat Header -->
            <div
              style="position:relative; height: 35px; cursor: pointer; background-color: #F6F6F6;  padding: 7px; "
              @click="test = test == index ? -1 : index"
            >
              <div style="position: absolute; left: 5px;  ">
                <h3>{{ cat }}</h3>
              </div>

              <div style="position: absolute; right: 0px; top: 0px">
                <div v-for="(sev, i2) in severities[index]" :key="i2" style="display:inline">
                  <fc-tooltip
                    :text="
                      '<b>' +
                        sev +
                        '</b>: ' +
                        (selectedTags[index].includes(sev)
                          ? 'You told us to skip this'
                          : 'You didn\'t tell us to skip this')
                    "
                    :html="true"
                    position="top"
                  >
                    <v-btn small icon class="mt-1">
                      <v-icon
                        :small="!selectedTags[index].includes(sev)"
                        :color="getTagColor(sev)"
                        :style="{ opacity: selectedTags[index].includes(sev) ? 1 : 0.2 }"
                      >
                        {{ getTagIcon(sev) }}
                      </v-icon>
                    </v-btn>
                  </fc-tooltip>
                </div>
              </div>
            </div>

            <!-- Cat Content -->
            <v-expand-transition>
              <div v-if="test == index" style="padding: 0px">
                <div>
                  <v-list dense class="py-0 pl-0 pr-0" style="border-top: solid 1px lightgrey">
                    <v-list-item-group>
                      <v-list-item
                        v-for="(sev, i2) in severities[index]"
                        :key="i2"
                        class="py-0 px-2"
                        style="height: 50px"
                        :to="'/scenes/' + sev"
                      >
                        <v-list-item-content>
                          <v-list-item-title
                            :style="{
                              fontWeight: finalSelectedTags.includes(sev) ? 700 : 500,
                              color: finalSelectedTags.includes(sev) ? 'black' : 'gray'
                            }"
                            >{{ sev }}:
                            <v-icon :color="getTagColor(sev)" small>{{ getTagIcon(sev) }}</v-icon>
                            <span
                              :style="{
                                fontSize: '85% !important',
                                color: finalSelectedTags.includes(sev) ? '#00A0B6' : '#A5E1E8',
                                fontWeight: 400
                              }"
                            >
                              | {{ scenesCountByTag[sev] || 0 }}
                              {{ scenesCountByTag[sev] == 1 ? 'filter' : 'filters'
                              }}{{ getTagStatus(sev) == 'done' ? '' : ' so far' }}</span
                            >
                          </v-list-item-title>
                          <v-list-item-subtitle
                            :style="{
                              fontWeight: finalSelectedTags.includes(sev) ? 400 : 300,
                              color: finalSelectedTags.includes(sev) ? 'black' : 'gray'
                            }"
                            v-html="severitySummaryText(sev)"
                          >
                          </v-list-item-subtitle>
                        </v-list-item-content>
                        <v-list-item-action
                          class="mt-1"
                          @mouseenter="updateHoverDescription(index, sev)"
                          @mouseleave="hoverDescription = ''"
                        >
                          <!--<v-list-item-action-text v-text="'5 min'"></v-list-item-action-text>-->

                          <fc-tooltip
                            :text="hoverDescription ? hoverDescription : 'No description available'"
                            :html="false"
                            position="top"
                          >
                            <v-btn icon>
                              <v-icon color="grey lighten-1" small>mdi-information</v-icon>
                            </v-btn>
                          </fc-tooltip>
                        </v-list-item-action>
                      </v-list-item>
                    </v-list-item-group>
                  </v-list>
                </div>

                <div style="padding:5px" hidden>
                  <a @click="test = test == index ? -1 : index">{{
                    test == index ? 'See less' : 'See more'
                  }}</a>
                </div>

                <div style=" padding: 7px;" hidden>
                  <div>
                    <b>Severities</b>
                    <ol>
                      <li v-for="(sev, i2) in severities[index]" :key="i2">{{ sev }}</li>
                    </ol>
                    <div>
                      <b>Context</b>
                      <ol>
                        <li v-for="(cont, i2) in context[index]" :key="i2">{{ cont }}</li>
                      </ol>
                    </div>
                  </div>
                </div>
              </div>
            </v-expand-transition>
          </div>
        </div>
      </div>

      <!-- 3. SUMMARY TEXT -->
      <div id="SUMMARY_TEXT" align="center" justify="center" style="padding:10px; margin: auto; ">
        <div v-if="!data.success">
          <h3 style="color: red">No movie!</h3>
          Open a specific movie/show to start using Ohana. If you've already opened a movie, try
          refreshing the page.
        </div>

        <!-- NO skipTags -->
        <div v-if="finalSelectedTags.length == 0">
          <h3 style="color: black">You are not using Ohana to skip content</h3>
          To automagically skip unwanted scenes, let us know
          <router-link to="/preferences">your sensitivity</router-link>
        </div>

        <!-- Clean -->
        <div
          v-else-if="(data.shield == `done` && skipScenesCount == 0) || data.shield == 'clean'"
          style="color: #00b359"
        >
          <h3>Clean movie! <v-icon small color="green" class="mb-1">mdi-emoticon-happy</v-icon></h3>
          Enjoy! This is a clean movie, there is no need to skip anything!
        </div>

        <!-- Cut -->
        <div v-else-if="data.shield == `done`" style="color: #00b359">
          <h3>Safe Movie! <v-icon small color="green" class="mb-1">mdi-content-cut</v-icon></h3>
          Grab some popcorn and enjoy! We will skip {{ skipScenesCount == 1 ? 'the' : 'all' }}
          {{ skipScenesCount }} unwanted {{ skipScenesCount == 1 ? 'scene' : 'scenes' }}.
        </div>

        <!-- Unsafe / flagged -->
        <div v-else-if="data.shield == `missing`" style="color: red">
          <h3>Unsafe Movie! <v-icon small color="red" class="mb-1">mdi-flag-variant</v-icon></h3>
          This movie has unwanted scenes that we can't skip yet.
          <span v-if="skipScenesCount != 0">
            We will skip {{ skipScenesCount }} {{ skipScenesCount == 1 ? 'scene' : 'scenes' }} , but
            there are more.
          </span>
          Please consider
          <a target="_blank" href="https://www.patreon.com/ohanamovies">donating</a> or
          <a @click="showSidebar(true)">becoming an editor</a> to support the creation of new
          filters.
        </div>

        <!-- Unknown-->
        <div v-else style="color: #DC6F08">
          <h3>
            Warning! Unknown content
            <v-icon small color="gray" class="mb-1">mdi-progress-question</v-icon>
          </h3>
          This movie might contain unwanted scenes.
          <span v-if="skipScenesCount != 0">
            We will skip
            {{ skipScenesCount }} {{ skipScenesCount == 1 ? 'scene' : 'scenes' }}, but there might
            be more.
          </span>
          Please consider
          <a target="_blank" href="https://www.patreon.com/ohanamovies">donating</a> or
          <a @click="showSidebar(true)">becoming an editor</a> to support the creation of new
          filters.
        </div>
      </div>

      <!-- 4. ACTION BUTTONS-->
      <div id="ACTION_BUTTONS">
        <v-row no-gutters>
          <v-col cols="4">
            <v-btn block dense depressed tile text @click="goTo('/preferences')" >Settings</v-btn>
          </v-col>
          <v-col cols="4">
            <v-btn
              text
              dark
              block
              dense
              depressed
              tile
              color="primary"
              @click="showSidebar(true)"
            >
              Editor
            </v-btn>
          </v-col>
          <v-col cols="4">
            <v-btn
              color="success"
              block
              dense
              depressed
              tile
              text
              @click="saveSkipTagsSettings(true)"
              >Watch</v-btn
            >
          </v-col>
        </v-row>
        <!-- Hiding this now, as preferences are now clearly separated
        <v-row>
          <v-col class="py-0">
            <v-checkbox
              class="my-0"
              dense
              hide-details
              v-model="save_preferences"
              readonly
              @click="
                snackbarText = `You can't change that as of now`
                snackbarColor = 'error'
                snackbar = true
              "
              label="Apply these preferences to future movies"
            ></v-checkbox>
          </v-col>
        </v-row>
        -->
      </div>
    </div>
    <!-- end movie div -->
    <!-- 5. SNACKBAR -->

    <v-snackbar
      transition="scroll-y-reverse-transition"
      bottom
      v-model="snackbar"
      :timeout="snackbarTimeout"
      :color="snackbarColor"
      >{{ snackbarText }}
      <template v-slot:action="{ attrs }">
        <v-btn color="white" icon v-bind="attrs" @click="snackbar = false">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script>
/*import ScenesViewer from '../components/ScenesViewer'
import ShieldVue from '../components/Shield.vue'*/
import fclib from '../js/fclib'

var raw = require('../js/raw_tags')
export default {
  name: 'Home',

  props: {
    data: Object
  },

  computed: {
    skipScenesCount() {
      //This should work, not sure why it returns [object Object]10 instead of 1+1+0
      // return this.scenesCountByCategory.reduce((v, a) => v + a.selected)
      console.log('Alex', this.scenesCountByCategory)
      let xx = 0
      this.scenesCountByCategory.forEach(c => {
        xx = xx + c.selected
      })
      return xx
    },
    statusByCategory() {
      //returns: [c1_status, c2_status, ...]
      let output = []
      let i = 0
      for (let sev of this.selectedTags) {
        output.push('')
        for (let tag of sev) {
          var status = this.data.tagged[tag]?.status || 'unknown'
          //var i = this.severities.findIndex(sev => sev.find(x => x == tag)) //get the index of the category that contains this tag in its severities

          let precedence = ['', 'done', 'unkown', 'unknown', 'missing'] //e.g.: if very gore is done and slighlty gore is missing, category violence/gore is missing
          if (precedence.indexOf(status) > precedence.indexOf(output[i])) {
            output[i] = status
          }
        }
        i++
      }

      //those still empty, fill with unknown
      for (let j = 0; j < output.length; j++) {
        if (output[j] == '') output[j] = 'unknwon'
      }
      return output
    },
    scenesCountByCategory() {
      //quite ugly but works... Note: leveraging on the indexes of the categories themselves
      var xx = []

      for (var i = 0; i < this.categories.length; i++) {
        xx.push({ selected: 0, total: 0 }) //default value (we do ++ later)

        if (this.data.scenes) {
          this.data.scenes.forEach(scene => {
            scene.tags.forEach(tag => {
              if (this.severities[i].includes(tag)) {
                xx[i].total = xx[i].total + 1
                if (this.finalSelectedTags.includes(tag)) {
                  xx[i].selected = xx[i].selected + 1
                }
              }
            })
          })
        }
      }

      return xx
    },
    finalSelectedTags() {
      //convert the array of arrays into one single array with all the tags, as that's what the backend understands
      var xx = []
      this.selectedTags.forEach(category => {
        category.forEach(tag => {
          xx.push(tag)
        })
      })
      return xx
    },
    scenesCountByTag() {
      //Number of scenes that the movie has per tag
      var xx = {}
      if (this.data.scenes) {
        //avoid errors
        this.data.scenes.forEach(scene => {
          scene.tags.forEach(tag => {
            if (!xx[tag]) xx[tag] = 0
            xx[tag] = xx[tag] + 1
          })
        })
      }

      return xx
    },
    extensionName() {
      return browser.i18n.getMessage('extName')
    }
  },

  data() {
    return {
      protection: [false, false, false],
      protectionLevel: [0, 0, 0],
      test: -1,
      tab: 1,

      hoverDescription: '',
      mouseoverSample: '',

      snackbarText: '',
      snackbar: false,
      snackbarTimeout: 6000,
      snackbarColor: 'info',

      selectedTags: [[], [], [], []], //arrray of arrays [[sex_tags],[vio_tags], etc] (order depens on the raw-tags json file, but all view is aligned to work)
      save_preferences: true,

      tags: [],
      categories: [],
      severities: [],
      context: [],
      ticks: [
        "Don't skip",
        'Skip Severe only',
        'Skip Severe and Mild',
        'Skip Severe, Mild, and Moderate'
      ]
    }
  },

  watch: {
    data(newValue) {
      this.loadTagsFromSettings()

      if (newValue.hasFilm == false) {
        this.goTo('/preferences')
      }
    }
  },

  methods: {
    severitySummaryText(sev) {
      let xx
      if (this.getTagStatus(sev) == 'done' && this.scenesCountByTag[sev] > 0) {
        xx = this.finalSelectedTags.includes(sev)
          ? 'Ready to go. Will skip all ' + this.scenesCountByTag[sev] + ' scene(s)'
          : this.scenesCountByTag[sev] + ' filter(s) available'
      } else if (this.getTagStatus(sev) == 'done') {
        xx = this.finalSelectedTags.includes(sev)
          ? 'Original was clean. No need to do skips'
          : "Original doesn't have this kind of content"
      } else if (this.getTagStatus(sev) == 'missing') {
        xx = this.finalSelectedTags.includes(sev)
          ? '<span style="color: red; font-weight: bold">Careful!</span> content flagged, but not cut yet'
          : 'Content flagged, but not cut yet'
      } else {
        xx = this.finalSelectedTags.includes(sev)
          ? '<span style="color: red; font-weight: bold">Careful!</span> Content not reviewed yet'
          : 'Content not reviewed yet'
      }

      return xx
    },
    goTo(route) {
      this.$router.push(route)
    },

    getTagStatus(sev) {
      //expected values: done, missing, unknown
      let status = this.data.tagged[sev]?.status || 'unknown'
      if (status == 'unkown') status = 'unknown'
      return status
    },
    getTagIcon(tag) {
      let status
      if (this.data.tagged) {
        //doing if to prevent error while tagged is still undefined... (not sure how to make it work in 1 line)
        status = this.data.tagged[tag]?.status || 'unknown'
      } else {
        status = 'unknown'
      }

      let scenesCount = this.scenesCountByTag[tag] || 0

      if (status == 'done' && scenesCount == 0) {
        return 'mdi-emoticon-happy'
      } else if (status == 'done') {
        return 'mdi-content-cut'
      } else if (status == 'missing') {
        return 'mdi-flag-variant'
      } else {
        return 'mdi-progress-question'
      }
    },
    getTagColor(tag) {
      let status
      if (this.data.tagged) {
        //doing if to prevent error while tagged is still undefined... (not sure how to make it work in 1 line)
        status = this.data.tagged[tag]?.status || 'unknown'
      } else {
        status = 'unknown'
      }

      if (status == 'done') {
        return 'green'
      } else if (status == 'missing') {
        return 'red'
      } else {
        return 'gray'
      }
    },
    shieldText(catIndex) {
      let catStatus = this.statusByCategory[catIndex]
      let catName = raw.content[catIndex].value
      if (catStatus == 'done') {
        this.hoverDescription = `<span style="color:green"><b>Enjoy safely!</b> We will skip the scenes selected.</span>`
      } else if (catStatus == 'missing') {
        this.hoverDescription =
          `<span style="color:red"><b>Unsafe movie!</b> Users reported there are scenes of '` +
          catName +
          `'  that are not yet filtered.</span>`
      } else {
        this.hoverDescription = `<span style="color:orange"><b>Warning!</b> We don't have enough information about this category.</span>`
      }
    },
    clickedItem(cat_index, severity) {
      //V2 of the select-redundant-tags: auto selects / de-selects the redundant ones

      var xx = [] //new version of this category severities

      var ii = this.severities[cat_index].indexOf(severity)

      if (this.selectedTags[cat_index].includes(severity)) {
        //first tag
        if (
          ii == this.severities[cat_index].length - 1 &&
          this.selectedTags[cat_index].length == 1
        ) {
          ii++
        }

        //last tag
      }

      for (var i = 0; i < this.severities[cat_index].length; i++) {
        if (i >= ii) {
          xx.push(this.severities[cat_index][i])
        }
      }

      //Recreate the full selectedTags object (only updating one part does not propagate properly)
      var zz = []
      for (let j = 0; j < this.severities.length; j++) {
        if (j == cat_index) {
          zz.push(xx)
        } else {
          zz.push(this.selectedTags[j])
        }
      }

      this.selectedTags = zz
      this.saveSkipTagsSettings(false)
    },
    updateHoverDescription(cat_index, severity) {
      var xx = raw.content[cat_index]
      console.log(xx)
      this.hoverDescription = xx.severity.find(x => x.value == severity).description
    },

    showSidebar(close = false) {
      fclib.sendMessage({ msg: 'show-sidebar', show: true })
      if (close) window.close()
    },
    saveSkipTagsSettings(close = false) {
      if (this.save_preferences) {
        //1. if user asked to keep this as default, save settings with selectedTags as settings.skip_tags
        var xx = this.data.settings
        xx.skip_tags = this.finalSelectedTags
        fclib.sendMessage({ msg: 'update-settings', settings: xx }, response => {
          if (response) {
            console.log('Settings saved!')
          } else {
            console.error('Error saving settings', response)
          }
        })
      } else {
        //TODO: 2. if users didn't want this as default, just save it for this movie
        //to do so, I'm updating the "skip" of every scene that is supposed to be filtered here
        //TODO: users should be able to see the list of filters and decide at scene level if they prefer...
      }

      if (close) {
        fclib.sendMessage({ msg: 'play' })
        window.close()
      }
    },
    mouseOver(item) {
      this.auxx = 'hola - ' + item
    },
    go2Login() {
      if (this.$route.name == 'Login') {
        this.$router.go(-1) //go back to whatever route we were before :)  | (just in case at some point we have more than Home/Login)
      } else {
        this.$router.push('/login')
      }
    },

    //Generic methods:
    sendMessage(msg, callback) {
      fclib.sendMessage(msg, callback)
    },
    loadTagsFromSettings() {
      //read the skip_tags setting and update dropdowns by updating the selectedTags accordinagly [[],[],[],...]
      //This is triggered everytime this.data changes (watcher)

      var xx = []
      console.log('data', this.data)
      for (let i = 0; i < this.categories.length; i++) {
        xx.push([])
        this.severities[i].forEach(tag => {
          try {
            //console.log('loading from settings -  tag ' + tag)
            if (this.data.settings.skip_tags.includes(tag)) {
              xx[i].push(tag)
            }
          } catch (error) {
            //settings not loaded / not containing skip settings
          }
        })
      }
      this.selectedTags = xx
    }
  },
  created() {
    console.log('selectedTags', this.selectedTags)
    this.tags = raw.content
    this.categories = raw.categories
    this.severities = raw.severitiesR
    this.context = raw.context

    //this.loadTagsFromSettings()  // -> this is better triggered when data changes
  }
}
</script>

<style>
td {
  text-align: left !important;
  padding: 5px !important;
}
.v-slider__tick-label {
  font-size: 63% !important;
}
.menu {
  position: absolute;
  text-align: center;
  top: 15px;
  right: 15px;
}

.menu > span {
  cursor: pointer;
  padding: 5px;
}

.v-select__selection {
  font-size: 12px;
}

#SUMMARY_TEXT a {
  text-decoration: underline;
  color: inherit;
}

/*
.section {
  text-transform: uppercase;
}

.no-uppercase {
  text-transform: none;
}

.v-messages.theme--light {
  display: none;
}

.v-input__slot {
  margin-bottom: 0px;
}

.v-input.theme--light.v-input--selection-controls.v-input--checkbox {
  margin-top: 0px;
  padding-top: 0px;
}


select {
  border-bottom: 1px dashed #555 !important;
  width: 100%;
  outline: none;
}*/
</style>

<style lang="scss" scoped>
@import '/css/popup.css';
</style>
