<template>
  <div>
    tags: {{ tags }}
    <!-- INTRO: 
    This is dynamic. You cange the raw-tags file and this gets updated (as long as logic doesn't change)
    How it works:
     - We create a "selection" object, more granular about what user selected in the wizard (vs single array with all tags).
     - We convert tags to that format, and back, when necessary.
     - Wizard info is binded to this wizard objects. This helps handling radio buttons, removing child tags, and getting backup of children in case parent is restored (as long as wizard is still live)

    Pages:
     - Based on "categories" (S/V/O) selected, we list the pages.
     - We check the JSON definition to understand if a category has severities and types (if no, not create that as page -> Others.severity=[])
     - Page title comes also from JSON, but for the first level
    -->

    <!-- dialog with the wizard -->

    <v-card>
      <v-toolbar color="primary" dark dense>
        <h2>{{ pageTitle }}</h2>
      </v-toolbar>
      <br />
      <v-card-text>
        <!-- Scene types-->
        <div v-if="page == 'scene-type'">
          <label v-for="(s, index) in content_tags" :key="index">
            <input
              type="checkbox"
              name="scene-type"
              :value="s.value"
              v-model="selection.categories"
            />
            <b>&nbsp;{{ s.title }}</b>
            <span v-if="s.description != ''">&nbsp;- {{ s.description }}</span>
            <br />
          </label>
        </div>

        <!-- Dynamically create the subpages for each selected category (both for severity and types) -->
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
              <span v-if="s.description != ''">&nbsp;- {{ s.description }}</span>
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
              <span v-if="s.description != ''">&nbsp;- {{ s.description }}</span>

              <br />
            </label>
          </div>
        </div>

        <!-- WHAT TO DO (actions) -->
        <div v-if="page == 'what-to-do'">
          <label v-for="(a, index) in action_tags.types" :key="index">
            <input type="checkbox" name="what-to-do" :value="a.value" v-model="selection.actions" />
            <b>&nbsp;{{ a.title }}</b>
            <span v-if="a.description != ''">&nbsp;- {{ a.description }}</span>
            <br />
          </label>
        </div>
      </v-card-text>
      <v-card-actions>
        <v-btn color="error" @click="cancelMe()" text>Cancel</v-btn>
        <v-spacer></v-spacer>
        <v-btn color="primary" @click="step--" text>prev</v-btn>
        <v-btn color="primary" @click="step++" text>next</v-btn>
      </v-card-actions>
    </v-card>
  </div>
</template>

<script>
var raw = require('../js/raw_tags')

export default {
  props: {
    tags2: {
      //the tags
      type: Array,
      default: function() {
        return []
      }
    }
  },
  watch: {
    tags2: {
      deep: true,
      handler(newValue) {
        this.tags = newValue
        this.tags2selection()
        this.tags_backup = newValue
      }
    },
    tags: {
      deep: true,
      handler() {
        //this.tags2selection()
      }
    },
    selection: {
      deep: true,
      handler() {
        this.selection2tags()
      }
    }
  },
  computed: {
    /*tags: {
      get: function() {
        return this.value
      },
      set: function(newValue) {
        this.$emit('input', newValue)
        this.$emit('change', newValue)
      }
    },*/
    pageTitle() {
      //this is work in progress yet... Very bad solution...

      if (this.step == 0) {
        return 'What does this scene contain?'
      }
      if (this.step == this.pages.length - 1) {
        return this.action_tags.types_title
      }

      var p1 = this.page.split('_')[0]
      var p2 = this.page.split('_')[1]

      return this.getContentTagData(p1)[p2 + '_title']
    },
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

      return p
    }
  },
  data() {
    return {
      step: 0,

      tags: [],
      //tags: [],
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
      this.$emit('cancel', this.tags)
    },
    finishHere() {
      this.step = 0
      this.dialog = false
      this.selection2tags()
      this.$emit('done', this.tags)
    },
    getContentTagData(contentTagValue) {
      //get raw content json from tag name (just the loop)
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
    },

    initWizard() {
      this.step = 0 //always start there...
      //this.tags = this.value

      this.tags_backup = this.value

      this.content_tags = raw.content
      this.action_tags = raw.actions

      this.tags2selection()
    }
  },

  mounted() {
    this.initWizard()
  }
}
</script>

<style lang="scss" scoped></style>
