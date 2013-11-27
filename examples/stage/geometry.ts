/// <reference path='all.ts'/>
module Shumway.Geometry {

  export class Point {
    x: number;
    y: number;
    constructor (x: number, y: number) {
      this.x = x;
      this.y = y;
    }
    setElements (x: number, y: number) {
      this.x = x;
      this.y = y;
    }
    set (other: Point) {
      this.x = other.x;
      this.y = other.y;
    }
    toString () {
      return "{ x: " + this.x + ", y: " + this.y + "}";
    }
    static createEmpty(): Point {
      return new Point(0, 0);
    }
  }

  export class Rectangle {
    x: number;
    y: number;
    w: number;
    h: number;
    constructor (x: number, y: number, w: number, h: number) {
      this.setElements(x, y, w, h);
    }
    setElements (x: number, y: number, w: number, h: number) {
      this.x = x;
      this.y = y;
      this.w = w;
      this.h = h;
    }
    set (other: Rectangle) {
      this.x = other.x;
      this.y = other.y;
      this.w = other.w;
      this.h = other.h;
    }
    contains (other: Rectangle): boolean {
      var r1 = other.x + other.w;
      var b1 = other.y + other.h;
      var r2 = this.x + this.w;
      var b2 = this.y + this.h;
      return (other.x >= this.x) &&
        (other.x < r2) &&
        (other.y >= this.y) &&
        (other.y < b2) &&
        (r1 > this.x) &&
        (r1 <= r2) &&
        (b1 > this.y) &&
        (b1 <= b2);
    }
    union (other: Rectangle) {
      var x = this.x, y = this.y;
      if (this.x > other.x) {
        x = other.x;
      }
      if (this.y > other.y) {
        y = other.y;
      }
      var x0 = this.x + this.w;
      if (x0 < other.x + other.w) {
        x0 = other.x + other.w;
      }
      var y0 = this.y + this.h;
      if (y0 < other.y + other.h) {
        y0 = other.y + other.h;
      }
      this.x = x;
      this.y = y;
      this.w = x0 - x;
      this.h = y0 - y;
    }
    isEmpty (): boolean {
      return this.w <= 0 || this.h <= 0;
    }
    setEmpty () {
      this.w = 0;
      this.h = 0;
    }
    intersect (other: Rectangle) {
      var result = Rectangle.createEmpty();
      if (this.isEmpty() || other.isEmpty()) {
        result.setEmpty();
        return result;
      }
      result.x = Math.max(this.x, other.x);
      result.y = Math.max(this.y, other.y);
      result.w = Math.min(this.x + this.w, other.x + other.w) - result.x;
      result.h = Math.min(this.y + this.h, other.y + other.h) - result.y;
      if (result.isEmpty()) {
        result.setEmpty();
      }
      this.set(result);
    }
    intersects (other): boolean {
      if (this.isEmpty() || other.isEmpty()) {
        return false;
      }
      var x = Math.max(this.x, other.x);
      var y = Math.max(this.y, other.y);
      var w = Math.min(this.x + this.w, other.x + other.w) - x;
      var h = Math.min(this.y + this.h, other.y + other.h) - y;
      if (w <= 0 || h <= 0) {
        return false;
      }
      return true;
    }

    area (): number {
      return this.w * this.h;
    }

    clone (): Rectangle {
      return new Rectangle(this.x, this.y, this.w, this.h);
    }

    /**
     * Snaps the rectangle to pixel boundaries. The computed rectangle covers
     * the original rectangle.
     */
    snap () {
      var x1 = Math.ceil(this.x + this.w);
      var y1 = Math.ceil(this.y + this.h);
      this.x |= 0;
      this.y |= 0;
      this.w = x1 - this.x;
      this.h = y1 - this.y;
    }

    toString(): string {
      return "{" +
        this.x + ", " +
        this.y + ", " +
        this.w + ", " +
        this.h +
      "}";
    }
    static createEmpty(): Rectangle {
      return new Rectangle(0, 0, 0, 0);
    }
  }

