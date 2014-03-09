/*
 * Copyright 2013 Mozilla Foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
///<reference path='references.ts' />

/**
 * Just messing around with interpreters.
 */
module Shumway.Interpreter {
  enum OP {
    ADD       = 0x00,
    BGE        = 0x01, // ADDRESS
    PRINT     = 0x02,
    CONSTANT  = 0x03, // VALUE_I32
    STORE     = 0x04, // LOCATION_I32
    LOAD      = 0x05,  // LOCATION_U32
    JUMP      = 0x06,  // LOCATION_U32,
    EXIT      = 0x07
  }

  class Int32ArrayWriter {
    position: number = 0;
    constructor(public buffer: Int32Array) {
    }
    write(value: number): number {
      Shumway.Debug.assert(this.buffer.length > this.position);
      this.buffer[this.position ++] = value;
      return this.position - 1;
    }
  }

  function randomProgram(): Int32Array {
    var buffer = new Int32Array(1024 * 32);
    var writer = new Int32ArrayWriter(buffer);
    for (var i = 0; i < 5; i++) {
      writeLoop(writer, 0, 1000000);
    }
    writer.write(OP.EXIT);
    return buffer;
  }

  /**
   * Writes:
   *
   * i = 0;
   * loop: while (i < count) {
   *   i ++;
   * }
   * exit:
   */
  function writeLoop(pw: Int32ArrayWriter, counter: number, count: number) {
    var label = 0;
    pw.write(OP.CONSTANT); pw.write(0); // i
    pw.write(OP.STORE); pw.write(counter); // i = 0
    var loop = pw.position;
    pw.write(OP.LOAD); pw.write(counter); // i
    pw.write(OP.CONSTANT); pw.write(count); // count
    pw.write(OP.BGE); // BE EXIT
    var patch = pw.write(0);
    pw.write(OP.LOAD); pw.write(counter); // i
    pw.write(OP.CONSTANT); pw.write(1); // 1
    pw.write(OP.ADD); // i + i
    pw.write(OP.STORE); pw.write(counter); // i
    pw.write(OP.LOAD); pw.write(counter); // i
    pw.write(OP.PRINT);
    pw.write(OP.JUMP); pw.write(loop); // i
    pw.buffer[patch] = pw.position;
  }

  function interpret(p: Int32Array) {
    var locals = new Int32Array(256);
    var stack = new Int32Array(256);
    var pc = 0;
    var sp = 0;
    while (true) {
      var op = p[pc++];
      switch (op) {
        case OP.ADD:
          stack[sp - 2] = stack[sp - 2] + stack[sp - 1]; sp --;
          break;
        case OP.BGE:
          var address = p[pc ++];
          if (stack[sp - 2] >= stack[sp - 1]) {
            pc = address;
          }
          sp -= 2;
          break;
        case OP.CONSTANT:
          stack[sp++] = p[pc ++];
          break;
        case OP.PRINT:
          var v = stack[-- sp];
          // log(v);
          break;
        case OP.STORE:
          locals[p[pc ++]] = stack[-- sp];
          break;
        case OP.LOAD:
          stack[sp ++] = locals[p[pc ++]];
          break;
        case OP.JUMP:
          pc = p[pc ++];
          break;
        case OP.EXIT: return;
        default:
          log("Not Implemented");
          break;
      }
    }
  }

  function opADD(ctx) {
    var stack = ctx.stack, sp = ctx.sp;
    stack[sp - 2] = stack[sp - 2] + stack[sp - 1]; ctx.sp --;
  }

  function opBGE(ctx) {
    var stack = ctx.stack, sp = ctx.sp;
    var address = ctx.p[ctx.pc ++];
    if (stack[sp - 2] >= stack[sp - 1]) {
      ctx.pc = address;
    }
    ctx.sp -= 2;
  }

  function opJUMP(ctx) {
    ctx.pc = ctx.p[ctx.pc ++];
  }

  function opCONSTANT(ctx) {
    ctx.stack[ctx.sp++] = ctx.p[ctx.pc ++];
  }

  function opPRINT(ctx) {
    var v = ctx.stack[--ctx.sp]
    // log(v);
  }

  function opSTORE(ctx) {
    ctx.locals[ctx.p[ctx.pc ++]] = ctx.stack[-- ctx.sp];
  }

  function opLOAD(ctx) {
    ctx.stack[ctx.sp ++] = ctx.locals[ctx.p[ctx.pc ++]];
  }

  function opEXIT(ctx) {

  }

  function interpret2(p: Int32Array) {
    var ctx = {
      p: p,
      locals: new Int32Array(256),
      stack: new Int32Array(256),
      pc: 0,
      sp: 0
    };
    while (true) {
      var op = ctx.p[ctx.pc++];
      switch (op) {
        case OP.ADD:      opADD(ctx); break;
        case OP.BGE:      opBGE(ctx); break;
        case OP.CONSTANT: opCONSTANT(ctx); break;
        case OP.PRINT:    opPRINT(ctx); break;
        case OP.STORE:    opSTORE(ctx); break;
        case OP.LOAD:     opLOAD(ctx); break;
        case OP.JUMP:     opJUMP(ctx); break;
        case OP.EXIT:     return;
        default:
          log("Not Implemented");
          break;
      }
    }
  }

