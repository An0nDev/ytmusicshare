console.log ("test");
var parcelRequire; // no clue why this works

var peer;
var connection;

var targetRoot;

function onPageReady () {
    targetRoot = document.body;

    for (var origElement of Array.from (targetRoot.children)) {
        targetRoot.removeChild (origElement);
    }

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

function onYouTubeIframeAPIReady () {
    console.log ("yt iframe ready");
    import ("https://unpkg.com/peerjs@1.3.1/dist/peerjs.min.js").then (_ => {
        peer = new Peer ();
        var serverSelectContainer = document.createElement ("span");

        var serverSelectInput = document.createElement ("input");
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
        targetRoot.appendChild (serverSelectContainer);

        var playerContainer = document.createElement ("span");
        playerContainer.id = "ytplayer";
        playerContainer.style.display = "none";
        targetRoot.appendChild (playerContainer);
    });
}


var first = true;
var player;

function parseTime (time) {
    var split = time.split (":");
    return parseInt (split [0]) * 60 + parseInt (split [1]);
}

var currentID;
var paused = false;

function openHandler () {
    targetRoot.children [0].style.display = "none";
    targetRoot.children [1].style.display = "initial";
}

function dataHandler (data) {
    var data = JSON.parse (data);
    console.log (data);
    if (first) {
        if (data ["status"] == "inactive") return;
        first = false;
        player = new YT.Player ("ytplayer", {
            videoId: data ["id"]
        });
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
    window.location.reload ();
}
