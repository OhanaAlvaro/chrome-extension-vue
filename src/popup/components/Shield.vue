<template>
  <div>
    <v-dialog v-model="visible2" width="500" max-width="80%">
      <!-- feel free to test adding fullscreen prop on the dialog :) -->
      <v-card>
        <v-card-title primary-title>
          Tag progress
          <fc-tooltip text="Click on the shield icons below to change status">
            <v-icon color="blue" small class="pb-1">mdi-information</v-icon>
          </fc-tooltip>

          <v-spacer></v-spacer>
          <div>
            <fc-tooltip text="The movie contains scenes that are not yet tagged">
              <v-icon color="red">mdi-shield-alert</v-icon>Missing
            </fc-tooltip>
            <fc-tooltip text="The movie might contain some untagged scenes of this type">
              <v-icon>mdi-shield-half-full</v-icon> Unkown
            </fc-tooltip>
            <fc-tooltip text="All scenes of this type have been tagged">
              <v-icon color="#00b359">mdi-shield-check</v-icon> Done
            </fc-tooltip>
          </div>
        </v-card-title>
        <v-card-text>
          <div v-for="(tag, index) in tags" :key="index">
            <div @click="tag.status = nextStatus(tag.status)" style="cursor: pointer;">
              <v-icon v-if="tag.status == `missing`" color="red">mdi-shield-alert</v-icon>
              <v-icon v-if="tag.status == `done`" color="#00b359">mdi-shield-check</v-icon>
              <v-icon v-if="tag.status == `unkown`">mdi-shield-half-full</v-icon>
              <b style="min-width: 100px">{{ tag.title }} </b> {{ tag.description }}
            </div>
            <br />
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
      //here v-model is for whether or not this should be visible or not.
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      tags: [],
      tagged: {}
    }
  },
  computed: {
    visible2: {
      get() {
        return this.visible
      },
      set(newvalue) {
        if (newvalue) {
          this.$emit('hide')
        }
      }
    }
  },

  methods: {
    cancel() {
      //just close
      console.log('shield-cancel')
      this.$emit('hide') //send the visible=false (iput changes the parent v-model)
    },

    nextStatus(current) {
      if (current == 'done') {
        return 'missing'
      } else if (current == 'missing') {
        return 'unkown'
      } else {
        return 'done'
      }
    },
    save(msg) {
      console.log('shield-save')
      //TODO: send message to save
      var tagged = {}
      for (var i = 0; i < this.tags.length; i++) {
        tagged[this.tags[i].value] = {
          status: this.tags[i].status
        }
      }
      console.log(tagged)

      fclib.sendMessage({ msg: 'set-tagged', tagged: tagged })
      this.$emit('hide') //Close dialog
    },
    getData() {
      fclib.getData(xx => {
        console.log('rrrr', xx)
        var tagged = xx.tagged
        var tags = raw.content[0].severity.concat(raw.content[1].severity)
        console.log(tags, tagged)
        for (var i = 0; i < tags.length; i++) {
          var value = tags[i].value
          if (!tagged[value]) {
            tags[i].status = 'unkown'
          } else if (tagged[value].status == 'done') {
            tags[i].status = 'done'
          } else if (tagged[value].status == 'missing') {
            tags[i].status = 'missing'
          } else {
            tags[i].status = 'unkown'
          }
        }
        this.tags = JSON.parse(JSON.stringify(tags))
        console.log(this.tags)
      })
    },
    getTagColor() {}
  },
  mounted() {
    this.getData()
    fclib.listenToMessages(xx => {
      if (xx.msg == 'get-data') {
        this.getData()
      }
    })
  }
}
</script>

<style lang="scss" scoped></style>
