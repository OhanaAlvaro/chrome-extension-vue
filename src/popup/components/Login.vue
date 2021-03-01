<template>
  <!-- 
  This receives props username and password. When user clicks login, this sends event "success" or "error" accordinagly, for parent to take care
  Here we don't use v-model back to the parent (only events), but watch for properties changes (though parent might not trigger them properly... )
-->

  <div class="bordered">
    <h1 v-if="page == 'login'" style="font-size:120%">1. Login</h1>
    <h1 v-if="page == 'register'" style="font-size:120%">1. Register</h1>
    <h1 v-if="page == 'logout'" style="font-size:120%" append-icon="mdi-account-check">
      1. Logged in as {{ username }}
    </h1>
    <v-text-field
      v-if="page != 'logout'"
      append-icon="mdi-account"
      name="username"
      label="Username"
      v-model="username_copy"
      ref="usernameField"
      @focus="$event.target.select()"
      @keydown.enter="$refs.passwordField.focus()"
      class="mb-0"
    ></v-text-field>

    <v-text-field
      password
      v-if="page != 'logout'"
      label="Password"
      v-model="password_copy"
      :append-icon="show_password ? 'mdi-eye' : 'mdi-eye-off'"
      :type="show_password ? 'text' : 'password'"
      @click:append="show_password = !show_password"
      ref="passwordField"
      @focus="$event.target.select()"
      @keydown.enter="
        if (page == 'login') {
          checkLogin()
        } else {
          $refs.emailField.focus()
        }
      "
      class="mt-0"
    ></v-text-field>

    <v-text-field
      v-if="page == 'register'"
      append-icon="mdi-email"
      label="Email"
      v-model="email_copy"
      ref="emailField"
      @focus="$event.target.select()"
      @keydown.enter="newUser()"
      :class="['mt-0',isEmailValid()]"
    ></v-text-field>

    <span v-if="page == 'login'">
      New user? <a @click="page = 'register'">Register now!</a>
      <v-btn color="info" @click="checkLogin()" block depressed tile class="mt-2">Login</v-btn>
    </span>
    <span v-if="page == 'register'">
      Already a user? <a @click="page = 'login'">Log in!</a>
      <v-btn color="info" @click="newUser()" block depressed tile class="mt-2">Register</v-btn>
    </span>
    <span v-if="page == 'logout'">
      <v-btn color="info" @click="logOut()" block depressed tile class="mt-2">Log out</v-btn>
    </span>
  </div>
</template>

<script>
import fclib from '../js/fclib'
export default {
  props: {
    username: {
      type: String,
      default: ''
    },
    password: {
      type: String,
      dafault: ''
    }
  },

  watch: {
    username(newValue) {
      console.log('username watched in login', newValue)
      this.username_copy = newValue
      this.page = this.username_copy ? 'logout' : 'register'
    },
    password(newValue) {
      this.password_copy = newValue
    }
  },

  data() {
    return {
      username_copy: '',
      password_copy: '',
      email_copy: '',
      show_password: false,
      page: 'register'
    }
  },

  methods: {
    isEmailValid() {
      console.log(this.email_copy)
      var reg = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,24}))$/
      return this.email_copy == '' ? '' : reg.test(this.email_copy) ? 'has-success' : 'has-error, error--text'
    },
    achus(event) {
      console.log(event)
      this.$refs.passwordField.focus()
    },
    checkLogin() {
      console.log('check login started...', this.username_copy, this.password_copy)
      var data = { username: this.username_copy, password: this.password_copy }

      var payload = { msg: 'login', username: this.username_copy, password: this.password_copy }

      fclib.sendMessage(payload, response => {
        console.log('login', response)
        if (response.success) {
          this.$emit('success', data, response) //let parent know
          this.page = 'logout'
        } else {
          //this.username_copy = '' //not reflecting to parent...
          this.password_copy = ''
          this.$refs.usernameField.focus()
          this.$emit('error', data, response) //let parent know
        }
      })
    },

    logOut() {
      var data = { username: '', password: '' }
      var response = { data: 'Successfully logged out!' }
      this.$emit('success', data, response) //let parent know
      this.page = 'login'
    },

    newUser() {
      console.log('check login started...', this.username_copy, this.password_copy)

      var data = { username: this.username_copy, password: this.password_copy }
      var payload = {
        msg: 'newuser',
        username: this.username_copy,
        password: this.password_copy,
        email: this.email_copy
      }

      fclib.sendMessage(payload, response => {
        console.log('newuser', response)
        if (response.success) {
          this.$emit('success', data, response) //let parent know
          this.page = 'logout'
        } else {
          //this.username_copy = '' //not reflecting to parent...
          this.password_copy = ''
          this.$refs.usernameField.focus()
          this.$emit('error', data, response) //let parent know
        }
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.bordered {
  border-style: solid;
  padding: 6px;
  border-width: 1px;
}
.mt-0 {
  padding-top: 0px;
}

</style>
