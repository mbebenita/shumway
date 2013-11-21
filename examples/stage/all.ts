/// <reference path='geometry.ts'/>
/// <reference path='stage.ts'/>
/// <reference path='elements.ts'/>

declare function randomStyle(): string;

module Shumway {
  export interface IRenderable {
    render (context : CanvasRenderingContext2D, options? : any);
  }
}