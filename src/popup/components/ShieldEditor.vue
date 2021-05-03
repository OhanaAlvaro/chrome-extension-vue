<template>
  <div>
    <v-dialog v-model="visible" width="500" max-width="100%" persistent fullscreen>
      <!-- feel free to test adding fullscreen prop on the dialog :) -->
      <v-card>
        <v-card-title primary-title style="font-size:130%; padding-bottom:2px; padding-top:2px">
          What content is fully listed?
          <fc-tooltip text="Click on the shield icons below to change status">
            <v-icon color="blue" small class="pb-1">mdi-information</v-icon>
          </fc-tooltip>
        </v-card-title>
        <v-card-text style="padding-bottom:5px">
          <!-- TABS MENU -->
          <v-tabs v-model="tab" background-color="transparent" color="basil" grow height="30px">
            <v-tab style="font-size:90%">sex</v-tab>
            <v-tab style="font-size:90%">violence</v-tab>
          </v-tabs>

          <v-tabs-items v-model="tab" class="pt-3">
            <!-- SEX TAB -->
            <v-tab-item>
              <div v-for="(tag_sex, index) in sex_tags" :key="index">
                <div @click="nextStatus(tag_sex)" style="cursor: pointer;">
                  <v-icon v-if="status(tag_sex) == `missing`" color="red">mdi-flag-variant</v-icon>
                  <v-icon v-if="status(tag_sex) == `done`" :color="certifiedColor">mdi-emoticon-happy</v-icon>
                  <v-icon v-if="status(tag_sex) == `cut`" :color="certifiedColor">mdi-content-cut</v-icon>
                  <v-icon v-if="status(tag_sex) == `unknown`" color="gray"
                    >mdi-progress-question</v-icon
                  >
                  <b style="min-width: 100px">{{ tag_sex.title }} </b> - {{ tag_sex.description }}
                </div>
              </div>
            </v-tab-item>

            <!-- VIOLENCE TAB -->
            <v-tab-item>
              <div v-for="(tag_vio, index) in vio_tags" :key="index">
                <div @click="nextStatus(tag_vio)" style="cursor: pointer;">
                  <v-icon v-if="status(tag_vio) == `missing`" color="red">mdi-flag-variant</v-icon>
                  <v-icon v-if="status(tag_vio) == `done`" :color="certifiedColor">mdi-emoticon-happy</v-icon>
                  <v-icon v-if="status(tag_vio) == `cut`" :color="certifiedColor">mdi-content-cut</v-icon>
                  <v-icon v-if="status(tag_vio) == `unknown`" color="gray"
                    >mdi-progress-question</v-icon
                  >
                  <b style="min-width: 100px">{{ tag_vio.title }} </b> - {{ tag_vio.description }}
                </div>
              </div>
            </v-tab-item>
          </v-tabs-items>

          <!-- Shield explainer tooltips -->
          <div style="margin-top: 20px">
            <!-- Missing shield -->
            <fc-tooltip text="The movie contains scenes of this type that are not yet listed">
              <v-icon color="red">mdi-flag-variant</v-icon> Pending
            </fc-tooltip>
            <!-- unknown shield -->
            <fc-tooltip text="The movie might contain scenes of this type which are not yet listed">
              <v-icon color="gray">mdi-progress-question</v-icon> I don't know
            </fc-tooltip>
            <!-- Done shield -->
            <fc-tooltip text="Clean movie, no need to skip anything">
              <v-icon :color="certifiedColor">mdi-emoticon-happy</v-icon> Clean
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
    visible: {
      type: Boolean,
      default: false
    },
    tagged: {
      type: Object,
      default() {
        return {}
      }
    },
    level:{
      type: Number,
      default: 0
    }
  },
  data() {
    return {
      tab: 0
    }
  },

  computed: {
    sex_tags() {
      return JSON.parse(JSON.stringify(raw.content[0].severity)).reverse()
    },
    vio_tags() {
      return JSON.parse(JSON.stringify(raw.content[1].severity)).reverse()
    },
    certifiedColor(){
      if (this.level >= 6) return 'blue'
      return 'green'
    }
  },

  methods: {
    cancel() {
      console.log('shield-cancel')
      this.$emit('hide') //send the visible=false (iput changes the parent v-model)
    },
    save() {
      console.log('shield-save')
      fclib.sendMessage({ msg: 'set-tagged', tagged: this.tagged })
      this.$emit('hide') //Close dialog
    },

    status(tag) {
      if (!this.tagged[tag.value]) return 'unknown'
      return this.tagged[tag.value].status || 'unknown'
    },

    nextStatus(tag) {
      var current = this.status(tag)
      if (!this.tagged[tag.value]) this.tagged[tag.value] = {}
      // Update status
      if (current == 'done' || current == 'cut') {
        this.tagged[tag.value].status = 'missing'
      } else if (current == 'missing') {
        this.tagged[tag.value].status = 'unknown'
      } else {
        if (this.tagged[tag.value].count) {
          this.tagged[tag.value].status = 'cut'
        } else {
          this.tagged[tag.value].status = 'done'  
        }
      }
      console.log('Status of', tag.value, ' updated from ', current, ' to ', this.status(tag))
      this.$forceUpdate()
    }
  }
}
</script>

<style lang="scss" scoped></style>
