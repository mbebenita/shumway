module Shumway {
  import IRenderable = Shumway.IRenderable;
  import Rectangle = Shumway.Geometry.Rectangle;

  var SHAPE_ROOT = "assets/shapes/";

  function loadShape(file) {
    var path = SHAPE_ROOT + file;
    var gl = this.gl;
    var request = new XMLHttpRequest();
    request.open("GET", path, false);
    request.send();
    // assert (request.status === 200, "File : " + path + " not found.");
    return JSON.parse(request.responseText);
  }

  function parseRGBColor(value, alpha) {
    return "rgba(" + (((value >> 16) & 0xFF)) + ", " +
                     (((value >> 8) & 0xFF)) + ", " +
                     (((value) & 0xFF)) + ", " + alpha + ")";

  }

  export class VectorShape implements IRenderable {
    private _data: any;
    constructor(data) {
      this._data = data;
    }
    properties: {[name: string]: any} = {};
    getBounds (): Rectangle {
      var b = this._data.shapeBounds;
      return new Rectangle(b.xmin, b.ymin, b.xmax - b.xmin, b.ymax - b.ymin);
    }
    render (context: CanvasRenderingContext2D) {
      var bounds = this.getBounds();
      context.save();
      context.translate(-bounds.x, -bounds.y);
      var shapes = this._data.shapes;
      for (var i = 0; i < shapes.length; i++) {
        var shape = shapes[i];
        var paths = shape.geometry.paths;
        for (var j = 0; j < paths.length; j++) {
          var path = paths[j];
          context.save();
          context.beginPath();
          context.moveTo(path[0][0], path[0][1]);
          for (var k = 0; k < path.length; k++) {
            var command = path[k];
            if (command.length === 2) {
              context.lineTo(command[0], command[1]);
            } else if (command.length === 4) {
              context.quadraticCurveTo(command[0], command[1], command[2], command[3]);
            }
          }
          context.closePath();
          if (shape.fill) {
            if (shape.fill.type === 0) {
              context.fillStyle = parseRGBColor(shape.fill.color, shape.fill.alpha);
            }
            context.fill();
          }
          context.restore();
        }
      }
      context.restore();
    }
  }

  export var Shapes = [
    new VectorShape(loadShape("sword.json")),
    new VectorShape(loadShape("decorate.json")),
    new VectorShape(loadShape("background.json")),
    new VectorShape(loadShape("fire.json")),
    new VectorShape(loadShape("large.json"))
  ];

  loadShape("assets.json").forEach(function (shape) {
    Shapes.push(new VectorShape(shape));
  });

  export function getRandomShape() {
    return Shapes[Math.random() * Shapes.length | 0];
  }

  export class ImageShape implements IRenderable {
    private _image: HTMLImageElement;
    constructor(image) {
      this._image = image;
    }
    properties: {[name: string]: any} = {};
    getBounds (): Rectangle {
      assert (this._image.complete);
      return new Rectangle(0, 0, this._image.width, this._image.height);
    }
    render (context: CanvasRenderingContext2D) {
      context.save();
      context.drawImage(this._image, 0, 0);
      context.restore();
    }
  }

  export function getImageShape(image) {
    return new ImageShape(image);
  }

  export class SpriteShape implements IRenderable {
    private _index: number;
    private _bounds: Rectangle;
    constructor(index) {
      this._index = index;
      var extend = Math.random() * 32 | 0;
      this._bounds = new Rectangle(0, 0, 32 + extend, 32 + extend);
    }
    properties: {[name: string]: any} = {};
    getBounds (): Rectangle {
      return this._bounds;
    }

    private renderStar(context, x, y, r, p, m) {
      context.save();
      context.beginPath();
      context.translate(x, y);
      context.moveTo(0, 0 - r);
      for (var i = 0; i < p; i++) {
        context.rotate(Math.PI / p);
        context.lineTo(0, 0 - (r * m));
        context.rotate(Math.PI / p);
        context.lineTo(0, 0 - r);
      }
      context.fill();
      context.restore();
    }

    render (context: CanvasRenderingContext2D) {
      var bounds = this._bounds;
      context.save();
      // context.strokeStyle = randomStyle();
      // context.strokeRect(0, 0, bounds.w, bounds.h);
      var p = bounds.w / 2;
      context.fillStyle = randomStyle();
      this.renderStar(context, p, p, bounds.w / 2, Math.random() * 16 | 0, 0.1 + Math.random() * 0.5);
      // context.fillRect(0, 0, this._bounds.w, this._bounds.h);
      // context.fillStyle = "black";
      // context.font = 14 + 'px Consolas';
      // context.fillText("" + this._index, 4, 16);
      context.restore();
    }
  }

  export function getSpriteShape(index) {
    return new SpriteShape(index);
  }
}

/*

var sampleText = [
  "Grumpy wizards make toxic brew for the evil Queen and Jack. One morning, when Gregor Samsa woke from troubled dreams, he found himself transformed in his bed into a horrible vermin. He lay on his armour-like back, and if he lifted his head a little he could see his brown belly, slightly domed and divided by arches into stiff sections. ",
  "The bedding was hardly able to cover it and seemed ready to slide off any moment. His many legs, pitifully thin compared with the size of the rest of him, waved about helplessly as he looked. One morning, when Gregor Samsa woke from troubled dreams, he found himself transformed in his bed into a horrible vermin.",
  "He lay on his armour-like back, and if he lifted his head a little he could see his brown belly, slightly domed and divided by arches into stiff sections. The bedding was hardly able to cover it and seemed ready to slide off any moment. His many legs, pitifully thin compared with the size of the rest of him, waved about helplessly as he looked."
];

function randomText() {
  return sampleText[Math.random() * sampleText.length | 0];
}

function renderTextShape(str) {
  return function renderText(c) {
    c.font = "8pt Open Sans";
    var words = str.split(" ");
    var lines = [];
    var run = 0;
    var line = [];
    var spaceLength = c.measureText(" ").width;
    for (var i = 0; i < words.length; i++) {
      var wordLength = c.measureText(words[i]).width;
      if (run + wordLength > this.w) {
        lines.push(line);
        line = [];
        run = 0;
      } else {
        line.push(words[i]);
        run += wordLength + spaceLength;
      }
    }
    c.fillStyle = "#34aadc";
    for (var i = 0; i < lines.length; i++) {
      c.fillText(lines[i].join(" "), 0, 10 + i * 12);
    }
  }
}

*/
