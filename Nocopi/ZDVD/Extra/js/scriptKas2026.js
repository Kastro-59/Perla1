const RADIO_NAME = 'Radio Fola';

// Change Stream URL Here, Supports, ICECAST, ZENO, SHOUTCAST, RADIOJAR and any other stream service.
const URL_STREAMING = 'https://stream-172.zeno.fm/emertvc73mruv?zt=eyJhbGciOiJIUzI1NiJ9';

// You can find the mount point in the Broadcast Settings.
// To generate the Zeno Radio API link from the mount point,
// exclude the '/source' part and append the remaining mount point to the base URL of the API.
// For example, if the mount point is 'yn65fsaurfhvv/source',
// the API link will be 'https://api.zeno.fm/mounts/metadata/subscribe/yn65fsaurfhvv'.

const url = 'https://api.zeno.fm/mounts/metadata/subscribe/emertvc73mruv';

// Visit https://api.vagalume.com.br/docs/ to get your API key
const API_KEY = "18fe07917957c289983464588aabddfb";

// Variable to control history display: true = display / false = hides
let showHistory = true; 

window.onload = function () {
    var page = new Page;
    page.changeTitlePage();
    page.setVolume();

    var player = new Player();
    player.play();

    getStreamingData();
    // Interval to get streaming data in miliseconds
    setInterval(function () {
        getStreamingData();
    }, 10000);

    var coverArt = document.getElementsByClassName('cover-album')[0];

    coverArt.style.height = coverArt.offsetWidth + 'px';

    localStorage.removeItem('musicHistory');
}

