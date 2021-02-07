<template>
  <div>
    <v-dialog v-model="visible2" width="500" max-width="100%" persistent fullscreen>
      <!-- feel free to test adding fullscreen prop on the dialog :) -->
      <v-card>
        <v-card-title primary-title style="font-size:130%; padding-bottom:2px; padding-top:2px">
          What content is fully listed?
          <fc-tooltip text="Click on the shield icons below to change status">
            <v-icon color="blue" small class="pb-1">mdi-information</v-icon>
          </fc-tooltip>
        </v-card-title>
        <v-card-text style="padding-bottom:5px">
          <!-- -->
          <v-tabs v-model="tab" background-color="transparent" color="basil" grow height="30px">
            <v-tab style="font-size:90%">
              sex
            </v-tab>
            <v-tab style="font-size:90%">
              violence
            </v-tab>
          </v-tabs>

          <v-tabs-items v-model="tab" class="pt-3">
            <v-tab-item>
              <!-- SEX TAGS -->
              <div v-for="(tag_sex, index) in tags_sex" :key="index" style="padding-bottom:2px">
                <div @click="tag_sex.status = nextStatus(tag_sex.status)" style="cursor: pointer;">
                  <v-icon v-if="tag_sex.status == `missing`" color="red">mdi-shield-alert</v-icon>
                  <v-icon v-if="tag_sex.status == `done`" color="#00b359">mdi-shield-check</v-icon>
                  <v-icon v-if="tag_sex.status == `unkown`">mdi-shield-half-full</v-icon>
                  <b style="min-width: 100px">{{ tag_sex.title }} </b> - {{ tag_sex.description }}
                </div>
              </div>
            </v-tab-item>

            <v-tab-item>
              <!-- VIOLENCE TAGS -->
              <div
                v-for="(tag_violence, index) in tags_violence"
                :key="index"
                style="padding-bottom:2px"
              >
                <div
                  @click="tag_violence.status = nextStatus(tag_violence.status)"
                  style="cursor: pointer;"
                >
                  <v-icon v-if="tag_violence.status == `missing`" color="red"
                    >mdi-shield-alert</v-icon
                  >
                  <v-icon v-if="tag_violence.status == `done`" color="#00b359"
                    >mdi-shield-check</v-icon
                  >
                  <v-icon v-if="tag_violence.status == `unkown`">mdi-shield-half-full</v-icon>
                  <b style="min-width: 100px">{{ tag_violence.title }} </b> -
                  {{ tag_violence.description }}
                </div>
              </div>
            </v-tab-item>
          </v-tabs-items>

          <!--  
          <div v-for="(tag, index) in tags" :key="index">
            <div @click="tag.status = nextStatus(tag.status)" style="cursor: pointer;">
              <v-icon v-if="tag.status == `missing`" color="red">mdi-shield-alert</v-icon>
              <v-icon v-if="tag.status == `done`" color="#00b359">mdi-shield-check</v-icon>
              <v-icon v-if="tag.status == `unkown`">mdi-shield-half-full</v-icon>
              <b style="min-width: 100px">{{ tag.title }} </b> {{ tag.description }}
            </div>
            <br />
          </div>
          -->
          <div style="margin-top: 20px">
            <fc-tooltip text="The movie contains scenes of this type that are not yet listed">
              <v-icon color="red">mdi-shield-alert</v-icon>Missing
            </fc-tooltip>
            <fc-tooltip
              text="The movie might contain some scenes of this type which are not yet listed"
            >
              <v-icon>mdi-shield-half-full</v-icon> Unkown
            </fc-tooltip>
            <fc-tooltip text="All scenes of this type have been listed with the right times">
              <v-icon color="#00b359">mdi-shield-check</v-icon> Done
            </fc-tooltip>
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
      tab: 0,
      tags: [],
      tagged: {},
      //alex:
      tagged_backup: {},
      tags_sex: [],
      tags_violence: []
    }
  },
  watch: {
    visible(newValue, oldValue) {
      if (newValue) {
        console.log('visible true: getdata!!')
        this.getData()
      }
    }
  },
  computed: {
    visible2: {
      get() {
        return this.visible
      },
      set(newvalue) {
        if (newvalue) {
          console.log('aaaaaaaaaaaaaaaa - visible2', newvalue)
          this.$emit('hide')
        } else {
          console.log('asfasfsafsafsafsasadf', newvalue)
        }
      }
    }
  },

  methods: {
    cancel() {
      //just close
      this.tagged = this.tagged_backup
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
      /*
      var tagged = {}
      for (var i = 0; i < this.tags.length; i++) {
        tagged[this.tags[i].value] = {
          status: this.tags[i].status
        }
      }
      */

      //this.tags_sex = this.tags_sex.reverse()
      //this.tags_violence = this.tags_violence.reverse()
      this.tagged = {}
      this.tags_sex.forEach(ts => {
        this.tagged[ts.value] = { status: ts.status }
      })
      this.tags_violence.forEach(tv => {
        this.tagged[tv.value] = { status: tv.status }
      })

      //console.log(tagged)

      //send message to save!
      fclib.sendMessage({ msg: 'set-tagged', tagged: this.tagged })
      this.$emit('hide') //Close dialog
    },
    getData() {
      fclib.getData(xx => {
        console.log('[Shield] getData()', xx)

        this.tagged = xx.tagged
        this.tagged_backup = xx.tagged

        var tags = raw.content[0].severity.concat(raw.content[1].severity)

        var tags_sex = JSON.parse(JSON.stringify(raw.content[0].severity)) //parse.stringify to force a copy of the object, and avoid reversing the original one in the raw variable!!!
        var tags_violence = JSON.parse(JSON.stringify(raw.content[1].severity))
        tags_sex.reverse()
        tags_violence.reverse()

        console.log('tags_sex', tags_sex)

        //-------------
        //sex tags
        tags_sex.forEach(t => {
          var value = t.value
          if (!this.tagged[value]) {
            t.status = 'unkown'
          } else if (this.tagged[value].status == 'done') {
            t.status = 'done'
          } else if (this.tagged[value].status == 'missing') {
            t.status = 'missing'
          } else {
            t.status = 'unkown'
          }
        })
        this.tags_sex = JSON.parse(JSON.stringify(tags_sex))

        //violence tags
        tags_violence.forEach(t => {
          var value = t.value
          if (!this.tagged[value]) {
            t.status = 'unkown'
          } else if (this.tagged[value].status == 'done') {
            t.status = 'done'
          } else if (this.tagged[value].status == 'missing') {
            t.status = 'missing'
          } else {
            t.status = 'unkown'
          }
        })
        this.tags_violence = JSON.parse(JSON.stringify(tags_violence))
        //-----------
        /*
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
        this.tags = JSON.parse(JSON.stringify(tags)) //needed to force refresh of deep object
        console.log(this.tags)
        */
      })
    },
    getTagColor() {}
  },
  mounted() {
    //this.getData()  // this is now triggered by watching visible prop
    /*fclib.listenToMessages(xx => {
      if (xx.msg == 'get-data') {
        this.getData()
      }
    })*/
  }
}
</script>

<style lang="scss" scoped></style>
