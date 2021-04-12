<template>
  <div>
    <v-dialog v-model="visible" max-width="100%" persistent fullscreen>
      <!-- feel free to test adding fullscreen prop on the dialog :) -->
      <v-card>
        <v-card-title style="font-size:130%;">
          <h2>Scene editor</h2>
        </v-card-title>
        <v-card-text>
          <br />

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
              {{ item.value }}
            </template>
            <template v-slot:item="{ item }">
              <fc-tooltip :text="item.description">
                {{ item.value }}
              </fc-tooltip>
            </template>
          </v-select>

          <v-select dense v-model="scene.context" :items="content.context" label="Context" multiple>
            <template v-slot:selection="{ item }">
              <v-chip small>{{ item.value }}</v-chip>
            </template>
            <template v-slot:item="{ item }">
              <fc-tooltip :text="item.description">
                {{ item.value }}
              </fc-tooltip>
            </template>
          </v-select>

          <v-textarea
            dense
            label="Comments "
            v-model="scene.comments"
            auto-grow
            rows="2"
            row-height="15"
          ></v-textarea>

          <!-- -->
          <br />
          <br />
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

          <v-btn @click="seekForward(-1000)" class="no-uppercase" text small>
            -1s
          </v-btn>

          <v-btn @click="seekForward(-50)" class="no-uppercase" text small>
            -1f
          </v-btn>

          <v-btn @click="sendMessage({ msg: 'play-pause' })" text small>
            <v-icon fab>mdi-play-pause</v-icon>
          </v-btn>

          <v-btn @click="seekForward(50)" class="no-uppercase" text small>
            +1f
          </v-btn>

          <v-btn @click="seekForward(1000)" class="no-uppercase" text small>
            +1s
          </v-btn>

          <br />
          <br />
          <br />

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
        return { category: '', severity: '' }
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
      if (scene.context) scene.tags = fclib.intersect(scene.context, this.context) // remove invalid tagsx
      scene.tags.push(scene.category)
      scene.tags.push(scene.severity)
      delete scene.category
      delete scene.context
      delete scene.severity
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
