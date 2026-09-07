import { createWorker } from 'tesseract.js';
import type { ItineraryItem } from '../types/itinerary';

// 新西兰高频定制游专业词汇纠错映射
function fixNewZealandItineraryText(text: string): string {
  let cleaned = text;

  // 序号纠错
  cleaned = cleaned.replace(/\b(?:Dal|Dw|pay|Dat|day)\s*(\d+)/gi, 'Day $1');
  cleaned = cleaned.replace(/Day\s*§/gi, 'Day 8');

  // 地名与景点纠错（针对华文楷体容易混淆的字）
  cleaned = cleaned.replace(/但\s*尼\s*[丁了J]/g, '但尼丁');
  cleaned = cleaned.replace(/库\s*克\s*[山由]/g, '库克山');
  cleaned = cleaned.replace(/蒂\s*阿\s*[瑙脑]/g, '蒂阿瑙');
  cleaned = cleaned.replace(/蒂\s*卡\s*[波坡]/g, '蒂卡波');
  cleaned = cleaned.replace(/阿\s*卡\s*罗\s*阿/g, '阿卡罗阿');
  cleaned = cleaned.replace(/罗\s*托\s*鲁\s*阿/g, '罗托鲁阿');
  cleaned = cleaned.replace(/陶\s*波\s*湖/g, '陶波湖');
  cleaned = cleaned.replace(/格\s*林\s*诺\s*奇/g, '格林诺奇');
  cleaned = cleaned.replace(/霍\s*比\s*特/g, '霍比特');
  cleaned = cleaned.replace(/爱\s*歌\s*顿/g, '爱歌顿');
  cleaned = cleaned.replace(/奥\s*马\s*鲁/g, '奥马鲁');
  cleaned = cleaned.replace(/皇\s*后\s*镇/g, '皇后镇');
  cleaned = cleaned.replace(/基\s*督\s*城/g, '基督城');
  cleaned = cleaned.replace(/奥\s*克\s*兰/g, '奥克兰');

  // 活动纠错
  cleaned = cleaned.replace(/TSS\s*\+\s*晚\s*餐/gi, 'TSS + 晚餐');
  cleaned = cleaned.replace(/天\s*空\s*缆\s*车/g, '天空缆车');
  cleaned = cleaned.replace(/萤\s*火\s*虫\s*洞/g, '萤火虫洞');
  cleaned = cleaned.replace(/塔\s*斯\s*曼\s*冰\s*河\s*探\s*险/g, '塔斯曼冰河探险');
  cleaned = cleaned.replace(/小\s*企\s*鹅\s*迁\s*徙/g, '看小企鹅迁徙');
  cleaned = cleaned.replace(/毛\s*利\s*文\s*化\s*村/g, '毛利文化村');
  cleaned = cleaned.replace(/爱\s*歌\s*顿\s*皇\s*家\s*牧\s*场/g, '爱歌顿皇家牧场');
  cleaned = cleaned.replace(/龙\s*虾\s*船/g, '龙虾船（包船）/ 出海看海豚');

  // 清洗无意义杂乱符号
  cleaned = cleaned.replace(/[“"”‘'#%£$§]+/g, ' ');

  return cleaned;
}

// 文本结构化解析函数（适用于图片 OCR 结果或用户粘贴的文本）
export function parsePlainTextToItinerary(rawText: string): ItineraryItem[] {
  const corrected = fixNewZealandItineraryText(rawText);
  const lines = corrected.split('\n').map((l) => l.trim()).filter(Boolean);
  const items: ItineraryItem[] = [];

  let currentDay = 1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // 过滤表头行
    if (line.includes('日期') && line.includes('行程')) continue;

    // 尝试匹配 Day 序号
    const dayMatch = line.match(/(?:Day\s*(\d+)|D\s*(\d+)|第\s*(\d+)\s*天)/i);
    // 匹配类似 12月18日 / 1月1日 / 12/18 等
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
      dateStr = dateMatch[0].replace(/\s+/g, '');
      remaining = remaining.replace(dateMatch[0], '').trim();
    }

    // 清洗剩余字符串开头的符号
    remaining = remaining.replace(/^[：:\-—,\s]+/, '').trim();

    let route = remaining;
    let activity = '';

    // 检测是否有活动关键词分隔
    const actSplitKeywords = ['活动：', '活动:', '门票：', '项目：', '球场：', 'Activities:', 'Activity:'];
    for (const kw of actSplitKeywords) {
      if (remaining.includes(kw)) {
        const parts = remaining.split(kw);
        route = parts[0].trim();
        activity = parts[1].trim();
        break;
      }
    }

    // 检查常见活动特征并自动分流到 activity
    if (!activity) {
      const knownActivities = [
        'TSS + 晚餐', 'TSS', '米尔布鲁克', '杰克斯角', '天空缆车',
        '萤火虫洞', '看小企鹅迁徙', '小企鹅迁徙', '塔斯曼冰河探险',
        '龙虾船（包船）/ 出海看海豚', '出海看海豚', '霍比特村游览',
        '毛利文化村/陶波湖游览', '爱歌顿皇家牧场', '打球'
      ];
      for (const act of knownActivities) {
        if (route.includes(act)) {
          // 如果路线包含已知活动，将其剥离至 activity
          route = route.replace(act, '').trim().replace(/[-—+]\s*$/, '').trim();
          activity = act;
          break;
        }
      }
    }

    // 检查“不用车”
    const noCar = line.includes('不用车') || line.toLowerCase().includes('no car');

    if (route || activity || dayMatch || dateMatch) {
      // 避免纯英文无意义碎片
      if (route.length > 0 && /^[A-Z0-9\s\-]+$/.test(route) && !route.includes('Day')) {
        // 如果是全大写英文杂音行且无中文，降权或忽略
        if (route.length < 5) continue;
      }

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

// 纯前端 HTML5 Canvas 图像预处理增强（放大 1.8x + 局部对比度提升 + 灰度二值化）
export async function preprocessImageForOCR(imageFile: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(imageFile);

    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(imageFile);
        return;
      }

      const scale = 1.8;
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // 灰度化与对比度增强
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        let gray = 0.299 * r + 0.587 * g + 0.114 * b;

        // 对比度拉伸（将偏暗的笔画加深，将偏亮背景转白）
        if (gray < 160) {
          gray = Math.max(0, gray * 0.7);
        } else {
          gray = Math.min(255, gray * 1.15 + 10);
        }

        data[i] = gray;
        data[i + 1] = gray;
        data[i + 2] = gray;
      }

      ctx.putImageData(imageData, 0, 0);

      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else resolve(imageFile);
      }, 'image/png');
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(imageFile);
    };

    img.src = url;
  });
}

