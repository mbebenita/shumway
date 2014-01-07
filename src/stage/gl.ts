/// <reference path='all.ts'/>
/// <reference path="WebGL.d.ts" />

module Shumway.GL {
  var traceLevel = 1;
  var MAX_SIZE = 1024 * 4;
  enum TraceLevel {
    None,
    Brief,
    Verbose,
  }
  var release = true;
  var writer = new IndentingWriter();

  import createQuadraticCurveVertices = Shumway.Geometry.Path.createQuadraticCurveVertices;
  import Point = Shumway.Geometry.Point;
  import Matrix = Shumway.Geometry.Matrix;
  import Rectangle = Shumway.Geometry.Rectangle;
  import RectanglePacker = Shumway.Geometry.RectanglePacker;

  import Frame = Shumway.Layers.Frame;
  import Stage = Shumway.Layers.Stage;
  import Shape = Shumway.Layers.Shape;
  import Flake = Shumway.Layers.Elements.Flake;
  import SolidRectangle = Shumway.Layers.SolidRectangle;
  import Video = Shumway.Layers.Video;
  import Filter = Shumway.Layers.Filter;
  import BlurFilter = Shumway.Layers.BlurFilter;

  function count(name) {
    Counter.count(name);
    FrameCounter.count(name);
  }

  export var SHADER_ROOT = "shaders/";

  function endsWith(str, end) {
    return str.indexOf(end, this.length - end.length) !== -1;
  }

  class WebGLContextState {
    parent: WebGLContextState;
    transform: Matrix;
    target: WebGLTexture;
    constructor(parent: WebGLContextState = null) {
      this.parent = parent;
      if (parent) {
        this.target = parent.target;
        this.transform = parent.transform.clone();
      } else {
        this.target = null;
        this.transform = Matrix.createIdentity();
      }
    }
  }

  export class Color {
    public r: number;
    public g: number;
    public b: number;
    public a: number;
    constructor(r: number, g: number, b: number, a: number) {
      this.r = r;
      this.g = g;
      this.b = b;
      this.a = a;
    }
    set (other: Color) {
      this.r = other.r;
      this.g = other.g;
      this.b = other.b;
      this.a = other.a;
    }
    public static Red   = new Color(1, 0, 0, 1);
    public static Green = new Color(0, 1, 0, 1);
    public static Blue  = new Color(0, 0, 1, 1);
    public static None  = new Color(0, 0, 0, 0);
    public static White = new Color(1, 1, 1, 1);
    public static Black = new Color(0, 0, 0, 1);
    private static colorCache: { [color: string]: Color } = {};
    public static parseColor(color: string) {
      if (!Color.colorCache) {
        Color.colorCache = Object.create(null);
      }
      if (Color.colorCache[color]) {
        return Color.colorCache[color];
      }
      // TODO: Obviously slow, but it will do for now.
      var span = document.createElement('span');
      document.body.appendChild(span);
      span.style.backgroundColor = color;
      var rgb = getComputedStyle(span).backgroundColor;
      document.body.removeChild(span);
      var m = /^rgb\((\d+), (\d+), (\d+)\)$/.exec(rgb);
      if (!m) m = /^rgba\((\d+), (\d+), (\d+), ([\d.]+)\)$/.exec(rgb);
      var result = new Color(0, 0, 0, 0);
      result.r = parseFloat(m[1]) / 255;
      result.g = parseFloat(m[2]) / 255;
      result.b = parseFloat(m[3]) / 255;
      result.a = m[4] ? parseFloat(m[4]) / 255 : 1;
      return Color.colorCache[color] = result;
    }
  }

  export class Vertex extends Shumway.Geometry.Point {
    constructor (x: number, y: number) {
      super(x, y);
    }
    static createEmptyVertices<T extends Vertex>(type: new (x: number, y: number) => T, count: number): T [] {
      var result = [];
      for (var i = 0; i < count; i++) {
        result.push(new type(0, 0));
      }
      return result;
    }
  }

  export class WebGLTextureRegion {
    texture: WebGLTexture;
    region: Rectangle;
    constructor(texture: WebGLTexture, region: Rectangle) {
      this.texture = texture;
      this.region = region;
      this.texture.regions.push(this);
    }
  }

