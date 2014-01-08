/// <reference path='all.ts'/>
module Shumway.Layers {
  import Rectangle = Shumway.Geometry.Rectangle;
  import Point = Shumway.Geometry.Point;
  import Matrix = Shumway.Geometry.Matrix;
  import DirtyRegion = Shumway.Geometry.DirtyRegion;
  import Filter = Shumway.Layers.Filter;
  import TileCache = Shumway.Geometry.TileCache;
  import Tile = Shumway.Geometry.Tile;
  import OBB = Shumway.Geometry.OBB;

  export class Frame {
    private _x: number;
    private _y: number;
    private _alpha: number;
    private _scaleX: number;
    private _scaleY: number;
    private _rotation: number;
    private _transform: Matrix;
    private _isTransformInvalid: boolean = true;
    private _origin: Point = new Point(0, 0);

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
        this._transform.scale(this._scaleX, this._scaleY);
        this._transform.rotate(this._rotation * Math.PI / 180);
        this._transform.translate(this._x, this._y);

        var t = Matrix.createIdentity();
        t.translate(-this._origin.x, -this._origin.y);
        t.concat(this._transform);
        this._transform = t;
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

    public filters: Filter [];
    public mask: Frame;

    get origin(): Point {
      return this._origin;
    }

    set origin(value: Point) {
      this._origin.set(value);
      this.invalidateTransform();
    }

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

    public visit(visitor: (Frame, Matrix?) => void, transform: Matrix) {
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
  }

  export interface ITextureRegion {
    texture: any;
    region: Rectangle;
  }

//  export class Canvas2DTextureRegion implements ITextureRegion {
//    texture: any;
//    region: Rectangle;
//    constructor(texture: any, region: Rectangle) {
//      this.texture = texture;
//      this.region = region;
//    }
//  }
//
//  export class Canvas2DTexture {
//    bounds: Rectangle;
//    context: CanvasRenderingContext2D;
//    size: number = 0;
//    regions: Canvas2DTextureRegion [] = [];
//    constructor(context: CanvasRenderingContext2D, size: number) {
//      this.context = context;
//      this.bounds = new Rectangle(0, 0, context.canvas.width, context.canvas.height);
//      this.size = size;
//    }
//    cacheImage(src: CanvasRenderingContext2D, srcBounds: Rectangle): Canvas2DTextureRegion {
//      if (this.regions.length > 100) {
//        for (var i = 0; i < this.regions.length / 2; i++) {
//          this.regions[i].texture = null;
//        }
//        this.regions = [];
//      }
//      var x = (this.regions.length % 16 | 0) * this.size;
//      var y = (this.regions.length / 16 | 0) * this.size;
//      var w = 0, h = 0;
//      var region = new Canvas2DTextureRegion(this, new Rectangle(x, y, w, h));
//      this.context.drawImage(src.canvas, srcBounds.x, srcBounds.y, srcBounds.w, srcBounds.h, x, y, srcBounds.w, srcBounds.h);
//      this.regions.push(region);
//      return region;
//    }
//  }

  export class RenderableTileCache {
    cache: TileCache;
    source: IRenderable;
    constructor(source: IRenderable, size) {
      this.source = source;
      var bounds = source.getBounds();
      this.cache = new TileCache(bounds.w, bounds.h, size);
    }
    fetchTiles(query: Rectangle,
               transform: Matrix,
               context: CanvasRenderingContext2D,
               cacheImage: (src: CanvasRenderingContext2D, srcBounds: Rectangle) => ITextureRegion): Tile [] {
      var tiles = this.cache.getTiles(query, transform);
      var uncachedTilesBounds = null;
      var uncachedTiles: Tile [] = [];
      for (var i = 0; i < tiles.length; i++) {
        var tile = tiles[i];
        if (!tile.cachedTextureRegion || !tile.cachedTextureRegion.texture) {
          if (!uncachedTilesBounds) {
            uncachedTilesBounds = Rectangle.createEmpty();
          }
          uncachedTilesBounds.union(tile.bounds);
          uncachedTiles.push(tile);
        }
      }
      if (uncachedTilesBounds) {
        this.cacheTiles(context, uncachedTilesBounds, uncachedTiles, cacheImage);

        var points = Point.createEmptyPoints(4);
        transform.transformRectangle(query, points);
        context.strokeStyle = "white";
        context.beginPath();
        context.moveTo(points[0].x, points[0].y);
        context.lineTo(points[1].x, points[1].y);
        context.lineTo(points[2].x, points[2].y);
        context.lineTo(points[3].x, points[3].y);
        context.closePath();
        context.stroke();
      }

      return tiles;
    }
    private cacheTiles(context: CanvasRenderingContext2D,
                       bounds: Rectangle,
                       uncachedTiles: Tile [],
                       cacheImage: (src: CanvasRenderingContext2D, srcBounds: Rectangle) => ITextureRegion) {
      context.setTransform(1, 0, 0, 1, 0, 0);
      // context.fillStyle = "black";
      // context.fillRect(0, 0, context.canvas.width, context.canvas.height);
      context.clearRect(0, 0, context.canvas.width, context.canvas.height);
      context.translate(-bounds.x, -bounds.y);
      this.source.render(context);

      for (var i = 0; i < uncachedTiles.length; i++) {
        var tile = uncachedTiles[i];
        var region = tile.bounds.clone();
        region.x -= bounds.x;
        region.y -= bounds.y;
        tile.cachedTextureRegion = cacheImage(context, region);
//        context.fillStyle = "rgba(255, 0, 0, 0.5)";
//        context.fillRect(tile.bounds.x, tile.bounds.y, tile.bounds.w, tile.bounds.h);
//        context.strokeStyle = "rgba(255, 255, 255, 0.5)";
//        context.strokeRect(tile.bounds.x, tile.bounds.y, tile.bounds.w, tile.bounds.h);
//        context.fillStyle = "black";
//        context.font = "12px Consolas";
//        context.fillText(String(tile.index), tile.bounds.x + 2, tile.bounds.y + 10);
      }
    }
  }

