package flash.media {
  public final class SoundChannel extends EventDispatcher {
    public function SoundChannel() {}
    public native function get position():Number;
    public native function get soundTransform():SoundTransform;
    public native function set soundTransform(sndTransform:SoundTransform):void;
    public native function stop():void;
    public native function get leftPeak():Number;
    public native function get rightPeak():Number;
  }
}
