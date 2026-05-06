const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawn } = require('child_process');

// 启动 Chatterbox TTS Python 服务
const pythonServer = spawn('venv/bin/python', ['-u', path.join(__dirname, 'chatterbox_server.py')], {
    cwd: path.join(__dirname, '../../'),
    env: { 
        ...process.env, 
        HOME: path.join(__dirname, '../../'),
        PKUSEG_HOME: path.join(__dirname, '../../.pkuseg') 
    }
});

pythonServer.stdout.on('data', (data) => {
    console.log(`[Chatterbox Server]: ${data}`);
});

pythonServer.stderr.on('data', (data) => {
    console.error(`[Chatterbox Server Error]: ${data}`);
});

// 优雅退出：当 Node 主进程退出时，杀死 Python 子进程
function cleanup() {
    if (pythonServer && !pythonServer.killed) {
        pythonServer.kill('SIGKILL');
    }
}
process.on('exit', cleanup);
process.on('SIGINT', () => { cleanup(); process.exit(0); });
process.on('SIGTERM', () => { cleanup(); process.exit(0); });

const TTS_DIR = path.join(__dirname, '../../public/tts');

// 确保存放语音文件的目录存在
if (!fs.existsSync(TTS_DIR)) {
    fs.mkdirSync(TTS_DIR, { recursive: true });
}

/**
 * 将文本转换为语音并保存为 WAV 文件 (使用 Chatterbox)
 * @param {string} text 需要朗读的文本
 * @returns {Promise<string|null>} 返回相对于 public 的访问路径，例如 '/tts/xxxx.wav'
 */
async function generateTTS(text) {
    if (!text || text.trim() === '') return null;

    try {
        // 使用文本的 MD5 作为文件名，避免重复生成相同的语音
        const hash = crypto.createHash('md5').update(text).digest('hex');
        const filename = `${hash}.wav`;
        const filepath = path.join(TTS_DIR, filename);
        const urlPath = `/tts/${filename}`;

        // 如果文件已经存在，直接返回缓存的 URL
        if (fs.existsSync(filepath)) {
            console.log(`[TTS] 命中缓存: ${urlPath}`);
            return urlPath;
        }

        console.log(`[TTS] 正在生成语音 (Chatterbox): ${text.substring(0, 15)}...`);
        
        // 带有重试机制的 fetch，等待 Python 服务启动
        let response = null;
        for (let i = 0; i < 10; i++) {
            try {
                response = await fetch('http://127.0.0.1:8081/tts', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        text: text,
                        language_id: 'zh',
                        output_path: filepath
                    })
                });
                break;
            } catch (err) {
                if (i === 9) throw err;
                console.log(`[TTS] 等待 Python 服务启动... (${i+1}/10)`);
                await new Promise(resolve => setTimeout(resolve, 3000));
            }
        }

        const result = await response.json();
        
        if (result.success) {
            return urlPath;
        } else {
            console.error('[TTS Error] 语音生成失败:', result.error);
            return null;
        }
    } catch (error) {
        console.error('[TTS Error] 请求 Python 服务失败:', error);
        return null;
    }
}

module.exports = {
    generateTTS
};
