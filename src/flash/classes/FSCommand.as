package flash.system {
  packageInternal final class FSCommand {
    public function FSCommand() {}
    public static native function _fscommand(command:String, args:String):void;
  }
}
