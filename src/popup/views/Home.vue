<template>
  <div style="min-width: 300px;">
    <!-- TODO: I think we could have a different view to show list of scenes when user clicks on the chip with the scenes count-->
    <!-- 1. HEADER -->
    <div>
      <h2 @mouseover="mouseoverSample = 'Select the categories'" @mouseleave="mouseoverSample = ''">
        What do you want to skip?
      </h2>

      <!-- Just to debug: -->
      <!--
      <i>{{ mouseoverSample }}</i>

      {{ categories }}
      <br />
      {{ severities }}
      <br />
      {{ context }}
      <br />
      {{ data }}
      <br />
      {{ selectedTags }}

      -->

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

    <!-- 2. CATEGORIES/SEVERITY SELECTION -->

    <div id="alex-dropdowns">
      <div v-for="(cat, index) in categories" :key="index">
        <v-row>
          <!-- col:1 -> the v-select with some customizations using slots -->
          <v-col cols="8">
            <v-select
              :menu-props="{ auto: false, maxHeight: '400px' }"
              dense
              :no-data-text="`No data available for '` + cat + `'`"
              hide-details
              :label="cat"
              :items="cat == 'Other' ? context[index] : severities[index]"
              multiple
              :value="selectedTags[index]"
              style="margin-bottom: 0px; font-size: 40%"
            >
              <!-- 1) use small chips for selected items -->
              <template v-slot:selection="{ item }">
                <v-chip x-small class="pa-1 ma-0 mr-1 mb-1">
                  {{ item }}
                </v-chip>
              </template>
              <!-- -->

              <!-- 2) Within the list, before items, show the category title, shield, and intro (slot: PREPEND ITEM) -->
              <template v-slot:prepend-item>
                <v-list-item dense>
                  <v-list-item-content>
                    <v-list-item-title>
                      <h3>{{ cat }}</h3>
                    </v-list-item-title>

                    <v-list-item-subtitle>Select what to skip!</v-list-item-subtitle>
                  </v-list-item-content>
                  <v-list-item-action
                    @mouseenter="shieldText(index)"
                    @mouseleave="hoverDescription = ''"
                  >
                    <v-btn icon>
                      <v-icon color="success" v-if="statusByCategory[index] == 'done'"
                        >mdi-shield-check</v-icon
                      >
                      <v-icon color="red" v-else-if="statusByCategory[index] == 'missing'"
                        >mdi-shield-alert</v-icon
                      >
                      <v-icon color="orange" v-else>mdi-shield-half-full</v-icon>
                    </v-btn>
                  </v-list-item-action>
                </v-list-item>
                <v-divider></v-divider>
              </template>

              <!-- 3) After the items, we keep a space to put the descriptions on hover. (slot: APPEND-ITEM) -->
              <template v-slot:append-item>
                <v-divider class="mb-2"></v-divider>

                <v-container class="ma-0 py-0 px-3 ">
                  <span
                    style="font-size:95%; color:grey;"
                    v-html="hoverDescription"
                    v-if="hoverDescription"
                  ></span>
                  <span style="font-size:95%; color:grey; " v-else
                    >Hover an element to see here some details about it</span
                  >
                </v-container>
              </template>

              <!-- 4) We override the item with a custom item, to get more flexibility (using v-list-item) -->
              <template v-slot:item="{ active, item, attrs, on }">
                <v-list-item
                  v-on="on"
                  v-bind="attrs"
                  @mouseenter="updateHoverDescription(index, item)"
                  @mouseleave="hoverDescription = ''"
                  @click="clickedItem(index, item)"
                >
                  <v-list-item-content>
                    <v-list-item-subtitle>{{ item }} </v-list-item-subtitle>
                    <v-list-item-subtitle style="font-size: 9px">
                      {{ scenesCountByTag[item] ? scenesCountByTag[item] : 0 }}
                      filters available</v-list-item-subtitle
                    >
                  </v-list-item-content>

                  <v-list-item-action>
                    <span :style="{ fontSize: '9px', color: getTagColor(item) }">
                      <!-- {{ scenesCountByTag[item] ? scenesCountByTag[item] : 0 }} scenes -->
                      {{ getTagStatusTranslate(item) || 'unknown' }}
                    </span>
                  </v-list-item-action>
                </v-list-item>
              </template>
            </v-select>
          </v-col>

          <!-- col:2 -> the number of filters, in a clickable way which takes users to the list of scenes (different route) -->
          <v-col
            ><v-chip x-small dark color="grey" :to="'/scenes/' + index">
              {{ scenesCountByCategory[index].selected + '/' + scenesCountByCategory[index].total }}
              filters
              <!--<v-icon x-small>mdi-check</v-icon>-->
            </v-chip></v-col
          >
        </v-row>
      </div>
    </div>

    <!-- 3. SUMMARY TEXT -->

    <div
      align="center"
      justify="center"
      style="width:300px; padding:10px; border: 1px solid grey; margin: auto"
    >
      <!-- TODO: BUG here, unknown option is not appearing, still "done" appears :/ ... -->
      <span v-if="!data.success">
        <b style="color: red">No movie!</b>
        Open a specific movie/show to start using Ohana. If you've already opened a movie, try
        refreshing the page.
      </span>

      <span v-else-if="data.shield == `done`" style="color: #00b359">
        <v-icon small color="green" class="mb-1">mdi-shield-check</v-icon>
        <b>Safe movie!</b> <br />
        Grab some popcorn and enjoy! We will skip all
        {{ scenesCountByCategory.reduce((x, a) => x + a.selected, 0) }} unwanted scene(s).
      </span>

      <span v-else-if="data.shield == `missing`" style="color: red">
        <v-icon small color="red" class="mb-1">mdi-shield-alert</v-icon><b>Unsafe movie!</b> <br />
        Users reported there are scenes not yet filtered, so we can't skip all your unwanted
        content.
      </span>
      <span v-else style="color: orange">
        <v-icon small color="orange" class="mb-1">mdi-shield-half-full</v-icon>
        <b>Warning! Unknown movie</b> <br />
        We might not be able to skip all unwanted scenes.
      </span>
    </div>

    <!-- 4. ACTION BUTTONS-->
    <div>
      <v-row>
        <v-col>
          <v-btn color="dark" dark block dense depressed tile @click="showSidebar(true)"
            >Edit filters</v-btn
          >
        </v-col>
        <v-col>
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
      </v-row>

      <v-row>
        <v-col style="padding-top: 0px; padding-bottom: 0px">
          <v-btn color="success" block dense depressed tile @click="saveSkipTagsSettings(true)"
            >Watch now</v-btn
          >
        </v-col>
      </v-row>
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
    </div>

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
      this.data.scenes.forEach(scene => {
        scene.tags.forEach(tag => {
          if (!xx[tag]) xx[tag] = 0
          xx[tag] = xx[tag] + 1
        })
      })
      return xx
    },
    extensionName() {
      return browser.i18n.getMessage('extName')
    }
  },

  data() {
    return {
      hoverDescription: '',
      mouseoverSample: '',

      snackbarText: '',
      snackbar: false,
      snackbarTimeout: 6000,
      snackbarColor: 'info',

      selectedTags: [[]], //arrray of arrays [[sex_tags],[vio_tags], etc] (order depens on the raw-tags json file, but all view is aligned to work)
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
    data() {
      this.loadTagsFromSettings()
    }
  },

  methods: {
    getTagStatusTranslate(item) {
      let status = this.data.tagged[item]?.status || 'unknown'
      let dict = {
        done: 'safe',
        unknown: 'unknown',
        unkown: 'unknown',
        missing: 'unsafe'
      }
      return dict[status]
    },
    getTagIcon(tag) {
      let status = this.data.tagged[tag]?.status || 'unknown'
      if (status == 'done') {
        return 'mdi-check'
      } else if (status == 'missing') {
        return 'mdi-alert'
      } else {
        return 'mdi-help'
      }
    },
    getTagColor(tag) {
      let status = this.data.tagged[tag]?.status || 'unknown'
      if (status == 'done') {
        return 'green'
      } else if (status == 'missing') {
        return 'red'
      } else {
        return 'orange'
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
      this.hoverDescription =
        '<b>' + severity + '</b>: ' + xx.severity.find(x => x.value == severity).description
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
    this.tags = raw.content
    this.categories = raw.categories
    this.severities = raw.severities
    this.context = raw.context

    //this.loadTagsFromSettings()  // -> this is better triggered when data changes
  }
}
</script>

<style>
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

.sliders {
  display: grid;
  padding: 10px;
  grid-template-columns: 80px 220px;
  grid-column-gap: 15px;
  grid-row-gap: 15px;
}

.slider {
  -webkit-appearance: none;
  width: 100%;
  height: 10px;
  border-radius: 5px;
  background: #d3d3d3;
  outline: none;
  opacity: 0.7;
  -webkit-transition: 0.2s;
  transition: opacity 0.2s;
}

.slider:hover {
  opacity: 1;
}

.sliderticks {
  display: flex;
  justify-content: space-between;
  padding: 0 10px;
}

.sliderticks p {
  white-space: nowrap;
  position: relative;
  display: flex;
  justify-content: center;
  text-align: center;
  width: 1px;
  background: #d3d3d3;
  height: 5px;
  line-height: 40px;
  margin: 0 0 20px 0;
  font-size: 11px;
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
