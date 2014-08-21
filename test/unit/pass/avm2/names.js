(function isIndex() {
  unitTests.push(function () {
    check(Shumway.isIndex("0"));
    check(Shumway.isIndex("1"));
    check(Shumway.isIndex("123456"));
    check(!Shumway.isIndex("0x1234"));
    check(!Shumway.isIndex("123456789123456"));
    check(!Shumway.isIndex("0123"));
    check(!Shumway.isIndex("-1"));
    for (var i = 0; i < 30; i++) {
      check(Shumway.isIndex(String(1 << i)));
    }
    check(!Shumway.isIndex(String(1 << 31)));
  });

  unitTests.push(function () {
    var o = {};
    function testReadWrite(o, n, v) {
      o.asSetProperty(undefined, n, 0, v);
      eq(o.asGetProperty(undefined, n, 0), v);
    }
    testReadWrite(o, 1, 2);
  });
})();
