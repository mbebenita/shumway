/* -*- Mode: js; js-indent-level: 2; indent-tabs-mode: nil; tab-width: 2 -*- */
/* vim: set shiftwidth=2 tabstop=2 autoindent cindent expandtab: */
/*
 * Copyright 2013 Mozilla Foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/*global formatErrorMessage, throwErrorFromVM, AVM2, $RELEASE */

var create = Object.create;
var defineProperty = Object.defineProperty;
var keys = Object.keys;
var isArray = Array.isArray;
var fromCharCode = String.fromCharCode;
var logE = Math.log;
var max = Math.max;
var min = Math.min;
var pow = Math.pow;
var push = Array.prototype.push;
var slice = Array.prototype.slice;
var splice = Array.prototype.splice;

function fail(msg, context) {
  throw new Error((context ? context + ': ' : '') + msg);
}
function assert(cond, msg, context) {
  if (!cond)
    fail(msg, context);
}

// e.g. throwError("ArgumentError", Errors.InvalidEnumError, "blendMode");
// "ArgumentError: Error #2008: Parameter blendMode must be one of the accepted values."

function scriptProperties(namespace, props) {
  return props.reduce(function (o, p) {
    o[p] = namespace + " " + p;
    return o;
  }, {});
}

function cloneObject(obj) {
  var clone = Object.create(null);
  for (var prop in obj)
    clone[prop] = obj[prop];
  return clone;
}

function sortNumeric(a, b) {
  return a - b;
}
function sortByZindex(a, b) {
  return a._zindex - b._zindex;
}

function rgbaObjToStr(color) {
  return 'rgba(' + color.red + ',' + color.green + ',' + color.blue + ',' +
         color.alpha / 255 + ')';
}
function rgbIntAlphaToStr(color, alpha) {
  color |= 0;
  if (alpha >= 1) {
    var colorStr = color.toString(16);
    while (colorStr.length < 6) {
      colorStr = '0' + colorStr;
    }
    return "#" + colorStr;
  }
  var red = color >> 16 & 0xFF;
  var green = color >> 8 & 0xFF;
  var blue = color & 0xFF;
  return 'rgba(' + red + ',' + green + ',' + blue + ',' + alpha + ')';
}
function argbUintToStr(argb) {
  return 'rgba(' + (argb >>> 16 & 0xff) + ',' + (argb >>> 8 & 0xff) + ',' +
         (argb & 0xff) + ',' + (argb >>> 24 & 0xff) / 0xff + ')';
}

