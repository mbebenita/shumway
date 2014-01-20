package flash.system {
  public final class WorkerDomain {
    public function WorkerDomain() {}
    public static native function get isSupported():Boolean;
    public static function get current():WorkerDomain { notImplemented("current"); }
    public native function createWorker(swf:ByteArray, giveAppPrivileges:Boolean = false):Worker;
    public native function listWorkers():Vector;
  }
}
