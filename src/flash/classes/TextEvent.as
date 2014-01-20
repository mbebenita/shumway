package flash.events {
  public class TextEvent extends Event {
    public function TextEvent(type:String, bubbles:Boolean = false, cancelable:Boolean = false, text:String = "") {}
    public static const LINK:String = "link";
    public static const TEXT_INPUT:String = "textInput";
    public function get text():String { notImplemented("text"); }
    public function set text(value:String):void { notImplemented("text"); }
    public override function clone():Event { notImplemented("clone"); }
    public override function toString():String { notImplemented("toString"); }
  }
}
