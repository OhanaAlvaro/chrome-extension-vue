<template>
  <!-- 
  This receives props username and password. When user clicks login, this sends event "success" or "error" accordinagly, for parent to take care
  Here we don't use v-model back to the parent (only events), but watch for properties changes (though parent might not trigger them properly... )
-->

  <div class="bordered">
    <v-text-field
      append-icon="mdi-account"
      name="username"
      label="username"
      v-model="username_copy"
    ></v-text-field>

    <v-text-field
      password
      label="Password"
      v-model="password_copy"
      :append-icon="show_password ? 'mdi-eye' : 'mdi-eye-off'"
      :type="show_password ? 'text' : 'password'"
      @click:append="show_password = !show_password"
    ></v-text-field>

    <span>
      New user?
      <a href="https://familycinema.netlify.app/#/join-us" target="_blank">Register now!</a>
    </span>
    <v-btn color="info" @click="checkLogin()" block depressed tile>Login</v-btn>
  </div>
</template>

<script>
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
    },
    password(newValue) {
      this.password_copy = newValue
    }
  },

  data() {
    return {
      username_copy: '',
      password_copy: '',
      show_password: false
    }
  },

  methods: {
    checkLogin() {
      var data = { username: this.username_copy, password: this.password_copy }

      var payload = { msg: 'login', username: this.username_copy, password: this.password_copy }

      this.sendMessage(payload, response => {
        console.log('login', response)
        if (response.success) {
          this.$emit('success', data, response) //let parent know
        } else {
          this.username_copy = '' //not reflecting to parent...
          this.password_copy = ''
          this.$emit('error', data, response) //let parent know
        }
      })
    },

    //Generic methods:
    sendMessage(msg, callback) {
      console.log('[sendMessage]: ', msg)
      chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
        chrome.tabs.sendMessage(tabs[0].id, msg, function(response) {
          if (callback) callback(response)
        })
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.bordered {
  border-style: solid;
  padding: 10px;
  border-width: 1px;
}
</style>
