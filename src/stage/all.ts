/// <reference path='geometry.ts'/>
/// <reference path='stage.ts'/>
/// <reference path='filters.ts'/>
/// <reference path='elements.ts'/>
/// <reference path='util.ts'/>
/// <reference path='gl.ts'/>
/// <reference path='gl/core.ts'/>

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

interface WebGLFramebuffer {
  texture: WebGLTexture;
}

interface WebGLTexture {
  w: number;
  h: number;
  atlas: Shumway.GL.WebGLTextureAtlas;
  framebuffer: WebGLFramebuffer;
}

module Shumway {
  export interface IRenderable {
    render (context : CanvasRenderingContext2D, options? : any);
  }
}