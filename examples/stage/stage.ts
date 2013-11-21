/// <reference path='all.ts'/>
module Shumway.Layers {
  import Rectangle = Shumway.Geometry.Rectangle;
  import Matrix = Shumway.Geometry.Matrix;
  import DirtyRegion = Shumway.Geometry.DirtyRegion;

  export class Frame implements Shumway.IRenderable {
    get x() : number {
      return this.transform.tx;
    }
    set x(value : number) {
      this.transform.tx = value;
      this.invalidate();
    }
    get y() : number {
      return this.transform.ty;
    }
    set y(value : number) {
      this.transform.ty = value;
      this.invalidate();
    }
    get scaleX() : number {
      return this.transform.a;
    }
    set scaleX(value : number) {
      this.transform.a = value;
      this.invalidate();
    }
    get scaleY() : number {
      return this.transform.d;
    }
    set scaleY(value : number) {
      this.transform.d = value;
      this.invalidate();
    }
    set rotation(value : number) {
      value %= 360;
      if (value > 180) {
        value -= 360;
      }
      var angle = value / 180 * Math.PI;
      var u = Math.cos(angle);
      var v = Math.sin(angle);
      var m = new Matrix (
        u * this.scaleX,
        v * this.scaleX,
       -v * this.scaleY,
        u * this.scaleY,
        this.x,
        this.y
      );
      this.transform = m;
      this.invalidate();
    }
    public w : number;
    public h : number;
    public transform : Matrix;
    public children : Frame [];
    public parent : Frame;
    private _fillStyle : string = randomStyle();
    public isInvalid : boolean;
    constructor () {
      this.parent = null;
      this.children = [];
      this.transform = Matrix.createIdentity();
    }
    get stage() : Stage {
      var frame = this;
      while (frame.parent) {
        frame = frame.parent;
      }
      if (frame instanceof Stage) {
        return <Stage>frame;
      }
      return null;
    }
    private invalidate() {
      this.isInvalid = true;
    }
    public addChild(child : Frame) {
      child.parent = this;
      this.children.push(child);
    }
    public render(context : CanvasRenderingContext2D) {
      context.save();
      var t = this.transform;
      context.transform(t.a, t.b, t.c, t.d, t.tx, t.ty);
      if (this.children.length === 0) {
        context.beginPath();
        context.rect(0, 0, this.w, this.h);
        context.closePath();
        context.fillStyle = this._fillStyle;
        context.fill();
      }
      context.save();
      for (var i = 0; i < this.children.length; i++) {
        this.children[i].render(context);
      }
      context.restore();
      context.restore();
    }

    public visit (visitor : (Frame, Matrix?) => void, transform : Matrix) {
      var stack : Frame [];
      var frame : Frame;
      if (transform) {
        stack = [this];
        var transforms : Matrix [];
        transforms = [transform];
        while (stack.length > 0) {
          frame = stack.pop();
          transform = transforms.pop();
          for (var i = frame.children.length - 1; i >= 0; i--) {
            stack.push(frame.children[i]);
            var t = transform.clone();
            Matrix.multiply(t, frame.children[i].transform);
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
    }
  }

  export class Stage extends Frame implements Shumway.IRenderable {
    public dirtyRegion : DirtyRegion;
    constructor(w : number, h : number) {
      super()
      this.w = w;
      this.h = h;
      this.dirtyRegion = new DirtyRegion(w, h);
    }
    public render(context : CanvasRenderingContext2D) {
      var that = this;
      this.visit(function (frame : Frame, transform? : Matrix) {
        if (frame.isInvalid) {
          var tmp = new Rectangle(0, 0, frame.w, frame.h);
          transform.transformRectangleAABB(tmp);
          that.dirtyRegion.addDirtyRectangle(tmp);
          frame.isInvalid = false;
        }
      }, this.transform);
      super.render(context);
    }
  }

  export interface IAnimator {
    onEnterFrame ();
  }
}