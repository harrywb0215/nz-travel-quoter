import React from 'react';
import type { QuoteDocument, ItineraryItem } from '../../types/itinerary';
import { detectIsland } from '../../utils/costCalculator';
import { getSystemConfig } from '../../utils/storage';

interface QuotePaperPreviewProps {
  quoteDoc: QuoteDocument;
  onUpdateItineraryItem: (idx: number, field: keyof ItineraryItem, val: any) => void;
  onUpdatePsNote?: (note: string) => void;
  scale?: number;
}

export const QuotePaperPreview: React.FC<QuotePaperPreviewProps> = ({
  quoteDoc,
  onUpdateItineraryItem,
  onUpdatePsNote,
  scale = 1,
}) => {
  const { itinerary, vehicleQuote, activityQuote, psNote } = quoteDoc;
  const includeBreakdown = quoteDoc.includeCostBreakdown !== false;

  const sysCfg = getSystemConfig();
  const matchedV = sysCfg.vehicleList.find((v) => v.name === vehicleQuote.vehicleModel) || sysCfg.vehicleList[0];

  // 动态核算每行的成本明细（与 excelExporter.ts 算法 100% 对齐）
  const breakdownRows = itinerary.map((item, idx) => {
    const isNoCar = Boolean(item.noCar || (item.activity && item.activity.includes('不用车')));

    let eVal: number | null = null;
    let fVal: number | null = null;
    let gVal: number | null = null;
    let hVal: number | null = null;
    let iVal: number | null = null;
    let jVal: number | null = null;
    let kVal: number | null = null;

    // 只有在明确需要用车时才核算各项车费与司导补贴；不用车则完全置空保持留白
    if (!isNoCar) {
      const hasPredefinedCost =
        item.northIslandCar != null ||
        item.southIslandCar != null ||
        item.northGuideMeal != null ||
        item.southGuideMeal != null;

      eVal = item.northIslandCar ?? null;
      fVal = item.southIslandCar ?? null;
      gVal = item.holidaySurcharge ?? null;
      hVal = item.otherSurcharge ?? null;
      iVal = item.northGuideMeal ?? null;
      jVal = item.southGuideMeal ?? null;
      kVal = item.guideAccommodation ?? null;

      if (!hasPredefinedCost) {
        const island = detectIsland(item.route);
        if (island === 'south') {
          fVal = matchedV?.southIslandPrice || 850;
          jVal = sysCfg.guideAllowance?.southIslandMeal || 75;
        } else {
          eVal = matchedV?.northIslandPrice || 750;
          iVal = sysCfg.guideAllowance?.northIslandMeal || 50;
        }

        if (item.date?.includes('2月') || item.route?.includes('春节')) {
          gVal = matchedV?.holidaySurcharge || (matchedV?.holidaySurcharge === 0 ? null : 175);
        }

        const isLastDay =
          idx === itinerary.length - 1 && (item.route?.includes('送机') || item.route?.includes('离开'));
        if (
          !isLastDay &&
          (item.route?.includes('蒂阿瑙') ||
            item.route?.includes('库克山') ||
            item.route?.includes('蒂卡波') ||
            item.route?.includes('但尼丁') ||
            item.route?.includes('奥马鲁') ||
            item.route?.includes('罗托鲁阿'))
        ) {
          kVal = sysCfg.guideAllowance?.accommodationSubsidy || 200;
        }
      }
    }

    const dailySubtotal = isNoCar
      ? 0
      : (eVal || 0) +
        (fVal || 0) +
        (gVal || 0) +
        (hVal || 0) +
        (iVal || 0) +
        (jVal || 0) +
        (kVal || 0);

    return {
      eVal,
      fVal,
      gVal,
      hVal,
      iVal,
      jVal,
      kVal,
      dailySubtotal,
    };
  });

  const grandTotalCost = breakdownRows.reduce((sum, r) => sum + r.dailySubtotal, 0);

  return (
    <div style={{
      width: '100%',
      display: 'flex',
      justifyContent: 'center',
      paddingBottom: '100px',
    }}>
      <div
        className="quote-paper"
        id="quote-paper-container"
        style={{
          width: includeBreakdown ? '1240px' : '840px',
          transition: 'width 0.25s ease',
          background: '#ffffff',
          color: '#000000',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.65)',
          padding: includeBreakdown ? '36px 36px 80px 36px' : '36px 44px 80px 44px',
          borderRadius: '4px',
          boxSizing: 'border-box',
          fontFamily: '"STKaiti", "KaiTi", "华文楷体", "楷体", serif',
          zoom: scale,
        }}
      >
        {/* 1. 未勾选核算底表时，顶部独立的 PS 附加说明行 */}
        {!includeBreakdown && (
          <div style={{
            marginBottom: '6px',
            fontSize: '13px',
            fontWeight: 600,
            color: '#dc2626',
            display: 'flex',
            alignItems: 'center',
            background: '#ffffff',
          }}>
            <input
              type="text"
              value={psNote || 'PS： 26春节：2.16-26 附加费'}
              onChange={(e) => onUpdatePsNote && onUpdatePsNote(e.target.value)}
              placeholder="顶部备注（如：PS：26春节：2.16-26 附加费，可留空）"
              style={{
                border: 'none',
                background: '#ffffff',
                color: '#dc2626',
                fontWeight: 600,
                fontSize: '13px',
                fontFamily: 'inherit',
                width: '100%',
                padding: '2px 0',
              }}
            />
          </div>
        )}

        {/* 2. 行程明细表格 (对应原文件 Row 1/2 ~ Row 19) */}
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '13.5px',
            lineHeight: '1.4',
            background: '#ffffff',
          }}
        >
          <thead>
            {/* 勾选核算底表时：Row 1 渲染 A1:D1(备注) + E1:H1(车型) + I1:K1(导游) + L1(总计) */}
            {includeBreakdown && (
              <tr style={{ height: '28px', background: '#ffffff' }}>
                <th
                  colSpan={4}
                  style={{
                    border: 'none',
                    padding: '2px 4px',
                    textAlign: 'left',
                    fontWeight: 600,
                    color: '#dc2626',
                    background: '#ffffff',
                  }}
                >
                  <input
                    type="text"
                    value={psNote || 'PS： 26春节：2.16-26 附加费'}
                    onChange={(e) => onUpdatePsNote && onUpdatePsNote(e.target.value)}
                    placeholder="顶部备注（如：PS：26春节：2.16-26 附加费，可留空）"
                    style={{
                      border: 'none',
                      background: '#ffffff',
                      color: '#dc2626',
                      fontWeight: 600,
                      fontSize: '13px',
                      fontFamily: 'inherit',
                      width: '100%',
                      padding: '2px 0',
                    }}
                  />
                </th>
                <th
                  colSpan={4}
                  style={{
                    border: '1px solid #111827',
                    padding: '4px 6px',
                    textAlign: 'center',
                    fontWeight: 500,
                    color: '#111827',
                    background: '#ffffff',
                    fontSize: '13px',
                  }}
                >
                  {vehicleQuote.vehicleModel || '7 座 Alphard'}
                </th>
                <th
                  colSpan={3}
                  style={{
                    border: '1px solid #111827',
                    padding: '4px 6px',
                    textAlign: 'center',
                    fontWeight: 500,
                    color: '#111827',
                    background: '#ffffff',
                    fontSize: '13px',
                  }}
                >
                  导游
                </th>
                <th
                  style={{
                    border: '1px solid #111827',
                    padding: '4px 6px',
                    textAlign: 'center',
                    fontWeight: 500,
                    color: '#111827',
                    background: '#ffffff',
                    fontSize: '13px',
                  }}
                >
                  总计
                </th>
              </tr>
            )}

            {/* Row 2: 表头字段 */}
            <tr style={{ height: '26px', background: '#ffffff' }}>
              <th
                colSpan={2}
                style={{
                  border: '1px solid #111827',
                  padding: '4px 8px',
                  textAlign: 'center',
                  fontWeight: 500,
                  width: includeBreakdown ? '12%' : '26%',
                  color: '#111827',
                  background: '#ffffff',
                }}
              >
                日期
              </th>
              <th
                style={{
                  border: '1px solid #111827',
                  padding: '4px 10px',
                  textAlign: 'center',
                  fontWeight: 500,
                  width: includeBreakdown ? '23%' : '42%',
                  color: '#111827',
                  background: '#ffffff',
                }}
              >
                行程
              </th>
              <th
                style={{
                  border: '1px solid #111827',
                  padding: '4px 10px',
                  textAlign: 'center',
                  fontWeight: 500,
                  width: includeBreakdown ? '19%' : '32%',
                  color: '#111827',
                  background: '#ffffff',
                }}
              >
                活动 // 球场
              </th>

              {includeBreakdown && (
                <>
                  <th style={{ border: '1px solid #111827', padding: '4px 2px', textAlign: 'center', fontWeight: 500, width: '5.5%', color: '#111827', background: '#ffffff', fontSize: '12px' }}>北岛</th>
                  <th style={{ border: '1px solid #111827', padding: '4px 2px', textAlign: 'center', fontWeight: 500, width: '5.5%', color: '#111827', background: '#ffffff', fontSize: '12px' }}>南岛</th>
                  <th style={{ border: '1px solid #111827', padding: '4px 2px', textAlign: 'center', fontWeight: 500, width: '6.5%', color: '#111827', background: '#ffffff', fontSize: '11.5px' }}>节日附加费</th>
                  <th style={{ border: '1px solid #111827', padding: '4px 2px', textAlign: 'center', fontWeight: 500, width: '5%', color: '#111827', background: '#ffffff', fontSize: '12px' }}>附加费</th>
                  <th style={{ border: '1px solid #111827', padding: '4px 2px', textAlign: 'center', fontWeight: 500, width: '5.5%', color: '#111827', background: '#ffffff', fontSize: '12px' }}>北岛餐补</th>
                  <th style={{ border: '1px solid #111827', padding: '4px 2px', textAlign: 'center', fontWeight: 500, width: '5.5%', color: '#111827', background: '#ffffff', fontSize: '12px' }}>南岛餐补</th>
                  <th style={{ border: '1px solid #111827', padding: '4px 2px', textAlign: 'center', fontWeight: 500, width: '5.5%', color: '#111827', background: '#ffffff', fontSize: '12px' }}>住宿补贴</th>
                  <th style={{ border: '1px solid #111827', padding: '4px 2px', textAlign: 'center', fontWeight: 500, width: '7%', color: '#111827', background: '#ffffff', fontSize: '12.5px' }}>小计</th>
                </>
              )}
            </tr>
          </thead>
          <tbody style={{ background: '#ffffff' }}>
            {itinerary.length === 0 ? (
              <tr>
                <td
                  colSpan={includeBreakdown ? 12 : 4}
                  style={{
                    border: '1px dashed #cbd5e1',
                    padding: '28px 16px',
                    textAlign: 'center',
                    color: '#94a3b8',
                    fontSize: '13px',
                    background: '#f8fafc',
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                    <span style={{ fontWeight: 600, color: '#64748b' }}>📋 当前行程表为空（0 天）</span>
                    <span style={{ fontSize: '11.5px', color: '#94a3b8' }}>
                      请前往「1. 首页与智能识别」上传客户行程截图 / 导入 Excel，或在工作台左侧手动添加行程
                    </span>
                  </div>
                </td>
              </tr>
            ) : (
              itinerary.map((item, idx) => {
                const bRow = breakdownRows[idx];
                return (
                  <tr key={item.id} style={{ minHeight: '24px', background: '#ffffff' }}>
                    {/* Day 标记 */}
                    <td
                      style={{
                        border: '1px solid #e5e7eb',
                        padding: '5px 8px',
                        textAlign: 'center',
                        whiteSpace: 'nowrap',
                        background: '#ffffff',
                      }}
                    >
                      <input
                        type="text"
                        value={item.day}
                        onChange={(e) => onUpdateItineraryItem(idx, 'day', e.target.value)}
                        style={{
                          border: 'none',
                          background: '#ffffff',
                          color: '#000000',
                          padding: 0,
                          width: '100%',
                          textAlign: 'center',
                          fontFamily: 'inherit',
                          fontSize: 'inherit',
                        }}
                      />
                    </td>

                    {/* 具体日期 */}
                    <td
                      style={{
                        border: '1px solid #e5e7eb',
                        padding: '5px 8px',
                        textAlign: 'center',
                        whiteSpace: 'nowrap',
                        background: '#ffffff',
                      }}
                    >
                      <input
                        type="text"
                        value={item.date}
                        onChange={(e) => onUpdateItineraryItem(idx, 'date', e.target.value)}
                        style={{
                          border: 'none',
                          background: '#ffffff',
                          color: '#000000',
                          padding: 0,
                          width: '100%',
                          textAlign: 'center',
                          fontFamily: 'inherit',
                          fontSize: 'inherit',
                        }}
                      />
                    </td>

                    {/* 行程路线 */}
                    <td
                      style={{
                        border: '1px solid #e5e7eb',
                        padding: '5px 10px',
                        textAlign: 'left',
                        background: '#ffffff',
                      }}
                    >
                      <textarea
                        rows={item.route.includes('\n') ? 2 : 1}
                        value={item.route}
                        onChange={(e) => onUpdateItineraryItem(idx, 'route', e.target.value)}
                        style={{
                          border: 'none',
                          background: '#ffffff',
                          color: '#000000',
                          padding: 0,
                          width: '100%',
                          fontFamily: 'inherit',
                          fontSize: 'inherit',
                          resize: 'none',
                          lineHeight: '1.3',
                        }}
                      />
                    </td>

                    {/* 活动 / 球场 (特殊状态如“不用车”标红) */}
                    <td
                      style={{
                        border: '1px solid #e5e7eb',
                        padding: '5px 10px',
                        textAlign: 'left',
                        background: '#ffffff',
                        color: item.noCar || item.activity.includes('不用车') ? '#dc2626' : '#000000',
                        fontWeight: item.noCar || item.activity.includes('不用车') ? 600 : 'normal',
                      }}
                    >
                      <textarea
                        rows={item.activity && item.activity.includes('\n') ? 2 : 1}
                        value={item.activity}
                        onChange={(e) => onUpdateItineraryItem(idx, 'activity', e.target.value)}
                        style={{
                          border: 'none',
                          background: '#ffffff',
                          color: item.noCar || item.activity.includes('不用车') ? '#dc2626' : '#000000',
                          padding: 0,
                          width: '100%',
                          fontFamily: 'inherit',
                          fontSize: 'inherit',
                          fontWeight: 'inherit',
                          resize: 'none',
                          lineHeight: '1.3',
                        }}
                      />
                    </td>

                    {/* 勾选核算底表时：E~L 列明细与小计 */}
                    {includeBreakdown && (
                      <>
                        <td style={{ border: '1px solid #e5e7eb', padding: '4px 2px', textAlign: 'center', fontSize: '12.5px' }}>
                          {bRow?.eVal ?? ''}
                        </td>
                        <td style={{ border: '1px solid #e5e7eb', padding: '4px 2px', textAlign: 'center', fontSize: '12.5px' }}>
                          {bRow?.fVal ?? ''}
                        </td>
                        <td style={{ border: '1px solid #e5e7eb', padding: '4px 2px', textAlign: 'center', fontSize: '12.5px' }}>
                          {bRow?.gVal ?? ''}
                        </td>
                        <td style={{ border: '1px solid #e5e7eb', padding: '4px 2px', textAlign: 'center', fontSize: '12.5px' }}>
                          {bRow?.hVal ?? ''}
                        </td>
                        <td style={{ border: '1px solid #e5e7eb', padding: '4px 2px', textAlign: 'center', fontSize: '12.5px' }}>
                          {bRow?.iVal ?? ''}
                        </td>
                        <td style={{ border: '1px solid #e5e7eb', padding: '4px 2px', textAlign: 'center', fontSize: '12.5px' }}>
                          {bRow?.jVal ?? ''}
                        </td>
                        <td style={{ border: '1px solid #e5e7eb', padding: '4px 2px', textAlign: 'center', fontSize: '12.5px' }}>
                          {bRow?.kVal ?? ''}
                        </td>
                        <td style={{ border: '1px solid #e5e7eb', padding: '4px 4px', textAlign: 'center', fontWeight: 600, fontSize: '12.5px', color: '#1e293b' }}>
                          {bRow?.dailySubtotal ? bRow.dailySubtotal.toLocaleString() : ''}
                        </td>
                      </>
                    )}
                  </tr>
                );
              })
            )}

            {/* 勾选核算底表时：紧接着在最后一天下方渲染总计求和行 */}
            {includeBreakdown && itinerary.length > 0 && (
              <tr style={{ height: '26px', background: '#ffffff' }}>
                <td colSpan={11} style={{ border: 'none', background: '#ffffff' }} />
                <td
                  style={{
                    border: '1px solid #111827',
                    padding: '4px 6px',
                    textAlign: 'center',
                    fontWeight: 700,
                    color: '#ff0000',
                    background: '#ffffff',
                    fontSize: '13px',
                  }}
                  title="行程核算总计（对齐 Excel SUM 公式）"
                >
                  {grandTotalCost > 0 ? grandTotalCost.toLocaleString() : ''}
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* 对应原表中的空两行 */}
        <div style={{ height: '32px', background: '#ffffff' }} />

        {/* 3. 核心报价块 (完全对齐原文件的样式与排版，含底表时占左侧对齐 A~D 列，右侧留白) */}
        <div style={{ width: includeBreakdown ? '660px' : '100%' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '13.5px',
              lineHeight: '1.4',
              background: '#ffffff',
            color: '#000000',
          }}
        >
          <tbody style={{ background: '#ffffff' }}>
            {/* 3.1 行程用车黄色标题 (红字加粗！) */}
            <tr style={{ background: '#ffff00' }}>
              <td
                colSpan={4}
                style={{
                  background: '#ffff00',
                  border: '1px solid #000000',
                  padding: '6px 14px',
                  paddingLeft: '24px',
                  fontWeight: 700,
                  color: '#ff0000',
                  fontSize: '13.5px',
                }}
              >
                1. 以上行程用车：{vehicleQuote.currency} {vehicleQuote.totalPrice.toLocaleString()}
              </td>
            </tr>

            {/* 3.2 价格包含 */}
            <tr style={{ background: '#ffffff' }}>
              <td
                colSpan={4}
                style={{
                  background: '#ffffff',
                  color: '#000000',
                  border: '1px solid #000000',
                  padding: '5px 14px',
                  paddingLeft: '24px',
                }}
              >
                价格包含：
              </td>
            </tr>
            {vehicleQuote.inclusions.map((incText, i) => (
              <tr key={`inc-${i}`} style={{ background: '#ffffff' }}>
                <td
                  colSpan={4}
                  style={{
                    background: '#ffffff',
                    color: '#000000',
                    border: '1px solid #000000',
                    padding: '5px 14px',
                    paddingLeft: '36px',
                  }}
                >
                  {incText}
                </td>
              </tr>
            ))}

            {/* 3.3 对应原表 Row 26 空行占位 */}
            <tr style={{ background: '#ffffff' }}>
              <td
                colSpan={4}
                style={{
                  background: '#ffffff',
                  color: '#000000',
                  border: '1px solid #000000',
                  padding: '5px 14px',
                  height: '22px',
                }}
              >
                &nbsp;
              </td>
            </tr>

            {/* 3.4 价格不含 */}
            <tr style={{ background: '#ffffff' }}>
              <td
                colSpan={4}
                style={{
                  background: '#ffffff',
                  color: '#000000',
                  border: '1px solid #000000',
                  padding: '5px 14px',
                  paddingLeft: '24px',
                }}
              >
                价格不含：
              </td>
            </tr>
            {vehicleQuote.exclusions.map((excText, i) => (
              <tr key={`exc-${i}`} style={{ background: '#ffffff' }}>
                <td
                  style={{
                    background: '#ffffff',
                    color: '#000000',
                    border: '1px solid #000000',
                    padding: '5px 8px',
                    textAlign: 'center',
                    width: '40px',
                  }}
                >
                  {i + 1}
                </td>
                <td
                  colSpan={3}
                  style={{
                    background: '#ffffff',
                    color: '#000000',
                    border: '1px solid #000000',
                    padding: '5px 14px',
                    paddingLeft: '12px',
                  }}
                >
                  {excText}
                </td>
              </tr>
            ))}

            {/* 3.5 说明 */}
            <tr style={{ background: '#ffffff' }}>
              <td
                colSpan={4}
                style={{
                  background: '#ffffff',
                  color: '#000000',
                  border: '1px solid #000000',
                  padding: '5px 14px',
                  paddingLeft: '24px',
                }}
              >
                说明：
              </td>
            </tr>
            {vehicleQuote.notes.map((noteText, i) => (
              <tr key={`note-${i}`} style={{ background: '#ffffff' }}>
                <td
                  style={{
                    background: '#ffffff',
                    color: '#000000',
                    border: '1px solid #000000',
                    padding: '5px 8px',
                    textAlign: 'center',
                    width: '40px',
                  }}
                >
                  {i + 1}
                </td>
                <td
                  colSpan={3}
                  style={{
                    background: '#ffffff',
                    color: '#000000',
                    border: '1px solid #000000',
                    padding: '5px 14px',
                    paddingLeft: '12px',
                  }}
                >
                  {noteText}
                </td>
              </tr>
            ))}

            {/* 3.6 活动费用黄色标题 (红字加粗！) */}
            <tr style={{ background: '#ffff00' }}>
              <td
                colSpan={4}
                style={{
                  background: '#ffff00',
                  border: '1px solid #000000',
                  padding: '6px 14px',
                  paddingLeft: '24px',
                  fontWeight: 700,
                  color: '#ff0000',
                  fontSize: '13.5px',
                }}
              >
                2. 活动费用：成人：{activityQuote.currency} {activityQuote.adultPrice}/人；
                {activityQuote.childPrice ? ` 儿童：${activityQuote.currency} ${activityQuote.childPrice}/人；` : ''}
              </td>
            </tr>

            {/* 3.7 活动包含长文本 */}
            <tr style={{ background: '#ffffff' }}>
              <td
                colSpan={4}
                style={{
                  background: '#ffffff',
                  color: '#000000',
                  border: '1px solid #000000',
                  padding: '10px 14px',
                  paddingLeft: '12px',
                  lineHeight: '1.7',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {activityQuote.customActivityText?.startsWith('活动包含：')
                  ? activityQuote.customActivityText
                  : `活动包含：\n${activityQuote.customActivityText || activityQuote.includedActivities.join('；')}`}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
  );
};
