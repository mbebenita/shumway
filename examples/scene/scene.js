var Bench = (function () {
  function bench () {

  }
  return bench;
})();

var Animator = (function () {
  function animator(frame) {
    this.frame = frame;
  }
  animator.prototype.step = function (time) {

  };
  return animator;
})();

Animator.Rotate = (function () {
  function rotate(frame, time) {
    Animator.call(this, frame);
    this.time = time;
    this.speed = Math.random() / 10;
  }
  rotate.prototype = Object.create(Animator.prototype);
  rotate.prototype.step = function (time) {
    if (time > this.time) {
      return false;
    }
    this.frame.rotate(this.speed);
    return true;
  };
  return rotate;
})();

Animator.Scale = (function () {
  function rotate(frame, time) {
    Animator.call(this, frame);
    this.time = time;
    this.speed = Math.random() / 50;
  }
  rotate.prototype = Object.create(Animator.prototype);
  rotate.prototype.step = function (time) {
    if (time > this.time) {
      return false;
    }
    var x = Math.sin(time / 1000) * this.speed;
    var y = Math.cos(time / 1000) * this.speed;

    this.frame.scale(1 - x, 1 - y);
    return true;
  };
  return rotate;
})();

Animator.Slide = (function () {
  function slide(frame, time) {
    Animator.call(this, frame);
    this.time = time;
    this.speed = Math.random() * 10;
  }
  slide.prototype = Object.create(Animator.prototype);
  slide.prototype.step = function (time) {
    if (time > this.time) {
      return false;
    }
    this.frame.translate(Math.sin(time / 1000) * this.speed, 0);
    return true;
  };
  return slide;
})();

function drawRectangle(context, rectangle) {
  context.rect(rectangle.x, rectangle.y, rectangle.w, rectangle.h);
}

var selected = undefined;
var Frame = (function () {
  function frame(name) {
    this.style = "rgba(" + (Math.random() * 255 | 0) + "," + (Math.random() * 255 | 0)  + "," + (Math.random() * 255 | 0)  + ", 1)";
    this.children = [];
    this.transform = Transform.createIdentity();
    this.inverseTransform = Transform.createIdentity();
    this.isTransformDirty = false;
    this.isDirty = false;
  }
  frame.prototype.addChild = function (frame) {
    this.children.push(frame);
    frame.parent = this;
  };
  frame.prototype.render = function (context, ignore) {
    context.save();
    var t = this.transform;

    context.transform(t.a, t.b, t.c, t.d, t.e, t.f);
    context.beginPath();
    context.rect(0, 0, this.w, this.h);
    context.closePath();
    context.fillStyle = this.style;
    if (true || !ignore) {
      context.fill();
      if (this === selected) {
        context.lineWidth = 3;
        context.strokeStyle = "red";
        context.stroke();
      }
    }
    context.save();
    for (var i = 0; i < this.children.length; i++) {
      this.children[i].render(context);
    }
    context.restore();
    context.restore();
  };
  var tmpPoint = {x: 0, y: 0};
  frame.prototype.select = function (x, y) {
    var contains;
    contains = x >= 0 && x < this.w && y >= 0 && y < this.h;
    if (contains) {
      for (var i = this.children.length - 1; i >= 0; i--) {
        var child = this.children[i];
        var point = {x: x, y: y};
        child.transformPoint(point);
        var result = child.select(point.x, point.y);
        if (result) {
          return result;
        }
      }
    }
    if (contains) {
      return this;
    }
    return undefined;
  };

  frame.prototype.visit = function (visitor, transform) {
    var stack, frame, transforms;
    if (transform) {
      stack = [this];
      transforms = [transform];
      while (stack.length > 0) {
        frame = stack.pop();
        transform = transforms.pop();
        for (var i = frame.children.length - 1; i >= 0; i--) {
          stack.push(frame.children[i]);
          var t = transform.clone();
          Transform.mul(t, frame.children[i].transform);
          transforms.push(t);
        }
        visitor(frame, transform);
      }
    } else {
      stack = [this];
      while (stack.length > 0) {
        frame = stack.pop();
        for (var i = frame.children.length - 1; i >= 0; i--) {
          stack.push(frame.children[i]);
        }
        visitor(frame);
      }
    }
  };

  frame.prototype.transformPoint = function(point) {
    this._updateTransform();
    this.inverseTransform.transformPoint(point);
  };

  frame.createGrid = function (columns, rows, w, h, padding) {
    padding = padding || 2;
    var parent = new Frame();
    for (var i = 0; i < columns; i++) {
      for (var j = 0; j < rows; j++) {
        var child = new Frame();
        var x = padding + i * (w + padding);
        var y = padding + j * (h + padding);
        child.translate(x, y);
        child.w = w;
        child.h = w;
        parent.addChild(child);
      }
    }
    parent.w = padding + columns * (w + padding);
    parent.h = padding + rows * (h + padding);
    return parent;
  };

  frame.prototype._updateTransform = function () {
    if (this.isTransformDirty) {
      this.transform.inverse(this.inverseTransform);
    }
    this.isTransformDirty = false;
  };

  frame.prototype.rotate = function (angle) {
    this.isDirty = true;
    this.isTransformDirty = true;
    this.transform.rotate(angle);
  };

  frame.prototype.translate = function (x, y) {
    this.isDirty = true;
    this.isTransformDirty = true;
    this.transform.translate(x, y);
  };

  frame.prototype.scale = function (x, y) {
    this.isDirty = true;
    this.isTransformDirty = true;
    this.transform.scale(x, y);
  };

  frame.createNestedList = function (count, w, h, padding) {
    padding = padding || 2;
    var parent = new Frame();
    var root = parent;

    for (var i = 0; i < count; i++) {
      var x = padding;
      var y = padding;
      var child = new Frame();
      child.translate(x, y);
      child.w = w + (count - i - 1) * 2 * padding;
      child.h = h + (count - i - 1) * 2 * padding;
      parent.addChild(child);
      parent = child;
    }
    root.w = w + count * 2 * padding;
    root.h = h + count * 2 * padding;
    return root;
  };

  Object.defineProperty(frame.prototype, "x", {
    get: function () {
      return this.transform.x;
    },
    set: function (x) {
      this.isDirty = true;
      this.isTransformDirty = true;
      this.transform.x = x;
    }
  });

  Object.defineProperty(frame.prototype, "y", {
    get: function () {
      return this.transform.y;
    },
    set: function (y) {
      this.isDirty = true;
      this.isTransformDirty = true;
      this.transform.y = y;
    }
  });

  return frame;
})();