  export class WebGLTextureAtlas {
    texture: WebGLTexture;

    private _context: WebGLContext;
    private _rectanglePacker: RectanglePacker;
    private _w: number;
    private _h: number;
    private _solitary: boolean;

    get w(): number {
      return this._w;
    }

    get h(): number {
      return this._h;
    }

    constructor(context: WebGLContext, texture: WebGLTexture, w: number, h: number, solitary: boolean = false) {
      this._context = context;
      this.texture = texture;
      this._w = w;
      this._h = h;
      this._solitary = solitary;
      this.reset();
    }

    insert(image: any, w: number, h: number): Rectangle {
      var gl = this._context.gl;
      var region = this._rectanglePacker.insert(w, h);
      if (!region) {
        return;
      }
      gl.bindTexture(gl.TEXTURE_2D, this.texture);
      gl.texSubImage2D(gl.TEXTURE_2D, 0, region.x, region.y, gl.RGBA, gl.UNSIGNED_BYTE, image);
      count("texSubImage2D");
      return region;
    }

    update(image: any, region: Rectangle): Rectangle {
      var gl = this._context.gl;
      gl.bindTexture(gl.TEXTURE_2D, this.texture);
      gl.texSubImage2D(gl.TEXTURE_2D, 0, region.x, region.y, gl.RGBA, gl.UNSIGNED_BYTE, image);
      return region;
    }

    reset() {
      this._rectanglePacker = new RectanglePacker(this._w, this._h, this._solitary ? 0 : 2);
    }
  }

  export class WebGLContext {
    private static MAX_TEXTURES = 8;

    public gl: WebGLRenderingContext;
    private _canvas: HTMLCanvasElement;
    private _w: number;
    private _h: number;
    private _programCache: {};
    public _backgroundColor: Color;

    private _state: WebGLContextState = new WebGLContextState();
    private _geometry: WebGLGeometry;
    private _tmpVertices: Vertex [];
    private _fillColor: Color = Color.Red;

    private _textures: WebGLTexture [];


    scratch: WebGLTexture [];

    get width(): number {
      return this._w;
    }

    set width(value: number) {
      this._w = value;
      this.updateViewport();
    }

    get height(): number {
      return this._h;
    }

    set height(value: number) {
      this._h = value;
      this.updateViewport();
    }

    set fillStyle(value: any) {
      this._fillColor.set(Color.parseColor(value));
    }

    constructor (canvas: HTMLCanvasElement) {
      this._canvas = canvas;

      this.gl = <WebGLRenderingContext> (
        canvas.getContext("experimental-webgl", {
          preserveDrawingBuffer: true,
          antialias: true,
          stencil: true,
          // premultipliedAlpha: false
        })
      );
      assert (this.gl, "Cannot create WebGL context.");
      this._programCache = Object.create(null);
      this.gl.viewport(0, 0, this._w, this._h);
      this._w = canvas.width;
      this._h = canvas.height;
      this.updateViewport();
      this._backgroundColor = Shumway.Util.Color.parseColor(this._canvas.style.backgroundColor);

      this._geometry = new WebGLGeometry(this);
      this._tmpVertices = Vertex.createEmptyVertices(Vertex, 64);

      this._textures = [];
      this.scratch = [
        this.createTexture(512, 512),
        this.createTexture(512, 512)
      ];

      this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
      // this.gl.blendFunc(this.gl.ONE, this.gl.ONE_MINUS_SRC_ALPHA);

      this.gl.enable(this.gl.BLEND);

    }

    public cacheImage(image: any, solitary: boolean): WebGLTextureRegion {
      var w = image.width;
      var h = image.height;
      var region: Rectangle, texture: WebGLTexture;
      if (!solitary) {
        for (var i = 0; i < this._textures.length; i++) {
          texture = this._textures[i];
          region = texture.atlas.insert(image, w, h);
          if (region) {
            break;
          }
        }
      }
      if (!region) {
        var aw = solitary ? w : MAX_SIZE;
        var ah = solitary ? h : MAX_SIZE;
        if (this._textures.length === WebGLContext.MAX_TEXTURES) {
          texture = this.recycleTexture();
        } else {
          texture = this.createTexture(aw, ah, solitary);
        }
        this._textures.push(texture);
        region = texture.atlas.insert(image, w, h);
        assert (region);
      }
      traceLevel >= TraceLevel.Verbose && writer.writeLn("Uploading Image: @ " + region);
      return new WebGLTextureRegion(texture, region);
    }

