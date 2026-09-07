export interface QuoterInfo {
  companyName: string;      // 公司/车队名称，例如：新西兰Harry精品定制游
  agentName: string;        // 报价人/司兼导姓名，例如：Harry
  phone: string;            // 电话，例如：+64 21 123 4567
  wechat: string;           // 微信，例如：nz_harry_guide
  license: string;          // 资质牌照，例如：NZTA SPSL 认证
}

export interface ClientInfo {
  name: string;             // 客户姓名/称呼，例如：刘齐 一家
  phone?: string;           // 客户联系电话
  wechat?: string;          // 客户微信
  adultCount: number;       // 成人人数，例如：4
  childCount: number;       // 儿童人数，例如：0
  startDate: string;        // 出行起始日期，例如：2026-12-18
  endDate: string;          // 出行结束日期，例如：2027-01-03
  specialDemands?: string;  // 客户特殊要求，例如：重点摄影、需要大行李空间
}

export interface QuoteMeta {
  quoteNo: string;          // 报价单号，例如：NZQ-202612-001
  createDate: string;       // 报价日期，例如：2026-09-07
  expiryWeeks: number;      // 有效期（周），例如：2
  exchangeRateToRmb: number;// 纽币对人民币参考汇率，例如：4.35
  status: 'draft' | 'sent' | 'confirmed'; // 状态
}

export interface ItineraryItem {
  id: string;
  day: string;              // 例如：Day 1
  date: string;             // 例如：12月18日
  route: string;            // 例如：皇后镇接机 1420 + 游览
  activity: string;         // 例如：TSS + 晚餐 NZD 199/人
  noCar?: boolean;          // 是否标记不用车（红字显示）
  isFreeDay?: boolean;      // 是否为自由活动
  // 成本拆解（对应 Excel E~L 列）
  northIslandCar?: number;     // E列：北岛车费
  southIslandCar?: number;     // F列：南岛车费
  holidaySurcharge?: number;   // G列：节日附加费
  otherSurcharge?: number;     // H列：附加费
  northGuideMeal?: number;     // I列：北岛餐补
  southGuideMeal?: number;     // J列：南岛餐补
  guideAccommodation?: number; // K列：住宿补贴
}

export interface VehicleQuote {
  totalPrice: number;        // 用车总金额，例如 19985
  currency: string;          // 货币单位，例如 'NZD'
  vehicleModel: string;      // 车型，例如 '7 座 Alphard' 或 '16座奔驰 + 拖斗'
  carDays?: number;          // 实际用车天数
  inclusions: string[];      // 价格包含条款
  exclusions: string[];      // 价格不含条款
  notes: string[];           // 说明条款
}

export interface ActivityQuote {
  adultPrice: number;        // 成人单价，例如 2080
  childPrice?: number;       // 儿童单价
  currency: string;          // 货币单位，例如 'NZD'
  includedActivities: string[]; // 包含的活动名称列表
  customActivityText?: string;  // 自定义活动包含文本描述
}

export interface PresetActivity {
  id: string;
  name: string;
  location: string;
  adultPrice: number;
  childPrice?: number;
  description?: string;
}

export interface QuoteDocument {
  title: string;
  psNote?: string;           // 对应原文件 Row 1: "PS： 26春节：2.16-26 附加费"
  quoterInfo: QuoterInfo;    // 1. 报价方信息
  clientInfo: ClientInfo;    // 2. 客户信息
  quoteMeta: QuoteMeta;      // 3. 报价单元信息
  itinerary: ItineraryItem[];
  vehicleQuote: VehicleQuote;
  activityQuote: ActivityQuote;
  includeCostBreakdown?: boolean; // 是否在导出时包含 E~L 列成本核算底表
  updatedAt: string;
}
