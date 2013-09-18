var CanvasWebGLContext = CanvasWebGLContext || (function (document, undefined) {
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

    function createRectangleVertices(result, index, x, y, w, h) {
      result[index +  0] = x;
      result[index +  1] = y;
      result[index +  2] = x + w;
      result[index +  3] = y;
      result[index +  4] = x;
      result[index +  5] = y + h;

      result[index +  6] = x;
      result[index +  7] = y + h;
      result[index +  8] = x + w;
      result[index +  9] = y;
      result[index + 10] = x + w;
      result[index + 11] = y + h;
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
        antialias: true
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

      this._scratchCanvas = window.document.createElement("canvas");
      this._scratchCanvas.width = 128;
      this._scratchCanvas.height = 128;
      this._scratchContext = this._scratchCanvas.getContext("2d");

      this._texture = this._createTexture(1024, 1024, null);
      this._texturePacker = new Packer(1024, 1024);
      this._fillStyle = null;
    }

    var settings = canvasWebGLContext;

    settings.debug = false;
    settings.blend = false;
    
    var MOVE_TO = 0x01;
    var LINE_TO = 0x02;
    var CLOSE_PATH = 0x03;

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
        gl.bindTexture(gl.TEXTURE_2D, this._texture);
        gl.texSubImage2D(gl.TEXTURE_2D, 0, image.coordinates.x, image.coordinates.y, gl.RGBA, gl.UNSIGNED_BYTE, image);
        return image.coordinates;
      }
      var insertedAt = this._texturePacker.insert(image.width, image.height);
      image.coordinates = new Rectangle(insertedAt.x, insertedAt.y, image.width, image.height);
      gl.bindTexture(gl.TEXTURE_2D, this._texture);
      gl.texSubImage2D(gl.TEXTURE_2D, 0, insertedAt.x, insertedAt.y, gl.RGBA, gl.UNSIGNED_BYTE, image);
      writer.writeLn("_loadTexture " + JSON.stringify(image.coordinates));
      return image.coordinates;
    };

    canvasWebGLContext.prototype._tesselateCurrentPathBufferFill = function _tesselateCurrentPathBufferFill(result, index) {
      var i32 = this._pathBufferI32;
      var f32 = this._pathBufferF32;
      var ox = 0, oy = 0;
      var lx = 0, ly = 0;
      var cx = 0, cy = 0;
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
              // (ox,oy -> lx,ly -> cx,cy)
              result[index + 0] = ox;
              result[index + 1] = oy;
              result[index + 2] = lx;
              result[index + 3] = ly;
              result[index + 4] = cx;
              result[index + 5] = cy;
              index += 6;
              triangles ++;
            }
            lx = cx; ly = cy;
            break;
        }
      }
      return triangles;
    };

    canvasWebGLContext.prototype._mapTexture = function  _mapTexture(result, resultIndex, position, positionIndex, length, bounds) {
      settings.debug && writer.writeLn("_mapTexture " + toSafeArrayString(arguments));
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
      settings.debug && writer.writeLn("_mapTexture " + toSafeArrayString(arguments));
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
        settings.debug && writer.writeLn("fillStyle " + toSafeArrayString(arguments));
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

    function invertTransform(result, index) {
      var m = result;
      var i = index;
      var m11 = m[i + 0];
      var m12 = m[i + 1];
      var m21 = m[i + 2];
      var m22 = m[i + 3];
      var dx = m[i + 4];
      var dy = m[i + 5];
      if (m12 === 0.0 && m21 === 0.0) {
        m11 = 1.0 / m11;
        m22 = 1.0 / m22;
        m12 = m21 = 0.0;
        dx = -m11 * dx;
        dy = -m22 * dy;
      } else {
        var a = m11, b = m12, c = m21, d = m22;
        var determinant = a * d - b * c;
        if (determinant === 0.0) {
          assert(false);
          return;
        }
        determinant = 1.0 / determinant;
        m11 =  d * determinant;
        m12 = -b * determinant;
        m21 = -c * determinant;
        m22 =  a * determinant;
        var ty = -(m12 * dx + m22 * dy);
        dx = -(m11 * dx + m21 * dy);
        dy = ty;
      }
      m[i + 0] = m11;
      m[i + 1] = m12;
      m[i + 2] = m21;
      m[i + 3] = m22;
      m[i + 4] = dx;
      m[i + 5] = dy;
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
      settings.debug && writer.writeLn("drawImage " + toSafeArrayString(arguments));
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
      settings.debug && writer.writeLn("setTransform " + toSafeArrayString(arguments));
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
      settings.debug && writer.enter("save");
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
      settings.debug && writer.leave("restore");
      this._currentTransformStackIndex -= 6;
    };

    canvasWebGLContext.prototype.beginPath = function beginPath() {
      settings.debug && writer.writeLn("beginPath " + toSafeArrayString(arguments));
      this._clearPathBuffer();
    };

    canvasWebGLContext.prototype.closePath = function closePath() {
      settings.debug && writer.writeLn("closePath " + toSafeArrayString(arguments));
      this._bufferPathCommand(CLOSE_PATH);
      this._clearPathBuffer();
    };

    canvasWebGLContext.prototype.clip = function clip() {
      settings.debug && writer.writeLn("clip " + toSafeArrayString(arguments));
    };

    canvasWebGLContext.prototype.fill = function fill() {
      settings.debug && writer.writeLn("fill " + toSafeArrayString(arguments));
      var triangles = this._tesselateCurrentPathBufferFill(this._positionBuffer, this._positionBufferIndex);
      var vertices = triangles * 3;
      if (this._fillStyle && this._fillStyle.image) {
        var bounds = this._loadTexture(this._fillStyle.image).clone();
        this._mapTexture(this._coordinateBuffer, this._coordinateBufferIndex, this._positionBuffer, this._positionBufferIndex, vertices, bounds);
      }
      this._coordinateBufferIndex += vertices * 2;
      this._positionBufferIndex += vertices * 2;
      this._clearPathBuffer();
      var color = BLACK;
      for (var i = 0; i < vertices; i++) {
        this._colorBuffer.set(color, this._colorBufferIndex);
        this._colorBufferIndex += 4;
      }
    };

    var once = false;
    canvasWebGLContext.prototype.stroke = function stroke() {
      var gl = this._gl;
      settings.debug && writer.writeLn("stroke " + toSafeArrayString(arguments));
      return;
      if (!once) {
        this._scratchContext.stroke();
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this._scratchCanvas);
        once = true;
      }

      this._createTransformedRectangleVertices(this._positionBuffer, this._positionBufferIndex, 0, 0, 32, 32);
      this._positionBufferIndex += 12;

      var color = nextColor();
      for (var i = 0; i < 6; i++) {
        this._colorBuffer.set(color, this._colorBufferIndex);
        this._colorBufferIndex += 4;
      }

      createRectangleVertices(this._coordinateBuffer, this._coordinateBufferIndex, 0, 0, 1, 1);
      this._coordinateBufferIndex += 12;

    };

    canvasWebGLContext.prototype.transform = function transform(m11, m12, m21, m22, dx, dy) {
      settings.debug && writer.writeLn("transform " + toSafeArrayString(arguments));
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

    function transformVertices(result, index, transform, transformIndex, length) {
      var m = transform;
      var o = transformIndex;
      for (var i = 0, j = length * 2; i < j; i += 2) {
        var x = result[index + i];
        var y = result[index + i + 1];
        result[index + i]     = m[o + 0] * x + m[o + 2] * y + m[o + 4];
        result[index + i + 1] = m[o + 1] * x + m[o + 3] * y + m[o + 5];
      }
    }

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

    function fillBuffer(buffer, index, length, value) {
      value = value || 0;
      for (var i = 0; i < length; i++) {
        buffer[index + i] = value;
      }
    }

    function copyBuffer(dst, dstIndex, src, srcIndex, length) {
      for (var i = 0; i < length; i++) {
        dst[dstIndex] = src[srcIndex];
        dstIndex ++;
        srcIndex ++;
      }
    }

    canvasWebGLContext.prototype.fillRect = function fillRect(x, y, w, h) {
      settings.debug && writer.writeLn("fillRect " + toSafeArrayString(arguments));
      var gl = this._gl;

      this._createTransformedRectangleVertices(this._positionBuffer, this._positionBufferIndex, x, y, w, h);
      this._positionBufferIndex += 12;

      var color = nextColor();
      for (var i = 0; i < 6; i++) {
        this._colorBuffer.set(color, this._colorBufferIndex);
        this._colorBufferIndex += 4;
      }

      fillBuffer(this._coordinateBuffer, this._coordinateBufferIndex, 12, 0);
      this._coordinateBufferIndex += 12;
    };

    canvasWebGLContext.prototype.fillText = function fillText(text, x, y, maxWidth) {
      settings.debug && writer.writeLn("fillText " + toSafeArrayString(arguments));
    };

    canvasWebGLContext.prototype.strokeText = function strokeText(text, x, y, maxWidth) {
      settings.debug && writer.writeLn("strokeText " + toSafeArrayString(arguments));
    };

    canvasWebGLContext.prototype.initialize = function initialize() {
      settings.debug && console.warn("initialize");
      var gl = this._gl;
      if (settings.blend) {
        gl.enable(gl.BLEND);
      } else {
        gl.disable(gl.BLEND);
      }
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    };

    canvasWebGLContext.prototype.flush = function flush() {
      var gl = this._gl;
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

      gl.drawArrays(gl.TRIANGLES, 0, this._positionBufferIndex / 2);

      assert (this._positionBufferIndex === this._coordinateBufferIndex &&
              this._positionBufferIndex === this._colorBufferIndex / 2);
      this._colorBufferIndex = 0;
      this._positionBufferIndex = 0;
      this._coordinateBufferIndex = 0;
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
      settings.debug && writer.writeLn("scale " + toSafeArrayString(arguments));
    };

    canvasWebGLContext.prototype.rotate = function rotate(angle) {
      settings.debug && writer.writeLn("rotate " + toSafeArrayString(arguments));
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
      settings.debug && writer.writeLn("translate " + toSafeArrayString(arguments));
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
      settings.debug && writer.writeLn("moveTo " + toSafeArrayString(arguments));
      this._bufferPathCommand(MOVE_TO, x, y);
    };

    canvasWebGLContext.prototype.lineTo = function (x, y) {
      settings.debug && writer.writeLn("lineTo " + toSafeArrayString(arguments));
      this._bufferPathCommand(LINE_TO, x, y);
    };

    canvasWebGLContext.prototype.quadraticCurveTo = function (cpx, cpy, x, y) {
      settings.debug && writer.writeLn("quadraticCurveTo " + toSafeArrayString(arguments));
    };

    canvasWebGLContext.prototype.bezierCurveTo = function (cp1x, cp1y, cp2x, cp2y, x, y) {
      settings.debug && writer.writeLn("bezierCurveTo " + toSafeArrayString(arguments));
    };

    canvasWebGLContext.prototype.arc = function (x1, y1, x2, y2, radius) {
      settings.debug && writer.writeLn("arcTo " + toSafeArrayString(arguments));
      if (once) return;
      this._scratchContext.arc(x1, y1, x2, y2, radius);
    };

    canvasWebGLContext.prototype.rect = function (x, y, w, h) {
      settings.debug && writer.writeLn("rect " + toSafeArrayString(arguments));
    };

    canvasWebGLContext.prototype.strokeRect = function(x, y, w, h) {
      settings.debug && writer.writeLn("strokeRect " + toSafeArrayString(arguments));
      this.fillRect(x, y, w, h);
    };

    return canvasWebGLContext;
  })();

  return CanvasWebGLContext;
})();
