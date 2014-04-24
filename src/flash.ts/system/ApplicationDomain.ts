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
// Class: ApplicationDomain
module Shumway.AVM2.AS.flash.system {
  import notImplemented = Shumway.Debug.notImplemented;
  import asCoerceString = Shumway.AVM2.Runtime.asCoerceString;
  import AVM2 = Shumway.AVM2.Runtime.AVM2;
  import ExecutionMode = Shumway.AVM2.Runtime.ExecutionMode;
  import RuntimeApplicationDomain = Shumway.AVM2.Runtime.ApplicationDomain;

  export class ApplicationDomain extends ASNative {
    static classInitializer: any = null;
    static initializer: any = null;
    static classSymbols: string [] = null; // [];
    static instanceSymbols: string [] = null; // [];

    private _runtimeDomain: RuntimeApplicationDomain;

    constructor (parentDomainOrRuntimeDomain: any = null) {
      false && super();
      if (parentDomainOrRuntimeDomain instanceof RuntimeApplicationDomain) {
        this._runtimeDomain = parentDomainOrRuntimeDomain;
        return;
      }
      var parentRuntimeDomain: RuntimeApplicationDomain;
      if (parentDomainOrRuntimeDomain) {
        parentRuntimeDomain = parentDomainOrRuntimeDomain._runtimeDomain;
      } else {
        parentRuntimeDomain = AVM2.currentDomain().system;
      }
      this._runtimeDomain = new RuntimeApplicationDomain(parentRuntimeDomain.vm, parentRuntimeDomain, ExecutionMode.COMPILE, false);
    }
    
    // JS -> AS Bindings

    // AS -> JS Bindings
    // static _currentDomain: flash.system.ApplicationDomain;
    // static _MIN_DOMAIN_MEMORY_LENGTH: number /*uint*/;
    static get currentDomain(): flash.system.ApplicationDomain {
      return new ApplicationDomain(AVM2.currentDomain());
    }
    static get MIN_DOMAIN_MEMORY_LENGTH(): number /*uint*/ {
      notImplemented("public flash.system.ApplicationDomain::get MIN_DOMAIN_MEMORY_LENGTH"); return;
      // return this._MIN_DOMAIN_MEMORY_LENGTH;
    }
    
    // _parentDomain: flash.system.ApplicationDomain;
    // _domainMemory: flash.utils.ByteArray;
    get parentDomain(): flash.system.ApplicationDomain {
      if (this._runtimeDomain.base) {
        return new ApplicationDomain(this._runtimeDomain.base);
      }
      return null;
    }
    get domainMemory(): flash.utils.ByteArray {
      notImplemented("public flash.system.ApplicationDomain::get domainMemory"); return;
      // return this._domainMemory;
    }
    set domainMemory(mem: flash.utils.ByteArray) {
      mem = mem;
      notImplemented("public flash.system.ApplicationDomain::set domainMemory"); return;
      // this._domainMemory = mem;
    }
    getDefinition(name: string): Object {
      name = asCoerceString(name);
      if (name) {
        var simpleName = name.replace("::", ".");
        return this._runtimeDomain.getProperty(Multiname.fromSimpleName(simpleName), true, true);
      }
      return null;
    }
    hasDefinition(name: string): boolean {
      name = asCoerceString(name);
      if (name) {
        var simpleName = name.replace("::", ".");
        return !!this._runtimeDomain.findDomainProperty(Multiname.fromSimpleName(simpleName), false, false);
      }
      return false;
    }
    getQualifiedDefinitionNames(): ASVector<any> {
      notImplemented("public flash.system.ApplicationDomain::getQualifiedDefinitionNames"); return;
    }
  }
}
