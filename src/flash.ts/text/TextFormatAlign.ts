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
// Class: TextFormatAlign
module Shumway.AVM2.AS.flash.text {
  export class TextFormatAlign extends ASNative {

    static classInitializer: any = null;
    static initializer: any = null;
    static classSymbols: string [] = null;
    static instanceSymbols: string [] = null;

    constructor() {
      super();
    }

    static VALID_VALUES: any = {
      left: true, center: true, right: true, justify: true, start: true, end: true
    };

    // JS -> AS Bindings
    static LEFT: string = "left";
    static CENTER: string = "center";
    static RIGHT: string = "right";
    static JUSTIFY: string = "justify";
    static START: string = "start";
    static END: string = "end";
  }
}
