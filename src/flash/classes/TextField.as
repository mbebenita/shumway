package flash.text {
  public class TextField extends InteractiveObject {
    public function TextField() {}
    public static native function isFontCompatible(fontName:String, fontStyle:String):Boolean;
    public native function get alwaysShowSelection():Boolean;
    public native function set alwaysShowSelection(value:Boolean):void;
    public native function get antiAliasType():String;
    public native function set antiAliasType(antiAliasType:String):void;
    public native function get autoSize():String;
    public native function set autoSize(value:String):void;
    public native function get background():Boolean;
    public native function set background(value:Boolean):void;
    public native function get backgroundColor():uint;
    public native function set backgroundColor(value:uint):void;
    public native function get border():Boolean;
    public native function set border(value:Boolean):void;
    public native function get borderColor():uint;
    public native function set borderColor(value:uint):void;
    public native function get bottomScrollV():int;
    public native function get caretIndex():int;
    public native function get condenseWhite():Boolean;
    public native function set condenseWhite(value:Boolean):void;
    public native function get defaultTextFormat():TextFormat;
    public native function set defaultTextFormat(format:TextFormat):void;
    public native function get embedFonts():Boolean;
    public native function set embedFonts(value:Boolean):void;
    public native function get gridFitType():String;
    public native function set gridFitType(gridFitType:String):void;
    public native function get htmlText():String;
    public native function set htmlText(value:String):void;
    public native function get length():int;
    public native function get textInteractionMode():String;
    public native function get maxChars():int;
    public native function set maxChars(value:int):void;
    public native function get maxScrollH():int;
    public native function get maxScrollV():int;
    public native function get mouseWheelEnabled():Boolean;
    public native function set mouseWheelEnabled(value:Boolean):void;
    public native function get multiline():Boolean;
    public native function set multiline(value:Boolean):void;
    public native function get numLines():int;
    public native function get displayAsPassword():Boolean;
    public native function set displayAsPassword(value:Boolean):void;
    public native function get restrict():String;
    public native function set restrict(value:String):void;
    public native function get scrollH():int;
    public native function set scrollH(value:int):void;
    public native function get scrollV():int;
    public native function set scrollV(value:int):void;
    public native function get selectable():Boolean;
    public native function set selectable(value:Boolean):void;
    public function get selectedText():String { notImplemented("selectedText"); }
    public native function get selectionBeginIndex():int;
    public native function get selectionEndIndex():int;
    public native function get sharpness():Number;
    public native function set sharpness(value:Number):void;
    public native function get styleSheet():StyleSheet;
    public native function set styleSheet(value:StyleSheet):void;
    public native function get text():String;
    public native function set text(value:String):void;
    public native function get textColor():uint;
    public native function set textColor(value:uint):void;
    public native function get textHeight():Number;
    public native function get textWidth():Number;
    public native function get thickness():Number;
    public native function set thickness(value:Number):void;
    public native function get type():String;
    public native function set type(value:String):void;
    public native function get wordWrap():Boolean;
    public native function set wordWrap(value:Boolean):void;
    public function appendText(newText:String):void { notImplemented("appendText"); }
    packageInternal function copyRichText():String { notImplemented("copyRichText"); }
    public native function getCharBoundaries(charIndex:int):Rectangle;
    public native function getCharIndexAtPoint(x:Number, y:Number):int;
    public native function getFirstCharInParagraph(charIndex:int):int;
    public native function getLineIndexAtPoint(x:Number, y:Number):int;
    public native function getLineIndexOfChar(charIndex:int):int;
    public native function getLineLength(lineIndex:int):int;
    public native function getLineMetrics(lineIndex:int):TextLineMetrics;
    public native function getLineOffset(lineIndex:int):int;
    public native function getLineText(lineIndex:int):String;
    public native function getParagraphLength(charIndex:int):int;
    public native function getTextFormat(beginIndex:int = -1, endIndex:int = -1):TextFormat;
    public native function getTextRuns(beginIndex:int = 0, endIndex:int = 2147483647):Array;
    public native function getRawText():String;
    public function getXMLText(beginIndex:int = 0, endIndex:int = 2147483647):String { notImplemented("getXMLText"); }
    public function insertXMLText(beginIndex:int, endIndex:int, richText:String, pasting:Boolean = false):void { notImplemented("insertXMLText"); }
    packageInternal function pasteRichText(richText:String):Boolean { notImplemented("pasteRichText"); }
    public native function replaceSelectedText(value:String):void;
    public native function replaceText(beginIndex:int, endIndex:int, newText:String):void;
    public native function setSelection(beginIndex:int, endIndex:int):void;
    public native function setTextFormat(format:TextFormat, beginIndex:int = -1, endIndex:int = -1):void;
    public native function getImageReference(id:String):DisplayObject;
    public native function get useRichTextClipboard():Boolean;
    public native function set useRichTextClipboard(value:Boolean):void;
  }
}
