# xStats.js <sup>v1.0.0-pre</sup>

<!-- div -->


<!-- div -->

## <a id="xStats"></a>`xStats`
* [`xStats`](#xstatsoptions)
* [`xStats.subclasses`](#xstatssubclasses)

<!-- /div -->


<!-- div -->

## `xStats.prototype`
* [`xStats.prototype.height`](#xstatsprototypeheight)
* [`xStats.prototype.locked`](#xstatsprototypelocked)
* [`xStats.prototype.mode`](#xstatsprototypemode)
* [`xStats.prototype.padding`](#xstatsprototypepadding)
* [`xStats.prototype.sampleRate`](#xstatsprototypesamplerate)
* [`xStats.prototype.width`](#xstatsprototypewidth)
* [`xStats.prototype.addListener`](#xstatsprototypeaddlistenertype-listener)
* [`xStats.prototype.emit`](#xstatsprototypeemittype)
* [`xStats.prototype.on`](#xstatsprototypeon)
* [`xStats.prototype.removeAllListeners`](#xstatsprototyperemovealllistenerstype)
* [`xStats.prototype.removeListener`](#xstatsprototyperemovelistenertype-listener)

<!-- /div -->


<!-- div -->

## `xStats.prototype.fps`
* [`xStats.prototype.fps`](#xstatsprototypefps)
* [`xStats.prototype.fps.bg`](#xstats-fpsbg)
* [`xStats.prototype.fps.fg`](#xstats-fpsfg)

<!-- /div -->


<!-- div -->

## `xStats.prototype.mem`
* [`xStats.prototype.mem`](#xstatsprototypemem)
* [`xStats.prototype.mem.bg`](#xstats-membg)
* [`xStats.prototype.mem.fg`](#xstats-memfg)

<!-- /div -->


<!-- div -->

## `xStats.prototype.ms`
* [`xStats.prototype.ms`](#xstatsprototypems)
* [`xStats.prototype.ms.bg`](#xstats-msbg)
* [`xStats.prototype.ms.fg`](#xstats-msfg)

<!-- /div -->


<!-- div -->

## `xStats.Event`
* [`xStats.Event`](#xstatseventtype)

<!-- /div -->


<!-- div -->

## `xStats.Event.prototype`
* [`xStats.Event.prototype.type`](#xstatseventprototypetype)

<!-- /div -->


<!-- /div -->


<!-- div -->


<!-- div -->

## `xStats`

<!-- div -->

### <a id="xstatsoptions"></a>`xStats([options={}])`
<a href="#xstatsoptions">#</a> [&#x24C8;](https://github.com/bestiejs/xstats.js/blob/master/xstats.js#L95 "View in source") [&#x24C9;][1]

The xStats constructor.

#### Arguments
1. `[options={}]` *(Object)*: Options object.

#### Example
```js
// basic usage (the `new` operator is optional)
var stats = new xStats;

// or using options
var stats = new xStats({
  'mode': 'ms',
  'height': 130,
  'width':200,
  'padding':10,
  'locked': false,
  'fps': {
    'bg': '#330000',
    'fg': '#cc6600'
  },
  'ms': {
    'bg': '#000033',
    'fg': '#3366ff'
  },
  'mem': {
    'bg': '#000033',
    'fg': '#660099'
  }
});

// insert into document
document.body.appendChild(stats.element);
```

* * *

<!-- /div -->


<!-- div -->

### <a id="xstatssubclasses"></a>`xStats.subclasses`
<a href="#xstatssubclasses">#</a> [&#x24C8;](https://github.com/bestiejs/xstats.js/blob/master/xstats.js#L566 "View in source") [&#x24C9;][1]

*(Array)*: An array of xStat instances.

* * *

<!-- /div -->


<!-- /div -->


<!-- div -->

## `xStats.prototype`

<!-- div -->

### <a id="xstatsprototypeheight"></a>`xStats.prototype.height`
<a href="#xstatsprototypeheight">#</a> [&#x24C8;](https://github.com/bestiejs/xstats.js/blob/master/xstats.js#L578 "View in source") [&#x24C9;][1]

*(Number)*: The height of the chart *(px)*.

* * *

<!-- /div -->


<!-- div -->

### <a id="xstatsprototypelocked"></a>`xStats.prototype.locked`
<a href="#xstatsprototypelocked">#</a> [&#x24C8;](https://github.com/bestiejs/xstats.js/blob/master/xstats.js#L602 "View in source") [&#x24C9;][1]

*(Boolean)*: A flag to indicate if the chart is locked at its current display mode.

* * *

<!-- /div -->


<!-- div -->

### <a id="xstatsprototypemode"></a>`xStats.prototype.mode`
<a href="#xstatsprototypemode">#</a> [&#x24C8;](https://github.com/bestiejs/xstats.js/blob/master/xstats.js#L610 "View in source") [&#x24C9;][1]

*(String)*: The charts current display mode *(fps, ms, mem)*.

* * *

<!-- /div -->


<!-- div -->

### <a id="xstatsprototypepadding"></a>`xStats.prototype.padding`
<a href="#xstatsprototypepadding">#</a> [&#x24C8;](https://github.com/bestiejs/xstats.js/blob/master/xstats.js#L594 "View in source") [&#x24C9;][1]

*(Number)*: The inner padding of the chart that doesn't affect dimensions *(px)*.

* * *

<!-- /div -->


<!-- div -->

### <a id="xstatsprototypesamplerate"></a>`xStats.prototype.sampleRate`
<a href="#xstatsprototypesamplerate">#</a> [&#x24C8;](https://github.com/bestiejs/xstats.js/blob/master/xstats.js#L618 "View in source") [&#x24C9;][1]

*(Number)*: The rate at which the "sample" event is emitted *(secs)*.

* * *

<!-- /div -->


<!-- div -->

### <a id="xstatsprototypewidth"></a>`xStats.prototype.width`
<a href="#xstatsprototypewidth">#</a> [&#x24C8;](https://github.com/bestiejs/xstats.js/blob/master/xstats.js#L586 "View in source") [&#x24C9;][1]

*(Number)*: The width of the chart *(px)*.

* * *

<!-- /div -->


<!-- div -->

### <a id="xstatsprototypeaddlistenertype-listener"></a>`xStats.prototype.addListener(type, listener)`
<a href="#xstatsprototypeaddlistenertype-listener">#</a> [&#x24C8;](https://github.com/bestiejs/xstats.js/blob/master/xstats.js#L330 "View in source") [&#x24C9;][1]

Registers a single listener for the specified event type(s).

#### Arguments
1. `type` *(String)*: The event type.
2. `listener` *(Function)*: The function called when the event occurs.

#### Returns
*(Object)*: The xStats instance.

#### Example
```js
// register a listener for an event type
xs.addListener('sample', listener);

// register a listener for multiple event types
xs.addListener('start sample', listener);
```

* * *

<!-- /div -->


<!-- div -->

### <a id="xstatsprototypeemittype"></a>`xStats.prototype.emit(type)`
<a href="#xstatsprototypeemittype">#</a> [&#x24C8;](https://github.com/bestiejs/xstats.js/blob/master/xstats.js#L347 "View in source") [&#x24C9;][1]

Executes all registered listeners of the specified event type.

#### Arguments
1. `type` *(String|Object)*: The event type or object.

#### Returns
*(Boolean)*: Returns `true` if all listeners were executed, else `false`.

* * *

<!-- /div -->


<!-- div -->

### <a id="xstatsprototypeon"></a>`xStats.prototype.on`
<a href="#xstatsprototypeon">#</a> [&#x24C8;](https://github.com/bestiejs/xstats.js/blob/master/xstats.js#L626 "View in source") [&#x24C9;][1]

Alias of [`xStats#addListener`](#xStats:addListener).

* * *

<!-- /div -->


<!-- div -->

### <a id="xstatsprototyperemovealllistenerstype"></a>`xStats.prototype.removeAllListeners(type)`
<a href="#xstatsprototyperemovealllistenerstype">#</a> [&#x24C8;](https://github.com/bestiejs/xstats.js/blob/master/xstats.js#L409 "View in source") [&#x24C9;][1]

Unregisters all listeners or those for the specified event type(s).

#### Arguments
1. `type` *(String)*: The event type.

#### Returns
*(Object)*: The xStats instance.

#### Example
```js
// unregister all listeners
xs.removeAllListeners();

// unregister all listeners for an event type
xs.removeAllListeners('sample');

// unregister all listeners for multiple event types
xs.removeAllListeners('start sample complete');
```

* * *

<!-- /div -->


<!-- div -->

### <a id="xstatsprototyperemovelistenertype-listener"></a>`xStats.prototype.removeListener(type, listener)`
<a href="#xstatsprototyperemovelistenertype-listener">#</a> [&#x24C8;](https://github.com/bestiejs/xstats.js/blob/master/xstats.js#L378 "View in source") [&#x24C9;][1]

Unregisters a single listener for the specified event type(s).

#### Arguments
1. `type` *(String)*: The event type.
2. `listener` *(Function)*: The function to unregister.

#### Returns
*(Object)*: The xStats instance.

#### Example
```js
// unregister a listener for an event type
xs.removeListener('sample', listener);

// unregister a listener for multiple event types
xs.removeListener('start sample', listener);
```

* * *

<!-- /div -->


<!-- /div -->


<!-- div -->

## `xStats.prototype.fps`

<!-- div -->

### <a id="xstatsprototypefps"></a>`xStats.prototype.fps`
<a href="#xstatsprototypefps">#</a> [&#x24C8;](https://github.com/bestiejs/xstats.js/blob/master/xstats.js#L634 "View in source") [&#x24C9;][1]

*(Object)*: The "frames per second" display mode options object.

* * *

<!-- /div -->


<!-- div -->

### <a id="xstats-fpsbg"></a>`xStats.prototype.fps.bg`
<a href="#xstats-fpsbg">#</a> [&#x24C8;](https://github.com/bestiejs/xstats.js/blob/master/xstats.js#L642 "View in source") [&#x24C9;][1]

*(String)*: The background color of the chart for the display mode.

* * *

<!-- /div -->


<!-- div -->

### <a id="xstats-fpsfg"></a>`xStats.prototype.fps.fg`
<a href="#xstats-fpsfg">#</a> [&#x24C8;](https://github.com/bestiejs/xstats.js/blob/master/xstats.js#L650 "View in source") [&#x24C9;][1]

*(String)*: The foreground color of the chart for the display mode.

* * *

<!-- /div -->


<!-- /div -->


<!-- div -->

## `xStats.prototype.mem`

<!-- div -->

### <a id="xstatsprototypemem"></a>`xStats.prototype.mem`
<a href="#xstatsprototypemem">#</a> [&#x24C8;](https://github.com/bestiejs/xstats.js/blob/master/xstats.js#L684 "View in source") [&#x24C9;][1]

*(Object)*: The "memory" display mode options object.

* * *

<!-- /div -->


<!-- div -->

### <a id="xstats-membg"></a>`xStats.prototype.mem.bg`
<a href="#xstats-membg">#</a> [&#x24C8;](https://github.com/bestiejs/xstats.js/blob/master/xstats.js#L692 "View in source") [&#x24C9;][1]

*(String)*: The background color of the chart for the display mode.

* * *

<!-- /div -->


<!-- div -->

### <a id="xstats-memfg"></a>`xStats.prototype.mem.fg`
<a href="#xstats-memfg">#</a> [&#x24C8;](https://github.com/bestiejs/xstats.js/blob/master/xstats.js#L700 "View in source") [&#x24C9;][1]

*(String)*: The foreground color of the chart for the display mode.

* * *

<!-- /div -->


<!-- /div -->


<!-- div -->

## `xStats.prototype.ms`

<!-- div -->

### <a id="xstatsprototypems"></a>`xStats.prototype.ms`
<a href="#xstatsprototypems">#</a> [&#x24C8;](https://github.com/bestiejs/xstats.js/blob/master/xstats.js#L659 "View in source") [&#x24C9;][1]

*(Object)*: The "millisecond" display mode options object.

* * *

<!-- /div -->


<!-- div -->

### <a id="xstats-msbg"></a>`xStats.prototype.ms.bg`
<a href="#xstats-msbg">#</a> [&#x24C8;](https://github.com/bestiejs/xstats.js/blob/master/xstats.js#L667 "View in source") [&#x24C9;][1]

*(String)*: The background color of the chart for the display mode.

* * *

<!-- /div -->


<!-- div -->

### <a id="xstats-msfg"></a>`xStats.prototype.ms.fg`
<a href="#xstats-msfg">#</a> [&#x24C8;](https://github.com/bestiejs/xstats.js/blob/master/xstats.js#L675 "View in source") [&#x24C9;][1]

*(String)*: The foreground color of the chart for the display mode.

* * *

<!-- /div -->


<!-- /div -->


<!-- div -->

## `xStats.Event`

<!-- div -->

### <a id="xstatseventtype"></a>`xStats.Event(type)`
<a href="#xstatseventtype">#</a> [&#x24C8;](https://github.com/bestiejs/xstats.js/blob/master/xstats.js#L52 "View in source") [&#x24C9;][1]

The Event constructor.

#### Arguments
1. `type` *(String|Object)*: The event type.

* * *

<!-- /div -->


<!-- /div -->


<!-- div -->

## `xStats.Event.prototype`

<!-- div -->

### <a id="xstatseventprototypetype"></a>`xStats.Event.prototype.type`
<a href="#xstatseventprototypetype">#</a> [&#x24C8;](https://github.com/bestiejs/xstats.js/blob/master/xstats.js#L724 "View in source") [&#x24C9;][1]

*(String)*: The event type.

* * *

<!-- /div -->


<!-- /div -->


<!-- /div -->


  [1]: #xStats "Jump back to the TOC."