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
// Class: Configuration
module Shumway.AVM2.AS.flash.automation {
  import notImplemented = Shumway.Debug.notImplemented;
  import asCoerceString = Shumway.AVM2.Runtime.asCoerceString;
  export class Configuration extends ASNative {
    static initializer: any = null;
    constructor () {
      false && super();
      notImplemented("Dummy Constructor: public flash.automation.Configuration");
    }
    // Static   JS -> AS Bindings
    // Static   AS -> JS Bindings
    get testAutomationConfiguration(): string {
      notImplemented("public flash.automation.Configuration::get testAutomationConfiguration"); return;
    }
    set deviceConfiguration(configData: string) {
      configData = asCoerceString(configData);
      notImplemented("public flash.automation.Configuration::set deviceConfiguration"); return;
    }
    get deviceConfiguration(): string {
      notImplemented("public flash.automation.Configuration::get deviceConfiguration"); return;
    }
    // Instance JS -> AS Bindings
    // Instance AS -> JS Bindings
  }
}
