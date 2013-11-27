/// <reference path='all.ts'/>
module Shumway.Util {
  var release = false;

  export class Color {
    private static colorCache;

    public static colorToNumber(color) {
      return color[0] << 24 | color[1] << 16 | color[2] << 8 | color[3];
    }

    public static parseColor(color) {
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
      var result = new Float32Array(4);
      result[0] = parseFloat(m[1]) / 255;
      result[1] = parseFloat(m[2]) / 255;
      result[2] = parseFloat(m[3]) / 255;
      result[3] = m[4] ? parseFloat(m[4]) / 255 : 1;
      return Color.colorCache[color] = result;
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
}