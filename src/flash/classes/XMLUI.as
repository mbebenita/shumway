package adobe.utils {
  public final class XMLUI {
    public function XMLUI() {}
    public static native function getProperty(name:String):String;
    public static native function setProperty(name:String, value:String):void;
    public static native function accept():void;
    public static native function cancel():void;
  }
}
