/// <reference path='all.ts'/>
/// <reference path="WebGL.d.ts" />

interface HTMLImageElement {
  textureAtlasLocation: Shumway.GL.TextureAtlasLocation
}

module Shumway.GL {
  var traceLevel = 1;
  enum TraceLevel {
    None,
    Brief
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
  import Bitmap = Shumway.Layers.Elements.Bitmap;
  import Flake = Shumway.Layers.Elements.Flake;

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

    writeTriangleIndices(a: number, b: number, c: number) {
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

  export class WebGLTextureAtlas {
    private _context: WebGLContext;
    private _texture: WebGLTexture;
    private _rectanglePacker: RectanglePacker;
    private _w: number;
    private _h: number;

    get w(): number {
      return this._w;
    }

    get h(): number {
      return this._h;
    }

    constructor(context: WebGLContext, texture: WebGLTexture, w: number, h: number) {
      this._context = context;
      this._texture = texture;
      this._w = w;
      this._h = h;
      this._rectanglePacker = new RectanglePacker(w, h);
    }

    load(image: HTMLImageElement): Point {
      var gl = this._context.gl;
      var coordinates = this._rectanglePacker.insert(image.width, image.height);
      if (!coordinates) {
        return;
      }
      gl.bindTexture(gl.TEXTURE_2D, this._texture);
      gl.texSubImage2D(gl.TEXTURE_2D, 0, coordinates.x, coordinates.y, gl.RGBA, gl.UNSIGNED_BYTE, image);
      return coordinates;
    }
  }

  export interface TextureAtlasLocation {
    atlas: WebGLTextureAtlas;
    position: Point;
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

    private loadImage(image: HTMLImageElement) {
      if (image.textureAtlasLocation) {
        return image.textureAtlasLocation;
      }
      var textureAtlasPosition, textureAtlas;
      for (var i = 0; i < this._textureAtlases.length; i++) {
        textureAtlasPosition = this._textureAtlases[i].load(image);
        if (textureAtlasPosition) {
          break;
        }
      }
      if (!textureAtlasPosition) {
        assert (this._textureAtlases.length < 4);
        textureAtlas = new WebGLTextureAtlas(this, this.createTexture(1024, 1024, null), 1024, 1024);
        this._textureAtlases.push(textureAtlas);
        textureAtlasPosition = textureAtlas.load(image);
        assert (textureAtlasPosition);
      }
      traceLevel >= TraceLevel.Brief && writer.writeLn("Uploading Image: w: " + image.width + ", h: " + image.height + " @ " + textureAtlasPosition);
      return (image.textureAtlasLocation = {atlas: textureAtlas, position: textureAtlasPosition});
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

    private createTexture (w: number, h: number, data): WebGLTexture {
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


    private beginFillJob() {
      if (this.currentJob) {
        if (this.currentJob instanceof Job.Fill) {
          return;
        } else {
          this.currentJob.finish();
        }
      }
      this._jobQueue.push(new Job.Fill(this, this._geometry, Matrix.createIdentity()));
    }

    public fillRect(x, y, w, h) {
      this.beginFillJob();
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

    public drawImage(image, dx, dy, dw, dh) {
//      if (!image.complete) {
//        return;
//      }
//      var location: TextureAtlasLocation = this.loadImage(image);
//      var tw = location.atlas.w;
//      var th = location.atlas.h;
//
//      var x = dx, y = dy, w = image.width, h = image.height;
//      var r = new Rectangle(x, y, w, h);
//      this._state.transform.transformRectangle(r, this._tmpVertices);
//      for (var i = 0; i < 4; i++) {
//        this._tmpVertices[i].color = this._fillColor;
//        this._tmpVertices[i].color = Color.None;
//      }
//      var p = location.position;
//      this._tmpVertices[0].coordinate.x = p.x / tw;
//      this._tmpVertices[0].coordinate.y = p.y / th;
//
//      this._tmpVertices[1].coordinate.x = p.x / tw;
//      this._tmpVertices[1].coordinate.y = (h + p.y) / th;
//
//      this._tmpVertices[2].coordinate.x = (w + p.x) / tw;
//      this._tmpVertices[2].coordinate.y = (h + p.y) / th;
//
//      this._tmpVertices[3].coordinate.x = (w + p.x) / tw;
//      this._tmpVertices[3].coordinate.y = p.y / th;
//
//      this._geometry.addVertices(this._tmpVertices);
//      this._geometry.addQuad();
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
          // that.renderBitmap(<Bitmap>frame, transform);
        } else if (frame instanceof Flake) {
          that.renderFlake(<Flake>frame, transform);
        }
      }, stage.transform);
      this.context.flush(draw);
    }

    renderBitmap(bitmap: Bitmap, transform: Matrix) {
      this.context.drawImage(bitmap.image, 0, 0, 0, 0);
    }

    renderFlake(flake: Flake, transform: Matrix) {
      this.context.fillStyle = flake.fillStyle;
      this.context.fillRect(0, 0, flake.w, flake.h);
    }
  }

  export class WebGLGeometry {
    context: WebGLContext;
    indices: BufferWriter;
    vertices: BufferWriter;
    coordinates: BufferWriter;
    colors: BufferWriter;
    indexBuffer: WebGLBuffer;
    vertexBuffer: WebGLBuffer;
    coordinatesBuffer: WebGLBuffer;
    colorBuffer: WebGLBuffer;
    vertexCount: number = 0;
    vertexOffset: number = 0;
    triangleCount: number = 0;

    constructor(context) {
      this.context = context;
      this.indices = new BufferWriter(8);
      this.vertices = new BufferWriter(8);
      this.coordinates = new BufferWriter(8);
      this.colors = new BufferWriter(8);

      this.indexBuffer = context.gl.createBuffer();
      this.vertexBuffer = context.gl.createBuffer();
      this.coordinatesBuffer = context.gl.createBuffer();
      this.colorBuffer = context.gl.createBuffer();
    }

    public clear() {
      this.indices.reset();
      this.vertices.reset();
      this.coordinates.reset();
      this.colors.reset();
      this.triangleCount = this.vertexCount = this.vertexOffset = 0;
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
      this.vertexCount += count;
    }

    public addQuad() {
      assert (this.vertexOffset + 3 < this.vertexCount);
      var offset = this.vertexOffset;
      this.indices.writeTriangleIndices(offset, offset + 1, offset + 2);
      this.indices.writeTriangleIndices(offset, offset + 2, offset + 3);
      this.triangleCount += 2;
      this.vertexOffset += 4;
    }

    public addTriangle(a: number, b: number, c: number) {
      assert (this.vertexOffset + 3 < this.vertexCount);
      var offset = this.vertexOffset;
      this.indices.writeTriangleIndices(offset + a, offset + b, offset + c);
      this.triangleCount ++;
      this.vertexOffset += 3;
    }

    public uploadBuffers() {
      var gl = this.context.gl;

      var vertices = this.vertices.subF32View();
      var coordinates = this.coordinates.subF32View();
      var colors = this.colors.subF32View();
      assert (vertices.length === coordinates.length);
      assert (vertices.length * 2 === colors.length);
      var indices = this.indices.subU16View();
      assert ((vertices.length % 2) === 0);
      assert ((indices.length % 3) === 0);

      if (!release) {
        for (var i = 0; i < indices.length; i++) {
          var index = indices[i];
          assert (index >= 0 && index < vertices.length);
        }
      }

      var usage = gl.DYNAMIC_DRAW;

      gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, vertices, usage);

      gl.bindBuffer(gl.ARRAY_BUFFER, this.coordinatesBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, coordinates, usage);

      gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, colors, usage);

      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, usage);
    }
  }

  class Job {
    context: WebGLContext;
    constructor(context: WebGLContext) {
      this.context = context;
    }
    draw(draw: boolean) {

    }
    finish() {
      notImplemented("finish");
    }
  }

  module Job {
    export class Fill extends Job {
      program: WebGLProgram;
      geometry: WebGLGeometry;
      transform: Matrix;
      constructor(context: WebGLContext, geometry: WebGLGeometry, transform: Matrix) {
        super(context);
        this.program = context.createProgramFromFiles("canvas.vert", "solid-fill.frag");
        this.geometry = geometry;
        this.transform = transform;
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
        gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, g.coordinatesBuffer);
        var coordinate = this.program.attributes.aCoordinate.location;
        gl.enableVertexAttribArray(coordinate);
        gl.vertexAttribPointer(coordinate, 2, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, g.colorBuffer);
        var color = this.program.attributes.aColor.location;
        gl.enableVertexAttribArray(color);
        gl.vertexAttribPointer(color, 4, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, g.indexBuffer);

        if (draw) {
          gl.drawElements(gl.TRIANGLES, g.triangleCount * 3, gl.UNSIGNED_SHORT, 0);
        }
      }
    }

    export class Draw extends Job {
      program: WebGLProgram;
      geometry: WebGLGeometry;
      transform: Matrix;
      constructor(context: WebGLContext, geometry: WebGLGeometry, transform: Matrix) {
        super(context);
        this.program = context.createProgramFromFiles("canvas.vert", "identity.frag");
        this.geometry = geometry;
        this.transform = transform;
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
        gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, g.coordinatesBuffer);
        var coordinate = this.program.attributes.aCoordinate.location;
        gl.enableVertexAttribArray(coordinate);
        gl.vertexAttribPointer(coordinate, 2, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, g.colorBuffer);
        var color = this.program.attributes.aColor.location;
        gl.enableVertexAttribArray(color);
        gl.vertexAttribPointer(color, 4, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, g.indexBuffer);

        gl.drawElements(gl.TRIANGLES, g.triangleCount * 3, gl.UNSIGNED_SHORT, 0);
      }
    }
  }
}