/// <reference path='all.ts'/>
/// <reference path="WebGL.d.ts" />

module Shumway.GL {
  var traceLevel = 1;
  enum TraceLevel {
    None,
    Brief,
    Verbose,
  }
  var release = false;
  var writer = new IndentingWriter();

  import createQuadraticCurveVertices = Shumway.Geometry.Path.createQuadraticCurveVertices;
  import Point = Shumway.Geometry.Point;
  import Matrix = Shumway.Geometry.Matrix;
  import Rectangle = Shumway.Geometry.Rectangle;
  import RectanglePacker = Shumway.Geometry.RectanglePacker;

  import Frame = Shumway.Layers.Frame;
  import Stage = Shumway.Layers.Stage;
  import Bitmap = Shumway.Layers.Elements.Bitmap;
  import Flake = Shumway.Layers.Elements.Flake;
  import Video = Shumway.Layers.Elements.Video;

  var SHADER_ROOT = "shaders/";

  function endsWith(str, end) {
    return str.indexOf(end, this.length - end.length) !== -1;
  }

  class WebGLContextState {
    parent: WebGLContextState;
    transform: Matrix;
    constructor(parent: WebGLContextState = null) {
      this.parent = parent;
      if (parent) {
        this.transform = parent.transform.clone();
      } else {
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
    color: Color = new Color(0, 0, 0, 0);
    coordinate: Point = new Point(0, 0);
    constructor (x: number, y: number) {
      super(x, y);
    }
    static createEmptyVertices(count: number): Vertex [] {
      var result = [];
      for (var i = 0; i < count; i++) {
        result.push(new Vertex(0, 0));
      }
      return result;
    }
  }

  export class BufferWriter {
    u8: Uint8Array;
    u16: Uint16Array;
    i32: Int32Array;
    f32: Float32Array;
    u32: Uint32Array;
    offset: number;

    constructor(initialCapacity) {
      this.u8 = null;
      this.u16 = null;
      this.i32 = null;
      this.f32 = null;
      this.offset = 0;
      this.ensureCapacity(initialCapacity);
    }

    public reset() {
      this.offset = 0;
    }

    getIndex(size) {
      release || assert (size === 1 || size === 2 || size === 4 || size === 8 || size === 16);
      var index = this.offset / size;
      release || assert ((index | 0) === index);
      return index;
    }

    ensureCapacity(minCapacity: number) {
      if (!this.u8) {
        this.u8 = new Uint8Array(minCapacity);
      } else if (this.u8.length > minCapacity) {
        return;
      }
      var oldCapacity = this.u8.length;
      // var newCapacity = (((oldCapacity * 3) >> 1) + 8) & ~0x7;
      var newCapacity = oldCapacity * 2;
      if (newCapacity < minCapacity) {
        newCapacity = minCapacity;
      }
      var u8 = new Uint8Array(newCapacity);
      u8.set(this.u8, 0);
      this.u8 = u8;
      this.u16 = new Uint16Array(u8.buffer);
      this.i32 = new Int32Array(u8.buffer);
      this.f32 = new Float32Array(u8.buffer);
    }

    writeInt(v: number) {
      release || assert ((this.offset & 0x3) === 0);
      this.ensureCapacity(this.offset + 4);
      this.writeIntUnsafe(v);
    }

    writeIntUnsafe(v: number) {
      var index = this.offset >> 2;
      this.i32[index] = v;
      this.offset += 4;
    }

    writeFloat(v: number) {
      release || assert ((this.offset & 0x3) === 0);
      this.ensureCapacity(this.offset + 4);
      this.writeFloatUnsafe(v);
    }

    writeFloatUnsafe(v: number) {
      var index = this.offset >> 2;
      this.f32[index] = v;
      this.offset += 4;
    }

    ensureVertexCapacity(count: number) {
      release || assert ((this.offset & 0x3) === 0);
      this.ensureCapacity(this.offset + count * 8);
    }

    writeVertex(x: number, y: number) {
      release || assert ((this.offset & 0x3) === 0);
      this.ensureCapacity(this.offset + 8);
      this.writeVertexUnsafe(x, y);
    }

    writeVertexUnsafe(x: number, y: number) {
      var index = this.offset >> 2;
      this.f32[index] = x;
      this.f32[index + 1] = y;
      this.offset += 8;
    }

    writeTriangleElements(a: number, b: number, c: number) {
      release || assert ((this.offset & 0x1) === 0);
      this.ensureCapacity(this.offset + 6);
      var index = this.offset >> 1;
      this.u16[index] = a;
      this.u16[index + 1] = b;
      this.u16[index + 2] = c;
      this.offset += 6;
    }

    ensureColorCapacity(count: number) {
      release || assert ((this.offset & 0x2) === 0);
      this.ensureCapacity(this.offset + count * 16);
    }

    writeColor(r: number, g: number, b: number, a: number) {
      release || assert ((this.offset & 0x2) === 0);
      this.ensureCapacity(this.offset + 16);
      this.writeColorUnsafe(r, g, b, a);
    }

    writeColorUnsafe(r: number, g: number, b: number, a: number) {
      var index = this.offset >> 2;
      this.f32[index] = r;
      this.f32[index + 1] = g;
      this.f32[index + 2] = b;
      this.f32[index + 3] = a;
      this.offset += 16;
    }

    writeRandomColor() {
      this.writeColor(Math.random(), Math.random(), Math.random(), Math.random() / 2);
    }

    subF32View(): Float32Array {
      return this.f32.subarray(0, this.offset >> 2);
    }

    subU16View(): Uint16Array {
      return this.u16.subarray(0, this.offset >> 1);
    }

    hashWords(hash: number, offset: number, length: number) {
      var i32 = this.i32;
      for (var i = 0; i < length; i++) {
        hash = (((31 * hash) | 0) + i32[i]) | 0;
      }
      return hash;
    }
  }


  export class WebGLTextureAtlasLocation {
    atlas: WebGLTextureAtlas;
    region: Rectangle;
    constructor(atlas: WebGLTextureAtlas, region: Rectangle) {
      this.atlas = atlas;
      this.region = region;
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

    constructor(context: WebGLContext, w: number, h: number, solitary: boolean = false) {
      this._context = context;
      this.texture = context.createTexture(w, h, null);
      this._w = w;
      this._h = h;
      this._rectanglePacker = new RectanglePacker(w, h, solitary ? 0 : 2);
      this._solitary = solitary;
    }

    insert(image: any, w: number, h: number): Rectangle {
      var gl = this._context.gl;
      var region = this._rectanglePacker.insert(w, h);
      if (!region) {
        return;
      }
      gl.bindTexture(gl.TEXTURE_2D, this.texture);
      gl.texSubImage2D(gl.TEXTURE_2D, 0, region.x, region.y, gl.RGBA, gl.UNSIGNED_BYTE, image);
      return region;
    }

    update(image: any, region: Rectangle): Rectangle {
      var gl = this._context.gl;
      gl.bindTexture(gl.TEXTURE_2D, this.texture);
      gl.texSubImage2D(gl.TEXTURE_2D, 0, region.x, region.y, gl.RGBA, gl.UNSIGNED_BYTE, image);
      return region;
    }
  }

  export class WebGLContext {
    public gl: WebGLRenderingContext;

    private _canvas: HTMLCanvasElement;
    private _w: number;
    private _h: number;
    private _programCache: {};
    private _backgroundColor: number;
    private _jobQueue: Job [] = [];

    private _state: WebGLContextState = new WebGLContextState();
    private _geometry: WebGLGeometry;
    private _tmpVertices: Vertex [];
    private _fillColor: Color = Color.Red;

    private _textureAtlases: WebGLTextureAtlas [];

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

    private get currentJob(): Job {
      if (this._jobQueue.length === 0) {
        return null;
      }
      return this._jobQueue[this._jobQueue.length - 1];
    }

    constructor (canvas: HTMLCanvasElement) {
      this._canvas = canvas;
      this.gl = <WebGLRenderingContext>canvas.getContext("experimental-webgl", {
        // preserveDrawingBuffer: true,
        antialias: true,
        stencil: true
      });
      this._programCache = Object.create(null);
      this.gl.viewport(0, 0, this._w, this._h);
      this._w = canvas.width;
      this._h = canvas.height;
      this.updateViewport();
      this._backgroundColor = Shumway.Util.Color.parseColor(this._canvas.style.backgroundColor);
      this.clearRect(0, 0, this._w, this._h);

      this._geometry = new WebGLGeometry(this);
      this._tmpVertices = Vertex.createEmptyVertices(64);

      this._textureAtlases = [];

      this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
      this.gl.enable(this.gl.BLEND);
    }

    private loadImage(image: any, w: number, h: number, solitary: boolean, update: boolean): WebGLTextureAtlasLocation {
      var location: WebGLTextureAtlasLocation = image.textureAtlasLocation;
      if (location) {
        if (update) {
          location.atlas.update(image, location.region);
          traceLevel >= TraceLevel.Verbose && writer.writeLn("Updating Image: @ " + location.region);
        }
        return location;
      }
      var region: Rectangle, textureAtlas: WebGLTextureAtlas;
      if (!solitary) {
        for (var i = 0; i < this._textureAtlases.length; i++) {
          textureAtlas = this._textureAtlases[i];
          region = textureAtlas.insert(image, w, h);
          if (region) {
            break;
          }
        }
      }
      if (!region) {
        var aw = solitary ? w : 1024;
        var ah = solitary ? h : 1024;
        textureAtlas = new WebGLTextureAtlas(this, aw, ah, solitary);
        this._textureAtlases.push(textureAtlas);
        region = textureAtlas.insert(image, w, h);
        assert (region);
      }
      traceLevel >= TraceLevel.Verbose && writer.writeLn("Uploading Image: @ " + region);
      return (image.textureAtlasLocation = new WebGLTextureAtlasLocation(textureAtlas, region));
    }

    private freeImage(image: HTMLImageElement) {

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
      var key = vertex + fragment;
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

    createTexture(w: number, h: number, data): WebGLTexture {
      var gl = this.gl;
      var texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
      return texture;
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


    private beginJob(type) {
      if (this.currentJob) {
        if (this.currentJob instanceof type) {
          return;
        } else {
          this.currentJob.finish();
        }
      }
      this._geometry.resetElementOffset();
      this._jobQueue.push(new type(this, this._geometry, Matrix.createIdentity()));
    }

    public fillRect(x, y, w, h) {
      this.beginJob(Job.Fill);
      var r = new Rectangle(x, y, w, h);
      this._state.transform.transformRectangle(r, this._tmpVertices);
      for (var i = 0; i < 4; i++) {
        this._tmpVertices[i].color.set(this._fillColor);
      }
      this._geometry.addVertices(this._tmpVertices, 4);
      this._geometry.addQuad();
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

    public drawImage(image, w: number, h: number, solitary: boolean = false, update: boolean = false) {

      var location: WebGLTextureAtlasLocation = this.loadImage(image, w, h, solitary, update);

      var createNewJob = true;
      if (this.currentJob instanceof Job.FillTexture) {
        var currentJob = <Job.FillTexture>this.currentJob;
        if (!currentJob.canDraw([location.atlas.texture])) {
          createNewJob = false;
        }
      }

      if (createNewJob) {
        if (this.currentJob) {
          this.currentJob.finish();
        }
        this._geometry.resetElementOffset();
        this._jobQueue.push(new Job.FillTexture(this, this._geometry, Matrix.createIdentity(), [location.atlas.texture]));
      }


      var t = location.region.clone();
      t.scale(1 / location.atlas.w, 1 / location.atlas.h);
      var r = new Rectangle(0, 0, w, h);
      this._state.transform.transformRectangle(r, this._tmpVertices);
      this._tmpVertices[0].coordinate.x = t.x;
      this._tmpVertices[0].coordinate.y = t.y;
      this._tmpVertices[1].coordinate.x = t.x + t.w;
      this._tmpVertices[1].coordinate.y = t.y;
      this._tmpVertices[2].coordinate.x = t.x + t.w;
      this._tmpVertices[2].coordinate.y = t.y + t.h;
      this._tmpVertices[3].coordinate.x = t.x;
      this._tmpVertices[3].coordinate.y = t.y + t.h;
      this._geometry.addVertices(this._tmpVertices, 4);
      this._geometry.addQuad();
    }

    public beginPath() {

    }

    public closePath() {

    }

    public stroke() {

    }

    public rect() {

    }

    private clearRect(x, y, w, h) {
      var gl = this.gl;
      gl.enable(gl.SCISSOR_TEST);
      gl.scissor(x, this._h - y - h, w, h);
      gl.clearColor(this._backgroundColor[0], this._backgroundColor[1], this._backgroundColor[2], this._backgroundColor[3]);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.disable(gl.SCISSOR_TEST);
    }

    flush (draw: boolean) {
      this._geometry.uploadBuffers();
      if (this.currentJob) {
        this.currentJob.finish();
      }
      while (this._jobQueue.length) {
        this._jobQueue.shift().draw(draw);
      }
      this._geometry.clear();
    }
  }

  export class WebGLStageRenderer {
    context: WebGLContext;
    constructor(context: WebGLContext) {
      this.context = context;
    }
    public render(stage: Stage, draw: boolean) {
      var that = this;
      stage.visit(function (frame: Frame, transform?: Matrix) {
        that.context.setTransform(transform);
        if (frame instanceof Bitmap) {
          that.renderBitmap(<Bitmap>frame, transform);
        } else if (frame instanceof Flake) {
          that.renderFlake(<Flake>frame, transform);
        } else if (frame instanceof Video) {
          that.renderVideo(<Video>frame, transform);
        }
      }, stage.transform);
      this.context.flush(draw);
    }

    renderBitmap(source: Bitmap, transform: Matrix) {
      if (!source.image.complete) {
        return;
      }
      this.context.drawImage(source.image, source.image.width, source.image.height);
    }

    renderVideo(source: Video, transform: Matrix) {
      if (!(source.video.videoWidth && source.video.videoHeight)) {
        return;
      }
      this.context.drawImage(source.video, source.video.videoWidth, source.video.videoHeight, true);
    }

    renderFlake(flake: Flake, transform: Matrix) {
      this.context.fillStyle = flake.fillStyle;
      this.context.fillRect(0, 0, flake.w, flake.h);
    }
  }

  export class WebGLGeometryPosition {
    color: number;
    element : number;
    vertex : number;
    coordinate: number;
    triangles: number;
    constructor(triangles, element, vertex, coordinate, color) {
      this.triangles = triangles;
      this.element = element;
      this.vertex = vertex;
      this.coordinate = coordinate;
      this.color = color;
    }
    toString() {
      return "{" +
        "triangles: " + this.triangles + ", " +
        "element: " + this.element + ", " +
        "vertex: " + this.vertex + ", " +
        "coordinate: " + this.coordinate + ", " +
        "color: " + this.color + "}";
    }
  }

  export class WebGLGeometry {
    context: WebGLContext;

    elements: BufferWriter;
    elementBuffer: WebGLBuffer;

    vertices: BufferWriter;
    vertexBuffer: WebGLBuffer;

    coordinates: BufferWriter;
    coordinateBuffer: WebGLBuffer;

    colors: BufferWriter;
    colorBuffer: WebGLBuffer;

    triangleCount: number = 0;

    private _elementOffset: number = 0;


    constructor(context) {
      this.context = context;

      this.colors = new BufferWriter(8);
      this.vertices = new BufferWriter(8);
      this.elements = new BufferWriter(8);
      this.coordinates = new BufferWriter(8);

      this.colorBuffer = context.gl.createBuffer();
      this.vertexBuffer = context.gl.createBuffer();
      this.elementBuffer = context.gl.createBuffer();
      this.coordinateBuffer = context.gl.createBuffer();
    }

    public getPosition(): WebGLGeometryPosition {
      return new WebGLGeometryPosition (
        this.triangleCount,
        this.elements.offset,
        this.vertices.offset,
        this.coordinates.offset,
        this.colors.offset
      );
    }

    public clear() {
      this.elements.reset();
      this.vertices.reset();
      this.coordinates.reset();
      this.colors.reset();
      this.triangleCount = 0;
      this.resetElementOffset();
    }

    public resetElementOffset() {
      this._elementOffset = 0;
    }

    public addVertices(vertices: Vertex [], count: number = vertices.length) {
      this.vertices.ensureVertexCapacity(count);
      this.coordinates.ensureVertexCapacity(count);
      this.colors.ensureColorCapacity(count);
      for (var i = 0; i < count; i++) {
        var vertex = vertices[i];
        this.vertices.writeVertexUnsafe(vertex.x, vertex.y);
        this.coordinates.writeVertexUnsafe(vertex.coordinate.x, vertex.coordinate.y);
        this.colors.writeColorUnsafe(vertex.color.r, vertex.color.g, vertex.color.b, vertex.color.a);
      }
    }

    public addQuad() {
      var offset = this._elementOffset;
      this.elements.writeTriangleElements(offset, offset + 1, offset + 2);
      this.elements.writeTriangleElements(offset, offset + 2, offset + 3);
      this.triangleCount += 2;
      this._elementOffset += 4;
    }

    public addTriangle(a: number, b: number, c: number) {
      var offset = this._elementOffset;
      this.elements.writeTriangleElements(offset + a, offset + b, offset + c);
      this.triangleCount ++;
      this._elementOffset += 3;
    }

    public uploadBuffers() {
      var gl = this.context.gl;

      var vertices = this.vertices.subF32View();
      var coordinates = this.coordinates.subF32View();
      var colors = this.colors.subF32View();
      assert (vertices.length === coordinates.length);
      assert (vertices.length * 2 === colors.length);
      var elements = this.elements.subU16View();
      assert ((vertices.length % 2) === 0);
      assert ((elements.length % 3) === 0);

      if (!release) {
        for (var i = 0; i < elements.length; i++) {
          var element = elements[i];
          assert (element >= 0 && element < vertices.length);
        }
      }

      var usage = gl.DYNAMIC_DRAW;

      gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, vertices, usage);

      gl.bindBuffer(gl.ARRAY_BUFFER, this.coordinateBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, coordinates, usage);

      gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, colors, usage);

      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.elementBuffer);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, elements, usage);
    }
  }

  class Job {
    context: WebGLContext;
    program: WebGLProgram;
    transform: Matrix;
    geometry: WebGLGeometry;
    beginPosition: WebGLGeometryPosition;
    endPosition: WebGLGeometryPosition;

    constructor(context: WebGLContext, geometry: WebGLGeometry, transform: Matrix) {
      this.context = context;
      this.geometry = geometry;
      this.transform = transform;
      this.beginPosition = geometry.getPosition();
    }

    draw(draw: boolean) {
      var g = this.geometry;
      var gl = this.context.gl;
      gl.useProgram(this.program);
      gl.uniform1f(this.program.uniforms.uZ.location, 1);
      gl.uniformMatrix3fv(this.program.uniforms.uTransformMatrix.location, false, this.transform.toWebGLMatrix());

      gl.bindBuffer(gl.ARRAY_BUFFER, g.vertexBuffer);
      var position = this.program.attributes.aPosition.location;
      gl.enableVertexAttribArray(position);
      gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, this.beginPosition.vertex);

      gl.bindBuffer(gl.ARRAY_BUFFER, g.coordinateBuffer);
      var coordinate = this.program.attributes.aCoordinate.location;
      gl.enableVertexAttribArray(coordinate);
      gl.vertexAttribPointer(coordinate, 2, gl.FLOAT, false, 0, this.beginPosition.coordinate);

      gl.bindBuffer(gl.ARRAY_BUFFER, g.colorBuffer);
      var color = this.program.attributes.aColor.location;
      gl.enableVertexAttribArray(color);
      gl.vertexAttribPointer(color, 4, gl.FLOAT, false, 0, this.beginPosition.color);

      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, g.elementBuffer);

      var triangles = this.endPosition.triangles - this.beginPosition.triangles;
      gl.drawElements(gl.TRIANGLES, triangles * 3, gl.UNSIGNED_SHORT, this.beginPosition.element);
    }

    finish() {
      this.endPosition = this.geometry.getPosition();
    }
  }

  module Job {
    export class Fill extends Job {
      constructor(context: WebGLContext, geometry: WebGLGeometry, transform: Matrix) {
        super(context, geometry, transform);
        this.program = context.createProgramFromFiles("canvas.vert", "solid-fill.frag");
      }
    }

    export class FillTexture extends Job {
      textures: WebGLTexture [];
      constructor(context: WebGLContext, geometry: WebGLGeometry, transform: Matrix, textures: WebGLTexture []) {
        super(context, geometry, transform);
        this.program = context.createProgramFromFiles("canvas.vert", "identity.frag");
        this.transform = transform;
        this.textures = textures;
      }

      draw(draw: boolean) {
        var gl = this.context.gl;
        for (var i = 0; i < this.textures.length; i++) {
          gl.bindTexture(gl.TEXTURE_2D, this.textures[i]);
        }
        super.draw(draw);
      }

      canDraw(textures: WebGLTexture []): boolean {
        if (this.textures.length !== textures.length) {
          return false;
        }
        for (var i = 0; i < this.textures.length; i++) {
          if (this.textures[i] === textures[i]) {
            return false;
          }
        }
        return true;
      }
    }
  }
}