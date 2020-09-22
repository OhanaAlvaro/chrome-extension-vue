# Family Cinema Vue Extension

This project is trying to add the power of Vue to our original Family Cinema plugin. Still working progress and not clear if we will get anywhere...

Let's take some notes about the whole architecture of this project.

# API

A single php file which receives and `action` together with the necessary data to perform each action.

**Available actions:**

- getData
- setData
- login
- newuser
- newpass

**Future actions**

- search
- getsync
- settagged
- add
- remove
- edit
- feedback
- resolvesug
- listbackups
- getbackup

# ADDON

The addon is the chrome-extension itself. Addons are like websites, but with peculiriates made mainly for security (addons have access to the browser, not just themselves).

## **About Vue**

This Addon is now built with Vue, for simplicity and speed coding.

Vue code lives within the `src` folder, although we also use a couple of stuff fromt the `publc` folder. Once project is deployed, the `dist` folder is created in the root, and it's the one that contains the static website that can be uploaded to the Chrome Store. Note: Items in the `public` folder, get copy-pasted to the `dist` folder directly.

This project uses the `src\vue.config.js` file to define how content is deployed as a web extension. Not that you have to changte it, but FYI just in case.

Withing the `src` folder, we have these main folders:

- `content-scripts`: folder with the content scripts (so far, we use just one). If another one were added, we'd need to update the vue.config.js file.
- `options`: Vue silo (independent) with the Vue code for the _options_ page, accessible from the extension details (within Chrome settings).
- `popup`: Vue silo (independent) with all the popup specific code. App.vue is its container, but then we mainly use the views and the components. Those are the ones you probably need to focus on. More specifically:
  - `popup\views`: The different MAIN pages. Might have yet a lot of noise here. Navigation between views is handled via router (`src\popup\router`). Views are the main pieces of the popup, but the "common" parts (i.e.: the toolbar) are in the `poup\App.vue` file (views get added to the `<router-view>` component).
  - `popup\components`: The different custom components. We import the `popup\components\index.js` file, from the `src\popup\main.js` to import some of the components globaly (like `fc-tooltip`). Components and views could be interchangeable technically speaking but, conceptually, components are... components. And views are... well, views.
  - `popup\js`: Some JS code we use in multiple files, so we import it instead of copy-pasting same functions over and over.

## **popup.html**

It'd be the actual html of the popup. In this Vue version, this one is now generated from its different Vue components (placed in the `./src/popup/` folder). How to create it is defined in the `./vue.config.js`

## **popup.js**

Interacts with the popup itself, and with the website through messages. It can send a message to a specific _tab_ (it checks first which one is active, and then uses that one).

```js
function sendMessage(msg, callback) {
  console.log('[sendMessage]: ', msg)
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    chrome.tabs.sendMessage(tabs[0].id, msg, function(response) {
      if (callback) callback(response)
    })
  })
}
```

It also listens to messages sent to the _runtime_, but only replies to `new-data`, handovering that message to the tab.

```js
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  console.log('[listen] Received request: ', request)
  if (request.msg == 'new-data') {
    getData()
  }
  sendResponse(true)
})
```

## **content-script**

Contains the Family Cinema object (fc), and the player. This one has direct contact with the websites users is watching.

It can send messages (`speak`) and receive messages (`listen`) to the `chrome.runtime`. The first time it's loaded, it sets the listener, and it loads the local settings.

### _**speak**_

```js
chrome.runtime.sendMessage(msg, function(response) {
  console.log('[speak] response: ', response)
})
```

The messages it sends using speak are:

- update-badge
- new-data

Example: `fc.speak({ msg: 'new-data' })`

### _**listen**_

It listens to the following messages from the extension (runtime):

```
- mark-current-time
- preview
- remove
- update-scene
- get-data
- update-settings
- play-pause
- pause
```

```js
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {}
```

## **background-script**

Note: background.js can send/receive same messages as `popup.js`.

It does basically two things, (1) handle commands, and (2) update the badge.

**Handle commands**

Commands are just shortkeys (like `Ctrl+Shift+S`). When catched (tbc if it works well everywhere), it and sends a message with the correspondent action (same messages as used in popup.js)

```js
function sendMessage(data) {
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    chrome.tabs.sendMessage(tabs[0].id, data, function(r) {})
  })
}
```

**Update the badge**

It seems it can catch the same messages as the `popup.js`. But, as of now, it only cares about updating the badge text (with the number of scenes):

```js
chrome.runtime.onMessage.addListener(function(data, sender, sendResponse) {
  if (typeof data !== 'object') return
  console.log(data.msg)
  if (data.msg === 'update-badge') {
    chrome.browserAction.setBadgeText({ text: '' + data.numDisplayedScenes, tabId: sender.tab.id })
  }
})
```

## Messages

Though already described above, let's recap the type of messages and who uses them:

`chrome.runtime`: the app/extension.

## Chrome API

`chrome.runtime.sendMessage(msg, callback(response))`

`chrome.runtime.onMessage.addListener(function(data,sender,sendResponse))`

`chrome.tabs.query` Returns the list of tabs that match the query

`chrome.tabs.sendMessage(tab_id, data, callback(response) {})
