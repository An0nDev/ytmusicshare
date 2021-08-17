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

var parcelRequire;
(function() {
    'use strict';
    let id = null;
    let overlay = document.createElement ("p");
    overlay.style.fill = "#FFFFFF";
    overlay.addEventListener ("click", () => {
        if (id != null) prompt ("here you go", id);
    });
    var overlayAddId;
    overlayAddId = setInterval (() => {
        try {
            document.querySelector ("ytmusic-player-bar").appendChild (overlay);
            console.log ("success");
            clearInterval (overlayAddId)
        } catch (e) {
            console.log (e);
        }
    }, 1000);

    let peer;
    let connections = [];
    function updateOverlay () { overlay.innerText = `Click for ID (${connections.length} listeners)`; }
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