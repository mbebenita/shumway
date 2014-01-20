package flash.display3D {
  public class VertexBuffer3D {
    public function VertexBuffer3D() {}
    public native function uploadFromVector(data:Vector, startVertex:int, numVertices:int):void;
    public native function uploadFromByteArray(data:ByteArray, byteArrayOffset:int, startVertex:int, numVertices:int):void;
    public native function dispose():void;
  }
}
