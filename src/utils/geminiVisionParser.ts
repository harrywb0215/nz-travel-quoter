import type { ItineraryItem } from '../types/itinerary';

// 将文件转换为 Base64 (不包含 data:image/xxx;base64, 前缀)
async function fileToBase64(file: File): Promise<{ base64Data: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const match = result.match(/^data:(image\/[a-zA-Z0-9.+_-]+);base64,(.+)$/);
      if (match) {
        resolve({ mimeType: match[1], base64Data: match[2] });
      } else {
        const commaIdx = result.indexOf(',');
        resolve({
          mimeType: file.type || 'image/jpeg',
          base64Data: commaIdx >= 0 ? result.slice(commaIdx + 1) : result,
        });
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}

/**
 * 测试 Gemini API Key 是否有效
 */
export async function testGeminiApiKey(apiKey: string, modelName = 'gemini-1.5-flash'): Promise<{ success: boolean; message: string }> {
  if (!apiKey || !apiKey.trim()) {
    return { success: false, message: '请输入 Gemini API Key' };
  }

  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey.trim()}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: 'Hello, respond with {"status":"ok"}' }],
          },
        ],
      }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      return {
        success: false,
        message: errData?.error?.message || `请求失败，HTTP 状态码: ${res.status}`,
      };
    }

    return { success: true, message: '连接成功！Gemini 视觉大模型已就绪。' };
  } catch (err: any) {
    return { success: false, message: `网络连接异常：${err.message || '无法访问 Google API 服务'}` };
  }
}

/**
 * 使用 Gemini 视觉模型解析中英文行程单图片（专精楷体、多列表格、路线与活动精准分列）
 */
export async function parseItineraryWithGeminiVision(
  imageFile: File,
  apiKey: string,
  modelName = 'gemini-1.5-flash'
): Promise<ItineraryItem[]> {
  if (!apiKey || !apiKey.trim()) {
    throw new Error('未配置 Gemini API Key，无法使用视觉识别');
  }

  const { base64Data, mimeType } = await fileToBase64(imageFile);

  const prompt = `你是一个专业的新西兰定制游行程报价单结构化数据提取专家。
请仔细分析这张行程单表格图片（可能包含中文字体如华文楷体、黑体、多列表格排版）。

请严格按照原图表格的每一行，提取出完整的每日行程明细。
必须严格输出标准的 JSON 数组格式，不要包含任何 markdown 解释或 \`\`\`json 标记代码块，只输出原始 JSON：

JSON 数组对象结构要求如下：
[
  {
    "day": "Day 1",
    "date": "12月18日",
    "route": "皇后镇接机 1215 + 游览",
    "activity": "",
    "noCar": false
  },
  {
    "day": "Day 2",
    "date": "12月19日",
    "route": "皇后镇",
    "activity": "TSS + 晚餐",
    "noCar": false
  }
]

特别注意解析规则：
1. "day": 天数序号，统一规范化为 "Day 1", "Day 2", "Day 3" 等。
2. "date": 表格中的日期列，保留原貌，如 "12月18日", "1月1日"。
3. "route": 行程路线列（通常为第 3 列），提取包含城市、转移、送机/接机等路线。
4. "activity": 活动/球场列（通常为第 4 列），如 "TSS + 晚餐", "天空缆车", "塔斯曼冰河探险", "米尔布鲁克", "霍比特村游览" 等。如果当天该列为空，请填空字符串 ""，绝不能把活动合并到 route 中！
5. "noCar": 当行程或活动包含“不用车”、“自驾”、“自由活动（不用车）”等明确字眼时设为 true，否则为 false。
6. 严格识别出所有天数，从第一天到最后一天，不要遗漏任何一行！`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey.trim()}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inline_data: {
                  mime_type: mimeType,
                  data: base64Data,
                },
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 4096,
        },
      }),
    }
  );

  if (!response.ok) {
    const errorJson = await response.json().catch(() => ({}));
    throw new Error(errorJson?.error?.message || `Gemini API 调用异常，状态码 ${response.status}`);
  }

  const result = await response.json();
  const textContent = result?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!textContent) {
    throw new Error('Gemini API 未返回有效文字内容');
  }

  // 清洗可能存在的 markdown 代码块包裹
  let cleanJson = textContent.trim();
  if (cleanJson.startsWith('```')) {
    cleanJson = cleanJson.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '');
  }

  try {
    const parsed = JSON.parse(cleanJson);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      throw new Error('AI 未能从图片中识别到行程列表数组');
    }

    return parsed.map((item: any, idx: number) => ({
      id: `ai-item-${Date.now()}-${idx + 1}`,
      day: item.day || `Day ${idx + 1}`,
      date: item.date || `${idx + 1}日`,
      route: item.route || '待定行程',
      activity: item.activity || '',
      noCar: Boolean(item.noCar),
    }));
  } catch (err: any) {
    console.error('Gemini 返回内容 JSON 解析失败:', textContent);
    throw new Error(`解析 AI 返回数据失败：${err.message}`);
  }
}
