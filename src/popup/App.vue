<template>
  <div>
    <v-app>
      <v-app-bar app color="#00b359" dark dense height="34px" flat>
        <v-btn icon @click="drawer = !drawer">
          <v-icon small>mdi-menu</v-icon>
        </v-btn>
        <div class="d-flex align-center" @click="$router.push('/')">
          <h3>{{ extensionName }}</h3>
        </div>

        <v-spacer></v-spacer>

        <v-icon small @click="go2Settings()">mdi-cog</v-icon>
      </v-app-bar>

      <!-- NAV DRAWER -->
      <v-navigation-drawer v-model="drawer" left app temporary>
        <v-list-item>
          <v-list-item-content>
            <v-list-item-title class="title">Family Cinema</v-list-item-title>
            <v-list-item-subtitle>Decide what you watch</v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>

        <v-divider></v-divider>

        <v-list dense nav app>
          <v-list-item link to="/">
            <v-list-item-icon>
              <v-icon>mdi-home-outline</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title>Home</v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </v-list>
      </v-navigation-drawer>

      <!-- -->
      <v-main>
        <v-container>
          <router-link to="/home">Home</router-link> |
          <router-link to="/about">About</router-link> |
          <router-link to="/jarri">Jarri</router-link>
          <router-view></router-view>
        </v-container>
      </v-main>
    </v-app>
  </div>
</template>

<script>
export default {
  name: 'PopupApp',
  data() {
    return {
      drawer: false
    }
  },
  computed: {
    extensionName() {
      return browser.i18n.getMessage('extName')
    }
  }
}
</script>

<style>
html {
  width: 400px;
  height: 400px;
}
</style>
