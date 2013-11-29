/// <reference path='all.ts'/>
/// <reference path="WebGL.d.ts" />

module Shumway.GL {
  var release = false;
  import createQuadraticCurveVertices = Shumway.Geometry.Path.createQuadraticCurveVertices;
  import Matrix = Shumway.Geometry.Matrix;
  import Rectangle = Shumway.Geometry.Rectangle;

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

  export class Vertex extends Shumway.Geometry.Point {
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

    writeColor(r: number, g: number, b: number, a: number) {
      release || assert ((this.offset & 0x2) === 0);
      this.ensureCapacity(this.offset + 16);
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

  export class WebGLContext {
    public gl: WebGLRenderingContext;

    private canvas: HTMLCanvasElement;
    private w: number;
    private h: number;
    private program: WebGLProgram;
    private programCache: {};
    private backgroundColor: number;
    private jobQueue: Job [] = [];

    private state: WebGLContextState = new WebGLContextState();

    private geometry: WebGLGeometry;

    private tmpVertices: Vertex [];

    get width(): number {
      return this.w;
    }

    set width(value: number) {
      this.w = value;
      this.updateViewport();
    }

    get height(): number {
      return this.h;
    }

    set height(value: number) {
      this.h = value;
      this.updateViewport();
    }

    constructor (canvas: HTMLCanvasElement) {
      this.canvas = canvas;
      this.gl = <WebGLRenderingContext>canvas.getContext("experimental-webgl", {
        // preserveDrawingBuffer: true,
        antialias: true,
        stencil: true
      });
      this.programCache = {};
      this.gl.viewport(0, 0, this.w, this.h);
      this.w = canvas.width;
      this.h = canvas.height;
      this.program = this.createProgramFromFiles("canvas.vert", "identity.frag");
      this.updateViewport();
      this.backgroundColor = Shumway.Util.Color.parseColor(this.canvas.style.backgroundColor);
      this.clearRect(0, 0, this.w, this.h);

      this.geometry = new WebGLGeometry(this);

      this.tmpVertices = Vertex.createEmptyVertices(4);
    }

    private updateViewport() {
      var gl = this.gl;
      gl.viewport(0, 0, this.w, this.h);
      gl.useProgram(this.program);
      gl.uniform2f(this.program.uniforms.uResolution.location, this.w, this.h);
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
      var program = this.programCache[key];
      if (!program) {
        program = this.createProgram([
          this.createShaderFromFile(vertex),
          this.createShaderFromFile(fragment)
        ]);
        this.queryProgramAttributesAndUniforms(program);
        this.programCache[key] = program;
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

    public fillRect(x, y, w, h) {
      var r = new Rectangle(x, y, w, h);
      this.state.transform.transformRectangle(r, this.tmpVertices);
      this.geometry.addVertices(this.tmpVertices);
    }

    public save() {
      this.state = new WebGLContextState(this.state);
    }

    public restore() {
      if (this.state.parent) {
        this.state = this.state.parent;
      }
    }

    public transform(a: number, b: number, c: number, d: number, tx: number, ty: number) {
      this.state.transform.transform(a, b, c, d, tx, ty);
    }

    public drawImage(image, dx, dy, dw, dh) {
      this.fillRect(dx, dy, image.width, image.height);
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
      gl.scissor(x, this.h - y - h, w, h);
      gl.clearColor(this.backgroundColor[0], this.backgroundColor[1], this.backgroundColor[2], this.backgroundColor[3]);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.disable(gl.SCISSOR_TEST);
    }

    flush () {
//      while (this.jobQueue.length) {
//        this.jobQueue.shift().draw();
//      }
      this.geometry.uploadBuffers();
      // this.jobQueue.push();
      new Draw(this, this.geometry, Matrix.createIdentity()).draw();
      this.geometry.clear();
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
      this.vertexCount = 0;
      this.triangleCount = 0;
    }

    public clear() {
      this.indices.reset();
      this.vertices.reset();
      this.coordinates.reset();
      this.colors.reset();
      this.triangleCount = this.vertexCount = 0;
    }

    public addVertices(vertices: Vertex []) {

      for (var i = 0; i < vertices.length; i++) {
        var vertex = vertices[i];
        this.vertices.writeVertex(vertex.x, vertex.y);
        this.coordinates.writeVertex(Math.random(), Math.random());
        this.colors.writeColor(1, 0, 0, 1);
      }

      var v = this.vertexCount;
      this.indices.writeTriangleIndices(v + 0, v + 1, v + 2);
      this.indices.writeTriangleIndices(v + 0, v + 2, v + 3);

      this.vertexCount += vertices.length;
      this.triangleCount += 2;
    }

    public addQuad(x, y, w, h) {
      this.vertices.writeVertex(x, y);
      this.vertices.writeVertex(x, y + h);
      this.vertices.writeVertex(x + w, y + h);
      this.vertices.writeVertex(x + w, y);

      this.coordinates.writeVertex(Math.random(), Math.random());
      this.coordinates.writeVertex(Math.random(), Math.random());
      this.coordinates.writeVertex(Math.random(), Math.random());
      this.coordinates.writeVertex(Math.random(), Math.random());

      this.colors.writeColor(1, 0, 0, 1);
      this.colors.writeColor(1, 0, 0, 1);
      this.colors.writeColor(1, 0, 0, 1);
      this.colors.writeColor(1, 0, 0, 1);

      var v = this.vertexCount;
      this.indices.writeTriangleIndices(v + 0, v + 1, v + 2);
      this.indices.writeTriangleIndices(v + 0, v + 2, v + 3);

      this.vertexCount += 4;
      this.triangleCount += 2;
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
    draw() {

    }
  }

  class Draw extends Job {
    program: WebGLProgram;
    geometry: WebGLGeometry;
    transform: Matrix;
    constructor(context: WebGLContext, geometry: WebGLGeometry, transform: Matrix) {
      super(context);
      this.program = context.createProgramFromFiles("canvas.vert", "identity.frag");
      this.geometry = geometry;
      this.transform = transform;
    }
    draw() {
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