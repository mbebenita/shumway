package flash.net {
  public class SecureSocket extends Socket {
    public function SecureSocket() {}
    public static native function get isSupported():Boolean;
    public override function connect(host:String, port:int):void { notImplemented("connect"); }
    public function get serverCertificateStatus():String { notImplemented("serverCertificateStatus"); }
    public native function get serverCertificate():X509Certificate;
    public native function addBinaryChainBuildingCertificate(certificate:ByteArray, trusted:Boolean):void;
  }
}