var DirtyRegion = (function () {
  var SIZE_IN_BITS = 7;
  var SIZE = 1 << SIZE_IN_BITS;
  function Cell(region) {
    this.region = region;
    this.children = [];
  }

  Cell.prototype.clear = function () {
    this.children.length = 0;
  };

  function dirtyRegion(w, h) {
    this.w = w;
    this.h = h;
    this.c = ceil(w / SIZE);
    this.r = ceil(h / SIZE);
    this.grid = [];
    for (var i = 0; i < this.c; i++) {
      for (var j = 0; j < this.r; j++) {
        this.grid.push(new Cell(new Rectangle(i * SIZE, j * SIZE, SIZE, SIZE)));
      }
    }
  }

  dirtyRegion.prototype.clear = function () {
    for (var i = 0; i < this.grid.length; i++) {
      this.grid[i].clear();
    }
  };

  var tmpRectangle = Rectangle.createEmpty();

  dirtyRegion.prototype.addDirtyRectangle = function (rectangle) {
    var x = rectangle.x >> SIZE_IN_BITS;
    var y = rectangle.y >> SIZE_IN_BITS;
    if (x < 0 || x >= this.c || y < 0 || y >= this.r) {
      return;
    }
    var cell = this.grid[x * this.c + y];
    rectangle = rectangle.clone();
    rectangle.snap();
    if (cell.region.contains(rectangle)) {
      for (var i = 0; i < cell.children.length; i++) {
        var region = cell.children[i];
        if (region.contains(rectangle)) {
          return;
        }
        if (rectangle.contains(region)) {
          Rectangle.set(region, rectangle);
          return;
        }
      }
      for (var i = 0; i < cell.children.length; i++) {
        var child = cell.children[i];
        Rectangle.set(tmpRectangle, child);
        tmpRectangle.union(rectangle);
        if (child.intersects(rectangle)) {
          Rectangle.set(child, tmpRectangle);
          return;
        }
        if (tmpRectangle.area() < 6 * (child.area() + rectangle.area())) {
          // this.addDirtyRectangle(tmpRectangle);
          Rectangle.set(child, tmpRectangle);
          return;
        }
      }
      cell.children.push(rectangle);
    } else {
      var w = Math.min(this.c, ceil((rectangle.x + rectangle.w) / SIZE)) - x;
      var h = Math.min(this.r, ceil((rectangle.y + rectangle.h) / SIZE)) - y;
      for (var i = 0; i < w; i++) {
        for (var j = 0; j < h; j++) {
          var cell = this.grid[(x + i) * this.c + (y + j)];
          var intersection = cell.region.clone();
          intersection.intersect(rectangle);
          if (!intersection.isEmpty()) {
            this.addDirtyRectangle(intersection);
            // cell.children.push(intersection);
          }
        }
      }
    }
  };

  dirtyRegion.prototype.addDirtyRectangle4 = function (rectangle) {
    var x = clamp(rectangle.x / this.cw | 0, 0, SIZE - 1);
    var y = clamp(rectangle.y / this.ch | 0, 0, SIZE - 1);

    var x1 = clamp(1 + (rectangle.x + rectangle.w) / this.cw | 0, 0, SIZE - 1);
    var y1 = clamp(1 + (rectangle.y + rectangle.h) / this.ch | 0, 0, SIZE- 1);

    var clone = null;
    var item = Rectangle.createEmpty();
    for (var i = x; i <= x1; i++) {
      for (var j = y; j <= y1; j++) {
        var cell = this.grid[i][j];
        var isContained = false;
        var isMerged = false;
        for (var k = 0; k < cell.length; k++) {
          Rectangle.set(item, cell[k]);
          if (item.contains(rectangle)) {
            isContained = true;
            break;
          }
          item.union(rectangle);
          if (item.area() < 10 * (cell[k].area() + rectangle.area())) {
            isMerged = true;
            cell[k].union(rectangle);
            break;
          }
        }
        if (isMerged) {
          continue;
        }
        if (!isContained) {
          clone = clone || rectangle.clone();
          cell.push(clone);
        }
      }
    }
  };

  dirtyRegion.prototype.addDirtyRectangle4 = function (rectangle) {
    var x = clamp(rectangle.x / this.cw | 0, 0, COLUMNS - 1);
    var y = clamp(rectangle.y / this.ch | 0, 0, ROWS - 1);

    var x1 = clamp(1 + (rectangle.x + rectangle.w) / this.cw | 0, 0, COLUMNS - 1);
    var y1 = clamp(1 + (rectangle.y + rectangle.h) / this.ch | 0, 0, ROWS - 1);

    var clone = null;
    var item = Rectangle.createEmpty();
    for (var i = x; i <= x1; i++) {
      for (var j = y; j <= y1; j++) {
        var cell = this.grid[i][j];
        var isContained = false;
        var isMerged = false;
        for (var k = 0; k < cell.length; k++) {
          Rectangle.set(item, cell[k]);
          if (item.contains(rectangle)) {
            isContained = true;
            break;
          }
          item.union(rectangle);
          if (item.area() < 10 * (cell[k].area() + rectangle.area())) {
            isMerged = true;
            cell[k].union(rectangle);
            break;
          }
        }
        if (isMerged) {
          continue;
        }
        if (!isContained) {
          clone = clone || rectangle.clone();
          cell.push(clone);
        }
      }
    }
  };

  dirtyRegion.prototype.render = function (context) {

    context.strokeStyle = "white";
    for (var i = 0; i < this.c; i++) {
      for (var j = 0; j < this.r; j++) {
        var cell = this.grid[i * this.c + j];
//        context.beginPath();
//        drawRectangle(context, cell.region);
//        context.closePath();
//        context.stroke();
//        context.fillText(cell.children.length, cell.region.x + 3, cell.region.y + 12);
      }
    }

    context.strokeStyle = "black";
    for (var i = 0; i < this.c; i++) {
      for (var j = 0; j < this.r; j++) {
        var cell = this.grid[i * this.c + j];
        var children = cell.children;
        for (var k = 0; k < children.length; k++) {
          var rectangle = children[k];
          context.beginPath();
          drawRectangle(context, rectangle);
          context.closePath();
          context.stroke();
        }
      }
    }


//    for (var i = 0; i < COLUMNS; i++) {
//      for (var j = 0; j < ROWS; j++) {
////    for (var i = 0; i < 3; i++) {
////      for (var j = 0; j < 3; j++) {
//        var cell = this.grid[i][j];
//        for (var k = 0; k < cell.length; k++) {
//          var rectangle = cell[k];
//          context.beginPath();
//          context.rect(rectangle.x, rectangle.y, rectangle.w, rectangle.h);
//          context.closePath();
//          context.stroke();
//        }
//      }
//    }
  };

  dirtyRegion.prototype.addDirtyRectangle2 = function (rectangle) {
    var tmp = Rectangle.createEmpty();
    for (var i = 0; i < this.rectangles.length; i++) {
      var dirty = this.rectangles[i];
      Rectangle.set(tmp, dirty);
      tmp.union(rectangle);
      if ((tmp.area() / (dirty.area() + rectangle.area())) < 100) {
        Rectangle.set(dirty, tmp);
        return;
      }
    }

    for (var i = 0; i < this.rectangles.length; i++) {
      if (this.rectangles[i].contains(rectangle)) {
        return;
      }
    }

    this.rectangles.push(rectangle.clone());
  };
  return dirtyRegion;
})();

