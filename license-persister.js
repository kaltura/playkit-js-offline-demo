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

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var LicensePersister = function () {
    function LicensePersister() {
        _classCallCheck(this, LicensePersister);
    }

    _createClass(LicensePersister, null, [{
        key: 'remove',
        value: function remove(videoName) {
            return idbKeyval.delete(videoName);
        }
    }, {
        key: 'restore',
        value: function restore(session, videoName) {
            var _this = this;

            var tasks = Promise.resolve();
            if (this._activeSession) {
                console.log('Closing active session.');
                tasks = tasks.then(function (_) {
                    return _this._activeSession.close();
                }).then(function (_) {
                    _this._activeSession = null;
                });
            }

            return tasks.then(function (_) {
                return idbKeyval.get(videoName).then(function (storedSession) {
                    if (!storedSession) {
                        throw new Error('Unable to restore license; please download again.');
                        return;
                    }

                    console.log('Restoring session: ', storedSession);
                    return session.load(storedSession);
                });
            });
        }
    }, {
        key: 'close',
        value: function close(session) {
            session.close();
        }
    }, {
        key: 'persist',
        value: function persist(videoName) {
            var _this2 = this;

            var _ref = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : drmInfo,
                name = _ref.name,
                url = _ref.url,
                manifest = _ref.manifest;

            return idbKeyval.get(videoName).then(function (storedSession) {
                if (storedSession) {
                    console.log('Already persisted license');
                    return true;
                }

                var config = LicensePersister.CONFIG;
                var _onMessage = function _onMessage(evt) {
                    var session = evt.target;
                    _this2._activeSession = session;

                    return utils.load({
                        url: url,
                        body: evt.message
                    }).then(function (license) {
                        session.update(license).then(function (_) {
                            console.log('4. Setting new license: ', license);
                            console.log('5. Storing license for next play: ' + session.sessionId);
                            return idbKeyval.set(videoName, session.sessionId);
                        }).catch(function (error) {
                            console.error('Failed to update the session', error);
                        });
                    });
                };

                return navigator.requestMediaKeySystemAccess(name, config).then(function (keySystemAccess) {
                    console.log('1. Creating Media Keys ' + name);
                    return keySystemAccess.createMediaKeys();
                }).then(function (createdMediaKeys) {
                    console.log('2. Setting Media Keys', createdMediaKeys);
                    return createdMediaKeys.createSession('persistent-license');
                }).then(function (session) {
                    // Get the PSSH data from the manifest.
                    return fetch(manifest).then(function (r) {
                        return r.text();
                    }).then(function (manifestText) {
                        var parser = new DOMParser();
                        return parser.parseFromString(manifestText, 'text/xml');
                    }).then(function (manifestDoc) {
                        if (!manifestDoc) {
                            console.log('Unable to read manifest');
                            return false;
                        }

                        var PSSH = Array.from(manifestDoc.querySelectorAll('*')).find(function (node) {
                            return node.nodeName === 'cenc:pssh';
                        });

                        if (!PSSH) {
                            console.log('No PSSH');
                            return false;
                        }

                        console.log('3. Using PSSH data: ' + PSSH.textContent);
                        var initData = utils.base64ToUint8Array(PSSH.textContent);
                        session.addEventListener('message', _onMessage);
                        return session.generateRequest('cenc', initData);
                    });
                }).catch(function (error) {
                    console.error('Failed to set up MediaKeys', error);
                });
            });
        }
    }, {
        key: 'CONTENT_FORMAT',
        get: function get() {
            return 'cenc';
        }
    }, {
        key: 'CONTENT_TYPE',
        get: function get() {
            return 'video/mp4; codecs="avc1.4d401f"';
        }
    }, {
        key: 'CONFIG',
        get: function get() {
            return [{
                initDataTypes: [LicensePersister.CONTENT_FORMAT],
                videoCapabilities: [{
                    contentType: LicensePersister.CONTENT_TYPE
                }],
                persistentState: 'required',
                sessionTypes: ['persistent-license']
            }];
        }
    }]);

    return LicensePersister;
}();