  export class Matrix {
    a: number;
    b: number;
    c: number;
    d: number;
    tx: number;
    ty: number;
    constructor (a: number, b: number, c: number, d: number, tx: number, ty: number) {
      this.setElements(a, b, c, d, tx, ty);
    }
    setElements (a: number, b: number, c: number, d: number, tx: number, ty: number) {
      this.a = a;
      this.b = b;
      this.c = c;
      this.d = d;
      this.tx = tx;
      this.ty = ty;
    }
    set (other: Matrix) {
      this.a = other.a;
      this.b = other.b;
      this.c = other.c;
      this.d = other.d;
      this.tx = other.tx;
      this.ty = other.ty;
    }
    clone (): Matrix {
      return new Matrix(this.a, this.b, this.c, this.d, this.tx, this.ty);
    }
    transform (a: number, b: number, c: number, d: number, tx: number, ty: number) {
      var _a = this.a, _b = this.b, _c = this.c, _d = this.d, _tx = this.tx, _ty = this.ty;
      this.a =  _a * a + _c * b;
      this.b =  _b * a + _d * b;
      this.c =  _a * c + _c * d;
      this.d =  _b * c + _d * d;
      this.tx = _a * tx + _c * ty + _tx;
      this.ty = _b * tx + _d * ty + _ty;
    }
    transformRectangleAABB (rectangle: Rectangle) {
      var a = this.a;
      var b = this.b;
      var c = this.c;
      var d = this.d;
      var tx = this.tx;
      var ty = this.ty;

      var x = rectangle.x;
      var y = rectangle.y;
      var w = rectangle.w;
      var h = rectangle.h;

      var x0 = a + c * y + tx;
      var y0 = b * x + d * y + ty;
      var x1 = a * (x + w) + c * y + tx;
      var y1 = b * (x + w) + d * y + ty;
      var x2 = a * (x + w) + c * (y + h) + tx;
      var y2 = b * (x + w) + d * (y + h) + ty;
      var x3 = a * x + c * (y + h) + tx;
      var y3 = b * x + d * (y + h) + ty;

      var tmp = 0;

      // Manual Min/Max is a lot faster than calling Math.min/max
      // X Min-Max
      if (x0 > x1) { tmp = x0; x0 = x1; x1 = tmp; }
      if (x2 > x3) { tmp = x2; x2 = x3; x3 = tmp; }

      rectangle.x = x0 < x2 ? x0 : x2;
      rectangle.w = (x1 > x3 ? x1 : x3) - rectangle.x;

      // Y Min-Max
      if (y0 > y1) { tmp = y0; y0 = y1; y1 = tmp; }
      if (y2 > y3) { tmp = y2; y2 = y3; y3 = tmp; }

      rectangle.y = y0 < y2 ? y0 : y2;
      rectangle.h = (y1 > y3 ? y1 : y3) - rectangle.y;
    }
    scale (x: number, y: number) {
      this.a *= x;
      this.b *= y;
      this.c *= x;
      this.d *= y;
      this.tx *= x;
      this.ty *= y;
    }
    rotate (angle: number) {
      var a = this.a, b = this.b, c = this.c, d = this.d, tx = this.tx, ty = this.ty;
      var u = Math.cos(angle);
      var v = Math.sin(angle);
      this.a =   a *  u +  c * v;
      this.b =   b *  u +  d * v;
      this.c =   a * -v +  c * u;
      this.d =   b * -v +  d * u;
      this.tx = tx *  u - ty * v;
      this.ty = tx *  v + ty * u;
    }
    concat (other: Matrix) {
      var a = this.a * other.a;
      var b = 0.0;
      var c = 0.0;
      var d = this.d * other.d;
      var tx = this.tx * other.a + other.tx;
      var ty = this.ty * other.d + other.ty;

      if (this.b !== 0.0 || this.c !== 0.0 || other.b !== 0.0 || other.c !== 0.0) {
        a  += this.b * other.c;
        d  += this.c * other.b;
        b  += this.a * other.b + this.b * other.d;
        c  += this.c * other.a + this.d * other.c;
        tx += this.ty * other.c;
        ty += this.tx * other.b;
      }

      this.a  = a;
      this.b  = b;
      this.c  = c;
      this.d  = d;
      this.tx = tx;
      this.ty = ty;
    }
    translate (x: number, y: number) {
      this.tx += x;
      this.ty += y;
    }
    setIdentity () {
      this.a = 1;
      this.b = 0;
      this.c = 0;
      this.d = 1;
      this.tx = 0;
      this.ty = 0;
    }
    transformPoint (point: Point) {
      var x = point.x;
      var y = point.y;
      point.x = this.a * x + this.c * y + this.tx;
      point.y = this.b * x + this.d * y + this.ty;
    }
    deltaTransformPoint (point: Point) {
      var x = point.x;
      var y = point.y;
      point.x = this.a * x + this.c * y;
      point.y = this.b * x + this.d * y;
    }
    inverse (result: Matrix) {
      var m11 = this.a;
      var m12 = this.b;
      var m21 = this.c;
      var m22 = this.d;
      var dx  = this.tx;
      var dy  = this.ty;
      if (m12 === 0.0 && m21 === 0.0) {
        m11 = 1.0 / m11;
        m22 = 1.0 / m22;
        m12 = m21 = 0.0;
        dx = -m11 * dx;
        dy = -m22 * dy;
      } else {
        var a = m11, b = m12, c = m21, d = m22;
        var determinant = a * d - b * c;
        if (determinant === 0.0) {
          return;
        }
        determinant = 1.0 / determinant;
        m11 =  d * determinant;
        m12 = -b * determinant;
        m21 = -c * determinant;
        m22 =  a * determinant;
        var ty = -(m12 * dx + m22 * dy);
        dx = -(m11 * dx + m21 * dy);
        dy = ty;
      }
      result.a = m11;
      result.b = m12;
      result.c = m21;
      result.d = m22;
      result.tx = dx;
      result.ty = dy;
    }

