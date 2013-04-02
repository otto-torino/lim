"use strict";

lim.painter = new Class({
  Extends: lim.component,
  /**
   * @summary painter tool class
   * @classdesc The painter tool class let's the user draw over the page contents
   *            In edit mode some tools are provided to draw over the page contents
   *            In view mode the stored drawing is showed
   * @constructs lim.painter
   * @extends lim.controller
   */
  initialize: function() {
    this.name = 'painter';
    this.active = false;
    this.color = null;
  },
  /*
   * @summary Enables the view operational mode
   * @memberof lim.painter.prototype
   */
  enableView: function() {
    this.addViewEvents();
  },
  /*
   * @summary Enables the edit operational mode
   * @memberof lim.painter.prototype
   */
  enableTool: function() {
    this.addToolEvents();
  },
  /*
   * @summary Disables the view operational mode
   * @memberof lim.painter.prototype
   */
  disableView: function() {
    this.disposeCanvas();
  },
  /*
   * @summary Disables the edit operational mode
   * @memberof lim.painter.prototype
   */
  disableTool: function() {
    this.deactivate();
  },
  /**
   * @summary Adds events to the controller when in view mode
   * @memberof lim.painter.prototype
   */
  addViewEvents: function() {
    var self = this;
    this.check_ctrl.addEvent('change', this.onchangeView = function() {
      if(this.checked) {
        // render the canvas and load stored data in it
        self.createCanvas();
        self.loadData();
      }
      else {
        // remove the canvas
        self.disposeCanvas();
      }
    });
  },
  /**
   * @summary Loads data from the storage object and render them over the canvas
   * @memberof lim.painter,prototype
   */
  loadData: function loadData() {
    var data = localStorage.getItem(this.name + '.' + location.href);
    var img = new Image();
    img.src = data;
    img.onload = function() {
      var ctx = this.canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
    }.bind(this);
  },
  /**
   * @summary Adds events to the controller when in edit mood
   * @memberof lim.painter.prototype
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
   * @summary Creates the canvas and renders it over the container
   * @memberof lim.painter.prototype
   */
  createCanvas: function() {
    this.container = document.id('container');
    // canvas element and resizing
    this.canvas = new Element('canvas').setStyles({
      'position': 'absolute',
      'background': 'transparent',
      'border': '5px solid #000',
      'box-sizing': 'border-box'
    });
    this.ctx = this.canvas.getContext('2d');
    this.resizeCanvas().inject(document.body);

    window.addEvent('resize', function() {
      this.resizeCanvas();
    }.bind(this));
  },
  /**
   * @summary Resizes and moves the canvas to cover the container
   * @memberof lim.painter.prototype
   * @return {Element} the canvas element
   */
  resizeCanvas: function() {
    var doc_dim = this.container.getCoordinates();
    this.canvas.setStyles({
      'top': doc_dim.top + 'px',
      'left': doc_dim.left + 'px',
    }).setProperties({
      'height': doc_dim.height + 'px',
      'width': doc_dim.width + 'px',
    });

    return this.canvas;
  },
  /**
   * @summary Clears the canvas
   * @memberof lim.painter.prototype
   */
  clearCanvas: function() {
    this.ctx.clearRect(0, 0, this.canvas.get('width').toInt(), this.canvas.get('height').toInt());
  },
  /**
   * @summary Removes the canvas
   * @memberof lim.painter.prototype
   */
  disposeCanvas: function disposeCanvas() {
    if(this.canvas) {
      this.canvas.dispose();
    }
  },
  /**
   * @summary Activates the painter tool
   * @memberof lim.painter.prototype
   * @description Creates and renders the canvas, creates and renders the tools window and loads the stored data
   */
  activate: function() {

    // init
    this.active = true;
    this.createCanvas();
    this.createToolWindow();

    // saved data
    this.loadData();

  },
  /**
   * @summary Deactivates the painter tool
   * @memberof lim.painter.prototype
   * @description Removes the canvas and the tools window
   */
  deactivate: function() {
    if(this.active) {
      this.canvas.dispose();
      this.tool_window.dispose();
    }
    this.active = false;
  },
  /**
   * @summary Creates and renders the tool window
   * @memberof lim.painter.prototype
   * @description Creates the tool window with the color choice, the trash and the save buttons
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

    var tool_window_title = new Element('h1').set('text', 'Tools');

    this.pencil = new lim.painter.pencil(this.canvas, this.hexStringToArray('000000'), '4');

    //var pencil_tool = new Element('span#lim-painter-pencil_tool').set('title', 'pencil').addEvent('click', this.pencil.activate.bind(this.pencil)),
    var clear_tool = new Element('span#lim-painter-clear_tool').set('title', 'clear').addEvent('click', this.clearCanvas.bind(this)),
        save_tool = new Element('span#lim-painter-save_tool').set('title', 'save').addEvent('click', this.saveData.bind(this));

    var color1_tool = new Element('span#lim-painter-color1_tool').set('title', 'color').addEvent('click', this.changeColor.bind(this, 1)),
        color2_tool = new Element('span#lim-painter-color2_tool').set('title', 'color').addEvent('click', this.changeColor.bind(this, 2)),
        color3_tool = new Element('span#lim-painter-color3_tool').set('title', 'color').addEvent('click', this.changeColor.bind(this, 3));

    //var tool_window_body = new Element('div#lim-painter-tool_window_body').adopt(pencil_tool, clear_tool, save_tool, color1_tool, color2_tool, color3_tool);
    var tool_window_body = new Element('div#lim-tool_window_body').adopt(clear_tool, save_tool, color1_tool, color2_tool, color3_tool);

    this.tool_window.adopt(tool_window_title, tool_window_body);

    // activate pencil by default
    this.pencil.activate();
    // first color by default
    this.changeColor(1);

  },
  /*
   * @summary Sets the current drawing color
   * @memberof lim.painter.prototype
   * @property {Integer} color the color number (colors are mapped to css classes)
   */
  changeColor: function(color) {

    [1, 2, 3].each(function(c) {
      document.id('lim-painter-color' + c + '_tool').removeClass('active');
    });
    document.id('lim-painter-color' + color + '_tool').addClass('active');
    var color = document.id('lim-painter-color' + color + '_tool').getStyle('background-color');

    this.pencil.changeColor(this.hexStringToArray(color.substring(1)));
  },
  /**
   * @summary Converts an hex color string to an hex color array
   * @memberof lim.painter.prototype
   * @param {String} color_string the hex color string
   * @return {Array} the hex color array
   */
  hexStringToArray: function(color_string) {
    return [color_string.substring(0,1), color_string.substring(2,3), color_string.substring(4,5)];
  },
  /**
   * @summary Gets the canvas data in a url string format
   * @memberof lim.painter.prototype
   * @return {String} the canvas data
   */
  data: function data() {
    return this.canvas.toDataURL();
  },
  /**
   * @summary Saves the canvas data in the storage object
   * @memberof lim.painter.prototype
   */
  saveData: function() {
    localStorage.setItem(this.name + '.' + location.href, this.data());
    alert('saved!');
  }
})

