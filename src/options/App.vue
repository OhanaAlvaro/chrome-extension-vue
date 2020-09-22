<template>
  <div>
    <v-main>
      <v-container>
        <!--
          <router-link to="/">Home</router-link>|
          <router-link to="/about">About</router-link>|
          <router-link to="/jarri">Jarri</router-link>|
          <router-link to="/no-movie">No Movie</router-link>|
          <router-link to="/settings">Settings</router-link>
        -->

        <router-view></router-view>
        <options-page></options-page>
      </v-container>
    </v-main>
  </div>
</template>

<script>
import OptionsPage from './views/OptionsPage.vue'

export default {
  name: 'Options',
  components: { OptionsPage }
}
</script>

<style>
html {
  width: 400px;
  height: 400px;
}
</style>