// DOM control
class Page {
    constructor() {
        this.changeTitlePage = function (title = RADIO_NAME) {
            document.title = title;
        };

        this.refreshCurrentSong = function (song, artist) {
            var currentSong = document.getElementById('currentSong');
            var currentArtist = document.getElementById('currentArtist');

            if (song !== currentSong.innerHTML) {
                // Animate transition
                currentSong.className = 'text-uppercase';
                currentSong.innerHTML = song;

                currentArtist.className = 'text-capitalize';
                currentArtist.innerHTML = artist;

                // Refresh modal title
                document.getElementById('lyricsSong').innerHTML = song + ' - ' + artist;

                // Remove animation classes
                setTimeout(function () {
                    currentSong.className = 'text-uppercase';
                    currentArtist.className = 'text-capitalize';
                }, 2000);
            }
        };

        // Função para atualizar a capa
        this.refreshCover = function (song = '', artist) {
            // Default cover art
            var urlCoverArt = 'img/cover.png';

            // Criação da tag de script para fazer a requisição JSONP à API do Deezer
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

// Variável global para armazenar as músicas
var audio = new Audio(URL_STREAMING);




// Função para lidar com a conexão de eventos
function connectToEventSource(url) {
    // Criar uma nova instância de EventSource com a URL fornecida
    const eventSource = new EventSource(url);

    // Adicionar um ouvinte para o evento 'message'
    eventSource.addEventListener('message', function(event) {
        // Chamar a função para tratar os dados recebidos, passando a URL também
        processData(event.data, url);
    });

    // Adicionar um ouvinte para o evento 'error'
    eventSource.addEventListener('error', function(event) {
        console.error('Erro na conexão de eventos:', event);
        // Tentar reconectar após um intervalo de tempo
        setTimeout(function() {
            connectToEventSource(url);
        }, 1000);
    });
}

// Função para tratar os dados recebidos
function processData(data) {
    // Parse JSON
    const parsedData = JSON.parse(data);
    
    // Verificar se a mensagem é sobre a música
    if (parsedData.streamTitle) {
        // Extrair o título da música e o artista
        let artist, song;
        const streamTitle = parsedData.streamTitle;

        if (streamTitle.includes('-')) {
            [artist, song] = streamTitle.split(' - ');
        } else {
            // Se não houver "-" na string, consideramos que o título é apenas o nome da música
            artist = '';
            song = streamTitle;
        }

        // Criar o objeto com os dados formatados
        const formattedData = {
            currentSong: song.trim(),
            currentArtist: artist.trim()
        };

        // Converter o objeto em JSON
        const jsonData = JSON.stringify(formattedData);

        // Chamar a função getStreamingData com os dados formatados e a URL
        getStreamingData(jsonData);
    } else {
        console.log('Mensagem recebida:', parsedData);
    }
}

// Iniciar a conexão com a API
connectToEventSource(url);

// Define a função de manipulação da resposta da API do Deezer no escopo global
function handleDeezerResponse(data, song) {
    var coverArt = document.getElementById('currentCoverArt');
    var coverBackground = document.getElementById('bgCover');

    if (data.data && data.data.length > 0) {
        // Buscar o Cover pelo nome do Artista
        // var artworkUrl = data.data[0].artist.picture_big;
        // Buscar o Cover pelo nome da música
        var artworkUrl = data.data[0].album.cover_big;

        coverArt.style.backgroundImage = 'url(' + artworkUrl + ')';
        coverArt.className = 'animated bounceInLeft';

        coverBackground.style.backgroundImage = 'url(' + artworkUrl + ')';
    } else {
        // Caso não haja dados ou a lista de dados esteja vazia,
        // defina a capa padrão
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
    // Parse JSON
    var jsonData = JSON.parse(data);

    var page = new Page();

    // Formatar caracteres para UTF-8
    let song = jsonData.currentSong.replace(/&apos;/g, '\'').replace(/&amp;/g, '&');
    let artist = jsonData.currentArtist.replace(/&apos;/g, '\'').replace(/&amp;/g, '&');

    // Mudar o título
    document.title = song + ' - ' + artist + ' | ' + RADIO_NAME;

    page.refreshCover(song, artist);
    page.refreshCurrentSong(song, artist);
    page.refreshLyric(song, artist);

    if (showHistory) {

        // Verificar se a música é diferente da última atualizada
        if (musicHistory.length === 0 || (musicHistory[0].song !== song)) {
            // Atualizar o histórico com a nova música
            updateMusicHistory(artist, song);
        }

        // Atualizar a interface do histórico
        updateHistoryUI();

    }
}

function updateHistoryUI() {
    let historicElement = document.querySelector('.historic');
    if (showHistory) {
      historicElement.classList.remove('hidden'); // Show history
    } else {
      historicElement.classList.add('hidden'); // Hide history
    }
}

// Variável global para armazenar o histórico das duas últimas músicas
var musicHistory = [];

// Função para atualizar o histórico das duas últimas músicas
function updateMusicHistory(artist, song) {
    // Adicionar a nova música no início do histórico
    musicHistory.unshift({ artist: artist, song: song });

    // Manter apenas as duas últimas músicas no histórico
    if (musicHistory.length > 4) {
        musicHistory.pop(); // Remove a música mais antiga do histórico
    }

    // Chamar a função para exibir o histórico atualizado
    displayHistory();
}


function displayHistory() {
    var $historicDiv = document.querySelectorAll('#historicSong article');
    var $songName = document.querySelectorAll('#historicSong article .music-info .song');
    var $artistName = document.querySelectorAll('#historicSong article .music-info .artist');

    // Exibir as duas últimas músicas no histórico, começando do índice 1 para excluir a música atual
    for (var i = 1; i < musicHistory.length && i < 3; i++) {
        $songName[i - 1].innerHTML = musicHistory[i].song;
        $artistName[i - 1].innerHTML = musicHistory[i].artist;

        // Chamar a função para buscar a capa da música na API do Deezer
        refreshCoverForHistory(musicHistory[i].song, musicHistory[i].artist, i - 1);

        // Adicionar classe para animação
        $historicDiv[i - 1].classList.add('animated');
        $historicDiv[i - 1].classList.add('slideInRight');
    }

    // Remover classes de animação após 2 segundos
    setTimeout(function () {
        for (var j = 0; j < 2; j++) {
            $historicDiv[j].classList.remove('animated');
            $historicDiv[j].classList.remove('slideInRight');
        }
    }, 2000);
}

// Função para atualizar a capa da música no histórico
function refreshCoverForHistory(song, artist, index) {
    // Criação da tag de script para fazer a requisição JSONP à API do Deezer
    const script = document.createElement('script');
    script.src = `https://api.deezer.com/search?q=${encodeURIComponent(artist)} ${encodeURIComponent(song)}&output=jsonp&callback=handleDeezerResponseForHistory_${index}`;
    document.body.appendChild(script);

    // Função de manipulação da resposta da API do Deezer para o histórico de músicas
    window['handleDeezerResponseForHistory_' + index] = function (data) {
        if (data.data && data.data.length > 0) {
            // Atualizar a capa pelo nome do artista
            // var artworkUrl = data.data[0].artist.picture_big;
            // Atualizar a capa pelo nome da música
            var artworkUrl = data.data[0].album.cover_big;
            // Atualizar a capa da música no histórico usando o índice correto
            var $coverArt = document.querySelectorAll('#historicSong article .cover-historic')[index];
            $coverArt.style.backgroundImage = 'url(' + artworkUrl + ')';
        }
    };
}

