const RADIO_NAME = '♫ ZonaLocaRadio ♪';
const URL_STREAMING = 'https://stream.zeno.fm/m61y2bgtvmzuv';
const url = 'https://api.zeno.fm/mounts/metadata/subscribe/m61y2bgtvmzuv';

const API_KEY = "18fe07917957c289983464588aabddfb";
let showHistory = true; 

window.onload = function () {
    var page = new Page;
    page.changeTitlePage();
    page.setVolume();

    var player = new Player();
    player.play();

    getStreamingData();
    setInterval(function () {
        getStreamingData();
    }, 10000);

    var coverArt = document.getElementsByClassName('cover-album')[0];

    coverArt.style.height = coverArt.offsetWidth + 'px';

    localStorage.removeItem('musicHistory');
}

class Page {
    constructor() {
        this.changeTitlePage = function (title = RADIO_NAME) {
            document.title = title;
        };

        this.refreshCurrentSong = function (song, artist) {
            var currentSong = document.getElementById('currentSong');
            var currentArtist = document.getElementById('currentArtist');

            if (song !== currentSong.innerHTML) {
                currentSong.className = 'text-uppercase';
                currentSong.innerHTML = song;

                currentArtist.className = 'text-capitalize';
                currentArtist.innerHTML = artist;

                document.getElementById('lyricsSong').innerHTML = song + ' - ' + artist;

                setTimeout(function () {
                    currentSong.className = 'text-uppercase';
                    currentArtist.className = 'text-capitalize';
                }, 2000);
            }
        };

        this.refreshCover = function (song = '', artist) {
            var urlCoverArt = 'img/cover.png';

            const script = document.createElement('script');
            script.src = `https://api.deezer.com/search?q=${artist} ${song}&output=jsonp&callback=handleDeezerResponse`;
            document.body.appendChild(script);
        };




        this.refreshLyric = function (currentSong, currentArtist) {
            var xhttp = new XMLHttpRequest();
            xhttp.onreadystatechange = function () {
                if (this.readyState === 4 && this.status === 200) {
                    var data = JSON.parse(this.responseText);

                    var openLyric = document.getElementsByClassName('lyrics')[0];

                    if (data.type === 'exact' || data.type === 'aprox') {
                        var lyric = data.mus[0].text;

                        document.getElementById('lyric').innerHTML = lyric.replace(/\n/g, '<br />');
                        openLyric.style.opacity = "1";
                        openLyric.setAttribute('data-toggle', 'modal');
                    } else {
                        openLyric.style.opacity = "0.3";
                        openLyric.removeAttribute('data-toggle');

                        var modalLyric = document.getElementById('modalLyrics');
                        modalLyric.style.display = "none";
                        modalLyric.setAttribute('aria-hidden', 'true');
                        (document.getElementsByClassName('modal-backdrop')[0]) ? document.getElementsByClassName('modal-backdrop')[0].remove() : '';
                    }
                } else {
                    document.getElementsByClassName('lyrics')[0].style.opacity = "0.3";
                    document.getElementsByClassName('lyrics')[0].removeAttribute('data-toggle');
                }
            };
            xhttp.open('GET', 'https://api.vagalume.com.br/search.php?apikey=' + API_KEY + '&art=' + currentArtist + '&mus=' + currentSong.toLowerCase(), true);
            xhttp.send();
        };
    }
}

var audio = new Audio(URL_STREAMING);


function connectToEventSource(url) {
    const eventSource = new EventSource(url);

    eventSource.addEventListener('message', function(event) {
        processData(event.data, url);
    });

    eventSource.addEventListener('error', function(event) {
        console.error('Erro na conexão de eventos:', event);
        setTimeout(function() {
            connectToEventSource(url);
        }, 1000);
    });
}

function processData(data) {
    // Parse JSON
    const parsedData = JSON.parse(data);
    
    if (parsedData.streamTitle) {
        let artist, song;
        const streamTitle = parsedData.streamTitle;

        if (streamTitle.includes('-')) {
            [artist, song] = streamTitle.split(' - ');
        } else {
            artist = '';
            song = streamTitle;
        }

        const formattedData = {
            currentSong: song.trim(),
            currentArtist: artist.trim()
        };

        const jsonData = JSON.stringify(formattedData);

        getStreamingData(jsonData);
    } else {
        console.log('Mensagem recebida:', parsedData);
    }
}

