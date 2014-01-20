package flash.events {
  public class NetFilterEvent extends Event {
    public function NetFilterEvent(type:String, bubbles:Boolean = false, cancelable:Boolean = false, header:ByteArray = null, data:ByteArray = null) {}
    public var header:ByteArray;
    public var data:ByteArray;
    public override function clone():Event { notImplemented("clone"); }
    public override function toString():String { notImplemented("toString"); }
  }
}
