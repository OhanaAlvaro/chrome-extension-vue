<template>
  <div style="min-width: 300px;">
    <!-- TODO: I think we could have a different view to show list of scenes when user clicks on the chip with the scenes count-->
    <!-- 1. HEADER -->
    <div>
      <h2 @mouseover="mouseoverSample = 'Select the categories'" @mouseleave="mouseoverSample = ''">
        What do you want to skip?
      </h2>

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
        <v-btn @click="go2Login()" color="grey" fab x-small dark depressed>
          <v-icon>mdi-account</v-icon>
        </v-btn>

        <!--
        <span @click="go2Login()">
          <v-icon>mdi-account-circle</v-icon>
          <br />
          {{ this.data.settings.username ? this.data.settings.username : 'Log in' }}
        </span>
        -->

        <!--ADD  window.close(); to close popup (beware you will have to make the windows object accessible to within vue)-->
        <!--
        <span @click="sendMessage({ msg: 'show-sidebar' })">
          <v-icon small>mdi-pencil</v-icon>
        </span>
        -->

        <!--
        <span>
          <v-icon small @click="$router.push('/login')">mdi-cog</v-icon>
        </span>
        -->
      </span>
    </div>
    <br />

    <!-- 2. CATEGORIES/SEVERITY SELECTION -->

    <div id="alex-dropdowns">
      <div v-for="(cat, index) in categories" :key="index">
        <v-row>
          <v-col cols="8">
            <v-select
              dense
              hide-details
              :label="cat"
              :items="severities[index]"
              multiple
              v-model="selectedTags[index]"
              @change="selectRedundandtTags()"
              style="margin-bottom: 0px; font-size: 40%"
            >
              <template
                v-slot:item="{
                  parent,
                  item
                }"
              >
                {{ item }}
                <v-spacer></v-spacer>
                <!-- <span style="font-size: 9px; color: gray">{{
              '(' + Math.floor(Math.random() * 11) + ' filters)'
            }}</span> -->

                <span style="font-size: 9px; color: gray">
                  {{ scenesCountByTag[item] ? scenesCountByTag[item] : 0 }} filters
                </span>

                <!--
            <v-spacer></v-spacer>

            <fc-tooltip position="right" :text="'We are good to go'">
              <v-icon small color="error" v-if="Math.floor(Math.random() * 11) < 1"
                >mdi-alert-box</v-icon
              >
              <v-icon small color="success" v-else-if="Math.floor(Math.random() * 11) < 8"
                >mdi-checkbox-marked</v-icon
              >
              <v-icon small v-else color="orange">mdi-help-box</v-icon>
            </fc-tooltip>
            -->
              </template>

              <!--
          <template v-slot:message="{ message, key }">
            <span style="color: green; font-size: 10px"
              >All good, we will skip {{ Math.round(Math.random(0, 10), 2) * 100 }} scenes!</span
            >
          </template>-->
            </v-select></v-col
          >
          <v-col
            ><v-chip x-small dark color="grey">
              {{ scenesCountByCategory[index].selected + '/' + scenesCountByCategory[index].total }}
              selected
              <!--<v-icon x-small>mdi-check</v-icon>-->
            </v-chip></v-col
          >
        </v-row>
      </div>
    </div>

    <!-- 3. SUMMARY TEXT -->

    <div align="left" justify="center" style="width:300px">
      <span v-if="!data.success">
        <b style="color: red">No movie!</b>
        Open a specific movie/show to start using Ohana. If you've already opened a movie, try
        refreshing the page.
      </span>

      <span v-else-if="data.shield == `done`">
        <b style="color: #00b359">Grab some popcorn and enjoy!</b> We will skip all
        {{ scenesCountByCategory.reduce((x, a) => x + a.selected, 0) }} unwanted scenes
      </span>
      <span v-else-if="data.shield == `unkown`">
        <b style="color: orangered">Careful!</b> We might not be able to skip all unwanted scenes.
      </span>
      <span v-else>
        <b style="color: red">Careful!</b> Users reported there are scenes not yet filtered, so we
        can't skip all your unwanted content.
      </span>
    </div>

    <!-- 4. ACTION BUTTONS-->
    <div>
      <v-row>
        <v-col>
          <v-btn color="black" dark block dense depressed tile @click="showSidebar(true)"
            >Improve filters</v-btn
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
            href="https://www.patreon.com/ohanafilters"
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
              snackbarText = `You can't change that yet... but soon!`
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
      var xx = []
      this.selectedTags.forEach(category => {
        category.forEach(tag => {
          xx.push(tag)
        })
      })
      return xx
    },
    scenesCountByTag() {
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
      mouseoverSample: '',

      snackbarText: '',
      snackbar: false,
      snackbarTimeout: 6000,
      snackbarColor: 'info',

      selectedTags: [], //arrray of arrays [[sex_tags],[vio_tags], etc] (order depens on the raw-tags json file, but all view is aligned to work)
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
    /*,
    finalSelectedTags(newValue, oldValue) {
      //trigger save  only if there are new tags.
      var xx = false
      //if a new tag was added to the preferences...
      newValue.forEach(tag => {
        if (!oldValue.includes(tag)) xx = true
      })
      //if a tag was removed from the preferences...
      oldValue.forEach(tag => {
        if (!newValue.includes(tag)) xx = true
      })

      if (xx) {
        this.saveSkipTagsSettings(false)
      }
    }*/
  },

  methods: {
    selectRedundandtTags() {
      //Ugly version but at least prevents users from non selecting the redundant tags
      //TODO: Make this more smooth. Probably we need to replace the v-select with a dialog/menu with a list inside, and make it much more customized (example: add severity descriptions)

      var xx = []
      var zz = this.selectedTags

      for (let i = 0; i < this.categories.length; i++) {
        var addNext = false
        xx.push([])
        for (let j = 0; j < this.severities[i].length; j++) {
          var severity = this.severities[i][j]
          if (zz[i].includes(severity) || addNext) {
            xx[i].push(severity)
            addNext = true //add the next ones (as they should include it)
          }
        }
      }

      //if (newValue.length != xx.length) {
      this.selectedTags = xx
      this.saveSkipTagsSettings(false) //save them
      //}
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
      /*console.log('[sendMessage-Home]: ', msg)
      chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
        chrome.tabs.sendMessage(tabs[0].id, msg, function(response) {
          if (callback) callback(response)
        })
      })*/
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
