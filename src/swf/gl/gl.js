(function (exports) {
  "use strict";

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

  function makeTransform(dx, dy, tx, ty) {
    return matrixTranspose(3, 3, [
      dx, 0, tx,
      0, dy, ty,
      0, 0, 1
    ]);
  }

  function createMatrixFromTransform(transform) {
    var a = transform.a;
    var b = transform.b;
    var c = transform.c;
    var d = transform.d;
    var e = transform.e;
    var f = transform.f;
    return new Float32Array([
      a, b, 0, c, d, 0, e, f, 1
    ]);
  }

  function makeRotationX(r) {
    return matrixTranspose(3, 3, [
      1, 0, 0,
      0, Math.cos(r), -Math.sin(r),
      0, Math.sin(r),  Math.cos(r)
    ]);
  }

  var Buffer = (function () {
    function buffer(initialCapacity) {
      this.u8 = null;
      this.u16 = null;
      this.i32 = null;
      this.f32 = null;
      this.offset = 0;
      this.ensureCapacity(initialCapacity);
    }
    buffer.prototype.reset = function () {
      this.offset = 0;
    };
    buffer.prototype.ensureCapacity = function (minCapacity) {
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
    };
    buffer.prototype.writeInt = function (v) {
      release || assert ((this.offset & 0x3) === 0);
      this.ensureCapacity(this.offset + 4);
      this.writeIntUnsafe(v);
    };
    buffer.prototype.writeIntUnsafe = function (v) {
      var index = this.offset >> 2;
      this.i32[index] = v;
      this.offset += 4;
    };
    buffer.prototype.writeFloat = function (v) {
      release || assert ((this.offset & 0x3) === 0);
      this.ensureCapacity(this.offset + 4);
      this.writeFloatUnsafe(v);
    };
    buffer.prototype.writeFloatUnsafe = function (v) {
      var index = this.offset >> 2;
      this.f32[index] = v;
      this.offset += 4;
    };
    buffer.prototype.writeVertex = function (x, y) {
      release || assert ((this.offset & 0x3) === 0);
      this.ensureCapacity(this.offset + 8);
      this.writeVertexUnsafe(x, y);
    };
    buffer.prototype.writeVertexUnsafe = function (x, y) {
      var index = this.offset >> 2;
      this.f32[index] = x;
      this.f32[index + 1] = y;
      this.offset += 8;
    };
    buffer.prototype.writeTriangleIndices = function (a, b, c) {
      release || assert ((this.offset & 0x1) === 0);
      this.ensureCapacity(this.offset + 6);
      var index = this.offset >> 1;
      this.u16[index] = a;
      this.u16[index + 1] = b;
      this.u16[index + 2] = c;
      this.offset += 6;
    };
    buffer.prototype.writeColor = function (r, g, b, a) {
      release || assert ((this.offset & 0x2) === 0);
      this.ensureCapacity(this.offset + 16);
      var index = this.offset >> 2;
      this.f32[index] = r;
      this.f32[index + 1] = g;
      this.f32[index + 2] = b;
      this.f32[index + 3] = a;
      this.offset += 16;
    };
    buffer.prototype.writeRandomColor = function () {
      this.writeColor(Math.random(), Math.random(), Math.random(), Math.random() / 2);
    };
    buffer.prototype.subF32View = function () {
      return this.f32.subarray(0, this.offset >> 2);
    };
    buffer.prototype.subU16View = function () {
      return this.u16.subarray(0, this.offset >> 1);
    };
    buffer.prototype.hashWords = function (hash, offset, length) {
      var i32 = this.i32;
      for (var i = 0; i < length; i++) {
        hash = (((31 * hash) | 0) + i32[i]) | 0;
      }
      return hash;
    }
    return buffer;
  })();

  var Path = (function () {
    var MOVE_TO             = 0x01;
    var LINE_TO             = 0x02;
    var QUADRATIC_CURVE_TO  = 0x03;
    var ARC_TO              = 0x04;
    var RECT                = 0x05;
    var ARC                 = 0x06;
    var ELLIPSE             = 0x07;
    function path() {
      this._buffer = new Buffer(1024);
      this._x = 0;
      this._y = 0;
    }
    path.prototype.hash = function () {
      return this._buffer.hashWords(0, 0, this._buffer.offset >> 2);
    };
    path.prototype.clone = function () {
      var path = new Path();
      this.visit(path);
      return path;
    };
    path.prototype.reset = function () {
      this._x = 0;
      this._y = 0;
      this._buffer.reset();
    };
    path.prototype._bufferCommand = function (command, a, b, c, d, e, f, g, h) {
      var buffer = this._buffer;
      var offset = this._buffer.offset;
      var bytesToWrite = arguments.length * 4;
      buffer.ensureCapacity(offset + bytesToWrite);
      buffer.writeIntUnsafe(command);
      switch (command) {
        case MOVE_TO:
        case LINE_TO:
          buffer.writeVertexUnsafe(a, b);
          break;
        case RECT:
          buffer.writeVertexUnsafe(a, b);
          buffer.writeFloatUnsafe(c);
          buffer.writeFloatUnsafe(d);
          break;
        case QUADRATIC_CURVE_TO:
          buffer.writeVertexUnsafe(a, b);
          buffer.writeVertexUnsafe(c, d);
          break;
        default:
          notImplemented(command);
      }
    };
    path.prototype.closePath = function () {
      notImplemented("closePath");
    };
    path.prototype.moveTo = function (x, y) {
      this._bufferCommand(MOVE_TO, x, y);
      this._x = x;
      this._y = y;
    };
    path.prototype.lineTo = function (x, y) {
      this._bufferCommand(LINE_TO, x, y);
      this._x = x;
      this._y = y;
    };
    path.prototype.quadraticCurveTo = function (cpx, cpy, x, y) {
      this._bufferCommand(QUADRATIC_CURVE_TO, cpx, cpy, x, y);
      this._x = x;
      this._y = y;
    };
    path.prototype.bezierCurveTo = function (cp1x, cp1y, cp2x, cp2y, x, y) {
      notImplemented("bezierCurveTo");
    };
    path.prototype.arcTo = function (x1, y1, x2, y2, radius) {
      notImplemented("arcTo");
    };
    path.prototype.rect = function (x, y, w, h) {
      this._bufferCommand(RECT, x, y, w, h);
    };
    path.prototype.arc = function (x, y, radius, startAngle, endAngle, anticlockwise) {
      notImplemented("arc");
    };
    path.prototype.ellipse = function (x, y, radiusX, radiusY,  rotation, startAngle, endAngle, anticlockwise) {
      notImplemented("ellipse");
    };
    path.prototype.trace = function (writer) {
      this.visit({
        moveTo: function (x, y) {
          writer.writeLn("MOVE_TO: x: " + x + ", y: " + y);
        },
        lineTo: function (x, y) {
          writer.writeLn("LINE_TO: x: " + x + ", y: " + y);
        },
        rect: function (x, y, w, h) {
          writer.writeLn("RECT: x: " + x + ", y: " + y + ", w: " + w + ", h: " + h);
        },
        quadraticCurveTo: function (cpx, cpy, x, y) {
          writer.writeLn("QUADRATIC_CURVE_TO: cpx: " + cpx + ", cpy: " + cpy + ", x: " + x + ", y: " + y);
        }
      });
    };
    path.prototype.visit = function (visitor) {
      var i32 = this._buffer.i32;
      var f32 = this._buffer.f32;
      var i = 0;
      var j = this._buffer.offset >> 2;
      while (i < j) {
        switch (i32[i++]) {
          case MOVE_TO:
            visitor.moveTo(f32[i++], f32[i++]);
            break;
          case LINE_TO:
            visitor.lineTo(f32[i++], f32[i++]);
            break;
          case RECT:
            visitor.rect(f32[i++], f32[i++], f32[i++], f32[i++]);
            break;
          case QUADRATIC_CURVE_TO:
            visitor.quadraticCurveTo(f32[i++], f32[i++], f32[i++], f32[i++]);
            break;
          default:
            notImplemented("");
            break;
        }
      }
    };
    return path;
  })();


  /**
   * A path made up of only MOVE_TO, LINE_TO commands.
   */
  var SimplePath = (function () {
    // TODO: Hope this is large enough.
    var tmp = new Float32Array(1024);
    function simplePath() {
      Path.call(this);
    }
    simplePath.prototype = Object.create(Path.prototype);
    simplePath.prototype.quadraticCurveTo = function (cpx, cpy, x, y) {
      var index = createQuadraticCurveVertices(tmp, 0, this._x, this._y, cpx, cpy, x, y, 0);
      for (var i = 0; i < index; i += 2) {
        this.lineTo(tmp[i], tmp[i + 1]);
      }
      this.lineTo(x, y);
    };
    return simplePath;
  })();

  var Geometry = (function () {
    function geometry(ctx) {
      this._ctx = ctx;
      this._indices = new Buffer(8);
      this._vertices = new Buffer(8);
      this._coordinates = new Buffer(8);
      this._colors = new Buffer(8);

      this._indexBuffer = ctx._gl.createBuffer();
      this._vertexBuffer = ctx._gl.createBuffer();
      this._coordinatesBuffer = ctx._gl.createBuffer();
      this._colorBuffer = ctx._gl.createBuffer();
      this._vertexCount = 0;
      this._triangleCount = 0;
    }

    geometry.prototype._fillBuffers = function () {
      var gl = this._ctx._gl;

      var vertices = this._vertices.subF32View();
      var coordinates = this._coordinates.subF32View();
      var colors = this._colors.subF32View();
      assert (vertices.length === coordinates.length);
      assert (vertices.length * 2 === colors.length);
      var indices = this._indices.subU16View();
      assert ((vertices.length % 2) === 0);
      assert ((indices.length % 3) === 0);
      if (!release) {
        for (var i = 0; i < indices.length; i++) {
          var index = indices[i];
          assert (index >= 0 && index < vertices.length);
        }
      }
      gl.bindBuffer(gl.ARRAY_BUFFER, this._vertexBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

      gl.bindBuffer(gl.ARRAY_BUFFER, this._coordinatesBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, coordinates, gl.STATIC_DRAW);

      gl.bindBuffer(gl.ARRAY_BUFFER, this._colorBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW);

      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._indexBuffer);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
    };

    geometry.prototype.addFillOld = function(path, color) {
      var coordinates = this._coordinates;
      var vertices = this._vertices;
      var indices = this._indices;
      var colors = this._colors;
      var justMoved = true;
      var last = 0;
      var index = 0;
      var origin = 0;
      var current = 0;
      var trianglesCount = this._triangleCount;
      path.visit({
        moveTo: function (x, y) {
          justMoved = true;
          vertices.writeVertex(x, y);
          coordinates.writeVertex(Math.random(), Math.random());
          if (color) {
            colors.writeColor(color[0], color[1], color[2], color[3]);
          } else {
            colors.writeRandomColor();
          }
          origin = index ++;
        },
        lineTo: function (x, y) {
          vertices.writeVertex(x, y);
          coordinates.writeVertex(Math.random(), Math.random());
          if (color) {
            colors.writeColor(color[0], color[1], color[2], color[3]);
          } else {
            colors.writeRandomColor();
          }
          current = index ++;
          if (!justMoved) {
            indices.writeTriangleIndices(origin, last, current);
            trianglesCount ++;
          }
          last = current;
          justMoved = false;
        }
      });
      this._triangleCount = trianglesCount;
      this._fillBuffers();
    };

    geometry.prototype.addFill = function(path, color) {
      if (path._buffer.offset > 10000) {
        return;
      }
      var loop = null;
      var loops = [];
      path.visit({
        moveTo: function (x, y) {
          if (loop) {
            loops.push(loop);
          }
          loop = [x, y];
        },
        lineTo: function (x, y) {
          loop.push(x, y);
        },
        rect: function (x, y, w, h) {
          loops.push(new Float32Array([
            x, y, x + w, y, x + w, y + h, x, y + h
          ]));
        }
      });
      if (loop) {
        loops.push(loop);
      }
      if (loops.length === 0) {
        return;
      }
      var tessellation = tessellate(loops);
      var t = tessellation.triangles;
      var v = tessellation.vertices;

      var coordinates = this._coordinates;
      var vertices = this._vertices;
      var indices = this._indices;
      var colors = this._colors;

      var vertexOffset = this._vertexCount;
      for (var i = 0; i < v.length; i += 2) {
        vertices.writeFloat(v[i]);
        vertices.writeFloat(v[i + 1]);
        this._vertexCount ++;
        coordinates.writeVertex(Math.random(), Math.random());
        if (color) {
          colors.writeColor(color[0], color[1], color[2], color[3]);
        } else {
          colors.writeRandomColor();
        }
      }
      for (var i = 0; i < t.length; i += 3) {
        indices.writeTriangleIndices(vertexOffset + t[i], vertexOffset + t[i + 1], vertexOffset + t[i + 2]);
        this._triangleCount ++;
      }
      this._fillBuffers();
    };
    return geometry;
  })();

  var Job = (function () {
    function job() {

    }
    job.prototype.draw = function (gl) {
      notImplemented("draw");
    };
    return job;
  })();

  Job.Fill = (function () {
    function fill() {

    }
    fill.prototype = Object.create(Job.prototype);
    return fill;
  })();

  Job.Clear = (function () {
    function clear(ctx) {
      this._ctx = ctx;
    }
    clear.prototype = Object.create(Job.prototype);
    clear.prototype.draw = function () {
      var gl = this._ctx._gl;
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    };
    return clear;
  })();

  Job.Draw = (function () {
    function draw(ctx, geometry, transform, z, mode) {
      this._ctx = ctx;
      this._geometry = geometry;
      this._transform = transform;
      this._z = z;
      this._mode = mode;
      this._initialize(ctx);
    }

    draw.NORMAL   = 0x01;
    draw.CLIP     = 0x02;
    draw.STENCIL  = 0x04;

    draw.prototype = Object.create(Job.prototype);
    draw.prototype._initialize = function (ctx) {
      if (this._program) {
        return;
      }
      this._program = ctx._createProgramFromFiles("canvas.vert", "identity.frag");
    };
    draw.prototype.draw = function () {
      var g = this._geometry;
      var gl = this._ctx._gl;
      var m = this._mode;

      gl.useProgram(this._program);
      gl.uniform1f(this._program.uniforms.uZ.location, this._z);
      gl.uniformMatrix3fv(this._program.uniforms.uTransformMatrix.location, false, this._transform);
      gl.bindBuffer(gl.ARRAY_BUFFER, g._vertexBuffer);
      var position = this._program.attributes.aPosition.location;
      gl.enableVertexAttribArray(position);
      gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, g._coordinatesBuffer);
      var coordinate = this._program.attributes.aCoordinate.location;
      gl.enableVertexAttribArray(coordinate);
      gl.vertexAttribPointer(coordinate, 2, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, g._colorBuffer);
      var color = this._program.attributes.aColor.location;
      gl.enableVertexAttribArray(color);
      gl.vertexAttribPointer(color, 4, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, g._indexBuffer);

      if (m === draw.CLIP) {
        gl.enable(gl.STENCIL_TEST);
        gl.clear(gl.STENCIL_BUFFER_BIT);
        gl.colorMask(false, false, false, false);
        gl.stencilFunc(gl.ALWAYS, 1, 0xFF);
        gl.stencilOp(gl.KEEP, gl.KEEP, gl.REPLACE);
        gl.drawElements(gl.TRIANGLES, g._triangleCount * 3, gl.UNSIGNED_SHORT, 0);
        gl.colorMask(true, true, true, true);
        gl.disable(gl.STENCIL_TEST);
      } else if (m === draw.STENCIL) {
        gl.enable(gl.STENCIL_TEST);
        gl.stencilFunc(gl.EQUAL, 1, 0xFF);
        gl.stencilOp(gl.KEEP,gl.KEEP,gl.KEEP);
        gl.drawElements(gl.TRIANGLES, g._triangleCount * 3, gl.UNSIGNED_SHORT, 0);
        gl.disable(gl.STENCIL_TEST);
      } else {
        gl.drawElements(gl.TRIANGLES, g._triangleCount * 3, gl.UNSIGNED_SHORT, 0);
      }
    };
    return draw;
  })();

  exports.Path = Path;
  exports.SimplePath = SimplePath;
  exports.Geometry = Geometry;
  exports.Job = Job;

  exports.makeTranslation = makeTranslation;
  exports.makeTransform = makeTransform;
  exports.createMatrixFromTransform = createMatrixFromTransform;
})(typeof exports === "undefined" ? (GL = {}) : exports);

