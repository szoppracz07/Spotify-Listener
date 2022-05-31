// Variables
    // User Token
    var TOKEN = localStorage.getItem("token");
    var ShouldExpire = localStorage.getItem("expire");

    // Check for first connection
    var FirstConnect = false;

    // Load Important Variables
    var Artist = localStorage.getItem("artist");
    var MusicName = localStorage.getItem("musicname");
    var MusicImage = localStorage.getItem("musicimage");
    var Duration = localStorage.getItem("duration");
    var Progress = localStorage.getItem("progress");

    // Check is Music Playing
    var isPlaying;

    // Temporary Progress Int
    var TempProgress;

// Getting User's Access Token
    const getReturnedParamsFromSpotifyAuth = (hash) => {
        const stringAfterHashtag = hash.substring(1);
        const paramsInUrl = stringAfterHashtag.split("&");
        const paramsSplitUp = paramsInUrl.reduce((accumulater, currentValue) => {
        console.log(currentValue);
        const [key, value] = currentValue.split("=");
        accumulater[key] = value;
        return accumulater;
        }, {});
    
        return paramsSplitUp;
    };

    const CLIENT_ID = "4eae97685f324d1893b393830c3df2d6";
    const SPOTIFY_AUTHORIZE_ENDPOINT = "https://accounts.spotify.com/authorize";
    const REDIRECT_URL_AFTER_LOGIN = "https://spotify.devpush.xyz";
    const SPACE_DELIMITER = "%20";
    const SCOPES = [
        "user-read-currently-playing",
        "user-read-playback-state",
        "playlist-read-private",
        "user-modify-playback-state",
        "streaming",
        "user-read-email",
        "user-read-private"
    ];
    const SCOPES_URL_PARAM = SCOPES.join(SPACE_DELIMITER);
    const AUTH_URL = `${SPOTIFY_AUTHORIZE_ENDPOINT}?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URL_AFTER_LOGIN}&scope=${SCOPES_URL_PARAM}&response_type=token&show_dialog=true`;

    if(window.location.hash) {
        const {
            access_token,
            expires_in,
            token_type,
        } = getReturnedParamsFromSpotifyAuth(window.location.hash);

        localStorage.setItem("token", access_token);

        var minutesToAdd=59;
        var currentDate = new Date();
        var futureDate = new Date(currentDate.getTime() + minutesToAdd*60000);
        ShouldExpire = futureDate;
        localStorage.setItem("expire", futureDate);

        TOKEN = access_token;
        window.location = REDIRECT_URL_AFTER_LOGIN;
    }

    function CheckToken() {
        if(TOKEN == undefined || TOKEN == null || TOKEN == "" || new Date() >= new Date(ShouldExpire))
        {
            window.location = AUTH_URL;
        }
    }

    CheckToken();

// Required Functions

    function isWhatPercentOf(numA, numB) {
        return (numA / numB) * 100;
    }

    function millisToMinutesAndSeconds(millis) {
        var minutes = Math.floor(millis / 60000);
        var seconds = ((millis % 60000) / 1000).toFixed(0);
        return minutes + ":" + (seconds < 10 ? '0' : '') + seconds;
    }

// Fill Every Informations

    function setTimeProgress() {
        document.getElementById("time").textContent = millisToMinutesAndSeconds(Duration);
        TempProgress = Progress;
        document.getElementById("timeNow").textContent = millisToMinutesAndSeconds(Progress);

        $("#progressbar").css("width", (isWhatPercentOf(Progress, Duration) + "%"));
    }

    function Fill(Artist, MusicName, MusicImage, Duration, Progress) {
        document.getElementById("artist").textContent = Artist;
        document.getElementById("name").textContent = MusicName;
        document.getElementById("time").textContent = millisToMinutesAndSeconds(Duration);
        TempProgress = Progress;
        document.getElementById("timeNow").textContent = millisToMinutesAndSeconds(Progress);
        document.body.style.backgroundImage = "url(" + MusicImage + ")";

        if(isPlaying){
            document.getElementById("togglePlay").src = "img/Stop.png";
        }else {
            document.getElementById("togglePlay").src = "img/Resume.png";
        }

        $("#progressbar").css("width", (isWhatPercentOf(Progress, Duration) + "%"));

        var link = document.querySelector("link[rel~='icon']");
        if (!link) {
            link = document.createElement('link');
            link.rel = 'icon';
            document.getElementsByTagName('head')[0].appendChild(link);
        }
        link.href = MusicImage;

        document.title = `Listening to: "` + MusicName + `"`;

        document.getElementById("textinfo").classList.add('opacityzero');
        document.getElementById("textinfo").classList.remove('textdown');
        document.getElementById("textinfo").classList.add('showtext');

        return;
    }

    setInterval(function() {
        if(parseInt(TempProgress) < parseInt(Duration) - 1000 && isPlaying == true) {
            TempProgress = parseInt(TempProgress) + 1000;
            document.getElementById("timeNow").textContent = millisToMinutesAndSeconds(parseInt(TempProgress));
            $("#progressbar").css("width", (isWhatPercentOf(parseInt(TempProgress) + 1000, Duration) + "%"));
        }
    }, 1000);