// 图片 OCR 本地离线识别函数（带 Canvas 预处理与词库纠错兜底）
export async function recognizeItineraryFromImage(
  imageFile: File,
  onProgress?: (progress: number, status: string) => void
): Promise<{ text: string; items: ItineraryItem[] }> {
  try {
    onProgress?.(10, '正在进行图像对比度增强与表格去噪预处理...');
    const processedBlob = await preprocessImageForOCR(imageFile);

    onProgress?.(25, '正在初始化本地 OCR 图像识别引擎...');
    const worker = await createWorker('chi_sim+eng', 1, {
      logger: (m) => {
        if (m.status === 'recognizing text') {
          const p = Math.round(30 + (m.progress || 0) * 60);
          onProgress?.(p, `正在进行中英文文字与表格识别 (${Math.round((m.progress || 0) * 100)}%)...`);
        }
      },
    });

    onProgress?.(45, '正在提取行程内容...');
    const ret = await worker.recognize(processedBlob as any);
    await worker.terminate();

    const rawText = ret.data.text;
    onProgress?.(92, '文字提取成功，正在结合新西兰词库结构化拆解...');

    const items = parsePlainTextToItinerary(rawText);
    onProgress?.(100, '本地引擎识别完成！');

    return { text: rawText, items };
  } catch (err: any) {
    console.error('本地 OCR 识别失败:', err);
    throw new Error('本地识别未能完全解析：' + (err.message || ''));
  }
}
