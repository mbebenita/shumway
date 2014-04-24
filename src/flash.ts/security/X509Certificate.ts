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
// Class: X509Certificate
module Shumway.AVM2.AS.flash.security {
  import notImplemented = Shumway.Debug.notImplemented;
  import asCoerceString = Shumway.AVM2.Runtime.asCoerceString;
  export class X509Certificate extends ASNative {
    
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
      notImplemented("Dummy Constructor: public flash.security.X509Certificate");
    }
    
    // JS -> AS Bindings
    
    
    // AS -> JS Bindings
    
    // _version: number /*uint*/;
    // _serialNumber: string;
    // _signatureAlgorithmOID: string;
    // _signatureAlgorithmParams: flash.utils.ByteArray;
    // _issuer: flash.security.X500DistinguishedName;
    // _validNotBefore: ASDate;
    // _validNotAfter: ASDate;
    // _subject: flash.security.X500DistinguishedName;
    // _subjectPublicKeyAlgorithmOID: string;
    // _subjectPublicKey: string;
    // _issuerUniqueID: string;
    // _subjectUniqueID: string;
    // _encoded: flash.utils.ByteArray;
    get version(): number /*uint*/ {
      notImplemented("public flash.security.X509Certificate::get version"); return;
      // return this._version;
    }
    get serialNumber(): string {
      notImplemented("public flash.security.X509Certificate::get serialNumber"); return;
      // return this._serialNumber;
    }
    get signatureAlgorithmOID(): string {
      notImplemented("public flash.security.X509Certificate::get signatureAlgorithmOID"); return;
      // return this._signatureAlgorithmOID;
    }
    get signatureAlgorithmParams(): flash.utils.ByteArray {
      notImplemented("public flash.security.X509Certificate::get signatureAlgorithmParams"); return;
      // return this._signatureAlgorithmParams;
    }
    get issuer(): flash.security.X500DistinguishedName {
      notImplemented("public flash.security.X509Certificate::get issuer"); return;
      // return this._issuer;
    }
    get validNotBefore(): ASDate {
      notImplemented("public flash.security.X509Certificate::get validNotBefore"); return;
      // return this._validNotBefore;
    }
    get validNotAfter(): ASDate {
      notImplemented("public flash.security.X509Certificate::get validNotAfter"); return;
      // return this._validNotAfter;
    }
    get subject(): flash.security.X500DistinguishedName {
      notImplemented("public flash.security.X509Certificate::get subject"); return;
      // return this._subject;
    }
    get subjectPublicKeyAlgorithmOID(): string {
      notImplemented("public flash.security.X509Certificate::get subjectPublicKeyAlgorithmOID"); return;
      // return this._subjectPublicKeyAlgorithmOID;
    }
    get subjectPublicKey(): string {
      notImplemented("public flash.security.X509Certificate::get subjectPublicKey"); return;
      // return this._subjectPublicKey;
    }
    get issuerUniqueID(): string {
      notImplemented("public flash.security.X509Certificate::get issuerUniqueID"); return;
      // return this._issuerUniqueID;
    }
    get subjectUniqueID(): string {
      notImplemented("public flash.security.X509Certificate::get subjectUniqueID"); return;
      // return this._subjectUniqueID;
    }
    get encoded(): flash.utils.ByteArray {
      notImplemented("public flash.security.X509Certificate::get encoded"); return;
      // return this._encoded;
    }
  }
}