connectToEventSource(url);

function handleDeezerResponse(data, song) {
    var coverArt = document.getElementById('currentCoverArt');
    var coverBackground = document.getElementById('bgCover');

    if (data.data && data.data.length > 0) {
        var artworkUrl = data.data[0].album.cover_big;

        coverArt.style.backgroundImage = 'url(' + artworkUrl + ')';
        coverArt.className = 'animated bounceInLeft';

        coverBackground.style.backgroundImage = 'url(' + artworkUrl + ')';
    } else {
        var defaultArtworkUrl = 'img/cover.png';

        coverArt.style.backgroundImage = 'url(' + defaultArtworkUrl + ')';
        coverBackground.style.backgroundImage = 'url(' + defaultArtworkUrl + ')';
    }

    setTimeout(function () {
        coverArt.className = '';
    }, 2000);

    if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
            title: song,
            artist: data.data[0].artist.name,
            artwork: [{
                    src: artworkUrl || defaultArtworkUrl,
                    sizes: '96x96',
                    type: 'image/png'
                },
                {
                    src: artworkUrl || defaultArtworkUrl,
                    sizes: '128x128',
                    type: 'image/png'
                },
                {
                    src: artworkUrl || defaultArtworkUrl,
                    sizes: '192x192',
                    type: 'image/png'
                },
                {
                    src: artworkUrl || defaultArtworkUrl,
                    sizes: '256x256',
                    type: 'image/png'
                },
                {
                    src: artworkUrl || defaultArtworkUrl,
                    sizes: '384x384',
                    type: 'image/png'
                },
                {
                    src: artworkUrl || defaultArtworkUrl,
                    sizes: '512x512',
                    type: 'image/png'
                }
            ]
        });
    }
}

function getStreamingData(data) {

    console.log("Conteúdo dos dados recebidos:", data);
    var jsonData = JSON.parse(data);

    var page = new Page();

    let song = jsonData.currentSong.replace(/&apos;/g, '\'').replace(/&amp;/g, '&');
    let artist = jsonData.currentArtist.replace(/&apos;/g, '\'').replace(/&amp;/g, '&');

    document.title = song + ' - ' + artist + ' | ' + RADIO_NAME;

    page.refreshCover(song, artist);
    page.refreshCurrentSong(song, artist);
    page.refreshLyric(song, artist);

    if (showHistory) {

        if (musicHistory.length === 0 || (musicHistory[0].song !== song)) {
            updateMusicHistory(artist, song);
        }

        updateHistoryUI();

    }
}

function updateHistoryUI() {
    let historicElement = document.querySelector('.historic');
    if (showHistory) {
      historicElement.classList.remove('hidden'); 
    } else {
      historicElement.classList.add('hidden'); 
    }
}

var musicHistory = [];

function updateMusicHistory(artist, song) {
    musicHistory.unshift({ artist: artist, song: song });

    if (musicHistory.length > 4) {
        musicHistory.pop(); 
    }

    displayHistory();
}


function displayHistory() {
    var $historicDiv = document.querySelectorAll('#historicSong article');
    var $songName = document.querySelectorAll('#historicSong article .music-info .song');
    var $artistName = document.querySelectorAll('#historicSong article .music-info .artist');

    for (var i = 1; i < musicHistory.length && i < 3; i++) {
        $songName[i - 1].innerHTML = musicHistory[i].song;
        $artistName[i - 1].innerHTML = musicHistory[i].artist;

        refreshCoverForHistory(musicHistory[i].song, musicHistory[i].artist, i - 1);

        $historicDiv[i - 1].classList.add('animated');
        $historicDiv[i - 1].classList.add('slideInRight');
    }

    setTimeout(function () {
        for (var j = 0; j < 2; j++) {
            $historicDiv[j].classList.remove('animated');
            $historicDiv[j].classList.remove('slideInRight');
        }
    }, 2000);
}

function refreshCoverForHistory(song, artist, index) {
    const script = document.createElement('script');
    script.src = `https://api.deezer.com/search?q=${encodeURIComponent(artist)} ${encodeURIComponent(song)}&output=jsonp&callback=handleDeezerResponseForHistory_${index}`;
    document.body.appendChild(script);

    window['handleDeezerResponseForHistory_' + index] = function (data) {
        if (data.data && data.data.length > 0) {
            var artworkUrl = data.data[0].album.cover_big;
            var $coverArt = document.querySelectorAll('#historicSong article .cover-historic')[index];
            $coverArt.style.backgroundImage = 'url(' + artworkUrl + ')';
        }
    };
}

