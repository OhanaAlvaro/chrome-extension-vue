<template>
  <div class="size-wrapper">
    <!-- Header -->
    <div>
      <h1>Create new filters</h1>
      <span class="menu">
        <span @click="go2Login">
          <v-icon small>mdi-account</v-icon>
        </span>

        <span @click="hideSidebar">
          <v-icon small>mdi-close</v-icon>
        </span>
      </span>
    </div>

    <!-- Shield & scene edit dialogs -->
    <shield-editor
      :visible="shield_visible"
      :tagged="data.tagged"
      :level="data.settings.level"
      @hide="shield_visible = false"
    ></shield-editor>

    <scene-editor
      :visible="edit_scene_dialog"
      :scene="active_scene"
      @hide="edit_scene_dialog = false"
    ></scene-editor>

    <!-- List/table of scenes -->
    <div
      v-if="data.scenes.length == 0"
      class="scene-table"
      align="center"
      justify="center"
      style="width:100%"
    >
      <br />
      No filters for this film. Be the first one to add one!
      <br />
      <br />
    </div>
    <div v-else>
      <table width="100%">
        <thead>
          <tr>
            <th>Start</th>
            <th>Lenght</th>
            <th>Severity</th>
            <th>Context</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="scene in scenes_list" :key="scene.id" @click="editScene(scene)">
            <!-- Start Time -->
            <td>{{ prettyTime(scene.start) }}</td>
            <!-- Duration -->
            <td>{{ Math.round((scene.end - scene.start) / 100) / 10 }}</td>
            <!-- Severity -->
            <td>
              <v-chip x-small :color="getTagColor(scene.category)" dark>
                {{ scene.severity }}
              </v-chip>
            </td>
            <!-- Context -->
            <td>
              <v-chip x-small v-for="(tag, index) in scene.context" :key="index" dark>
                {{ tag }}
              </v-chip>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Filter status button (show shield button) -->
    

    <!-- New scene button -->
    <fc-tooltip text="(Alt+N)">
      <v-btn color="black" @click="markCurrentTime()" text small>
        <div v-if="data.state.marking == false"><v-icon>mdi-plus</v-icon>New filter</div>
        <div v-else><v-icon>mdi-check</v-icon>End Filter</div>
      </v-btn>
    </fc-tooltip>
    <v-btn block dense depressed tile @click="shield_visible = !shield_visible">
      <fc-tooltip text="Click to define filter status">

        <v-icon :color="certifiedColor" small>mdi-emoticon-happy</v-icon>
        <v-icon :color="certifiedColor" small>mdi-content-cut</v-icon>
        <v-icon color="red" small>mdi-flag-variant</v-icon>
        <v-icon color="gray" small>mdi-progress-question</v-icon>
        Set Filter status
      </fc-tooltip>
    </v-btn>

    <!-- Bottom menu -->
    <div id="bottom">
      <h3>Player controls</h3>
      <!-- Play/Pause button -->
      <v-btn @click="seekForward(-15000)" class="no-uppercase" text small>
        -15s
      </v-btn>

      <v-btn @click="seekForward(-5000)" class="no-uppercase" text small>
        -5s
      </v-btn>

      <v-btn @click="sendMessage({ msg: 'play-pause' })" text small>
        <v-icon fab>mdi-play-pause</v-icon>
      </v-btn>

      <v-btn @click="seekForward(5000)" class="no-uppercase" text small>
        +5s
      </v-btn>

      <v-btn @click="seekForward(15000)" class="no-uppercase" text small>
        +15s
      </v-btn>

      <div style="display: flex;">
        <!-- Mute video while marking scene-->
        <v-checkbox
          v-model="data.settings.mute_on_mark"
          :label="`Mute on mark`"
          @change="changeMute"
        ></v-checkbox>

        <!-- Blur slider: allow user to control the blur right from here -->
        <v-slider
          v-model="data.settings.blur_level"
          inverse-label
          :min="0"
          :max="40"
          thumb-label
          :label="`Blur on mark`"
          step="2"
          @change="changeBlur"
        >
          <template v-slot:thumb-label="{ value }">{{ 2.5 * value + '%' }}</template>
        </v-slider>
      </div>
    </div>
  </div>
