import Vue from 'vue'
import VueRouter from 'vue-router'
import Home2 from '../views/Home2.vue'
import WrongSite from '../views/WrongSite.vue'
import Editor from '../views/Editor.vue'
import Login from '../views/Login.vue'
import Options from '../views/Options.vue'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'Home2',
    component: Home2
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
    path: '/login',
    name: 'Login',
    component: Login
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
