package flash.utils {
  packageInternal class ObjectInput implements IDataInput {
    public function ObjectInput() {}
    public native function readBytes(bytes:ByteArray, offset:uint = 0, length:uint = 0):void;
    public native function readBoolean():Boolean;
    public native function readByte():int;
    public native function readUnsignedByte():uint;
    public native function readShort():int;
    public native function readUnsignedShort():uint;
    public native function readInt():int;
    public native function readUnsignedInt():uint;
    public native function readFloat():Number;
    public native function readDouble():Number;
    public native function readMultiByte(length:uint, charSet:String):String;
    public native function readUTF():String;
    public native function readUTFBytes(length:uint):String;
    public native function get bytesAvailable():uint;
    public native function readObject();
    public native function get objectEncoding():uint;
    public native function set objectEncoding(version:uint):void;
    public native function get endian():String;
    public native function set endian(type:String):void;
  }
}
