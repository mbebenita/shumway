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
// Class: GraphicsTrianglePath
module Shumway.AVM2.AS.flash.display {
  import notImplemented = Shumway.Debug.notImplemented;
  import asCoerceString = Shumway.AVM2.Runtime.asCoerceString;
  export class GraphicsTrianglePath extends ASNative implements IGraphicsPath, IGraphicsData {
    
    // Called whenever the class is initialized.
    static classInitializer: any = null;
    
    // Called whenever an instance of the class is initialized.
    static initializer: any = null;
    
    // List of static symbols to link.
    static classSymbols: string [] = null; // [];
    
    // List of instance symbols to link.
    static instanceSymbols: string [] = null; // ["indices", "vertices", "uvtData", "_culling", "culling", "culling"];
    
    constructor (vertices: ASVector<number> = null, indices: ASVector<number /*int*/> = null, uvtData: ASVector<number> = null, culling: string = "none") {
      vertices = vertices; indices = indices; uvtData = uvtData; culling = asCoerceString(culling);
      false && super();
      notImplemented("Dummy Constructor: public flash.display.GraphicsTrianglePath");
    }
    
    // JS -> AS Bindings
    
    indices: ASVector<number /*int*/>;
    vertices: ASVector<number>;
    uvtData: ASVector<number>;
    _culling: string;
    culling: string;
    
    // AS -> JS Bindings
    
    // _culling: string;
  }
}
