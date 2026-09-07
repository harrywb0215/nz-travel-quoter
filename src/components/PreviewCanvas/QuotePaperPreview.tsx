import React from 'react';
import type { QuoteDocument, ItineraryItem } from '../../types/itinerary';

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
          width: '840px',
          background: '#ffffff',
          color: '#000000',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.65)',
          padding: '36px 44px 80px 44px',
          borderRadius: '4px',
          boxSizing: 'border-box',
          fontFamily: '"STKaiti", "KaiTi", "华文楷体", "楷体", serif',
          zoom: scale, // 使用 zoom 可以让文档流高度自然重新计算，杜绝任何截断
        }}
      >
        {/* 1. Row 1: 顶部附加说明行 (红字，对应 PS： 26春节：2.16-26 附加费) */}
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

        {/* 2. 行程明细表格 (对应原文件 Row 2 ~ Row 19) */}
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
            <tr style={{ height: '26px', background: '#ffffff' }}>
              <th
                colSpan={2}
                style={{
                  border: '1px solid #e5e7eb',
                  padding: '4px 8px',
                  textAlign: 'center',
                  fontWeight: 500,
                  width: '26%',
                  color: '#111827',
                  background: '#ffffff',
                }}
              >
                日期
              </th>
              <th
                style={{
                  border: '1px solid #e5e7eb',
                  padding: '4px 10px',
                  textAlign: 'center',
                  fontWeight: 500,
                  width: '42%',
                  color: '#111827',
                  background: '#ffffff',
                }}
              >
                行程
              </th>
              <th
                style={{
                  border: '1px solid #e5e7eb',
                  padding: '4px 10px',
                  textAlign: 'center',
                  fontWeight: 500,
                  width: '32%',
                  color: '#111827',
                  background: '#ffffff',
                }}
              >
                活动 // 球场
              </th>
            </tr>
          </thead>
          <tbody style={{ background: '#ffffff' }}>
            {itinerary.map((item, idx) => (
              <tr key={item.id} style={{ minHeight: '24px', background: '#ffffff' }}>
                {/* Day 标记 */}
                <td
                  style={{
                    border: '1px solid #f3f4f6',
                    padding: '5px 8px',
                    textAlign: 'center',
                    width: '11%',
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
                    border: '1px solid #f3f4f6',
                    padding: '5px 8px',
                    textAlign: 'center',
                    width: '15%',
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
                    border: '1px solid #f3f4f6',
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
                    border: '1px solid #f3f4f6',
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
              </tr>
            ))}
          </tbody>
        </table>

        {/* 对应原表中的空两行 */}
        <div style={{ height: '32px', background: '#ffffff' }} />

        {/* 3. 核心报价块 (完全对齐原文件的样式与排版，显式设置全白底色，杜绝任何黑底透出) */}
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
  );
};
