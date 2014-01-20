package flash.system {
  public final class AuthorizedFeatures {
    public function AuthorizedFeatures() {}
    public native function createApplicationInstaller(strings:XML, icon:ByteArray):ApplicationInstaller;
    public native function enableDiskCache(stream:URLStream):Boolean;
    packageInternal native function isFeatureEnabled(feature:String, data:String = null):Boolean;
    packageInternal native function isNegativeToken():Boolean;
  }
}
