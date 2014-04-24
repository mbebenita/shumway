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
// Class: JPEGLoaderContext
module Shumway.AVM2.AS.flash.system {
  import notImplemented = Shumway.Debug.notImplemented;
  import asCoerceString = Shumway.AVM2.Runtime.asCoerceString;
  export class JPEGLoaderContext extends flash.system.LoaderContext {
    
    // Called whenever the class is initialized.
    static classInitializer: any = null;
    
    // Called whenever an instance of the class is initialized.
    static initializer: any = null;
    
    // List of static symbols to link.
    static classSymbols: string [] = null; // [];
    
    // List of instance symbols to link.
    static instanceSymbols: string [] = null; // ["deblockingFilter"];
    
    constructor (deblockingFilter: number = 0, checkPolicyFile: boolean = false, applicationDomain: flash.system.ApplicationDomain = null, securityDomain: flash.system.SecurityDomain = null) {
      deblockingFilter = +deblockingFilter; checkPolicyFile = !!checkPolicyFile; applicationDomain = applicationDomain; securityDomain = securityDomain;
      false && super(undefined, undefined, undefined);
      notImplemented("Dummy Constructor: public flash.system.JPEGLoaderContext");
    }
    
    // JS -> AS Bindings
    
    deblockingFilter: number;
    
    // AS -> JS Bindings
    
  }
}
