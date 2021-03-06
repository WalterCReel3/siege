var $E = function(tagName, attributes) {
    var result = document.createElement(tagName);
    if (!attributes) return result;
    _.each(attributes, function (v, k) {
        result.setAttribute(k, v);
    });
    return result;
}

var klass = {};
klass.extend = function(base) {
  if ((typeof base) != "function")
    throw new TypeError("klass.extend: invalid base");
  var ctor = function() {
    if (arguments.length == 1
    && arguments[0] === undefined) {
      return;
    }
    this.initialize.apply(this, arguments);
  }
  ctor.prototype = new base(undefined);
  ctor.prototype.constructor = ctor;
  ctor.superClass = base.prototype;
  return ctor;
}

klass.create = function() {
  return klass.extend(Object);
}

var $break = function() {};
var Tasklet = function(callable, timeout) {
    this.callable = callable;

    ///////////////////////////////
    // Mozilla javascript forces
    // a minimum timeout of 4ms
    // (nsGlobalWindow.cpp:
    //     DOM_MIN_TIMEOUT_VALUE)
    // which is fine for original
    // intent but it would be nice
    // if there was a special case
    // for 0 meaning relenquish
    // control to other scheduled
    // routines (callbacks sitting
    // in the timeout list) or the
    // event queue.
    this.timeout = timeout || 10;
    this.cancel = false;

    //
    // Bind this instances work unit
    //
    this.unit = _.bind(this.task, this);
}

_.extend(Tasklet.prototype, {
  run: function() {
    this.unit();
  },

  halt: function() {
    this.cancel = true;
  },

  resume: function() {
    this.cancel = false;
    this.unit();
  },

  task: function() {
    if (this.cancel) return;
    try {
      this.callable();
    } catch (e) {
      // catch errors and the special
      // $break object for normal
      // termination
      if (e !== $break) console.log(e);
      return;
    }

    // reschedule
    window.setTimeout(this.unit, this.timeout);
  }
});

var rgbaString = function(color) {
    var alpha = color[3] || 1.0;
    return "rgba(" + color[0] + ", "
                   + color[1] + ", "
                   + color[2] + ", "
                   + alpha + ")";
}

var randcolor = function() {
    return [Math.round(Math.random()*255),
            Math.round(Math.random()*255),
            Math.round(Math.random()*255)];
}

var randbound = function(min, max) {
    var range = max - min;
    return (Math.random() * range) + min;
}


// vim: set sts=4 sw=4 expandtab:
