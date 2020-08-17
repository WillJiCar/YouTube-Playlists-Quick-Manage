var API_KEY = "AIzaSyDyRsuEV_8GmxTwH8rtT41qpm_WByqfUaY";
var playlists = [];
var selectedPlaylists = [];

window.onload = function() {
    disableScreen();

    getAllUserPlaylists(undefined, undefined, undefined, false, function(token, error){
        if(token == undefined){
            console.log("Undefined Token");
            document.getElementById("google-login").classList.remove("disabled");
        }
    });

    //CLICK EVENT HANDLERS
    document.getElementById("google-login").addEventListener('click', function() {
        getAllUserPlaylists();
        disableScreen();
    });

    enableScreen();
};

chrome.runtime.onMessage.addListener(function(message, callback){
    if(message == "inject-content"){
        //Message from Background
    }
});

function enableScreen(){
}

function disableScreen(){
    //TODO1.2 When logging in, disable sign in button, enable dark button
    //TODO1.3 If login in unsuccessful, enable sign in button
}

function getAllUserPlaylists(part = "snippet", mine = "true", pageToken = "0", interactive = true, callback){
    chrome.identity.getAuthToken({interactive: interactive}, function(token) {
        if(token === undefined){
            callback(token);
        }
        let init = {
            method: 'GET',
            async: true,
            headers: {
                Authorization: 'Bearer ' + token,
                'Content-Type': 'application/json'
            },
            'contentType': 'json'
        };
        fetch('https://www.googleapis.com/youtube/v3/playlists?part='+ part + '&mine=' + mine + '&maxResults=50&' + '&key=' + API_KEY,init)
            .then((respnse) => respnse.json())
            .then(function(data){
                for(item in data.items){
                    playlists.push({
                        title: data.items[item].snippet.title, 
                        id: data.items[item].id
                    });
                }
                getVideoIds();
                addPlaylistsToDOM();     
                getSelectedPlaylistsStorage(function (storedPlaylists){
                    selectedPlaylists = storedPlaylists;
                    setCheckedPlaylists(storedPlaylists);
                });
            })
            .catch(function (error){
                console.log("Fetch Error: " + error);
            });
        });    
        //
}

function getVideoIds(){
    for(var i = 0; i < playlists.length; i++){
        getVideoIdsFromPlaylist("contentDetails", playlists[i], undefined, function(videos, playlist){
            playlist.videos = videos;
        });        
    }
}

function getVideoIdsFromPlaylist(part = "snippet,contentDetails", playlist, nextPageToken = null, callback){
    var videos = [];
    chrome.identity.getAuthToken({interactive: true}, function(token) {
        let init = {
            method: 'GET',
            async: true,
            headers: {
                Authorization: 'Bearer ' + token,
                'Content-Type': 'application/json'
            },
            'contentType': 'json'
        };
        fetch('https://www.googleapis.com/youtube/v3/playlistItems?part='+ part + '&playlistId=' + playlist.id + '&maxResults=50&' + '&key=' + API_KEY + (nextPageToken != null ? '&pageToken=' + nextPageToken : ''),init)
            .then((respnse) => respnse.json())
            .then(function(data){
                for(item in data.items){
                    videos.push(data.items[item].contentDetails.videoId);
                }
                if(data.nextPageToken != null){
                    getVideoIdsFromPlaylist(undefined, playlist, data.nextPageToken, (nextVideos) => {
                        callback(videos.concat(nextVideos), playlist);
                    });
                } else{
                    callback(videos, playlist);
                }
            })
            .catch(function (error){
                console.log("Fetch Error: " + error);
            });
        });    
}

function addPlaylistsToDOM(){
    var i = 0;
    playlists.forEach(el => {
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

        document.getElementById("playlists-container").appendChild(checkboxWrapper);
        document.getElementsByClassName('checkbox')[i].addEventListener('click', editSelectedPlaylist);
        i++;
    });
    
    //Now they're all loaded in, grab Selected Playlists from storage and go through each one
    //and checkmark selected options.
}

function editSelectedPlaylist(){
    var id = this.getAttribute("data-id");
    var el = this;
    var selected = playlists.find(function(item) {
        return item.id == id;
    });
    getSelectedPlaylistsStorage(function(storedPlaylists){
        selectedPlaylists = storedPlaylists;
        if(el.checked){
            selectedPlaylists.push({
                title: selected.title,
                id: id,
                videos: selected.videos
            });
        }
        else{
            var pos = selectedPlaylists.findIndex(playlist => playlist.id === selected.id);
            selectedPlaylists.splice(pos, 1);
        }
        setSelectedPlaylistsStorage();
    });
}

function getSelectedPlaylistsStorage(callback){
    //Get selected playlists from storage
    chrome.storage.local.get({storedPlaylists: []}, function (result) {
        if(result.storedPlaylists.length > 0){
            result.storedPlaylists;   
            console.log(result.storedPlaylists);     
        }
        callback(result.storedPlaylists);
    });
}

function setCheckedPlaylists(global){
    //For each selected playlist, set checkbox as checked.
    for(playlist in global){
        document.querySelector(`input[data-id="${global[playlist].id}"]`).checked = true;
    }
}

function setSelectedPlaylistsStorage(){
    //Set storage, 
    //TODO: If title has more than 20 character for example, replace rest with ...
    chrome.storage.local.set({storedPlaylists : selectedPlaylists}); 
    console.log("Stored: " + selectedPlaylists);
}

//TODO: If someone has more than 50 playlists, run the call again for the remainding items, using nextPageToken


//For adding video to playlist
//POST https://www.googleapis.com/youtube/v3/playlistItems?part=id