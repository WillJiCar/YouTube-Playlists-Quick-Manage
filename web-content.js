var selectedPlaylists = [];
var CURRENT_ID = null;

/*
-----Restructure

When the page loads, it reloads selected playlists, instead it should check to see if
these playlists are already on the page, if they are then skip, else add
If a local selectedPlaylist is not in storage, then remove
*/

function getStoredSelectedPlaylists(){
    chrome.storage.local.get({storedPlaylists: []}, function (result) {
        console.log("Getting playlists");
        var pluginContainer = document.getElementById("vibe-playlist-container");
        if(result.storedPlaylists.length > 0){
            console.log("Foound playlists");
            selectedPlaylists = result.storedPlaylists;    
            getCheckedPlaylists();
            loadPlaylistsOnPage();
        }
        else if(pluginContainer != null){
            console.log("No playlists found");
            pluginContainer.parentNode.removeChild(pluginContainer);
        }
        else{
            console.log("Can not run " + result.storedPlaylists);
        }
    });
}

function getCheckedPlaylists(){
    for(playlist in selectedPlaylists){
        if(selectedPlaylists[playlist].videos.indexOf(CURRENT_ID) > -1){
            //Video is in this playlist
            selectedPlaylists[playlist].checked = true;
            console.log(selectedPlaylists[playlist]);
        }
    }
}
 
//TODO: Call this method if popup.js is changed, send message from there
function loadPlaylistsOnPage(){

    console.log("Loading playlists... " + selectedPlaylists);
    var containerOffset = document.getElementById('clarify-box');

    var playlistContainer = document.getElementById("vibe-playlist-container");
    if(playlistContainer == null){
        //BRAND NEW INSTANCE
        playlistContainer = document.createElement("div");
        playlistContainer.setAttribute("id", "vibe-playlist-container");
        containerOffset.parentNode.insertBefore(playlistContainer, containerOffset.nextSibling);  
        insertPlaylistElements(selectedPlaylists, playlistContainer);
    }
    else{
        //INSTANCE TO BE UPDATED
        console.log("Updating instance...");
        var playlistElements = playlistContainer.querySelectorAll('label.checkbox-wrapper > input');   //Gets all displayed playlists
        console.log("Found: " + playlistElements.length + " currently displayed playlists");
        playlistElements.forEach((el) => {   //Loops through each one to see if they are in selected playlist storage
            var id = el.getAttribute('data-id');    //Get the current playlist ID
            console.log("Searching for " + id);
            var matchedPlaylist = selectedPlaylists.filter(playlist => playlist.id == id);  //Searches for it in storage
            if(matchedPlaylist.length == 0){    //If it is not found, remove
                el.parentNode.parentNode.removeChild(el.parentNode);
                console.log("Can't find playlist, removing from DOM");
            }
        });
        var playlistsToAdd = [];
        selectedPlaylists.forEach((playlist, index) =>{ //Loop through each playlist to find new items to display
            console.log("Looping through selected playlists storage");
            if(playlistContainer.querySelector(`label.checkbox-wrapper > input[data-id="${playlist.id}"]`) == null){
                console.log("Adding " + playlist.title);
                playlistsToAdd.push(playlist);
            }
        });
        insertPlaylistElements(playlistsToAdd, playlistContainer);
    }    
    
     
    
}

function insertPlaylistElements(playlists, parentNode){
    playlists.forEach((el, index) => {
        console.log("For each playlist...");
        //Create Checkbox Label
        var checkboxWrapper = document.createElement("label");
        checkboxWrapper.classList.add("checkbox-wrapper");
        checkboxWrapper.appendChild(document.createTextNode(el.title));

        //Create Checkbox Input
        var checkboxInput = document.createElement("input");
        checkboxInput.classList.add("checkbox");
        checkboxInput.type = "checkbox";
        checkboxInput.setAttribute('data-id', el.id);

        //Create Checkmark
        var checkmarkSpan = document.createElement("span");
        checkmarkSpan.classList.add("checkmark");

        checkboxWrapper.appendChild(checkboxInput);
        checkboxWrapper.appendChild(checkmarkSpan);

        parentNode.appendChild(checkboxWrapper);
        parentNode.getElementsByClassName('checkbox')[index].addEventListener('click', playlistClick);
        //      then make the playlist.checked if true; send message to remove from playlist if unchecked.
    });
}

function playlistClick(){
    var el = this;
    el.setAttribute("disabled", "true");
    var playlistId = el.getAttribute("data-id");
    if(el.checked){
        //Send message to Background to add to playlist
        console.log(`Adding ${CURRENT_ID} to ${playlistId}`);
        sendMessageToChrome({action: "insert", playlistId: playlistId, videoId: CURRENT_ID}, function(){
            el.removeAttribute("disabled");
        });

    }else{
        //Remove from playlist
        console.log(`Removing ${CURRENT_ID} to ${playlistId}`);
        sendMessageToChrome({action: "delete", playlistId: playlistId, videoId: CURRENT_ID}, function(){
            el.removeAttribute("disabled");
        });
    }
}

function sendMessageToChrome(args, callback){
    chrome.runtime.sendMessage(args, function(response) {
        //callback to enable the element again
        callback();
    });
}


chrome.runtime.onConnect.addListener(function(port) {
    
});

var portContentBackground = chrome.runtime.connect({name: "content-background"});
portContentBackground.postMessage({message: "request-id"});
portContentBackground.onMessage.addListener(function(msg) {
    CURRENT_ID = msg.id;
    getStoredSelectedPlaylists();
});

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse){
    if(request.message == "update-playlists"){
        console.log("Recieved message");
        sendResponse({message: "confirmed"});
        getStoredSelectedPlaylists();
    }
});