function drawShape(path) {
  path.moveTo (350, 200.9000);
  path.quadraticCurveTo (308.8000, 263.7500, 265.8500, 291.0500);
  path.quadraticCurveTo (230.6500, 313.3500, 203.1500, 307.6500);
  path.quadraticCurveTo (191.5500, 305.2500, 184.4000, 298.1500);
  path.quadraticCurveTo (177.5000, 291.2500, 176.6000, 281.9000);
  path.quadraticCurveTo (175.7000, 272.2500, 181.5000, 262.8500);
  path.quadraticCurveTo (187.9000, 252.6500, 201, 244.9000);
  path.quadraticCurveTo (234.8500, 224.9500, 249.0500, 215.9000);
  path.quadraticCurveTo (270.8500, 201.9500, 281.5000, 192.1500);
  path.quadraticCurveTo (293.6500, 180.9500, 295.2000, 171.7500);
  path.quadraticCurveTo (296.8500, 162, 287, 152.9000);
  path.quadraticCurveTo (270.1500, 137.3000, 268.9000, 115.6000);
  path.quadraticCurveTo (268.5000, 108.8000, 269.7000, 102.2500);
  path.lineTo (271, 97);
  path.lineTo (190, 212.9000);
  path.lineTo (85, 151.9500);
  path.lineTo (181, 159.9500);
  path.lineTo (181, 17.9500);
  path.quadraticCurveTo (207.5000, 64.8000, 231.9000, 63);
  path.quadraticCurveTo (280.6500, 59.3500, 315, 65.8000);
  path.quadraticCurveTo (363.1000, 74.8500, 375.6500, 102.9000);
  path.quadraticCurveTo (391.2500, 138, 350, 200.9000);
}

