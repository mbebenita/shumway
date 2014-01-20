package adobe.utils {
  public final class CustomActions {
    public function CustomActions() {}
    public static native function installActions(name:String, data:String):void;
    public static native function uninstallActions(name:String):void;
    public static native function get actionsList():Array;
    public static native function getActions(name:String):String;
  }
}
