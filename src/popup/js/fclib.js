function time2ms(hms) {
  // Updated on 2020-09-14 by @asopenag, now it works with hh:mm too
  // So now it expects/asumes: hh:mm:ss | hh:mm  (note: seconds may come with decimals, and that's ok)

  var a = hms.split(':') // split it at the colons

  if (a.length == 3) {
    //hh:mm:ss
    var seconds = +a[0] * 60 * 60 + +a[1] * 60 + +a[2]
  } else if (a.length == 2) {
    //hh:mm
    var seconds = +a[0] * 60 * 60 + +a[1] * 60
  } else {
    var seconds = 0 //not expected...
  }

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

function fixTime(new_time_ms, old_time_ms) {
  //console.log('new_time_ms', new_time_ms)

  var new_time = new_time_ms || 0
  var old_time = parseInt(old_time_ms) || 0
  var diff = Math.round(new_time - old_time)

  //console.log('time-diff', diff, new_time, old_time)

  if (Math.abs(diff) == 59 * 60 * 1000) {
    // Minute overflow
    new_time = new_time - Math.sign(diff) * 60 * 60 * 1000
  } else if (Math.abs(diff) == 59 * 1000) {
    // Seconds overflow
    new_time = new_time - Math.sign(diff) * 60 * 1000
  } else if (Math.abs(diff) >= 950 && Math.abs(diff) < 1000) {
    // ms overflow
    new_time = new_time - Math.sign(diff) * 1000
  }

  return new_time
}

module.exports = {
  ms2time,
  pad,
  time2ms,
  sendMessage,
  includesAny,
  getData,
  fixTime
}
