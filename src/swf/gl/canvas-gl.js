var webGLOptions = coreOptions.register(new OptionSet("WebGL Options"));

var CanvasWebGLContext = CanvasWebGLContext || (function (document, undefined) {

  var TRACE_OFF = 0;
  var TRACE_BRIEF = 1;
  var TRACE_VERBOSE = 2;
  
  var traceOption = webGLOptions.register(new Option("", "trace", "number", 0, "trace commands", {off: TRACE_OFF, brief: TRACE_BRIEF, verbose: TRACE_VERBOSE}));
  
  var blendOption = webGLOptions.register(new Option("", "blend", "boolean", true, "enables blending"));
  var alphaOption = webGLOptions.register(new Option("", "alpha", "boolean", false, "makes all colors transparent"));
  var tessellatorOption = webGLOptions.register(new Option("", "tessellator", "boolean", false, "tessellate with glu tessellator"));
  var cacheTessellationOption = webGLOptions.register(new Option("", "cacheTessellation", "boolean", true, "cache tessellations"));
  var stencilOption = webGLOptions.register(new Option("", "stencilOption", "boolean", false, "cache tessellations"));

  var drawOption = webGLOptions.register(new Option("", "draw", "boolean", true, "draw"));

  var nativeGetContext = HTMLCanvasElement.prototype.getContext;

  HTMLCanvasElement.prototype.getContext = function getContext(contextId, args) {
    if (contextId !== "2d.gl") {
      return nativeGetContext.call(this, contextId, args);
    }
    return new CanvasWebGLContext(this);
  };

  var Rectangle = (function () {
    function rectangle(x, y, width, height) {
      this.x = x;
      this.y = y;
      this.width = width;
      this.height = height;
      this.transform = new Float32Array(6);
    }
    rectangle.prototype.setTransform = function setTransform(m11, m12, m21, m22, dx, dy) {
      var m = this.transform;
      m[0] = m11;
      m[1] = m12;
      m[2] = m21;
      m[3] = m22;
      m[4] = dx;
      m[5] = dy;
    };
    rectangle.prototype.clone = function clone() {
      return new Rectangle(this.x, this.y, this.width, this.height);
    };
    rectangle.prototype.scale = function scale(s) {
      this.x *= s;
      this.y *= s;
      this.width *= s;
      this.height *= s;
    };
    return rectangle;
  })();

  var CanvasWebGLContext = (function () {
    function matrixTranspose(r, c, m) {
      assert (r * c === m.length);
      var result = new Float32Array(m.length);
      for (var i = 0; i < r; i++) {
        for (var j = 0; j < c; j++) {
          result[j * r + i] = m[i * c + j];
        }
      }
      return result;
    }

    function makeTranslation(tx, ty) {
      return matrixTranspose(3, 3, [
        1, 0, tx,
        0, 1, ty,
        0, 0, 1
      ]);
    }

    function makeRotationX(r) {
      return matrixTranspose(3, 3, [
        1, 0, 0,
        0, Math.cos(r), -Math.sin(r),
        0, Math.sin(r),  Math.cos(r)
      ]);
    }



    var writer = new IndentingWriter(false, function (str) {
      console.log(str);
    });

    var shaderRoot = "../../src/swf/gl/shaders/";

    function canvasWebGLContext(canvas) {
      this.isGlContext = true;
      this.canvas = canvas;
      this._width = canvas.width;
      this._height = canvas.height;
      this._currentTransformStack = new Float32Array(6 * 1024);
      this._currentTransformStackIndex = 0;
      this.resetTransform();
      var gl = this._gl = canvas.getContext("experimental-webgl", {
        preserveDrawingBuffer: true,
        antialias: true,
        stencil: true
      });
      assert (gl);
      this._gl.viewport(0, 0, this._width, this._height);
      this._vertexShader = this._createShaderFromFile(shaderRoot + "canvas.vert");
      this._fragmentShader = this._createShaderFromFile(shaderRoot + "identity.frag");

      this._program = this._createProgram([this._vertexShader, this._fragmentShader]);
      this._queryProgramAttributesAndUniforms(this._program);

      gl.useProgram(this._program);
      gl.uniform2f(this._program.uniforms.uResolution.location, this._width, this._height);
      gl.uniformMatrix3fv(this._program.uniforms.uTransformMatrix.location, false, makeTranslation(0, 0));

      this._colorGLBuffer = gl.createBuffer();
      this._positionGLBuffer = gl.createBuffer();
      this._coordinateGLBuffer = gl.createBuffer();

      this._colorBuffer = new Float32Array(1024 * 1024);
      this._colorBufferIndex = 0;
      this._positionBuffer = new Float32Array(1024 * 1024);
      this._positionBufferIndex = 0;
      this._coordinateBuffer = new Float32Array(1024 * 1024);
      this._coordinateBufferIndex = 0;

      this._pathBuffer = new ArrayBuffer(1024 * 1024);
      this._pathBufferI32 = new Int32Array(this._pathBuffer);
      this._pathBufferF32 = new Float32Array(this._pathBuffer);
      this._pathBufferIndex = 0;
      this._pathCurrentX = 0;
      this._pathCurrentY = 0;

      this._scratchCanvas = window.document.createElement("canvas");
      this._scratchCanvas.width = 128;
      this._scratchCanvas.height = 128;
      this._scratchContext = this._scratchCanvas.getContext("2d");

      this._texture = this._createTexture(1024, 1024, null);
      this._texturePacker = new Packer(1024, 1024);
      this._texturePacker.insert(1, 1);
      this._fillStyle = "#000000";
    }

    var MOVE_TO = 0x01;
    var LINE_TO = 0x02;
    var CLOSE_PATH = 0x04;

    canvasWebGLContext.prototype._bufferPathCommand = function _bufferPathCommand(command, a, b, c, d) {
      var i32 = this._pathBufferI32;
      var f32 = this._pathBufferF32;
      var index = this._pathBufferIndex;
      switch (command) {
        case MOVE_TO:
        case LINE_TO:
          i32[index++] = command;
          f32[index++] = a;
          f32[index++] = b;
          this._transformVertices(f32, index - 2, 2);
          break;
        case CLOSE_PATH:
          i32[index++] = command;
          break;
      }
      this._pathBufferIndex = index;
    }

    function computeAABB(position, index, length) {
      var minX = Number.MAX_VALUE, minY = Number.MAX_VALUE;
      var maxX = Number.MIN_VALUE, maxY = Number.MIN_VALUE;
      var x = 0, y = 0;
      for (var i = 0, j = length * 2; i < j; i += 2) {
        x = position[index + i];
        y = position[index + i + 1];
        if (minX > x) minX = x;
        if (minY > y) minY = y;
        if (maxX < x) maxX = x;
        if (maxY < y) maxY = y;
      }
      return {x: minX, y: minY, width: maxX - minX, height: maxY - minY};
    }

    /**
     * @returns {Rectangle}
     */
    canvasWebGLContext.prototype._loadTexture = function (image) {
      var gl = this._gl;
      if (image.coordinates) {
//        gl.bindTexture(gl.TEXTURE_2D, this._texture);
//        gl.texSubImage2D(gl.TEXTURE_2D, 0, image.coordinates.x, image.coordinates.y, gl.RGBA, gl.UNSIGNED_BYTE, image);
        return image.coordinates;
      }
      var insertedAt = this._texturePacker.insert(image.width, image.height);
      image.coordinates = new Rectangle(insertedAt.x, insertedAt.y, image.width, image.height);
      gl.bindTexture(gl.TEXTURE_2D, this._texture);
      gl.texSubImage2D(gl.TEXTURE_2D, 0, insertedAt.x, insertedAt.y, gl.RGBA, gl.UNSIGNED_BYTE, image);
      writer.writeLn("_loadTexture " + JSON.stringify(image.coordinates));
      return image.coordinates;
    };

    canvasWebGLContext.prototype._tessellateCurrentPathBufferFill = function _tessellateCurrentPathBufferFill(result, index) {
      if (tessellatorOption.value) {
        return this._gluTessellateCurrentPathBufferFill(result, index);
      }
      var i32 = this._pathBufferI32;
      var f32 = this._pathBufferF32;
      var ox = 0, oy = 0;
      var lx = 0, ly = 0;
      var cx = 0, cy = 0;
      var cpx = 0, cpy = 0;
      var first = true;
      var triangles = 0;
      var i = 0;
      while (i < this._pathBufferIndex) {
        var command = i32[i++];
        switch (command) {
          case MOVE_TO:
            ox = f32[i++];
            oy = f32[i++];
            first = true;
            break;
          case LINE_TO:
            cx = f32[i++];
            cy = f32[i++];
            if (first) {
              first = false;
            } else {
              result[index ++] = ox;
              result[index ++] = oy;
              result[index ++] = lx;
              result[index ++] = ly;
              result[index ++] = cx;
              result[index ++] = cy;
              triangles ++;
            }
            lx = cx; ly = cy;
            break;
        }
      }
      return triangles;
    };

    function hashFeatures(features) {
      return hashArray(features, 0, features.length);
    }

    function hashPolygonLoop(loop) {
      var v = loop;
      var a = [];
      var sum = (v[0] + v[2]) * (v[1] - v[3]);
      for (var i = 2; i < v.length; i += 2) {
        sum += (v[i - 2] + v[i]) * (v[i - 1] - v[i + 1]);
        a.push(sum + (v[i] + v[1]) * (v[i + 1] - v[1]));
      }
      var c = a.pop();
      for (var i = 0; i < a.length; i++) {
        a[i] /= c;
      }
      return hashFeatures(new Float32Array(a));
    }

    function hashPolygon(polygon) {
      var hashes = new Int32Array(polygon.length);
      for (var i = 0; i < polygon.length; i++) {
        hashes[i] = hashPolygonLoop(polygon[i]);
      }
      return hashArray(hashes, 0, hashes.length);
    }

    var tessellationCache = createEmptyObject();
    canvasWebGLContext.prototype._gluTessellate = function _gluTessellate(polygon) {
      if (cacheTessellationOption.value) {
        var hash = hashPolygon(polygon);
        if (tessellationCache[hash]) {
          return tessellationCache[hash];
        }
        console.info("Caching Tessellation: " + hash);
        var tessellation = tessellationCache[hash] = tessellate(polygon);
        return tessellation
      }
      return tessellate(polygon);
    };

    canvasWebGLContext.prototype._gluTessellateCurrentPathBufferFill = function _gluTessellateCurrentPathBufferFill(result, index) {
      var i32 = this._pathBufferI32;
      var f32 = this._pathBufferF32;

      var polygon = [];
      var loop;
      var i = 0;
      while (i < this._pathBufferIndex) {
        var command = i32[i++];
        switch (command) {
          case MOVE_TO:
            if (loop) {
              polygon.push(loop);
            }
            loop = [];
            loop.push(f32[i++]);
            loop.push(f32[i++]);
            break;
          case LINE_TO:
            loop.push(f32[i++]);
            loop.push(f32[i++]);
            break;
        }
      }
      assert (loop);

      polygon.push(new Float32Array(loop));

      var tessellation = this._gluTessellate(polygon);
      var triangles = tessellation.triangles;
      var vertices = tessellation.vertices;

      for (var i = 0; i < triangles.length; i += 3) {
        var v0 = triangles[i] * 2;
        var v1 = triangles[i + 1] * 2;
        var v2 = triangles[i + 2] * 2;
        result[index + 0] = vertices[v0 + 0];
        result[index + 1] = vertices[v0 + 1];
        result[index + 2] = vertices[v1 + 0];
        result[index + 3] = vertices[v1 + 1];
        result[index + 4] = vertices[v2 + 0];
        result[index + 5] = vertices[v2 + 1];
        index += 6;
      }

      return triangles.length / 3;
    };

    canvasWebGLContext.prototype._mapTexture = function  _mapTexture(result, resultIndex, position, positionIndex, length, bounds) {
      traceOption.value >= TRACE_VERBOSE && writer.writeLn("_mapTexture " + toSafeArrayString(arguments));
      var transform = new Float32Array(6);
      copyBuffer(transform, 0, this._currentTransformStack, this._currentTransformStackIndex, 6);
      invertTransform(transform, 0);
      copyBuffer(result, resultIndex, position, positionIndex, length * 2);
      transformVertices(result, resultIndex, transform, 0, length);
      for (var i = 0; i < length  * 2; i += 2) {
        result[resultIndex + i] = (result[resultIndex + i] + bounds.x) / 1024;
        result[resultIndex + i + 1] = (result[resultIndex + i + 1] + bounds.y) / 1024;
      }
    };

    canvasWebGLContext.prototype._mapTexture2 = function  _mapTexture(result, resultIndex, position, positionIndex, length, bounds) {
      traceOption.value >= TRACE_VERBOSE && writer.writeLn("_mapTexture " + toSafeArrayString(arguments));
      var transform = new Float32Array(6);
      for (var i = 0; i < length  * 2; i += 2) {
        result[resultIndex + i] = (result[resultIndex + i] + bounds.x) / 1024;
        result[resultIndex + i + 1] = (result[resultIndex + i + 1] + bounds.y) / 1024;
      }
    };

    canvasWebGLContext.prototype._clearPathBuffer = function _clearPathBuffer() {
      this._pathBufferIndex = 0;
    };

    canvasWebGLContext.prototype._updateViewport = function () {
      var gl = this._gl;
      gl.viewport(0, 0, this._width, this._height);
      gl.useProgram(this._program);
      gl.uniform2f(this._program.uniforms.uResolution.location, this._width, this._height);
    };

    Object.defineProperty(canvasWebGLContext.prototype, "width", {
      get: function () {
        return this._width;
      },
      set: function (width) {
        this._width = width;
        this._updateViewport();
      }
    });

    Object.defineProperty(canvasWebGLContext.prototype, "height", {
      get: function () {
        return this._height;
      },
      set: function (height) {
        this._height = height;
        this._updateViewport();
      }
    });

    Object.defineProperty(canvasWebGLContext.prototype, "fillStyle", {
      get: function () {
        return this._fillStyle;
      },
      set: function (fillStyle) {
        traceOption.value >= TRACE_VERBOSE && writer.writeLn("fillStyle " + toSafeArrayString(arguments));
        this._fillStyle = fillStyle;
      }
    });

    canvasWebGLContext.prototype._createShaderFromFile = function _createShaderFromFile(file) {
      var gl = this._gl;
      var request = new XMLHttpRequest();
      request.open("GET", file, false);
      request.send();
      assert (request.status === 200, "File : " + file + " not found.");
      var shaderType;
      if (file.endsWith(".vert")) {
        shaderType = gl.VERTEX_SHADER;
      } else if (file.endsWith(".frag")) {
        shaderType = gl.FRAGMENT_SHADER;
      } else {
        throw "Shader Type: not supported.";
      }
      return this._createShader(shaderType, request.responseText);
    };

    canvasWebGLContext.prototype._createProgram = function _createProgram(shaders) {
      var gl = this._gl;
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
    };

    canvasWebGLContext.prototype._createShader = function _createShader(shaderType, shaderSource) {
      var gl = this._gl;
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
    };

    canvasWebGLContext.prototype._queryProgramAttributesAndUniforms = function _queryProgramAttributesAndUniforms(program) {
      program.uniforms = {};
      program.attributes = {};

      var gl = this._gl;
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
    };

    canvasWebGLContext.prototype._createTexture = function _createTexture(width, height, data) {
      var gl = this._gl;
      var texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
      return texture;
    };

    canvasWebGLContext.prototype.resetTransform = function resetTransform() {
      this.setTransform(1, 0, 0, 1, 0, 0);
    };

    var Transform = function (a, b, c, d, e, f) {
      this.a = a;
      this.b = b;
      this.c = c;
      this.d = d;
      this.e = e;
      this.f = f;
    }

    Object.defineProperty(canvasWebGLContext.prototype, "currentTransform", {
      get: function() {
        var m = this._currentTransformStack;
        var o = this._currentTransformStackIndex;
        return new Transform (
          m[o + 0],
          m[o + 1],
          m[o + 2],
          m[o + 3],
          m[o + 4],
          m[o + 5]
         );
      },
      set: function(transform) {
        notImplemented("set currentTransform");
      }
    });

    canvasWebGLContext.prototype.drawImage = function drawImage(image, dx, dy, dw, dh) {
      traceOption.value >= TRACE_VERBOSE && writer.writeLn("drawImage " + toSafeArrayString(arguments));
      if (image.width === 0 || image.height === 0) {
        writer.writeLn("drawImage Empty Image");
        return;
      }
      var gl = this._gl;
      this._createTransformedRectangleVertices(this._positionBuffer, this._positionBufferIndex, dx, dy, dw, dh);
      var bounds = this._loadTexture(image).clone();
      bounds.scale(1 / 1024);
      createRectangleVertices(this._coordinateBuffer, this._coordinateBufferIndex, bounds.x, bounds.y, bounds.width, bounds.height);
      this._positionBufferIndex += 12;
      var color = RED;
      for (var i = 0; i < 6; i++) {
        this._colorBuffer.set(color, this._colorBufferIndex);
        this._colorBufferIndex += 4;
      }
      this._coordinateBufferIndex += 12;
    }

    canvasWebGLContext.prototype.setTransform = function setTransform(m11, m12, m21, m22, dx, dy) {
      traceOption.value >= TRACE_VERBOSE && writer.writeLn("setTransform " + toSafeArrayString(arguments));
      var m = this._currentTransformStack;
      var o = this._currentTransformStackIndex;
      m[o + 0] = m11;
      m[o + 1] = m12;
      m[o + 2] = m21;
      m[o + 3] = m22;
      m[o + 4] = dx;
      m[o + 5] = dy;
    };

    canvasWebGLContext.prototype.save = function save() {
      traceOption.value >= TRACE_VERBOSE && writer.enter("save");
      var m = this._currentTransformStack;
      var o = this._currentTransformStackIndex;
      m[o + 6]  = m[o + 0];
      m[o + 7]  = m[o + 1];
      m[o + 8]  = m[o + 2];
      m[o + 9]  = m[o + 3];
      m[o + 10] = m[o + 4];
      m[o + 11] = m[o + 5];
      this._currentTransformStackIndex = o + 6;
    };

    canvasWebGLContext.prototype.restore = function restore() {
      traceOption.value >= TRACE_VERBOSE && writer.leave("restore");
      this._currentTransformStackIndex -= 6;
    };

    canvasWebGLContext.prototype.beginPath = function beginPath() {
      traceOption.value >= TRACE_VERBOSE && writer.writeLn("beginPath " + toSafeArrayString(arguments));
      this._clearPathBuffer();
    };

    canvasWebGLContext.prototype.closePath = function closePath() {
      traceOption.value >= TRACE_VERBOSE && writer.writeLn("closePath " + toSafeArrayString(arguments));
      this._bufferPathCommand(CLOSE_PATH);
      this._clearPathBuffer();
    };

    canvasWebGLContext.prototype.clip = function clip() {
      traceOption.value >= TRACE_VERBOSE && writer.writeLn("clip " + toSafeArrayString(arguments));
    };

    canvasWebGLContext.prototype.fill = function fill() {
      traceOption.value >= TRACE_VERBOSE && writer.writeLn("fill " + toSafeArrayString(arguments));
      var triangles = this._tessellateCurrentPathBufferFill(this._positionBuffer, this._positionBufferIndex);
      var vertices = triangles * 3;
      if (this._fillStyle && this._fillStyle.image) {
        var bounds = this._loadTexture(this._fillStyle.image).clone();
        this._mapTexture(this._coordinateBuffer, this._coordinateBufferIndex, this._positionBuffer, this._positionBufferIndex, vertices, bounds);
      }
      var color = parseFillColor(this._fillStyle);
      this._coordinateBufferIndex += vertices * 2;
      this._positionBufferIndex += vertices * 2;
      for (var i = 0; i < vertices; i++) {
        this._colorBuffer.set(color, this._colorBufferIndex);
        this._colorBufferIndex += 4;
      }
    };

    canvasWebGLContext.prototype.stroke = function stroke() {
      var gl = this._gl;
      traceOption.value >= TRACE_VERBOSE && writer.writeLn("stroke " + toSafeArrayString(arguments));
    };

    canvasWebGLContext.prototype.transform = function transform(m11, m12, m21, m22, dx, dy) {
      traceOption.value >= TRACE_VERBOSE && writer.writeLn("transform " + toSafeArrayString(arguments));
      var m = this._currentTransformStack;
      var o = this._currentTransformStackIndex;
      this.setTransform(
        m[o + 0] * m11 + m[o + 2] * m12,
        m[o + 1] * m11 + m[o + 3] * m12,
        m[o + 0] * m21 + m[o + 2] * m22,
        m[o + 1] * m21 + m[o + 3] * m22,
        m[o + 0] *  dx + m[o + 2] * dy + m[o + 4],
        m[o + 1] *  dx + m[o + 3] * dy + m[o + 5]
      );
    };

    canvasWebGLContext.prototype._transformVertices = function(result, index, length) {
      transformVertices(result, index, this._currentTransformStack, this._currentTransformStackIndex, length);
    };

    canvasWebGLContext.prototype._createTransformedRectangleVertices = function(result, index, x, y, w, h) {
      createRectangleVertices(result, index, x, y, w, h);
      this._transformVertices(result, index, 6);
    };

    var colorCache;

    function randomColor() {
      if (!colorCache) {
        colorCache = [];
        for (var i = 0; i < 10; i++) {
          var color = parseColor(randomStyle());
          color[3] = 0.1;
          colorCache.push(color);
        }
      }
      return colorCache[(Math.random() * colorCache.length) | 0];
    }

    var nextColorCount = 0;

    function nextColor() {
      randomColor();
      return colorCache[nextColorCount ++ % colorCache.length];
    }

    var BLACK = new Float32Array([0, 0, 0, 0]);
    var RED = new Float32Array([1, 0, 0, 0.5]);

    function parseFillColor(color) {
      color = parseColor(color);
      if (alphaOption.value) {
        var alpha = new Float32Array(4);
        alpha.set(color, 0);
        alpha[3] /= 2;
        color = alpha;
      }
      return color;
    }

    canvasWebGLContext.prototype.fillRect = function fillRect(x, y, w, h) {
      traceOption.value >= TRACE_VERBOSE && writer.writeLn("fillRect " + toSafeArrayString(arguments));
      var gl = this._gl;

      this._createTransformedRectangleVertices(this._positionBuffer, this._positionBufferIndex, x, y, w, h);
      this._positionBufferIndex += 12;

      var color = parseFillColor(this._fillStyle);
      for (var i = 0; i < 6; i++) {
        this._colorBuffer.set(color, this._colorBufferIndex);
        this._colorBufferIndex += 4;
      }

      fillBuffer(this._coordinateBuffer, this._coordinateBufferIndex, 12, 0);
      this._coordinateBufferIndex += 12;
    };

    canvasWebGLContext.prototype.fillText = function fillText(text, x, y, maxWidth) {
      traceOption.value >= TRACE_VERBOSE && writer.writeLn("fillText " + toSafeArrayString(arguments));
    };

    canvasWebGLContext.prototype.strokeText = function strokeText(text, x, y, maxWidth) {
      traceOption.value >= TRACE_VERBOSE && writer.writeLn("strokeText " + toSafeArrayString(arguments));
    };

    canvasWebGLContext.prototype.initialize = function initialize() {
      traceOption.value >= TRACE_VERBOSE && console.warn("initialize");
      var gl = this._gl;
      if (blendOption.value) {
        gl.enable(gl.BLEND);
      } else {
        gl.disable(gl.BLEND);
      }
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      this._colorBufferIndex = 0;
      this._positionBufferIndex = 0;
      this._coordinateBufferIndex = 0;
    };

    canvasWebGLContext.prototype.flush = function flush() {
      var gl = this._gl;
      if (drawOption.value) {
        gl.bindBuffer(gl.ARRAY_BUFFER, this._positionGLBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this._positionBuffer.subarray(0, this._positionBufferIndex), gl.DYNAMIC_DRAW);

        var position = this._program.attributes.aPosition.location;
        gl.enableVertexAttribArray(position);
        gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, this._colorGLBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this._colorBuffer.subarray(0, this._colorBufferIndex), gl.DYNAMIC_DRAW);

        var color = this._program.attributes.aColor.location;
        gl.enableVertexAttribArray(color);
        gl.vertexAttribPointer(color, 4, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, this._coordinateGLBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this._coordinateBuffer.subarray(0, this._coordinateBufferIndex), gl.DYNAMIC_DRAW);

        var coordinate = this._program.attributes.aCoordinate.location;
        gl.enableVertexAttribArray(coordinate);
        gl.vertexAttribPointer(coordinate, 2, gl.FLOAT, false, 0, 0);

        var sampler = this._program.uniforms.uSampler.location;
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this._texture);
        gl.uniform1i(sampler, 0);


        if (stencilOption.value) {
          gl.enable(gl.STENCIL_TEST);
          gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);
          gl.depthMask(false);
          gl.stencilMask(255);
          gl.colorMask(false, false, false, false);
          gl.stencilFunc(gl.ALWAYS, 0, 255);
          gl.stencilOpSeparate(gl.FRONT, gl.INCR_WRAP, gl.INCR_WRAP, gl.INCR_WRAP);
          gl.stencilOpSeparate(gl.BACK, gl.DECR_WRAP, gl.DECR_WRAP, gl.DECR_WRAP);

          gl.drawArrays(gl.TRIANGLES, 0, this._positionBufferIndex / 2);

          gl.depthMask(true);
          gl.colorMask(true, true, true, true);
          gl.stencilFunc(gl.NOTEQUAL, 0, (0 === 0) ? 1 : 255);
          gl.stencilOp(gl.KEEP, gl.KEEP, gl.KEEP);


          gl.bindBuffer(gl.ARRAY_BUFFER, this._positionGLBuffer);
          createRectangleVertices(this._positionBuffer, 0, 0, 0, 1024, 1024);
          gl.bufferData(gl.ARRAY_BUFFER, this._positionBuffer.subarray(0, 12), gl.DYNAMIC_DRAW);
          gl.drawArrays(gl.TRIANGLES, 0, 6);

          gl.disable(gl.STENCIL_TEST);

        } else {
          gl.drawArrays(gl.TRIANGLES, 0, this._positionBufferIndex / 2);
        }
      }
      assert (this._positionBufferIndex === this._coordinateBufferIndex &&
              this._positionBufferIndex === this._colorBufferIndex / 2);
      nextColorCount = 0;
    }

    canvasWebGLContext.prototype.clearRectNoTransform = function clearRectNoTransform(x, y, w, h) {
      var gl = this._gl;
      gl.enable(gl.SCISSOR_TEST);
      gl.scissor(x, this._height - y - h, w, h);
      gl.clearColor(0.1, 0.2, 0.3, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.disable(gl.SCISSOR_TEST);
    };

    canvasWebGLContext.prototype.scale = function scale(x, y) {
      traceOption.value >= TRACE_VERBOSE && writer.writeLn("scale " + toSafeArrayString(arguments));
      var m = this._currentTransformStack;
      var o = this._currentTransformStackIndex;
      this.setTransform(
        m[o + 0] * x, m[o + 1] * x,
        m[o + 2] * y, m[o + 3] * y,
        m[o + 4], m[o + 5]
      );
    };

    canvasWebGLContext.prototype.rotate = function rotate(angle) {
      traceOption.value >= TRACE_VERBOSE && writer.writeLn("rotate " + toSafeArrayString(arguments));
      var m = this._currentTransformStack;
      var o = this._currentTransformStackIndex;
      var u = Math.cos(angle);
      var v = Math.sin(angle);
      this.setTransform(
        m[o + 0] * u + m[o + 2] * v,
        m[o + 1] * u + m[o + 3] * v,
        m[o + 0] * -v + m[o + 2] * u,
        m[o + 1] * -v + m[o + 3] * u,
        m[o + 4],
        m[o + 5]
      );
    };

    canvasWebGLContext.prototype.translate = function translate(x, y) {
      traceOption.value >= TRACE_VERBOSE && writer.writeLn("translate " + toSafeArrayString(arguments));
      var m = this._currentTransformStack;
      var o = this._currentTransformStackIndex;
      this.setTransform(
        m[o + 0], m[o + 1],
        m[o + 2], m[o + 3],
        m[o + 0] * x + m[o + 2] * y + m[o + 4],
        m[o + 1] * x + m[o + 3] * y + m[o + 5]
      );
    };

    canvasWebGLContext.prototype.moveTo = function (x, y) {
      traceOption.value >= TRACE_VERBOSE && writer.writeLn("moveTo " + toSafeArrayString(arguments));
      this._bufferPathCommand(MOVE_TO, x, y);
      this._pathCurrentX = x;
      this._pathCurrentY = y;
    };

    canvasWebGLContext.prototype.lineTo = function (x, y) {
      traceOption.value >= TRACE_VERBOSE && writer.writeLn("lineTo " + toSafeArrayString(arguments));
      this._bufferPathCommand(LINE_TO, x, y);
      this._pathCurrentX = x;
      this._pathCurrentY = y;
    };

    var tmp = new Float32Array(1024);
    canvasWebGLContext.prototype.quadraticCurveTo = function (cpx, cpy, x, y) {
      traceOption.value >= TRACE_VERBOSE && writer.writeLn("quadraticCurveTo " + toSafeArrayString(arguments));
      var index = createQuadraticCurveVertices(tmp, 0, this._pathCurrentX, this._pathCurrentY, cpx, cpy, x, y, 0);
      tmp[index ++] = x;
      tmp[index ++] = y;
      for (var i = 0; i < index; i += 2) {
        this._bufferPathCommand(LINE_TO, tmp[i], tmp[i + 1]);
      }
      this._pathCurrentX = x;
      this._pathCurrentY = y;
    };

    canvasWebGLContext.prototype.bezierCurveTo = function (cp1x, cp1y, cp2x, cp2y, x, y) {
      traceOption.value >= TRACE_VERBOSE && writer.writeLn("bezierCurveTo " + toSafeArrayString(arguments));
    };

    canvasWebGLContext.prototype.arc = function (x1, y1, x2, y2, radius) {
      traceOption.value >= TRACE_VERBOSE && writer.writeLn("arcTo " + toSafeArrayString(arguments));
    };

    canvasWebGLContext.prototype.rect = function (x, y, w, h) {
      traceOption.value >= TRACE_VERBOSE && writer.writeLn("rect " + toSafeArrayString(arguments));
    };

    canvasWebGLContext.prototype.strokeRect = function(x, y, w, h) {
      traceOption.value >= TRACE_VERBOSE && writer.writeLn("strokeRect " + toSafeArrayString(arguments));
      this.fillRect(x, y, w, h);
    };

    return canvasWebGLContext;
  })();

  return CanvasWebGLContext;
})();
