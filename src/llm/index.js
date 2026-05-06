const { OpenAI } = require('openai');
require('dotenv').config();

// 我们利用 OpenAI SDK 来兼容支持 Kimi, Minimax 等各种第三方大模型
const client = new OpenAI({
    apiKey: process.env.LLM_API_KEY,
    baseURL: process.env.LLM_BASE_URL,
});

/**
 * 组装发送给大模型的 Prompt
 */
function buildSystemPrompt(fixedPlaylistContext = "") {
    let prompt = `你是一个专业的AI音乐电台DJ，名字叫 Cakedio。
你的职责是根据用户的品味、作息和当前环境，为用户推荐音乐，并进行电台播报。
【重要指令】：在进行开场播报(say)和串场(segue)时，请务必先向听众介绍即将播放的歌曲的创作背景或背后的故事，然后再引出音乐。
请务必严格返回 JSON 格式的数据，不要输出任何其他多余的文字解释。

返回的 JSON 格式必须如下：
{
  "say": "DJ播报的语音内容，要像真正的电台DJ一样自然、有情感。注意：必须在这里向听众介绍第一首歌曲的背景故事！",
  "play": [
    {
      "name": "歌曲名称 - 歌手",
      "background": "用1-2句话简述这首歌的创作背景或背后的故事"
    }
  ],
  "reason": "为什么推荐这些歌的理由",
  "segue": "串场词，用于两首歌之间的平滑过渡。注意：必须在这里向听众介绍下一首即将播放歌曲的背景故事！"
}`;

    if (fixedPlaylistContext) {
        prompt += `\n\n【重要要求】\n本次电台节目中，你必须且只能从以下用户指定的歌单中挑选 2 首歌曲进行播报推荐，不要自己凭空捏造歌曲：\n${fixedPlaylistContext}\n返回的 play 数组中必须使用列表中给出的歌曲名称和歌手信息。`;
    }

    return prompt;
}

/**
 * 生成 DJ 播报和音乐推荐列表
 * @param {string} userContext - 用户的当前上下文 (包括时间、天气、近期心情等)
 * @param {string} fixedPlaylistContext - 用户提供的固定歌单上下文 (如果有)
 */
async function generateDJResponse(userContext, fixedPlaylistContext = "") {
    try {
        console.log(`[LLM] 正在请求大模型 (${process.env.LLM_PROVIDER} - ${process.env.LLM_MODEL})...`);
        const response = await client.chat.completions.create({
            model: process.env.LLM_MODEL,
            messages: [
                { role: 'system', content: buildSystemPrompt(fixedPlaylistContext) },
                { role: 'user', content: userContext }
            ],
            // 提示模型必须返回 JSON
            response_format: { type: 'json_object' },
            temperature: 1,
        });

        const content = response.choices[0].message.content;
        return JSON.parse(content);
    } catch (error) {
        console.error("[LLM Error] 调用大模型失败:", error.message);
        throw error;
    }
}

module.exports = {
    generateDJResponse
};
