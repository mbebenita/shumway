var webGLOptions = coreOptions.register(new OptionSet("WebGL Options"));

var CanvasWebGLContext = CanvasWebGLContext || (function (document, undefined) {

  var TRACE_OFF = 0;
  var TRACE_BRIEF = 1;
  var TRACE_VERBOSE = 2;
  
  var traceOption = webGLOptions.register(new Option("", "trace", "number", 0, "trace commands", {off: TRACE_OFF, brief: TRACE_BRIEF, verbose: TRACE_VERBOSE}));
  var alphaOption = webGLOptions.register(new Option("", "alpha", "boolean", false, "makes all colors transparent"));
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
        // preserveDrawingBuffer: true,
        antialias: true,
        stencil: true
      });
      this._gl.viewport(0, 0, this._width, this._height);
      this._vertexShader = this._createShaderFromFile(shaderRoot + "canvas.vert");
      this._fragmentShader = this._createShaderFromFile(shaderRoot + "identity.frag");

      this._program = this._createProgram([this._vertexShader, this._fragmentShader]);
      this._queryProgramAttributesAndUniforms(this._program);

//      gl.useProgram(this._program);
//      gl.uniform2f(this._program.uniforms.uResolution.location, this._width, this._height);
//      gl.uniformMatrix3fv(this._program.uniforms.uTransformMatrix.location, false, makeTranslation(0, 0));


      this._fillStyle = "#000000";
      this._strokeStyle = "#000000";

      this._currentPath = null;
      this._commandQueue = [];
    }

    canvasWebGLContext.prototype._queueCommand = function (command) {
      this._commandQueue.push(command);
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
        if (!isString(fillStyle)) {
          console.warn("Can't handle fillStyle yet.");
          fillStyle = "red";
        }
        this._fillStyle = fillStyle;
      }
    });

    Object.defineProperty(canvasWebGLContext.prototype, "strokeStyle", {
      get: function () {
        return this._strokeStyle;
      },
      set: function (strokeStyle) {
        traceOption.value >= TRACE_VERBOSE && writer.writeLn("strokeStyle " + toSafeArrayString(arguments));
        this._strokeStyle = strokeStyle;
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
      this.fillRect(dx, dy, dw, dh);
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
      if (this._currentPath) {
        this._currentPath.reset();
      } else {
        this._currentPath = new GL.Path();
      }
    };

    canvasWebGLContext.prototype.closePath = function closePath() {
      traceOption.value >= TRACE_VERBOSE && writer.writeLn("closePath " + toSafeArrayString(arguments));
    };

    canvasWebGLContext.prototype.clip = function clip() {
      traceOption.value >= TRACE_VERBOSE && writer.writeLn("clip " + toSafeArrayString(arguments));
    };

    canvasWebGLContext.prototype._createCurrentMatrixTransform = function () {
      return GL.createMatrixFromTransform(this._currentTransformStack, this._currentTransformStackIndex);
    };

    var cache = createEmptyObject();
    canvasWebGLContext.prototype.fill = function fill() {
      traceOption.value >= TRACE_VERBOSE && writer.writeLn("fill " + toSafeArrayString(arguments));
      var hash = this._currentPath.hash();
      var geometry = cache[hash];
      if (!geometry) {
        console.warn("Filling Path");
        geometry = new GL.Geometry(this);
        var color = parseFillColor(this._fillStyle);
        var simplePath = new GL.SimplePath();
        this._currentPath.visit(simplePath);
        geometry.addFill(simplePath, color);
        cache[hash] = geometry;
      }
      this._queueCommand(new GL.Command.Draw(this, geometry, this._createCurrentMatrixTransform(), 1));
      this._paint();
    };

    canvasWebGLContext.prototype.stroke = function stroke() {
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
      var path = new GL.Path();
      path.rect(x, y, w, h);
      var hash = path.hash();
      var geometry = cache[hash];
      if (!geometry) {
        console.warn("Filling Path");
        geometry = new GL.Geometry(this);
        var color = parseFillColor(this._fillStyle);
        geometry.addFill(path, color);
        cache[hash] = geometry;
      }
      this._queueCommand(new GL.Command.Draw(this, geometry, this._createCurrentMatrixTransform(), 1));
      this._paint();
    };

    canvasWebGLContext.prototype.fillText = function fillText(text, x, y, maxWidth) {
      traceOption.value >= TRACE_VERBOSE && writer.writeLn("fillText " + toSafeArrayString(arguments));
    };

    canvasWebGLContext.prototype.strokeText = function strokeText(text, x, y, maxWidth) {
      traceOption.value >= TRACE_VERBOSE && writer.writeLn("strokeText " + toSafeArrayString(arguments));
    };

    canvasWebGLContext.prototype.draw = function (commands) {
      commands.forEach(function (c) {
        c.draw(this);
      });
    };

    canvasWebGLContext.prototype._paint = function () {
      while (this._commandQueue.length > 0) {
        var command = this._commandQueue.shift();
        command.draw(this);
      }
    };

    canvasWebGLContext.prototype._clearRect = function (x, y, w, h) {
      var gl = this._gl;
      gl.enable(gl.SCISSOR_TEST);
      gl.scissor(x, this._height - y - h, w, h);
      gl.clearColor(0, 0, 0, 1);
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
      this._currentPath.moveTo(x, y);
    };

    canvasWebGLContext.prototype.lineTo = function (x, y) {
      traceOption.value >= TRACE_VERBOSE && writer.writeLn("lineTo " + toSafeArrayString(arguments));
      this._currentPath.lineTo(x, y);
    };

    canvasWebGLContext.prototype.quadraticCurveTo = function (cpx, cpy, x, y) {
      traceOption.value >= TRACE_VERBOSE && writer.writeLn("quadraticCurveTo " + toSafeArrayString(arguments));
      this._currentPath.quadraticCurveTo(cpx, cpy, x, y);
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
      this._fillStyle = this._strokeStyle;
      this.fillRect(x, y, w, h);
    };

    return canvasWebGLContext;
  })();

  return CanvasWebGLContext;
})();
