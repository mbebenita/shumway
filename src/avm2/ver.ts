/*
 * Copyright 2013 Mozilla Foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

module Shumway.AVMX {
  import assert = Shumway.Debug.assert;
  //import AbcFile = Shumway.AVM2.ABC.AbcFile;
  //import Multiname = Shumway.AVM2.ABC.Multiname;
  //import ClassInfo = Shumway.AVM2.ABC.ClassInfo;
  //import ScriptInfo = Shumway.AVM2.ABC.ScriptInfo;
  //import InstanceInfo = Shumway.AVM2.ABC.InstanceInfo;
  //import Trait = Shumway.AVM2.ABC.Trait;
  //import Info = Shumway.AVM2.ABC.Info;
  //import MethodInfo = Shumway.AVM2.ABC.MethodInfo;
  //import assert = Shumway.Debug.assert;
  //import notImplemented = Shumway.Debug.notImplemented;
  //import popManyIntoVoid = Shumway.ArrayUtilities.popManyIntoVoid;
  //
  //import Scope = Shumway.AVM2.Runtime.Scope;

  var writer = 1 > 0 ? new IndentingWriter() : null;

  export class VerifierError {
    name: string;
    constructor(public message: string = "") {
      this.name = "VerifierError";
    }
  }

  export class TypeInformation {
    type: Type = null;
    baseClass: any = null;
    object: any = null;
    scopeDepth: number = -1;
    trait: TraitInfo = null;
    noCoercionNeeded: boolean = false;
    noCallSuperNeeded: boolean = false;
  }

  export class Type {
    static Any: AtomType;
    static Null: AtomType;
    static Void: AtomType;
    static Undefined: AtomType;

    static Int: TraitsType;
    static Uint: TraitsType;
    static Class: TraitsType;
    static Array: TraitsType;
    static Object: TraitsType;
    static String: TraitsType;
    static Number: TraitsType;
    static Boolean: TraitsType;
    static Function: TraitsType;
    static XML: TraitsType;
    static XMLList: TraitsType;
    static QName: TraitsType;
    static Namespace: TraitsType;
    static Dictionary: TraitsType;

    static _cache = {
      byQN: <Shumway.MapObject<Type>>Object.create(null),
    };

    static from(info: Info, domain: AXApplicationDomain): Type {
      // REDUX
      //release || assert (info.hash);
      //var type = Type._cache[info.hash];
      //if (!type) {
      //  type = Type._cache[info.hash] = new TraitsType(info, domain);
      //}
      //return type;
      return null;
    }

    static fromSimpleName(name: string, domain: AXApplicationDomain): TraitsType {
      // REDUX
      return null;
      // return <TraitsType>Type.fromName(Multiname.fromSimpleName(name), domain);
    }

    static fromName(mn: Multiname, domain: AXApplicationDomain): Type {
      // REDUX
      return null;
      //if (mn === undefined) {
      //  return Type.Undefined;
      //} else {
      //  var qn = Multiname.isQName(mn) ? Multiname.getFullQualifiedName(mn) : undefined;
      //  if (qn) {
      //    var type = Type._cache.byQN[qn];
      //    if (type) {
      //      return type;
      //    }
      //  }
      //  if (qn === Multiname.getPublicQualifiedName("void")) {
      //    return Type.Void;
      //  }
      //  release || assert(domain, "An AXApplicationDomain is needed.");
      //  var info = domain.findClassInfo(mn);
      //  var type = info ? Type.from(info, domain) : Type.Any;
      //  if (mn.hasTypeParameter()) {
      //    type = new ParameterizedType(<TraitsType>type, Type.fromName(mn.typeParameter, domain));
      //  }
      //  return Type._cache.byQN[qn] = type;
      //}
      //return null;
    }

    private static _typesInitialized = false;
    public static initializeTypes(domain: AXApplicationDomain) {
      if (Type._typesInitialized) {
        return;
      }
      Type.Any          = new AtomType("any", "?");
      Type.Null         = new AtomType("Null", "X");
      Type.Void         = new AtomType("Void", "V");
      Type.Undefined    = new AtomType("Undefined", "_");

      Type.Int          = Type.fromSimpleName("int", domain).instanceType();
      Type.Uint         = Type.fromSimpleName("uint", domain).instanceType();
      Type.Class        = Type.fromSimpleName("Class", domain).instanceType();
      Type.Array        = Type.fromSimpleName("Array", domain).instanceType();
      Type.Object       = Type.fromSimpleName("Object", domain).instanceType();
      Type.String       = Type.fromSimpleName("String", domain).instanceType();
      Type.Number       = Type.fromSimpleName("Number", domain).instanceType();
      Type.Boolean      = Type.fromSimpleName("Boolean", domain).instanceType();
      Type.Function     = Type.fromSimpleName("Function", domain).instanceType();
      Type.XML          = Type.fromSimpleName("XML", domain).instanceType();
      Type.XMLList      = Type.fromSimpleName("XMLList", domain).instanceType();
      Type.QName        = Type.fromSimpleName("QName", domain).instanceType();
      Type.Namespace    = Type.fromSimpleName("Namespace", domain).instanceType();
      Type.Dictionary   = Type.fromSimpleName("flash.utils.Dictionary", domain).instanceType();
      Type._typesInitialized = true;
    }

    equals(other: Type): boolean {
      return this === other;
    }

    canBeXML() {
      return this === Type.Any || this === Type.Object ||
        this === Type.XML || this === Type.XMLList ||
        this === Type.QName || this === Type.QName;
    }

    isStrictComparableWith(other: Type) {
      return this === other && !this.canBeXML();
    }

    merge(other: Type): Type {
      return Type.Any;
    }

    instanceType(): Type {
      return Type.Any;
    }

    classType(): Type {
      return Type.Any;
    }

    super(): Type {
      release || Shumway.Debug.abstractMethod("super");
      return null;
    }

    applyType(parameter: Type) {
      return null;
    }

    getTrait(mn: Type, isSetter: boolean, followSuperType: boolean): TraitInfo {
      return null;
    }

    isNumeric(): boolean {
      return this === Type.Int || this === Type.Uint || this === Type.Number;
    }

    isString(): boolean {
      return this === Type.String;
    }

    isScriptInfo(): boolean {
      return false;
    }

    isClassInfo(): boolean {
      return false;
    }

    isInstanceInfo(): boolean {
      return false;
    }

    isMethodInfo(): boolean {
      return false;
    }

    isTraitsType(): boolean {
      return this instanceof TraitsType;
    }

    isParameterizedType(): boolean {
      return this instanceof ParameterizedType;
    }

    isMethodType(): boolean {
      return this instanceof MethodType;
    }

    isMultinameType(): boolean {
      return this instanceof MultinameType;
    }

    isConstantType(): boolean {
      return this instanceof ConstantType;
    }

    isSubtypeOf(other: Type) {
      if (this === other || this.equals(other)) {
        return true;
      }
      return this.merge(other) === this;
    }

    asTraitsType(): TraitsType {
      release || assert (this.isTraitsType());
      return <TraitsType>this;
    }

    asMethodType(): MethodType {
      release || assert (this.isMethodType());
      return <MethodType>this;
    }

    asMultinameType(): MultinameType {
      release || assert (this.isMultinameType());
      return <MultinameType>this;
    }

    asConstantType(): ConstantType {
      release || assert (this.isConstantType());
      return <ConstantType>this;
    }

    getConstantValue(): any {
      release || assert (this.isConstantType());
      return (<ConstantType>this).value;
    }

    asParameterizedType(): ParameterizedType {
      release || assert (this.isParameterizedType());
      return <ParameterizedType>this;
    }
  }

  export class AtomType extends Type {
    constructor(public name: string, public symbol: string) {
      super();
    }
    toString() {
      return this.symbol;
    }
    instanceType(): Type {
      return Type.Any;
    }
  }

  export class TraitsType extends Type {
    _cachedType: Type;
    constructor(public info: Info, public domain: AXApplicationDomain) {
      super();
    }

    instanceType(): TraitsType {
      release || assert(this.info instanceof ClassInfo);
      var classInfo = <ClassInfo>this.info;
      return <TraitsType>(this._cachedType || (this._cachedType = <TraitsType>Type.from(classInfo.instanceInfo, this.domain)));
    }

    classType(): TraitsType {
      release || assert(this.info instanceof InstanceInfo);
      var instanceInfo = <InstanceInfo>this.info;
      return <TraitsType>(this._cachedType || (this._cachedType = <TraitsType>Type.from(instanceInfo.classInfo, this.domain)));
    }

    super(): TraitsType {
      // REDUX
      return;

      //if (this.info instanceof ClassInfo) {
      //  return Type.Class;
      //}
      //release || assert(this.info instanceof InstanceInfo);
      //var instanceInfo = <InstanceInfo>this.info;
      //if (instanceInfo.superName) {
      //  var result = <TraitsType>Type.fromName(instanceInfo.superName, this.domain).instanceType();
      //  release || assert(result instanceof TraitsType && result.info instanceof InstanceInfo);
      //  return result;
      //}
      //return null;
    }

    findTraitByName(traits: TraitInfo [], mn: any, isSetter: boolean) {
      // REDUX
      return;

      //var isGetter = !isSetter;
      //var trait;
      //if (!Multiname.isQName(mn)) {
      //  release || assert(mn instanceof Multiname);
      //  var multiname = <Multiname>mn;
      //  var dy;
      //  for (var i = 0; i < multiname.namespaces.length; i++) {
      //    var qname = multiname.getQName(i);
      //    if (mn.namespaces[i].isDynamic()) {
      //      dy = qname;
      //    } else {
      //      if ((trait = this.findTraitByName(traits, qname, isSetter))) {
      //        return trait;
      //      }
      //    }
      //  }
      //  if (dy) {
      //    return this.findTraitByName(traits, dy, isSetter);
      //  }
      //} else {
      //  var qn = Multiname.getQualifiedName(mn);
      //  for (var i = 0; i < traits.length; i++) {
      //    trait = traits[i];
      //    if (Multiname.getQualifiedName(trait.name) === qn) {
      //      if (isSetter && trait.isGetter() || isGetter && trait.isSetter()) {
      //        continue;
      //      }
      //      return trait;
      //    }
      //  }
      //}
    }

    getTrait(mn: Type, isSetter: boolean, followSuperType: boolean): TraitInfo {
      // REDUX
      return null;
      //if (mn.isMultinameType()) {
      //  return null;
      //}
      //var mnValue = mn.getConstantValue();
      //if (mnValue.isAttribute()) {
      //  return null;
      //}
      //if (followSuperType && (this.isInstanceInfo() || this.isClassInfo())) {
      //  var node = this;
      //  do {
      //    var trait = node.getTrait(mn, isSetter, false);
      //    if (!trait) {
      //      node = node.super();
      //    }
      //  } while (!trait && node);
      //  return trait;
      //} else {
      //  return this.findTraitByName(this.info.traits, mnValue, isSetter);
      //}
    }

    getTraitAt(slotId: number) {
      // REDUX;
      return null;
      //var traits = this.info.traits;
      //for (var i = traits.length - 1; i >= 0; i--) {
      //  if (traits[i].slotId === slotId) {
      //    return traits[i];
      //  }
      //}
      //Shumway.Debug.unexpected("Cannot find trait with slotId: " + slotId + " in " + traits);
    }

    equals(other: Type): boolean {
      // REDUX
      return false; // return other.isTraitsType() && this.info.traits === (<TraitsType>other).info.traits;
    }

    merge(other: Type): Type {
      if (other.isTraitsType()) {
        if (this.equals(<TraitsType>other)) {
          return this;
        }
        if (this.isNumeric() && other.isNumeric()) {
          return Type.Number;
        }
        if (this.isInstanceInfo() && other.isInstanceInfo()) {
          var path = [];
          for (var curr = this; curr; curr = curr.super()) {
            path.push(curr);
          }
          for (var curr = <TraitsType>other; curr; curr = curr.super()) {
            for (var i = 0; i < path.length; i++) {
              if (path[i].equals(curr)) {
                return curr;
              }
            }
          }
          return Type.Object;
        }
      }
      return Type.Any;
    }

    isScriptInfo(): boolean {
      return this.info instanceof ScriptInfo;
    }

    isClassInfo(): boolean {
      return this.info instanceof ClassInfo;
    }

    isMethodInfo(): boolean {
      return this.info instanceof MethodInfo;
    }

    isInstanceInfo(): boolean {
      return this.info instanceof InstanceInfo;
    }

    isInstanceOrClassInfo(): boolean {
      return this.isInstanceInfo() || this.isClassInfo();
    }

    applyType(parameter: Type) {
      return new ParameterizedType(this, parameter);
    }

    private _getInfoName(): string {
      // REDUX
      return "REDUX";
      //if (this.info instanceof ScriptInfo) {
      //  return "SI";
      //} else if (this.info instanceof ClassInfo) {
      //  var classInfo = <ClassInfo>this.info;
      //  return "CI:" + classInfo.instanceInfo.name.name;
      //} else if (this.info instanceof InstanceInfo) {
      //  var instanceInfo = <InstanceInfo>this.info;
      //  return "II:" + instanceInfo.name.name;
      //} else if (this.info instanceof MethodInfo) {
      //  return "MI";
      //}
//      else if (this.info instanceof ActivationInfo) {
//        return "AC";
//      }

      release || assert(false);
    }

    toString (): string {
      switch (this) {
        case Type.Int: return "I";
        case Type.Uint: return "U";
        case Type.Array: return "A";
        case Type.Object: return "O";
        case Type.String: return "S";
        case Type.Number: return "N";
        case Type.Boolean: return "B";
        case Type.Function: return "F";
      }
      return this._getInfoName();
    }
  }

  export class MethodType extends TraitsType {
    constructor(public methodInfo: MethodInfo, domain: AXApplicationDomain) {
      super(Type.Function.info, domain);
    }
    toString(): string {
      return "MT " + this.methodInfo;
    }
    returnType(): Type {
      // REDUX
      return null;
      // return this._cachedType || (this._cachedType = Type.fromName(this.methodInfo.returnType, this.domain));
    }
  }

  export class MultinameType extends Type {
    constructor(public namespaces: Type [], public name: Type, public flags: number) {
      super();
    }
    toString(): string {
      return "MN";
    }
  }

  export class ParameterizedType extends TraitsType {
    constructor(public type: TraitsType, public parameter: Type) {
      super(type.info, type.domain);
    }
  }

  export class ConstantType extends Type {
    constructor(public value: any) {
      super();
    }
    toString(): string {
      return String(this.value);
    }
    static from(value: any): ConstantType {
      return new ConstantType(value);
    }
    static fromArray(array: any []): ConstantType [] {
      return array.map(value => new ConstantType(value));
    }
  }

  /**
   * Abstract Program State
   */
  export class State {
    static id = 0;
    id: number;
    originalId: number;
    stack: Type [];
    scope: Type [];
    local: Type [];
    constructor() {
      this.id = State.id += 1;
      this.originalId = this.id;
      this.stack = [];
      this.scope = [];
      this.local = [];
    }
    clone(): State {
      var s = new State();
      s.originalId = this.id;
      s.stack = this.stack.slice(0);
      s.scope = this.scope.slice(0);
      s.local = this.local.slice(0);
      return s;
    }
    trace(writer: IndentingWriter) {
      writer.writeLn(this.toString());
    }
    toString(): string {
      return "<" + this.id + (this.originalId ? ":" + this.originalId : "") +
        ", L[" + this.local.join(", ") + "]" +
        ", S[" + this.stack.join(", ") + "]" +
        ", $[" + this.scope.join(", ") + "]>";
    }
    equals(other: State): boolean {
      return State._arrayEquals(this.stack, other.stack) &&
        State._arrayEquals(this.scope, other.scope) &&
        State._arrayEquals(this.local, other.local);
    }
    private static _arrayEquals(a, b) {
      if(a.length != b.length) {
        return false;
      }
      for (var i = a.length - 1; i >= 0; i--) {
        if (!a[i].equals(b[i])) {
          return false;
        }
      }
      return true;
    }
    isSubset(other: State) {
      return State._arraySubset(this.stack, other.stack) &&
        State._arraySubset(this.scope, other.scope) &&
        State._arraySubset(this.local, other.local);
    }
    private static _arraySubset(a: Type [], b: Type []) {
      if(a.length != b.length) {
        return false;
      }
      for (var i = a.length - 1; i >= 0; i--) {
        if (a[i] === b[i] || a[i].equals(b[i])) {
          continue;
        }
        if (a[i].merge(b[i]) !== a[i]) {
          return false;
        }
      }
      return true;
    }
    merge(other: State) {
      State._mergeArrays(this.local, other.local);
      State._mergeArrays(this.stack, other.stack);
      State._mergeArrays(this.scope, other.scope);
    }
    private static _mergeArrays(a: Type [], b: Type []) {
      release || assert(a.length === b.length, "a: " + a + " b: " + b);
      for (var i = a.length - 1; i >= 0; i--) {
        release || assert((a[i] !== undefined) && (b[i] !== undefined));
        if (a[i] === b[i]) {
          continue;
        }
        a[i] = a[i].merge(b[i]);
      }
    }
  }

  export class Verifier {
    stateMap: { [s: number]: State; } = [];
    constructor(private method: MethodInfo) {

    }

    verify() {
      var blockMap = new BlockMap(this.method.getBody());
      blockMap.build();
      blockMap.trace(writer, false);

      /**
       * Keep the blocks sorted in dominator order. The SortedList structure is based on a linked
       * list and uses a linear search to find the right insertion position and keep the list
       * sorted. The push operation takes O(n), the pull operations takes O(1).
       */
      var worklist = new Shumway.SortedList<Block>(function compare(a: Block, b: Block) {
        return a.blockID - b.blockID;
      });

      var entry = blockMap.blocks[0];

      var stateMap = this.stateMap;

      stateMap[entry.blockID] = new State();

      worklist.push(entry);

      /**
       * Iterative, fixed point alogorithm.
       */
      while (!worklist.isEmpty()) {
        var block = worklist.pop();
        writer.writeLn("Processing: " + BlockMap.blockToString(block));
        var state = stateMap[block.blockID].clone();
        writer.writeLn(state.toString());

        for (var i = 0; i < block.successors.length; i++) {
          var successor = block.successors[i];
          if (worklist.contains(successor)) {
            // If the successor is already in the worklist then just merge the current
            // state into its entry state.
            stateMap[successor.blockID].merge(state);
            writer.writeLn("Merging: " + stateMap[successor.blockID] + " with " + state);
            continue;
          } else if (stateMap[successor.blockID]) {
            // If the successor's entry state is not a subset of the current state, then
            // reprocess the block by adding it to the worklist.
            if (!stateMap[successor.blockID].isSubset(state)) {
              stateMap[successor.blockID].merge(state);
              worklist.push(successor);
              writer.writeLn("Recalculating: " + stateMap[successor.blockID] + " with " + state);
            }
            continue;
          }
          // Propagate current state to successor blocks.
          stateMap[successor.blockID] = state.clone();
          worklist.push(successor);
        }
      }
    }
  }
}