(function($) {
        $(document).ready(function() {
            var playButton = $('.ppBtn'),
                album = $('.album-cover');
            playButton.on('click', function() {
                $('.player').toggleClass('is-playing');
            });
        });
    })(jQuery);
 (function ($) {
    "use strict";
    $.fn.icast = function (options) {
        var settings = $.extend({
            // Default Settings
            URL: "",
            version: "2",
            stream_id: 1,
            mount_point: "https://api.zeno.fm/mounts/metadata/subscribe/m61y2bgtvmzuv", //For Icecast server
            type: "/;type=mp3",
            streampath: "/stream?icy=http",
            cors: "",
            logo: "img/logo.png",
            servertitle: "My Radio Title", //For Shoutcast v2 server
            show_listeners: true,    
            src: "",
            volume: 0.5,            
            autoplay: false
        }, options);
        var thisObj;
        thisObj = this;
        var audio;
        var ppBtn = $(".ppBtn", thisObj);       
        var cVolumeSlider = $(".volume-slider", thisObj);
        var cVolumeIcon = $(".icons-volume", thisObj);
        var cVolumeIconM = $(".icons-volumeM", thisObj);
        audio = new Audio();
        audio.volume = settings.volume;
        audio.preload = "auto";
        
        thisObj.each(function () {
            if(settings.autoplay == true){
                audio.autoplay = true;
            }
            
            if(settings.show_listeners == false) {
                $(".listeners", thisObj).addClass("nodisplay");
            }
            
            if(settings.version == 1) {
                audio.src = settings.URL + "/;type=mp3";
                settings.src = audio.src;               
                var dataURL = settings.cors + "/" + settings.URL + "/7.html";
                var hisURL = settings.cors + "/" + settings.URL + "/played.html";
                getSH(dataURL, hisURL);
            }

            else if(settings.version == 2) {
                audio.src = settings.URL + settings.streampath;
                settings.src = audio.src;               
                var dataURL = settings.URL + "/stats?sid="+ settings.stream_id +"&json=1&callback=?";
                var hisURL = settings.URL + "/played?sid="+ settings.stream_id +"&type=json&callback=?";
                getSH(dataURL, hisURL);             
            }

            else if(settings.version == "icecast") {
                audio.src = settings.URL  ;
                settings.src = audio.src;
                var dataURL = settings.mount_point ;
                getIC(dataURL);             
            }
        });
        
        //Play/Pause Handling
        function togglePlying(tog, bool) {
            $(tog).toggleClass("playing", bool);
        }

        function playHandling() {
            if (audio.paused) {
                audio.src = settings.src;
                audio.play();
                var $playing = $('.ppBtn.playing');
                if ($(thisObj).find($playing).length === 0) {
                    $playing.click();
                }
            }
            else {
                audio.pause();
            }
        }
        
        $(audio).on("playing", function () {
            togglePlying(ppBtn, true);
            $(ppBtn).addClass("stop-btn");
            $(ppBtn).removeClass("play-btn");
        });
        $(audio).on("pause", function () {
            togglePlying(ppBtn, false);
            $(ppBtn).removeClass("stop-btn");
            $(ppBtn).addClass("play-btn");
        });     
        $(ppBtn, thisObj).on("click tap", function () {
            playHandling();
        });
        
        //Initial Visual Volume
        var volVal = audio.volume * 100;
        $(cVolumeSlider).val(volVal);
        $(".volValueTxt", thisObj).text(volVal + '%');
        volumeIcon();

        //Volume Icon Handling
        function volumeIcon() {
            if($(cVolumeSlider).val() < 55 && $(cVolumeSlider).val() > 0){
                $(cVolumeIcon).removeClass("icons-volume3 icons-volume1");
                $(cVolumeIcon).addClass("icons-volume2");               
            }
            if($(cVolumeSlider).val() == 0){
                $(cVolumeIcon).removeClass("icons-volume2 icons-volume3");
                $(cVolumeIcon).addClass("icons-volume1");               
            }
            else if($(cVolumeSlider).val() > 55){
                $(cVolumeIcon).removeClass("icons-volume1 icons-volume2");
                $(cVolumeIcon).addClass("icons-volume3");
            }
        }
        
        //Mobile Volume Icon Handling
        $(cVolumeIconM).on("click tap", function () {
            $(cVolumeIconM).toggleClass("icons-volumeM2");
            if ($(cVolumeIconM).hasClass("icons-volumeM2")) {
                audio.volume = 0;
            }
            else {
                audio.volume = settings.volume;
            }
        });
        
        //Volume Slider Handling
        $(".icons-volume", thisObj).on("click", function () {
            $(cVolumeSlider).toggleClass("display");
        });
        $(cVolumeSlider).mouseup(function(){
            $(this).removeClass("display");
        });
        
        if (navigator.appName == 'Microsoft Internet Explorer' ||  !!(navigator.userAgent.match(/Trident/) || navigator.userAgent.match(/rv:11/)) || (typeof $.browser !== "undefined" && $.browser.msie == 1))
            {
            cVolumeSlider.change('input', function(){
                audio.volume = parseInt(this.value, 10)/100;
                var volumeVal = audio.volume * 100;
                var volumeVal = Math.round(volumeVal);
                $(".vol-value", thisObj).text('Volume:' + volumeVal + '%');
                volumeIcon();
            }, false);
        
            }
        
        else {
            cVolumeSlider.on('input',  function () {
                var volumeVal = $(cVolumeSlider).val();
                audio.volume = volumeVal/100;       
                var volumeVal = Math.round(volumeVal);
                $(".volValueTxt", thisObj).text(volumeVal + '%')        
                volumeIcon();
            });         
        }
        
        //Título del formato y artista para la recopilación de la portada del álbum.
        function formatArtist(artist){
            artist = artist.toLowerCase();          
            artist = $.trim(artist);
            if (artist.includes("&")) {
                 artist = artist.substr(0, artist.indexOf(' &'));               
            }
            else if(artist.includes("feat")) {
                artist = artist.substr(0, artist.indexOf(' feat'));
            } else if (artist.includes("ft.")) {
                artist = artist.substr(0, artist.indexOf(' ft.'));
            }

            return artist;
        }
        
        function formatTitle(title){
            title = title.toLowerCase();            
            title = $.trim(title);
            if (title.includes("&")) {
                title = title.replace('&', 'and');              
            }
            else if(title.includes("(")) {
                title = title.substr(0, title.indexOf(' ('));
            } else if (title.includes("ft")) {
                title = title.substr(0, title.indexOf(' ft'));
            }

            return title;
        }
        
        function getSH(url, sHistory) {
            if(settings.version == 1) {
                function foo() {
                    $.ajax ({
                    type: 'GET',
                    dataType: 'html',
                    url: url,
                    success: 
                        function(data) {                        
                            var result = $.parseHTML(data)[1].data;
                            var songtitle  = result.split(",")[6];
                            if (songtitle != getTag()) {
                                updateTag(songtitle);
                                var songtitleSplit = songtitle.split('-');
                                var artist = songtitleSplit[0];
                                var title = songtitleSplit[1];
                                updateArtist(artist);
                                updateTitle(title);
                                updateServerInfo(result);
                                getCover(artist, title);
                                updateHistoryIC(artist, title);
                                FBShare(result);
                                TWShare2(result);                               
                            }
                        }
                    })  
                }
                foo();
                setInterval(foo, 12000); 
            }
            
            else if(settings.version == 2) {
                function foo() {
                    $.ajax ({
                    dataType: 'jsonp',
                    url: url,
                    success: 
                        function(result) {
                            if (result.songtitle != getTag()) {
                                updateTag(result.songtitle);
                                var songtitle = result.songtitle;
                                var songtitleSplit = songtitle.split('-');
                                var artist = songtitleSplit[0];
                                var title = songtitleSplit[1];
                                var servertitle = result.servertitle;
                                updateArtist(artist);
                                updateTitle(title);
                                updateServerInfo(result);
                                updateHistory(sHistory); 
                                getCover(artist, title);
                                FBShare(result);
                                TWShare(result);                                
                            }
                        }
                    })  
                }
                    foo();
                    setInterval(foo, 12000); 
            }       
        }
        
         //Update Track Info    
        function getTag() {
            return $(thisObj).attr("data-tag");
        }
        
        function updateArtist(name) {
            $(".artist-name", thisObj).text(name);
        }
        
        function updateTitle(name) {
            $(".songtitle", thisObj).text(name);
        }

        function updateTag(data) {
            $(thisObj).attr("data-tag", data);
        }
        
        //Manejo de portadas de álbumes
        function getCover(artist, title) {      
            artist = formatArtist(artist);
            title = formatTitle(title);
            artist = encodeURI(artist);
            title = encodeURI(title);   
            var url = "https://itunes.apple.com/search?term==" + artist + "-" + title + "&media=music&limit=1";
            $.ajax ({
                dataType: 'jsonp',
                url: url,
                success:
                    function(data) {                        
                        if (data.results.length == 1){                          
                            cover = data.results[0].artworkUrl100;
                            cover = cover.replace('100x100', '400x400');
                        }
                        else {
                            var cover = settings.logo;
                        }
                        $(".album-cover", thisObj).css({'background-image': 'url('+ cover +')', 'background-size': '100% 100%'});
                        $(".album-cover1", thisObj).css({'background-image': 'url('+ cover +')', 'background-size': '100% 100%'});
                        $(".album-cover", thisObj).addClass("bounceInDown");
                        setTimeout( function(){ 
                           $(".album-cover", thisObj).removeClass("bounceInDown");
                        }, 5000 );
                        $(".blur", thisObj).css({'background': '('+ cover +')', 'background-size': '100% 100%'});
                    },              
                error: 
                    function() {
                        console.log("Error on track title " + encodeURI(title));
                    }
            })
        }
        
        //Update Server Info
        function updateServerInfo(result) {
            if(settings.version == 1) {
                $(".servertitle", thisObj).text(settings.servertitle);
                $(".listeners", thisObj).text(result.split(",")[0]);
            }
            
            else if(settings.version == 2) {
                $(".servertitle", thisObj).text(result.servertitle);
                $(".listeners", thisObj).text(result.currentlisteners);
            }
        }
        
        //Update Song History
        function updateHistory(url) {
            $(".history ul li", thisObj).remove();          
            if(settings.version == 1){
                //Do nothing
            }
            
            else if(settings.version == 2){
                $(".row-serv", thisObj).remove();
                $.ajax ({
                dataType: 'jsonp',
                url: url,
                success: 
                    function(data) {
                        data.length = 6;
                        for (var i = 1; i < data.length; i++) {
                            var rowNum = i;
                            var listVal = rowNum;
                            var songtitle = data[i].title;
                            var songtitleSplit = songtitle.split('-');
                            var artist = songtitleSplit[0];
                            var title = songtitleSplit[1];
                            $(".history-serv", thisObj).append(
                                "<div class='row-serv'><div class='history-cover' id='row" + rowNum +"'></div><div class='history-track-info'><div class='history-songtitle'>" + title + "</div><div class='history-artist-name'>"+ artist + "</div></div><div class='rowNum'>"+ listVal + "</div></div>"
                            );
                            
                            getImageList(artist, title, rowNum);
                        }
                        
                    }
                })
            }   
        }
        
        //Get image list for song history
        function getImageList(artist, title, i) {
            artist = formatArtist(artist);
            title = formatTitle(title);
            artist = encodeURI(artist);
            title = encodeURI(title);   
            var url = "https://itunes.apple.com/search?term==" + artist + "-" + title + "&media=music&limit=1";
            $.ajax ({
                dataType: 'jsonp',
                url: url,
                success:
                    function(data) {
                        if (data.results.length == 1){                          
                            cover = data.results[0].artworkUrl100;
                            cover = cover.replace('100x100', '400x400');
                        }
                        else {
                            var cover = settings.logo;
                        }
                        $('#row'+ i , thisObj).css({"background-image": "url(" + cover + ")", "background-size": "100% 100%"});
                    },
                error: 
                function() { console.log("#getImageList(), Error in loading history image list for "  + decodeURI(artist)) }
            })  
        }
        
        //Icecast
        function getIC(url) {                       
            if(settings.version == "icecast") {
                function foo() {
                    $.ajax ({
                    dataType: 'json',
                    url: url,
                    success: 
                        function(data) {
                            var result = findMPData(data);
                            if (result.title != getTag()) {
                                updateTag(result.title);
                                var songtitle = result.title;
                                var songtitleSplit = songtitle.split('-');
                                var artist = songtitleSplit[0];
                                var title = songtitleSplit[1];
                                updateArtist(artist);
                                updateTitle(title);
                                getCover(artist, title);
                                updateServerInfoIC(result);
                                updateHistoryIC(artist, title);
                                FBShare(result);
                                TWShare3(result);
                            }
                        }
                   })   
                }
                foo();
                setInterval(foo, 12000); 
            }   
        }
        
        var icHis = new Array();
        
        function findMPData(data) {
            if (data.icestats.source.length === undefined){
                return data.icestats.source;
            }
            else{
                for (var i = 0; i < data.icestats.source.length; i++) {
                    var str = data.icestats.source[i].listenurl;

                    if (str.indexOf(settings.mount_point) >= 0) {
                        return data.icestats.source[i];
                    }
                }
            }
        }

        function updateServerInfoIC(data) {            
            $(".servertitle", thisObj).text(data.server_name);
            $(".listeners", thisObj).text(data.listeners);
        }
        
        function updateHistoryIC(artist, title) {
            addToArray(artist, title);
            createHisList();
        }

        function addToArray(artist, title) {
            icHis.unshift({ar: artist, tt: title});
            icHis.length = icHis.length < 6 ? icHis.length : 6;
        }
        
        function createHisList(){
            $(".row-serv", thisObj).remove();
            for(var i = 1; i < icHis.length; i++){
                var rowNum = i;
                var listVal = rowNum;
                var artist = icHis[i].ar;
                var title = icHis[i].tt;
                $(".history-serv", thisObj).append(
                    "<div class='row-serv'><div class='history-cover' id='row" + rowNum +"'></div><div class='history-track-info'><div class='history-songtitle'>" + title + "</div><div class='history-artist-name'>"+ artist + "</div></div><div class='rowNum'>"+ listVal + "</div></div>"
                );
                getImageList(artist, title, rowNum);
            }
        }
        
        //Song history panel handling
        $(".icons-history", thisObj).on("click tap", function () {
            $(".icons-history", thisObj).toggleClass("icons-close");
            if (!$(".player-ctr", thisObj).hasClass("open")) {
                $(".player-ctr", thisObj).fadeOut(400);
                $(".history-serv", thisObj).delay(600).fadeIn(400);
                $(".player-ctr", thisObj).addClass("open");
            }
            else if($(".player-ctr", thisObj).hasClass("open")) {
                $(".player-ctr", thisObj).removeClass("open");
                $(".history-serv", thisObj).fadeOut(400);
                $(".player-ctr", thisObj).delay(600).fadeIn(400);
            }
        });
        
        // Share
        $(".album-cover-serv", thisObj).hover(function () {
            $(".social-share-serv", thisObj).toggleClass("display");
            $(".social-link-twitter", thisObj).toggleClass("bounceIn");
            $(".social-link-facebook", thisObj).toggleClass("bounceIn");
        })
        
        function FBShare(result) {
            var siteURL = window.location.href;
            var url = "https://www.facebook.com/sharer/sharer.php?u=" + encodeURIComponent(siteURL);
            $("#aface", thisObj).attr("href", url);
        }
        
        function TWShare(result) {
            var siteURL = window.location.href;
            var url = "https://twitter.com/home?status=I'm listening to " + result.songtitle + " @ " + siteURL;
            $("#atwitter", thisObj).attr("href", url);
        }
        
        function TWShare2(result) {
            var siteURL = window.location.href;
            var url = "https://twitter.com/home?status=I'm listening to " + result.split(",")[6] + " @ " + siteURL;
            $("#atwitter", thisObj).attr("href", url);
        }
        
        function TWShare3(result) {
            var siteURL = window.location.href;
            var url = "https://twitter.com/home?status=I'm listening to " + result.title + " @ " + siteURL;
            $("#atwitter", thisObj).attr("href", url);
        }
        
        //Mobile Volume Classes
        if( /Android|webOS|iPhone|iPad|iPod|Opera Mini/i.test(navigator.userAgent) ) {
            $(cVolumeIcon).addClass("nodisplay");
            $(cVolumeIconM).addClass("display");
            }
    };

  })(jQuery);
 $("#stream1").icast({
URL: "https://stream.zeno.fm/m61y2bgtvmzuv",
version: "icecast",
})