function sendMessage(msg, callback) {
  console.log('[sendMessage]: ', msg)
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    chrome.tabs.sendMessage(tabs[0].id, msg, function(response) {
      if (callback) callback(response)
    })
  })
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  console.log('[listen] Received request: ', request)
  if (request.msg == 'new-data') {
    getData()
  }
  sendResponse(true)
})

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

var tbody = document.getElementsByTagName('tbody')[0]
var welcome = document.getElementById('welcome')
var editor = document.getElementById('editor')
var textarea = document.getElementById('options')

var noscenes = document.getElementById('noscenes')
var name = document.getElementById('name')
var settingsWizard = document.getElementById('settingsWizard')
var sceneWizard = document.getElementById('sceneWizard')

var sceneEditor = document.getElementById('sceneEditor')

document.getElementById('defaultFilters').onclick = function() {
  openSettingsWizard()
}

function fixTimeAndUpdate(input, field) {
  var new_time = time2ms(input.value) || 0
  var old_time = parseInt(input.dataset.oldvalue) || 0
  var diff = Math.round(new_time - old_time)

  if (Math.abs(diff) == 59 * 60 * 1000) {
    // Minute overflow
    new_time = new_time - Math.sign(diff) * 60 * 60 * 1000
    input.value = ms2time(new_time)
  } else if (Math.abs(diff) == 59 * 1000) {
    // Seconds overflow
    new_time = new_time - Math.sign(diff) * 60 * 1000
    input.value = ms2time(new_time)
  } else if (Math.abs(diff) >= 950 && Math.abs(diff) < 1000) {
    // ms overflow
    new_time = new_time - Math.sign(diff) * 1000
    input.value = ms2time(new_time)
  }
  input.dataset.oldvalue = new_time
  updateScene(input.parentNode.parentNode, field)
}

function pushIntoTable(scene, tableBody) {
  // Create a new row
  var newRow = tableBody.insertRow(tableBody.rows.length)
  var row = `<tr>
          <td><input type="checkbox" value="skip"></td>
          <td><input type="time" step="0.050" value="00:00"></td>
          <td><input type="time" step="0.050" value="00:00"></td>
          <td style="width:300px"><div class='chip-input'></div></td>
          <td>
              <img class="action" src="jarri/img/preview.svg">
              <img class="action" src="jarri/img/delete.svg">
          </td>
        </tr>`
  newRow.innerHTML = row
  newRow.id = scene.id

  //newRow.getElementsByTagName("td")[1].textContent = Math.round((scene.end-scene.start)/100)/10+""
  //newRow.getElementsByTagName("td")[2].textContent = Math.round(scene.start/1000/6)/10+""

  var skip = newRow.getElementsByTagName('input')[0]
  skip.checked = scene.skip
  skip.onchange = function() {
    updateScene(this.parentNode.parentNode, 'skip')
  }

  // Set up start time input
  var stime = newRow.getElementsByTagName('input')[1]
  stime.value = ms2time(scene.start)
  stime.dataset.oldvalue = scene.start
  stime.onchange = function() {
    fixTimeAndUpdate(this, 'start')
  }

  // Set up end time input
  var etime = newRow.getElementsByTagName('input')[2]
  etime.value = ms2time(scene.end)
  etime.dataset.oldvalue = scene.end
  etime.onchange = function() {
    fixTimeAndUpdate(this, 'end')
  }

  // Set up preview button
  var prev = newRow.getElementsByTagName('img')[0]
  prev.onclick = function() {
    var row = this.parentNode.parentNode
    sendMessage({ msg: 'preview', id: row.id })
  }

  // Set up remove button
  var remove = newRow.getElementsByTagName('img')[1]
  remove.onclick = function() {
    var row = this.parentNode.parentNode
    sendMessage({ msg: 'remove', id: row.id })
  }

  // Set up drow down
  var chipInput = newRow.getElementsByClassName('chip-input')[0]
  chipInput.onclick = function() {
    var tags = getChipTags(this)
    var id = this.parentNode.parentNode.id
    openSceneWizard(tags, id)
  }

  populate(chipInput, scene.tags)
}

function populate(element, selected) {
  element.innerHTML = ''

  function createChip(text) {
    var chip = document.createElement('span')
    chip.classList.add('chip')
    chip.textContent = text
    return chip
  }

  for (var i = 0; i < selected.length; i++) {
    element.appendChild(createChip(selected[i]))
  }
}