</template>

<script>
import ShieldEditor from '../components/ShieldEditor.vue'
import SceneEditor from '../components/SceneEditor.vue'
import fclib from '../js/fclib'
import raw_tags from '../js/raw_tags'

export default {
  name: 'Editor',
  components: {
    SceneEditor,
    ShieldEditor
  },
  data() {
    return {
      edit_scene_dialog: false,
      active_scene: {},
      shield_visible: false
    }
  },

  computed: {
    scenes_list() {
      var scenes = Object.assign([], this.data.scenes)

      var categories = raw_tags.categories
      var severities = fclib.collapse(raw_tags.severities)
      var u_cat_sev = fclib.union(categories, severities) //collapse(raw_tags.context)

      for (var i = 0; i < scenes.length; i++) {
        scenes[i].category = fclib.intersect(categories, scenes[i].tags)[0]
        scenes[i].severity = fclib.intersect(severities, scenes[i].tags)[0]
        scenes[i].context = fclib.difference(scenes[i].tags, u_cat_sev)
      }
      return scenes
    },

    certifiedColor(){
      if (this.data.settings.level >= 6) return 'blue'
      return 'green'
    }
  },

  props: {
    data: Object
  },

  methods: {
    hideSidebar() {
      this.sendMessage({ msg: 'show-sidebar', show: false })
    },
    go2Login() {
      if (this.$route.name == 'Login') {
        this.$router.go(-1) //go back to whatever route we were before :)  | (just in case at some point we have more than Home/Login)
      } else {
        this.$router.push('/login')
      }
    },
    prettyTime(time) {
      var mins = Math.floor(time / 1000 / 60)
      if (mins < 10) mins = '0' + mins
      var secs = Math.round(time / 1000 - mins * 60)
      if (secs < 10) secs = '0' + secs
      return '' + mins + ':' + secs
    },
    getTagColor(value) {
      var color_value = 'gray' //default
      raw_tags.content.forEach(item => {
        if (item.value == value) {
          color_value = item.color
        }
      })
      return color_value
    },

    editScene(scene) {
      console.log(scene)
      this.active_scene = scene
      this.edit_scene_dialog = true
    },

    seekForward(diff) {
      this.sendMessage({ msg: 'seek-diff', diff: diff })
    },

    changeBlur() {
      console.log('change blur', this.data.settings.blur_level)
      fclib.sendMessage({ msg: 'update-settings', settings: this.data.settings })
      fclib.sendMessage({ msg: 'blur', blur_level: this.data.settings.blur_level })
    },

    changeMute() {
      console.log('change mute', this.data.settings.mute_on_mark)
      fclib.sendMessage({ msg: 'update-settings', settings: this.data.settings })
      fclib.sendMessage({ msg: 'mute', state: this.data.settings.mute_on_mark })
    },

    markCurrentTime() {
      fclib.sendMessage({ msg: 'mark-current-time' }, response => {
        console.log(response)
        if (response && response.scene) {
          // We have a new scene!!
          this.editScene(response.scene)
          fclib.sendMessage({ msg: 'pause' })
          this.data.state.marking = false
        } else {
          // We are marking a scene
          this.data.state.marking = true
        }
      })
    },
    sendMessage(msg) {
      fclib.sendMessage(msg)
    }
  }
}
</script>

<style scoped>
.scene-table {
  max-height: 65vh;
  overflow-y: auto;
  overflow-x: hidden;
}

.size-wrapper {
  height: 96vh;
  width: calc( 100vw - 20px);
}

.no-uppercase {
  text-transform: none;
}

tr {
  cursor: pointer;
}

tr:hover {
  opacity: 0.5;
}

.v-input {
  font-size: 1.2em;
}

.bordered {
  border-style: solid;
  padding: 6px;
  border-width: 1px;
  width: 100%;
}

#bottom {
  position: absolute;
  width: 90%;
  bottom: 10px;
}

.v-messages.theme--light {
  display: none;
}

.v-input__slot {
  margin-bottom: 0px;
}

.v-input.theme--light.v-input--selection-controls.v-input--checkbox {
  margin-top: 0px;
  padding-top: 0px;
}
</style>