    private recycleTexture(): WebGLTexture {
      // var texture: WebGLTexture = this._textures.shift();
      var texture: WebGLTexture = this._textures.splice(Math.random() * this._textures.length | 0, 1)[0];
      var regions = texture.regions;
      for (var i = 0; i < regions.length; i++) {
        regions[i].texture = null;
      }
      texture.atlas.reset();
      count("evictTexture");
      return texture;
    }

    private updateViewport() {
      var gl = this.gl;
      gl.viewport(0, 0, this._w, this._h);

      for (var k in this._programCache) {
        this.initializeProgram(this._programCache[k]);
      }
    }

    private initializeProgram(program: WebGLProgram) {
      var gl = this.gl;
      gl.useProgram(program);
      gl.uniform2f(program.uniforms.uResolution.location, this._w, this._h);
    }

    private createShaderFromFile(file: string) {
      var path = SHADER_ROOT + file;
      var gl = this.gl;
      var request = new XMLHttpRequest();
      request.open("GET", path, false);
      request.send();
      assert (request.status === 200, "File : " + path + " not found.");
      var shaderType;
      if (endsWith(path, ".vert")) {
        shaderType = gl.VERTEX_SHADER;
      } else if (endsWith(path, ".frag")) {
        shaderType = gl.FRAGMENT_SHADER;
      } else {
        throw "Shader Type: not supported.";
      }
      return this.createShader(shaderType, request.responseText);
    }

    public createProgramFromFiles(vertex: string, fragment: string) {
      var key = vertex + "-" + fragment;
      var program = this._programCache[key];
      if (!program) {
        program = this.createProgram([
          this.createShaderFromFile(vertex),
          this.createShaderFromFile(fragment)
        ]);
        this.queryProgramAttributesAndUniforms(program);
        this.initializeProgram(program);
        this._programCache[key] = program;

      }
      return program;
    }

    private createProgram(shaders): WebGLProgram {
      var gl = this.gl;
      var program = gl.createProgram();
      shaders.forEach(function (shader) {
        gl.attachShader(program, shader);
      });
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        var lastError = gl.getProgramInfoLog(program);
        unexpected("Cannot link program: " + lastError);
        gl.deleteProgram(program);
      }
      return program;
    }

    private createShader(shaderType, shaderSource): WebGLShader {
      var gl = this.gl;
      var shader = gl.createShader(shaderType);
      gl.shaderSource(shader, shaderSource);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        var lastError = gl.getShaderInfoLog(shader);
        unexpected("Cannot compile shader: " + lastError);
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    }

    createTexture(w: number, h: number, solitary: boolean = false, data = null): WebGLTexture {
      var gl = this.gl;
      var texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
      texture.w = w;
      texture.h = h;
      texture.atlas = new WebGLTextureAtlas(this, texture, w, h, solitary);
      texture.framebuffer = this.createFramebuffer(texture);
      texture.regions = [];
      return texture;
    }

    createFramebuffer(texture: WebGLTexture): WebGLFramebuffer {
      var gl = this.gl;
      var framebuffer: WebGLFramebuffer = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);

