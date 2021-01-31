<template>
  <div>
    <div id="scenesEditor" style="margin-top: 15px">
      <table id="table" style="min-width:400px">
        <thead>
          <tr>
            <!--<th @click="go2Settings" style="cursor: pointer;">
              Skip
              <fc-tooltip text="You can change the default skip tags in settings">
                <v-icon color="info" dark small class="pb-1">mdi-help-circle</v-icon>
              </fc-tooltip>-->
            <th>Skip</th>
            <th>Length (s)</th>
            <th>Tags</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="scene in scenes" :key="scene.id">
            <!-- Skip -->
            <td style="padding-right:18px;padding-left:18px">
              <input type="checkbox" v-model="scene.skip" @change="updateScene(scene, 'skip')" />
            </td>

            <!-- Start Time -->
            <td>{{ Math.round((scene.end - scene.start)/100)/10 }}</td>

            <!-- Tags -->
            <td style="width:300px">
              <v-chip
                x-small
                v-for="(tag, index) in scene.tags"
                :key="index"
                :color="getTagColor(tag)"
                dark
                >{{ tag }}</v-chip
              >
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
var fclib = require('../js/fclib')
var raw = require('../js/raw_tags')


export default {

  props: {
    value: {
      //array with the scenes (data.scenes in the parent)
      type: Array,
      default: function() {
        return []
      }
    }
  },

  watch: {
    value: {
      deep: true,
      handler(newValue) {
        this.scenes = newValue
      }
    },
    scenes: {
      deep: true,
      handler(newValue) {
        this.$emit('input', newValue)
        this.$emit('change', newValue)
      }
    }
  },

  data() {
    return {
      scenes: [],
      dialog: false,
      wizardVisible: false
    }
  },

  methods: {
    getTagColor(value) {
      var color_value = 'gray' //default
      raw.content.forEach(item => {
        if (item.value == value) {
          color_value = item.color
        }
      })
      return color_value
    },
    go2Settings() {
      this.$router.push('/settings')
    },

    sendMessage(msg, callback) {
      console.log('[sendMessage-ScenesEditor]: ', msg)
      chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
        chrome.tabs.sendMessage(tabs[0].id, msg, function(response) {
          if (callback) callback(response)
        })
      })
    }
  }
}
</script>
