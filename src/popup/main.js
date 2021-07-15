import Vue from 'vue'
import App from './App.vue'
import router from './router'
import vuetify from '../plugins/vuetify'

import './components/' // this takes components/index.js to import our global componets for all the project
//^_ as learned here: https://stackoverflow.com/questions/52644198/registering-vue-components-globally

const MyPlugin = {
  install(Vue, options) {
    Vue.prototype.$t = (name, n) => {
      n = parseInt(n) || 0
      let text = chrome.i18n.getMessage(name)
      if (!text) return 'failed to fetch'
      let plurals = text.split(' | ')
      let i = Math.min(n, plurals.length - 1)
      if (i) text = plurals[i]
      return text.replaceAll('{n}', n)
    }
  }
}
Vue.use(MyPlugin)

/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  vuetify,
  render: h => h(App)
})