lim.painter.pencil = new Class({
  /**
   * @summary the painter paint tool class
   * @memberof lim.painter
   * @classdesc pencil tool for the painter component. Let's you draw free-hand over the canvas
   * @constructs lim.painter.pencil
   * @params {Object} canvas the canvas object
   * @params {Array} color the hex color in an array form
   * @params {Integer} dim the stroke dimension
   */
  initialize: function(canvas, color, dim) {

    this.canvas = canvas;
    this.color = color.hexToRgb();
    this.dim = dim;
    this.ctx = this.canvas.getContext('2d');
    this.ctx.strokeStyle = this.color;
    this.ctx.fillStyle = this.color;
    this.ctx.lineWidth = this.dim;
    this.draw = false;

  },
  /**
   * @summary Changes the stroke color
   * @memberof lim.painter.pencil.prototype
   * @params {Array} color the hex color in an array form
   */
  changeColor: function(color) {
    this.ctx.strokeStyle = color.hexToRgb();
    this.ctx.fillStyle = color.hexToRgb();
  },
  /**
   * @summary activates the tool
   * @memberof lim.painter.pencil.prototype
   */
  activate: function() {
    this.canvas.addEvent('mousedown', this.start.bind(this));
    this.canvas.addEvent('mousemove', this.stroke.bind(this));
    this.canvas.addEvent('mouseup', this.stop.bind(this));
    this.canvas.addEvent('mouseout', this.stop.bind(this));	
  },
  /**
   * @summary deactivates the tool
   * @memberof lim.painter.pencil.prototype
   */
  deactivate: function() {
    this.canvas.removeEvents('mousedown', 'mousemove', 'mouseup', 'mouseout');	
  },
  /**
   * @summary starts drawing
   * @memberof lim.painter.pencil.prototype
   */
  start: function(evt) {
    this.draw = true;
    var x,y;
    x = evt.page.x - $(this.canvas).getCoordinates().left;
    y = evt.page.y - $(this.canvas).getCoordinates().top;
    this.ctx.fillRect(x-(this.dim/2).round(), y-(this.dim/2).round(), this.dim, this.dim);
    this.ctx.beginPath();
    this.ctx.moveTo(x, y);
  },
  /**
   * @summary Strokes the line on mousemove
   * @memberof lim.painter.pencil.prototype
   */
  stroke: function(evt) {
    if (this.draw) {
      var x,y;
      x = evt.page.x - $(this.canvas).getCoordinates().left;
      y = evt.page.y - $(this.canvas).getCoordinates().top;
      this.ctx.lineTo(x, y);
      this.ctx.stroke();
    }
  },
  /**
   * @summary Stops drawing
   * @memberof lim.painter.pencil.prototype
   */
  stop: function(evt) {
    if (this.draw) {
      this.draw = false;
    }
  }
})



