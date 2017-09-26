/**
 *
 * Copyright 2017 Google Inc. All rights reserved.
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

'use strict';
var utils = {
    load: function () {
        var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
            url = _ref.url,
            type = _ref.type,
            body = _ref.body,
            responseType = _ref.responseType;

        return new Promise(function (resolve, reject) {
            var xhr = new XMLHttpRequest();
            xhr.open(type || 'POST', url);
            xhr.responseType = responseType || 'arraybuffer';
            xhr.onload = function (evt) {
                resolve(evt.target.response);
            };

            xhr.onerror = function (evt) {
                reject(evt);
            };
            xhr.send(body);
        });
    },


    /**
     * From: https://github.com/google/shaka-player/blob/f9fc4adbe69c108ff752323e9983a93c86c97e36/lib/util/uint8array_utils.js#L53
     */
    base64ToUint8Array: function (str) {
        var bytes = window.atob(str.replace(/-/g, '+').replace(/_/g, '/'));
        var result = new Uint8Array(bytes.length);
        for (var i = 0; i < bytes.length; ++i) {
            result[i] = bytes.charCodeAt(i);
        }
        return result;
    }

}



