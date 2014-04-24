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
// Class: X500DistinguishedName
module Shumway.AVM2.AS.flash.security {
  import notImplemented = Shumway.Debug.notImplemented;
  import asCoerceString = Shumway.AVM2.Runtime.asCoerceString;
  export class X500DistinguishedName extends ASNative {
    
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
      notImplemented("Dummy Constructor: public flash.security.X500DistinguishedName");
    }
    
    // JS -> AS Bindings
    
    
    // AS -> JS Bindings
    
    // _commonName: string;
    // _organizationName: string;
    // _organizationalUnitName: string;
    // _localityName: string;
    // _stateOrProvinceName: string;
    // _countryName: string;
    get commonName(): string {
      notImplemented("public flash.security.X500DistinguishedName::get commonName"); return;
      // return this._commonName;
    }
    get organizationName(): string {
      notImplemented("public flash.security.X500DistinguishedName::get organizationName"); return;
      // return this._organizationName;
    }
    get organizationalUnitName(): string {
      notImplemented("public flash.security.X500DistinguishedName::get organizationalUnitName"); return;
      // return this._organizationalUnitName;
    }
    get localityName(): string {
      notImplemented("public flash.security.X500DistinguishedName::get localityName"); return;
      // return this._localityName;
    }
    get stateOrProvinceName(): string {
      notImplemented("public flash.security.X500DistinguishedName::get stateOrProvinceName"); return;
      // return this._stateOrProvinceName;
    }
    get countryName(): string {
      notImplemented("public flash.security.X500DistinguishedName::get countryName"); return;
      // return this._countryName;
    }
    toString(): string {
      notImplemented("public flash.security.X500DistinguishedName::toString"); return;
    }
  }
}