      return framebuffer;
    }

    private queryProgramAttributesAndUniforms(program) {
      program.uniforms = {};
      program.attributes = {};

      var gl = this.gl;
      for (var i = 0, j = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES); i < j; i++) {
        var attribute = gl.getActiveAttrib(program, i);
        program.attributes[attribute.name] = attribute;
        attribute.location = gl.getAttribLocation(program, attribute.name);
      }
      for (var i = 0, j = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS); i < j; i++) {
        var uniform = gl.getActiveUniform(program, i);
        program.uniforms[uniform.name] = uniform;
        uniform.location = gl.getUniformLocation(program, uniform.name);
      }
    }

    public save() {
      this._state = new WebGLContextState(this._state);
    }

    public restore() {
      if (this._state.parent) {
        this._state = this._state.parent;
      }
    }

    public transform(a: number, b: number, c: number, d: number, tx: number, ty: number) {
      this._state.transform.transform(a, b, c, d, tx, ty);
    }

    public setTransform(transform: Matrix) {
      this._state.transform.set(transform)
    }

    public setTarget(target: WebGLTexture) {
      this._state.target = target;
      var gl = this.gl;
      gl.bindFramebuffer(gl.FRAMEBUFFER, target ? target.framebuffer : null);
    }

    public clear(color: Color = Color.None) {
      var gl = this.gl;
      gl.clearColor(color.r, color.g, color.b, color.a);
      gl.clear(gl.COLOR_BUFFER_BIT);
    }

    public sizeOf(type): number {
      var gl = this.gl;
      switch (type) {
        case gl.UNSIGNED_BYTE:
          return 1;
        case gl.UNSIGNED_SHORT:
          return 2;
        case this.gl.INT:
        case this.gl.FLOAT:
          return 4;
        default:
          notImplemented(type);
      }
    }

//    public fillRectangle(rectangle: Rectangle, fillColor: Color) {
//      var gl = this.gl;
//      var g = this._geometry;
//      var p = this._solidFillProgram;
//
//      g.clear();
//      this._state.transform.transformRectangle(rectangle, this._tmpVertices);
//      for (var i = 0; i < 4; i++) {
//        this._tmpVertices[i].color.set(fillColor);
//      }
//      this._geometry.addVertices(this._tmpVertices, 4);
//      this._geometry.addQuad();
//      g.uploadBuffers();
//
//      gl.useProgram(p);
//      gl.uniform1f(p.uniforms.uZ.location, 1);
//      gl.uniformMatrix3fv(p.uniforms.uTransformMatrix.location, false, Matrix.createIdentity().toWebGLMatrix());
//      gl.bindBuffer(gl.ARRAY_BUFFER, g.attributes["position"].buffer);
//      var position = p.attributes.aPosition.location;
//      gl.enableVertexAttribArray(position);
//      gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
//      gl.bindBuffer(gl.ARRAY_BUFFER, g.attributes["color"].buffer);
//      var color = p.attributes.aColor.location;
//      gl.enableVertexAttribArray(color);
//      gl.vertexAttribPointer(color, 4, gl.FLOAT, false, 0, 0);
//      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, g.attributes["element"].buffer);
//      var triangles = 2;
//      gl.drawElements(gl.TRIANGLES, triangles * 3, gl.UNSIGNED_SHORT, 0);
//    }

