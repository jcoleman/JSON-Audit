JSON Audit
=

Designed to be used inside your Ajax request-heavy application to determine what parts of the serialized JSON are actually used and what can be removed.

How it works:
-

JSON Audit attaches "auditor" instances to each JSON object you pass, and walks over the object graph replacing each object key with a corresponding getter and setter. The getters and setters log in a separate data structure what has been accessed.


Requirements:
-
Because it uses Javascript getters and setters, JSON Audit requires either a WebKit based browser such as Safari and Chrome, or Firefox. It also requires, but does not include, jQuery. JQuery is not included so that you can directly include JSON Audit in your project as a git submodule without having to worry about the extra jQuery JS files conflicting with your own.


How to use:
-

When you want to enable JSON Audit, just include the following in your code (after the json_audit.js file has been included):

    JSONAudit.enable();

This will begin trapping the Alt-Shift-A keypress event to open/close the JSON Audit viewer.

To audit a JSON object, you need to call:

    JSONAudit.attachTo(object, name);

Where 'object' is the JSON object being audited, and 'name' is an optional identifier for that object. You should make this call as soon as possible (before you app begins to access the object) for the audit to be correct.

That's it!

After enabling JSONAudit and attaching it to your objects, triggering the hotkey will open a viewer displaying all of your JSON object graphs. A key in red means that the value was accessed while a key in grey means that the value has not yet been accessed.