  export class Canvas2DStageRenderer {
    context: CanvasRenderingContext2D;
    debugContexts: CanvasRenderingContext2D [];
    count = 0;
    constructor(context: CanvasRenderingContext2D, debugContexts: CanvasRenderingContext2D []) {
      this.context = context;
      this.debugContexts = debugContexts;
    }

    public render(stage: Stage, options: any) {
      var context = this.context;
      var debugContext = this.debugContexts[0];
      var cacheContext = this.debugContexts[1];
      context.globalAlpha = 1;
      context.fillStyle = "black";
      context.fillRect(0, 0, stage.w, stage.h);


      var points = Point.createEmptyPoints(4);
      var corners = Point.createEmptyPoints(4);

      var size = 64;
      var that = this;
      stage.visit(function (frame: Frame, transform?: Matrix) {
        context.save();
        context.setTransform(transform.a, transform.b, transform.c, transform.d, transform.tx, transform.ty);
        context.globalAlpha = 1 - frame.alpha;
        if (frame instanceof Shape) {
          var shape = <Shape>frame;
          var shapeProperties = shape.source.properties;
          shape.source.render(context);
          debugContext.save();
          var m = Matrix.createIdentity();
          transform.inverse(m);
          if (false) {
            debugContext.setTransform(m.a, m.b, m.c, m.d, m.tx, m.ty);
            debugContext.fillStyle = "red";
            debugContext.fillRect(0, 0, stage.w, stage.h);
          } else {

            var viewport = new Rectangle(0, 0, stage.w, stage.h);
            var rectangle = new Rectangle(0, 0, shape.w, shape.h);

            transform.transformRectangleAABB(rectangle);
            viewport.intersect(rectangle);

            var tileCache: RenderableTileCache = shapeProperties["tileCache"];
            if (!tileCache) {
              tileCache = shapeProperties["tileCache"] = new RenderableTileCache(shape.source, size);
            }
            // var tiles = tileCache.fetchTiles(viewport, m, debugContext, that.texture);
          }
          debugContext.restore();
        }
        context.globalAlpha = 1;
        context.restore();
      }, stage.transform);

      if (options && options.drawLayers) {
        function drawRectangle(rectangle: Rectangle) {
          context.rect(rectangle.x, rectangle.y, rectangle.w, rectangle.h);
        }
        context.strokeStyle = "#FF4981";
//        for (var i = 0; i < layers.length; i++) {
//          context.beginPath();
//          drawRectangle(layers[i]);
//          context.closePath();
//          context.stroke();
//        }
      }
    }
  }

  export class Stage extends FrameContainer {
    public dirtyRegion: DirtyRegion;
    constructor(w: number, h: number) {
      super()
      this.w = w;
      this.h = h;
      this.dirtyRegion = new DirtyRegion(w, h);
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

  export class SolidRectangle extends Frame {
    fillStyle: string = randomStyle();
    constructor() {
      super();
    }
  }

  export class Shape extends Frame {
    source: IRenderable;
    constructor(source: IRenderable) {
      super();
      this.source = source;
      var bounds = source.getBounds();
      this.w = bounds.w;
      this.h = bounds.h;
    }
  }

  export class Video extends Frame {
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