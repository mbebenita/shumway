package flash.events {
  public class UncaughtErrorEvent extends ErrorEvent {
    public function UncaughtErrorEvent(type:String = "uncaughtError", bubbles:Boolean = true, cancelable:Boolean = true, error_in = null) {}
    public static const UNCAUGHT_ERROR:String = "uncaughtError";
    public override function clone():Event { notImplemented("clone"); }
    public function get error() { notImplemented("error"); }
    public override function toString():String { notImplemented("toString"); }
  }
}
