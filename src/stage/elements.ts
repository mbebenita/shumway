/// <reference path='all.ts'/>
import Frame = Shumway.Layers.Frame;
import FrameContainer = Shumway.Layers.FrameContainer;

module Shumway.Layers.Elements {

  export class Flake extends Frame implements Shumway.IRenderable {
    radius: number;
    density: number;
    rotationSpeed: number;
    scaleSpeed: number;
    speed: number;
    fillStyle = randomStyle();
    constructor(radius: number, density: number) {
      super();
      this.radius = radius;
      this.density = density;
      if (Math.random() < 0.9) {
        this.speed = 0;
        this.scaleSpeed = 0;
        this.rotationSpeed = 0;
      } else {
        this.speed = Math.random() / 5;
        this.scaleSpeed = 0.01 + Math.random() / 20;
        this.rotationSpeed = Math.random();
      }
      this.rotation = Math.random() * 180;
    }
    render (context: CanvasRenderingContext2D, options?: any) {
      context.save();
      var t = this.transform;
      context.transform(t.a, t.b, t.c, t.d, t.tx, t.ty);
      context.fillStyle = this.fillStyle;
      context.fillRect(0, 0, this.w, this.h);
      context.restore();
    }
  }

  export class Snow extends FrameContainer implements IAnimator {
    private angle: number;
    private speed: number;
    constructor(count: number, radius: number, w: number, h: number) {
      super();
      this.w = w;
      this.h = h;
      this.angle = Math.random();
      this.createFlakes(count, radius);
    }
    private createFlakes(count: number, radius: number) {
      for (var i = 0; i < count; i++) {
        var flake = new Flake(radius / 4 + Math.random() * radius + 1, Math.random() * count);
        flake.x = Math.random() * this.w | 0;
        flake.y = Math.random() * this.h | 0;
        flake.h = flake.w = radius / 2 + Math.random() * radius;
        flake.origin.x = flake.w / 2;
        flake.origin.y = flake.h / 2;
        this.addChild(flake);
      }
    }
    onEnterFrame () {
      this.angle += 0.01;
      for (var i = 0; i < this.children.length; i++) {
        var flake: Flake = <Flake>this.children[i];
        flake.y += flake.speed * (Math.cos(this.angle + flake.density) + 1 + flake.radius / 2);
        flake.x += flake.speed * (Math.sin(this.angle) * 2);
        if (flake.x > this.w || flake.x < -flake.w || flake.y > this.h) {
          flake.x = Math.random() * (this.w - flake.w);
          flake.y = Math.random() * (this.h - flake.h) / 2;
        }
        flake.rotation += flake.rotationSpeed;
        if (flake.scaleX + flake.scaleSpeed > 2 || flake.scaleX + flake.scaleSpeed < 0.5) {
          flake.scaleSpeed *= -1;
        }
        flake.scaleX += flake.scaleSpeed;
      }
    }
  }

  export class Shape extends Frame {
    canvas: HTMLCanvasElement;
    renderer: (context: CanvasRenderingContext2D) => void;
    cacheAsBitmap: boolean;
    constructor(renderer, w: number, h: number, cacheAsBitmap: boolean = true) {
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
    render (context: CanvasRenderingContext2D) {
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
    public image: HTMLImageElement;
    constructor(image: HTMLImageElement) {
      super();
      this.image = image;
      if (image.complete) {
        this.w = image.width;
        this.h = image.height;
      } else {
        var thisFrame = this;
        image.addEventListener("load", function () {
          thisFrame.w = image.width;
          thisFrame.h = image.height;
        });
      }
    }
    render (context: CanvasRenderingContext2D, options?: any) {
      context.save();
      var t = this.transform;
      context.transform(t.a, t.b, t.c, t.d, t.tx, t.ty);
      if (options && options.snap) {
        context.save();
        context.setTransform(1, 0, 0, 1, t.tx | 0, t.ty | 0);
        context.drawImage(this.image, 0, 0);
        context.restore();
      } else {
        context.drawImage(this.image, 0, 0);
      }
      context.restore();
    }
  }

  export class Video extends Frame implements Shumway.IRenderable {
    video: HTMLVideoElement;
    constructor(video: any) {
      super();
      var that = this;
//      var events = 'loadstart,suspend,abort,error,emptied,stalled,loadedmetadata,loadeddata,canplay,canplaythrough,playing,waiting,seeking,seeked,ended,durationchange,timeupdate,progress,play,pause,ratechange,volumechange'.split(',');
//      for (var i = 0; i < events.length; i++) {
//        this.video["on" + events[i]] = (function (name) {
//          return function () {
//            console.info("Event: " + name);
//          }
//        })(events[i])
//      }
      this.video = video;
      if (video.videoWidth && video.videoHeight) {
        this.w = video.videoWidth;
        this.h = video.videoHeight;
      } else {
        var thisFrame = this;
        video.onloadedmetadata = function () {
          thisFrame.w = video.videoWidth;
          thisFrame.h = video.videoHeight;
        };
      }
    }
    render (context: CanvasRenderingContext2D, options?: any) {
      context.save();
      var t = this.transform;
      context.transform(t.a, t.b, t.c, t.d, t.tx, t.ty);
      if (options && options.alpha) {
        context.globalAlpha = this.alpha;
      }
      if (options && options.snap) {
        context.save();
        context.setTransform(1, 0, 0, 1, t.tx | 0, t.ty | 0);
        context.drawImage(this.video, 0, 0);
        context.restore();
      } else {
        context.drawImage(this.video, 0, 0);
      }
      if (options && options.alpha) {
        context.globalAlpha = 1;
      }
      context.restore();
    }
  }
}