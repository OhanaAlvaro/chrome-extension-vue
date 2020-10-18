<template>
  <div>
    <v-dialog
      v-model="dialog"
      scrollable
      persistent
      :overlay="false"
      max-width="80%"
      transition="dialog-transition"
    >
      <v-card>
        <v-card-title style="padding: 8px 16px;">
          {{ pageTitle }}
          <v-spacer></v-spacer>
          <!--<v-icon @click="cancelMe()">mdi-close-circle</v-icon>-->
        </v-card-title>

        <v-card-text class="pa-2 pl-4">
          <!-- Scene types-->
          <div v-if="page == 'scene-type'">
            <label v-for="(s, index) in content_tags" :key="index">
              <br v-if="index > 0" />
              <input
                type="checkbox"
                name="scene-type"
                :value="s.value"
                v-model="selection.categories"
              />
              <b>&nbsp;{{ s.title }}</b>
              <span v-if="s.description != ''">&nbsp;- {{ s.description }}</span>
            </label>
          </div>

          <!-- Dynamically create the subpages for each selected category (both for severity and types) -->
          <div v-for="(cat, index) in selection.categories" :key="index">
            <!-- Severity -->
            <div v-if="page == cat + '_severity'">
              <label v-for="(s, index) in getContentTagData(cat).severity" :key="index">
                <br v-if="index > 0" />
                <input
                  type="radio"
                  :name="cat + '_severity'"
                  :value="s.value"
                  v-model="selection.content[cat].severity"
                />
                <b>&nbsp;{{ s.title }}</b>
                <span v-if="s.description != ''">&nbsp;- {{ s.description }}</span>
              </label>
            </div>

            <!-- Types -->
            <div v-if="page == cat + '_types'">
              <label v-for="(s, index) in getContentTagData(cat).types" :key="index">
                <br v-if="index > 0" />
                <input
                  type="checkbox"
                  :name="cat + '_types'"
                  :value="s.value"
                  v-model="selection.content[cat].types"
                />
                <b>&nbsp;{{ s.title }}</b>
                <span v-if="s.description != ''">&nbsp;- {{ s.description }}</span>
              </label>
            </div>
          </div>

          <!-- WHAT TO DO (actions) -->
          <div v-if="page == 'what-to-do'">
            <label v-for="(a, index) in action_tags.types" :key="index">
              <br v-if="index > 0" />
              <input
                type="checkbox"
                name="what-to-do"
                :value="a.value"
                v-model="selection.actions"
              />
              <b>&nbsp;{{ a.title }}</b>
              <span v-if="a.description != ''">&nbsp;- {{ a.description }}</span>
            </label>
          </div>
        </v-card-text>
        <v-card-actions class="pa-1 ma-0">
          <v-btn color="error" @click="cancelMe()" text>Cancel</v-btn>
          <v-spacer></v-spacer>
          <v-btn v-if="step > 0" color="primary" @click="prevStep()" text>prev</v-btn>
          <v-btn color="primary" @click="nextStep()" text>next</v-btn>
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
      //if show or not the wizard
      type: Boolean,
      default: false
    },
    tags: {
      type: Array,
      default: function() {
        return []
      }
    }
  },
  watch: {
    selection: {
      deep: true,
      handler(newValue) {
        this.$emit('change', this.selection2tags(newValue))
      }
    },
    dialog(newValue, oldValue) {
      if (newValue == true) {
        this.tags_backup = this.tags //save backup everytime dialog becomes visible (to restore if cancel)
        this.selection = this.tags2selection(this.tags) //double check this is refreshed...
      }
    }
  },
  computed: {
    //dialog itself (v-model in the parent)
    dialog: {
      //so it can be editied from here
      get: function() {
        return this.value
      },
      set: function(newValue, oldValue) {
        this.$emit('input', newValue)
      }
    },

    //pages
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
      //pages
      step: 0,
      //tags/selection
      content_tags: [], //read from the separated file
      action_tags: [], //read from the separated file
      tags_backup: [], //changes when dialog goes from false to true
      selection: this.tags2selection(this.tags)
    }
  },
  methods: {
    //pages
    prevStep() {
      if (this.step > 0) {
        this.step--
      }
    },
    nextStep() {
      //evaluate if we should go to the next step or not

      //On first page, an option is mandatory
      if (this.page == 'scene-type') {
        if (this.selection.categories.length) {
          this.step++
        }
        return
      }

      //For severities (radio buttons), not continue if no selection was made
      if (this.page.includes('_severity')) {
        var current_cat = this.page.split('_')[0]

        if (this.selection.content[current_cat].severity != '') {
          this.step++
          return
        } else {
          //don't go to next page until this radio button is clicked.
          return
        }
      } else {
        this.step++
        return
      }
    },
    cancelMe() {
      this.dialog = false
      this.step = 0

      //restore backup
      this.selection = this.tags2selection(this.tags_backup)

      //send the backup
      this.$emit('cancel', this.tags_backup)
    },
    finishHere() {
      console.log('tags-wizard-finishHere()')
      this.step = 0
      this.dialog = false

      var new_tags = this.selection2tags(this.selection)
      this.tags_backup = new_tags //in case reopened... notice things don't re-render by themselves.. | a bit redundant, since also added in dialog setter.
      this.$emit('done', new_tags)
    },

    //to play with tags etc
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

    selection2tags(selectionValue) {
      var tags = []

      //1. content
      //Note: only for the keys in selection.categories -> if removed from there, we don't propagate sub-tags
      selectionValue.categories.forEach(key => {
        tags.push(key) //add parent
        var severity = selectionValue.content[key].severity
        var types = selectionValue.content[key].types

        if (severity != '') {
          tags.push(severity)
        }
        tags = tags.concat(types)
      })

      //2. actions
      tags = tags.concat(selectionValue.actions)

      //3. reurn new tags array
      return tags
    },
    tags2selection(tagsValue) {
      /* this is how the selection object look like :)
      selection: {
        categories: [],
        content: {
          'Sex/Nudity': { severity: '', types: [] },
          Violence: { severity: '', types: [] },
          Other: { severity: '', types: [] }
        },
        actions: []
      }
      */

      var selection = { categories: [], content: {}, actions: [] }

      //1. content
      this.content_tags.forEach(content_type => {
        //parent
        if (tagsValue.includes(content_type.value)) {
          selection.categories.push(content_type.value)
        }

        //severities
        var x = content_type.value
        selection.content[x] = { severity: '', types: [] } //skeleton

        content_type.severity.forEach(sev => {
          if (tagsValue.includes(sev.value)) {
            selection.content[x].severity = sev.value
          }
        })

        //types
        content_type.types.forEach(ct => {
          if (tagsValue.includes(ct.value)) {
            selection.content[content_type.value]['types'].push(ct.value)
          }
        })
      })

      //2. scene actions
      this.action_tags.types.forEach(action => {
        if (tagsValue.includes(action.value)) {
          selection['actions'].push(action.value)
        }
      })

      //3. return new selection
      return selection
    }
  },
  beforeCreate() {
    //important that we do this first thing, otherwise they are empty when loading "selection" data :/

    this.content_tags = raw.content
    this.action_tags = raw.actions

    this.step = 0
  },
  mounted() {
    //then for some strange reason we need to load them again. They became empty
    this.content_tags = raw.content
    this.action_tags = raw.actions

    this.step = 0
  }
}
</script>

<style lang="scss" scoped></style>
