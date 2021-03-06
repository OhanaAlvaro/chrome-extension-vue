# Ohana Vue Extension

# API

A separated component, but key here, is our Ohana API. So far it's a single php file which receives and `action` together with the necessary data to perform the action.

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

## To deploy

Run `npm run build`. This creates the `dist` folder. That's the folder we share with Google for the Google Store.

## To debug

- Run `npm run serve`.
- Same `dist` folder is created, but this time it is self-refreshed with your changes on the code, so you can see the changes in Chrome.
- Add it to Chrome (if not done before):
  - Go to `chrome://extensions/`
  - Turn ON developer mode
  - Add the extension from the `dist` folder.

## **About Vue**

This Addon is now built with Vue, for simplicity and speed coding.

Vue code lives within the `src` folder, although we also use a couple of stuff fromt the `public` folder. Once the project is deployed, the `dist` folder is created in the root, and it's the one that contains the static website that can be uploaded to the Chrome Store. Note: Items in the `public` folder, get copy-pasted to the `dist` folder directly.

## Project structure

This project uses the `src\vue.config.js` file to define how content is deployed as a web extension. Not that you have to changte it, but FYI just in case.

Withing the `src` folder, we have these main folders:

- `content-scripts`: folder with the content scripts (so far, we use just one). If another one were added, we'd need to update the vue.config.js file.
- `popup`: Vue silo (independent) with all the popup specific code. App.vue is its container, but then we mainly use the views and the components. Those are the ones you probably need to focus on. More specifically:
  - `popup\views`: The different MAIN pages. Might have yet a lot of noise here. Navigation between views is handled via router (`src\popup\router`). Views are the main pieces of the popup, but the "common" parts (i.e.: the toolbar) are in the `popup\App.vue` file (views get added there within the `<router-view>` component there).
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

The content script is like the backend of the extension itself. It has direct contact with the websites users is on, and can make changes there.

**Main content-script objects:**

- fc
- player
- browser
- server
- utils

In short, the UX interacts with the users' website by sending messages to the content-script, and we use it to also interact with our server and simplify the data for the UX.

This backend can send messages (`speak`) and receive messages (`listen`) to the `chrome.runtime`. It also have callback functions for the messages that makes sense.

Note: The first time it's loaded, it sets the listener, and it loads the local settings.

### _**speak**_

```js
chrome.runtime.sendMessage(msg, function(response) {
  console.log('[speak] response: ', response)
})
```

The messages it sends using speak are:

- update-badge: Change the number on the icon.
- new-data: [tbc]: Notify there has been changes, so we can refresh the UX.

Example: `fc.speak({ msg: 'new-data' })`

### _**listen**_

It listens to the following messages (`msg`) from the extension (runtime):

```
- mark-current-time
- get-time
- show-sidebar
- preview
- remove
- update-scene
- get-data
- update-settings
- set-tagged
- play-pause
- pause
- mute
- blur
- seek-frame
- seek-diff
- login
- newuser
- newpass
```

Every time we send a message, we send the `request` object, and optionally use a callback to handle the response. The `request` object always includes the `msg` key with the actual action we want to perform, then each action/message works with different extra parameters within the `request` object.

Let's dive deeper on what each msg does:

`mark-current-time`

- **Description:** [tbc] Used when creating a new scene: first time called it markes current time as start-time, second time it's end-time and returns the new scene [tbc].
- **Parameters:**

`get-time`

- **Description:** Return the current time from the player.
- **Parameters:**
  - `msg`
- **Response:** `{ success: true, time: player.getTime() }`

`show-sidebar`

- **Description:** Opens the iframe with the side bar (Editor mode).
- **Parameters:**
  - `msg`
  - `show`: `true` or `false`. [explanation tbc, by default use `true`]

`preview`

- **Description:** Start the preview of the given scene
- **Parameters:**
  - `msg`
  - `id`: Id of the scene to preview

`remove`

- **Description:** Remove a given scene
- **Parameters:**
  - `msg`
  - `id`: Id of the scene to remove

`update-scene`

- **Description:** make changes on a field of the given scene
- **Parameters:**
  - `msg`:
  - `scene`: [tbc] scene object?
  - `field`: [tbc] field to change. One of `start`, `end`, `skip`.

`get-data`

- **Description:**
- **Parameters:**
- **Response:** The response becomes, through `App.vue`, the actual main `data` object used in the UX (and passed to the child views as property).

```
  response: {
    success: true/false,
    msg: 'new-data',
    scenes: fc.scenes,
    settings: fc.settings,
    tagged: fc.tagged,
    shield: fc.shield, //unknown|xxx|xxx
    metadata: fc.metadata
  }
```

`update-settings`

- **Description:**
- **Parameters:**
  - `msg`
  - `settings`: The new settings objects to replace
- **Response:** [tbc] `true` if successfully saved the settings.

`play-pause`

- **Description:** Toggles play/pause on the current movie
- **Parameters:**

`pause`

- **Description:** Presses "pause" on the current movie
- **Parameters:**

`play`

- **Description:** Presses "play" on the current movie
- **Parameters:**

```js
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {}
```

## **background-script**

Note: background.js can send/receive same messages as `popup.js`.

It does basically two things, (1) handle commands (shortkeys), and (2) update the badge.

**Handle commands**

Commands are just shortkeys (like `Ctrl+Shift+S`). When triggered (tbc if it works well everywhere), it and sends a message with the correspondent action (same messages as used in popup.js)

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

`chrome.runtime.onMessage.addListener(function(data, sender, sendResponse))`

`chrome.tabs.query` Returns the list of tabs that match the query

`chrome.tabs.sendMessage(tab_id, data, callback(response) {})`
