const { generateDJResponse } = require('./src/llm/index');

async function test() {
    console.log("开始测试大模型连通性...");
    try {
        const context = "现在是晚上10点半，用户准备睡觉了，他喜欢轻柔的纯音乐。";
        const result = await generateDJResponse(context);
        console.log("\n✅ 大模型返回成功！JSON解析结果：");
        console.dir(result, { depth: null, colors: true });
    } catch (error) {
        console.error("\n❌ 测试失败：", error);
    }
}

test();
