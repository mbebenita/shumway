package flash.errors {
  public class DRMManagerError extends Error {
    public function DRMManagerError(message:String, id:int, subErrorID:int) {}
    public function get subErrorID():int { notImplemented("subErrorID"); }
    public function toString():String { notImplemented("toString"); }
  }
}
