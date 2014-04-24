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
// Class: SecurityDomain
module Shumway.AVM2.AS.flash.system {
  import notImplemented = Shumway.Debug.notImplemented;
  import asCoerceString = Shumway.AVM2.Runtime.asCoerceString;
  export class SecurityDomain extends ASNative {
    
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
      notImplemented("Dummy Constructor: public flash.system.SecurityDomain");
    }
    
    // JS -> AS Bindings
    
    
    // AS -> JS Bindings
    // static _currentDomain: flash.system.SecurityDomain;
    get currentDomain(): flash.system.SecurityDomain {
      notImplemented("public flash.system.SecurityDomain::get currentDomain"); return;
      // return this._currentDomain;
    }
    
    // _domainID: string;
    get domainID(): string {
      notImplemented("public flash.system.SecurityDomain::get domainID"); return;
      // return this._domainID;
    }
  }
}
