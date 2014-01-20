package flash.utils {
  public interface IExternalizable {
     function writeExternal(output:IDataOutput):void;
     function readExternal(input:IDataInput):void;
  }
}
