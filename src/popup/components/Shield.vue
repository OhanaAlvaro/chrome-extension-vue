<template>
  <div>
    <v-dialog v-model="visible2" width="500" max-width="80%">
      <v-card>
        <v-card-title primary-title>
          Shield
        </v-card-title>
        <v-card-text>
          Shield is not yet available!! Check again in a few days ;)
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
      data: { msg: '', scenes: [], settings: [] } //default values, to avoid missing keys
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
    save(msg) {
      console.log('shield-save')
      //TODO: send message to save
      //fclib.sendMessage(msg, callback)
      alert('save is not implemented')
      this.$emit('hide') //Close dialog
    },
    getData() {
      fclib.getData(xx => {
        console.log('rrrr', xx)
        this.data = xx
      })
    }
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
