import Vue from 'vue'
import VueRouter from 'vue-router'
import Home from '../views/Home.vue'
import About from '../views/About.vue'
import Jarri01 from '../views/Jarri01.vue'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'Jarri01',
    component: Jarri01
  },
  {
    path: '/home',
    name: 'Home',
    component: Home
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
  }
]

const router = new VueRouter({
  routes
})

export default router
