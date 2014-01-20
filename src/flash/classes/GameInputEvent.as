package flash.events {
  public final class GameInputEvent extends Event {
    public function GameInputEvent(type:String, bubbles:Boolean = false, cancelable:Boolean = false, device:GameInputDevice = null) {}
    public static const DEVICE_ADDED:String = "deviceAdded";
    public static const DEVICE_REMOVED:String = "deviceRemoved";
    public function get device():GameInputDevice { notImplemented("device"); }
  }
}
