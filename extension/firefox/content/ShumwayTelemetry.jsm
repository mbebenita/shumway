/* -*- Mode: Java; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*- */
/* vim: set shiftwidth=2 tabstop=2 autoindent cindent expandtab: */
/* Copyright 2013 Mozilla Foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/* jshint esnext:true */

'use strict';

this.EXPORTED_SYMBOLS = ['ShumwayTelemetry'];

const Cu = Components.utils;
Cu.import('resource://gre/modules/Services.jsm');

const ADDON_ID = "shumway@research.mozilla.org";

var Telemetry = Services.telemetry;
Telemetry.registerAddonHistogram(ADDON_ID, "SHUMWAY_TIME_TO_VIEW_MS", 1, 2 * 60 * 1000, 50, Telemetry.HISTOGRAM_EXPONENTIAL);
Telemetry.registerAddonHistogram(ADDON_ID, "SHUMWAY_PARSING_MS", 1, 2 * 60 * 1000, 50, Telemetry.HISTOGRAM_EXPONENTIAL);
Telemetry.registerAddonHistogram(ADDON_ID, "SHUMWAY_SWF_INDEX_ON_PAGE", 1, 30, 31, Telemetry.HISTOGRAM_LINEAR);
Telemetry.registerAddonHistogram(ADDON_ID, "SHUMWAY_SWF_SIZE_KB", 1, 256 * 1024, 50, Telemetry.HISTOGRAM_EXPONENTIAL);
Telemetry.registerAddonHistogram(ADDON_ID, "SHUMWAY_SWF_VERSION", 1, 30, 31, Telemetry.HISTOGRAM_LINEAR);
Telemetry.registerAddonHistogram(ADDON_ID, "SHUMWAY_SWF_FRAME_RATE", 1, 256, 50, Telemetry.HISTOGRAM_LINEAR);
Telemetry.registerAddonHistogram(ADDON_ID, "SHUMWAY_SWF_AREA", 256, 16777216, 50, Telemetry.HISTOGRAM_EXPONENTIAL);
Telemetry.registerAddonHistogram(ADDON_ID, "SHUMWAY_SWF_AVM2", 1, 2, 3, Telemetry.HISTOGRAM_BOOLEAN);
Telemetry.registerAddonHistogram(ADDON_ID, "SHUMWAY_SWF_BANNER", 1, 30, 31, Telemetry.HISTOGRAM_LINEAR);
Telemetry.registerAddonHistogram(ADDON_ID, "SHUMWAY_ERROR", 1, 2, 3, Telemetry.HISTOGRAM_LINEAR);
Telemetry.registerAddonHistogram(ADDON_ID, "SHUMWAY_FEATURE_USED", 1, 700, 701, Telemetry.HISTOGRAM_LINEAR);
Telemetry.registerAddonHistogram(ADDON_ID, "SHUMWAY_FALLBACK", 1, 2, 3, Telemetry.HISTOGRAM_BOOLEAN);

const BANNER_SIZES = [
  "88x31", "120x60", "120x90", "120x240", "120x600", "125x125", "160x600",
  "180x150", "234x60", "240x400", "250x250", "300x100", "300x250", "300x600",
  "300x1050", "336x280", "468x60", "550x480", "720x100", "728x90", "970x90",
  "970x250"];

function getBannerType(width, height) {
  return BANNER_SIZES.indexOf(width + 'x' + height) + 1;
}

this.ShumwayTelemetry = {
  onFirstFrame: function (timeToDisplay) {
    var histogram = Telemetry.getAddonHistogram(ADDON_ID, "SHUMWAY_TIME_TO_VIEW_MS");
    histogram.add(timeToDisplay);
  },
  onParseInfo: function (parseInfo) {
    var histogram = Telemetry.getAddonHistogram(ADDON_ID, "SHUMWAY_PARSING_MS");
    histogram.add(parseInfo.parseTime);
    var histogram = Telemetry.getAddonHistogram(ADDON_ID, "SHUMWAY_SWF_SIZE_KB");
    histogram.add(parseInfo.size / 1024);
    var histogram = Telemetry.getAddonHistogram(ADDON_ID, "SHUMWAY_SWF_VERSION");
    histogram.add(parseInfo.swfVersion);
    var histogram = Telemetry.getAddonHistogram(ADDON_ID, "SHUMWAY_SWF_FRAME_RATE");
    histogram.add(parseInfo.frameRate);
    var histogram = Telemetry.getAddonHistogram(ADDON_ID, "SHUMWAY_SWF_AREA");
    histogram.add(parseInfo.width * parseInfo.height);
    var histogram = Telemetry.getAddonHistogram(ADDON_ID, "SHUMWAY_SWF_BANNER");
    histogram.add(getBannerType(parseInfo.width, parseInfo.height));
    var histogram = Telemetry.getAddonHistogram(ADDON_ID, "SHUMWAY_SWF_AVM2");
    histogram.add(parseInfo.isAvm2);
  },
  onError: function (errorType) {
    var histogram = Telemetry.getAddonHistogram(ADDON_ID, "SHUMWAY_ERROR");
    histogram.add(errorType);
  },
  onPageIndex: function (pageIndex) {
    var histogram = Telemetry.getAddonHistogram(ADDON_ID, "SHUMWAY_SWF_INDEX_ON_PAGE");
    histogram.add(pageIndex);
  },
  onFeature: function (featureType) {
    var histogram = Telemetry.getAddonHistogram(ADDON_ID, "SHUMWAY_FEATURE_USED");
    histogram.add(featureType);
  },
  onFallback: function (userAction) {
    var histogram = Telemetry.getAddonHistogram(ADDON_ID, "SHUMWAY_FALLBACK");
    histogram.add(userAction);
  }
};
