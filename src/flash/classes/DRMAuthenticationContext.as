package flash.net.drm {
  packageInternal class DRMAuthenticationContext extends DRMManagerSession {
    public function DRMAuthenticationContext() {}
    public function authenticate(url:String, domain:String, username:String, password:String):void { notImplemented("authenticate"); }
    public override function onSessionComplete():void { notImplemented("onSessionComplete"); }
    public override function onSessionError():void { notImplemented("onSessionError"); }
    public function get authenticationToken():ByteArray { notImplemented("authenticationToken"); }
  }
}
