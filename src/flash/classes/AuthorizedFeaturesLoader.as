package flash.system {
  public final class AuthorizedFeaturesLoader extends EventDispatcher {
    public function AuthorizedFeaturesLoader() {}
    public native function get authorizedFeatures():AuthorizedFeatures;
    public native function loadAuthorizedFeatures():void;
    packageInternal native function makeGlobal():void;
  }
}