    toString (): string {
      return "{" +
        this.a + ", " +
        this.b + ", " +
        this.c + ", " +
        this.d + ", " +
        this.tx + ", " +
        this.ty + "}";
    }

    public toWebGLMatrix(): Float32Array {
      return new Float32Array([
        this.a, this.b, 0, this.c, this.d, 0, this.tx, this.ty, 1
      ]);
    }

    public static createIdentity() {
      return new Matrix(1, 0, 0, 1, 0, 0);
    }

    static multiply = function (dst, src) {
      dst.transform(src.a, src.b, src.c, src.d, src.tx, src.ty);
    };
  }
  export class DirtyRegion implements Shumway.IRenderable {
    private static tmpRectangle = Rectangle.createEmpty();
    private grid: DirtyRegion.Cell [][];

    private w: number;
    private h: number;
    private c: number;
    private r: number;
    private size: number;
    private sizeInBits: number;

    constructor (w, h, sizeInBits = 7) {
      var size = this.size = 1 << sizeInBits;
      this.sizeInBits = sizeInBits;
      this.w = w;
      this.h = h;
      this.c = Math.ceil(w / size);
      this.r = Math.ceil(h / size);
      this.grid = [];
      for (var y = 0; y < this.r; y++) {
        this.grid.push([]);
        for (var x = 0; x < this.c; x++) {
          this.grid[y][x] = new DirtyRegion.Cell(new Rectangle(x * size, y * size, size, size));
        }
      }
    }

    clear () {
      for (var y = 0; y < this.r; y++) {
        for (var x = 0; x < this.c; x++) {
          this.grid[y][x].clear();
        }
      }
    }

    addDirtyRectangle (rectangle: Rectangle) {
      var x = rectangle.x >> this.sizeInBits;
      var y = rectangle.y >> this.sizeInBits;
      if (x >= this.c || y >= this.r) {
        return;
      }
      if (x < 0) {
        x = 0;
      }
      if (y < 0) {
        y = 0;
      }
      var cell = this.grid[y][x];
      rectangle = rectangle.clone();
      rectangle.snap();

      if (cell.region.contains(rectangle)) {
        if (cell.bounds.isEmpty()) {
          cell.bounds.set(rectangle)
        } else if (!cell.bounds.contains(rectangle)) {
          cell.bounds.union(rectangle);
        }
      } else {
        var w = Math.min(this.c, Math.ceil((rectangle.x + rectangle.w) / this.size)) - x;
        var h = Math.min(this.r, Math.ceil((rectangle.y + rectangle.h) / this.size)) - y;
        for (var i = 0; i < w; i++) {
          for (var j = 0; j < h; j++) {
            var cell = this.grid[y + j][x + i];
            var intersection = cell.region.clone();
            intersection.intersect(rectangle);
            if (!intersection.isEmpty()) {
              this.addDirtyRectangle(intersection);
            }
          }
        }
      }
    }

    gatherRegions (regions: Rectangle[]) {
      for (var y = 0; y < this.r; y++) {
        for (var x = 0; x < this.c; x++) {
          var bounds = this.grid[y][x].bounds;
          if (!bounds.isEmpty()) {
            regions.push(this.grid[y][x].bounds);
          }
        }
      }
    }

    gatherOptimizedRegions (regions: Rectangle[]) {
      this.gatherRegions(regions);
    }

    getDirtyRatio (): number {
      var totalArea = this.w * this.h;
      if (totalArea === 0) {
        return 0;
      }
      var dirtyArea = 0;
      for (var y = 0; y < this.r; y++) {
        for (var x = 0; x < this.c; x++) {
          dirtyArea += this.grid[y][x].region.area();
        }
      }
      return dirtyArea / totalArea;
    }

