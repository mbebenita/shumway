package flash.utils {
  packageInternal final class SetIntervalTimer extends Timer {
    public function SetIntervalTimer(closure:Function, delay:Number, repeats:Boolean, rest:Array) {}
    packageInternal static function clearInterval(id_to_clear:uint):void { notImplemented("clearInterval"); }
    packageInternal var id:uint;
  }
}
