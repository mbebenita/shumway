package adobe.utils {
  public final class ProductManager extends EventDispatcher {
    public function ProductManager(name:String = null, shared:Boolean = false) {}
    public native function get running():Boolean;
    public native function get installed():Boolean;
    public native function launch(parameters:String = null):Boolean;
    public native function get installedVersion():String;
    public function download(caption:String = null, fileName:String = null, pathElements:Array = null):Boolean { notImplemented("download"); }
    public native function doSelfUpgrade(os:String):Boolean;
  }
}