    render (context: CanvasRenderingContext2D, options?: any) {
      function drawRectangle(rectangle: Rectangle) {
        context.rect(rectangle.x, rectangle.y, rectangle.w, rectangle.h);
      }

      if (options && options.drawGrid) {
        context.strokeStyle = "white";
        for (var y = 0; y < this.r; y++) {
          for (var x = 0; x < this.c; x++) {
            var cell = this.grid[y][x];
            context.beginPath();
            drawRectangle(cell.region);
            context.closePath();
            context.stroke();
          }
        }
      }

      context.strokeStyle = "#E0F8D8";
      for (var y = 0; y < this.r; y++) {
        for (var x = 0; x < this.c; x++) {
          var cell = this.grid[y][x];
          context.beginPath();
          drawRectangle(cell.bounds);
          context.closePath();
          context.stroke();
        }
      }

//      context.strokeStyle = "#5856d6";
//      var regions = [];
//      this.gatherOptimizedRegions(regions);
//      for (var i = 0; i < regions.length; i++) {
//        context.beginPath();
//        drawRectangle(regions[i]);
//        context.closePath();
//        context.stroke();
//      }
    }
  }

  module DirtyRegion {
    export class Cell {
      region: Rectangle;
      bounds: Rectangle;
      constructor(region: Rectangle) {
        this.region = region;
        this.bounds = Rectangle.createEmpty();
      }
      clear () {
        this.bounds.setEmpty();
      }
    }
  }

  export module Path {
    var CURVE_RECURSION_LIMIT = 32;
    var CURVE_COLLINEARITY_EPSILON = 1e-30;
    var CURVE_DISTANCE_EPSILON = 1e-30;
    var CURVE_ANGLE_TOLERANCE_EPSILON = 0.01;
    var ANGLE_TOLERANCE = 0;
    var DISTANCE_TOLERANCE_SQUARE = 0.5 * 0.5;

    /**
     * De Casteljau Algorithm for Quadratic Curve Subdivision (Anti-Grain Geometry Implementation)
     */
    export function createQuadraticCurveVertices(vertices, index, x0, y0, x1, y1, x2, y2, level) {
      if (level > CURVE_RECURSION_LIMIT) {
        return 0;
      }
      // Find Mid-Points
      var x01 = (x0 + x1) / 2;
      var y01 = (y0 + y1) / 2;
      var x12 = (x1 + x2) / 2;
      var y12 = (y1 + y2) / 2;
      var x012 = (x01 + x12) / 2;
      var y012 = (y01 + y12) / 2;

      var dx = x2 - x0;
      var dy = y2 - y0;
      var d = Math.abs((x1 - x2) * dy - (y1 - y2) * dx);

      if (d > CURVE_COLLINEARITY_EPSILON) {
        // Regular Case
        if (d * d <= DISTANCE_TOLERANCE_SQUARE * (dx * dx + dy * dy)) {
          if (ANGLE_TOLERANCE < CURVE_ANGLE_TOLERANCE_EPSILON) {
            vertices[index + 0] = x012;
            vertices[index + 1] = y012;
            return index + 2;
          }
          // Angle & Cusp Condition
          var da = Math.abs(Math.atan2(y2 - y1, x2 - x1) - Math.atan2(y1 - y0, x1 - x0));
          if (da >= Math.PI) {
            da = 2 * Math.PI - da;
          }
          if (da < ANGLE_TOLERANCE) {
            vertices[index + 0] = x012;
            vertices[index + 1] = y012;
            return index + 2;
          }
        }
      } else {
        notImplemented("Collinear Case");
      }
      // Recursively Subdivide Curve
      index = createQuadraticCurveVertices(vertices, index, x0, y0, x01, y01, x012, y012, level + 1);
      index = createQuadraticCurveVertices(vertices, index, x012, y012, x12, y12, x2, y2, level + 1);
      return index;
    }

