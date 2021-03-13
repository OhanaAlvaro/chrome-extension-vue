chrome.commands.onCommand.addListener(function(command) {
  console.log('background.js: ', command)

  if (command == 'mark-current-time-sex') {
    sendMessage({ msg: 'mark-current-time', tags: ['Sex'] })
  } else if (command == 'mark-current-time-violence') {
    sendMessage({ msg: 'mark-current-time', tags: ['Violence'] })
  } else if (command == 'mark-current-time-other') {
    sendMessage({ msg: 'mark-current-time', tags: ['Other'] })
  } else if (command == 'mark-current-time') {
    sendMessage({ msg: 'mark-current-time', tags: [] })
  }
})

chrome.runtime.onMessage.addListener(function(data, sender, sendResponse) {
  if (typeof data !== 'object') return
  console.log('background.js: ',data.msg)
  if (data.msg === 'update-badge') {
    chrome.browserAction.setBadgeText({ text: '' + data.numDisplayedScenes, tabId: sender.tab.id })
    chrome.browserAction.setBadgeBackgroundColor({ color: '#2b2b2b' })
  } else if (data.msg === 'shield-status') {
    if (data.status == 'missing') {
      chrome.browserAction.setIcon({ path: 'icons/missing.png', tabId: sender.tab.id })
    } else if (data.status == 'done') {
      chrome.browserAction.setIcon({ path: 'icons/done.png', tabId: sender.tab.id })
    } else {
      chrome.browserAction.setIcon({ path: 'icons/unknown.png', tabId: sender.tab.id })
    }
  }
})

function sendMessage(data) {
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    chrome.tabs.sendMessage(tabs[0].id, data, function(r) {})
  })
}
