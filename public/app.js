// DOM 元素
const audioPlayer = document.getElementById('audio-player');
const btnPlay = document.getElementById('btn-play');
const btnStop = document.getElementById('btn-stop');
const playIcon = document.getElementById('play-icon');
const btnPrev = document.getElementById('btn-prev');
const btnNext = document.getElementById('btn-next');
const volumeSlider = document.getElementById('volume-slider');

const trackTitle = document.getElementById('track-title');
const trackStatus = document.getElementById('track-status');
const equalizer = document.getElementById('equalizer');

const progressFill = document.getElementById('progress-fill');
const timeCurrent = document.getElementById('time-current');
const timeTotal = document.getElementById('time-total');
const progressBar = document.querySelector('.progress-bar');

const queueList = document.getElementById('queue-list');
const queueCount = document.getElementById('queue-count');

const djText = document.getElementById('dj-text');
const djStatus = document.getElementById('dj-status');
const audioWave = document.querySelector('.audio-wave');
const userInput = document.getElementById('user-input');
const btnSend = document.getElementById('btn-send');

const btnThemeDark = document.getElementById('btn-theme-dark');
const btnThemeLight = document.getElementById('btn-theme-light');

// 状态变量
let isPlaying = false;
let currentPlaylist = [];
let currentTrackIndex = 0;
let djData = null;
let weatherContext = "未知天气";

// ================= 时钟与日期 =================
function updateClock() {
    const now = new Date();
    document.getElementById('clock-time').textContent = now.toLocaleTimeString('en-US', {hour12: false, hour: '2-digit', minute:'2-digit'});
    
    const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    
    document.getElementById('clock-day').textContent = days[now.getDay()];
    document.getElementById('clock-full-date').textContent = `${now.getDate().toString().padStart(2, '0')} ${months[now.getMonth()]} ${now.getFullYear()}`;
}
setInterval(updateClock, 1000);
updateClock();

// ================= 天气 API =================
async function fetchWeather() {
    const weatherText = document.getElementById('weather-text');
    const weatherIcon = document.getElementById('weather-icon');
    if (!weatherText || !weatherIcon) return;

    let lat = 39.9042;
    let lon = 116.4074;
    
    try {
        if ("geolocation" in navigator) {
            const position = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 3000 });
            });
            lat = position.coords.latitude;
            lon = position.coords.longitude;
        }
    } catch (e) {
        console.log("使用默认坐标");
    }

    try {
        const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
        const data = await response.json();
        
        if (data && data.current_weather) {
            const temp = data.current_weather.temperature;
            const code = data.current_weather.weathercode;
            
            let weatherDesc = "Clear";
            weatherIcon.className = "ph ph-sun";
            
            if (code >= 1 && code <= 3) {
                weatherDesc = "Cloudy";
                weatherIcon.className = "ph ph-cloud";
            } else if (code >= 45 && code <= 48) {
                weatherDesc = "Fog";
                weatherIcon.className = "ph ph-cloud-fog";
            } else if (code >= 51 && code <= 67) {
                weatherDesc = "Rain";
                weatherIcon.className = "ph ph-cloud-rain";
            } else if (code >= 71 && code <= 82) {
                weatherDesc = "Snow";
                weatherIcon.className = "ph ph-snowflake";
            } else if (code >= 95) {
                weatherDesc = "Storm";
                weatherIcon.className = "ph ph-cloud-lightning";
            }

            weatherText.textContent = `${temp}°C`;
            weatherContext = `Current weather: ${temp}℃, ${weatherDesc}.`;
        }
    } catch (e) {
        console.error("获取天气失败", e);
        weatherText.textContent = "ERR";
    }
}
window.addEventListener('DOMContentLoaded', fetchWeather);

// ================= 渲染队列 =================
function renderQueue() {
    queueCount.textContent = `${currentPlaylist.length} TRACKS`;
    
    if (currentPlaylist.length === 0) {
        queueList.innerHTML = '<div class="queue-empty">No tracks in queue</div>';
        return;
    }
    
    queueList.innerHTML = '';
    currentPlaylist.forEach((track, idx) => {
        const item = document.createElement('div');
        item.className = `queue-item ${idx === currentTrackIndex ? 'active' : ''}`;
        
        let indexHtml = idx === currentTrackIndex ? '<i class="ph-fill ph-play"></i>' : (idx + 1);
        
        item.innerHTML = `
            <div class="index">${indexHtml}</div>
            <div class="title">${track.name}</div>
            <div class="artist">${track.artist}</div>
        `;
        queueList.appendChild(item);
    });
}

// ================= API 请求 =================
async function fetchDJSimulate(userPrompt = "现在是下午茶时间，用户需要放松的音乐") {
    djStatus.textContent = 'THINKING';
    djStatus.style.color = 'var(--accent-green)';
    djText.textContent = 'Cakedio is preparing your tracklist...';
    audioWave.classList.add('active');
    
    try {
        const timeNow = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
        const fullContext = `现在是 ${timeNow}。${weatherContext} 用户想说：${userPrompt}。请为我推荐一些合适的音乐。`;

        const response = await fetch('/api/dj/simulate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ context: fullContext })
        });
        
        const res = await response.json();
        if (res.success) {
            djData = res.data.dj;
            currentPlaylist = res.data.playlist;
            startRadioShow();
        } else {
            djText.textContent = 'Signal lost...';
            djStatus.textContent = 'ERROR';
        }
    } catch (err) {
        console.error(err);
        djText.textContent = 'Connection failed.';
        djStatus.textContent = 'OFFLINE';
    } finally {
        audioWave.classList.remove('active');
    }
}

