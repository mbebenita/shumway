package flash.events {
  public class EventDispatcher implements IEventDispatcher {
    public function EventDispatcher(target:IEventDispatcher = null) {}
    public function toString():String { notImplemented("toString"); }
    public native function addEventListener(type:String, listener:Function, useCapture:Boolean = false, priority:int = 0, useWeakReference:Boolean = false):void;
    public native function removeEventListener(type:String, listener:Function, useCapture:Boolean = false):void;
    public function dispatchEvent(event:Event):Boolean { notImplemented("dispatchEvent"); }
    public native function hasEventListener(type:String):Boolean;
    public native function willTrigger(type:String):Boolean;
  }
}