//    public drawImage(src: WebGLTextureRegion, dstRectangle?: Rectangle) {
//      if (!dstRectangle) {
//        dstRectangle = new Rectangle(0, 0, src.region.w, src.region.h);
//      } else {
//        dstRectangle = dstRectangle.clone();
//      }
//
//      var srcRectangle = src.region.clone();
//      srcRectangle.scale(1 / src.texture.w, 1 / src.texture.h);
//      this._state.transform.transformRectangle(dstRectangle, this._tmpVertices);
//      this._tmpVertices[0].coordinate.x = srcRectangle.x;
//      this._tmpVertices[0].coordinate.y = srcRectangle.y;
//      this._tmpVertices[1].coordinate.x = srcRectangle.x + srcRectangle.w;
//      this._tmpVertices[1].coordinate.y = srcRectangle.y;
//      this._tmpVertices[2].coordinate.x = srcRectangle.x + srcRectangle.w;
//      this._tmpVertices[2].coordinate.y = srcRectangle.y + srcRectangle.h;
//      this._tmpVertices[3].coordinate.x = srcRectangle.x;
//      this._tmpVertices[3].coordinate.y = srcRectangle.y + srcRectangle.h;
//      this._geometry.addVertices(this._tmpVertices, 4);
//      this._geometry.addQuad();
//    }
//
//    public applyFilter(src: WebGLTextureRegion, filter: Shumway.Layers.Filter) {
//      var dstRectangle = new Rectangle(0, 0, src.region.w, src.region.h);
//
//      var srcRectangle = src.region.clone();
//      srcRectangle.scale(1 / src.texture.w, 1 / src.texture.h);
//      this._state.transform.transformRectangle(dstRectangle, this._tmpVertices);
//      this._tmpVertices[0].coordinate.x = srcRectangle.x;
//      this._tmpVertices[0].coordinate.y = srcRectangle.y;
//      this._tmpVertices[1].coordinate.x = srcRectangle.x + srcRectangle.w;
//      this._tmpVertices[1].coordinate.y = srcRectangle.y;
//      this._tmpVertices[2].coordinate.x = srcRectangle.x + srcRectangle.w;
//      this._tmpVertices[2].coordinate.y = srcRectangle.y + srcRectangle.h;
//      this._tmpVertices[3].coordinate.x = srcRectangle.x;
//      this._tmpVertices[3].coordinate.y = srcRectangle.y + srcRectangle.h;
//      this._geometry.addVertices(this._tmpVertices, 4);
//      this._geometry.addQuad();
//    }

    public beginPath() {

    }

    public closePath() {

    }

    public stroke() {

    }

    public rect() {

    }

    private clearRect(rectangle: Rectangle, color: Color) {
      var gl = this.gl;
      gl.enable(gl.SCISSOR_TEST);
      gl.scissor(rectangle.x, this._h - rectangle.y - rectangle.h, rectangle.w, rectangle.h);
      gl.clearColor(color.r, color.g, color.b, color.a);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.disable(gl.SCISSOR_TEST);
    }
  }

  export class WebGLStageRenderer {
    context: WebGLContext;

    private _brush: WebGLCombinedBrush;
    private _brushGeometry: WebGLGeometry;

    private _stencilBrush: WebGLCombinedBrush;
    private _stencilBrushGeometry: WebGLGeometry;

    private _tmpVertices: Vertex [] = Vertex.createEmptyVertices(Vertex, 64);

    private _scratchCanvas: HTMLCanvasElement;
    private _scratchCanvasContext: CanvasRenderingContext2D;

    constructor(context: WebGLContext) {
      this.context = context;

      this._brushGeometry = new WebGLGeometry(context);
      this._brush = new WebGLCombinedBrush(context, this._brushGeometry);

      this._stencilBrushGeometry = new WebGLGeometry(context);
      this._stencilBrush = new WebGLCombinedBrush(context, this._stencilBrushGeometry);

      this._scratchCanvas = document.createElement("canvas");
      this._scratchCanvas.width = MAX_SIZE;
      this._scratchCanvas.height = MAX_SIZE;
      this._scratchCanvasContext = this._scratchCanvas.getContext("2d");
    }

    public render(stage: Stage, options: any) {
      var that = this;
      var context = this.context;

      var brush = this._brush;
      brush.reset();

      var stencilBrush = this._stencilBrush;
      stencilBrush.reset();

      var rectangles: Rectangle [] = [];
      stage.gatherDirtyRegions(rectangles);

      var identity = Matrix.createIdentity();
      for (var i = 0; i < rectangles.length; i++) {
        var rectangle = rectangles[i];
        // stencilBrush.fillRectangle(rectangle, Color.Red, identity);
        stencilBrush.fillRectangle(rectangle, Color.Black, identity);
      }

      var image;
      stage.visit(function (frame: Frame, transform?: Matrix) {
        that.context.setTransform(transform);
        if (frame instanceof Flake) {
          brush.fillRectangle(new Rectangle(0, 0, frame.w, frame.h), Color.parseColor((<Flake>frame).fillStyle), transform);
        } else if (frame instanceof SolidRectangle) {
          brush.fillRectangle(new Rectangle(0, 0, frame.w, frame.h), Color.parseColor((<SolidRectangle>frame).fillStyle), transform);
        } else if (frame instanceof Video) {
          // that.renderVideo(<Video>frame, transform);
        } else if (frame instanceof Shape) {
          var shape = <Shape>frame;
          var bounds = shape.source.getBounds();
          if (!bounds.isEmpty()) {
            var src: WebGLTextureRegion = shape.source.properties["CachedWebGLTextureRegion"];
            if (!src || !src.texture) {
              that._scratchCanvasContext.clearRect(0, 0, that._scratchCanvas.width, that._scratchCanvas.height);
              shape.source.render(that._scratchCanvasContext);
              var image: ImageData = that._scratchCanvasContext.getImageData(0, 0, bounds.w, bounds.h);
              src = shape.source.properties["CachedWebGLTextureRegion"] = context.cacheImage(image, false);
            }
            if (!brush.drawImage(src, undefined, new Color(1, 1, 1, frame.alpha), transform)) {
              brush.draw();
              brush.reset();
              brush.drawImage(src, undefined, new Color(1, 1, 1, frame.alpha), transform);
            }
          }
        }
      }, stage.transform);

      var gl = context.gl;
      for (var i = 0; i < options.redraw; i++) {
        if (options.useStencil) {
          gl.stencilMask(0xFF);
          gl.clear(gl.STENCIL_BUFFER_BIT);
          gl.enable(gl.STENCIL_TEST);
          gl.stencilFunc(gl.ALWAYS, 1, 0xFF);
          gl.stencilOp(gl.KEEP, gl.KEEP, gl.REPLACE);
          gl.stencilMask(0xFF);
          gl.colorMask(false, false, false, false);
          gl.depthMask(false);
          stencilBrush.draw();
          gl.colorMask(true, true, true, true);
          gl.depthMask(false);
          gl.stencilFunc(gl.EQUAL, 1, 0xFF);
          gl.stencilMask(0x00);
          stencilBrush.draw();
        } else {
          gl.clearColor(0, 0, 0, 0);
          gl.clear(gl.COLOR_BUFFER_BIT);
        }
        brush.draw();
        if (options.useStencil) {
          gl.disable(gl.STENCIL_TEST);
        }
      }
    }
  }

  export class WebGLBrush {
    context: WebGLContext;
    geometry: WebGLGeometry;
    constructor(context: WebGLContext, geometry: WebGLGeometry) {
      this.context = context;
      this.geometry = geometry;
    }
  }

  export enum WebGLCombinedBrushKind {
    FillColor,
    FillTexture
  }

  export class WebGLCombinedBrushVertex extends Vertex {
    static attributeList: WebGLAttributeList;
    static initializeAttributeList(context) {
      var gl = context.gl;
      if (WebGLCombinedBrushVertex.attributeList) {
        return;
      }
      WebGLCombinedBrushVertex.attributeList = new WebGLAttributeList([
        new WebGLAttribute("aPosition", 2, gl.FLOAT),
        new WebGLAttribute("aCoordinate", 2, gl.FLOAT),
        new WebGLAttribute("aColor", 4, gl.UNSIGNED_BYTE, true),
        new WebGLAttribute("aKind", 1, gl.FLOAT),
        new WebGLAttribute("aSampler", 1, gl.FLOAT)
      ]);
      WebGLCombinedBrushVertex.attributeList.initialize(context);
    }
    kind: WebGLCombinedBrushKind = WebGLCombinedBrushKind.FillColor;
    color: Color = new Color(0, 0, 0, 0);
    sampler: number = 0;
    coordinate: Point = new Point(0, 0);
    constructor (x: number, y: number) {
      super(x, y);
    }
    public writeTo(geometry: WebGLGeometry) {
      var array = geometry.array;
      array.ensureAdditionalCapacity(64);
      array.writeVertexUnsafe(this.x, this.y);
      array.writeVertexUnsafe(this.coordinate.x, this.coordinate.y);
      array.writeColorUnsafe(this.color.r * 255, this.color.g * 255, this.color.b * 255, this.color.a * 255);
      array.writeFloatUnsafe(this.kind);
      array.writeFloatUnsafe(this.sampler);
    }
  }

  export class WebGLCombinedBrush extends WebGLBrush {
    static tmpVertices: WebGLCombinedBrushVertex [] = Vertex.createEmptyVertices(WebGLCombinedBrushVertex, 4);
    program: WebGLProgram;
    textures: WebGLTexture [];
    constructor(context: WebGLContext, geometry: WebGLGeometry) {
      super(context, geometry);
      this.program = context.createProgramFromFiles("combined.vert", "combined.frag");
      this.textures = [];
      WebGLCombinedBrushVertex.initializeAttributeList(this.context);
    }

    public reset() {
      this.textures = [];
      this.geometry.reset();
    }

    public drawImage(src: WebGLTextureRegion, dstRectangle: Rectangle, color: Color, transform: Matrix) {
      if (!dstRectangle) {
        dstRectangle = new Rectangle(0, 0, src.region.w, src.region.h);
      } else {
        dstRectangle = dstRectangle.clone();
      }
      var sampler = this.textures.indexOf(src.texture);
      if (sampler < 0) {
        this.textures.push(src.texture);
        if (this.textures.length > 8) {
          return false;
          notImplemented("Cannot handle more than 8 texture samplers.");
        }
        sampler = this.textures.length - 1;
      }
      var tmpVertices = WebGLCombinedBrush.tmpVertices;
      var srcRectangle = src.region.clone();
      srcRectangle.scale(1 / src.texture.w, 1 / src.texture.h);
      transform.transformRectangle(dstRectangle, tmpVertices);
      tmpVertices[0].coordinate.x = srcRectangle.x;
      tmpVertices[0].coordinate.y = srcRectangle.y;
      tmpVertices[1].coordinate.x = srcRectangle.x + srcRectangle.w;
      tmpVertices[1].coordinate.y = srcRectangle.y;
      tmpVertices[2].coordinate.x = srcRectangle.x + srcRectangle.w;
      tmpVertices[2].coordinate.y = srcRectangle.y + srcRectangle.h;
      tmpVertices[3].coordinate.x = srcRectangle.x;
      tmpVertices[3].coordinate.y = srcRectangle.y + srcRectangle.h;
      for (var i = 0; i < 4; i++) {
        var vertex = WebGLCombinedBrush.tmpVertices[i];
        vertex.kind = WebGLCombinedBrushKind.FillTexture;
        vertex.color.set(color);
        vertex.sampler = sampler;
        vertex.writeTo(this.geometry);
      }
      this.geometry.addQuad();
      return true;
    }

    public fillRectangle(rectangle: Rectangle, color: Color, transform: Matrix) {
      transform.transformRectangle(rectangle, WebGLCombinedBrush.tmpVertices);
      for (var i = 0; i < 4; i++) {
        var vertex = WebGLCombinedBrush.tmpVertices[i];
        vertex.kind = WebGLCombinedBrushKind.FillColor;
        vertex.color.set(color);
        vertex.writeTo(this.geometry);
      }
      this.geometry.addQuad();
    }

    public draw() {
      var g = this.geometry;
      var p = this.program;
      var gl = this.context.gl;

      g.uploadBuffers();
      gl.useProgram(p);
      gl.uniform1f(p.uniforms.uZ.location, 1);
      gl.uniformMatrix3fv(p.uniforms.uTransformMatrix.location, false, Matrix.createIdentity().toWebGLMatrix());

      // Bind textures.
      for (var i = 0; i < this.textures.length; i++) {
        gl.activeTexture(gl.TEXTURE0 + i);
        gl.bindTexture(gl.TEXTURE_2D, this.textures[i]);
      }
      gl.uniform1iv(p.uniforms["uSampler[0]"].location, [0, 1, 2, 3, 4, 5, 6, 7]);
      // Bind vertex buffer.
      gl.bindBuffer(gl.ARRAY_BUFFER, g.buffer);
      var size = WebGLCombinedBrushVertex.attributeList.size;
      var attributeList = WebGLCombinedBrushVertex.attributeList;
      var attributes: WebGLAttribute [] = attributeList.attributes;
      for (var i = 0; i < attributes.length; i++) {
        var attribute = attributes[i];
        var position = p.attributes[attribute.name].location;
        gl.enableVertexAttribArray(position);
        gl.vertexAttribPointer(position, attribute.size, attribute.type, attribute.normalized, size, attribute.offset);
      }
      // Bind elements buffer.
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, g.elementBuffer);
      gl.drawElements(gl.TRIANGLES, g.triangleCount * 3, gl.UNSIGNED_SHORT, 0);
    }
  }
}