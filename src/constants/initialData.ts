import type { ItineraryItem, QuoteDocument, PresetActivity } from '../types/itinerary';

/**
 * 动态创建全新的纯净空白报价单
 * （进入首页接待新客户、或一键新建单据时使用，绝不残留任何历史/假数据）
 */
export function createEmptyQuoteDoc(): QuoteDocument {
  const now = new Date();
  const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
  const randomSuffix = String(Math.floor(100 + Math.random() * 900));

  const todayStr = now.toISOString().slice(0, 10);
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const nextWeekStr = nextWeek.toISOString().slice(0, 10);

  return {
    title: '新西兰定制游行程报价单',
    psNote: 'PS： 26春节：2.16-26 附加费',
    quoterInfo: {
      companyName: '新西兰 Harry 精品定制车队',
      agentName: 'Harry 导游',
      phone: '+64 21 888 666',
      wechat: 'harrywb0215',
      license: 'NZTA SPSL 认证商业运营车队',
    },
    clientInfo: {
      name: '',
      phone: '',
      wechat: '',
      adultCount: 4,
      childCount: 0,
      startDate: todayStr,
      endDate: nextWeekStr,
      specialDemands: '',
    },
    quoteMeta: {
      quoteNo: `NZQ-${yearMonth}-${randomSuffix}`,
      createDate: todayStr,
      expiryWeeks: 2,
      exchangeRateToRmb: 4.35,
      status: 'draft',
    },
    includeCostBreakdown: true,
    updatedAt: todayStr,
    itinerary: [], // 干净的 0 行程，等待上传识别或手动录入
    vehicleQuote: {
      totalPrice: 7400, // 初始默认 8 天出行 * (7座 Alphard $850 + 餐补 $75)
      currency: 'NZD',
      vehicleModel: '7 座 Alphard',
      carDays: 8,
      inclusions: [
        '车：7 座 Alphard，燃油，机场卡，车辆保险',
        '司兼导服务，司导工资；司导住宿（未含库克山司导住宿），餐补',
      ],
      exclusions: [
        '小费：NZD 6每人每天（请现金结算给导游，南北岛分开计算）',
        '不含行程以外的路程费',
        '不含旅游保险（建议自行购买）',
      ],
      notes: [
        '工作时间：全天不超过10小时，超时部分按照 NZD 150/小时 计算。',
        '此报价有效期为 2周，报价以最终航班时间为准，保留调整权利。',
        '因不可抗力因素（天气/航班延误等）导致的行程变更，车队将协助协调。',
      ],
    },
    activityQuote: {
      adultPrice: 0,
      currency: 'NZD',
      includedActivities: [],
      customActivityText: '',
    },
  };
}

// 默认出厂初始单据为空白单据
export const standard18DaysQuoteDoc: QuoteDocument = createEmptyQuoteDoc();
export const figure1Itinerary: ItineraryItem[] = [];

// 预置常用新西兰活动与门票参考库（NZD）
export const presetActivities: PresetActivity[] = [
  { id: 'act-1', name: 'TSS 厄恩斯劳号蒸汽船 + 瓦尔特峰农场晚餐', location: '皇后镇', adultPrice: 199, childPrice: 95, description: '百年蒸汽船体验及高地农庄BBQ自助晚餐' },
  { id: 'act-2', name: '天空缆车 Skyline Gondola', location: '皇后镇', adultPrice: 69, childPrice: 34, description: '俯瞰皇后镇全景与瓦卡蒂普湖' },
  { id: 'act-3', name: '天空缆车 + 山顶自助晚餐', location: '皇后镇', adultPrice: 135, childPrice: 75, description: '全景餐厅精美自助' },
  { id: 'act-4', name: '萤火虫洞 Glowworm Caves', location: '罗托鲁阿/怀托摩', adultPrice: 81, childPrice: 40, description: '地下乘船观赏奇幻萤火虫' },
  { id: 'act-5', name: '峡湾游轮 + 游轮自助', location: '峡湾', adultPrice: 165, childPrice: 85, description: '世界第八大奇迹峡湾深度巡游' },
  { id: 'act-6', name: '直升机飞峡湾 + 峡湾游轮 + 午餐（餐盒）', location: '峡湾', adultPrice: 980, childPrice: 650, description: '高空俯瞰南阿尔卑斯雪山与峡湾' },
  { id: 'act-7', name: '看小企鹅迁徙', location: '奥马鲁', adultPrice: 67, childPrice: 35, description: '近距离观赏世界上最小的小蓝企鹅' },
  { id: 'act-8', name: '塔斯曼冰河探险', location: '库克山', adultPrice: 219, childPrice: 110, description: '乘专用冲锋舟探访冰川湖浮冰' },
  { id: 'act-9', name: '出海看海豚', location: '基督城/阿卡罗阿', adultPrice: 125, childPrice: 65, description: '寻访珍稀赫氏海豚' },
  { id: 'act-10', name: '南极中心', location: '基督城', adultPrice: 74, childPrice: 45, description: '企鹅喂食与极地风暴体验' },
  { id: 'act-11', name: '霍比特村游览', location: '奥克兰/玛塔玛塔', adultPrice: 120, childPrice: 60, description: '电影魔戒/指环王取景地深度导览' },
  { id: 'act-12', name: '毛利文化村', location: '罗托鲁阿', adultPrice: 142, childPrice: 70, description: '波胡图间歇泉与毛利歌舞' },
  { id: 'act-13', name: '爱歌顿皇家牧场', location: '罗托鲁阿', adultPrice: 61, childPrice: 35, description: '喂羊驼、剪羊毛表演' },
  { id: 'act-14', name: 'Wai O Tapu 地热公园门票', location: '罗托鲁阿', adultPrice: 45, childPrice: 20, description: '香槟池与彩色地热泉' },
  { id: 'act-15', name: '凯库拉观鲸', location: '凯库拉', adultPrice: 165, childPrice: 80, description: '观赏巨大的抹香鲸和海豚' },
];

export const presetVehicles = [
  { id: 'v1', name: '7 座 Alphard', baseDayPrice: 850, capacity: '4人及行李', desc: '头等舱保姆车，尊贵出行体验' },
  { id: 'v2', name: '16座奔驰 + 拖斗', baseDayPrice: 1300, capacity: '8-12人及行李', desc: '豪华商务首选，带独立行李拖斗' },
  { id: 'v3', name: '12座丰田海狮 (Hiace) + 拖斗', baseDayPrice: 1050, capacity: '6-9人及行李', desc: '经典舒适商务中巴' },
  { id: 'v4', name: '8座奔驰 V-Class', baseDayPrice: 950, capacity: '4-5人及行李', desc: '高端商务多功能车' },
  { id: 'v5', name: '20-25座考斯特中巴', baseDayPrice: 1550, capacity: '14-18人及行李', desc: '适合大家庭或中型商务考察团队' },
];
