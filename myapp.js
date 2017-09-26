function pwa_kaltura() {
    var manifestUriClear = 'https://qa-apache-php7.dev.kaltura.com/p/1091/sp/109100/playManifest/entryId/0_wifqaipd/protocol/http/format/mpegdash/flavorIds/0_m131krws,0_kozg4x1x/a.mpd';
    var manifestUriDRM = 'https://qa-nginx-vod.dev.kaltura.com/edash/p/4171/sp/417100/serveFlavor/entryId/0_4s6xvtx3/v/2/flavorId/0_,kl0tqbr3,t0bg9cqj,912xg2u3,0rdjs0pd,jwu3hnke,cmvt96h8,pxprgwpp,e29ge7b9,/forceproxy/true/name/a.mp4.urlset/manifest.mpd';
    var licenseUrl = 'https://udrm2.dev.kaltura.com/cenc/widevine/license?custom_data=eyJjYV9zeXN0ZW0iOiJPVlAiLCJ1c2VyX3Rva2VuIjoiTmpFeVpqRmhZV0U0TldJM05EQmtPV1k1T0dZMk0yWm1aRGM0TW1KalpEaGxPVE5pWVRCaE4zdzBNVGN4T3pReE56RTdNVFV3TmpVeE1UVTBOanN3T3pFMU1EWTBNalV4TkRZdU1qa3lOanN3TzNacFpYYzZLaXgzYVdSblpYUTZNVHM3IiwiYWNjb3VudF9pZCI6NDE3MSwiY29udGVudF9pZCI6IjBfNHM2eHZ0eDMiLCJmaWxlcyI6IjBfa2wwdHFicjMsMF90MGJnOWNxaiwwXzkxMnhnMnUzIn0%3D&signature=GlyQUVpVccdCWh70uwfY%2FqU%2BRvY%3D';

    // long video
    //var manifestUriDRM = 'https://cdnapisec.kaltura.com/p/1982551/sp/198255100/playManifest/entryId/0_mr1qse99/format/mpegdash/tags/dash/protocol/https/f/a.mpd';
    //var licenseUrl = 'https://udrm.kaltura.com//cenc/widevine/license?custom_data=eyJjYV9zeXN0ZW0iOiJPVFQiLCJ1c2VyX3Rva2VuIjoiIiwiYWNjb3VudF9pZCI6MTk4MjU1MSwiY29udGVudF9pZCI6IjBfbXIxcXNlOTlfMV85am8zYjh5MiwwX21yMXFzZTk5XzFfMW5xZXBkYzQsMF9tcjFxc2U5OV8wXzFoMHZjbzFsIiwiZmlsZXMiOiIxMDA1MDIwIiwidWRpZCI6ImFhNWUxYjZjOTY5ODhkNjgiLCJhZGRpdGlvbmFsX2Nhc19zeXN0ZW0iOjB9&signature=VfgVQYjKK3rtLkrkomlHQ6q%2F81I%3D&';


    playerConfig = {
        drm: {
            servers: {
                'com.widevine.alpha': licenseUrl,
                'com.microsoft.playready': licenseUrl
            }
        }
    }

    consts = {
        contentType: 'contentType',
        drm: 'drm',
        clear: 'clear',
        drmMovie: 'drmMovie',
        clearMovie: 'clearMovie',
        widevine: 'com.widevine.alpha'
    }


    var player;
    var requestsArr_ = [];
    var manifestUri_ = manifestUriClear;


    function initApp() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('sw.js');
        }

        navigator.serviceWorker.addEventListener('message', function (event) {
            console.log("event from sw: " + JSON.stringify(event.data))
            window.postMessage(event.data, '*');
        });

        // Install built-in polyfills to patch browser incompatibilities.
        shaka.polyfill.installAll();

        var videoElement = document.getElementById('video');
        //var videoElement = document.createElement("video");

        var video = videoElement;

        player = new shaka.Player(video);

        // Check to see if the browser supports the basic APIs Shaka needs.
        if (shaka.Player.isBrowserSupported()) {
            // Everything looks good!
            initPlayer();
        } else {
            // This browser does not have the minimum set of APIs we need.
            console.error('Browser not supported!');
        }

        video.addEventListener('session-restore', function (evt) {
            const session = evt.detail;
            LicensePersister.restore(session, consts.drmMovie, video);
        });

    }


    function assignUiListeners(){
        var localstorage = window.localStorage;

        document.getElementById("clearContent").addEventListener('click',function(){
            localstorage.setItem(consts.contentType,consts.clear);
            manifestUri_ = manifestUriClear;
            initPlayer();
        });

        document.getElementById("drmContent").addEventListener('click',function(){
            localstorage.setItem(consts.contentType,consts.drm);
            manifestUri_ = manifestUriDRM;
            initPlayer(playerConfig);
        });

        document.getElementById("fetchSome").addEventListener('click',function(){
            if (localstorage.getItem(consts.contentType) === consts.drm){
                manifestUri_ = manifestUriDRM;
                saveMedia();
            }else{
                manifestUri_ = manifestUriClear;
                saveMedia();
            }
        });

        document.getElementById("removeBtn").addEventListener('click',function(){
            if (localstorage.getItem(consts.contentType) === consts.drm){
                removeMedia(consts.drmMovie);
            }else{
                removeMedia(consts.clearMovie);
            }
        })
    }



    function saveMedia(){
        var tag = consts.clearMovie;
        if (window.localStorage.getItem(consts.contentType) === consts.drm) {
            tag = consts.drmMovie;

            var drmInfo = {
                name: 'com.widevine.alpha',
                url: licenseUrl,
                manifest: manifestUriDRM
            };
            LicensePersister.persist(consts.drmMovie, drmInfo);

        }

        getUrls(manifestUri_,function(requestsArr_){

            for (var i in requestsArr_) {
                requestsArr_[i] = requestsArr_[i].replace(/^http:\/\//i, 'https://');
            }
            var message = {
                'action': "backgroundfetch",
                'tag': tag,
                'requests': requestsArr_
            }

            navigator.serviceWorker.controller.postMessage(message);
        })
    }


    function initPlayer(playerConfig) {
        player.resetConfiguration();
        if (playerConfig){
            player.configure(playerConfig);
        }
;


        // Attach player to the window to make it easy to access in the JS console.
        window.player = player;

        // Listen for error events.
        player.addEventListener('error', onErrorEvent);
        var video = document.getElementById('video');



        if (navigator.onLine){
            delete video.dataset.offlineEncrypted;
        }else{
            video.dataset.offlineEncrypted=true;
        }


        // Try to load a manifest.
        // This is an asynchronous process.
        player.load(manifestUri_).then(function(manifest) {

            // This runs if the asynchronous load is successful.
            console.log('The video has now been loaded!');
        }).catch(onError);  // onError is executed if the asynchronous load fails.

    }

    function onErrorEvent(event) {
        // Extract the shaka.util.Error object from the event.
        onError(event.detail);
    }

    function onError(error) {
        // Log the error.
        console.error('Error code', error.code, 'object', error);
    }



    function removeMedia(mediaId){
        var message = {
            action: "remove",
            tag: mediaId
        }
        navigator.serviceWorker.controller.postMessage(message);
    }

    return{
        saveMedia: saveMedia,
        removeMedia: removeMedia,
        assignUiListeners: assignUiListeners,
        initApp: initApp
    }
}
var pwa_kaltura = pwa_kaltura();

document.addEventListener('DOMContentLoaded', function(){
    pwa_kaltura.initApp();
    pwa_kaltura.assignUiListeners();
});

