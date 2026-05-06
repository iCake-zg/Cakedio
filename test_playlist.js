const { playlist_detail, playlist_track_all } = require('NeteaseCloudMusicApi');

async function test() {
    try {
        const res = await playlist_detail({ id: 24381616 }); // A random playlist ID
        console.log("Playlist Detail:", res.body.playlist.tracks.length);
        
        const res2 = await playlist_track_all({ id: 24381616, limit: 1, offset: 0 });
        console.log("Playlist Track All:", JSON.stringify(res2.body.songs[0], null, 2));
    } catch (e) {
        console.error(e);
    }
}
test();