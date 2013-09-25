var webGLOptions = coreOptions.register(new OptionSet("WebGL Options"));

var CanvasWebGLContext = CanvasWebGLContext || (function (document, undefined) {

  var TRACE_OFF = 0;
  var TRACE_BRIEF = 1;
  var TRACE_VERBOSE = 2;
  
  var traceOption = webGLOptions.register(new Option("", "trace", "number", TRACE_BRIEF, "trace commands", {off: TRACE_OFF, brief: TRACE_BRIEF, verbose: TRACE_VERBOSE}));
  var alphaOption = webGLOptions.register(new Option("", "alpha", "boolean", false, "makes all colors transparent"));
  var stencilOption = webGLOptions.register(new Option("", "stencilOption", "boolean", false, "cache tessellations"));
  var drawOption = webGLOptions.register(new Option("", "draw", "boolean", true, "draw"));

  var nativeGetContext = HTMLCanvasElement.prototype.getContext;

  var Draw = GL.Job.Draw;

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
      var t = this.transform;
      t[0] = m11;
      t[1] = m12;
      t[2] = m21;
      t[3] = m22;
      t[4] = dx;
      t[5] = dy;
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

  var State = (function () {
    function state(parent) {
      this.parent = parent;
      this.transform = null;
      if (parent) {
        this.transform = new Float32Array(parent.transform.length);
        this.transform.set(parent.transform);
        this.clippingPaths = parent.clippingPaths.slice(0);
      } else {
        this.transform = new Float32Array(6);
        this.clippingPaths = [];
      }
    }
    return state;
  })();

  var TextureAtlas = (function () {
    function textureAtlas(gl, texture, width, height) {
      this._gl = gl;
      this._packer = new Packer(width, height);
      this.texture = texture;
    }
    textureAtlas.prototype.load = function (image) {
      var gl = this._gl;
      var coordinates = this._packer.insert(image.width, image.height);
      gl.bindTexture(gl.TEXTURE_2D, this.texture);
      gl.texSubImage2D(gl.TEXTURE_2D, 0, coordinates.x, coordinates.y, gl.RGBA, gl.UNSIGNED_BYTE, image);
      return new TextureAtlasLocation(this, coordinates);
    };
    return textureAtlas;
  })();

  function TextureAtlasLocation(textureAtlas, coordinates) {
    this.textureAtlas = textureAtlas;
    this.coordinates = coordinates;
  }

  TextureAtlasLocation.prototype.toString = function()  {
    return "x: " + this.coordinates.x + ", y: " + this.coordinates.y;
  };

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
      this._state = new State();
      this.resetTransform();
      var gl = this._gl = canvas.getContext("experimental-webgl", {
        // preserveDrawingBuffer: true,
        antialias: true,
        stencil: true
      });
      this._gl.viewport(0, 0, this._width, this._height);
      this._programCache = {};
      this._program = this._createProgramFromFiles("canvas.vert", "identity.frag");
      this._updateViewport();
      this._fillStyle = "#000000";
      this._strokeStyle = "#000000";
      this._currentPath = null;
      this._jobQueue = [];
      this._textureAtlases = [];
    }

    canvasWebGLContext.prototype._scheduleJob = function (job) {
      this._jobQueue.push(job);
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
      var path = shaderRoot + file;
      var gl = this._gl;
      var request = new XMLHttpRequest();
      request.open("GET", path, false);
      request.send();
      assert (request.status === 200, "File : " + path + " not found.");
      var shaderType;
      if (path.endsWith(".vert")) {
        shaderType = gl.VERTEX_SHADER;
      } else if (path.endsWith(".frag")) {
        shaderType = gl.FRAGMENT_SHADER;
      } else {
        throw "Shader Type: not supported.";
      }
      return this._createShader(shaderType, request.responseText);
    };


    canvasWebGLContext.prototype._createProgramFromFiles = function _createProgramFromFiles(vertex, fragment) {
      var key = vertex + fragment;
      var program = this._programCache[key];
      if (!program) {
        program = this._createProgram([
          this._createShaderFromFile(vertex),
          this._createShaderFromFile(fragment)
        ]);
        this._queryProgramAttributesAndUniforms(program);
        this._programCache[key] = program;
      }
      return program;
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

    canvasWebGLContext.prototype._loadImage = function (image) {
      if (image.textureAtlasLocation) {
        return image.textureAtlasLocation;
      }

      var textureAtlasLocation, textureAtlas;
      for (var i = 0; i < this._textureAtlases.length; i++) {
        textureAtlasLocation = this._textureAtlases[i].load(image);
        if (textureAtlasLocation) {
          break;
        }
      }
      if (!textureAtlasLocation) {
        textureAtlas = new TextureAtlas(this._gl, this._createTexture(1024, 1024, null), 1024, 1024);
        this._textureAtlases.push(textureAtlas);
        textureAtlasLocation = textureAtlas.load(image);
        assert (textureAtlasLocation);
      }
      traceOption.value >= TRACE_BRIEF && writer.writeLn("Uploading Image: w: " + image.width + ", h: " + image.height + " @ " + textureAtlasLocation);
      return (image.textureAtlasLocation = textureAtlasLocation);
    };

//    canvasWebGLContext.prototype._loadTexture = function (image) {
//      -      var gl = this._gl;
//      -      if (image.coordinates) {
//        -//        gl.bindTexture(gl.TEXTURE_2D, this._texture);
//          -//        gl.texSubImage2D(gl.TEXTURE_2D, 0, image.coordinates.x, image.coordinates.y, gl.RGBA, gl.UNSIGNED_BYTE, image);
//            -        return image.coordinates;
//        -      }
//      -      var insertedAt = this._texturePacker.insert(image.width, image.height);
//      -      image.coordinates = new Rectangle(insertedAt.x, insertedAt.y, image.width, image.height);
//      -      gl.bindTexture(gl.TEXTURE_2D, this._texture);
//      -      gl.texSubImage2D(gl.TEXTURE_2D, 0, insertedAt.x, insertedAt.y, gl.RGBA, gl.UNSIGNED_BYTE, image);
//      -      writer.writeLn("_loadTexture " + JSON.stringify(image.coordinates));
//      -      return image.coordinates;
//      -    };


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
        var t = this._state.transform;
        return new Transform (
          t[0],
          t[1],
          t[2],
          t[3],
          t[4],
          t[5]
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
      var t = this._state.transform;
      t[0] = m11;
      t[1] = m12;
      t[2] = m21;
      t[3] = m22;
      t[4] = dx;
      t[5] = dy;
    };

    canvasWebGLContext.prototype.save = function save() {
      traceOption.value >= TRACE_VERBOSE && writer.enter("save");
      this._state = new State(this._state);
    };

    canvasWebGLContext.prototype.restore = function restore() {
      traceOption.value >= TRACE_VERBOSE && writer.leave("restore");
      var gl = this._gl;
      gl.clear(gl.STENCIL_BUFFER_BIT);
      if (this._state.parent) {
        this._state = this._state.parent;
      }
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
      this._state.clippingPaths.push(this._currentPath.clone());
      this._fillCurrentPath(Draw.CLIP);
    };

    canvasWebGLContext.prototype._createCurrentMatrixTransform = function () {
      return GL.createMatrixFromTransform(this._state.transform, 0);
    };

    canvasWebGLContext.prototype.fill = function fill() {
      if (this._state.clippingPaths.length) {
        this._fillCurrentPath(Draw.STENCIL);
      } else {
        this._fillCurrentPath(Draw.NORMAL);
      }
    };

    var cache = {};
    canvasWebGLContext.prototype._fillCurrentPath = function _fillCurrentPath(mode) {
      traceOption.value >= TRACE_VERBOSE && writer.writeLn("fill " + toSafeArrayString(arguments));
      var hash = this._currentPath.hash();
      var geometry = cache[hash];
      if (!geometry) {
        console.warn("Creating Geometry");
        geometry = new GL.Geometry(this);
        if (this._fillStyle && this._fillStyle.image) {
          var location = this._loadImage(this._fillStyle.image);
        }
        var color = parseFillColor(this._fillStyle);
        var simplePath = new GL.SimplePath();
        this._currentPath.visit(simplePath);
        geometry.addFill(simplePath, color);
        cache[hash] = geometry;
      }
      this._scheduleJob(new GL.Job.Draw(this, geometry, this._createCurrentMatrixTransform(), 1, mode));
    };

    canvasWebGLContext.prototype.stroke = function stroke() {
      traceOption.value >= TRACE_VERBOSE && writer.writeLn("stroke " + toSafeArrayString(arguments));
    };

    canvasWebGLContext.prototype.transform = function transform(m11, m12, m21, m22, dx, dy) {
      traceOption.value >= TRACE_VERBOSE && writer.writeLn("transform " + toSafeArrayString(arguments));
      var t = this._state.transform;
      this.setTransform(
        t[0] * m11 + t[2] * m12,
        t[1] * m11 + t[3] * m12,
        t[0] * m21 + t[2] * m22,
        t[1] * m21 + t[3] * m22,
        t[0] *  dx + t[2] * dy + t[4],
        t[1] *  dx + t[3] * dy + t[5]
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
      this._scheduleJob(new GL.Job.Draw(this, geometry, this._createCurrentMatrixTransform(), 1));
    };

    canvasWebGLContext.prototype.fillText = function fillText(text, x, y, maxWidth) {
      traceOption.value >= TRACE_VERBOSE && writer.writeLn("fillText " + toSafeArrayString(arguments));
    };

    canvasWebGLContext.prototype.strokeText = function strokeText(text, x, y, maxWidth) {
      traceOption.value >= TRACE_VERBOSE && writer.writeLn("strokeText " + toSafeArrayString(arguments));
    };

    canvasWebGLContext.prototype.flush = function () {
      while (this._jobQueue.length > 0) {
        var job = this._jobQueue.shift();
        job.draw(this);
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
      var t = this._state.transform;
      this.setTransform(
        t[0] * x, t[1] * x,
        t[2] * y, t[3] * y,
        t[4], t[5]
      );
    };

    canvasWebGLContext.prototype.rotate = function rotate(angle) {
      traceOption.value >= TRACE_VERBOSE && writer.writeLn("rotate " + toSafeArrayString(arguments));
      var t = this._state.transform;
      var u = Math.cos(angle);
      var v = Math.sin(angle);
      this.setTransform(
        t[0] * u + t[2] * v,
        t[1] * u + t[3] * v,
        t[0] * -v + t[2] * u,
        t[1] * -v + t[3] * u,
        t[4],
        t[5]
      );
    };

    canvasWebGLContext.prototype.translate = function translate(x, y) {
      traceOption.value >= TRACE_VERBOSE && writer.writeLn("translate " + toSafeArrayString(arguments));
      var t = this._state.transform;
      this.setTransform(
        t[0], t[1],
        t[2], t[3],
        t[0] * x + t[2] * y + t[4],
        t[1] * x + t[3] * y + t[5]
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
      this._currentPath.rect(x, y, w, h);
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
