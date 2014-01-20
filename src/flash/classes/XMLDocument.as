package flash.xml {
  public class XMLDocument extends XMLNode {
    public function XMLDocument(source:String = null) {}
    public var xmlDecl:Object;
    public var docTypeDecl:Object;
    public var idMap:Object;
    public var ignoreWhite:Boolean;
    public function createElement(name:String):XMLNode { notImplemented("createElement"); }
    public function createTextNode(text:String):XMLNode { notImplemented("createTextNode"); }
    public override function toString():String { notImplemented("toString"); }
    public function parseXML(source:String):void { notImplemented("parseXML"); }
  }
}
