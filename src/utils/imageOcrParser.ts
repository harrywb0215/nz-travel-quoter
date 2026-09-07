import { createWorker } from 'tesseract.js';
import type { ItineraryItem } from '../types/itinerary';

// 文本结构化解析函数（适用于图片 OCR 结果或用户粘贴的文本）
export function parsePlainTextToItinerary(rawText: string): ItineraryItem[] {
  const lines = rawText.split('\n').map((l) => l.trim()).filter(Boolean);
  const items: ItineraryItem[] = [];

  let currentDay = 1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // 尝试匹配类似：
    // Day 1 / D1 / 第1天 / 12月18日 / 12/18 / Day 1 12月18日 皇后镇接机
    const dayMatch = line.match(/(?:Day\s*(\d+)|D\s*(\d+)|第\s*(\d+)\s*天)/i);
    const dateMatch = line.match(/(\d{1,2}\s*月\s*\d{1,2}\s*日|\d{1,2}\/\d{1,2}|\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec))/i);

    let dayStr = `Day ${currentDay}`;
    let dateStr = `${currentDay}日`;
    let remaining = line;

    if (dayMatch) {
      const matchedNum = dayMatch[1] || dayMatch[2] || dayMatch[3];
      dayStr = `Day ${matchedNum}`;
      remaining = remaining.replace(dayMatch[0], '').trim();
    }

    if (dateMatch) {
      dateStr = dateMatch[0];
      remaining = remaining.replace(dateMatch[0], '').trim();
    }

    // 清洗剩余字符串，分隔路线与活动
    // 如果包含冒号、破折号或空格分隔
    remaining = remaining.replace(/^[：:\-—,\s]+/, '').trim();

    let route = remaining;
    let activity = '';

    // 检测是否有活动关键词分隔（如 包含“活动”、“门票”、“游览”、“+”）
    const actSplitKeywords = ['活动：', '活动:', '门票：', '项目：', '球场：', 'Activities:', 'Activity:'];
    for (const kw of actSplitKeywords) {
      if (remaining.includes(kw)) {
        const parts = remaining.split(kw);
        route = parts[0].trim();
        activity = parts[1].trim();
        break;
      }
    }

    // 检查“不用车”
    const noCar = line.includes('不用车') || line.toLowerCase().includes('no car');

    if (route || activity || dayMatch || dateMatch) {
      items.push({
        id: `ocr-item-${Date.now()}-${i}`,
        day: dayStr,
        date: dateStr,
        route: route || '行程路线待确认',
        activity: activity,
        noCar,
      });
      currentDay++;
    }
  }

  return items;
}

// 图片 OCR 识别函数
export async function recognizeItineraryFromImage(
  imageFile: File,
  onProgress?: (progress: number, status: string) => void
): Promise<{ text: string; items: ItineraryItem[] }> {
  try {
    onProgress?.(10, '正在初始化 OCR 图像识别引擎...');
    
    // 初始化 Tesseract Worker
    const worker = await createWorker('chi_sim+eng', 1, {
      logger: (m) => {
        if (m.status === 'recognizing text') {
          const p = Math.round(20 + (m.progress || 0) * 75);
          onProgress?.(p, `正在进行中英文文字识别与分析 (${Math.round((m.progress || 0) * 100)}%)...`);
        } else if (m.status === 'loading tesseract core') {
          onProgress?.(15, '正在加载中英文字库核心组件...');
        }
      },
    });

    onProgress?.(30, '正在识别图片中的中英文行程内容...');
    const ret = await worker.recognize(imageFile);
    await worker.terminate();

    const rawText = ret.data.text;
    onProgress?.(95, '文字提取成功，正在进行结构化行程拆解...');

    const items = parsePlainTextToItinerary(rawText);
    onProgress?.(100, '识别完成！');

    return { text: rawText, items };
  } catch (err: any) {
    console.error('OCR 识别失败，尝试轻量解析:', err);
    throw new Error('图片文字识别失败，请确保图片清晰，或直接复制文字粘贴识别：' + (err.message || ''));
  }
}
