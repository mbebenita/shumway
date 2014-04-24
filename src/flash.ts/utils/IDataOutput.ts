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
// Class: IDataOutput
module Shumway.AVM2.AS.flash.utils {
  import notImplemented = Shumway.Debug.notImplemented;
  import asCoerceString = Shumway.AVM2.Runtime.asCoerceString;
  export interface IDataOutput {
    
    // JS -> AS Bindings
    
    writeBytes: (bytes: flash.utils.ByteArray, offset: number /*uint*/ = 0, length: number /*uint*/ = 0) => void;
    writeBoolean: (value: boolean) => void;
    writeByte: (value: number /*int*/) => void;
    writeShort: (value: number /*int*/) => void;
    writeInt: (value: number /*int*/) => void;
    writeUnsignedInt: (value: number /*uint*/) => void;
    writeFloat: (value: number) => void;
    writeDouble: (value: number) => void;
    writeMultiByte: (value: string, charSet: string) => void;
    writeUTF: (value: string) => void;
    writeUTFBytes: (value: string) => void;
    writeObject: (object: any) => void;
    objectEncoding: number /*uint*/;
    endian: string;
    
    // AS -> JS Bindings
    
    // _objectEncoding: number /*uint*/;
    // _endian: string;
  }
}
