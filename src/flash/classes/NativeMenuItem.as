package flash.display {
  public class NativeMenuItem extends EventDispatcher {
    public function NativeMenuItem() {}
    public native function get enabled():Boolean;
    public native function set enabled(isSeparator:Boolean):void;
  }
}
