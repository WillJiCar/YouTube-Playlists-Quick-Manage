/*
-----Restructure
TODO: Something is causing the selected playlists to clear, only when unselecting 1 and 
then navigating between tabs, something must be calling it to clear or something.
*/

var API_KEY = "AIzaSyDyRsuEV_8GmxTwH8rtT41qpm_WByqfUaY";

//TAB IS LOADED
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab){
    if (changeInfo.status == 'complete' && tab.status == 'complete' && tab.url != undefined) {
        initApplication(tab);
      }
  });
  
//TAB IS CHANGED
chrome.tabs.onHighlighted.addListener(function(highlightInfo){
    chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
        initApplication(tabs[0]);
    });
});

var URL_ID = null;

function initApplication(tab){
    if(verifyURL(tab.url) != null){
        //Send message to check if it already is there, if so, cross-reference this selectedPlaylists and storage selected playlists.
        //Be aware of how it will work when a user is on a video, with playlists listed, and they change using the popup.
        console.log(tab.id);
        sendMessageToTab(tab.id, "update-playlists");
        isScriptInTab(tab.id);
    }
}

function verifyURL(url){
    if(url.includes("youtube.com/watch?v=")){
        //https://www.youtube.com/watch?v=2ap2_erSXBQ&list=LL87ysCrXGPUsuyyKc04gFdQ&index=35&t=16s == URL
        //Between "v=" and "&"
        //TODO: Use all different type of YouTube urls
        if(url.includes("&")){
            var ID = url.substring(
                url.indexOf("=") + 1,
                url.indexOf("&")
            );
            URL_ID = ID;
            return ID;
        } else{
            var ID = url.substring(
                url.indexOf("=") + 1
            );
            URL_ID = ID;
            return ID;
        }
    }
    return null;
}

function sendMessageToTab(id, message){
    chrome.tabs.sendMessage(id, {message: message}, function(response){
        console.log("Seonding message");
        if(response == null){
            console.log("Script not found");
            displayPlaylists();
        }
    });
}

chrome.runtime.onMessage.addListener(
    function(request, sender, callback){
      if (request.action == "insert"){
        console.log("Recieved insert message");
        addVideoToPlaylist(request.playlistId, request.videoId);
        callback({message: "successful"});
      } else if(request.action == "delete"){
        console.log("Recieved delete message");
        removeVideoFromPlaylist(request.playlistId, request.videoId);
        callback({message: "successful"});
      }
});

chrome.runtime.onConnect.addListener(function(port) {
    if(port.name == "content-background"){
        port.onMessage.addListener(function(msg) {
            if (msg.message == "request-id"){
              port.postMessage({id: URL_ID });
            }
        });
    }    
});

function displayPlaylists(){
    chrome.tabs.executeScript({
        file:'web-content.js'
    });
    chrome.tabs.insertCSS({
        file: 'web-content.css'
    });
}

function deleteVideoFromPlaylist(playlistId, videoId){
    chrome.identity.getAuthToken({interactive = true}, function(token){
        let init = {
            method: 'DELETE',
            async: true,
            headers: {
                Authorization: 'Bearer ' + token,
                'Content-Type': 'application/json'
            },
            body: `{
            "snippet": {
                "playlistId":"${playlistId}",
                "resourceId":
                    {"videoId":"${videoId}"}
                }
            }`,
            'contentType': 'json'
        };
        fetch('https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&key=' + API_KEY, init)
            .then((response) => response.json())
            .then(function(data){
                //Send message back to say success
                    //remove disabled attribute
            })
            .catch(function (error){
                //Send message back to say failure
                console.log("Fetch Error: " + error);
            });
    });
}

function addVideoToPlaylist(playlistId, videoId){
    chrome.identity.getAuthToken({interactive = true}, function(token){
        let init = {
            method: 'POST',
            async: true,
            headers: {
                Authorization: 'Bearer ' + token,
                'Content-Type': 'application/json'
            },
            body: `{
            "snippet": {
                "playlistId":"${playlistId}",
                "resourceId":
                    {"videoId":"${videoId}"}
                }
            }`,
            'contentType': 'json'
        };
        fetch('https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&key=' + API_KEY, init)
            .then((response) => response.json())
            .then(function(data){
                //Send message back to say success
                    //remove disabled attribute
            })
            .catch(function (error){
                //Send message back to say failure
                console.log("Fetch Error: " + error);
            });
    });
}