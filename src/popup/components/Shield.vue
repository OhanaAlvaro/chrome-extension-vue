<template>
  <div>
    <v-dialog v-model="visible2" width="500" max-width="80%">
      <v-card>
        <v-card-title primary-title>
          Finished categories
          <fc-tooltip icon="mdi-help-circle"
            >All scenes from this category have been marked.</fc-tooltip
          >
        </v-card-title>
        <v-card-text>
          <span v-for="tag in tags" :key="tag.value">
            <v-checkbox v-model="tag.status" value indeterminate>
              <template v-slot:label>
                <b style="min-width: 100px">{{ tag.title }} </b> {{ tag.description }}
              </template>
            </v-checkbox>
          </span>
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
      key: 'value',
      tags: [],
      gore_tags: [],
      tagged: {}
    }
  },
  beforeCreate() {
    this.tags = raw.content[0].severity
    this.gore_tags = raw.content[1].severity
    console.log(this.tags)
    console.log(this.gore_tags)
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
    save(msg) {
      console.log('shield-save')
      //TODO: send message to save

      var tagged = {}

      for (var i = 0; i < this.tags.length; i++) {
        var status = 'unkown'
        if (this.tags[i].status === true) {
          status = 'done'
        } else if (this.tags[i].status === false) {
          status = 'missing'
        }
        tagged[this.tags[i].value] = {
          status: status
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
        for (var i = 0; i < this.tags.length; i++) {
          var value = this.tags[i].value
          if (!tagged[value]) continue
          if (tagged[value].status == 'done') {
            this.tags[i].status = true
          } else if (tagged[value].status == 'missing') {
            this.tags[i].status = false
          } else {
            this.tags[i].status = undefined
          }
        }
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
    this.tags = raw.content[0].severity.concat(raw.content[1].severity)
    console.log(this.tags)
  }
}
</script>

<style lang="scss" scoped></style>
