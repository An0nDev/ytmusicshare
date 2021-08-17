// ==UserScript==
// @name         YouTube Music Share Server
// @namespace    https://github.com/an0ndev/ytmusicshare/
// @version      0.1
// @description  lets you share what you're listening to with others
// @author       an0ndev
// @match        https://music.youtube.com/*
// @grant        none
// @require      https://unpkg.com/peerjs@1.3.1/dist/peerjs.min.js
// @run-at       document-start
// ==/UserScript==

const CLIENT_JS_URL = "https://raw.githubusercontent.com/an0ndev/ytmusicshare/master/client.js";

var parcelRequire;
(function() {
    'use strict';
    let id = null;
    var overlayContainer = document.createElement ("div");
    overlayContainer.style.position = "absolute";
    overlayContainer.style.zIndex = "9999";
    overlayContainer.style.width = "100%";
    overlayContainer.style.display = "flex";
    overlayContainer.style.justifyContent = "space-between";
    let overlay = document.createElement ("h1");
    overlay.addEventListener ("click", event => {
        // if (id != null) prompt ("here you go", id);
        if (id == null) {
            alert ("not connected yet");
            return
        }
        navigator.clipboard.writeText (id);
    });
    overlayContainer.appendChild (overlay);
    var loadPlayerButton = document.createElement ("h1");
    loadPlayerButton.innerText = "Join a session";
    loadPlayerButton.addEventListener ("click", event => {
        fetch (CLIENT_JS_URL).then (response => response.text ()).then (text => {
            var newScriptTag = document.createElement ("script");
            newScriptTag.innerHTML = text;
            document.head.appendChild (newScriptTag);
        });
    });
    overlayContainer.appendChild (loadPlayerButton);
    /*
    var overlayAddId;
    overlayAddId = setInterval (() => {
        try {
            var playerPage = document.querySelector ("ytmusic-player-page");
            playerPage.style.display = "flex";
            playerPage.style.flexDirection = "column";
            playerPage.appendChild (overlayContainer);
            console.log ("success");
            clearInterval (overlayAddId)
        } catch (e) {
            console.log (e);
        }
    }, 1000);

     */
    window.addEventListener ("load", event => {
        if (document.body.children.length > 0) {
            document.body.insertBefore (overlayContainer, document.body.firstChild);
        } else document.body.appendChild (overlayContainer);
    });

    let peer;
    let connections = [];
    function updateOverlay () { overlay.innerText = `Copy session ID (${connections.length} listeners)`; }
    updateOverlay ();
    peer = new Peer ();
    peer.on ("open", _id => {
        id = _id;
        console.log (_id);
        peer.on ("connection", connection => {
            connections.push (connection);
            connection.on ("close", () => {
                connections.splice (connections.indexOf (connection), 1);
                updateOverlay ();
            });
            updateOverlay ();
        });
        setInterval (intervalHandler, 1000);
    });

    function post (data) {
        for (let connection of connections) {
            connection.send (JSON.stringify (data));
        }
    }
    let lastID = null;
    var intervalHandler = () => {
        var infoWrapperElem = document.querySelector ("div.content-info-wrapper");
        if (infoWrapperElem != null) {
            var titleElem = infoWrapperElem.children [0];
            var bylineElem = infoWrapperElem.querySelector ("yt-formatted-string.byline");
            if (titleElem != null && bylineElem != null) {
                var title = titleElem.innerText;
                var byline = bylineElem.innerText.split ("\n • \n");
                var artists = byline [0].split ("\n & \n");
                var album = byline [1];
                var year = parseInt (byline [2]);

                var playPauseButton = document.querySelector ("tp-yt-paper-icon-button.play-pause-button");
                if (playPauseButton != null) {
                    if ((["Pause", "Play"].includes (playPauseButton.title))) {
                        var paused = playPauseButton.title == "Play";

                        var timeInfoElem = document.querySelector ("span.time-info");
                        if (timeInfoElem != null) {
                            var currentAndEnd = timeInfoElem.innerText.split ("/").map (part => part.trim ());
                            var current = currentAndEnd [0];
                            var end = currentAndEnd [1];

                            var id = new URL (window.location.href).searchParams.get ("v");
                            if (id == null) {
                                if (lastID == null) return;
                                id = lastID;
                            } else {
                                lastID = id;
                            }


                            post ({
                                status: "active",
                                title: title,
                                artists: artists,
                                album: album,
                                year: year,
                                paused: paused,
                                time: {
                                    current: current,
                                    end: end
                                },
                                id: id
                            });
                            console.log (`SHARED: ${title} by ${artists.join (', ')} off ${album} from ${year} (ID ${id}), paused: ${paused}, time: ${current}/${end}`);
                            return;
                        }
                    }
                }
            }
        }
        post ({status: "inactive"});
        console.log ("could not detect");
    };
})();