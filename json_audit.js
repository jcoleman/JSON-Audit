// Copyright 2011, James Coleman

JSONAudit = {
  
  enable: function() {
    // Bind key-trigger for popping up view...
    $j(document).keydown(function (e) {
      if (e.metaKey && e.shiftKey && e.which == 65) {
        if (jQuery('#json-audit').length) {
          console.log('Closing JSON Audit Viewer');
          jQuery('#json-audit').remove();
        } else {
          console.log('Opening JSON Audit Viewer');
          JSONAudit.openViewer();
        }
        e.preventDefault();
      }
    });
  },
  
  attachTo: function(object, name) {
    try {
      JSONAudit.auditors.push(new JSONAuditor(object, name));
    } catch (e) {
      console.error('Error instantiating JSONAuditor', e);
    }
  },
  
  openViewer: function() {
    var inner = JSONAudit.auditors.inject('', function(acc, cur, index) {
      return acc + '<h5>' + (cur.name || ('JSON Auditor #' + index)) + '</h5>' + cur.toString();
    }) || '<h5>No JSON Auditors</h5>';
    
    var container = '<div id="json-audit" style="text-align: left; background-color: white; position: absolute; top: 0; left: 0; z-index: 100;">'
    jQuery(document.body).prepend(container + inner + '</div>');
  },
  
  auditors: []
  
};

JSONAuditor = function(object, name) {
  this.initialize = function(object, name) {
    this.name = name;
  
    if (this.isPrimitive(object)) {
      throw new Error('JSONAudit can only be instantiated with objects or arrays--not primitives.');
    }
    this.tracker = {};
    this.attach(object, this.tracker);
  };

  this.attach = function(object, tracker) {
    var self = this;
  
    tracker.value = object;
  
    if (this.isPrimitive(object)) {
      // Don't do anything special here for primitives.
    } else if (object.constructor === Array) {
      tracker.nodes = [];
      jQuery.each(object, function(index, value) {
        var nextTracker = {};
        tracker.nodes.push(nextTracker);
      
        self.attach(value, nextTracker);
      });
    } else {
      tracker.nodes = {};
      jQuery.each(object, function(key, value) {
        var nextTracker = tracker.nodes[key] = {};
      
        self.attach(value, nextTracker);
      
        object.__defineGetter__(key, function() {
          nextTracker.accessed = true;
          return value;
        });
        object.__defineSetter__(key, function(newValue) {
          nextTracker.accessed = true;
          value = newValue;
          return value;
        });
      });
    }
  
    // Do this at the end, since by recursing into the object
    // we could easily trigger the accessor methods that set
    // the 'accessed' property to true.
    // Technically the code currently doesn't do this as described,
    // but better safer than sorry on a later modification.
    tracker.accessed = false;
  };

  this.isPrimitive = function(object) {
    return object === undefined
           || object === null
           || object.constructor === String
           || object.constructor === Number
           || object.constructor === Date;
  };

  this.toString = function() {
    return '<pre>' + this.getStringForTracker(this.tracker, 0) + '</pre>';
  };

  this.getStringForTracker = function(tracker, currentIndentation) {
    var self = this;
    var str = '';
    var indentation = '  '.times(currentIndentation);
  
    if (this.isPrimitive(tracker.value)) {
      // This is a primitive value...
      str += indentation + tracker.value + '\n';
    } else if (tracker.nodes.constructor === Array) {
      str += indentation + 'Array:\n';
      jQuery.each(tracker.nodes, function (index, node) {
        str += indentation + '- ' + self.getStringForTracker(node, currentIndentation + 1);
      });
      str += '\n';
    } else {
      str += 'Object:\n';
      jQuery.each(tracker.nodes, function(key, node) {
        str += indentation + '(<span style="color: '+ (node.accessed ? 'red' : 'grey') + ';">' + key + '</span>): ' + self.getStringForTracker(node, currentIndentation + 1);
      });
      str += '\n';
    }
  
    return str;
  };
  
  this.initialize(object, name);
};