// API Functions

    // Errors
    var ErrorStop = false;

    async function ReUse() {
        CheckToken();

        const result = await fetch(`https://api.spotify.com/v1/me/player/currently-playing`, {
            method: 'GET',
            headers: {'Authorization': 'Bearer ' + ' ' + TOKEN}
        });

        const data = await result.json();

        Artist = data.item.artists[0].name;
        MusicName = data.item.name;
        MusicImage = data.item.album.images[0].url;
        isPlaying = data.is_playing;

        if(isPlaying == true) {
            Duration = data.item.duration_ms;
            Progress = data.progress_ms;
        }

        if(MusicName != localStorage.getItem("musicname")){
            document.getElementById("textinfo").classList.remove('opacityzero');
            document.getElementById("textinfo").classList.add('textdown');
            document.getElementById("textinfo").classList.remove('showtext');
        }

        setTimeout(
            function() 
            {
                localStorage.setItem("artist", Artist);
                localStorage.setItem("musicname", MusicName);
                localStorage.setItem("musicimage", MusicImage);
                localStorage.setItem("duration", Duration);
                localStorage.setItem("progress", Progress);

                Fill(Artist, MusicName, MusicImage, Duration, Progress);
            }, 1000);

        return;
    }

// Initialization

    setInterval(function(){
        ReUse();
    }, 30000);

    Fill(Artist, MusicName, MusicImage, Duration, Progress);

// Functions for Spotify Web Playback SDK

    function showConnectInfo() {
        jQuery('#connectinfo').css('opacity', '1');

        setTimeout(
            function() 
            {
                hideConnectInfo();
            }, 3000);
    }

    function hideConnectInfo() {
        jQuery('#connectinfo').css('opacity', '0');
    }

// Spotify Web Playback SDK

    window.onSpotifyWebPlaybackSDKReady = () => {
        const player = new Spotify.Player({
            name: 'Spotify Listener',
            getOAuthToken: cb => { cb(TOKEN); },
            volume: 0.1
        });

        // Ready
        player.addListener('ready', ({ device_id }) => {
            document.getElementById("connected").textContent = "Device Ready!";
            showConnectInfo();
        });


        // Not Ready
        player.addListener('not_ready', ({ device_id }) => {
            document.getElementById("connected").textContent = "[!] Device Not Ready!";
            showConnectInfo();
        });
        
        player.addListener('player_state_changed', ({
            position,
            duration,
            paused,
            track_window: { current_track }
        }) => {
            
            CheckToken();

            Duration = duration;
            Progress = position;
            
            isPlaying = !paused;

            if(isPlaying){
                document.getElementById("togglePlay").src = "img/Stop.png";
            }else {
                document.getElementById("togglePlay").src = "img/Resume.png";
            }

            const data = current_track;

            console.log(data);

            localStorage.setItem("duration", duration);
            localStorage.setItem("progress", position);
            setTimeProgress();

            Artist = data.artists[0].name;
            MusicName = data.name;
            MusicImage = data.album.images[0].url;
        
            if(FirstConnect == false) {
                document.getElementById("connected").textContent = "Device Connected!";
                showConnectInfo();
                FirstConnect = true;
            }

            if(MusicName != localStorage.getItem("musicname")){
                document.getElementById("textinfo").classList.remove('opacityzero');
                document.getElementById("textinfo").classList.add('textdown');
                document.getElementById("textinfo").classList.remove('showtext');
            }
        
            setTimeout(function() {
                localStorage.setItem("artist", Artist);
                localStorage.setItem("musicname", MusicName);
                localStorage.setItem("musicimage", MusicImage);

                Fill(Artist, MusicName, MusicImage, Duration, Progress);
            }, 1000);
        });


        document.getElementById('togglePlay').onclick = function() {
        player.togglePlay();
        };

        document.getElementById('prev').onclick = function() {
            player.previousTrack();
        };

        document.getElementById('next').onclick = function() {
            player.nextTrack();
        };

        player.connect();
    }