// Some browser feature testing
(function functionNameSupport() {
  /*jshint -W061 */
  if (eval("function t() {} t.name === 't'")) {
    return; // function name feature is supported
  }
  Object.defineProperty(Function.prototype, 'name', {
    get: function () {
      if (this.__name) {
        return this.__name;
      }
      var m = /function\s([^\(]+)/.exec(this.toString());
      var name = m && m[1] !== 'anonymous' ? m[1] : null;
      this.__name = name;
      return name;
    },
    configurable: true,
    enumerable: false
  });
})();

var randomStyleCache;

var nextStyle = 0;
function randomStyle() {
  if (!randomStyleCache) {
    randomStyleCache = [
      "#ff5e3a",
      "#ff9500",
      "#ffdb4c",
      "#87fc70",
      "#52edc7",
      "#1ad6fd",
      "#c644fc",
      "#ef4db6",
      "#4a4a4a",
      "#dbddde",
      "#ff3b30",
      "#ff9500",
      "#ffcc00",
      "#4cd964",
      "#34aadc",
      "#007aff",
      "#5856d6",
      "#ff2d55",
      "#8e8e93",
      "#c7c7cc",
      "#5ad427",
      "#c86edf",
      "#d1eefc",
      "#e0f8d8",
      "#fb2b69",
      "#f7f7f7",
      "#1d77ef",
      "#d6cec3",
      "#55efcb",
      "#ff4981",
      "#ffd3e0",
      "#f7f7f7",
      "#ff1300",
      "#1f1f21",
      "#bdbec2",
      "#ff3a2d"
    ];
  }
  return randomStyleCache[(nextStyle ++) % randomStyleCache.length];
}

var Promise = (function PromiseClosure() {
  function isPromise(obj) {
    return typeof obj === 'object' && obj !== null &&
      typeof obj.then === 'function';
  }
  function defaultOnFulfilled(value) {
    return value;
  }
  function defaultOnRejected(reason) {
    throw reason;
  }

  function propagateFulfilled(subject, value) {
    subject.subpromisesValue = value;
    var subpromises = subject.subpromises;
    if (!subpromises) {
      return;
    }
    for (var i = 0; i < subpromises.length; i++) {
      subpromises[i].fulfill(value);
    }
    delete subject.subpromises;
  }
  function propagateRejected(subject, reason) {
    subject.subpromisesReason = reason;
    var subpromises = subject.subpromises;
    if (!subpromises) {
      if (!$RELEASE) {
        console.warn(reason);
      }
      return;
    }
    for (var i = 0; i < subpromises.length; i++) {
      subpromises[i].reject(reason);
    }
    delete subject.subpromises;
  }

  function performCall(callback, arg, subject) {
    try {
      var value = callback(arg);
      if (isPromise(value)) {
        value.then(function Promise_queueCall_onFulfilled(value) {
          propagateFulfilled(subject, value);
        }, function Promise_queueCall_onRejected(reason) {
          propagateRejected(subject, reason);
        });
        return;
      }

      propagateFulfilled(subject, value);
    } catch (ex) {
      propagateRejected(subject, ex);
    }
  }

  var queue = [];
  function processQueue() {
    while (queue.length > 0) {
      var task = queue[0];
      if (task.directCallback) {
        task.callback.call(task.subject, task.arg);
      } else {
        performCall(task.callback, task.arg, task.subject);
      }
      queue.shift();
    }
  }

  function queueCall(callback, arg, subject, directCallback) {
    if (queue.length === 0) {
      setTimeout(processQueue, 0);
    }
    queue.push({callback: callback, arg: arg, subject: subject,
                directCallback: directCallback});
  }

  function Promise(onFulfilled, onRejected) {
    this.state = 'pending';
    this.onFulfilled = typeof onFulfilled === 'function' ?
      onFulfilled : defaultOnFulfilled;
    this.onRejected = typeof onRejected === 'function' ?
      onRejected : defaultOnRejected;
  }
  Promise.prototype = {
    fulfill: function Promise_resolve(value) {
      if (this.state !== 'pending') {
        return;
      }
      this.state = 'fulfilled';
      this.value = value;
      queueCall(this.onFulfilled, value, this, false);
    },
    reject: function Promise_reject(reason) {
      if (this.state !== 'pending') {
        return;
      }
      this.state = 'rejected';
      this.reason = reason;
      queueCall(this.onRejected, reason, this, false);
    },
    then: function Promise_then(onFulfilled, onRejected) {
      var promise = new Promise(onFulfilled, onRejected);
      if ('subpromisesValue' in this) {
        queueCall(promise.fulfill, this.subpromisesValue, promise, true);
      } else if ('subpromisesReason' in this) {
        queueCall(promise.reject, this.subpromisesReason, promise, true);
      } else {
        var subpromises = this.subpromises || (this.subpromises = []);
        subpromises.push(promise);
      }
      return promise;
    },
    get resolved() {
      return this.state === 'fulfilled';
    },
    resolve: function (value) {
      this.fulfill(value);
    }
  };

  Promise.when = function Promise_when() {
    var promise = new Promise();
    if (arguments.length === 0) {
      promise.resolve();
      return promise;
    }
    var promises = slice.call(arguments, 0);
    var result = [];
    var i = 1;
    function fulfill(value) {
      result.push(value);
      if (i < promises.length) {
        promises[i++].then(fulfill, reject);
      } else {
        promise.resolve(result);
      }
      return value;
    }
    function reject(reason) {
      promise.reject(reason);
    }
    promises[0].then(fulfill, reject);
    return promise;
  };

  return Promise;
})();

var QuadTree = function (x, y, width, height, parent) {
  this.x = x | 0;
  this.y = y | 0;
  this.width = width | 0;
  this.height = height | 0;

  if (parent) {
    this.root = parent.root;
    this.parent = parent;
    this.level = parent.level + 1;
  } else {
    this.root = this;
    this.parent = null;
    this.level = 0;
  }

  this.reset();
};
QuadTree.prototype.reset = function () {
  this.stuckObjects = null;
  this.objects = null;
  this.nodes = [];
};
QuadTree.prototype._findIndex = function (xMin, xMax, yMin, yMax) {
  var midX = this.x + ((this.width / 2) | 0);
  var midY = this.y + ((this.height / 2) | 0);

  var top = yMin < midY && yMax < midY;
  var bottom = yMin > midY;

  if (xMin < midX && xMax < midX) {
    if (top) {
      return 1;
    } else if(bottom) {
      return 2;
    }
  } else if (xMin > midX) {
    if (top) {
      return 0;
    } else if (bottom) {
      return 3;
    }
  }

  return -1;
};
QuadTree.prototype.insert = function (obj) {
  var nodes = this.nodes;

  if (nodes.length) {
    var index = this._findIndex(obj.xMin, obj.xMax, obj.yMin, obj.yMax);

    if (index > -1) {
      nodes[index].insert(obj);
    } else {
      obj.prev = null;
      if (this.stuckObjects) {
        obj.next = this.stuckObjects;
        this.stuckObjects.prev = obj;
      } else {
        obj.next = null;
      }
      this.stuckObjects = obj;
      obj.parent = this;
    }

    return;
  }

  var numChildren = 1;

  var item = this.objects;

  if (!item) {
    obj.prev = null;
    obj.next = null;
    this.objects = obj;
  } else {
    while (item.next) {
      numChildren++;
      item = item.next;
    }
    obj.prev = item;
    obj.next = null;
    item.next = obj;
  }

  if (numChildren > 4 && this.level < 10) {
    this._subdivide();

    item = this.objects;
    while (item) {
      var next = item.next;
      this.insert(item);
      item = next;
    }

    this.objects = null;

    return;
  }

  obj.parent = this;
};
QuadTree.prototype.update = function (obj) {
  var node = obj.parent;

  if (node) {
    if (obj.xMin >= node.x && obj.xMax <= node.x + node.width &&
        obj.yMin >= node.y && obj.yMax <= node.y + node.height)
    {
      if (node.nodes.length) {
        var index = this._findIndex(obj.xMin, obj.xMax, obj.yMin, obj.yMax);

        if (index > -1) {
          node.remove(obj);
          node = this.nodes[index];
          node.insert(obj);
        }
      } else {
        node.remove(obj);
        node.insert(obj);
      }

      return;
    }

    node.remove(obj);
  }

  this.root.insert(obj);
};
QuadTree.prototype.remove = function (obj) {
  var prev = obj.prev;
  var next = obj.next;
  if (prev) {
    prev.next = next;
    obj.prev = null;
  } else {
    var node = obj.parent;
    if (node.objects === obj) {
      node.objects = next;
    } else if (node.stuckObjects === obj) {
      node.stuckObjects = next;
    }
  }
  if (next) {
    next.prev = prev;
    obj.next = null;
  }
  obj.parent = null;
};
QuadTree.prototype.retrieve = function (xMin, xMax, yMin, yMax) {
  var stack = [];
  var out = [];

  var node = this;
  do {
    if (node.nodes.length) {
      var index = node._findIndex(xMin, xMax, yMin, yMax);

      if (index > -1) {
        stack.push(node.nodes[index]);
      } else {
        stack.push.apply(stack, node.nodes);
      }
    }

    var item = node.objects;
    for (var i = 0; i < 2; i++) {
      while (item) {
        if (!(item.xMin > xMax ||
              item.xMax < xMin ||
              item.yMin > yMax ||
              item.yMax < yMin))
        {
          out.push(item);
        }
        item = item.next;
      }
      item = node.stuckObjects;
    }

    node = stack.pop();
  } while (node);

  return out;
};
QuadTree.prototype._subdivide = function () {
  var halfWidth = (this.width / 2) | 0;
  var halfHeight = (this.height / 2) | 0;
  var midX = this.x + halfWidth;
  var midY = this.y + halfHeight;
  this.nodes[0] = new QuadTree(midX, this.y, halfWidth, halfHeight, this);
  this.nodes[1] = new QuadTree(this.x, this.y, halfWidth, halfHeight, this);
  this.nodes[2] = new QuadTree(this.x, midY, halfWidth, halfHeight, this);
  this.nodes[3] = new QuadTree(midX, midY, halfWidth, halfHeight, this);
};

var RegionCluster = function () {
  this.regions = [];
};
RegionCluster.prototype.reset = function () {
  this.regions.length = 0;
};
RegionCluster.prototype.insert = function (region) {
  var regions = this.regions;

  if (regions.length < 3) {
    regions.push({ xMin: region.xMin,
                   xMax: region.xMax,
                   yMin: region.yMin,
                   yMax: region.yMax });
    return;
  }

  var a = region;
  var b = regions[0];
  var c = regions[1];
  var d = regions[2];

  var ab = (max(a.xMax, b.xMax) - min(a.xMin, b.xMin)) *
           (max(a.yMax, b.yMax) - min(a.yMin, b.yMin));
  var rb = regions[0];

  var ac = (max(a.xMax, c.xMax) - min(a.xMin, c.xMin)) *
           (max(a.yMax, c.yMax) - min(a.yMin, c.yMin));
  var ad = (max(a.xMax, d.xMax) - min(a.xMin, d.xMin)) *
           (max(a.yMax, d.yMax) - min(a.yMin, d.yMin));

  if (ac < ab) {
    ab = ac;
    rb = c;
  }
  if (ad < ab) {
    ab = ad;
    rb = d;
  }

  var bc = (max(b.xMax, c.xMax) - min(b.xMin, c.xMin)) *
           (max(b.yMax, c.yMax) - min(b.yMin, c.yMin));
  var bd = (max(b.xMax, d.xMax) - min(b.xMin, d.xMin)) *
           (max(b.yMax, d.yMax) - min(b.yMin, d.yMin));
  var cd = (max(c.xMax, d.xMax) - min(c.xMin, d.xMin)) *
           (max(c.yMax, d.yMax) - min(c.yMin, d.yMin));

  if (ab < bc && ab < bd && ab < cd) {
    if (a.xMin < rb.xMin) {
      rb.xMin = a.xMin;
    }
    if (a.xMax > rb.xMax) {
      rb.xMax = a.xMax;
    }
    if (a.yMin < rb.yMin) {
      rb.yMin = a.yMin;
    }
    if (a.yMax > rb.yMax) {
      rb.yMax = a.yMax;
    }
    return;
  }

  rb = regions[0];

  var rc = regions[1];

  if (bd < bc) {
    bc = bd;
    rc = regions[2];
  }
  if (cd < bc) {
    rb = regions[1];
    rc = regions[2];
  }

  if (rc.xMin < rb.xMin) {
    rb.xMin = rc.xMin;
  }
  if (rc.xMax > rb.xMax) {
    rb.xMax = rc.xMax;
  }
  if (rc.yMin < rb.yMin) {
    rb.yMin = rc.yMin;
  }
  if (rc.yMax > rb.yMax) {
    rb.yMax = rc.yMax;
  }

  rc.xMin = a.xMin;
  rc.xMax = a.xMax;
  rc.yMin = a.yMin;
  rc.yMax = a.yMax;
};
RegionCluster.prototype.retrieve = function () {
  return this.regions;
};

var EXTERNAL_INTERFACE_FEATURE = 1;
var CLIPBOARD_FEATURE = 2;
var SHAREDOBJECT_FEATURE = 3;
var VIDEO_FEATURE = 4;
var SOUND_FEATURE = 5;
var NETCONNECTION_FEATURE = 6;

if (!this.performance) {
  this.performance = {};
}
if (!this.performance.now) {
  this.performance.now = Date.now;
}
