# xStats.js <sup>v1.0.0-pre</sup>
## Cross-browser JavaScript Performance Monitor

xStats provides simple charts to help monitor your code performance.

* **FPS** Frames rendered per second. The higher the number the better.
* **MS** Milliseconds needed to render a frame. The lower the number the better.
* **MEM** Megabytes of memory used. Make sure it doesn't keep incrementing. *(WebKit-based browsers only)*

## BestieJS Incubator

xStats still needs a little work to be worthy of the title *"Best in Class"*. Please, feel free to contribute additional unit tests or documentation.

## Documentation

The documentation for xStats.js can be viewed here: [/doc/README.md](https://github.com/bestiejs/xstats.js/blob/master/doc/README.md#readme)

For more information on the techniques and code behind xStats.js please check out [my screencast](http://allyoucanleet.com/post/18087971334/performance-monitoring-for-all) over it.

## Screenshots

![xStats](https://github.com/bestiejs/xstats.js/raw/master/xstats.png)

## Usage

```js
var stats = new xStats;
document.body.appendChild(stats.element);
```

## Enable MEM

* **Chrome**
  * Linux: `/opt/google/chrome/google-chrome --enable-memory-info`
  * Windows: `"C:\Program Files\Google\Chrome\Application\chrome.exe" --enable-memory-info`
  * MacOS: `/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --enable-memory-info`

* **Safari**
  * MacOS: Open `~/Library/Preferences/com.apple.Safari.plist` file for editing, and
    check `WebKitMemoryInfoEnabled`

## Author

* [John-David Dalton](http://allyoucanleet.com/)
  [![twitter/jdalton](http://gravatar.com/avatar/299a3d891ff1920b69c364d061007043?s=70)](https://twitter.com/jdalton "Follow @jdalton on Twitter")
