const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { generateDJResponse } = require('./llm');
const { searchAndGetSong, getPlaylistSongs, getSongUrlById } = require('./music');
const { generateTTS } = require('./tts');

const app = express();
app.use(cors());
app.use(express.json());

// 静态文件服务，用于提供前端页面
app.use(express.static(path.join(__dirname, '../public')));

const PORT = process.env.PORT || 8080;

// 测试接口：模拟一次 DJ 推理和歌曲搜索
app.post('/api/dj/simulate', async (req, res) => {
    try {
        const { context } = req.body;
        const defaultContext = "现在是早上8点，用户刚起床，外面天气晴朗。他喜欢听轻快的独立音乐或City Pop。";
        
        let fixedPlaylistContext = "";
        let preFetchedSongs = [];
        const playlistId = process.env.NETEASE_PLAYLIST_ID;
        
        if (playlistId) {
            console.log(`[Flow] 发现配置了专属歌单 ID: ${playlistId}，正在获取歌单...`);
            const allSongs = await getPlaylistSongs(playlistId);
            if (allSongs.length > 0) {
                // 随机挑选 10 首歌给大模型作为候选池
                const shuffled = allSongs.sort(() => 0.5 - Math.random());
                preFetchedSongs = shuffled.slice(0, 10);
                fixedPlaylistContext = preFetchedSongs.map((s, i) => `${i + 1}. ${s.name} - ${s.artist}`).join('\n');
                console.log(`[Flow] 候选歌曲池:\n${fixedPlaylistContext}`);
            }
        }

        // 1. 请求大模型获取 DJ 播报和推荐歌单
        const djResponse = await generateDJResponse(context || defaultContext, fixedPlaylistContext);
        
        // 并行处理：获取音乐 URL 和 生成 TTS 语音
        console.log(`[Flow] 开始获取音乐链接与生成 TTS...`);
        
        const musicTasks = (djResponse.play && Array.isArray(djResponse.play)) 
            ? djResponse.play.map(songItem => {
                const songName = typeof songItem === 'string' ? songItem : songItem.name;
                
                // 如果是从我们的歌单里选的，直接使用已知 ID 去获取 URL
                if (preFetchedSongs.length > 0) {
                    // 尝试根据歌名匹配预获取的歌曲
                    const matchedSong = preFetchedSongs.find(s => s.name === songName || songName.includes(s.name) || s.name.includes(songName));
                    if (matchedSong) {
                        return getSongUrlById(matchedSong.id).then(url => {
                            return url ? {
                                id: matchedSong.id,
                                name: matchedSong.name,
                                artist: matchedSong.artist,
                                url: url,
                                duration: matchedSong.duration
                            } : null;
                        });
                    }
                }
                
                // 退化到直接搜索
                return searchAndGetSong(songName);
            })
            : [];
            
        // 2. TTS 生成 DJ 的开场白和串场词
        const ttsSayTask = generateTTS(djResponse.say);
        const ttsSegueTask = generateTTS(djResponse.segue);

        // 3. 等待所有外部资源准备完毕
        const [musicResults, sayUrl, segueUrl] = await Promise.all([
            Promise.all(musicTasks),
            ttsSayTask,
            ttsSegueTask
        ]);

        const playlist = musicResults.map((song, index) => {
            if (song && song.url) {
                const playItem = djResponse.play[index];
                song.background = (playItem && playItem.background) ? playItem.background : "暂无背景故事介绍";
                return song;
            }
            return null;
        }).filter(Boolean);
        
        // 把生成的语音链接附加到响应数据中
        djResponse.sayAudio = sayUrl;
        djResponse.segueAudio = segueUrl;
        
        res.json({
            success: true,
            data: {
                dj: djResponse,
                playlist: playlist
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.listen(PORT, () => {
    console.log(`Cakedio Radio 启动成功！`);
    console.log(`正在监听端口: ${PORT}`);
    console.log(`当前使用的 LLM: ${process.env.LLM_PROVIDER} (${process.env.LLM_MODEL})`);
});
