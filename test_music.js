const { searchAndGetSong } = require('./src/music/index');

async function test() {
    console.log("开始测试音乐API连通性...");
    const song = await searchAndGetSong("橘子海 夏日漱石");
    console.log("\n✅ 音乐API返回成功：");
    console.dir(song, { depth: null, colors: true });
}

test();