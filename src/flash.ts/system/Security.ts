/**
 * Copyright 2014 Mozilla Foundation
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 * http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
// Class: Security
module Shumway.AVM2.AS.flash.system {
  import notImplemented = Shumway.Debug.notImplemented;
  import asCoerceString = Shumway.AVM2.Runtime.asCoerceString;
  import somewhatImplemented = Shumway.Debug.somewhatImplemented;

  export class Security extends ASNative {
    
    // Called whenever the class is initialized.
    static classInitializer: any = null;
    
    // Called whenever an instance of the class is initialized.
    static initializer: any = null;
    
    // List of static symbols to link.
    static classSymbols: string [] = null; // [];
    
    // List of instance symbols to link.
    static instanceSymbols: string [] = null; // [];
    
    constructor () {
      false && super();
      notImplemented("Dummy Constructor: public flash.system.Security");
    }
    
    // JS -> AS Bindings
    static REMOTE: string = "remote";
    static LOCAL_WITH_FILE: string = "localWithFile";
    static LOCAL_WITH_NETWORK: string = "localWithNetwork";
    static LOCAL_TRUSTED: string = "localTrusted";
    static APPLICATION: string = "application";
    
    
    // AS -> JS Bindings
    private static _exactSettings: boolean = false;
    // static _disableAVM1Loading: boolean;
    private static _sandboxType: string = 'remote';
    // static _pageDomain: string;
    static get exactSettings(): boolean {
      return Security._exactSettings;
    }
    static set exactSettings(value: boolean) {
      value = !!value;
      Security._exactSettings = value;
    }
    static get disableAVM1Loading(): boolean {
      notImplemented("public flash.system.Security::get disableAVM1Loading"); return;
      // return Security._disableAVM1Loading;
    }
    static set disableAVM1Loading(value: boolean) {
      value = !!value;
      notImplemented("public flash.system.Security::set disableAVM1Loading"); return;
      // Security._disableAVM1Loading = value;
    }
    static get sandboxType(): string {
      somewhatImplemented("public flash.system.Security::get sandboxType");
      return Security._sandboxType;
    }
    static get pageDomain(): string {
      somewhatImplemented("public flash.system.Security::get pageDomain");
      var pageHost: string = Shumway.FileLoadingService.instance.resolveUrl('/');
      var parts = pageHost.split('/'); parts.pop();
      return parts.pop();
    }
    static allowDomain(): void {
      somewhatImplemented("public flash.system.Security::static allowDomain [\"" +
        Array.prototype.join.call(arguments, "\", \"") + "\"]");
    }
    static allowInsecureDomain(): void {
      somewhatImplemented("public flash.system.Security::static allowInsecureDomain");
    }
    static loadPolicyFile(url: string): void {
      url = asCoerceString(url);
      somewhatImplemented("public flash.system.Security::static loadPolicyFile");
    }
    static showSettings(panel: string = "default"): void {
      panel = asCoerceString(panel);
      notImplemented("public flash.system.Security::static showSettings"); return;
    }
    static duplicateSandboxBridgeInputArguments(toplevel: ASObject, args: any []): any [] {
      toplevel = toplevel; args = args;
      notImplemented("public flash.system.Security::static duplicateSandboxBridgeInputArguments"); return;
    }
    static duplicateSandboxBridgeOutputArgument(toplevel: ASObject, arg: any): any {
      toplevel = toplevel;
      notImplemented("public flash.system.Security::static duplicateSandboxBridgeOutputArgument"); return;
    }
    
  }
}
