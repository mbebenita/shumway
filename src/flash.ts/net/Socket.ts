/**
 * Copyright 2014 Mozilla Foundation
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 * http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
// Class: Socket
module Shumway.AVM2.AS.flash.net {
  import notImplemented = Shumway.Debug.notImplemented;
  import asCoerceString = Shumway.AVM2.Runtime.asCoerceString;
  import somewhatImplemented = Shumway.Debug.somewhatImplemented;
  import Errors = Shumway.AVM2.Errors;
  import throwError = Shumway.AVM2.Runtime.throwError;

  export class Socket extends flash.events.EventDispatcher implements flash.utils.IDataInput, flash.utils.IDataOutput {
    
    // Called whenever the class is initialized.
    static classInitializer: any = null;
    
    // Called whenever an instance of the class is initialized.
    static initializer: any = null;
    
    // List of static symbols to link.
    static classSymbols: string [] = null; // [];
    
    // List of instance symbols to link.
    static instanceSymbols: string [] = null; // ["timeout", "timeout", "connect", "close"];
    
    constructor (host: string = null, port: number /*int*/ = 0) {
      host = asCoerceString(host); port = port | 0;
      false && super(undefined);
      notImplemented("Dummy Constructor: public flash.net.Socket");
    }
    
    // JS -> AS Bindings
    
    timeout: number /*uint*/;
    connect: (host: string, port: number /*int*/) => void;
    close: () => void;
    
    // AS -> JS Bindings
    
    // _timeout: number /*uint*/;
    // _bytesAvailable: number /*uint*/;
    // _connected: boolean;
    // _objectEncoding: number /*uint*/;
    // _endian: string;
    // _bytesPending: number /*uint*/;
    get bytesAvailable(): number /*uint*/ {
      notImplemented("public flash.net.Socket::get bytesAvailable"); return;
      // return this._bytesAvailable;
    }
    get connected(): boolean {
      notImplemented("public flash.net.Socket::get connected"); return;
      // return this._connected;
    }
    get objectEncoding(): number /*uint*/ {
      notImplemented("public flash.net.Socket::get objectEncoding"); return;
      // return this._objectEncoding;
    }
    set objectEncoding(version: number /*uint*/) {
      version = version >>> 0;
      notImplemented("public flash.net.Socket::set objectEncoding"); return;
      // this._objectEncoding = version;
    }
    get endian(): string {
      notImplemented("public flash.net.Socket::get endian"); return;
      // return this._endian;
    }
    set endian(type: string) {
      type = asCoerceString(type);
      notImplemented("public flash.net.Socket::set endian"); return;
      // this._endian = type;
    }
    get bytesPending(): number /*uint*/ {
      notImplemented("public flash.net.Socket::get bytesPending"); return;
      // return this._bytesPending;
    }
    readBytes(bytes: flash.utils.ByteArray, offset: number /*uint*/ = 0, length: number /*uint*/ = 0): void {
      bytes = bytes; offset = offset >>> 0; length = length >>> 0;
      notImplemented("public flash.net.Socket::readBytes"); return;
    }
    writeBytes(bytes: flash.utils.ByteArray, offset: number /*uint*/ = 0, length: number /*uint*/ = 0): void {
      bytes = bytes; offset = offset >>> 0; length = length >>> 0;
      notImplemented("public flash.net.Socket::writeBytes"); return;
    }
    writeBoolean(value: boolean): void {
      value = !!value;
      notImplemented("public flash.net.Socket::writeBoolean"); return;
    }
    writeByte(value: number /*int*/): void {
      value = value | 0;
      notImplemented("public flash.net.Socket::writeByte"); return;
    }
    writeShort(value: number /*int*/): void {
      value = value | 0;
      notImplemented("public flash.net.Socket::writeShort"); return;
    }
    writeInt(value: number /*int*/): void {
      value = value | 0;
      notImplemented("public flash.net.Socket::writeInt"); return;
    }
    writeUnsignedInt(value: number /*uint*/): void {
      value = value >>> 0;
      notImplemented("public flash.net.Socket::writeUnsignedInt"); return;
    }
    writeFloat(value: number): void {
      value = +value;
      notImplemented("public flash.net.Socket::writeFloat"); return;
    }
    writeDouble(value: number): void {
      value = +value;
      notImplemented("public flash.net.Socket::writeDouble"); return;
    }
    writeMultiByte(value: string, charSet: string): void {
      value = asCoerceString(value); charSet = asCoerceString(charSet);
      notImplemented("public flash.net.Socket::writeMultiByte"); return;
    }
    writeUTF(value: string): void {
      value = asCoerceString(value);
      notImplemented("public flash.net.Socket::writeUTF"); return;
    }
    writeUTFBytes(value: string): void {
      value = asCoerceString(value);
      notImplemented("public flash.net.Socket::writeUTFBytes"); return;
    }
    readBoolean(): boolean {
      notImplemented("public flash.net.Socket::readBoolean"); return;
    }
    readByte(): number /*int*/ {
      notImplemented("public flash.net.Socket::readByte"); return;
    }
    readUnsignedByte(): number /*uint*/ {
      notImplemented("public flash.net.Socket::readUnsignedByte"); return;
    }
    readShort(): number /*int*/ {
      notImplemented("public flash.net.Socket::readShort"); return;
    }
    readUnsignedShort(): number /*uint*/ {
      notImplemented("public flash.net.Socket::readUnsignedShort"); return;
    }
    readInt(): number /*int*/ {
      notImplemented("public flash.net.Socket::readInt"); return;
    }
    readUnsignedInt(): number /*uint*/ {
      notImplemented("public flash.net.Socket::readUnsignedInt"); return;
    }
    readFloat(): number {
      notImplemented("public flash.net.Socket::readFloat"); return;
    }
    readDouble(): number {
      notImplemented("public flash.net.Socket::readDouble"); return;
    }
    readMultiByte(length: number /*uint*/, charSet: string): string {
      length = length >>> 0; charSet = asCoerceString(charSet);
      notImplemented("public flash.net.Socket::readMultiByte"); return;
    }
    readUTF(): string {
      notImplemented("public flash.net.Socket::readUTF"); return;
    }
    readUTFBytes(length: number /*uint*/): string {
      length = length >>> 0;
      notImplemented("public flash.net.Socket::readUTFBytes"); return;
    }
    flush(): void {
      notImplemented("public flash.net.Socket::flush"); return;
    }
    writeObject(object: any): void {
      
      notImplemented("public flash.net.Socket::writeObject"); return;
    }
    readObject(): any {
      notImplemented("public flash.net.Socket::readObject"); return;
    }
    internalGetSecurityErrorMessage(host, port): string {
      host = asCoerceString(host); port |= 0;
      somewhatImplemented("flash.net.Socket::internalGetSecurityErrorMessage");
      return 'SecurityErrorEvent';
    }
    internalConnect(host, port) {
      host = asCoerceString(host); port |= 0;
      somewhatImplemented("flash.net.Socket::internalConnect");
      throwError('SecurityError', Errors.SocketConnectError, host, port);
    }
    didFailureOccur(): boolean {
      somewhatImplemented("flash.net.Socket::didFailureOccur");
      return true;
    }
  }
}
