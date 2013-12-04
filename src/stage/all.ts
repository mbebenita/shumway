/// <reference path='geometry.ts'/>
/// <reference path='stage.ts'/>
/// <reference path='elements.ts'/>
/// <reference path='util.ts'/>
/// <reference path='gl.ts'/>

declare function randomStyle(): string;
declare function assert(...args : any[]);
declare function unexpected(...args : any[]);
declare function notImplemented(...args : any[]);
declare var release;

declare class IndentingWriter {
  writeLn(str: string);
  enter(str: string);
  leaveAndEnter(str: string);
  leave(str: string);
  indent(str: string);
  outdent(str: string);
}

module Shumway {
  export interface IRenderable {
    render (context : CanvasRenderingContext2D, options? : any);
  }
}