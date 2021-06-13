# YTMusicShare
Share what you're listening to on YouTube Music with friends, or listen along with a friend, no YouTube Music needed. :)

## Supported platforms
Any browser with WebRTC support. Client disconnect may not work on Firefox.

(Uses [PeerJS](https://peerjs.com/).)

## Client usage
Copy the contents of `client.js` into your console in a browser tab (use Google or YouTube to avoid CORS issues), or run `dummy_client_host.py` and open `localhost:6900` in a browser.

## Server usage
Use [Tampermonkey](https://www.tampermonkey.net/) with `server.user.js`. A button appears at the bottom of the player with the share ID.

For faster installation, copy `https://raw.githubusercontent.com/An0nDev/ytmusicshare/master/server.user.js` into the text box in Dashboard --> Utilities --> Install from URL.