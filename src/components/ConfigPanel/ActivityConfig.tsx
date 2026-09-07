import React from 'react';
import { Ticket, Wand2, BookOpen, AlertCircle, Sparkles } from 'lucide-react';
import { ActivityQuote, ItineraryItem } from '../../types/itinerary';
import { loadSystemConfig } from '../../utils/storage';

interface ActivityConfigProps {
  activityQuote: ActivityQuote;
  itinerary: ItineraryItem[];
  onChange: (updated: ActivityQuote) => void;
  onOpenLibrary: () => void;
}

export const ActivityConfig: React.FC<ActivityConfigProps> = ({
  activityQuote,
  itinerary,
  onChange,
  onOpenLibrary,
}) => {
  // 一键从行程中智能抓取所有活动，并自动在门票库中匹配单价与核算总额
  const handleAutoExtractActivities = () => {
    const extractedList: string[] = [];
    itinerary.forEach((item) => {
      const act = item.activity?.trim();
      if (act && !act.includes('不用车') && !extractedList.includes(act)) {
        // 切分像 "龙虾船（包船）/ 出海看海豚" 或 "毛利文化村 / 陶波湖游览"
        const subActs = act.split(/[/+；;，,\n]/).map((s) => s.trim()).filter(Boolean);
        subActs.forEach((s) => {
          if (!extractedList.includes(s)) {
            extractedList.push(s);
          }
        });
      }
    });

    if (extractedList.length === 0) {
      alert('未在当前行程表的“活动”列中提取到具体项目');
      return;
    }

    const sysConfig = loadSystemConfig();
    const lib = sysConfig.activityLibrary || [];
    let autoSum = 0;

    // 尝试在门票库中匹配单价
    extractedList.forEach((extractedName) => {
      const cleanTarget = extractedName.replace(/[NZD0-9/人()（）+]/g, '').trim().toLowerCase();
      const matched = lib.find((act) => {
        const cleanLib = act.name.replace(/[NZD0-9/人()（）+]/g, '').trim().toLowerCase();
        return cleanLib.includes(cleanTarget) || cleanTarget.includes(cleanLib);
      });
      if (matched) {
        autoSum += matched.adultPrice;
      }
    });

    const mergedText = extractedList.join('；');
    onChange({
      ...activityQuote,
      includedActivities: extractedList,
      customActivityText: mergedText,
      adultPrice: autoSum > 0 ? autoSum : activityQuote.adultPrice,
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* 1. 活动费用人均单价 */}
      <div style={{
        background: 'var(--bg-panel)',
        borderRadius: '8px',
        padding: '16px',
        border: '1px solid var(--border-subtle)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, fontSize: '14px' }}>
            <Ticket size={16} color="var(--figma-blue)" />
            <span>2. 活动门票费用核算</span>
          </div>
          <button
            onClick={onOpenLibrary}
            style={{
              background: 'rgba(13, 153, 255, 0.15)',
              color: '#38bdf8',
              fontSize: '12px',
              padding: '4px 8px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <BookOpen size={13} />
            从门票库勾选
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
              成人门票费用 (NZD/人)
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="number"
                value={activityQuote.adultPrice}
                onChange={(e) => onChange({ ...activityQuote, adultPrice: Number(e.target.value) || 0 })}
                style={{
                  width: '100%',
                  paddingLeft: '32px',
                  fontWeight: 700,
                  fontSize: '15px',
                  color: '#60a5fa',
                }}
              />
              <span style={{ position: 'absolute', left: '10px', top: '8px', color: 'var(--text-dim)', fontSize: '12px' }}>
                $
              </span>
            </div>
          </div>

          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
              儿童门票费用 (可选 NZD/人)
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="number"
                value={activityQuote.childPrice || ''}
                placeholder="例如 1350"
                onChange={(e) => onChange({ ...activityQuote, childPrice: Number(e.target.value) || undefined })}
                style={{ width: '100%', paddingLeft: '32px' }}
              />
              <span style={{ position: 'absolute', left: '10px', top: '8px', color: 'var(--text-dim)', fontSize: '12px' }}>
                $
              </span>
            </div>
          </div>
        </div>

        <div style={{
          background: 'rgba(255, 255, 0, 0.08)',
          border: '1px solid rgba(255, 255, 0, 0.25)',
          borderRadius: '6px',
          padding: '8px 12px',
          fontSize: '12px',
          color: '#fef08a',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <span>表格高亮标题预览:</span>
          <strong>2. 活动费用：成人：{activityQuote.currency} {activityQuote.adultPrice}/人；</strong>
        </div>
      </div>

      {/* 2. 活动包含项目描述 */}
      <div style={{
        background: 'var(--bg-panel)',
        borderRadius: '8px',
        padding: '16px',
        border: '1px solid var(--border-subtle)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <span style={{ fontSize: '13px', fontWeight: 600 }}>活动包含清单文本 (对应图二下半部分)</span>
          <button
            onClick={handleAutoExtractActivities}
            style={{
              background: 'rgba(16, 185, 129, 0.15)',
              color: '#34d399',
              fontSize: '12px',
              padding: '4px 8px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
            title="从右侧当前行程表中提取所有活动名称"
          >
            <Wand2 size={13} />
            自动提取行程活动
          </button>
        </div>

        <textarea
          rows={4}
          value={activityQuote.customActivityText || activityQuote.includedActivities.join('；')}
          onChange={(e) => onChange({ ...activityQuote, customActivityText: e.target.value })}
          placeholder="例如：凯库拉观鲸，Alpacas farm，直升机飞峡湾 + 峡湾游轮 + 午餐（餐盒）；山顶缆车；TSS 游湖；霍比特村游览，Wai O Tapu 地热公园门票；怀托摩萤火虫洞"
          style={{ width: '100%', lineHeight: '1.6', resize: 'vertical' }}
        />

        <div style={{ marginTop: '8px', fontSize: '11px', color: 'var(--text-dim)', display: 'flex', gap: '4px', alignItems: 'flex-start' }}>
          <AlertCircle size={13} style={{ flexShrink: 0, marginTop: '2px' }} />
          <span>该段文本将完整渲染在图二底部的“活动包含：”合并单元格中，支持换行和分号分隔。</span>
        </div>
      </div>
    </div>
  );
};
