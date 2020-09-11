function time2ms(hms) {
  var a = hms.split(':') // split it at the colons
  var seconds = +a[0] * 60 * 60 + +a[1] * 60 + +a[2]
  return seconds * 1000
}

function pad(n, width, z) {
  z = z || '0'
  n = n + ''
  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n
}

function ms2time(s) {
  s = Math.round(s)
  var ms = s % 1000
  s = (s - ms) / 1000
  var secs = s % 60
  s = (s - secs) / 60
  var mins = s % 60
  var hrs = (s - mins) / 60

  return pad(hrs, 2) + ':' + pad(mins, 2) + ':' + pad(secs, 2) + '.' + pad(ms, 3)
}

function sendMessage(msg, callback) {
  console.log('[sendMessage]: ', msg)
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    chrome.tabs.sendMessage(tabs[0].id, msg, function(response) {
      if (callback) callback(response)
    })
  })
}

function includesAny(arr1, arr2) {
  if (arr1.indexOf('All') !== -1) return true
  if (arr2.indexOf('All') !== -1) return true
  return arr1.some(v => arr2.indexOf(v) !== -1)
}

function getData(callback) {
  sendMessage({ msg: 'get-data' }, function(response) {
    callback(response)
  })
}

module.exports = {
  ms2time,
  pad,
  time2ms,
  sendMessage,
  includesAny,
  getData
}
