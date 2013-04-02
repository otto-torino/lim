"use strict";

lim.highlighter = new Class({
  Extends: lim.component,
  /**
   * @summary higlighter tool class
   * @classdesc The highlighter tool class let's the user highlight DOM elements.
   *            In edit mode after an element is highlighted with a click, and the operation is reversed with another click.
   *            In view mode all highlighted elements are shown.
   * @constructs lim.highlighter
   * @extends lim.controller
   */
  initialize: function() {
    this.name = 'highlighter';
    this.active = false;
    this.container = document.id('container');
  },
  /*
   * @summary Enables the view operational mode
   * @memberof lim.highlighter.prototype
   */
  enableView: function() {
    this.addViewEvents();
  },
  /*
   * @summary Enables the edit operational mode
   * @memberof lim.highlighter.prototype
   */
  enableTool: function() {
    this.addToolEvents();
  },
  /*
   * @summary Disables the view operational mode
   * @memberof lim.highlighter.prototype
   */
  disableView: function() {
      this.removeHighlight();
  },
  /*
   * @summary Disables the edit operational mode
   * @memberof lim.highlighter.prototype
   */
  disableTool: function() {
    this.deactivate();
  },
  /**
   * @summary Adds events to the controller when in edit mood
   * @memberof lim.highlighter.prototype
   */
  addToolEvents: function() {
    var self = this;
    this.check_ctrl.addEvent('change', this.onchangeTool = function() {
      if(this.checked) {
        self.activate();
      }
      else {
        self.deactivate();
      }
    });
  },
  /**
   * @summary Adds events to the controller when in view mood
   * @memberof lim.highlighter.prototype
   */
  addViewEvents: function() {
    var self = this;
    this.check_ctrl.addEvent('change', this.onchangeTool = function() {
      if(this.checked) {
        self.highlight();
      }
      else {
        self.removeHighlight();
      }
    });
  },
  /**
   * @summary Activates the component
   * @memberof lim.highlighter.prototype
   */
  activate: function() {
    var self = this;
    this.active = true;
    this.highlight();
    this.createToolWindow();
    this.container.addEvent('click', this.onclick = function(evt) {
      evt.stop();
      var highlight = false;
      if(evt.target.hasClass('lim-highlighter-highlighted')) {
        evt.target.removeClass('lim-highlighter-highlighted');
        evt.target.setStyle('background-color', evt.target.retrieve('bkg_color'));
      }
      else {
        evt.target.addClass('lim-highlighter-highlighted');
        evt.target.setStyle('background-color', self.color);
        highlight = true;
      }
      self.saveData(highlight, evt.target, self.color);
    })
  },
  /**
   * @summary Deactivates the component
   * @memberof lim.highlighter.prototype
   */
  deactivate: function() {
    if(this.active) {
    this.container.removeEvent('click', this.onclick);
    this.tool_window.dispose();
    }
    this.removeHighlight();
    !this.active;
  },
  /**
   * @summary Creates and renders the tool window
   * @memberof lim.highlighter.prototype
   * @description Creates the tool window with the color choice
   */
  createToolWindow: function() {

    // get viewport center
    var vp = this.viewport();

    // tools window
    this.tool_window = new Element('div#lim-tool_window').setStyles({
      'top': vp.cY + 'px',
      'left': vp.cX + 'px'
    }).inject(document.body, 'after');
    // dragable window
    var drag_tool = new Drag(this.tool_window);

    var tool_window_title = new Element('h1').set('text', 'Color');

    var color1_tool = new Element('span#lim-highlighter-color1_tool').set('title', 'color').addEvent('click', this.changeColor.bind(this, 1)),
        color2_tool = new Element('span#lim-highlighter-color2_tool').set('title', 'color').addEvent('click', this.changeColor.bind(this, 2)),
        color3_tool = new Element('span#lim-highlighter-color3_tool').set('title', 'color').addEvent('click', this.changeColor.bind(this, 3)),
        color4_tool = new Element('span#lim-highlighter-color4_tool').set('title', 'color').addEvent('click', this.changeColor.bind(this, 4));

    var tool_window_body = new Element('div#lim-tool_window_body').adopt(color1_tool, color2_tool, color3_tool, color4_tool);

    this.tool_window.adopt(tool_window_title, tool_window_body);

    // first color by default
    this.changeColor(1);

  },
  /*
   * @summary Sets the current highlighter color
   * @memberof lim.highlighter.prototype
   * @property {Integer} color the color number (colors are mapped to css classes)
   */
  changeColor: function(color) {
    [1, 2, 3, 4].each(function(c) {
      document.id('lim-highlighter-color' + c + '_tool').removeClass('active');
    });
    document.id('lim-highlighter-color' + color + '_tool').addClass('active');
    this.color = document.id('lim-highlighter-color' + color + '_tool').getStyle('background-color');
  },
  /**
   * @summary Highlights all stored elements
   * @memberof lim.highlighter.prototype
   */
  highlight: function() {
    this.data().each(function(el) {
      var element = document.getElements(el.path)[0];
      element.addClass('lim-highlighter-highlighted');
      element.store('bkg_color', element.getStyle('background-color'));
      element.setStyle('background-color', el.color);
    });
  },
  /**
   * @summary Removes highlight from all stored elements
   * @memberof lim.highlighter.prototype
   */
  removeHighlight: function() {
    this.data().each(function(el) {
      var element = document.getElements(el.path)[0];
      element.removeClass('lim-highlighter-highlighted');
      element.setStyle('background-color', element.retrieve('bkg_color'));
    });
  },
  /**
   * @summary Saves the highlighted element
   * @memberof lim.highlighter.prototype
   * @params {Boolean} highlight whether the element must be highlighted or not
   * @param {Element} element the element to highlight or remove highlighting
   */
  saveData: function(highlight, element, color) {
    var path = this.path(element);
    var data = JSON.decode(localStorage.getItem(this.name + '.' + location.href));
    if(!data) {
      data = [];
    }
    var overwritten = false;
    data.each(function(n, index) {
      if(n.path == path) {
        if(!highlight) {
          data.splice(index, 1);
        }
        overwritten = true;
      }
    });
    if(!overwritten) {
      data.push({'path': this.path(element), 'color': color});
      console.log(color);
    }
    localStorage.setItem(this.name + '.' + location.href, JSON.encode(data));
    alert('saved!');
  },
  /**
   * @summary Gets the array containing the highlighted elements objecs from storage
   * @memberof lim.highlighter.prototype
   * @return {Array} The array of the highlighte objects
   */
  data: function() {
    return JSON.decode(localStorage.getItem(this.name + '.' + location.href)) || [];
  }
});
