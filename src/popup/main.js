import Vue from 'vue'
import App from './App.vue'
import router from './router'
import vuetify from '../plugins/vuetify'

import './components/' // this takes components/index.js to import our global componets for all the project
//^_ as learned here: https://stackoverflow.com/questions/52644198/registering-vue-components-globally

/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  vuetify,
  render: h => h(App)
})
