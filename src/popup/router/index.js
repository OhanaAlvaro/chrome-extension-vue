import Vue from 'vue'
import VueRouter from 'vue-router'
import Home from '../views/Home.vue'
import About from '../views/About.vue'

import Jarri01 from '../views/Jarri01.vue'
import Settings from '../views/Settings.vue'
import NoMovie from '../views/NoMovie.vue'

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
    path: '/about',
    name: 'About',
    component: About
  },
  {
    path: '/jarri',
    name: 'Jarri01',
    component: Jarri01
  },
  {
    path: '/settings',
    name: 'Settings',
    component: Settings
  }
]

const router = new VueRouter({
  routes
})

export default router
