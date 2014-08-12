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

var Tasklet = function(callable, timeout) {
    this.callable = callable;

    ///////////////////////////////
    // Mozilla javascript forces
    // a minimum timeout of 4ms
    // (nsGlobalWindow.cpp:
    //     DOM_MIN_TIMEOUT_VALUE)
    // which is fine for original
    // intent but it would be nice
    // of there was a special case
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
      return;
    }

    // reschedule
    window.setTimeout(this.unit, this.timeout);
  }
});


// vim: set sts=4 sw=4 expandtab:
