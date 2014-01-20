package flash.utils {
  public class Timer extends EventDispatcher {
    public function Timer(delay:Number, repeatCount:int = 0) {}
    public function get delay():Number { notImplemented("delay"); }
    public function get repeatCount():int { notImplemented("repeatCount"); }
    public function set repeatCount(value:int):void { notImplemented("repeatCount"); }
    public function get currentCount():int { notImplemented("currentCount"); }
    public native function get running():Boolean;
    public function set delay(value:Number):void { notImplemented("delay"); }
    public function start():void { notImplemented("start"); }
    public function reset():void { notImplemented("reset"); }
    public native function stop():void;
  }
}
