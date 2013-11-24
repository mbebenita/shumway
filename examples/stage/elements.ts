/// <reference path='all.ts'/>
import Frame = Shumway.Layers.Frame;
import FrameContainer = Shumway.Layers.FrameContainer;

module Shumway.Layers.Elements {

  class Flake extends Frame {
    radius : number;
    density : number;
    rotationSpeed : number;
    speed : number;
    constructor(radius : number, density : number) {
      super();
      this.radius = radius;
      this.density = density;
      this.speed = Math.random() < 0.2 ? (Math.random() / 5) : 0;
    }
  }

  export class Snow extends FrameContainer implements IAnimator {
    private angle : number;
    private speed : number;
    constructor(count : number, radius : number, w : number, h : number) {
      super();
      this.w = w;
      this.h = h;
      this.angle = Math.random();
      this.createFlakes(count, radius);
    }
    private createFlakes(count : number, radius : number) {
      var radius = 10;
      for (var i = 0; i < count; i++) {
        var flake = new Flake(radius / 4 + Math.random() * radius + 1, Math.random() * count);
        flake.x = Math.random() * this.w | 0;
        flake.y = Math.random() * this.h | 0;
        flake.h = flake.w = radius / 2 + Math.random() * radius;
        this.addChild(flake);
      }
    }
    onEnterFrame () {
      this.angle += 0.01;
      for (var i = 0; i < this.children.length; i++) {
        var flake : Flake = <Flake>this.children[i];
        flake.y += flake.speed * (Math.cos(this.angle + flake.density) + 1 + flake.radius / 2);
        flake.x += flake.speed * (Math.sin(this.angle) * 2);
        if (flake.x > this.w || flake.x < -flake.w || flake.y > this.h) {
          flake.x = Math.random() * (this.w - flake.w);
          flake.y = Math.random() * (this.h - flake.h) / 2;
        }
        // flake.rotation += flake.rotationSpeed;
      }
    }
  }

  export class Shape extends Frame {
    canvas : HTMLCanvasElement;
    renderer : (context : CanvasRenderingContext2D) => void;
    cacheAsBitmap : boolean;
    constructor(renderer, w : number, h : number, cacheAsBitmap : boolean = true) {
      super();
      this.renderer = renderer;
      this.w = w;
      this.h = h;
      this.cacheAsBitmap = cacheAsBitmap;
    }
    cache () {
      if (!this.cacheAsBitmap) {
        return;
      }
      this.canvas = document.createElement("canvas");
      this.canvas.width = this.w;
      this.canvas.height = this.h;
      var context = this.canvas.getContext("2d");
      this.renderer(context);
    }
    render (context : CanvasRenderingContext2D) {
      context.save();
      var t = this.transform;
      context.transform(t.a, t.b, t.c, t.d, t.tx, t.ty);
      if (this.canvas) {
        context.drawImage(this.canvas, 0, 0);
      } else {
        this.cache();
        this.renderer(context);
      }
      context.restore();
    }
  }

  export class Bitmap extends Frame implements Shumway.IRenderable {
    image : HTMLImageElement = document.createElement("img");
    constructor(url : string) {
      super();
      var image = this.image;
      image.src = url;
      var bitmap = this;
      this.image.onload = function () {
        bitmap.w = image.width;
        bitmap.h = image.height;
      };
    }
    render (context : CanvasRenderingContext2D) {
      context.save();
      var t = this.transform;
      context.transform(t.a, t.b, t.c, t.d, t.tx, t.ty);
      context.drawImage(this.image, 0, 0);
      context.restore();
    }
  }

  export class Text extends Frame implements Shumway.IRenderable {
    text : string;
    constructor (text : string, w : number) {
      super();
      this.text = text;
      this.w = w;
    }
    render (context : CanvasRenderingContext2D) {
      context.save();
      var t = this.transform;
      context.transform(t.a, t.b, t.c, t.d, t.tx, t.ty);
      context.font = "8pt Open Sans";

      var words = this.text.split(" ");
      var lines = [];
      var run = 0;
      var line = [];
      var spaceLength = context.measureText(" ").width;
      for (var i = 0; i < words.length; i++) {
        var wordLength = context.measureText(words[i]).width;
        if (run + wordLength > this.w) {
          lines.push(line);
          line = [];
          run = 0;
        } else {
          line.push(words[i]);
          run += wordLength + spaceLength;
        }
      }
      context.fillStyle = "#34aadc";
      for (var i = 0; i < lines.length; i++) {
        context.fillText(lines[i].join(" "), 0, 10 + i * 12);
      }
      this.h = lines.length * 12;
      context.restore();
    }
  }
}