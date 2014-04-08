/**
 * Copyright 2013 Mozilla Foundation
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
 * limitations undxr the License.
 */
// Class: AS2Globals
module Shumway.AVM2.AS.avm1lib {
  import notImplemented = Shumway.Debug.notImplemented;
  import Loader = Shumway.AVM2.AS.flash.display.Loader;
  import TextFormat = Shumway.AVM2.AS.flash.text.TextFormat;
  import AS2Context = Shumway.AVM1.AS2Context;
  import Natives = Shumway.AVM2.AS.Natives;

  export class AS2Globals extends ASNative {

    // Called whenever the class is initialized.
    static classInitializer: any = null;

    // Called whenever an instance of the class is initialized.
    static initializer: any = function () {
      // The AS2 version of TextFormat has an additional method "getTextExtent".
      // We install that here so we don't need to have a full AS2 version of
      // TextFormat and take care to return that everywhere when in AS2 mode.
      TextFormat.prototype.asDefinePublicProperty('getTextExtent', {
        value: TextFormat.prototype.as2GetTextExtent,
        writable: false,
        enumerable: false,
        configurable: false
      });
    };

    // List of static symbols to link.
    static staticBindings: string [] = null;

    // List of instance symbols to link.
    static bindings: string [] = ["_global", "flash", "createFlashObject", "$asfunction", "call", "chr", "clearInterval", "clearTimeout", "duplicateMovieClip", "fscommand", "getAS2Property", "getTimer", "getURL", "getVersion", "gotoAndPlay", "gotoAndStop", "gotoLabel", "ifFrameLoaded", "int", "length", "loadMovie", "loadMovieNum", "loadVariables", "mbchr", "mblength", "mbord", "mbsubstring", "nextFrame", "nextScene", "ord", "play", "prevFrame", "prevScene", "print", "printAsBitmap", "printAsBitmapNum", "printNum", "random", "removeMovieClip", "setInterval", "setAS2Property", "setTimeout", "showRedrawRegions", "startDrag", "stop", "stopAllSounds", "stopDrag", "substring", "targetPath", "toggleHighQuality", "unloadMovie", "unloadMovieNum", "updateAfterEvent", "NaN", "Infinity", "isFinite", "isNaN", "parseFloat", "parseInt", "undefined", "MovieClip", "AsBroadcaster", "System", "Stage", "Button", "TextField", "Color", "Key", "Mouse", "MovieClipLoader", "Sound", "SharedObject", "ContextMenu", "ContextMenuItem", "ColorTransform", "Point", "Rectangle", "TextFormat"];

    constructor () {
      false && super();
      notImplemented("Dummy Constructor: public avm1lib.AS2Globals");
    }

    // JS -> AS Bindings

    _global: any;
    flash: ASObject;
    createFlashObject: () => ASObject;
    $asfunction: (link: any) => any;
    call: (frame: any) => any;
    chr: (number: any) => any;
    clearInterval: ASFunction;
    clearTimeout: ASFunction;
    duplicateMovieClip: (target: any, newname: any, depth: any) => any;
    fscommand: ASFunction;
    getAS2Property: (target: any, index: any) => any;
    getTimer: ASFunction;
    getURL: (url: any, target: any, method: any) => any;
    getVersion: () => any;
    gotoAndPlay: (scene: any, frame: any) => any;
    gotoAndStop: (scene: any, frame: any) => any;
    gotoLabel: (label: any) => any;
    ifFrameLoaded: (scene: any, frame: any) => any;
    int: (value: any) => any;
    length: (expression: ASObject) => number;
    loadMovie: (url: string, target: ASObject, method: string) => void;
    loadMovieNum: (url: any, level: any, method: any) => any;
    loadVariables: (url: string, target: ASObject, method: string = "") => void;
    mbchr: (number: any) => any;
    mblength: (expression: any) => any;
    mbord: (character: any) => any;
    mbsubstring: (value: any, index: any, count: any) => any;
    nextFrame: () => any;
    nextScene: () => any;
    ord: (character: any) => any;
    play: () => any;
    prevFrame: () => any;
    prevScene: () => any;
    print: (target: any, boundingBox: any) => any;
    printAsBitmap: (target: any, boundingBox: any) => any;
    printAsBitmapNum: (level: any, boundingBox: any) => any;
    printNum: (level: any, bondingBox: any) => any;
    random: (value: any) => any;
    removeMovieClip: (target: any) => any;
    setInterval: () => any;
    setAS2Property: (target: any, index: any, value: any) => any;
    setTimeout: () => any;
    showRedrawRegions: (enable: any, color: any) => any;
    startDrag: (target: any, lock: any, left: any, top: any, right: any, bottom: any) => any;
    stop: () => any;
    stopAllSounds: () => any;
    stopDrag: (target: any) => any;
    substring: (value: any, index: any, count: any) => any;
    targetPath: (target: any) => any;
    toggleHighQuality: () => any;
    unloadMovie: (target: any) => any;
    unloadMovieNum: (level: any) => any;
    updateAfterEvent: () => any;
    NaN: number;
    Infinity: number;
    isFinite: ASFunction;
    isNaN: ASFunction;
    parseFloat: ASFunction;
    parseInt: ASFunction;
    undefined: any;
    MovieClip: ASClass;
    AsBroadcaster: ASClass;
    System: ASClass;
    Stage: ASClass;
    Button: ASClass;
    TextField: ASClass;
    Color: ASClass;
    Key: ASClass;
    Mouse: ASClass;
    MovieClipLoader: ASClass;
    Sound: ASClass;
    SharedObject: ASClass;
    ContextMenu: ASClass;
    ContextMenuItem: ASClass;
    ColorTransform: ASClass;
    Point: ASClass;
    Rectangle: ASClass;
    TextFormat: ASClass;

    // AS -> JS Bindings
    static _addInternalClasses(proto: ASObject): void {
      var obj: Object = proto;
      obj.asSetPublicProperty('Object', ASObject);
      obj.asSetPublicProperty('Function', ASFunction);
      obj.asSetPublicProperty('Array', ASArray);
      obj.asSetPublicProperty('Number', ASNumber);
      obj.asSetPublicProperty('Math', ASMath);
      obj.asSetPublicProperty('Boolean', ASBoolean);
      obj.asSetPublicProperty('Date', ASDate);
      obj.asSetPublicProperty('RegExp', ASRegExp);
      obj.asSetPublicProperty('String', ASString);
    }

    ASSetPropFlags(obj: any, children: any, flags: any, allowFalse: any): any {
      // flags (from bit 0): dontenum, dontdelete, readonly, ....
      // TODO
    }
    _addToPendingScripts(subject: ASObject, fn: ASFunction, args: any [] = null): any {
      assert(fn, 'invalid function in _addToPendingScripts');
      AS2Context.instance.addToPendingScripts(function () {
        (<Function><any> fn).apply(subject, args);
      });
    }
    _setLevel(level: number /*uint*/, loader: Loader): any {
      level = level >>> 0;
      AS2Context.instance.stage._as2SetLevel(level, loader);
    }
    trace(expression: any): any {
      Natives.print(expression);
    }
  }
}
