package flash.text.engine {
  public final class GroupElement extends ContentElement {
    public function GroupElement(elements:Vector = null, elementFormat:ElementFormat = null, eventMirror:EventDispatcher = null, textRotation:String = "rotate0") {}
    public native function get elementCount():int;
    public native function getElementAt(index:int):ContentElement;
    public native function setElements(value:Vector):void;
    public native function groupElements(beginIndex:int, endIndex:int):GroupElement;
    public native function ungroupElements(groupIndex:int):void;
    public native function mergeTextElements(beginIndex:int, endIndex:int):TextElement;
    public native function splitTextElement(elementIndex:int, splitIndex:int):TextElement;
    public native function replaceElements(beginIndex:int, endIndex:int, newElements:Vector):Vector;
    public native function getElementAtCharIndex(charIndex:int):ContentElement;
    public function getElementIndex(element:ContentElement):int { notImplemented("getElementIndex"); }
  }
}
