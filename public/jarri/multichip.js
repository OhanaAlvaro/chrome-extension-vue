//Build the plugin
var multichip = function (info) {
  var o = {
    element: info.element,
    options: info.options,
    onUpdate: info.onUpdate || function () {},
    selected: info.selected || [],

    populate: function () {
      var duplicated = this.options.concat(this.selected);
      this.options = [...new Set(duplicated)];

      this.element.classList.add('drop');
      this.element.innerHTML = `<div class="drop-display"></div><div class="drop-options"></div>`;
      this.dropDisplay = this.element.getElementsByClassName('drop-display')[0];
      this.dropOptions = this.element.getElementsByClassName('drop-options')[0];

      var that = this;

      function createChip(text, visible) {
        var chip = document.createElement('span');
        chip.classList.add('chip');
        if (!visible) chip.classList.add('hidden');
        chip.textContent = text;
        chip.onclick = function () {
          that.toggle(text);
        };
        return chip;
      }

      for (var i = 0; i < this.options.length; i++) {
        var visible = this.selected.includes(this.options[i]);
        this.dropDisplay.appendChild(createChip(this.options[i], visible));
        this.dropOptions.appendChild(createChip(this.options[i], !visible));
      }
      this.element.dataset.selected = JSON.stringify(this.selected);
    },

    isSelected: function (index) {
      var chip = this.dropDisplay.childNodes[index];
      return !chip.classList.contains('remove') && !chip.classList.contains('hidden');
    },

    selectOption: function (index) {
      console.log('[selectOption]', index);
      this.dropDisplay.childNodes[index].classList.remove('hidden');
      this.dropDisplay.childNodes[index].classList.add('add');
      this.dropDisplay.childNodes[index].classList.remove('remove');

      this.dropOptions.childNodes[index].classList.add('remove');
      this.dropOptions.childNodes[index].classList.remove('add');
    },

    unselectOption: function (index) {
      console.log('[unselectOption]', index);
      this.dropOptions.childNodes[index].classList.remove('hidden');
      this.dropOptions.childNodes[index].classList.add('add');
      this.dropOptions.childNodes[index].classList.remove('remove');

      this.dropDisplay.childNodes[index].classList.add('remove');
      this.dropDisplay.childNodes[index].classList.remove('add');
    },

    toggle: function (option) {
      console.log('[toggle]', option);
      for (var i = 0; i < this.dropDisplay.childNodes.length; i++) {
        if (this.dropDisplay.childNodes[i].textContent == option) {
          if (this.isSelected(i)) {
            this.unselectOption(i);
          } else {
            this.selectOption(i);
          }
        }
      }
      this.getSelection();
      this.element.dataset.selected = JSON.stringify(this.selected);
      this.onUpdate();
    },

    getSelection: function () {
      var selected = [];
      for (var i = 0; i < this.dropDisplay.childNodes.length; i++) {
        if (this.isSelected(i)) selected.push(this.dropDisplay.childNodes[i].textContent);
      }
      this.selected = selected;
      return selected;
    },

    setSelection: function (selected) {
      for (var i = 0; i < this.dropDisplay.childNodes.length; i++) {
        if (selected.includes(this.dropDisplay.childNodes[i].textContent)) {
          this.selectOption(i);
        } else {
          this.unselectOption(i);
        }
      }
      this.selected = selected;
      this.element.dataset.selected = JSON.stringify(this.selected);
      this.onUpdate();
    },
  };
  o.populate();
  return o;
};

var myDrop = new multichip({
  element: document.getElementById('skip'),
  options: [],
  selected: ['Something went wrong. Try reloading?'],
});
