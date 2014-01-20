package flash.net.drm {
  public class DRMContentData {
    public function DRMContentData(rawData:ByteArray = null) {}
    public function get serverURL():String { notImplemented("serverURL"); }
    public native function get authenticationMethod():String;
    public function get licenseID():String { notImplemented("licenseID"); }
    public function get domain():String { notImplemented("domain"); }
    public function getVoucherAccessInfo():Vector { notImplemented("getVoucherAccessInfo"); }
  }
}
