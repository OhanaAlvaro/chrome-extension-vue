chrome.commands.onCommand.addListener(function(command) {
  console.log('Command:', command)

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
  console.log(data.msg)
  if (data.msg === 'update-badge') {
    chrome.browserAction.setBadgeText({ text: '' + data.numDisplayedScenes, tabId: sender.tab.id })
  } else if (data.msg === 'shield-status') {
    if (data.status == 'missing') {
      chrome.browserAction.setBadgeBackgroundColor({ color: 'red' })
      //chrome.browserAction.setIcon({ path: 'icons/128_missing.png' })
    } else if (data.status == 'unkown') {
      chrome.browserAction.setBadgeBackgroundColor({ color: 'blue' })
      //chrome.browserAction.setIcon({ path: 'icons/128_unkown.png' })
    } else {
      chrome.browserAction.setBadgeBackgroundColor({ color: 'green' })
      //chrome.browserAction.setIcon({ path: 'icons/128.png' })
    }
  }
})

function sendMessage(data) {
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    chrome.tabs.sendMessage(tabs[0].id, data, function(r) {})
  })
}
