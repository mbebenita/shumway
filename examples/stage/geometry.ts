/// <reference path='all.ts'/>
module Shumway.Geometry {
  export class Point {
    x : number;
    y : number;
    constructor (x : number, y : number) {
      this.x = x;
      this.y = y;
    }
    setElements (x : number, y : number) {
      this.x = x;
      this.y = y;
    }
    set (other : Point) {
      this.x = other.x;
      this.y = other.y;
    }
    toString () {
      return "{ x: " + this.x + ", y: " + this.y + "}";
    }
    static createEmpty() : Point {
      return new Point(0, 0);
    }
  }

  export class Rectangle {
    x : number;
    y : number;
    w : number;
    h : number;
    constructor (x : number, y : number, w : number, h : number) {
      this.setElements(x, y, w, h);
    }
    setElements (x : number, y : number, w : number, h : number) {
      this.x = x;
      this.y = y;
      this.w = w;
      this.h = h;
    }
    set (other : Rectangle) {
      this.x = other.x;
      this.y = other.y;
      this.w = other.w;
      this.h = other.h;
    }
    contains (other : Rectangle) : boolean {
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
    union (other : Rectangle) {
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
    isEmpty () : boolean {
      return this.w <= 0 || this.h <= 0;
    }
    setEmpty () {
      this.w = 0;
      this.h = 0;
    }
    intersect (other : Rectangle) {
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
    intersects (other) : boolean {
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

    area () : number {
      return this.w * this.h;
    }

    clone () : Rectangle {
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

    toString() : string {
      return "{" +
        this.x + ", " +
        this.y + ", " +
        this.w + ", " +
        this.h +
      "}";
    }
    static createEmpty() : Rectangle {
      return new Rectangle(0, 0, 0, 0);
    }
  }

  export class Matrix {
    a : number;
    b : number;
    c : number;
    d : number;
    tx : number;
    ty : number;
    constructor (a : number, b : number, c : number, d : number, tx : number, ty : number) {
      this.setElements(a, b, c, d, tx, ty);
    }
    setElements (a : number, b : number, c : number, d : number, tx : number, ty : number) {
      this.a = a;
      this.b = b;
      this.c = c;
      this.d = d;
      this.tx = tx;
      this.ty = ty;
    }
    set (other : Matrix) {
      this.a = other.a;
      this.b = other.b;
      this.c = other.c;
      this.d = other.d;
      this.tx = other.tx;
      this.ty = other.ty;
    }
    clone () : Matrix {
      return new Matrix(this.a, this.b, this.c, this.d, this.tx, this.ty);
    }
    transform (a : number, b : number, c : number, d : number, tx : number, ty : number) {
      var _a = this.a, _b = this.b, _c = this.c, _d = this.d, _tx = this.tx, _ty = this.ty;
      this.a =  _a * a + _c * b;
      this.b =  _b * a + _d * b;
      this.c =  _a * c + _c * d;
      this.d =  _b * c + _d * d;
      this.tx = _a * tx + _c * ty + _tx;
      this.ty = _b * tx + _d * ty + _ty;
    }
    transformRectangleAABB (rectangle : Rectangle) {
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
    scale (x : number, y : number) {
      this.a *= x;
      this.b *= y;
      this.c *= x;
      this.d *= y;
      this.tx *= x;
      this.ty *= y;
    }
    rotate (angle : number) {
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
    concat (other : Matrix) {
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
    translate (x : number, y : number) {
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
    transformPoint (point : Point) {
      var x = point.x;
      var y = point.y;
      point.x = this.a * x + this.c * y + this.tx;
      point.y = this.b * x + this.d * y + this.ty;
    }
    deltaTransformPoint (point : Point) {
      var x = point.x;
      var y = point.y;
      point.x = this.a * x + this.c * y;
      point.y = this.b * x + this.d * y;
    }
    inverse (result : Matrix) {
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

    toString () : string {
      return "{" +
        this.a + ", " +
        this.b + ", " +
        this.c + ", " +
        this.d + ", " +
        this.tx + ", " +
        this.ty + "}";
    }

    static createIdentity () {
      return new Matrix(1, 0, 0, 1, 0, 0);
    }
    static multiply = function (dst, src) {
      dst.transform(src.a, src.b, src.c, src.d, src.tx, src.ty);
    };
  }
  export class DirtyRegion implements Shumway.IRenderable {
    private static SIZE_IN_BITS = 7;
    private static SIZE = 1 << DirtyRegion.SIZE_IN_BITS;
    private static tmpRectangle = Rectangle.createEmpty();
    private grid : DirtyRegion.Cell [];
    w : number;
    h : number;
    c : number;
    r : number;
    constructor (w, h) {
      var size = DirtyRegion.SIZE;
      this.w = w;
      this.h = h;
      this.c = Math.ceil(w / size);
      this.r = Math.ceil(h / size);
      this.grid = [];
      for (var j = 0; j < this.r; j++) {
        for (var i = 0; i < this.c; i++) {
          this.grid.push(new DirtyRegion.Cell(new Rectangle(i * size, j * size, size, size)));
        }
      }
    }
    clear () {
      for (var i = 0; i < this.grid.length; i++) {
        this.grid[i].clear();
      }
    }
    addDirtyRectangle (rectangle : Rectangle) {
      var x = rectangle.x >> DirtyRegion.SIZE_IN_BITS;
      var y = rectangle.y >> DirtyRegion.SIZE_IN_BITS;
      if (x >= this.c || y >= this.r) {
        return;
      }
      if (x < 0) {
        x = 0;
      }
      if (y < 0) {
        y = 0;
      }
      var cell = this.grid[y * this.c + x];
      rectangle = rectangle.clone();
      rectangle.snap();

      if (cell.region.contains(rectangle)) {
        if (cell.bounds.isEmpty()) {
          cell.bounds.set(rectangle)
        } else if (!cell.bounds.contains(rectangle)) {
          cell.bounds.union(rectangle);
        }
      } else {
        var w = Math.min(this.c, Math.ceil((rectangle.x + rectangle.w) / DirtyRegion.SIZE)) - x;
        var h = Math.min(this.r, Math.ceil((rectangle.y + rectangle.h) / DirtyRegion.SIZE)) - y;
        for (var i = 0; i < w; i++) {
          for (var j = 0; j < h; j++) {
            var cell = this.grid[(y + j) * this.c + (x + i)];
            var intersection = cell.region.clone();
            intersection.intersect(rectangle);
            if (!intersection.isEmpty()) {
              this.addDirtyRectangle(intersection);
            }
          }
        }
      }
    }
    getDirtyRatio () : number {
      var totalArea = this.w * this.h;
      if (totalArea === 0) {
        return 0;
      }
      var dirtyArea = 0;
      for (var i = 0; i < this.grid.length; i++) {
        dirtyArea += this.grid[i].bounds.area();
      }
      return dirtyArea / totalArea;
    }
    render (context : CanvasRenderingContext2D, options? : any) {
      function drawRectangle(rectangle : Rectangle) {
        context.rect(rectangle.x, rectangle.y, rectangle.w, rectangle.h);
      }

      if (options && options.drawGrid) {
        context.strokeStyle = "white";
        for (var i = 0; i < this.c; i++) {
          for (var j = 0; j < this.r; j++) {
            var cell = this.grid[j * this.c + i];
            context.beginPath();
            drawRectangle(cell.region);
            context.closePath();
            context.stroke();
          }
        }
      }

      context.strokeStyle = "#E0F8D8";
      for (var i = 0; i < this.c; i++) {
        for (var j = 0; j < this.r; j++) {
          var cell = this.grid[j * this.c + i];
          context.beginPath();
          drawRectangle(cell.bounds);
          context.closePath();
          context.stroke();
        }
      }
    }
  }

  module DirtyRegion {
    export class Cell {
      region : Rectangle;
      bounds : Rectangle;
      constructor(region : Rectangle) {
        this.region = region;
        this.bounds = Rectangle.createEmpty();
      }
      clear () {
        this.bounds.setEmpty();
      }
    }
  }

}