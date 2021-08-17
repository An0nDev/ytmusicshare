console.log ("test");
var parcelRequire; // no clue why this works

var peer;
var connection;

var targetRoot;

function clearElement (element) {
    for (var child of Array.from (element.children)) {
        element.removeChild (child);
    }
}

function onPageReady () {
    targetRoot = document.body;

    clearElement (targetRoot);

    var tag = document.createElement ('script');
    tag.src = "https://www.youtube.com/iframe_api";

    var firstScriptTag = document.getElementsByTagName ('script')[0];
    firstScriptTag.parentNode.insertBefore (tag, firstScriptTag);
    console.log ("prepping yt iframe");
}
if (document.readyState !== "complete") {
    window.onload = onPageReady;
} else {
    onPageReady ();
}

var serverSelectContainer;
var serverSelectInput;
var playingViewContainer;
var playerContainer;
function onYouTubeIframeAPIReady () {
    console.log ("yt iframe ready");
    import ("https://unpkg.com/peerjs@1.3.1/dist/peerjs.min.js").then (_ => {
        peer = new Peer ();
        serverSelectContainer = document.createElement ("span");

        serverSelectInput = document.createElement ("input");
        serverSelectInput.type = "text";
        var serverSelectButton = document.createElement ("button");
        serverSelectButton.innerText = "Connect";

        function connect () {
            var targetServer = serverSelectInput.value;
            console.log (targetServer);
            connection = peer.connect (targetServer);

            connection.on ("open", openHandler);
            connection.on ("data", dataHandler);
            connection.on ("close", closeHandler);
        }

        serverSelectButton.addEventListener ("click", connect);
        serverSelectInput.addEventListener ("keydown", event => {
            if (event.key == "Enter") connect ();
        })
        serverSelectContainer.appendChild (serverSelectInput);
        serverSelectContainer.appendChild (serverSelectButton);

        var backButton = document.createElement ("button");
        backButton.innerText = "Back";
        backButton.addEventListener ("click", event => { window.location.reload (); });
        serverSelectContainer.appendChild (backButton);

        targetRoot.appendChild (serverSelectContainer);

        playingViewContainer = document.createElement ("span");
        playingViewContainer.style.display = "none";
        playerContainer = document.createElement ("span");

        playerContainer.id = "ytplayer";
        playingViewContainer.appendChild (playerContainer);
        playingViewContainer.appendChild (document.createElement ("br"));
        var disconnectButton = document.createElement ("button");

        disconnectButton.addEventListener ("click", event => {
            if (connection.open) connection.close ();
        });
        disconnectButton.innerText = "Disconnect";
        playingViewContainer.appendChild (disconnectButton);

        targetRoot.appendChild (playingViewContainer);
    });
}


var first = true;
var player = null;

function parseTime (time) {
    var split = time.split (":");
    return parseInt (split [0]) * 60 + parseInt (split [1]);
}

var currentID;
var paused = false;

function openHandler () {
    serverSelectContainer.style.display = "none";
    playingViewContainer.style.display = "initial";
    serverSelectInput.value = "";
}

function dataHandler (data) {
    var data = JSON.parse (data);
    console.log (data);
    if (first) {
        if (data ["status"] == "inactive") return;
        first = false;
        if (player == null) {
            player = new YT.Player ("ytplayer", {
                videoId: data ["id"]
            });
        } else {
            player.loadVideoById (data ["id"])
        }
        if (data ["paused"]) player.pauseVideo ();
        currentID = data ["id"];
        return;
    }
    if (data ["status"] == "inactive") {
        player.stopVideo ();
        return;
    }
    console.log (data ["time"] ["current"]);
    var currentSeconds = parseTime (data ["time"] ["current"]);
    console.log (currentSeconds);
    if (data ["id"] != currentID) {
        player.loadVideoById (data ["id"], currentSeconds);
        currentID = data ["id"];
    }
    if (data ["paused"] != paused) {
        if (data ["paused"]) {
            player.pauseVideo ();
        } else {
            player.playVideo ();
        }
        paused = data ["paused"];
    }
    if (player.getCurrentTime () !== undefined) {
        console.log (`Math.abs (${currentSeconds} - ${player.getCurrentTime ()})`);
        var timeDifferenceSeconds = Math.abs (currentSeconds - player.getCurrentTime ());
        console.log (timeDifferenceSeconds);
        if (timeDifferenceSeconds > 5) {
            player.seekTo (currentSeconds);
        }
    }
}

function closeHandler () {
    if (player != null) {
        player.stopVideo ();
    }
    first = true;
    paused = false;
    serverSelectContainer.style.display = "initial";
    playingViewContainer.style.display = "none";
}
