<template>
  <div>
    <v-dialog
      v-model="visible"
      width="500"
      max-width="100%"
      persistent
      fullscreen
      transition="dialog-bottom-transition"
    >
      <!-- Feel free to test adding fullscreen prop on the dialog :) -->

      <v-card>
        <v-card-title primary-title style="font-size:130%; padding-bottom:2px; padding-top:2px">
          What content is fully listed?
        </v-card-title>
        <v-card-text style="padding-bottom:5px" class="px-2">
          <!-- TABS MENU -->
          <v-tabs
            show-arrows
            v-model="tab"
            background-color="transparent"
            color="basil"
            grow
            height="30px"
          >
            <v-tab style="font-size:90%">sex</v-tab>
            <v-tab style="font-size:90%">violence</v-tab>
            <v-tab style="font-size:90%">profanity</v-tab>
          </v-tabs>

          Click on the icons below to change their status
          <!-- TABS (now dynamic instead of duplicate code) -->
          <v-tabs-items v-model="tab" class="pt-3">
            <v-tab-item v-for="(tag_group, index) in tag_groups" :key="index">
              <div v-for="(tag, index) in tag_group" :key="index">
                <v-row class="mb-5">
                  <v-col cols="4" class="py-0" style="cursor: pointer;">
                    <v-icon :class="getStatus(tag) == `missing` ? `` : `inactive`"
                    @click="setStatus(tag,`missing`)" color="red">
                      mdi-flag-variant
                    </v-icon>
                    <v-icon :class="getStatus(tag) == `unknown` ? `` : `inactive`"
                    @click="setStatus(tag,`unknown`)"
                     color="gray" style="padding: 0 5px;">
                      mdi-progress-question
                    </v-icon>
                    <v-icon
                      :class="getStatus(tag) == `done` ? `` : `inactive`"
                      @click="setStatus(tag,`done`)"
                      :color="certifiedColor"
                    >
                      {{ scenesCountByTag(tag) == 0 ? 'mdi-emoticon-happy' : 'mdi-content-cut' }}
                    </v-icon>
                  </v-col>
                  <v-col class="py-0">
                    <b style="min-width: 100px">{{ tag.title }} ({{ scenesCountByTag(tag) }})</b>
                    <fc-tooltip :text="tag.description" position="bottom">
                      <v-icon color="gray" small class="ml-2 mb-1">mdi-help-circle-outline</v-icon>
                    </fc-tooltip>
                  </v-col>
                </v-row>
              </div>
            </v-tab-item>
          </v-tabs-items>

          <!-- Shield explainer tooltips -->

          <div style="margin-top: 20px; font-size: 90%">
            <h4>Definitions</h4>
            <!-- unknown shield -->
            <fc-tooltip text="The movie might contain scenes of this type which are not yet listed">
              <v-icon small color="gray" class="mb-1">mdi-progress-question</v-icon> I don't know
            </fc-tooltip>
            |

            <!-- Missing shield -->
            <fc-tooltip text="The movie contains scenes of this type that are not yet listed">
              <v-icon small color="red" class="mb-1">mdi-flag-variant</v-icon> Pending
            </fc-tooltip>
            |

            <!-- Done-Clean shield -->
            <fc-tooltip text="Movie was originally clean for this type: no need to skip anything">
              <v-icon small :color="certifiedColor" class="mb-1">mdi-emoticon-happy</v-icon> Clean
            </fc-tooltip>
            |
            <!-- Done-Cut shield -->
            <fc-tooltip text="All scenes of this type are properly filtered">
              <v-icon small :color="certifiedColor" class="mb-1">mdi-content-cut</v-icon> Cut
            </fc-tooltip>

            <!--<fc-tooltip text="All scenes of this type have been listed with the right times">
              <v-icon :color="certifiedColor">mdi-content-cut</v-icon> Cut
            </fc-tooltip>-->
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>

          <v-btn text @click="cancel()">
            Cancel
          </v-btn>
          <fc-tooltip text="This movie is safe for all the categories I consider relevant, i.e. the categories I have marked as unwanted">
            <v-btn color="success" text @click="cleanForMe()">
              Clean for me
            </v-btn>
          </fc-tooltip>
          <v-btn color="primary" text @click="save()">
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import fclib from '../js/fclib'
var raw = require('../js/raw_tags')
export default {
  props: {
    data: Object,
    visible: {
      type: Boolean,
      default: false
    },
    tagged_original: {
      type: Object,
      default() {
        return {}
      }
    },
    level: {
      type: Number,
      default: 0
    }
  },
  data() {
    return {
      tab: 0,

      tagged: {}
    }
  },

  watch: {
    tagged_original(newValue) {
      this.tagged = newValue
    }
  },

  computed: {
    tag_groups() {
      let x = [
        JSON.parse(JSON.stringify(raw.content[0].severity)).reverse(),
        JSON.parse(JSON.stringify(raw.content[1].severity)).reverse(),
        JSON.parse(JSON.stringify(raw.content[2].severity)).reverse()
      ]
      return x
    },
    certifiedColor() {
      if (this.level >= 6) return 'blue'
      return 'green'
    }
  },

  methods: {
    scenesCountByTag(tag) {
      //TODO: Replace usage of this with tagged[tag].count, which should have that information
      //this counts the scenes per tag from the full data Object
      var xx = {}
      if (this.data.scenes) {
        //avoid errors
        this.data.scenes.forEach(scene => {
          if (scene.tags) {
            scene.tags.forEach(tag => {
              if (!xx[tag]) xx[tag] = 0
              xx[tag] = xx[tag] + 1
            })
          }
        })
      }
      let n = xx[tag.value] ? xx[tag.value] : 0
      return n
    },
    cancel() {
      console.log('shield-cancel')
      this.tagged = this.tagged_original //make sure UI looks as before changes
      this.$emit('hide') //send the visible=false (iput changes the parent v-model)
    },
    save() {
      console.log('shield-save')
      fclib.sendMessage({ msg: 'set-tagged', tagged: this.tagged })
      this.$emit('hide') //Close dialog
    },

    getStatus(tag) {
      if (!this.tagged[tag.value]) return 'unknown'
      return this.tagged[tag.value].status || 'unknown'
    },

    setStatus(tag,status){
      if (!this.tagged[tag.value]) this.tagged[tag.value] = {}
      this.tagged[tag.value].status = status
      this.$forceUpdate()
    },

    cleanForMe(){
      let me = this.data.settings.skip_tags
      for (let group of this.tag_groups ){
        for( let tag of group ){
          if( me.includes(tag.value) ){
            this.setStatus(tag,'done')
          } else {
            console.log('[cleanForMe] what shall we do here?')
            //this.setStatus(tag,'')
          }
        }
      }
    },

    nextStatus(tag) {
      var current = this.status(tag)
      if (!this.tagged[tag.value]) this.tagged[tag.value] = {}
      // Update status
      if (current == 'done') {
        this.tagged[tag.value].status = 'missing'
      } else if (current == 'missing') {
        this.tagged[tag.value].status = 'unknown'
      } else {
        this.tagged[tag.value].status = 'done'
      }
      console.log('Status of', tag.value, ' updated from ', current, ' to ', this.status(tag))
      this.$forceUpdate()
    }
  }
}
</script>

<style lang="scss" scoped>
.inactive {
  opacity: 0.1;
  color: gray !important;
}
</style>
