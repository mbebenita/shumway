package flash.xml {
  packageInternal final class XMLParser {
    public function XMLParser() {}
    public native function startParse(source:String, ignoreWhite:Boolean):void;
    public native function getNext(tag:XMLTag):int;
  }
}