function updateScene(row, field) {
  var skip = row.getElementsByTagName('input')[0].checked
  var stime = row.getElementsByTagName('input')[1]
  var etime = row.getElementsByTagName('input')[2]
  var rowTags = getChipTags(row.getElementsByClassName('chip-input')[0])

  var scene = {
    tags: rowTags,
    skip: skip,
    comment: '',
    start: time2ms(stime.value),
    end: time2ms(etime.value),
    id: row.id
  }
  sendMessage({ msg: 'update-scene', scene: scene, field: field })
}

function includesAny(arr1, arr2) {
  if (arr1.indexOf('All') !== -1) return true
  if (arr2.indexOf('All') !== -1) return true
  return arr1.some(v => arr2.indexOf(v) !== -1)
}

function updateSettings() {
  try {
    var new_settings = JSON.parse(textarea.value)
    for (key in new_settings) {
      if (typeof settings[key] !== typeof new_settings[key]) {
        throw 'Deleted/modified a required option'
      }
    }
    settings = new_settings
  } catch (e) {
    textarea.value = JSON.stringify(settings, null, 2)
  }

  settings.skip_tags = getChipTags(defaultFilters)
  console.log('[updateSettings] ', settings)
  sendMessage({ msg: 'update-settings', settings: settings })
}

document.getElementById('markCurrentTime').onclick = function() {
  sendMessage({ msg: 'mark-current-time' }, function(response) {
    console.log(response)
    if (response && response.scene) {
      var msg = [
        'Wow! Did you just do that? Thank your for adding a new scene!',
        'You are absolutely awesome!',
        'Thank you!',
        'The world would be a better place if everyone was like you!'
      ]
      noscenes.textContent = msg[Math.floor(Math.random() * msg.length)]
      openSceneWizard(response.scene.tags, response.scene.id)
      sendMessage({ msg: 'pause' })
    } else {
      console.log('[mark-current-time] No scene, assuming start')
      noscenes.textContent = 'Press again to mark the end of the scene'
    }
  })
}

document.getElementById('playPause').onclick = function() {
  sendMessage({ msg: 'play-pause' })
}

document.getElementById('go2Settings').onclick = function() {
  if (!settings) {
    welcome.textContent = 'Unable to load settings...'
    return
  }
  document.getElementById('settings').classList.toggle('hidden')
  sceneEditor.classList.toggle('hidden')
}

textarea.addEventListener('keyup', function() {
  updateSettings()
})

var skip_tags = false
var settings = false

function getData() {
  sendMessage({ msg: 'get-data' }, function(response) {
    loadData(response)
  })
}

function loadData(data) {
  if (!data) {
    return
  } else if (!data.settings || !data.scenes) {
    return (welcome.textContent = 'Try (re)loading some content!')
  }

  welcome.classList.add('hidden')
  if (document.getElementById('settings').classList.contains('hidden')) {
    sceneEditor.classList.remove('hidden')
  }

  console.log('[loadData] ', data)

  loadSettings(data.settings)

  loadScenes(data.scenes)
}

function loadScenes(scenes) {
  tbody.innerHTML = ''

  scenes.sort(function(a, b) {
    if (a.skip && !b.skip) return -1
    if (!a.skip && b.skip) return 1
    return a.start - b.start
  })

  for (var i = 0; i < scenes.length; i++) {
    pushIntoTable(scenes[i], tbody)
  }

  if (scenes.length == 0) {
    noscenes.textContent = 'No filters for this film. Be the first one to add one!'
  }
}

function loadSettings(new_settings) {
  settings = Object.assign({}, new_settings)
  document.getElementById('go2Settings').classList.remove('hidden')

  populate(defaultFilters, new_settings.skip_tags)

  name.textContent = new_settings.username + ' @ '

  delete new_settings['skip_tags']
  textarea.value = JSON.stringify(new_settings, null, 2)
}

function openSceneWizard(tags, id) {
  setWizardsTags(sceneWizard, tags)
  sceneWizard.classList.remove('hidden')
  sceneWizard.dataset.scene = id
  document.getElementById('disable').classList.add('parentDisable')
}

