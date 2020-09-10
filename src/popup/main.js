import Vue from 'vue'
import App from './App.vue'
import router from './router'
import vuetify from '../plugins/vuetify'

/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  vuetify,
  render: h => h(App)
})
