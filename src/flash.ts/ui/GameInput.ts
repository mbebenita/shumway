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
// Class: GameInput
module Shumway.AVM2.AS.flash.ui {
  import notImplemented = Shumway.Debug.notImplemented;
  import asCoerceString = Shumway.AVM2.Runtime.asCoerceString;
  export class GameInput extends flash.events.EventDispatcher {
    
    // Called whenever the class is initialized.
    static classInitializer: any = null;
    
    // Called whenever an instance of the class is initialized.
    static initializer: any = null;
    
    // List of static symbols to link.
    static classSymbols: string [] = null; // [];
    
    // List of instance symbols to link.
    static instanceSymbols: string [] = null; // [];
    
    constructor () {
      false && super(undefined);
      notImplemented("Dummy Constructor: public flash.ui.GameInput");
    }
    
    // JS -> AS Bindings
    
    
    // AS -> JS Bindings
    // static _numDevices: number /*int*/;
    // static _isSupported: boolean;
    get numDevices(): number /*int*/ {
      notImplemented("public flash.ui.GameInput::get numDevices"); return;
      // return this._numDevices;
    }
    get isSupported(): boolean {
      notImplemented("public flash.ui.GameInput::get isSupported"); return;
      // return this._isSupported;
    }
    static getDeviceAt(index: number /*int*/): flash.ui.GameInputDevice {
      index = index | 0;
      notImplemented("public flash.ui.GameInput::static getDeviceAt"); return;
    }
    
  }
}
