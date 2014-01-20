package flash.media {
  public class H264VideoStreamSettings extends VideoStreamSettings {
    public function H264VideoStreamSettings() {}
    public override function get codec():String { notImplemented("codec"); }
    public function setProfileLevel(profile:String, level:String):void { notImplemented("setProfileLevel"); }
    public function get profile():String { notImplemented("profile"); }
    public function get level():String { notImplemented("level"); }
  }
}
