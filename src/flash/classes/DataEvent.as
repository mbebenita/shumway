package flash.events {
  public class DataEvent extends TextEvent {
    public function DataEvent(type:String, bubbles:Boolean = false, cancelable:Boolean = false, data:String = "") {}
    public static const DATA:String = "data";
    public static const UPLOAD_COMPLETE_DATA:String = "uploadCompleteData";
    public override function clone():Event { notImplemented("clone"); }
    public override function toString():String { notImplemented("toString"); }
    public function get data():String { notImplemented("data"); }
    public function set data(value:String):void { notImplemented("data"); }
  }
}
