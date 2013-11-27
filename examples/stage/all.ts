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

module Shumway {
  export interface IRenderable {
    render (context : CanvasRenderingContext2D, options? : any);
  }
}