function openSettingsWizard() {
  setWizardsTags(settingsWizard, settings.skip_tags)
  settingsWizard.classList.remove('hidden')
  document.getElementById('disable').classList.add('parentDisable')
}

var order = ['scene-type']

function nextSceneWizard() {
  var active = sceneWizard.getElementsByClassName('active')[0]
  if (active.id == 'scene-type') {
    order = ['scene-type']
    var inputs = active.getElementsByTagName('input')
    if (inputs[0].checked) order.push('sex-severity', 'sex-type')
    if (inputs[1].checked) order.push('vio-severity', 'vio-type')
    if (inputs[2].checked) order.push('other-type')
    order.push('what-to-do', 'scene-type')
  } else if (active.id == 'what-to-do') {
    sceneWizard.classList.add('hidden')
    document.getElementById('disable').classList.remove('parentDisable')
    var row = document.getElementById(sceneWizard.dataset.scene)
    var chipInput = row.getElementsByClassName('chip-input')[0]
    var selected = getWizardsTags(order)
    populate(chipInput, selected)
    updateScene(row, 'tags')
  }
  nextID = order[order.indexOf(active.id) + 1]
  active.classList.remove('active')
  document.getElementById(nextID).classList.add('active')
}

function nextSettingsWizard() {
  var active = settingsWizard.getElementsByClassName('active')[0]
  if (active.id == 'sex-tolerance') {
    order = ['sex-tolerance', 'sex-type-tolerance']
    order.push('vio-tolerance', 'vio-type-tolerance')
    order.push('other-type-tolerance')
    order.push('what-to-do-tolerance', 'sex-tolerance')
  } else if (active.id == 'what-to-do-tolerance') {
    settingsWizard.classList.add('hidden')
    document.getElementById('disable').classList.remove('parentDisable')
    var selected = getWizardsTags(order)
    populate(defaultFilters, selected)
    updateSettings()
  }
  nextID = order[order.indexOf(active.id) + 1]
  active.classList.remove('active')
  document.getElementById(nextID).classList.add('active')
}

function prevWizard() {
  var active = document.getElementsByClassName('active')[0]
  nextID = order[order.indexOf(active.id) - 1]
  active.classList.remove('active')
  document.getElementById(nextID).classList.add('active')
}

var next = sceneWizard.getElementsByClassName('next')
for (var i = 0; i < next.length; i++)
  next[i].onclick = function() {
    nextSceneWizard()
  }

var next = settingsWizard.getElementsByClassName('next')
for (var i = 0; i < next.length; i++)
  next[i].onclick = function() {
    nextSettingsWizard()
  }

var prev = document.getElementsByClassName('prev')
for (var i = 0; i < prev.length; i++)
  prev[i].onclick = function() {
    prevWizard()
  }

function getWizardsTags(order) {
  var selected = []
  // Loop through 'order' to get selection only from displayed screens
  for (var i = 0; i < order.length - 1; i++) {
    var section = document.getElementById(order[i])
    var inputs = section.getElementsByTagName('input')
    for (var j = 0; j < inputs.length; j++) {
      if (inputs[j].checked) selected.push(inputs[j].value)
    }
  }
  return selected
}

function setWizardsTags(wizard, tags) {
  var inputs = wizard.getElementsByTagName('input')
  for (var i = 0; i < inputs.length; i++) {
    inputs[i].checked = tags.includes(inputs[i].value)
  }
}

sceneWizard.addEventListener('keyup', function(e) {
  if (e.key == 'Enter') {
    nextWizard()
  }
})

settingsWizard.addEventListener('keyup', function(e) {
  if (e.key == 'Enter') {
    nextWizard()
  }
})

function getChipTags(element) {
  var chips = element.getElementsByClassName('chip')
  var tags = []
  for (var i = 0; i < chips.length; i++) {
    if (!chips[i].classList.contains('remove') && !chips[i].classList.contains('hidden'))
      tags.push(chips[i].textContent)
  }
  return tags
}

function setChipTags(element, tags) {
  var chips = element.getElementsByClassName('chip')
  for (var i = 0; i < chips.length; i++) {
    if (tags.includes(chips[i].textContent)) {
      chips[i].classList.remove('hidden')
      chips[i].classList.remove('remove')
    }
  }
}

getData()
