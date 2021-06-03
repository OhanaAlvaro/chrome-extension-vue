<template>
  <div>
    <v-dialog
      v-model="visible"
      max-width="100%"
      persistent
      fullscreen
      transition="dialog-bottom-transition"
      class="px-2"
    >
      <!-- feel free to test adding fullscreen prop on the dialog :) -->

      <v-card>
        <!--
        <v-card-title style="font-size:130%;">
          <h2>Scene editor</h2>
        </v-card-title>
        -->
        <br />
        <v-card-text class="px-3">
          <div id="sceneTagsUI">
            <h3>Describe the scene</h3>
            <br />

            <v-row>
              <v-col class="py-0 px-3">
                <v-select
                  dense
                  label="Category"
                  v-model="scene.category"
                  :items="categories"
                  @change="categoryUpdated"
                ></v-select>
              </v-col>
              <v-col class="py-0 px-3" v-if="severities.length > 0">
                <v-select dense label="Severity" v-model="scene.severity" :items="content.severity">
                  <template v-slot:selection="{ item }">
                    <span style="font-size: 12px"> {{ item.value }}</span>
                  </template>

                  <template v-slot:item="{ active, item, attrs, on }">
                    <v-list-item v-on="on" v-bind="attrs" dense style="max-height: 10px">
                      <v-list-item-content>
                        <v-list-item-title>{{ item.value }} </v-list-item-title>
                      </v-list-item-content>

                      <v-list-item-action>
                        <fc-tooltip
                          :text="item.description ? item.description : 'No data available'"
                          :html="false"
                          position="top"
                        >
                          <v-btn icon>
                            <v-icon color="grey lighten-1" small>mdi-information</v-icon>
                          </v-btn>
                        </fc-tooltip>
                      </v-list-item-action>
                    </v-list-item>
                  </template>
                  <!--
            <template v-slot:item="{ item }">
              <fc-tooltip :text="item.description">
                {{ item.value }}
              </fc-tooltip>
            </template>
            -->
                </v-select>
              </v-col>
            </v-row>

            <v-row>
              <v-col class="py-0 px-3">
                <v-select
                  dense
                  v-model="scene.context"
                  :items="content.context"
                  label="Provide more context"
                  multiple
                >
                  <template v-slot:selection="{ item }">
                    <v-chip x-small>{{ item.value }}</v-chip>
                  </template>

                  <template v-slot:item="{ active, item, attrs, on }">
                    <v-list-item v-on="on" v-bind="attrs" dense style="max-height: 10px">
                      <v-list-item-content>
                        <v-list-item-title>{{ item.value }} </v-list-item-title>
                      </v-list-item-content>

                      <v-list-item-action>
                        <fc-tooltip
                          :text="item.description ? item.description : 'No data available'"
                          :html="false"
                          position="top"
                        >
                          <v-btn icon>
                            <v-icon color="grey lighten-1" small>mdi-information</v-icon>
                          </v-btn>
                        </fc-tooltip>
                      </v-list-item-action>
                    </v-list-item>
                  </template>

                  <!--
            <template v-slot:item="{ item }">
              <fc-tooltip :text="item.description">
                {{ item.value }}
              </fc-tooltip>
            </template>
            -->
                </v-select>
              </v-col>
            </v-row>

            <v-row>
              <v-col class="py-0 px-3">
                <!-- IMAGE / SOUND / BOTH -->
                <v-select
                  dense
                  label="What should we do?"
                  v-model="scene.actionTag"
                  :items="actionTags"
                >
                  <template v-slot:selection="{ item }">
                    <span style="font-size: 12px"> {{ item.value }}</span>
                  </template>

                  <template v-slot:item="{ active, item, attrs, on }">
                    <v-list-item v-on="on" v-bind="attrs" dense style="max-height: 10px">
                      <v-list-item-content>
                        <v-list-item-title>{{ item.value }} </v-list-item-title>
                      </v-list-item-content>

                      <v-list-item-action>
                        <fc-tooltip
                          :text="item.description ? item.description : 'No data available'"
                          :html="false"
                          position="top"
                        >
                          <v-btn icon>
                            <v-icon color="grey lighten-1" small>mdi-information</v-icon>
                          </v-btn>
                        </fc-tooltip>
                      </v-list-item-action>
                    </v-list-item>
                  </template>
                </v-select>
              </v-col>
            </v-row>

            <v-row v-if="scene.actionTag != 'Skip'">
              <v-col class="py-0 px-3">
                <v-textarea
                  counter
                  dense
                  :label="scene.actionTag == 'Just text'? 'What do users need to know to follow the plot?' : 'Is there anything users need to know to follow the plot?'"
                  v-model="scene.plot_description"
                  auto-grow
                  rows="1"
                  :hint="
                    'Don\'t be explicit on the ' +
                      (scene.category ? scene.category : '') +
                      ' details! You are writing for people that don\'t want to watch this scene'
                  "
                >
                </v-textarea>
              </v-col>
            </v-row>
          </div>
          <!-- -->

          <div id="fineTuneTimes" style="margin-top: 30px">
            <div style="display: flex;">
              <h3 style="margin: auto 0;">Fine tune the times</h3>
              <!--
              <fc-tooltip
                text="<b>Now: </b>Make start/end time match current video time<br><b>Go: </b>Take the video to the current start/end time"
                :html="true"
                position="top"
              >
                <v-icon color="gray" x-small class="ml-1">mdi-help-circle-outline</v-icon>
              </fc-tooltip>
              -->
              <v-spacer></v-spacer>
              <fc-tooltip
                text="Click to preview the final result (without the unwanted content)"
                position="top"
              >
                <v-btn text x-small @click="preview" color="primary">
                  <span v-if="isPreviewing">
                    End Preview
                  </span>
                  <span v-else>Preview cut</span>
                  <!-- <v-icon right small dark>
                  mdi-eye
                </v-icon>
                -->
                </v-btn>
              </fc-tooltip>
            </div>

            <div style="display: flex;">
              <span style="margin: auto 0;">Start:</span>
              <time-editor v-model="scene.start" @change="seekFrame(scene.start)"></time-editor>
              <v-spacer></v-spacer>

              <v-btn outlined class="mx-1 mt-1" x-small @click="getTime('start')">Now</v-btn>

              <v-btn outlined class="mx-1 mt-1" x-small @click="seekFrame(scene.start)">Go</v-btn>
            </div>
            <div style="display: flex; margin-top: 2px">
              <span style="margin: auto 0;">End: </span>
              <time-editor v-model="scene.end" @change="seekFrame(scene.end)"></time-editor>
              <v-spacer></v-spacer>

              <v-btn outlined class="mx-1 mb-1" x-small @click="getTime('end')">Now</v-btn>

              <v-btn outlined class="mx-1 mb-1" x-small @click="seekFrame(scene.end)">Go</v-btn>
            </div>

            <div style="margin-top:20px;">
              <h4>Player controls</h4>
              <v-btn @click="seekForward(-5000)" class="no-uppercase" text small>
                -5s
              </v-btn>

              <v-btn @click="seekForward(-500)" class="no-uppercase" text small>
                -0.5s
              </v-btn>

              <v-btn @click="togglePlay()" text small>
                <v-icon fab>mdi-play-pause</v-icon>
              </v-btn>

              <v-btn @click="seekForward(500)" class="no-uppercase" text small>
                +0.5s
              </v-btn>

              <v-btn @click="seekForward(5000)" class="no-uppercase" text small>
                +5s
              </v-btn>
            </div>
          </div>

          <div id="time-travel" @click="timeTravel">
            <table>
              <tr>
                <td :style="'width: ' + w1 + '%'" class="color1"></td>
                <td :style="'width: ' + w2 + '%'" class="color2"></td>
                <td class="color1"></td>
              </tr>
            </table>

            <b :style="'margin-left:' + w3 + '%'" id="current-time">^</b>
          </div>

          <div id="editorSafety" style="margin-top: 20px">
            <h4>Stay safe while you edit</h4>

            <div style="display: flex;">
              <!-- Mute video while marking scene-->
              <v-checkbox
                style="margin: auto 0px;"
                v-model="settings.mute_on_edit"
                :label="`Mute`"
                @change="mute"
              ></v-checkbox>
              <span style="width: 40px;"></span>
              <!-- Blur slider: allow user to control the blur right from here -->

              <v-slider
                style="margin: auto 0px;"
                v-model="settings.blur_on_edit"
                inverse-label
                :min="4"
                :max="40"
                thumb-label
                :label="`Blur`"
                step="2"
                @input="blur"
              >
                <template v-slot:thumb-label="{ value }">{{ 2.5 * value + '%' }}</template>
              </v-slider>
            </div>
          </div>
          <br />
        </v-card-text>
        <v-card-actions>
          <v-btn text small color="error" @click="removeScene()">
            Remove
          </v-btn>

          <v-btn text small @click="cancel()">
            Cancel
          </v-btn>
          <!--<span style="width:60px"></span>-->
          <v-spacer></v-spacer>
          <v-btn color="success" text small @click="save()" style="margin-right: 10px">
            Save
            <v-icon right dark>
              mdi-cloud-upload
            </v-icon>
          </v-btn>
          <!--<v-btn  small text @click="save()">
            Publish
          </v-btn>-->
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import TimeEditor from '../components/TimeEditor.vue'
import fclib from '../js/fclib'
import raw_tags from '../js/raw_tags'

