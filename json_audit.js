// Copyright 2011, James Coleman

JSONAudit = {
  
  enable: function() {
    // Bind key-trigger for popping up view...
    document.observe('keypress', function(event) {
      // Open on Meta-Shift-A
      if (event.metaKey && event.shiftKey && event.keyCode == 97) {
        event.stop();
        
        if (JSONAudit.currentElement) {
          console.log('Closing JSON Audit Viewer');
          JSONAudit.currentElement.remove();
          JSONAudit.currentElement = null;
        } else {
          console.log('Opening JSON Audit Viewer');
          JSONAudit.openViewer();
        }
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
    var el = new Element('div', {style: 'text-align: left; background-color: white; position: absolute; top: 0; left: 0; z-index: 100;'});
    
    el.update(
      JSONAudit.auditors.inject('', function(acc, cur, index) {
        return acc + '<div id="json-audit"><h5>' + (cur.name || ('JSON Auditor #' + index)) + '</h5>' + cur.toString() + '</div>';
      }) || '<div id="json-audit"><h5>No JSON Auditors</h5></div>'
    );
    
    document.body.insert({top: el});
    
    JSONAudit.currentElement = el;
  },
  
  currentElement: null,
  
  auditors: []
  
};

JSONAuditor = Class.create({
  
  initialize: function(object, name) {
    this.name = name;
    
    if (this.isPrimitive(object)) {
      throw new Error('JSONAudit can only be instantiated with objects or arrays--not primitives.');
    }
    this.tracker = {};
    this.attach(object, this.tracker);
  },
  
  attach: function(object, tracker) {
    var self = this;
    
    tracker.value = object;
    
    if (Object.isArray(object)) {
      tracker.nodes = [];
      object.each(function(value, index) {
        var nextTracker = {};
        tracker.nodes.push(nextTracker);
        
        self.attach(value, nextTracker);
      });
    } else if (this.isPrimitive(object)) {
      // Don't do anything special here for primitives.
    } else {
      tracker.nodes = {};
      Object.keys(object).each(function(key) {
        var value = object[key];
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
  },
  
  isPrimitive: function(object) {
    return Object.isNumber(object)
           || Object.isString(object)
           || object === undefined
           || object === null
           || (object.constructor && object.constructor === Date);
  },
  
  toString: function() {
    return '<pre>' + this.getStringForTracker(this.tracker, 0) + '</pre>';
  },
  
  getStringForTracker: function(tracker, currentIndentation) {
    var self = this;
    var str = '';
    var indentation = '  '.times(currentIndentation);
    
    if (this.isPrimitive(tracker.value)) {
      // This is a primitive value...
      str += indentation + tracker.value + '\n';
    } else if (Object.isArray(tracker.nodes)) {
      str += indentation + 'Array:\n';
      tracker.nodes.each(function (node) {
        str += indentation + '- ' + self.getStringForTracker(node, currentIndentation + 1);
      });
      str += '\n';
    } else {
      str += 'Object:\n';
      Object.keys(tracker.nodes).each(function(key) {
        var node = tracker.nodes[key];
        str += indentation + '(<span style="color: '+ (node.accessed ? 'red' : 'grey') + ';">' + key + '</span>): ' + self.getStringForTracker(node, currentIndentation + 1);
      });
      str += '\n';
    }
    
    return str;
  }
  
});