// ================= 核心流程 =================
async function startRadioShow() {
    currentTrackIndex = 0;
    renderQueue();
    
    // 1. DJ 开场白
    djStatus.textContent = 'SPEAKING';
    djText.textContent = djData.say;
    await playDJVoice(djData.sayAudio, djData.say);
    
    // 2. 播放第一首歌
    playTrack(currentTrackIndex);
}

async function playNext() {
    if (currentTrackIndex < currentPlaylist.length - 1) {
        if (djData.segue) {
            pauseAudio();
            djStatus.textContent = 'SPEAKING';
            djText.textContent = djData.segue;
            await playDJVoice(djData.segueAudio, djData.segue);
        }
        currentTrackIndex++;
        renderQueue();
        playTrack(currentTrackIndex);
    } else {
        stopRadio();
    }
}

function playPrev() {
    if (currentTrackIndex > 0) {
        currentTrackIndex--;
        renderQueue();
        playTrack(currentTrackIndex);
    }
}

function stopRadio() {
    pauseAudio();
    audioPlayer.currentTime = 0;
    djStatus.textContent = 'IDLE';
    djText.textContent = 'Broadcast finished. What is next on your mind?';
    trackTitle.textContent = 'Waiting for signal...';
    trackStatus.textContent = 'STOPPED';
}

// ================= 音频与语音控制 =================
function playDJVoice(audioUrl, fallbackText) {
    return new Promise((resolve) => {
        if (!audioUrl) {
            resolve();
            return;
        }

        audioWave.classList.add('active');
        const djAudio = new Audio(audioUrl);
        djAudio.play().catch(e => {
            console.error("播放 DJ 语音失败:", e);
            audioWave.classList.remove('active');
            resolve();
        });

        djAudio.onended = () => {
            audioWave.classList.remove('active');
            djStatus.textContent = 'IDLE';
            resolve();
        };
        
        djAudio.onerror = () => {
            audioWave.classList.remove('active');
            djStatus.textContent = 'IDLE';
            resolve();
        };
    });
}

function playTrack(index) {
    if (!currentPlaylist[index]) return;
    
    const track = currentPlaylist[index];
    audioPlayer.src = track.url;
    
    trackTitle.textContent = `${track.name} - ${track.artist}`;
    trackStatus.textContent = 'PLAYING';
    
    djStatus.textContent = 'PLAYING';
    djText.textContent = track.background || "Spinning a classic track for you.";
    
    playAudio();
}

function playAudio() {
    audioPlayer.play();
    isPlaying = true;
    updatePlayBtnUI();
}

function pauseAudio() {
    audioPlayer.pause();
    isPlaying = false;
    updatePlayBtnUI();
}

function updatePlayBtnUI() {
    if (isPlaying) {
        playIcon.classList.remove('ph-play');
        playIcon.classList.add('ph-pause');
        equalizer.classList.add('active');
    } else {
        playIcon.classList.remove('ph-pause');
        playIcon.classList.add('ph-play');
        equalizer.classList.remove('active');
        trackStatus.textContent = currentPlaylist.length > 0 ? 'PAUSED' : 'STOPPED';
    }
}

// ================= 事件监听 =================
btnPlay.addEventListener('click', () => {
    if (currentPlaylist.length === 0) {
        fetchDJSimulate();
        return;
    }
    isPlaying ? pauseAudio() : playAudio();
});

btnStop.addEventListener('click', stopRadio);
btnNext.addEventListener('click', playNext);
btnPrev.addEventListener('click', playPrev);

// 主题切换逻辑
btnThemeDark.addEventListener('click', () => {
    document.body.classList.remove('light-theme');
    btnThemeDark.classList.add('active');
    btnThemeLight.classList.remove('active');
});

btnThemeLight.addEventListener('click', () => {
    document.body.classList.add('light-theme');
    btnThemeLight.classList.add('active');
    btnThemeDark.classList.remove('active');
});

volumeSlider.addEventListener('input', (e) => {
    audioPlayer.volume = e.target.value;
});

// 进度条点击跳转
progressBar.addEventListener('click', (e) => {
    if (audioPlayer.duration) {
        const rect = progressBar.getBoundingClientRect();
        const pos = (e.clientX - rect.left) / rect.width;
        audioPlayer.currentTime = pos * audioPlayer.duration;
    }
});

audioPlayer.addEventListener('timeupdate', () => {
    const current = audioPlayer.currentTime;
    const duration = audioPlayer.duration;
    
    if (duration) {
        const percent = (current / duration) * 100;
        progressFill.style.width = `${percent}%`;
        timeCurrent.textContent = formatTime(current);
        timeTotal.textContent = formatTime(duration);
    }
});

audioPlayer.addEventListener('ended', playNext);

function formatTime(seconds) {
    if (isNaN(seconds)) return "0:00";
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
}

// 聊天输入逻辑
userInput.addEventListener('input', () => {
    if (userInput.value.trim().length > 0) {
        btnSend.classList.add('ready');
    } else {
        btnSend.classList.remove('ready');
    }
});

userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && userInput.value.trim() !== '') {
        submitPrompt();
    }
});

btnSend.addEventListener('click', () => {
    if (userInput.value.trim() !== '') {
        submitPrompt();
    }
});

function submitPrompt() {
    const prompt = userInput.value.trim();
    userInput.value = '';
    btnSend.classList.remove('ready');
    fetchDJSimulate(prompt);
}