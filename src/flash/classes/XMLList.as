package  {
  public final dynamic class XMLList {
    public function XMLList(value) {}
    public static const length = 1;
    AS3 native function toString():String;
    AS3 function valueOf():XMLList { notImplemented("valueOf"); }
    AS3 override native function hasOwnProperty(P):Boolean;
    AS3 override native function propertyIsEnumerable(P):Boolean;
    AS3 native function attribute(arg):XMLList;
    AS3 native function attributes():XMLList;
    AS3 native function child(propertyName):XMLList;
    AS3 native function children():XMLList;
    AS3 native function comments():XMLList;
    AS3 native function contains(value):Boolean;
    AS3 native function copy():XMLList;
    AS3 native function descendants(name = "*"):XMLList;
    AS3 native function elements(name = "*"):XMLList;
    AS3 native function hasComplexContent():Boolean;
    AS3 native function hasSimpleContent():Boolean;
    AS3 native function length():int;
    AS3 native function name():Object;
    AS3 native function normalize():XMLList;
    AS3 native function parent();
    AS3 native function processingInstructions(name = "*"):XMLList;
    AS3 native function text():XMLList;
    AS3 native function toXMLString():String;
    AS3 native function addNamespace(ns):XML;
    AS3 native function appendChild(child):XML;
    AS3 native function childIndex():int;
    AS3 native function inScopeNamespaces():Array;
    AS3 native function insertChildAfter(child1, child2);
    AS3 native function insertChildBefore(child1, child2);
    AS3 native function nodeKind():String;
    AS3 function namespace(prefix = null) { notImplemented("namespace"); }
    AS3 native function localName():Object;
    AS3 native function namespaceDeclarations():Array;
    AS3 native function prependChild(value):XML;
    AS3 native function removeNamespace(ns):XML;
    AS3 native function replace(propertyName, value):XML;
    AS3 native function setChildren(value):XML;
    AS3 native function setLocalName(name):void;
    AS3 native function setName(name):void;
    AS3 native function setNamespace(ns):void;
    AS3 function toJSON(k:String) { notImplemented("toJSON"); }
  }
}