var Scene = (function () {
  function scene(w, h) {
    this.w = w;
    this.h = h;
    this.animators = [];
    this.dirtyRegion = new DirtyRegion(w, h);
  }
  scene.prototype.render = function (context) {
    context.lineWidth = 1;
    this.root.render(context, true);

    var dirtyRegion = this.dirtyRegion;
    dirtyRegion.clear();

    var rectangle = Rectangle.createEmpty();

    fps.enter("DIRTY");
    var s = performance.now();
    for (var i = 0; i < 1; i++) {
      dirtyRegion.clear();
      this.root.visit(function (frame, transform) {
        if (frame.isDirty) {
          rectangle.set(0, 0, frame.w, frame.h);
          transform.transformRectangleAABB(rectangle);
          dirtyRegion.addDirtyRectangle(rectangle);
        }
      }, this.root.transform);
    }
    console.info("TODO: " + (performance.now() - s).toFixed(3));
    fps.leave("DIRTY");

    dirtyRegion.render(context);

    this.root.visit(function (frame) {
      frame.isDirty = false;
    });
  };
  scene.prototype.select = function (x, y) {
    return this.root.select(x, y);
  };
  function getLetter(i) {
    if (i < 26) {
      return String.fromCharCode(65 + i);
    }
    return i;
  }
  scene.create = function (w, h) {
    var s = new Scene(w, h);
    s.root = new Frame("");
    s.root.w = w;
    s.root.h = h;
    var count = 64;
    var frames = [s.root];

    for (var i = 0; i < 0; i++) {
      var child = Frame.createNestedList(128, 2, 2, 2);
      var parent = frames[0];
      child.translate (
        Math.random() * (parent.w - child.w),
        Math.random() * (parent.h - child.h)
      );
      parent.addChild(child);
      frames.push(child);
      s.animators.push(new Storm(s.root, 10));
    }

    var parent = frames[0];
//    var child = Frame.createGrid(32, 32, 8, 8, 8);
//    child.translate(100, 100);
//    parent.addChild(child);
    s.animators.push(new Storm(s.root, 500, Math.random() / 2));
    s.animators.push(new Cross(s.root));

    return s;
  };
  return scene;
})();

