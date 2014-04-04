/**
 * Copyright 2013 Mozilla Foundation
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
 * limitations undxr the License.
 */
// Class: GlowFilter
module Shumway.AVM2.AS.flash.filters {

  export class GlowFilter extends flash.filters.BitmapFilter {

    // Called whenever the class is initialized.
    static classInitializer: any = null;

    // Called whenever an instance of the class is initialized.
    static initializer: any = null;

    // List of static symbols to link.
    static staticBindings: string [] = null; // [];

    // List of instance symbols to link.
    static bindings: string [] = null; // ["clone"];

    constructor (color: number /*uint*/ = 16711680, alpha: number = 1, blurX: number = 6, blurY: number = 6, strength: number = 2, quality: number /*int*/ = 1, inner: boolean = false, knockout: boolean = false) {
      this.color = color >>> 0;
      this.alpha = +alpha;
      this.blurX = +blurX;
      this.blurY = +blurY;
      this.strength = +strength;
      this.quality = quality | 0;
      this.inner = !!inner;
      this.knockout = !!knockout;
      false && super();
    }

    _generateFilterBounds(): any {
      var bounds: any = { xMin: 0, yMin: 0, xMax: 0, yMax: 0 };
      this._updateBlurBounds(bounds, this.blurX, this.blurY, this.quality);
      return bounds;
    }

    _serialize(message) {
      message.ensureAdditionalCapacity(36);
      message.writeIntUnsafe(2);
      message.writeFloatUnsafe(this._alpha);
      message.writeFloatUnsafe(this._blurX);
      message.writeFloatUnsafe(this._blurY);
      message.writeIntUnsafe(this._color);
      message.writeIntUnsafe(this._inner);
      message.writeIntUnsafe(this._knockout);
      message.writeIntUnsafe(this._quality);
      message.writeFloatUnsafe(this._strength);
    }

    // JS -> AS Bindings

    clone: () => flash.filters.BitmapFilter;

    // AS -> JS Bindings

    private _color: number /*uint*/;
    private _alpha: number;
    private _blurX: number;
    private _blurY: number;
    private _inner: boolean;
    private _knockout: boolean;
    private _quality: number /*int*/;
    private _strength: number;

    get color(): number /*uint*/ {
      return this._color;
    }
    set color(value: number /*uint*/) {
      this._color = value >>> 0;
    }

    get alpha(): number {
      return this._alpha;
    }
    set alpha(value: number) {
      this._alpha = NumberUtilities.clamp(+value, 0, 1);
    }

    get blurX(): number {
      return this._blurX;
    }
    set blurX(value: number) {
      this._blurX = NumberUtilities.clamp(+value, 0, 255);
    }

    get blurY(): number {
      return this._blurY;
    }
    set blurY(value: number) {
      this._blurY = NumberUtilities.clamp(+value, 0, 255);
    }

    get inner(): boolean {
      return this._inner;
    }
    set inner(value: boolean) {
      this._inner = !!value;
    }

    get knockout(): boolean {
      return this._knockout;
    }
    set knockout(value: boolean) {
      this._knockout = !!value;
    }

    get quality(): number /*int*/ {
      return this._quality;
    }
    set quality(value: number /*int*/) {
      this._quality = NumberUtilities.clamp(value | 0, 0, 255);;
    }

    get strength(): number {
      return this._strength;
    }
    set strength(value: number) {
      this._strength = NumberUtilities.clamp(+value, 0, 255);
    }
  }
}
