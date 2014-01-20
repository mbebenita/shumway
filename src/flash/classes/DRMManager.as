package flash.net.drm {
  public class DRMManager extends EventDispatcher {
    public function DRMManager() {}
    public static function getDRMManager():DRMManager { notImplemented("getDRMManager"); }
    public static function get isSupported():Boolean { notImplemented("isSupported"); }
    public function authenticate(serverURL:String, domain:String, username:String, password:String):void { notImplemented("authenticate"); }
    public function setAuthenticationToken(serverUrl:String, domain:String, token:ByteArray):void { notImplemented("setAuthenticationToken"); }
    public function loadVoucher(contentData:DRMContentData, setting:String):void { notImplemented("loadVoucher"); }
    public function loadPreviewVoucher(contentData:DRMContentData):void { notImplemented("loadPreviewVoucher"); }
    public function storeVoucher(voucher:ByteArray):void { notImplemented("storeVoucher"); }
  }
}
