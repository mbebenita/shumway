package flash.events {
  public class AsyncErrorEvent extends ErrorEvent {
    public function AsyncErrorEvent(type:String, bubbles:Boolean = false, cancelable:Boolean = false, text:String = "", error:Error = null) {}
    public static const ASYNC_ERROR:String = "asyncError";
    public var error:Error;
    public override function clone():Event { notImplemented("clone"); }
    public override function toString():String { notImplemented("toString"); }
  }
}
