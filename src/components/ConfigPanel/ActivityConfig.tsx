import React, { useState } from 'react';
import { Ticket, Wand2, BookOpen, AlertCircle, Sparkles, CheckCircle2, X } from 'lucide-react';
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
  const [noticeModal, setNoticeModal] = useState<{
    title: string;
    message: string;
    type?: 'warning' | 'success';
  } | null>(null);

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
      setNoticeModal({
        title: '未提取到活动项目',
        message: '当前右侧行程表的“活动 // 球场”列暂未录入任何具体项目内容。\n\n建议操作：\n• 点击上方【从门票库勾选】快速添加常见活动与门票\n• 或在右侧行程表格各天的活动单元格中直接双击输入',
        type: 'warning',
      });
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

    setNoticeModal({
      title: '活动提取与核算成功',
      message: `已成功从当前行程表中抓取到 ${extractedList.length} 项活动，并在价格库中自动匹配推算出成人人均门票：NZD ${autoSum > 0 ? autoSum : activityQuote.adultPrice}/人！`,
      type: 'success',
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

      {/* 优雅高保真提示弹窗 (彻底替代简陋原生 alert) */}
      {noticeModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.72)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999,
          animation: 'fadeIn 0.15s ease-out',
        }}>
          <div style={{
            background: 'var(--bg-topbar)',
            border: noticeModal.type === 'warning' ? '1px solid rgba(245, 158, 11, 0.35)' : '1px solid rgba(16, 185, 129, 0.35)',
            borderRadius: '12px',
            width: '440px',
            maxWidth: '92vw',
            padding: '24px',
            boxShadow: '0 24px 60px rgba(0, 0, 0, 0.7)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  background: noticeModal.type === 'warning' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: noticeModal.type === 'warning' ? '#fbbf24' : '#34d399',
                  flexShrink: 0,
                }}>
                  {noticeModal.type === 'warning' ? <AlertCircle size={22} /> : <CheckCircle2 size={22} />}
                </div>
                <div>
                  <h4 style={{ fontSize: '15.5px', fontWeight: 600, color: 'var(--text-main)', margin: 0 }}>
                    {noticeModal.title}
                  </h4>
                  <span style={{ fontSize: '11.5px', color: 'var(--text-dim)', marginTop: '2px', display: 'block' }}>
                    新西兰行程活动智能助手
                  </span>
                </div>
              </div>

              <button
                onClick={() => setNoticeModal(null)}
                style={{ background: 'transparent', color: 'var(--text-dim)', padding: '4px', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{
              fontSize: '13px',
              color: 'var(--text-muted)',
              lineHeight: '1.7',
              whiteSpace: 'pre-line',
              background: 'var(--bg-app)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              padding: '12px 14px',
            }}>
              {noticeModal.message}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => setNoticeModal(null)}
                style={{
                  background: 'linear-gradient(135deg, #0d99ff 0%, #0284c7 100%)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '7px 22px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: '0 2px 10px rgba(13, 153, 255, 0.35)',
                }}
              >
                我知道了
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
