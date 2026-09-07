import type { PresetActivity, QuoteDocument } from '../types/itinerary';
import { presetActivities, presetVehicles } from '../constants/initialData';

// 车型配置模型
export interface VehicleConfigItem {
  id: string;
  name: string;
  northIslandPrice: number;  // 北岛基础日租
  southIslandPrice: number;  // 南岛基础日租
  holidaySurcharge: number;  // 每日节日附加费标准
  capacity: string;
  desc?: string;
}

// 司导补贴与工时参数
export interface GuideAllowanceConfig {
  northIslandMeal: number;       // 北岛每日餐补 (如 40~60)
  southIslandMeal: number;       // 南岛每日餐补 (如 50~75)
  accommodationSubsidy: number;  // 异地住宿补贴 (如 180~300)
  tipPerDayPerPerson: number;    // 小费标准 (如 6)
  maxDailyHours: number;         // 每日标准工时 (如 10)
  overtimeHourlyRate: number;    // 超时单价 (如 150)
  quoteValidityWeeks: number;    // 报价有效期周数 (如 2)
}

// 系统全部业务参数
export interface SystemConfig {
  guideAllowance: GuideAllowanceConfig;
  vehicleList: VehicleConfigItem[];
  activityLibrary: PresetActivity[];
  defaultInclusions: string[];
  defaultExclusions: string[];
  defaultNotes: string[];
}

const STORAGE_KEYS = {
  SYSTEM_CONFIG: 'nz_quoter_system_config_v1',
  SAVED_QUOTES: 'nz_quoter_saved_quotes_v1',
  CURRENT_DRAFT: 'nz_quoter_current_draft_v1',
};

// 初始出厂配置
export const defaultSystemConfig: SystemConfig = {
  guideAllowance: {
    northIslandMeal: 50,
    southIslandMeal: 75,
    accommodationSubsidy: 200,
    tipPerDayPerPerson: 6,
    maxDailyHours: 10,
    overtimeHourlyRate: 150,
    quoteValidityWeeks: 2,
  },
  vehicleList: [
    { id: 'v1', name: '7 座 Alphard', northIslandPrice: 750, southIslandPrice: 850, holidaySurcharge: 175, capacity: '4人及行李', desc: '头等舱保姆车，尊贵出行体验' },
    { id: 'v2', name: '16座奔驰 + 拖斗', northIslandPrice: 1200, southIslandPrice: 1300, holidaySurcharge: 200, capacity: '8-12人及行李', desc: '豪华商务首选，带独立行李拖斗' },
    { id: 'v3', name: '12座丰田海狮 + 拖斗', northIslandPrice: 950, southIslandPrice: 1050, holidaySurcharge: 180, capacity: '6-9人及行李', desc: '经典舒适商务中巴' },
    { id: 'v4', name: '8座奔驰 V-Class', northIslandPrice: 850, southIslandPrice: 950, holidaySurcharge: 180, capacity: '4-5人及行李', desc: '高端商务多功能车' },
    { id: 'v5', name: '20-25座考斯特中巴', northIslandPrice: 1450, southIslandPrice: 1550, holidaySurcharge: 250, capacity: '14-18人及行李', desc: '适合大家庭或中型商务考察团队' },
  ],
  activityLibrary: presetActivities,
  defaultInclusions: [
    '车：16座奔驰 + 拖斗，燃油，机场卡，车辆保险',
    '司兼导服务，司导工资；司导住宿（未含库克山司导住宿），餐补',
  ],
  defaultExclusions: [
    '小费：NZD 6每人每天（请现金结算给导游，南北岛分开计算）',
    '不含行程以外的路程费，',
    '不含旅游保险（建议自行购买）',
  ],
  defaultNotes: [
    '工作时间：全天不超过10小时，超时部分按照 NZD150/小时（含GST）计算',
    '此报价有效期为2周，报价以最终航班时间为准，目前并未座任何预留',
  ],
};

// 1. 读取业务配置
export function getSystemConfig(): SystemConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SYSTEM_CONFIG);
    if (!raw) return defaultSystemConfig;
    const parsed = JSON.parse(raw);
    return {
      ...defaultSystemConfig,
      ...parsed,
      guideAllowance: { ...defaultSystemConfig.guideAllowance, ...(parsed.guideAllowance || {}) },
    };
  } catch (err) {
    console.error('读取本地配置失败，回退到默认设置:', err);
    return defaultSystemConfig;
  }
}

// 2. 保存业务配置
export function saveSystemConfig(cfg: SystemConfig): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SYSTEM_CONFIG, JSON.stringify(cfg));
  } catch (err) {
    console.error('保存本地配置失败:', err);
  }
}

// 3. 历史草稿保存与读取
export function getSavedQuotes(): QuoteDocument[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SAVED_QUOTES);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveQuoteToHistory(quote: QuoteDocument): QuoteDocument[] {
  const existing = getSavedQuotes().filter((q) => q.title !== quote.title);
  const updated = [{ ...quote, updatedAt: new Date().toISOString() }, ...existing].slice(0, 30); // 保留最新30份
  localStorage.setItem(STORAGE_KEYS.SAVED_QUOTES, JSON.stringify(updated));
  return updated;
}

export function deleteQuoteFromHistory(title: string): QuoteDocument[] {
  const updated = getSavedQuotes().filter((q) => q.title !== title);
  localStorage.setItem(STORAGE_KEYS.SAVED_QUOTES, JSON.stringify(updated));
  return updated;
}

// 4. 导出系统配置文件 (JSON)
export function exportConfigToFile(): void {
  const cfg = getSystemConfig();
  const blob = new Blob([JSON.stringify(cfg, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `新西兰报价系统价格配置备份_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// 5. 导入系统配置文件 (JSON)
export function importConfigFromFile(file: File): Promise<SystemConfig> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = JSON.parse(text);
        if (!parsed.guideAllowance || !parsed.activityLibrary) {
          throw new Error('配置文件结构不完整或格式错误');
        }
        saveSystemConfig(parsed);
        resolve(parsed);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsText(file);
  });
}
