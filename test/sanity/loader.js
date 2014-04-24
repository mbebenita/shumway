(function displayLoaderTests() {
  var Event = flash.events.Event;
  var Stage = flash.display.Stage;
  var Loader = flash.display.Loader;
  var URLRequest = flash.net.URLRequest;
  var DisplayObject = flash.display.DisplayObject;
  var DisplayObjectContainer = flash.display.DisplayObjectContainer;

  function log(message) {
    console.info(message);
  }

  //for (var i = 0; i < 75; i++) {
  //  unitTests.push(function runInspectorSanityTests() {
  //    return new Promise(function (resolve, reject) {
  //      var r = new URLRequest("../as3_tiger/tiger.swf");
  //      var l = new Loader();
  //      var s = new Stage();
  //
  //      var initEventCalled = false;
  //      var completeEventCalled = false;
  //      var initEventPromise = new Promise(function (resolve) {
  //        l.contentLoaderInfo.addEventListener(Event.INIT, function (event) {
  //          initEventCalled = true;
  //          resolve();
  //        });
  //      });
  //
  //      var completeEventPromise = new Promise(function (resolve) {
  //        l.contentLoaderInfo.addEventListener(Event.COMPLETE, function (event) {
  //          completeEventCalled = true;
  //          resolve();
  //        });
  //      });
  //
  //      l.load(r);
  //
  //      var checkEvents = function () {
  //        check(initEventCalled, "Check contentLoaderInfo initEventCalled");
  //        check(completeEventCalled, "Check contentLoaderInfo completeEventCalled");
  //      };
  //
  //      var timeout = setTimeout(function () {
  //        reject('timeout');
  //      }, 1000);
  //
  //      Promise.all([initEventPromise, completeEventPromise]).then(function () {
  //        clearTimeout(timeout);
  //        checkEvents();
  //      }).then(resolve, reject);
  //    });
  //  });
  //}
  //
  //unitTests.push(function runInspectorSanityTests() {
  //  var r = new URLRequest("../as3_tiger/tiger.swf");
  //  var l = new Loader();
  //  var s = new Stage();
  //
  //  l.contentLoaderInfo.addEventListener(Event.INIT, function (event) {
  //    check(l.content, "We should have some content here.");
  //    check(l.content.root === l.content, "This should be the root.");
  //    check(DisplayObject.isType(l.content));
  //    s.stageWidth = l.contentLoaderInfo.width;
  //    s.stageHeight = l.contentLoaderInfo.height;
  //    s.frameRate = l.contentLoaderInfo.frameRate;
  //    s.addChild(l.content);
  //    check(s.frameRate);
  //  });
  //
  //  l.load(r);
  //
  //});

  unitTests.push(function runInspectorSanityTests() {
    var r = new URLRequest("../simple.swf");
    var l = new Loader();
    var s = new Stage();

    l.contentLoaderInfo.addEventListener(Event.INIT, function (event) {

    });

    l.load(r);

  });

})();