    var Path = (function () {
      var MOVE_TO             = 0x01;
      var LINE_TO             = 0x02;
      var QUADRATIC_CURVE_TO  = 0x03;
      var ARC_TO              = 0x04;
      var RECT                = 0x05;
      var ARC                 = 0x06;
      var ELLIPSE             = 0x07;
      function path() {
        this._buffer = new Shumway.Util.BufferWriter(1024);
        this._x = 0;
        this._y = 0;
      }
      path.prototype.hash = function () {
        return this._buffer.hashWords(0, 0, this._buffer.offset >> 2);
      };
      path.prototype.clone = function () {
        var path = new Path();
        this.visit(path);
        return path;
      };
      path.prototype.reset = function () {
        this._x = 0;
        this._y = 0;
        this._buffer.reset();
      };
      path.prototype._bufferCommand = function (command, a, b, c, d, e, f, g, h) {
        var buffer = this._buffer;
        var offset = this._buffer.offset;
        var bytesToWrite = arguments.length * 4;
        buffer.ensureCapacity(offset + bytesToWrite);
        buffer.writeIntUnsafe(command);
        switch (command) {
          case MOVE_TO:
          case LINE_TO:
            buffer.writeVertexUnsafe(a, b);
            break;
          case RECT:
            buffer.writeVertexUnsafe(a, b);
            buffer.writeFloatUnsafe(c);
            buffer.writeFloatUnsafe(d);
            break;
          case QUADRATIC_CURVE_TO:
            buffer.writeVertexUnsafe(a, b);
            buffer.writeVertexUnsafe(c, d);
            break;
          default:
            notImplemented(command);
        }
      };
      path.prototype.closePath = function () {
        notImplemented("closePath");
      };
      path.prototype.moveTo = function (x, y) {
        this._bufferCommand(MOVE_TO, x, y);
        this._x = x;
        this._y = y;
      };
      path.prototype.lineTo = function (x, y) {
        this._bufferCommand(LINE_TO, x, y);
        this._x = x;
        this._y = y;
      };
      path.prototype.quadraticCurveTo = function (cpx, cpy, x, y) {
        this._bufferCommand(QUADRATIC_CURVE_TO, cpx, cpy, x, y);
        this._x = x;
        this._y = y;
      };
      path.prototype.bezierCurveTo = function (cp1x, cp1y, cp2x, cp2y, x, y) {
        notImplemented("bezierCurveTo");
      };
      path.prototype.arcTo = function (x1, y1, x2, y2, radius) {
        notImplemented("arcTo");
      };
      path.prototype.rect = function (x, y, w, h) {
        this._bufferCommand(RECT, x, y, w, h);
      };
      path.prototype.arc = function (x, y, radius, startAngle, endAngle, anticlockwise) {
        notImplemented("arc");
      };
      path.prototype.ellipse = function (x, y, radiusX, radiusY,  rotation, startAngle, endAngle, anticlockwise) {
        notImplemented("ellipse");
      };
      path.prototype.trace = function (writer) {
        this.visit({
          moveTo: function (x, y) {
            writer.writeLn("MOVE_TO: x: " + x + ", y: " + y);
          },
          lineTo: function (x, y) {
            writer.writeLn("LINE_TO: x: " + x + ", y: " + y);
          },
          rect: function (x, y, w, h) {
            writer.writeLn("RECT: x: " + x + ", y: " + y + ", w: " + w + ", h: " + h);
          },
          quadraticCurveTo: function (cpx, cpy, x, y) {
            writer.writeLn("QUADRATIC_CURVE_TO: cpx: " + cpx + ", cpy: " + cpy + ", x: " + x + ", y: " + y);
          }
        });
      };
      path.prototype.visit = function (visitor) {
        var i32 = this._buffer.i32;
        var f32 = this._buffer.f32;
        var i = 0;
        var j = this._buffer.offset >> 2;
        while (i < j) {
          switch (i32[i++]) {
            case MOVE_TO:
              visitor.moveTo(f32[i++], f32[i++]);
              break;
            case LINE_TO:
              visitor.lineTo(f32[i++], f32[i++]);
              break;
            case RECT:
              visitor.rect(f32[i++], f32[i++], f32[i++], f32[i++]);
              break;
            case QUADRATIC_CURVE_TO:
              visitor.quadraticCurveTo(f32[i++], f32[i++], f32[i++], f32[i++]);
              break;
            default:
              notImplemented("");
              break;
          }
        }
      };
      return path;
    })();

    /**
     * A path made up of only MOVE_TO, LINE_TO commands.
     */
    var SimplePath = (function () {
      // TODO: Hope this is large enough.
      var tmp = new Float32Array(1024);
      function simplePath() {
        Path.call(this);
      }
      simplePath.prototype = Object.create(Path.prototype);
      simplePath.prototype.quadraticCurveTo = function (cpx, cpy, x, y) {
        var index = createQuadraticCurveVertices(tmp, 0, this._x, this._y, cpx, cpy, x, y, 0);
        for (var i = 0; i < index; i += 2) {
          this.lineTo(tmp[i], tmp[i + 1]);
        }
        this.lineTo(x, y);
      };
      return simplePath;
    })();
  }
}