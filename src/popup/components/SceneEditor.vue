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
              <v-col class="py-0 px-3">
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
                  label="This applies to..."
                  v-model="scene.videoAudioTag"
                  :items="videoAudioTags"
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
              <!-- PLOT / MILD PLOT / NO PLOT -->
              <v-col class="py-0 px-3">
                <v-select
                  dense
                  label="Is this relevant for the plot?"
                  v-model="scene.plotTag"
                  :items="plotTags"
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

            <v-row v-if="scene.plotTag == 'Mild plot' || scene.plotTag == 'Strong plot'">
              <v-col class="py-0 pt-3 px-3">
                <v-textarea
                  counter
                  dense
                  label="What do users need to know to follow the plot?"
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
              <v-btn
                text
                x-small
                @click="sendMessage({ msg: 'preview', scene: scene })"
                color="primary"
              >
                Preview
                <!-- <v-icon right small dark>
                  mdi-eye
                </v-icon>
                -->
              </v-btn>
            </div>

            <div style="display: flex;">
              <span style="margin: auto 0;">Start:</span>
              <time-editor v-model="scene.start" @change="seekFrame(scene.start)"></time-editor>
              <v-spacer></v-spacer>

              <v-btn outlined class="mx-1 mt-1" x-small @click="getTime('start')">Now</v-btn>

              <v-btn outlined class="mx-1 mt-1" x-small @click="seekFrame(scene.start)">Go</v-btn>
            </div>
            <div style="display: flex;">
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

              <v-btn @click="sendMessage({ msg: 'play-pause' })" text small>
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
                :min="0"
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
        return { category: '', severity: '', plotTag: '', videoAudioTag: '', plot_description: '' }
      }
    },
    settings: {
      type: Object,
      default(){
        return {blur_on_edit: 0, mute_on_edit: false}
      }
    }
  },

  data() {
    return {
      scene: { category: '', severity: '', plotTag: '', videoAudioTag: '', plot_description: '' },

      sliderValue: 4,
      severities: [],
      context: [],
      content: {},
    }
  },

  computed: {
    categories() {
      return raw_tags.categories
    },
    videoAudioTags() {
      return raw_tags.extraTags.videoAudioTags
    },
    plotTags() {
      return raw_tags.extraTags.plotTags
    }
  },

  watch: {
    the_scene: {
      deep: true,
      handler(value) {
        //console.log('alex5 - watched!', value)
        this.scene = JSON.parse(JSON.stringify(value))
      }
    },
    scene() {
      this.categoryUpdated()
    }
  },

  methods: {
    hide(){
      fclib.sendMessage({ msg: 'view-mode'})
      fclib.sendMessage({ msg: 'update-settings', settings: this.settings })
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
        if (response && response.time) this.scene[edge] = response.time
      })
    },
    seekForward(diff) {
      fclib.sendMessage({ msg: 'seek-diff', diff: diff })
    },
    seekFrame(time) {
      fclib.sendMessage({ msg: 'pause' })
      fclib.sendMessage({ msg: 'seek-frame', time: time })
    },
    blur(level) {
      if (level === null) level = this.settings.blur_on_edit
      fclib.sendMessage({ msg: 'blur', blur_level: level })
    },
    mute() {
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
      scene.tags.push(scene.severity)
      delete scene.severity

      //TODO 4. audio/video/both tag
      if (scene.videoAudioTag) scene.tags.push(scene.videoAudioTag)
      delete scene.videoAudioTag
      //TODO 5. plot tag
      if (scene.plotTag) scene.tags.push(scene.plotTag)
      delete scene.plotTag

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
</style>
