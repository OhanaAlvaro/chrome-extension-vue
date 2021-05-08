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
        <v-card-text>
          <div id="sceneTagsUI">
            <h3>Describe the scene</h3>
            <br />
            <v-select
              dense
              label="Category"
              v-model="scene.category"
              :items="categories"
              @change="categoryUpdated"
            ></v-select>

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

            <v-select
              dense
              v-model="scene.context"
              :items="content.context"
              label="Provide more context"
              multiple
            >
              <template v-slot:selection="{ item }">
                <v-chip small>{{ item.value }}</v-chip>
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

            <!-- IMAGE / SOUND / BOTH -->
            <v-select
              dense
              label="This impacts..."
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

            <!-- PLOT / MILD PLOT / NO PLOT -->
            <v-select
              dense
              label="Is this important for the plot?"
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

            <v-textarea
              v-if="scene.plotTag == 'Mild plot' || scene.plotTag == 'Strong plot'"
              dense
              label="What do people need to know?"
              v-model="scene.plot_description"
              auto-grow
              rows="2"
              row-height="15"
              :hint="
                'Don\'t be explicit on the ' +
                  (scene.category ? scene.category : '') +
                  ' details! You writing for people that don\'t want to watch this scene'
              "
            ></v-textarea>
          </div>
          <!-- -->
          <br />
          <br />
          <div id="fineTuneTimes">
            <div style="display: flex;">
              <h3 style="margin: auto 0;">Fine tune the times</h3>
              <v-btn text small @click="sendMessage({ msg: 'preview', scene: scene })">
                Preview
              </v-btn>
            </div>

            <div style="display: flex;">
              <span style="margin: auto 0;">Start:</span>
              <time-editor v-model="scene.start" @change="seekFrame(scene.start)"></time-editor>
              <v-btn text small @click="getTime('start')">Now</v-btn>
              <v-btn text small @click="seekFrame(scene.start)">Go</v-btn>
            </div>
            <div style="display: flex;">
              <span style="margin: auto 0;">End: </span>
              <time-editor v-model="scene.end" @change="seekFrame(scene.end)"></time-editor>
              <v-btn text small @click="getTime('end')">Now</v-btn>
              <v-btn text small @click="seekFrame(scene.end)">Go</v-btn>
            </div>

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

            <br />
            <br />
            <br />
          </div>
          <div id="editorSafety">
            <h3>Editor's safety</h3>

            <div style="display: flex;">
              <!-- Mute video while marking scene-->
              <v-checkbox
                style="margin: auto 0px;"
                v-model="mute_status"
                :label="`Mute`"
                @change="mute"
              ></v-checkbox>
              <span style="width: 40px;"></span>
              <!-- Blur slider: allow user to control the blur right from here -->
              <v-slider
                style="margin: auto 0px;"
                v-model="blur_level"
                inverse-label
                :min="0"
                :max="40"
                thumb-label
                :label="`Blur`"
                step="2"
                @change="blur"
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
          <span style="width:60px"></span>
          <v-btn color="primary" text small @click="save()">
            Save
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
    scene: {
      type: Object,
      default() {
        return { category: '', severity: '', plotTag: '', videoAudioTag: '' }
      }
    }
  },

  data() {
    return {
      sliderValue: 4,
      mute_on_mark: false,
      severities: [],
      context: [],
      content: {},
      blur_level: 0,
      mute_status: false
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
    scene() {
      this.categoryUpdated()
    }
  },

  methods: {
    cancel() {
      this.$emit('hide')
    },
    save() {
      fclib.sendMessage({ msg: 'update-scene', scene: this.cleanScene(this.scene) })
      this.$emit('hide')
    },
    getTime(edge) {
      fclib.sendMessage({ msg: 'get-time' }, response => {
        if (response && response.time) this.scene[edge] = response.time
      })
    },
    removeScene() {
      fclib.sendMessage({ msg: 'remove', id: this.scene.id })
      this.$emit('hide')
    },
    seekForward(diff) {
      fclib.sendMessage({ msg: 'seek-diff', diff: diff })
    },
    seekFrame(time) {
      fclib.sendMessage({ msg: 'seek-frame', time: time })
    },
    blur() {
      fclib.sendMessage({ msg: 'blur', blur_level: this.blur_level })
    },
    mute() {
      fclib.sendMessage({ msg: 'mute', state: this.mute_status })
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
      scene.tags.push(scene.videoAudioTag)
      delete scene.videoAudioTag
      //TODO 5. plot tag
      scene.tags.push(scene.plotTag)
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

<style lang="scss" scoped>
.no-uppercase {
  text-transform: none;
}
</style>
