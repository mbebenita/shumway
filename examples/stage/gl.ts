/// <reference path='all.ts'/>
/// <reference path="WebGL.d.ts" />

module Shumway.GL {
  var release = false;
  import createQuadraticCurveVertices = Shumway.Geometry.Path.createQuadraticCurveVertices;
  import BufferWriter = Shumway.Util.BufferWriter;
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
      this.state.transform.transformRectangleAABB(r);
      this.geometry.addQuad(r.x, r.y, r.w, r.h);
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