import type { ItineraryItem, VehicleQuote } from '../types/itinerary';
import type { SystemConfig } from './storage';

// 南岛高频地名特征词
const SOUTH_ISLAND_KEYWORDS = [
  '皇后镇', '瓦纳卡', '格林诺奇', '箭镇', '蒂阿瑙', '米尔福德', '峡湾', 
  '但尼丁', '奥马鲁', '大圆石', '库克山', '蒂卡波', '特卡波', '基督城', 
  '阿卡罗阿', '凯库拉', '西海岸', '福克斯', '冰川', '约瑟夫', '南岛'
];

// 北岛高频地名特征词
const NORTH_ISLAND_KEYWORDS = [
  '奥克兰', '罗托鲁阿', '罗托鲁瓦', '陶波', '霍比特', '马塔马塔', 
  '怀托摩', '萤火虫', '派希亚', '岛屿湾', '惠灵顿', '科罗曼德', '北岛'
];

/**
 * 智能判断某天行程属于南岛还是北岛
 */
export function detectIsland(routeText: string): 'south' | 'north' {
  const text = routeText || '';
  
  let southScore = 0;
  let northScore = 0;

  SOUTH_ISLAND_KEYWORDS.forEach((kw) => {
    if (text.includes(kw)) southScore += 2;
  });

  NORTH_ISLAND_KEYWORDS.forEach((kw) => {
    if (text.includes(kw)) northScore += 2;
  });

  if (southScore >= northScore) {
    return 'south'; // 默认为南岛（新西兰主要定制游集中在南岛）
  }
  return 'north';
}

/**
 * 智能自动成本核算引擎：
 * 根据当前选定车型、系统补贴标准、路线归属地，自动补齐每一天的 E~K 列成本明细，
 * 并自动计算与核对整单用车总报价。
 */
export function autoCalculateCostBreakdown(
  itinerary: ItineraryItem[],
  vehicleModelName: string,
  systemConfig: SystemConfig
): {
  updatedItinerary: ItineraryItem[];
  totalCarPrice: number;
} {
  const { guideAllowance, vehicleList } = systemConfig;
  const matchedVehicle = vehicleList.find((v) => v.name === vehicleModelName) || vehicleList[0];

  const southCarRate = matchedVehicle?.southIslandPrice || 850;
  const northCarRate = matchedVehicle?.northIslandPrice || 750;
  const holidayRate = matchedVehicle?.holidaySurcharge || 0;

  const southMealRate = guideAllowance?.southIslandMeal || 75;
  const northMealRate = guideAllowance?.northIslandMeal || 50;
  const accommodationRate = guideAllowance?.accommodationSubsidy || 200;

  let grandTotalCar = 0;

  const updatedItinerary: ItineraryItem[] = itinerary.map((item, idx) => {
    const isNoCar = Boolean(item.noCar || (item.activity && item.activity.includes('不用车')));
    const island = detectIsland(item.route);

    let southCar: number | undefined = undefined;
    let northCar: number | undefined = undefined;
    let southMeal: number | undefined = undefined;
    let northMeal: number | undefined = undefined;
    let holidaySurcharge: number | undefined = undefined;
    let guideAccommodation: number | undefined = undefined;

    if (!isNoCar) {
      // 需要用车
      if (island === 'south') {
        southCar = southCarRate;
        southMeal = southMealRate;
      } else {
        northCar = northCarRate;
        northMeal = northMealRate;
      }

      // 如果日期包含春节/节日标记，或者有节日附加费
      if (item.date?.includes('2月') || item.route?.includes('春节')) {
        holidaySurcharge = holidayRate > 0 ? holidayRate : undefined;
      }

      // 异地住宿补贴逻辑（除接机、最后一天送机回程外，跨城长途通常包含司导住宿补贴）
      const isFirstDayArrival = idx === 0 && (item.route?.includes('接机') || item.route?.includes('到达'));
      const isLastDayDeparture = idx === itinerary.length - 1 && (item.route?.includes('送机') || item.route?.includes('离开'));

      // 中间跨城市行程（如库克山、蒂阿瑙、但尼丁、奥马鲁、蒂卡波）通常需要异地司导房补
      const needsAccommodation = !isLastDayDeparture && (
        item.route?.includes('蒂阿瑙') || 
        item.route?.includes('库克山') || 
        item.route?.includes('蒂卡波') || 
        item.route?.includes('奥马鲁') || 
        item.route?.includes('但尼丁') || 
        item.route?.includes('罗托鲁阿')
      );

      if (needsAccommodation) {
        guideAccommodation = accommodationRate;
      }
    }

    // 计算当天合计
    const dayTotal = (southCar || 0) + 
                     (northCar || 0) + 
                     (holidaySurcharge || 0) + 
                     (item.otherSurcharge || 0) + 
                     (southMeal || 0) + 
                     (northMeal || 0) + 
                     (guideAccommodation || 0);

    grandTotalCar += dayTotal;

    return {
      ...item,
      southIslandCar: southCar,
      northIslandCar: northCar,
      southGuideMeal: southMeal,
      northGuideMeal: northMeal,
      holidaySurcharge: holidaySurcharge,
      guideAccommodation: guideAccommodation,
    };
  });

  return {
    updatedItinerary,
    totalCarPrice: grandTotalCar,
  };
}
