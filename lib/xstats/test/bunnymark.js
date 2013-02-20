/*!
 * BunnyMark
 * Created by Iain Lobb <http://blog.iainlobb.com/search?q=bunny>
 * Ported to JS by Seb Lee-Delisle <http://sebleedelisle.com/2011/02/html5-canvas-sprite-optimisation/>
 * Modified by John-David Dalton <http://allyoucanleet.com/>
 */
(function(window, document) {

  /** bunny image object */
  var bunnyImage,

  /** background image object */
  grassImage,

  /** fill style object of the background image */
  fillStyle,

  /** element used to display the bunny count */
  status,

  /** canvas element */
  canvas = document.createElement('canvas'),

  /** canvas context object */
  ctx = ('getContext' in canvas) && canvas.getContext('2d'),

  /** affect of simulated gravity */
  gravity = 3,

  /** right bounding box coordinate */
  maxX = 614,

  /** left bounding box coordinate */
  minX = 0,

  /** bottom bounding box coordinate */
  maxY = 443,

  /** top bounding box coordinate */
  minY = 0,

  /** shortcut for Math.random */
  random = Math.random,

  /** shortcut for Math.round */
  round = Math.round,

  /** height of the canvas element */
  height = 480,

  /** width of the canvas element */
  width = 640;

  /*--------------------------------------------------------------------------*/

  /**
   * Bunny constructor.
   * @constructor
   */
  function Bunny() {
    this.speedX = random() * 10;
    this.speedY = (random() * 10) - 5;
  }

  /*--------------------------------------------------------------------------*/

  /**
   * Adds a number of bunnies.
   * @private
   * @param {Number} number The number of bunnies to add.
   */
  function addBunnies(number) {
    var bunnies = Bunny.bunnies;
    number = typeof number == 'number' ? number : 200;
    while (number--) {
      bunnies.push(new Bunny);
    }
    status.innerHTML = formatNumber(bunnies.length)  +
      ' bunnies hopping through the forest... (click for more)';
  }

  /**
   * Registers an event listener on an element.
   * @private
   * @param {Object} element The element.
   * @param {String} eventName The name of the event to listen to.
   * @param {Function} handler The event handler.
   */
  function addListener(element, eventName, handler) {
    if (typeof element.addEventListener != 'undefined') {
      element.addEventListener(eventName, handler, false);
    } else if (element.attachEvent != 'undefined') {
      element.attachEvent('on' + eventName, handler);
    }
  }

  /**
   * Converts a number to a more readable comma-separated string representation.
   * @private
   * @param {Number} number The number to convert.
   * @returns {String} The more readable string representation.
   */
  function formatNumber(number) {
    return String(number).replace(/(?=(?:\d{3})+$)(?!^)/g, ',');
  }

  /**
   * Renders a single frame of animation.
   * @private
   */
  function render() {
    var bunny,
        bunnies = Bunny.bunnies,
        length = bunnies.length;

    ctx.fillStyle = fillStyle;
    ctx.fillRect(0, 0, width, height);

    while (length--) {
      bunny = bunnies[length];
      bunny.x += bunny.speedX;
      bunny.y += bunny.speedY;
      bunny.speedY += gravity;

      if (bunny.x > maxX) {
        bunny.speedX *= -1;
        bunny.x = maxX;
      }
      else if (bunny.x < minX) {
        bunny.speedX *= -1;
        bunny.x = minX;
      }
      if (bunny.y > maxY) {
        bunny.speedY *= -.8;
        bunny.y = maxY;
        if (random() > .5){
          bunny.speedY -= random() * 12;
        }
      }
      else if (bunny.y < minY) {
        bunny.speedY = 0;
        bunny.y = minY;
      }
      ctx.drawImage(bunnyImage, round(bunny.x), round(bunny.y));
    }
  }

  /*--------------------------------------------------------------------------*/

  /**
   * An array of Bunny instances.
   * @static
   * @member Bunny
   * @type Array
   */
  Bunny.bunnies = [];

  Bunny.prototype = {

    /**
     * The `x` coordinate of the bunny.
     * @member Bunny
     * @type Number
     */
    'x': 0,

    /**
     * The `y` coordinate of the bunny.
     * @member Bunny
     * @type Number
     */
    'y': 0,

    /**
     * The horizontal speed of the bunny.
     * @member Bunny
     * @type Number
     */
    'speedX': 0,

    /**
     * The vertical speed of the bunny.
     * @member Bunny
     * @type Number
     */
    'speedY': 0
  };

  /*--------------------------------------------------------------------------*/

  // expose
  window.Bunny = Bunny;

  // setup canvas
  if (ctx) {
    grassImage = new Image;
    grassImage.src = 'data:image/gif;base64,' +
      'R0lGODlhIAAgAJEAADvWYkWlXcnvQAAAACH5BAAAAAAALAAAAAAgACAAAALxjAN5gIIgGHsxiWiSurq7' +
      'wCEZxDGXY2Fjoz5Kcyzbm2an9YJOaz0uO6lMJCaMJjQc0QzGTVOlcUFyuVgJ81FMYDZtSEkU2cY6YIy0' +
      '4F1iwM85JfmWpEKqChkSvrXepA9k0hEXlMG2oaRn9RS3duiB01c4FcVHsZK3JTP1lySos0V5VNHIGLbZ' +
      'kEmBIwNStlI2OVL3+seGUsEVW5K6iYMU6DQUNLQDKQlo6PNlo4cCISIsCSVFZNSEjJk2K4ZKkTXXqirB' +
      '1HiLyySIu+nsGSsbdE7G3HtSaDuODD+KD0iUGaesxRpoPCI1ImcvkzU/HPQUAAA7';

    bunnyImage = new Image;
    bunnyImage.src = 'data:image/gif;base64,' +
      'R0lGODlhGgAlAKIFAOumBYVeA////wAAALiDBPT29gAAAAAAACH5BAEAAAUALAAAAAAaACUAAAPCWLrT' +
      'vcU9SCMBGAw1Mt4VQwikxo0lGFqkYLLperbvgLpqaLcEuMcy24hAbBCHr5XwyGQmdc0o8VlZSo9UytJa' +
      'nOaqR27PK7NcnV9tU4KuOqSkqMYRCdgDcIHU07jbz4AbEn+AYXRahBceTGkQA4QALSUARWWPeJGSJZVB' +
      'f5malD2Wnpqbop2YpS6cSqSloY0MrqCsOpC0tVWJHqG5iHiFsRyJfonCdcDFd76OfxKDeMeXsdOjAdR2' +
      '0tmt19bY3ZbSaQkAOw==';

    addListener(window, 'load', function() {
      var body = document.body,
          container = document.createElement('div'),
          callback = function() { render(); reqFrame(callback); },
          reqFrame = window.requestAnimationFrame ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame ||
            window.oRequestAnimationFrame ||
            window.msRequestAnimationFrame;

      container.id = 'bunnymark';
      container.style.cssText =
        'height:' + height + 'px;width:' + width + 'px;' +
        'cursor:pointer;font-family:sans-serif;font-size:.6em;' +
        '-webkit-user-select:none;-khtml-user-select:none;-moz-user-select:none;' +
        '-o-user-select:none;user-select:none';

      canvas.width = width;
      canvas.height = height;
      canvas.style.cssText = 'float:left';

      status = document.createElement('p');
      status.style.cssText = 'padding-left:5px;background:#111;color:#fff';

      container.appendChild(canvas);
      container.appendChild(status);
      body.appendChild(container);
      addListener(container, 'click', addBunnies);

      fillStyle = ctx.createPattern(grassImage, 'repeat');
      addBunnies(5);

      // start animating
      if (reqFrame) {
        reqFrame(callback);
      } else {
        setInterval(render, 1e3/60);
      }
    });
  }
}(this, this.document));