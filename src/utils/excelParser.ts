import * as XLSX from 'xlsx';
import { ItineraryItem } from '../types/itinerary';

export async function parseItineraryExcel(file: File): Promise<ItineraryItem[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        // 读取第一个工作表
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // 转换为二维数组
        const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (!rows || rows.length === 0) {
          throw new Error('未在上传的 Excel 中找到有效数据');
        }

        const items: ItineraryItem[] = [];
        let dayColIdx = -1;
        let dateColIdx = -1;
        let routeColIdx = -1;
        let activityColIdx = -1;
        let headerRowIdx = -1;

        // 寻找表头所在行
        for (let r = 0; r < Math.min(rows.length, 10); r++) {
          const row = rows[r];
          if (!row || !Array.isArray(row)) continue;

          for (let c = 0; c < row.length; c++) {
            const val = String(row[c] || '').trim();
            if (val.includes('日期') || val.includes('时间') || val.includes('Date')) {
              dateColIdx = c;
              headerRowIdx = r;
            }
            if (val.includes('行程') || val.includes('路线') || val.includes('Itinerary') || val.includes('Route')) {
              routeColIdx = c;
              headerRowIdx = r;
            }
            if (val.includes('活动') || val.includes('球场') || val.includes('门票') || val.includes('Activity')) {
              activityColIdx = c;
              headerRowIdx = r;
            }
            if (val.includes('天数') || val.includes('Day')) {
              dayColIdx = c;
            }
          }

          if (dateColIdx !== -1 || routeColIdx !== -1) {
            break;
          }
        }

        // 默认列回退设置
        if (headerRowIdx === -1) {
          headerRowIdx = 0;
          dateColIdx = 0;
          routeColIdx = 1;
          activityColIdx = 2;
        } else {
          if (routeColIdx === -1) routeColIdx = dateColIdx + 1;
          if (activityColIdx === -1) activityColIdx = routeColIdx + 1;
        }

        let dayCounter = 1;
        for (let r = headerRowIdx + 1; r < rows.length; r++) {
          const row = rows[r];
          if (!row || row.length === 0) continue;

          const rawDate = row[dateColIdx] !== undefined ? String(row[dateColIdx]).trim() : '';
          const rawRoute = row[routeColIdx] !== undefined ? String(row[routeColIdx]).trim() : '';
          const rawActivity = activityColIdx !== -1 && row[activityColIdx] !== undefined ? String(row[activityColIdx]).trim() : '';

          // 遇到完全为空的行或非行程统计行跳过
          if (!rawDate && !rawRoute && !rawActivity) continue;
          if (rawRoute.includes('报价') || rawRoute.includes('价格包含') || rawDate.includes('用车')) {
            // 已到达报价区域，停止解析行程
            break;
          }

          // 解析 Day 标记
          let dayLabel = `Day ${dayCounter}`;
          let cleanDate = rawDate;

          // 检查 rawDate 里是否已经包含 "Day 1"
          const dayMatch = rawDate.match(/Day\s*(\d+)/i);
          if (dayMatch) {
            dayLabel = `Day ${dayMatch[1]}`;
            cleanDate = rawDate.replace(/Day\s*\d+/i, '').trim();
          } else if (dayColIdx !== -1 && row[dayColIdx]) {
            dayLabel = String(row[dayColIdx]).trim();
          }

          // 检查是否标记“不用车”
          const noCar = rawActivity.includes('不用车') || rawRoute.includes('不用车');
          const isFreeDay = rawRoute.includes('自由活动') || rawActivity.includes('自由活动');

          items.push({
            id: `imported-${r}-${Date.now()}`,
            day: dayLabel,
            date: cleanDate || `第${dayCounter}天`,
            route: rawRoute,
            activity: rawActivity,
            noCar,
            isFreeDay,
          });

          dayCounter++;
        }

        if (items.length === 0) {
          throw new Error('未能从 Excel 中识别出行程内容，请确认格式是否包含“日期”、“行程”或“活动”列');
        }

        resolve(items);
      } catch (err: any) {
        reject(err);
      }
    };

    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
}
