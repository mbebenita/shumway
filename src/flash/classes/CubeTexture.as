package flash.display3D.textures {
  public final class CubeTexture extends TextureBase {
    public function CubeTexture() {}
    public native function uploadFromBitmapData(source:BitmapData, side:uint, miplevel:uint = 0):void;
    public native function uploadFromByteArray(data:ByteArray, byteArrayOffset:uint, side:uint, miplevel:uint = 0):void;
    public native function uploadCompressedTextureFromByteArray(data:ByteArray, byteArrayOffset:uint, async:Boolean = false):void;
  }
}
