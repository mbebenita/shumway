/// <reference path='all.ts'/>
module Shumway.Layers {
  import Rectangle = Shumway.Geometry.Rectangle;
  import Point = Shumway.Geometry.Point;
  import Matrix = Shumway.Geometry.Matrix;
  import DirtyRegion = Shumway.Geometry.DirtyRegion;
  import Filter = Shumway.Layers.Filter;

  export interface ISource {
    properties: {[name: string]: any}
    getBounds (): Rectangle;
    render (context: CanvasRenderingContext2D);
  }

  export class Frame implements Shumway.IRenderable {
    private _x: number;
    private _y: number;
    private _alpha: number;
    private _scaleX: number;
    private _scaleY: number;
    private _rotation: number;
    private _transform: Matrix;
    private _isTransformInvalid: boolean = true;
    public properties: {[name: string]: any} = {};

    get x(): number {
      return this._x;
    }

    set x(value: number) {
      this._x = value;
      this.invalidateTransform();
    }

    get y(): number {
      return this._y;
    }

    set y(value: number) {
      this._y = value;
      this.invalidateTransform();
    }

    get scaleX(): number {
      return this._scaleX;
    }

    set scaleX(value: number) {
      this._scaleX = value;
      this.invalidateTransform();
    }

    get scaleY(): number {
      return this._scaleY;
    }

    set scaleY(value: number) {
      this._scaleY = value;
      this.invalidateTransform();
    }

    get rotation(): number {
      return this._rotation;
    }

    set rotation(value: number) {
      this._rotation = value;
      this.invalidateTransform();
    }

    get alpha(): number {
      return this._alpha;
    }

    set alpha(value: number) {
      this._alpha = value;
      this.invalidate();
    }

    get transform(): Matrix {
      if (this._isTransformInvalid) {
        this._transform.setIdentity();
        this._transform.translate(-this.origin.x, -this.origin.y);
        this._transform.scale(this._scaleX, this._scaleY);
        this._transform.rotate(this._rotation * Math.PI / 180);
        this._transform.translate(this._x, this._y);
        this._isTransformInvalid = false;
      }
      return this._transform;
    }

    set transform(value: Matrix) {
      this._transform = value;
      this._x = value.getTranslateX();
      this._y = value.getTranslateY();
      this._scaleX = value.getScaleX();
      this._scaleY = value.getScaleY();
      this._rotation = value.getRotation();
      this._isTransformInvalid = false;
      this.invalidate();
    }

    public w: number;
    public h: number;
    public parent: Frame;
    public isInvalid: boolean;
    public origin: Point = new Point(0, 0);
    public filters: Filter [];
    public mask: Frame;

    constructor () {
      this.parent = null;
      this.transform = Matrix.createIdentity();
      this.filters = null;
    }

    get stage(): Stage {
      var frame = this;
      while (frame.parent) {
        frame = frame.parent;
      }
      if (frame instanceof Stage) {
        return <Stage>frame;
      }
      return null;
    }

    public getConcatenatedTransform(): Matrix {
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

    private invalidateTransform() {
      this._isTransformInvalid = true;
      this.invalidate();
    }


    public render(context: CanvasRenderingContext2D, options?: any) {
      context.save();
      var t = this.transform;
      context.transform(t.a, t.b, t.c, t.d, t.tx, t.ty);
      context.restore();
    }

    public visit (visitor: (Frame, Matrix?) => void, transform: Matrix) {
      var stack: Frame [];
      var frame: Frame;
      var frameContainer: FrameContainer;
      if (transform) {
        stack = [this];
        var transforms: Matrix [];
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
        notImplemented();
      }
    }
  }

  export class FrameContainer extends Frame {
    public children: Frame [];
    constructor() {
      super();
      this.children = [];
    }

    public addChild(child: Frame) {
      child.parent = this;
      this.children.push(child);
    }

    public clearChildren() {
      this.children.length = 0;
    }

    public shuffleChildren() {
      var length = this.children.length;
      for (var i = 0; i < length * 2; i++) {
        var a = Math.random() * length | 0;
        var b = Math.random() * length | 0;
        var t = this.children[a];
        this.children[a] = this.children[b];
        this.children[b] = t;
      }
    }

    public render(context: CanvasRenderingContext2D, options?: any) {
      context.save();
      for (var i = 0; i < this.children.length; i++) {
        this.children[i].render(context, options);
      }
      context.restore();
    }
  }

  export class Stage extends FrameContainer implements Shumway.IRenderable {
    public dirtyRegion: DirtyRegion;
    constructor(w: number, h: number) {
      super()
      this.w = w;
      this.h = h;
      this.dirtyRegion = new DirtyRegion(w, h);
    }