var Flake = (function () {
  function flake(radius, density) {
    Frame.call(this);
    this.radius = radius;
    this.density = density;
    this.w = this.h = 2 + Math.random() * 10;
//    this.w = Math.random() * 100;
//    this.h = Math.random() * 100;
  }
  flake.prototype = Object.create(Frame.prototype);
  return flake;
})();

var Cross = (function () {
  function storm(parent) {
    this.parent = parent;
    this.angle = 0;

    this.v = new Frame();
    this.v.w = 10;
    this.v.h = 200;
    this.v.translate(100, 0);

    this.h = new Frame();
    this.h.w = 200;
    this.h.h = 10;
    this.h.translate(0, 100);

    this.v.translate(322, 375);
    this.h.translate(322, 375);

//    this.r = new Frame();
//    this.r.w = 200;
//    this.r.h = 200;
//    this.r.translate(100, 100);
    this.parent.addChild(this.v);
    this.parent.addChild(this.h);
  }

  storm.prototype.step = function () {
    this.angle += 0.0001;
    this.v.rotate(0.002);
    this.h.rotate(0.002);
  };

  return storm;
})();

var Storm = (function () {
  function storm(parent, count, speed) {
    this.parent = parent;
    this.speed = speed;
    this.angle = 0;
    this.flakes = [];
    for(var i = 0; i < count; i++) {
      var flake = new Flake(Math.random() * 4 + 1, Math.random() * count);
      flake.translate(Math.random() * this.parent.w, Math.random() * this.parent.h);
      this.flakes.push(flake);
      this.parent.addChild(flake);
    }
  }

  storm.prototype.step = function (time) {
    this.angle += 0.01;
    for(var i = 0; i < this.flakes.length; i++) {
      var flake = this.flakes[i];
      flake.y += this.speed * (Math.cos(this.angle + flake.density) + 1 + flake.radius / 2);
      flake.x += this.speed * (Math.sin(this.angle) * 2);
      if (flake.x > this.parent.w + 5 || flake.x < -5 || flake.y > this.parent.h) {
        if (i % 3 > 0){
          flake.x = Math.random() * this.parent.w;
          flake.y = -10;
        } else {
          if (Math.sin(this.angle) > 0) {
            flake.x = -5;
          } else {
            flake.x = this.parent.w + 5;
          }
          flake.y = Math.random() * this.parent.h;
        }
      }
    }
  };

  return storm;
})();