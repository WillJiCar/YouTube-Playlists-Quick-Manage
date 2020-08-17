var API_KEY = "AIzaSyDyRsuEV_8GmxTwH8rtT41qpm_WByqfUaY";

window.onload = function() {
    document.querySelector('button').addEventListener('click', function() {
      getAllUserPlaylists();
    });
  };

var playlists = [];
var selectedPlaylists = [];

function getAllUserPlaylists(part = "snippet", mine = "true", pageToken = "0"){

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
        fetch('https://www.googleapis.com/youtube/v3/playlists?part='+ part + '&mine=' + mine + '&maxResults=50&' + '&key=' + API_KEY,init)
        .then((respnse) => respnse.json())
        .then(function(data){
            console.log(data)
            for(item in data.items){
                playlists.push({
                    title: data.items[item].snippet.title, 
                    id: data.items[item].id
                });}
            console.log(playlists);
            addPlaylistsToDOM();
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
        checkboxInput.setAttribute('data-pos', i);

        //Create Checkmark
        var checkmarkSpan = document.createElement("span");
        checkmarkSpan.classList.add("checkmark");

        checkboxWrapper.appendChild(checkboxInput);
        checkboxWrapper.appendChild(checkmarkSpan);

        document.getElementById("playlists-container").appendChild(checkboxWrapper);
        document.getElementsByClassName('checkmark')[i].addEventListener('click', function() {
            //Get playlist from this data-pos in playlists and add it to selectedPlaylists
        });
        i++;
    });
}

//TODO: If someone has more than 50 playlists, run the call again for the remainding items, using nextPageToken
//For adding video to playlist
//POST https://www.googleapis.com/youtube/v3/playlistItems?part=id
//Need Playlist ID and Video ID
//Need - foreach item in data.items, store title and ID