    public render(context: CanvasRenderingContext2D, options?: any) {
      // var layers = this.gatherLayers();
      var layers = [];

      context.strokeStyle = "#E0F8D8";
      this.gatherDirtyRegions();
      super.render(context, options);

      if (options && options.drawLayers) {
        function drawRectangle(rectangle: Rectangle) {
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

    gatherDirtyRegions(rectangles?: Rectangle[]) {
      var that = this;
      // Find all invalid frames.
      this.visit(function (frame: Frame, transform?: Matrix) {
        if (frame.isInvalid) {
          var rectangle = new Rectangle(0, 0, frame.w, frame.h);
          transform.transformRectangleAABB(rectangle);
          that.dirtyRegion.addDirtyRectangle(rectangle);
          frame.isInvalid = false;
        }
      }, this.transform);
      if (rectangles) {
        this.dirtyRegion.gatherRegions(rectangles);
      }
    }

    gatherFrames() {
      var frames = [];
      this.visit(function (frame: Frame, transform?: Matrix) {
        if (!(frame instanceof FrameContainer)) {
          frames.push(frame);
        }
      }, this.transform);
      return frames;
    }

    gatherLayers() {
      var layers = [];
      var currentLayer;
      this.visit(function (frame: Frame, transform?: Matrix) {
        if (frame instanceof FrameContainer) {
          return;
        }
        var rectangle = new Rectangle(0, 0, frame.w, frame.h);
        transform.transformRectangleAABB(rectangle);
        if (frame.isInvalid) {
          if (currentLayer) {
            layers.push(currentLayer);
          }
          layers.push(rectangle.clone());
          currentLayer = null;
        } else {
          if (!currentLayer) {
            currentLayer = rectangle.clone();
          } else {
            currentLayer.union(rectangle);
          }
        }
      }, this.transform);

      if (currentLayer) {
        layers.push(currentLayer);
      }

      return layers;
    }
  }

  export interface IAnimator {
    onEnterFrame ();
  }

  export class SolidRectangle extends Frame implements Shumway.IRenderable {
    fillStyle: string = randomStyle();
    constructor() {
      super();
    }
  }

  export class Shape extends Frame {
    source: ISource;
    constructor(source: ISource) {
      super();
      this.source = source;
      var bounds = source.getBounds();
      this.w = bounds.w;
      this.h = bounds.h;
    }
    render(context: CanvasRenderingContext2D) {
      var m = this.transform;
      context.save();
      context.setTransform(m.a, m.b, m.c, m.d, m.tx, m.ty);
      this.source.render(context);
      context.restore();
    }
  }

  export class Shape2 extends Frame {
    canvas: HTMLCanvasElement;
    renderer: (context: CanvasRenderingContext2D) => void;
    cacheAsBitmap: boolean;
    constructor(renderer, w: number, h: number, cacheAsBitmap: boolean = true) {
      super();
      this.renderer = renderer;
      this.w = w;
      this.h = h;
      this.cacheAsBitmap = cacheAsBitmap;
    }
    cache () {
      if (!this.cacheAsBitmap) {
        return;
      }
      this.canvas = document.createElement("canvas");
      this.canvas.width = this.w;
      this.canvas.height = this.h;
      var context = this.canvas.getContext("2d");
      this.renderer(context);
    }
    render (context: CanvasRenderingContext2D) {
      context.save();
      var t = this.transform;
      context.transform(t.a, t.b, t.c, t.d, t.tx, t.ty);
      if (this.canvas) {
        context.drawImage(this.canvas, 0, 0);
      } else {
        this.cache();
        this.renderer(context);
      }
      context.restore();
    }
  }

  export class Bitmap extends Frame implements Shumway.IRenderable {
    public image: HTMLImageElement;
    constructor(image: HTMLImageElement) {
      super();
      this.image = image;
      if (image.complete) {
        this.w = image.width;
        this.h = image.height;
      } else {
        var thisFrame = this;
        image.addEventListener("load", function () {
          thisFrame.w = image.width;
          thisFrame.h = image.height;
        });
      }
    }
    render (context: CanvasRenderingContext2D, options?: any) {
      context.save();
      var t = this.transform;
      context.transform(t.a, t.b, t.c, t.d, t.tx, t.ty);
      if (options && options.snap) {
        context.save();
        context.setTransform(1, 0, 0, 1, t.tx | 0, t.ty | 0);
        context.drawImage(this.image, 0, 0);
        context.restore();
      } else {
        context.drawImage(this.image, 0, 0);
      }
      context.restore();
    }
  }

  export class Video extends Frame implements Shumway.IRenderable {
    video: HTMLVideoElement;
    constructor(video: any) {
      super();
      var that = this;
      this.video = video;
      if (video.videoWidth && video.videoHeight) {
        this.w = video.videoWidth;
        this.h = video.videoHeight;
      } else {
        var thisFrame = this;
        video.onloadedmetadata = function () {
          thisFrame.w = video.videoWidth;
          thisFrame.h = video.videoHeight;
        };
      }
    }
    render (context: CanvasRenderingContext2D, options?: any) {
      context.save();
      var t = this.transform;
      context.transform(t.a, t.b, t.c, t.d, t.tx, t.ty);
      if (options && options.alpha) {
        context.globalAlpha = this.alpha;
      }
      if (options && options.snap) {
        context.save();
        context.setTransform(1, 0, 0, 1, t.tx | 0, t.ty | 0);
        context.drawImage(this.video, 0, 0);
        context.restore();
      } else {
        context.drawImage(this.video, 0, 0);
      }
      if (options && options.alpha) {
        context.globalAlpha = 1;
      }
      context.restore();
    }
  }
}