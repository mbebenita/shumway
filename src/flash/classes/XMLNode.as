package flash.xml {
  public class XMLNode {
    public function XMLNode(type:uint, value:String) {}
    public var nodeType:uint;
    public var previousSibling:XMLNode;
    public var nextSibling:XMLNode;
    public var parentNode:XMLNode;
    public var firstChild:XMLNode;
    public var lastChild:XMLNode;
    public function get childNodes():Array { notImplemented("childNodes"); }
    public function get attributes():Object { notImplemented("attributes"); }
    public function set attributes(value:Object):void { notImplemented("attributes"); }
    public var nodeName:String;
    public var nodeValue:String;
    public function hasChildNodes():Boolean { notImplemented("hasChildNodes"); }
    public function cloneNode(deep:Boolean):XMLNode { notImplemented("cloneNode"); }
    public function removeNode():void { notImplemented("removeNode"); }
    public function insertBefore(node:XMLNode, before:XMLNode):void { notImplemented("insertBefore"); }
    public function appendChild(node:XMLNode):void { notImplemented("appendChild"); }
    public function toString():String { notImplemented("toString"); }
    public function getNamespaceForPrefix(prefix:String):String { notImplemented("getNamespaceForPrefix"); }
    public function getPrefixForNamespace(ns:String):String { notImplemented("getPrefixForNamespace"); }
    public function get localName():String { notImplemented("localName"); }
    public function get prefix():String { notImplemented("prefix"); }
    public function get namespaceURI():String { notImplemented("namespaceURI"); }
  }
}
