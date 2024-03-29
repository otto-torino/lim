"use strict";

/**
 * Lim Library namespace
 * @namespace
 */
var lim;
if(!lim) lim = {};
else if(typeof lim != 'object') {
  throw new Error('lim already exists and is not an object');
}

/**
 * @summary Throws a warning in the console
 * @memberof lim
 * @param {String} message The warning message
 */
lim.warning = function(message) {
  console.log('Warning! ' + message);
}

/**
 * @summary Throws an error and optionally alerts it
 * @memberof lim
 * @param {String} message The error message
 * @param {Boolean} should_alert Whether to alert the error or not
 */
lim.error = function(message, should_alert) {
  throw new Error(message) ;
  if(should_alert) {
    alert(message);
  }
}

/**
 * @summary Checks for html5 storage
 * @memberof lim
 * @return true if storage is supported, false otherwise
 */
lim.checkStorage = function() {
  try {
    return 'localStorage' in window && window['localStorage'] !== null;
  } catch (e) {
    return false;
  }
}

/**
 * @summary Library and components loader
 * @memberof lim
 * @description Loads the control bar and the requsted components
 * @param {Array} components The names of the components to be loaded
 * @example 
 *  window.addEvent('load', function() {
 *    lim.load(['painter', 'notes', 'highlighter']);
 *  })
 */
lim.load = function load(components) {

  var self = this;

  // some checks
  if(!components.length) {
    this.error('load at least one component');
    return false;
  }

  if(!this.checkStorage()) {
    this.error('storage not supported');
  }
  // end some checks

  // create components
  this.components = [];
  components.each(function(c) {
    this.components.push(new lim[c]);
  }.bind(this));

  // control bar
  this.bar = new Element('nav', {class: 'lim-bar'}).inject(document.body);

  // mode controllers
  var ctrl_container = new Element('div.left').inject(this.bar);

  // bar position
  var position_label = new Element('label').set('text', 'bar');
  var position_checkbox = new Element('input.ios-switch.position[type=checkbox][value=1]').addEvent('change', changeBarPosition);
  var position_div = new Element('div.switch');
  var position_container = new Element('div.right').adopt(position_label.adopt(position_checkbox, position_div)).inject(this.bar);

  function changeBarPosition() {
    var position = this.checked ? 'bottom' : 'top';
    if(position === 'bottom') {
      self.bar.setStyles({
        'top': 'auto',
        'bottom': '0'
      });
    }
    else {
      self.bar.setStyles({
        'bottom': 'auto',
        'top': '0'
      });
    }
  }

  // mode selection
  var mode_label = new Element('label').set('text', 'mode');
  var mode_checkbox = new Element('input.ios-switch.mode[type=checkbox][value=1]').addEvent('change', changeMode);
  var mode_div = new Element('div.switch');
  var mode_container = new Element('div.right').adopt(mode_label.adopt(mode_checkbox, mode_div)).inject(this.bar);

  function changeMode(evt) {
    ctrl_container.empty();
    var mode = this.checked ? 'edit' : 'view';
    self.components.each(function(c) {
      c.setMode(mode, ctrl_container);
    });
  }

  mode_checkbox.fireEvent('change');

}

lim.component = new Class({
  name: 'component',
  /**
   * @summary Component primitive class from which all real components inherits
   * @classdesc This is the primitive controller class which every real controller extends. Provides a set of methods used by all components.
   * @constructs lim.component
   */
  initialize: function() {
   // do nothing
  },
  /**
   * @summary Sets the operational mode of the component
   * @memberof lim.component.prototype
   * @description Adds the component controller and attaches the proper events depending on the operation mode
   * @param {String} mode the operation mode (view|edit)
   * @param {Element} ctrl_container the container in which insert the controller element
   */
  setMode: function(mode, ctrl_container) {
    // add the controller
    this.setController(ctrl_container);
    // enable the proper mode
    if(mode === 'view') {
      this.disableTool();
      this.enableView();
    }
    else {
      this.disableView();
      this.enableTool();
    }
  },
  /**
   * @summary Sets and renders the component controller
   * @memberof lim.component.prototype
   * @param {Element} ctrl_container the container in which insert the controller element
   */
  setController: function(ctrl_container) {
    var div = new Element('div.switch'),
        check_label = new Element('label[for=lim-view_' + this.name +']').set('text', this.name);
    this.check_ctrl = new Element('input#lim-view_' + this.name + '.ios-switch[type=checkbox][value=1]');

    ctrl_container.adopt(check_label.adopt(this.check_ctrl, div));
  },
  /**
   * @summary CSS selector for the given element
   * @memberof lim.component.prototype
   * @param {Element} element the DOM element
   * @return {String} the css selector
   */
  path: function(element) {

    if(element.get('id')) {
      return '#' + element.get('id');
    }

    if(element == this.container) {
      return '#container';
    }

    var prev_equal_siblings_length = element.getAllPrevious(element.get('tag')).length;

    var part = element.get('tag') + ':nth-of-type(' + (prev_equal_siblings_length + 1) + ')';

    return this.path(element.getParent()) + ' > ' + part;

  },
  /**
   * @summary Gets the viewport center coordinates
   * @memberof lim.component.prototype
   * @return {Object} the object representing the center of the viewport, cX and cY coordinates
   */
  viewport: function viewport() {
    var document_coords = document.getCoordinates();
    var document_scroll = document.getScroll();
    var cX = document_coords.width / 2;
    var cY = document_coords.height / 2 + document_scroll.y;

    return {cX: cX, cY: cY};
  },
  /**
   * @summary Gets the maximum z-index in the document
   * @memberof lim.component.prototype
   * @return {Integer} the maximum z-index in the document
   */
  getMaxZindex: function() {
    var max_z = 0;
    $$('body *').each(function(el) {
      if(el.getStyle('z-index').toInt()) max_z = Math.max(max_z, el.getStyle('z-index').toInt());
    });

    return max_z;
  }

})
