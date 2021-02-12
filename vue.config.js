module.exports = {
  pages: {
    popup: {
      template: 'public/browser-extension.html',
      entry: './src/popup/main.js',
      title: 'Popup'
    }
  },
  pluginOptions: {
    browserExtension: {
      componentOptions: {
        background: {
          entry: 'src/background.js'
        },
        contentScripts: {
          entries: {
            'content-script': ['src/content-scripts/content-script.js']
            // 'fc-main': ['src/content-scripts/fc-main.js'],
            // 'server': ['src/content-scripts/server.js'],
            // 'browser': ['src/content-scripts/browser.js'],
            // 'player' : ['src/content-scripts/player.js'],
            // 'utils' : ['src/content-scripts/utils.js']
          }
        }
      }
    }
  }
}
