import Vue from 'vue'
import VueRouter from 'vue-router'
import Home from '../views/Home.vue'
import WrongSite from '../views/WrongSite.vue'
import Editor from '../views/Editor.vue'
import Login from '../views/Login.vue'
import Options from '../views/Options.vue'
import PopupScenesList from '../views/PopupScenesList.vue'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
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
  },
  {
    path: '/scenes/:categoryIndex',
    name: 'PopupScenesList',
    component: PopupScenesList,
    props: true
  }
]

const router = new VueRouter({
  routes
})

export default router