function drawCurvyShape(path) {
  path.moveTo (119.2000, -58.3500);
  path.quadraticCurveTo (23.3500, -51.8500, -36.3000, -38.1500);
  path.quadraticCurveTo (-78.3000, -28.5000, -92.2000, -17.3000);
  path.quadraticCurveTo (-98.2500, -12.4000, -97.7000, -7.9500);
  path.quadraticCurveTo (-97.2500, -3.7000, -90.9000, -0.5500);
  path.quadraticCurveTo (-77.3000, 6.1500, -47.8500, 4.9500);
  path.quadraticCurveTo (-14.8500, 3.5500, 21.4000, -7.8000);
  path.quadraticCurveTo (64.2000, -21.2000, 101.5000, -45.8000);
  path.quadraticCurveTo (110.6000, -51.8000, 119.2000, -58.3500);
  path.moveTo (15.4000, -210.5000);
  path.quadraticCurveTo (-9.3000, -213.7500, -58.1500, -203.1500);
  path.quadraticCurveTo (-106.3500, -192.6500, -156.2500, -198.8500);
  path.quadraticCurveTo (-199.5000, -204.2000, -229.2000, -219.5500);
  path.quadraticCurveTo (-242.6500, -226.4500, -249.6000, -233.8500);
  path.quadraticCurveTo (-256.6500, -241.4000, -255.6500, -248);
  path.quadraticCurveTo (-253.4500, -263, -214.1500, -267.1500);
  path.quadraticCurveTo (-178.4000, -272.5000, -127.6000, -276.9000);
  path.quadraticCurveTo (-26, -285.6000, 49.2500, -280.5000);
  path.quadraticCurveTo (154.5500, -273.4000, 192.1000, -239.7000);
  path.quadraticCurveTo (239.0500, -197.6000, 176.8500, -116.1500);
  path.lineTo (173.9500, -112.3500);
  path.quadraticCurveTo (149.9000, -81.8000, 119.2000, -58.3500);
  path.quadraticCurveTo (122.5000, -58.5500, 187.4500, -71.2500);
  path.quadraticCurveTo (252.3500, -83.9000, 255.8000, -84.1500);
  path.quadraticCurveTo (153.5500, -12.1500, 133.1000, 29.4000);
  path.quadraticCurveTo (124.5000, 46.7500, 129.3000, 60.4000);
  path.quadraticCurveTo (133.0500, 71.2000, 146.3500, 81.7000);
  path.quadraticCurveTo (154.0500, 87.8000, 171.1500, 98.8000);
  path.quadraticCurveTo (185.6500, 108.8500, 190.6000, 117.3500);
  path.quadraticCurveTo (197.3500, 128.7500, 191.5500, 142.8000);
  path.quadraticCurveTo (184.8500, 159.0500, 160.8500, 180.8000);
  path.quadraticCurveTo (136.2500, 195.9500, 100.4500, 214.5000);
  path.quadraticCurveTo (28.9000, 251.6500, -26.9000, 268.9500);
  path.quadraticCurveTo (-105, 293.1000, -140.3500, 274.0500);
  path.quadraticCurveTo (-184.6000, 250.2000, -159.1500, 159.8000);
  path.quadraticCurveTo (-135.0500, 74.1000, -138.4500, 5.3000);
  path.quadraticCurveTo (-139.7000, -20.0500, -144.7500, -44.5500);
  path.quadraticCurveTo (-147.5500, -57.9000, -153.9000, -80.3000);
  path.quadraticCurveTo (-158.9000, -97.9500, -159.5500, -105);
  path.quadraticCurveTo (-160.5000, -115.5000, -155.5000, -121.8500);
  path.quadraticCurveTo (-150.0500, -128.7000, -135.4500, -133.8500);
  path.quadraticCurveTo (-121.3500, -138.8000, -93.1500, -144.1500);
  path.quadraticCurveTo (-41, -154, -5.8500, -169.4000);
  path.quadraticCurveTo (25.4500, -183.1000, 31.6000, -195.4000);
  path.quadraticCurveTo (34.4500, -201.1500, 30.4500, -205.0500);
  path.quadraticCurveTo (26.3000, -209.1000, 15.4000, -210.5000);
}

function drawRandomShape(path, size) {
  function random() {
    return Math.random() * 300;
  }
  path.moveTo(10, 10);
  for (var i = 0; i < size; i++) {
    switch ((Math.random() * 10) | 0) {
      case 0:
        path.moveTo(random(), random());
        break;
      case i < 7:
        path.lineTo(random(), random());
        break;
      default:
        path.quadraticCurveTo(random(), random(), random(), random());
        break;
    }
  }
}