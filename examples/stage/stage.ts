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
    public parent : Frame;
    public isInvalid : boolean;
    constructor () {
      this.parent = null;
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
    public getConcatenatedTransform() : Matrix {
      var frame = this;
      var m = this.transform.clone();
      while (frame.parent) {
        frame = frame.parent;
        Matrix.multiply(m, frame.transform);
      }
      return m;
    }
    private invalidate() {
      this.isInvalid = true;
    }
    public render(context : CanvasRenderingContext2D) {
      context.save();
      var t = this.transform;
      context.transform(t.a, t.b, t.c, t.d, t.tx, t.ty);
//      if (this.children.length === 0) {
//        context.beginPath();
//        context.rect(0, 0, this.w, this.h);
//        context.closePath();
//        context.fillStyle = this._fillStyle;
//        context.fill();
//      }

      context.restore();
    }

    public visit (visitor : (Frame, Matrix?) => void, transform : Matrix) {
      var stack : Frame [];
      var frame : Frame;
      var frameContainer : FrameContainer;
      if (transform) {
        stack = [this];
        var transforms : Matrix [];
        transforms = [transform];
        while (stack.length > 0) {
          frame = stack.pop();
          transform = transforms.pop();
          if (frame instanceof FrameContainer) {
            frameContainer = <FrameContainer>frame;
            for (var i = frameContainer.children.length - 1; i >= 0; i--) {
              stack.push(frameContainer.children[i]);
              var t = transform.clone();
              Matrix.multiply(t, frameContainer.children[i].transform);
              transforms.push(t);
            }
          }
          visitor(frame, transform);
        }
      } else {
//        stack = [this];
//        while (stack.length > 0) {
//          frame = stack.pop();
//          for (var i = frame.children.length - 1; i >= 0; i--) {
//            stack.push(frame.children[i]);
//          }
//          visitor(frame);
//        }
      }
    }
  }

  export class FrameContainer extends Frame {
    public children : Frame [];
    constructor() {
      super();
      this.children = [];
    }
    public addChild(child : Frame) {
      child.parent = this;
      this.children.push(child);
    }
    public render(context : CanvasRenderingContext2D) {
      context.save();
      for (var i = 0; i < this.children.length; i++) {
        this.children[i].render(context);
      }
      context.restore();
    }
  }

  export class Stage extends FrameContainer implements Shumway.IRenderable {
    public dirtyRegion : DirtyRegion;
    constructor(w : number, h : number) {
      super()
      this.w = w;
      this.h = h;
      this.dirtyRegion = new DirtyRegion(w, h);
    }

    public render(context : CanvasRenderingContext2D, options? : any) {
      var layers = this.gatherLayers();

      context.strokeStyle = "#E0F8D8";
      this.gatherDirtyRegions();
      super.render(context);

      if (options && options.drawLayers) {
        function drawRectangle(rectangle : Rectangle) {
          context.rect(rectangle.x, rectangle.y, rectangle.w, rectangle.h);
        }
        context.strokeStyle = "#FF4981";
        for (var i = 0; i < layers.length; i++) {
          context.beginPath();
          drawRectangle(layers[i]);
          context.closePath();
          context.stroke();
        }
      }
    }

    gatherDirtyRegions() {
      var that = this;
      // Find all invalid frames.
      this.visit(function (frame : Frame, transform? : Matrix) {
        if (frame.isInvalid) {
          var rectangle = new Rectangle(0, 0, frame.w, frame.h);
          transform.transformRectangleAABB(rectangle);
          that.dirtyRegion.addDirtyRectangle(rectangle);
          frame.isInvalid = false;
        }
      }, this.transform);
    }

    gatherLayers() {
      // Visit
      var layers = [];
      var layer;
      this.visit(function (frame : Frame, transform? : Matrix) {
        var rectangle = new Rectangle(0, 0, frame.w, frame.h);
        transform.transformRectangleAABB(rectangle);
        if (frame.isInvalid) {
          if (layer) {
            layers.push(layer);
          }
          layers.push(rectangle.clone());
          layer = null;
        } else {
          if (!layer) {
            layer = rectangle.clone();
          } else {
            layer.union(rectangle);
          }
        }
      }, this.transform);
      return layers;
    }
  }

  export interface IAnimator {
    onEnterFrame ();
  }
}