export default {
  components: {
    TimeEditor
  },
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    the_scene: {
      type: Object,
      default() {
        return { category: '', severity: '', actionTag: 'Skip', plot_description: '' }
      }
    },
    settings: {
      type: Object,
      default() {
        return { blur_on_edit: 0, mute_on_edit: false }
      }
    }
  },

  data() {
    return {
      scene: { category: '', severity: '', actionTag: 'Skip', plot_description: '' },
      currentTime: 0,
      sliderValue: 4,
      severities: [],
      context: [],
      content: {},
      isPreviewing: false
    }
  },

  mounted() {
    this.$nextTick(function() {
      console.log('SceneEditor mounted ', this.visible)
      var that = this
      setInterval(function() {
        if (that.visible) {
          fclib.sendMessage({ msg: 'get-time' }, response => {
            if (response && response.time) that.currentTime = response.time
          })
        }
      }, 250)
    })
  },
  computed: {
    categories() {
      return raw_tags.categories
    },
    actionTags() {
      return raw_tags.extraTags.actionTags
    },
    t0() {
      return Math.min(this.scene.start - 20e3, this.currentTime - 20e3)
    },
    tf() {
      return Math.max(this.scene.end + 20e3, this.currentTime + 20e3)
    },
    w1() {
      return ((this.scene.start - this.t0) / (this.tf - this.t0)) * 100
    },
    w2() {
      var len = ((this.scene.end - this.scene.start) / (this.tf - this.t0)) * 100
      if (len <= 0) return 0.1
      return len
    },
    w3() {
      return ((this.currentTime - this.t0) / (this.tf - this.t0)) * 100 - 1
    }
  },

  watch: {
    the_scene: {
      deep: true,
      handler(value) {
        //console.log('alex5 - watched!', value)
        this.scene = JSON.parse(JSON.stringify(value))
        this.categoryUpdated()
        console.log('handler',this.scene.actionTag)
      }
    },
  },

  methods: {
    hide() {
      fclib.sendMessage({ msg: 'view-mode' })
      this.isPreviewing = false
      this.$emit('hide')
    },
    cancel() {
      this.scene = this.the_scene //reset value to original from the prop
      this.hide()
    },
    save() {
      fclib.sendMessage({ msg: 'update-scene', scene: this.cleanScene(this.scene) })
      this.hide()
    },
    removeScene() {
      fclib.sendMessage({ msg: 'remove', id: this.scene.id })
      this.hide()
    },
    getTime(edge) {
      fclib.sendMessage({ msg: 'get-time' }, response => {
        if (response && response.time) {
          this.scene[edge] = response.time
        }
      })
    },
    togglePlay() {
      fclib.sendMessage({ msg: 'play-pause' })
      fclib.sendMessage({ msg: 'view-mode', mode: 'seek' })
    },
    timeTravel(event) {
      let x = event.clientX - 12
      let xTotal = document.getElementById('time-travel').offsetWidth
      let tTotal = this.tf - this.t0

      let t = this.t0 + (x / xTotal) * tTotal
      console.log('values ', event, x, xTotal, tTotal, this.tf, this.t0)
      fclib.sendMessage({ msg: 'pause' })
      fclib.sendMessage({ msg: 'view-mode', mode: 'edit' })
      fclib.sendMessage({ msg: 'seek-frame', time: t })
    },
    /*editMode() {
      fclib.sendMessage({ msg: 'view-mode', mode: 'edit' })
    },*/
    preview() {
      if (this.isPreviewing) {
        this.isPreviewing = false
        fclib.sendMessage({ msg: 'preview', scene: false })
      } else {
        this.isPreviewing = false
        fclib.sendMessage({ msg: 'preview', scene: this.scene })
      }
    },
    seekForward(diff) {
      fclib.sendMessage({ msg: 'view-mode', mode: 'seek' })
      fclib.sendMessage({ msg: 'seek-diff', diff: diff })
    },
    seekFrame(time) {
      fclib.sendMessage({ msg: 'pause' })
      fclib.sendMessage({ msg: 'view-mode', mode: 'edit' })
      fclib.sendMessage({ msg: 'seek-frame', time: time })
    },
    blur(level) {
      if (level === null) level = this.settings.blur_on_edit
      fclib.sendMessage({ msg: 'update-settings', settings: this.settings, silent: true })
      fclib.sendMessage({ msg: 'blur', blur_level: level })
    },
    mute() {
      fclib.sendMessage({ msg: 'update-settings', settings: this.settings, silent: true })
      fclib.sendMessage({ msg: 'mute', state: this.settings.mute_on_edit })
    },
    // Prepare scene to be shared (collapse category, severity and context into tags)
    cleanScene(scene) {
      //1. Context tags  (remove invalid context tags first)
      if (scene.context) scene.tags = fclib.intersect(scene.context, this.context) // remove invalid tags
      delete scene.context

      //2. Category tags
      scene.tags.push(scene.category)
      delete scene.category

      //3. Severity tags
      if (this.severities.includes(scene.severity)) scene.tags.push(scene.severity) //make sure we don't save the severity from other category (it happened, as dropdown was updated but not its value)
      delete scene.severity

      //4. audio/video/both tag
      if (scene.actionTag != 'Skip') scene.tags.push(scene.actionTag)
      delete scene.actionTag

      return scene
    },
    categoryUpdated() {
      if (!this.scene.category) return
      var i = raw_tags.categories.indexOf(this.scene.category)
      this.severities = raw_tags.severities[i]
      this.content = raw_tags.content[i]
      this.context = raw_tags.context[i]
    },
    sendMessage(msg, callback) {
      console.log('[sendMessage-Editor]: ', msg)
      chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
        chrome.tabs.sendMessage(tabs[0].id, msg, function(response) {
          if (callback) callback(response)
        })
      })
    }
  }
}
</script>

<style lang="scss">
.v-textarea textarea {
  margin-top: 4px;
  margin-bottom: 4px;
  font-size: 12px !important;
  line-height: 1.4 !important;
  max-height: 60px !important;
}
.no-uppercase {
  text-transform: none !important;
}

#time-travel table {
  border-collapse: collapse;
  width: 100%;
  cursor: pointer;
}
#time-travel td {
  height: 2px;
  padding: 0px;
}
.color1 {
  background-color: blue;
}
.color2 {
  background-color: red;
}
</style>
