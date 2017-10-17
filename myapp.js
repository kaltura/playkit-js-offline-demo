var licenseUrl = 'https://udrm.kaltura.com/cenc/widevine/license?custom_data=eyJjYV9zeXN0ZW0iOiJPVFQiLCJ1c2VyX3Rva2VuIjoiMjQ1MTczMCIsImFjY291bnRfaWQiOjE5ODI1NTEsImNvbnRlbnRfaWQiOiIwX3JnYzViNmEwXzBfMjdocTNmb3gsMF9yZ2M1YjZhMF8wX3QwMnBwMDNjLDBfcmdjNWI2YTBfMF9mZXoyemMycCIsImZpbGVzIjoiMzAwOTc4NiIsInVkaWQiOiIzQjMyMzQ5Ri00Mzg4LTM5NEQtQjZEOC1BRDE1RTk4NjY0REQiLCJhZGRpdGlvbmFsX2Nhc19zeXN0ZW0iOjB9&signature=xUtiedtBDulKxlMbDXMSqV2biOU%3D';
var manifestUrl = 'https://cdnapisec.kaltura.com/p/1982551/sp/198255100/playManifest/entryId/0_rgc5b6a0/format/mpegdash/tags/dash/protocol/https/flavorIds/0_t02pp03c/a.mpd';

var config1 = {
    partnerId:1982551,
    id: "0_rgc5b6a0",
    entryId: "0_rgc5b6a0",
    sources:{
        dash:[
            {
                url: manifestUrl,
                mimetype: 'application/dash+xml',
                id: 'optional',
                drmData:
                    [
                        {
                            licenseUrl : licenseUrl,
                            scheme:  'com.widevine.alpha'
                        }
                    ]
            }
        ]
    },
    plugins: {
    }
};

var config2 = {
    partnerId:1982551,
    id: "0_rgc5b6a0",
    entryId: "0_rgc5b6a0",
    sources:{
        dash:[
            {
                url: manifestUrl,
                mimetype: 'application/dash+xml',
                id: 'optional',
                drmData:
                    [
                        {
                            licenseUrl : licenseUrl,
                            scheme:  'com.widevine.alpha'
                        }
                    ]
            }
        ]
    },
    plugins: {
    }
};


var configs = [config1,config2];
var configIndex = 0;


function pwa_kaltura() {


    var kalturaPlayer = null;
    function initApp(){

        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('sw.js');
        }

        try {
            var config = configs[configIndex];

            kalturaPlayer = KalturaPlayer.setup('player-placeholder', config);
            configureSession(config);
            kalturaPlayer.play();

        } catch (e) {
            console.error(e.message)
        }
    }


    function assignUiListeners(){

        var video = document.getElementsByTagName("video")[0];

        document.getElementById("changeDrmContent").addEventListener('click',function(){
            var config = configs[configIndex];
            changeMedia(config);
            configIndex = (configIndex+1)%2;
        });


        video.addEventListener('session-restore', function (evt) {
            const session = evt.detail;
            const tag = configs[configIndex].entryId;
            LicensePersister.restore(session, tag, video);
        });

        document.getElementById("saveMedia").addEventListener('click',function(){
            saveMedia(configs[configIndex]);
        });

        navigator.serviceWorker.addEventListener('message', function (event) {
            console.log("event from sw: " + JSON.stringify(event.data))
            window.postMessage(event.data, '*');
        });

     }


     function changeMedia(config){
        try {
            kalturaPlayer.configure(config);
            configureSession(config);
            kalturaPlayer.play();
        } catch (e) {
            console.error(e.message)
        }
     }


     function configureSession(config){
         var video = document.getElementsByTagName("video")[0];

         if (navigator.onLine){
             delete video.dataset.offlineEncrypted;
         }else{
             video.dataset.offlineEncrypted=true;
         }

         var sessionRestoreHandler = function(evt){
             const session = evt.detail;
             const tag = config.id;
             LicensePersister.restore(session, tag, video);
         }

         video.removeEventListener('session-restore', sessionRestoreHandler);
         video.addEventListener('session-restore', sessionRestoreHandler);
     }

     function saveMedia(config){
         var license_ = config.sources.dash[0].drmData[0].licenseUrl;
         var manifest_ = config.sources.dash[0].url;
         var tag_ = config.id;

         var drmInfo_ = {
             name: 'com.widevine.alpha',
             url: license_,
             manifest: manifest_
         };
         LicensePersister.persist(tag_, drmInfo_);

         getUrls(manifest_,function(requestsArr_){

            for (var i in requestsArr_) {
                requestsArr_[i] = requestsArr_[i].replace(/^http:\/\//i, 'https://');
            }
            var message = {
                'action': "backgroundfetch",
                'tag': tag_,
                'requests': requestsArr_
            }

            navigator.serviceWorker.controller.postMessage(message);
            });

     }


    function removeMedia(mediaId){
        var message = {
            action: "remove",
            tag: mediaId
        };
        navigator.serviceWorker.controller.postMessage(message);
    }

    return{
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

