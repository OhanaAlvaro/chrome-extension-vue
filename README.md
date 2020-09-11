# Family Cinema Vue Extension

This project is trying to add the power of Vue to our original Family Cinema plugin. Still working progress and not clear if we will get anywhere...

Let's take some notes about the whole architecture of this project.

# API

A single php file which receives and `action` together with the necessary data to perform each action.

**Available actions:**

- getData
- setData

**Future actions**

- search
- getsync
- settagged
- add
- remove
- edit
- feedback
- login
- newuser
- newpass
- resolvesug
- listbackups
- getbackup

# ADDON

The addon is the chrome-extension itself. Addons are like websites, but with peculiriates made mainly for security (addons have access to the browser, not just themselves).

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
