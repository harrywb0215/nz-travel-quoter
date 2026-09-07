export interface ItineraryItem {
  id: string;
  day: string;          // 例如：Day 1
  date: string;         // 例如：12月18日
  route: string;        // 例如：皇后镇接机 1420 + 游览
  activity: string;     // 例如：TSS + 晚餐 NZD 199/人
  noCar?: boolean;      // 是否标记不用车（红字显示）
  isFreeDay?: boolean;  // 是否为自由活动
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
  vehicleModel: string;      // 车型，例如 '16座奔驰 + 拖斗' 或 '7 座 Alphard'
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
  itinerary: ItineraryItem[];
  vehicleQuote: VehicleQuote;
  activityQuote: ActivityQuote;
  includeCostBreakdown?: boolean; // 是否在导出时包含 E~L 列成本核算底表
  updatedAt: string;
}
