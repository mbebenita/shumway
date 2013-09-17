var CanvasWebGLContext = CanvasWebGLContext || (function (document, undefined) {
  var nativeGetContext = HTMLCanvasElement.prototype.getContext;

  HTMLCanvasElement.prototype.getContext = function getContext(contextId, args) {
    if (contextId !== "2d.gl") {
      return nativeGetContext.call(this, contextId, args);
    }
    return new CanvasWebGLContext(this);
  };

  var CanvasWebGLContext = (function () {
    var debug = true;
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

    function createRectangleVertices(result, offset, x, y, w, h) {
      result[offset +  0] = x;
      result[offset +  1] = y;
      result[offset +  2] = x + w;
      result[offset +  3] = y;
      result[offset +  4] = x;
      result[offset +  5] = y + h;
      result[offset +  6] = x;
      result[offset +  7] = y + h;
      result[offset +  8] = x + w;
      result[offset +  9] = y;
      result[offset + 10] = x + w;
      result[offset + 11] = y + h;
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
      this._currentTransformStackOffset = 0;
      this.resetTransform();
      var gl = this._gl = canvas.getContext("experimental-webgl", {
        preserveDrawingBuffer: true,
        antialias: true
      });
      assert (gl);
      this._gl.viewport(0, 0, this._width, this._height);
      this._vertexShader = this.createShaderFromFile(shaderRoot + "canvas.vert");
      this._fragmentShader = this.createShaderFromFile(shaderRoot + "identity.frag");

      this._program = this.createProgram([this._vertexShader, this._fragmentShader]);
      this.queryProgramAttributesAndUniforms(this._program);

      gl.useProgram(this._program);
      gl.uniform2f(this._program.uniforms.uResolution.location, this._width, this._height);
      gl.uniformMatrix3fv(this._program.uniforms.uTransformMatrix.location, false, makeTranslation(0, 0));

      this._colorBuffer = gl.createBuffer();
      this._positionBuffer = gl.createBuffer();
      this._coordinateBuffer = gl.createBuffer();

      this._colorArray = new Float32Array(1024 * 1024);
      this._colorArrayOffset = 0;
      this._positionArray = new Float32Array(1024 * 1024);
      this._positionArrayOffset = 0;
      this._coordinateArray = new Float32Array(1024 * 1024);
      this._coordinateArrayOffset = 0;

      this._scratchCanvas = window.document.createElement("canvas");
      this._scratchCanvas.width = 128;
      this._scratchCanvas.height = 128;
      this._scratchContext = this._scratchCanvas.getContext("2d");

      this._texture = this.createTexture(this._scratchCanvas.width, this._scratchCanvas.height, null);
    }

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

    canvasWebGLContext.prototype.createShaderFromFile = function createShaderFromFile(file) {
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
      return this.createShader(shaderType, request.responseText);
    };

    canvasWebGLContext.prototype.createProgram = function createProgram(shaders) {
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

    canvasWebGLContext.prototype.createShader = function createShader(shaderType, shaderSource) {
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

    canvasWebGLContext.prototype.queryProgramAttributesAndUniforms = function queryProgramAttributesAndUniforms(program) {
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

    canvasWebGLContext.prototype.createTexture = function createTexture(width, height, data) {
      var gl = this._gl;
      var texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
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
        var o = this._currentTransformStackOffset;
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

//    // drawing images
//    void drawImage((HTMLImageElement or HTMLCanvasElement or HTMLVideoElement) image,
//      unrestricted double dx, unrestricted double dy);
//    void drawImage((HTMLImageElement or HTMLCanvasElement or HTMLVideoElement) image,
//      unrestricted double dx, unrestricted double dy, unrestricted double dw, unrestricted double dh);
//    void drawImage((HTMLImageElement or HTMLCanvasElement or HTMLVideoElement) image,
//      unrestricted double sx, unrestricted double sy, unrestricted double sw, unrestricted double sh, unrestricted double dx, unrestricted double dy, unrestricted double dw, unrestricted double dh);

    canvasWebGLContext.prototype.drawImage = function drawImage(image, dx, dy, dw, dh) {
      debug && writer.writeLn("drawImage " + toSafeArrayString(arguments));
    }

    canvasWebGLContext.prototype.setTransform = function setTransform(m11, m12, m21, m22, dx, dy) {
      debug && writer.writeLn("setTransform " + toSafeArrayString(arguments));
      var m = this._currentTransformStack;
      var o = this._currentTransformStackOffset;
      m[o + 0] = m11;
      m[o + 1] = m12;
      m[o + 2] = m21;
      m[o + 3] = m22;
      m[o + 4] = dx;
      m[o + 5] = dy;
    };

    canvasWebGLContext.prototype.save = function save() {
      debug && writer.enter("save");
      var m = this._currentTransformStack;
      var o = this._currentTransformStackOffset;
      m[o + 6]  = m[o + 0];
      m[o + 7]  = m[o + 1];
      m[o + 8]  = m[o + 2];
      m[o + 9]  = m[o + 3];
      m[o + 10] = m[o + 4];
      m[o + 11] = m[o + 5];
      this._currentTransformStackOffset = o + 6;
    };

    canvasWebGLContext.prototype.restore = function restore() {
      debug && writer.leave("restore");
      this._currentTransformStackOffset -= 6;
    };

    canvasWebGLContext.prototype.beginPath = function beginPath() {
      debug && writer.writeLn("beginPath " + toSafeArrayString(arguments));
      return;
      if (once) return;
      this._scratchContext.beginPath();
      this._scratchContext.lineWidth = 10;
    };

    canvasWebGLContext.prototype.closePath = function closePath() {
      debug && writer.writeLn("closePath " + toSafeArrayString(arguments));
    };

    canvasWebGLContext.prototype.clip = function clip() {
      debug && writer.writeLn("clip " + toSafeArrayString(arguments));
    };

    canvasWebGLContext.prototype.fill = function fill() {
      debug && writer.writeLn("fill " + toSafeArrayString(arguments));
    };

    var once = false;
    canvasWebGLContext.prototype.stroke = function stroke() {
      var gl = this._gl;
      debug && writer.writeLn("stroke " + toSafeArrayString(arguments));
      return;
      if (!once) {
        this._scratchContext.stroke();
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this._scratchCanvas);
        once = true;
      }

      this._createTransformedRectangleVertices(this._positionArray, this._positionArrayOffset, 0, 0, 32, 32);
      this._positionArrayOffset += 12;

      var color = nextColor();
      for (var i = 0; i < 6; i++) {
        this._colorArray.set(color, this._colorArrayOffset);
        this._colorArrayOffset += 4;
      }

      createRectangleVertices(this._coordinateArray, this._coordinateArrayOffset, 0, 0, 1, 1);
      this._coordinateArrayOffset += 12;

    };

    canvasWebGLContext.prototype.transform = function transform(m11, m12, m21, m22, dx, dy) {
      debug && writer.writeLn("transform " + toSafeArrayString(arguments));
      var m = this._currentTransformStack;
      var o = this._currentTransformStackOffset;
      this.setTransform(
        m[o + 0] * m11 + m[o + 2] * m12,
        m[o + 1] * m11 + m[o + 3] * m12,
        m[o + 0] * m21 + m[o + 2] * m22,
        m[o + 1] * m21 + m[o + 3] * m22,
        m[o + 0] *  dx + m[o + 2] * dy + m[o + 4],
        m[o + 1] *  dx + m[o + 3] * dy + m[o + 5]
      );
    };

    canvasWebGLContext.prototype._transformVertices = function(result, offset, length) {
      var m = this._currentTransformStack;
      var o = this._currentTransformStackOffset;
      for (var i = 0, j = length * 2; i < j; i += 2) {
        var x = result[offset + i];
        var y = result[offset + i + 1];
        result[offset + i]     = m[o + 0] * x + m[o + 2] * y + m[o + 4];
        result[offset + i + 1] = m[o + 1] * x + m[o + 3] * y + m[o + 5];
      }
    };

    canvasWebGLContext.prototype._createTransformedRectangleVertices = function(result, offset, x, y, w, h) {
      createRectangleVertices(result, offset, x, y, w, h);
      this._transformVertices(result, offset, 6);
    };

    var colorCache;

    function randomColor() {
      if (!colorCache) {
        colorCache = [];
        for (var i = 0; i < 10; i++) {
          var color = parseColor(randomStyle());
          color[3] = 0.3;
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

    function repeatArray(array, count) {
      var result = new Float32Array(array.length * count);
      for (var i = 0; i < count; i++) {
        result.set(array, array.length * i);
      }
      return result;
    }

    canvasWebGLContext.prototype.fillRect = function fillRect(x, y, w, h) {
      debug && writer.writeLn("fillRect " + toSafeArrayString(arguments));
      var gl = this._gl;


      this._createTransformedRectangleVertices(this._positionArray, this._positionArrayOffset, x, y, w, h);
      // this._positionArray.set(data, this._positionArrayOffset);
      this._positionArrayOffset += 12;

      var color = nextColor();
      for (var i = 0; i < 6; i++) {
        this._colorArray.set(color, this._colorArrayOffset);
        this._colorArrayOffset += 4;
      }

      this._coordinateArrayOffset += 12;
    };

    canvasWebGLContext.prototype.fillText = function fillText(text, x, y, maxWidth) {
      debug && writer.writeLn("fillText " + toSafeArrayString(arguments));
    };

    canvasWebGLContext.prototype.strokeText = function strokeText(text, x, y, maxWidth) {
      debug && writer.writeLn("strokeText " + toSafeArrayString(arguments));
    };

    var k = 0;
    canvasWebGLContext.prototype.clear = function clear() {
      var gl = this._gl;

      // this.clearRectNoTransform(0, 0, this._width, this._height);
      // gl.enable(gl.DEPTH_TEST);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    };

    canvasWebGLContext.prototype.flush = function flush() {
      var gl = this._gl;
      gl.bindBuffer(gl.ARRAY_BUFFER, this._positionBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, this._positionArray.subarray(0, this._positionArrayOffset), gl.DYNAMIC_DRAW);

      var position = this._program.attributes.aPosition.location;
      gl.enableVertexAttribArray(position);
      gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

      gl.bindBuffer(gl.ARRAY_BUFFER, this._colorBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, this._colorArray.subarray(0, this._colorArrayOffset), gl.DYNAMIC_DRAW);

      var color = this._program.attributes.aColor.location;
      gl.enableVertexAttribArray(color);
      gl.vertexAttribPointer(color, 4, gl.FLOAT, false, 0, 0);

      gl.bindBuffer(gl.ARRAY_BUFFER, this._coordinateBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, this._coordinateArray.subarray(0, this._coordinateArrayOffset), gl.DYNAMIC_DRAW);

      var coordinate = this._program.attributes.aCoordinate.location;
      gl.enableVertexAttribArray(coordinate);
      gl.vertexAttribPointer(coordinate, 2, gl.FLOAT, false, 0, 0);

      var sampler = this._program.uniforms.uSampler.location;
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this._texture);
      gl.uniform1i(sampler, 0);


      gl.drawArrays(gl.TRIANGLES, 0, this._positionArrayOffset / 2);
      this._positionArrayOffset = 0;
      this._colorArrayOffset = 0;
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


//    kanvas2dCtxProto.scale = function (x, y) {
//      var ctm = this._ctm;
//      this.setTransform(
//        ctm[0] * x, ctm[1] * x,
//        ctm[2] * y, ctm[3] * y,
//        ctm[4], ctm[5]
//      );
//    };
//    kanvas2dCtxProto.rotate = function (angle) {
//      var ctm = this._ctm;
//      var u = Math.cos(angle);
//      var v = Math.sin(angle);
//      this.setTransform(
//        ctm[0] * u + ctm[2] * v,
//        ctm[1] * u + ctm[3] * v,
//        ctm[0] * -v + ctm[2] * u,
//        ctm[1] * -v + ctm[3] * u,
//        ctm[4], ctm[5]
//      );
//    };
//    kanvas2dCtxProto.translate = function (x, y) {
//      var ctm = this._ctm;
//      this.setTransform(
//        ctm[0], ctm[1],
//        ctm[2], ctm[3],
//        ctm[0] * x + ctm[2] * y + ctm[4],
//        ctm[1] * x + ctm[3] * y + ctm[5]
//      );
//    };
//
    canvasWebGLContext.prototype.scale = function scale(x, y) {
      debug && writer.writeLn("scale " + toSafeArrayString(arguments));
    };

    canvasWebGLContext.prototype.rotate = function rotate(angle) {
      debug && writer.writeLn("rotate " + toSafeArrayString(arguments));
      var m = this._currentTransformStack;
      var o = this._currentTransformStackOffset;
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
      debug && writer.writeLn("translate " + toSafeArrayString(arguments));
      var m = this._currentTransformStack;
      var o = this._currentTransformStackOffset;
      this.setTransform(
        m[o + 0], m[o + 1],
        m[o + 2], m[o + 3],
        m[o + 0] * x + m[o + 2] * y + m[o + 4],
        m[o + 1] * x + m[o + 3] * y + m[o + 5]
      );
    };

    canvasWebGLContext.prototype.moveTo = function (x, y) {
      debug && writer.writeLn("moveTo " + toSafeArrayString(arguments));
      return;
      if (once) return;
      this._scratchContext.moveTo(x, y);
    };

    canvasWebGLContext.prototype.lineTo = function (x, y) {
      debug && writer.writeLn("lineTo " + toSafeArrayString(arguments));
      return;
      if (once) return;
      this._scratchContext.lineTo(x, y);
    };

    canvasWebGLContext.prototype.quadraticCurveTo = function (cpx, cpy, x, y) {
      debug && writer.writeLn("quadraticCurveTo " + toSafeArrayString(arguments));
    };

    canvasWebGLContext.prototype.bezierCurveTo = function (cp1x, cp1y, cp2x, cp2y, x, y) {
      debug && writer.writeLn("bezierCurveTo " + toSafeArrayString(arguments));
    };

    canvasWebGLContext.prototype.arc = function (x1, y1, x2, y2, radius) {
      debug && writer.writeLn("arcTo " + toSafeArrayString(arguments));
      if (once) return;
      this._scratchContext.arc(x1, y1, x2, y2, radius);
    };

    canvasWebGLContext.prototype.rect = function (x, y, w, h) {
      debug && writer.writeLn("rect " + toSafeArrayString(arguments));
    };

    canvasWebGLContext.prototype.strokeRect = function(x, y, w, h) {
      debug && writer.writeLn("strokeRect " + toSafeArrayString(arguments));
      this.fillRect(x, y, w, h);
    };

    return canvasWebGLContext;
  })();


  return CanvasWebGLContext;
})();
