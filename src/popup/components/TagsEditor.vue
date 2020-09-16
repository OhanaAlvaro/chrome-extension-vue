<template>
  <div>
    <!-- INTRO: 
    We create a selection object, more granular about what user selected .
    We convert tags to that, and back when necessary.
    Wizard info is binded to this object (this helps handling radio buttons, removing child tags, getting backup of child in case parent is restored)
    -->
    <!-- Scene types-->

    <div @click="dialog = true">
      <v-chip
        x-small
        v-for="(tag, index) in tags"
        :key="index"
        :color="getTagColor(tag)"
        dark
      >{{ tag }}</v-chip>
    </div>

    <v-dialog
      v-model="dialog"
      scrollable
      persistent
      :overlay="false"
      max-width="70%"
      transition="dialog-transition"
    >
      <v-card>
        <v-toolbar color="primary" dark>
          <h3>Wizard</h3>
        </v-toolbar>
        <v-card-text>
          <!--
          <p>step: {{ step }}</p>
          <p>{{ pages }}</p>
          <p>{{ selection }}</p>

          

          
          <v-btn color="success" @click="tags2selection()">tags 2 selection</v-btn>

          <p>{{ tags }}</p>
          <v-btn color="success" @click="selection2tags()">selection 2 tags</v-btn>
          -->
          <div v-if="page == 'scene-type'">
            <label v-for="(s, index) in content_tags" :key="index">
              <input
                type="checkbox"
                name="scene-type"
                :value="s.value"
                v-model="selection.categories"
              />
              <b>&nbsp;{{ s.title }}</b>
              <br />
            </label>
          </div>

          <!-- Dynamically create the subpages for each selected category -->
          <div v-for="(cat, index) in selection.categories" :key="index">
            <!-- Severity -->
            <div v-if="page == cat + '_severity'">
              <label v-for="(s, index) in getContentTagData(cat).severity" :key="index">
                <input
                  type="radio"
                  :name="cat + '_severity'"
                  :value="s.value"
                  v-model="selection.content[cat].severity"
                />
                <b>&nbsp;{{ s.title }}</b>
                - {{ s.description }}
                <br />
              </label>
            </div>

            <!-- Types -->
            <div v-if="page == cat + '_types'">
              <label v-for="(s, index) in getContentTagData(cat).types" :key="index">
                <input
                  type="checkbox"
                  :name="cat + '_types'"
                  :value="s.value"
                  v-model="selection.content[cat].types"
                />
                <b>&nbsp;{{ s.title }}</b>
                - {{ s.description }}
                <br />
              </label>
            </div>
          </div>

          <div v-if="page == 'what-to-do'">
            <label v-for="(a, index) in action_tags.types" :key="index">
              <input type="checkbox" name="what-to-do" :value="a.value" v-model="selection.actions" />
              <b>&nbsp;{{ a.title }}</b>
              <br />
            </label>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-btn color="error" @click="cancelMe()">Cancel</v-btn>
          <v-spacer></v-spacer>
          <v-btn color="primary" @click="step--" text>prev</v-btn>
          <v-btn color="primary" @click="step++" text>next</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
var raw = require('../js/raw_tags')

export default {
  props: {
    value: {
      type: Array,
      default: function() {
        return []
      }
    }
  },
  watch: {
    selection: {
      deep: true,
      handler() {
        this.selection2tags()
      }
    },

    tags(newValue) {
      //send the information over to the parent element
      this.$emit('input', newValue)
      this.$emit('change', newValue)
    }
  },
  computed: {
    page() {
      if (this.step >= this.pages.length) {
        this.finishHere() //this resets step to 0
      }
      return this.pages[this.step]
    },
    pages() {
      var p = ['scene-type']
      //content
      this.content_tags.forEach(ct => {
        if (this.selection.categories.includes(ct.value)) {
          //severity
          if (ct.severity.length > 0) {
            p.push(ct.value + '_severity')
          }

          //types
          if (ct.types.length > 0) {
            p.push(ct.value + '_types')
          }
        }
      })

      //actions
      p.push('what-to-do')

      console.log('pages returned', p)

      return p
    }
  },
  data() {
    return {
      step: 0,
      dialog: false,
      tags: [],
      content_tags: [{ title: '', value: '', color: '', severity: [], types: [] }],
      action_tags: { types: [] },
      tags_backup: [],
      selection: {
        categories: [],
        content: {
          'Sex/Nudity': { severity: '', types: [] },
          Violence: { severity: '', types: [] },
          Other: { severity: '', types: [] }
        },
        actions: []
      }
    }
  },
  methods: {
    cancelMe() {
      this.step = 0
      this.tags = this.tags_backup
      this.dialog = false
    },
    finishHere() {
      this.step = 0
      this.dialog = false
    },
    getContentTagData(contentTagValue) {
      console.log('getcontentag', contentTagValue)
      var output = {}
      this.content_tags.forEach(ct => {
        if (ct.value == contentTagValue) {
          output = ct
        }
      })
      return output
    },
    selection2tags() {
      var tags = []

      //1. content
      //Note: only for the keys in selection.categories -> if removed from there, we don't propagate sub-tags
      this.selection.categories.forEach(key => {
        tags.push(key) //add parent
        var severity = this.selection.content[key].severity
        var types = this.selection.content[key].types

        if (severity != '') {
          tags.push(severity)
        }
        tags = tags.concat(types)
      })

      //2. actions
      tags = tags.concat(this.selection.actions)

      //3. reurn new tags array
      this.tags = tags
    },
    tags2selection() {
      var selection = { categories: [], content: {}, actions: [] }

      //1. content
      this.content_tags.forEach(content_type => {
        //parent
        if (this.tags.includes(content_type.value)) {
          selection.categories.push(content_type.value)
        }

        //severities
        var x = content_type.value
        selection.content[x] = { severity: '', types: [] } //skeleton

        content_type.severity.forEach(sev => {
          if (this.tags.includes(sev.value)) {
            selection.content[x].severity = sev.value
          }
        })

        //types
        content_type.types.forEach(ct => {
          if (this.tags.includes(ct.value)) {
            selection.content[content_type.value]['types'].push(ct.value)
          }
        })
      })

      //2. scene actions
      this.action_tags.types.forEach(action => {
        if (this.tags.includes(action.value)) {
          selection['actions'].push(action.value)
        }
      })

      //3. return new selection
      this.selection = selection
    },

    getTagColor(value) {
      var color_value = 'gray' //default
      this.content_tags.forEach(item => {
        if (item.value == value) {
          color_value = item.color
        }
      })
      return color_value
    }
  },

  mounted() {
    this.step = 0 //always start there...
    this.tags = this.value
    this.tags_backup = this.value

    this.content_tags = raw.content
    this.action_tags = raw.actions

    this.tags2selection()
  }
}
</script>

<style lang="scss" scoped></style>