  function interpret3(p: Int32Array) {
    var pc = 0;
    var body = "";
    var writer = new IndentingWriter(false, function (s) {
      body += s + "\n";
    });
    writer.writeLn("var l = new Int32Array(256);");
    writer.writeLn("var s = new Int32Array(256);");
    writer.writeLn("var pc = 0;");
    writer.writeLn("var sp = 0;");
    writer.writeLn("var a = 0;");
    writer.writeLn("var v = 0;");

    var bbHeaders = [];
    bbHeaders[0] = true; // First PC is a header.
    done:
    while (true) {
      var op = p[pc++];
      switch (op) {
        case OP.BGE:
        case OP.JUMP:
          bbHeaders[p[pc++]] = true; // Target is a header
          bbHeaders[pc] = true; // Follow block is also a header.
          break;
        case OP.CONSTANT:
        case OP.STORE:
        case OP.LOAD:
          pc ++;
          break;
        case OP.EXIT:
          break done;
      }
    }

    pc = 0;
    writer.enter("while (true) {");
    writer.enter("switch (pc++) {");
    exit:
    while (true) {
      if (bbHeaders[pc]) {
        writer.enter("case " + pc + ":");
      }
      var op = p[pc++];
      switch (op) {
        case OP.ADD:
          writer.writeLn("s[sp - 2] = s[sp - 2] + s[sp - 1]; sp --;");
          break;
        case OP.BGE:
          writer.writeLn("a = " + p[pc ++] + "; if (s[sp - 2] >= s[sp - 1]) { pc = a; } else { pc = " + pc + "; }; sp -= 2;");
          break;
        case OP.CONSTANT:
          writer.writeLn("s[sp++] = " + p[pc ++] + ";");
          break;
        case OP.PRINT:
          writer.writeLn("v = s[-- sp];");
          break;
        case OP.STORE:
          writer.writeLn("l[" + p[pc ++] + "] = s[-- sp];");
          break;
        case OP.LOAD:
          writer.writeLn("s[sp ++] = l[" + p[pc ++] + "];");
          break;
        case OP.JUMP:
          writer.writeLn("pc = " + p[pc ++] + ";");
          break;
        case OP.EXIT:
          writer.leave("return;");
          writer.outdent();
          break exit;
        default:
          break;
      }
      if (bbHeaders[pc]) {
        writer.leave("break;");
      }
    }
    writer.leave("}");
    writer.leave("}");

    var f = new Function("p", body);
    // log(f);
    f(p);
  }

  function interpret4(p: Int32Array) {
    var pc = 0;
    var body = "";
    var writer = new IndentingWriter(false, function (s) {
      body += s + "\n";
    });
    writer.writeLn("var pc = 0;");
    writer.writeLn("var x = 0;");
    writer.writeLn("var v = 0;");

    var s = "abcdefg";
    var l = "hijklmn";

    writer.writeLn("var " + l.split("").join(" = 0, ") + " = 0" + "; // Local");
    writer.writeLn("var " + s.split("").join(" = 0, ") + " = 0" + "; // Stack");

    var bbHeaders = [];
    bbHeaders[0] = true; // First PC is a header.
    done:
      while (true) {
        var op = p[pc++];
        switch (op) {
          case OP.BGE:
          case OP.JUMP:
            bbHeaders[p[pc++]] = true; // Target is a header
            bbHeaders[pc] = true; // Follow block is also a header.
            break;
          case OP.CONSTANT:
          case OP.STORE:
          case OP.LOAD:
            pc ++;
            break;
          case OP.EXIT:
            break done;
        }
      }

    pc = 0;
    writer.enter("while (true) {");
    writer.enter("switch (pc++) {");
    var sp = 0;


    exit:
      while (true) {
        if (bbHeaders[pc]) {
          writer.enter("case " + pc + ":");
        }
        var op = p[pc++];
        switch (op) {
          case OP.ADD:
            writer.writeLn(s[sp - 2] + " = (" + s[sp - 2] + " + " + s[sp - 1] + ") | 0;");
            sp --;
            break;
          case OP.BGE:
            writer.writeLn("x = " + p[pc ++] + "; if (" + s[sp - 2] + " >= " + s[sp - 1] + ") { pc = x; } else { pc = " + pc + "; }; ");
            sp -= 2;
            break;
          case OP.CONSTANT:
            writer.writeLn(s[sp++] + " = " + p[pc ++] + ";");
            break;
          case OP.PRINT:
            writer.writeLn("v = " + s[-- sp] + ";");
            break;
          case OP.STORE:
            writer.writeLn(l[p[pc ++]] + " = " + s[-- sp] + " | 0;");
            break;
          case OP.LOAD:
            writer.writeLn(s[sp ++] + " = " + l[p[pc ++]] + " | 0;");
            break;
          case OP.JUMP:
            writer.writeLn("pc = " + p[pc ++] + ";");
            break;
          case OP.EXIT:
            writer.leave("return;");
            writer.outdent();
            break exit;
          default:
            break;
        }
        if (bbHeaders[pc]) {
          writer.leave("break;");
        }
      }
    writer.leave("}");
    writer.leave("}");

    var f = new Function("p", body);
    // log(f);
    f(p);
  }

  function timeIt(fn, message, count) {
    count = count || 0;
    var start = performance.now();
    var product = 1;
    for (var i = 0; i < count; i++) {
      var s = performance.now();
      fn();
      product *= (performance.now() - s);
    }
    var elapsed = (performance.now() - start);
    log("Measure: " + message + " Count: " + count + " Elapsed: " + elapsed.toFixed(4) + " (" + (elapsed / count).toFixed(4) + ") (" + Math.pow(product, (1 / count)).toFixed(4) + ")");
  }

  timeIt(function () {
    interpret(randomProgram());
  }, "Switch w/ Inline                 ", 4);

  timeIt(function () {
    interpret2(randomProgram());
  }, "Switch w/ Call                   ", 4);

  timeIt(function () {
    interpret3(randomProgram());
  }, "Threaded w/ Emulated Stack       ", 4);

  timeIt(function () {
    interpret4(randomProgram());
  }, "Threaded w/ Stack / Local Caching", 4);

}