"use strict";

lim.notes = new Class({
  Extends: lim.component,
  /**
   * @summary notes tool class
   * @classdesc The notes tool class let's the user annotate DOM elements.
   *            In edit mode after a click over an element a textarea is prompted to the user so that information for the elemnt can be stored,
   *            exisiting information can be edited or deleted.   
   *            In view mode all the information sotred for DOM elements is presented
   * @constructs lim.notes
   * @extends lim.controller
   */
  initialize: function() {
    this.name = 'notes';
    this.active = false;
    this.container = document.id('container');
    this.displayed_notes = [];
  },
  /*
   * @summary Enables the view operational mode
   * @memberof lim.notes.prototype
   */
  enableView: function() {
    this.addViewEvents();
  },
  /*
   * @summary Enables the edit operational mode
   * @memberof lim.notes.prototype
   */
  enableTool: function() {
    this.addToolEvents();
  },
  /*
   * @summary Disables the view operational mode
   * @memberof lim.notes.prototype
   */
  disableView: function() {
      this.disposeNotes();
  },
  /*
   * @summary Disables the edit operational mode
   * @memberof lim.notes.prototype
   */
  disableTool: function() {
    this.deactivate();
  },
  /**
   * @summary Adds events to the controller when in edit mood
   * @memberof lim.notes.prototype
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
   * @memberof lim.notes.prototype
   */
  addViewEvents: function() {
    var self = this;
    this.check_ctrl.addEvent('change', this.onchangeTool = function() {
      if(this.checked) {
        self.loadData('view');
      }
      else {
        self.disposeNotes();
      }
    });
  },
  /**
   * @summary Activates the component
   * @memberof lim.notes.prototype
   */
  activate: function() {
    // init
    this.active = true;

    // store previous selected element
    this.store = null;
    // attache events
    this.attach();

    //localStorage.setItem(this.name + '.' + location.href, ''); // debug
    // saved data
    this.loadData('edit');
  },
  /**
   * @summary Deactivates the component
   * @memberof lim.notes.prototype
   */
  deactivate: function() {
    if(this.active) {
      this.detach();
    }
    this.disposeNotes();
    this.active = false;
  },
  /**
   * @summary Removes all the notes from the document
   * @memberof lim.notes.prototype
   */
  disposeNotes: function() {
    this.displayed_notes.each(function(note) {
      note.dispose();
    });
  },
  /**
   * @summary Attaches the click element over the document
   * @memberof lim.notes.prototype
   */
  attach: function() {
    this.container.addEvent('click', this.onclick.bind(this));
  },
  /**
   * @summary Detaches the click element over the document
   * @memberof lim.notes.prototype
   */
  detach: function() {
    this.container.removeEvents('click');
  },
  /**
   * @summary Function executed when the user clicks the document
   * @memberof lim.notes.prototype
   */
  onclick: function(evt) {
    evt.stop();

    if(this.store !== null) {
      this.store.note.disposeEdit();
    }

    var note = new lim.notes.note('edit', evt.target, '', this);
    note.renderEdit();
    this.displayed_notes.push(note);

    this.store = {note: note};

  },
  /**
   * @summary Saves the notes in the storage object
   * @memberof lim.notes.prototype
   * @property {String} text the annotation
   * @property {Element} element the annotated element
   * @property {Object} note the note object
   */
  saveData: function(text, element, note) {
    var path = this.path(element);
    var data = JSON.decode(localStorage.getItem(this.name + '.' + location.href));
    if(!data) {
      data = [];
    }
    var overwritten = false;
    data.each(function(n, index) {
      if(n.path == path) {
        if(text) {
          n.text = text;
        }
        else {
          data.splice(index, 1);
          note.disposeEdit();
        }
        overwritten = true;
      }
    });
    if(!overwritten) {
      data.push({'text': text, 'path': this.path(element)});
    }
    localStorage.setItem(this.name + '.' + location.href, JSON.encode(data));
    this.store = null;
    alert('saved!');
  },
  /**
   * @summary Loads the stored notes and displays them in the document
   * @memberof lim.notes.prototype
   */
  loadData: function(mode) {
    
    var data = JSON.decode(localStorage.getItem(this.name + '.' + location.href));

    if(data) {
      data.each(function(n) {
        var element = document.getElements(n.path)[0];
        var note = new lim.notes.note(mode, element, n.text, this);
        note.render();
        this.displayed_notes.push(note);
      }.bind(this))
    }
  }

})

lim.notes.note = new Class({
  /**
   * @summary note class
   * @classdesc The note class represents an annotation tied to a DOM element
   *            In edit mode the annotation can be created, edited or deleted.   
   *            In view mode the annotation is shown
   * @constructs lim.notes.note
   * @param {String} mode the object mode (view|edit)
   * @param {Element} The annotated element
   * @param {String} text the annotation text
   */
  initialize: function(mode, element, text, notes_tool) {
    this.mode = mode;
    this.element = element;
    this.text = text;
    this.notes_tool = notes_tool;
    this.view = false;
    this.active = false;
  },
  /**
   * @summary Renders the note depending on the object mode
   * @memberof lim.notes.note.prototype
   * @return the proper render function depending on the object mode
   */
  render: function() {
    if(this.mode === 'edit') {
      return this.renderEdit();
    }
    else {
      return this.renderView();
    }
  },
  /**
   * @summary Renders the note for editing
   * @memberof lim.notes.note.prototype
   */
  renderEdit: function() {
    this.element.addClass('lim-note-active');
    var coords = this.element.getCoordinates();
    var textarea = new Element('textarea.lim-note').set('value', this.text),
        submit = new Element('input.lim-note[type=button][value=save]').addEvent('click', function() {
          this.notes_tool.saveData(textarea.get('value'), this.element, this);
        }.bind(this));
    this.form = new Element('div').setStyles({
      'position': 'absolute',
      'top': coords.top + 'px',
      'left': coords.right + 'px',
      'z-index': this.notes_tool.getMaxZindex() + 1
    });

    this.form.addEvent('click', function() {
      this.form.setStyle('z-index', this.notes_tool.getMaxZindex() + 1);
    }.bind(this))

    this.form.adopt(textarea, submit).inject(document.body);

    this.active = true;
  },
  /**
   * @summary Renders the note for viewing
   * @memberof lim.notes.note.prototype
   */
  renderView: function() {

    var self = this;
    var coords = this.element.getCoordinates();
    this.note = new Element('div.lim-note').setStyles({
        'position': 'absolute',
        'top': coords.top + 'px',
        'left': coords.right + 'px'
      }).set('html', '<p>' + this.text +'</p>').addEvents({
        'click': function() {
          self.element.toggleClass('lim-note-active');
          self.note.setStyle('z-index', self.notes_tool.getMaxZindex() + 1);
        }
      }).inject(document.body);

      this.view = true;

  },
  /**
   * @summary Disposes the note
   * @memberof lim.notes.note.prototype
   */
  dispose: function() {
    if(this.mode === 'view') {
      this.disposeView();
    }
    else {
      this.disposeEdit();
    }
  },
  /**
   * @summary Disposes the edit form
   * @memberof lim.notes.note.prototype
   */
  disposeEdit: function() {
    if(this.active) {
      this.element.removeClass('lim-note-active');
      this.form.dispose();
    }
    !this.active;
  },
  /**
   * @summary Disposes the displayed note
   * @memberof lim.notes.note.prototype
   */
  disposeView: function() {
    if(this.view) {
      this.element.removeClass('lim-note-active');
      this.note.dispose();
    }
    !this.view;
  }
})
