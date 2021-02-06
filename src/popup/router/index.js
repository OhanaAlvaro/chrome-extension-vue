import Vue from 'vue'
import VueRouter from 'vue-router'
import Home from '../views/Home.vue'
import WrongSite from '../views/WrongSite.vue'

import Editor from '../views/Editor.vue'
import Settings from '../views/Settings.vue'
import NoMovie from '../views/NoMovie.vue'
import Options from '../views/Options.vue'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/no-movie',
    name: 'NoMovie',
    component: NoMovie
  },

  {
    path: '/wrongsite',
    name: 'WrongSite',
    component: WrongSite
  },
  {
    path: '/Editor',
    name: 'Editor',
    component: Editor
  },
  {
    path: '/settings',
    name: 'Settings',
    component: Settings
  },
  {
    path: '/options',
    name: 'Options',
    component: Options
  }
]

const router = new VueRouter({
  routes
})

export default router
