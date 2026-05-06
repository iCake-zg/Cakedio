const { search, song_url, playlist_track_all } = require('NeteaseCloudMusicApi');

/**
 * 根据歌曲名称和歌手搜索网易云音乐，并获取播放链接
 * @param {string} keyword - 搜索关键字 (例如 "River Flows in You - Yiruma")
 * @returns {Promise<Object|null>} 返回歌曲信息和播放链接
 */
async function searchAndGetSong(keyword) {
    try {
        console.log(`[Music] 正在搜索歌曲: ${keyword}`);
        
        // 1. 搜索歌曲
        const searchResult = await search({
            keywords: keyword,
            limit: 1,
            type: 1 // 1: 单曲
        });
        
        if (searchResult.status !== 200 || !searchResult.body.result.songs || searchResult.body.result.songs.length === 0) {
            console.log(`[Music] 未找到歌曲: ${keyword}`);
            return null;
        }
        
        const song = searchResult.body.result.songs[0];
        const songId = song.id;
        
        // 2. 获取歌曲播放链接
        const urlResult = await song_url({
            id: songId,
            br: 320000 // 码率
        });
        
        if (urlResult.status !== 200 || !urlResult.body.data || urlResult.body.data.length === 0) {
            console.log(`[Music] 无法获取歌曲链接: ${keyword}`);
            return null;
        }
        
        const songUrlInfo = urlResult.body.data[0];
        
        return {
            id: songId,
            name: song.name,
            artist: song.artists ? song.artists.map(a => a.name).join(', ') : '',
            url: songUrlInfo.url,
            duration: song.duration
        };
    } catch (error) {
        console.error(`[Music Error] 搜索或获取歌曲 ${keyword} 失败:`, error.message);
        return null;
    }
}

/**
 * 根据歌单ID获取歌单中的所有歌曲
 * @param {number|string} playlistId - 网易云音乐歌单ID
 * @returns {Promise<Array>} 返回歌曲列表
 */
async function getPlaylistSongs(playlistId) {
    try {
        console.log(`[Music] 正在获取歌单: ${playlistId}`);
        const res = await playlist_track_all({
            id: playlistId,
            limit: 100, // 限制获取100首，防止过多
            offset: 0
        });
        
        if (res.status !== 200 || !res.body.songs) {
            console.log(`[Music] 未能获取歌单数据: ${playlistId}`);
            return [];
        }
        
        return res.body.songs.map(song => ({
            id: song.id,
            name: song.name,
            artist: song.ar ? song.ar.map(a => a.name).join(', ') : '',
            duration: song.dt
        }));
    } catch (error) {
        console.error(`[Music Error] 获取歌单 ${playlistId} 失败:`, error.message);
        return [];
    }
}

/**
 * 根据歌曲ID获取播放链接
 * @param {number|string} songId - 歌曲ID
 * @returns {Promise<string|null>} 返回播放链接
 */
async function getSongUrlById(songId) {
    try {
        const urlResult = await song_url({
            id: songId,
            br: 320000
        });
        
        if (urlResult.status !== 200 || !urlResult.body.data || urlResult.body.data.length === 0) {
            return null;
        }
        
        return urlResult.body.data[0].url;
    } catch (error) {
        console.error(`[Music Error] 获取歌曲链接 ${songId} 失败:`, error.message);
        return null;
    }
}

module.exports = {
    searchAndGetSong,
    getPlaylistSongs,
    getSongUrlById
};
