<template>
  <div class="size-wrapper">
    <!-- Header -->
    <div>
      <h2>Create new filters</h2>
      <span class="menu">
        <span @click="go2Login()">
          <v-icon small>mdi-account</v-icon>
        </span>
      </span>
    </div>

    <!-- Shield & scene edit dialogs -->
    <shield-editor
      :visible="shield_visible"
      :tagged="data.tagged"
      @hide="shield_visible = false"
    ></shield-editor>

    <scene-editor
      :visible="edit_scene_dialog"
      :scene="active_scene"
      @hide="edit_scene_dialog = false"
    ></scene-editor>

    <!-- List/table of scenes -->
    <div v-if="data.scenes.length == 0" align="center" justify="center" style="width:100%">
      <br />
      No filters for this film. Be the first one to add one!
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
          <tr v-for="scene in data.scenes" :key="scene.id" @click="editScene(scene)">
            <!-- Start Time -->
            <td>{{ Math.round(scene.start / 100) / 10 }}</td>
            <!-- Duration -->
            <td>{{ Math.round((scene.end - scene.start) / 100) / 10 }}</td>
            <!-- Severity -->
            <td>
              <v-chip x-small :color="getTagColor(scene.severity)" dark>
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
    <v-btn text small @click="shield_visible = !shield_visible">
      <fc-tooltip text="Click to define filter status">
        <v-icon>mdi-shield-half-full</v-icon>Filter status
      </fc-tooltip>
    </v-btn>

    <!-- New scene button -->
    <fc-tooltip text="(Alt+N)">
      <v-btn color="black" @click="markCurrentTime()" text small>
        <div v-if="data.state.marking == false"><v-icon>mdi-plus</v-icon>New filter</div>
        <div v-else><v-icon>mdi-check</v-icon>End Filter</div>
      </v-btn>
    </fc-tooltip>

    <!-- Bottom menu -->
    <div id="bottom">
      <h3>Player controls</h3>
      <!-- Play/Pause button -->

      <v-btn
        @click="sendMessage({ msg: 'seek-diff', diff: -5000 })"
        class="no-uppercase"
        text
        small
      >
        -5s
      </v-btn>

      <v-btn @click="sendMessage({ msg: 'play-pause' })" text small>
        <v-icon fab>mdi-play-pause</v-icon>Play/Pause
      </v-btn>

      <v-btn @click="sendMessage({ msg: 'seek-diff', diff: 5000 })" class="no-uppercase" text small>
        +5s
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
import raw from '../js/raw_tags'

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

  props: {
    data: Object
  },

  methods: {
    go2Login() {
      if (this.$route.name == 'Login') {
        this.$router.go(-1) //go back to whatever route we were before :)  | (just in case at some point we have more than Home/Login)
      } else {
        this.$router.push('/login')
      }
    },
    getTagColor(value) {
      var color_value = 'gray' //default
      raw.content.forEach(item => {
        if (item.value == value) {
          color_value = item.color
        }
      })
      return color_value
    },

    editScene(scene) {
      this.active_scene = scene
      this.edit_scene_dialog = true
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
.size-wrapper {
  height: 96vh;
  width: 100vw -20px;
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
