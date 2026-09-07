import React, { useState, useEffect, useMemo } from 'react';
import { X, Search, Check, MapPin, CheckSquare, Square, Trash2, RotateCcw, Sparkles } from 'lucide-react';
import { presetActivities } from '../constants/initialData';
import { PresetActivity, ActivityQuote } from '../types/itinerary';

interface ActivityLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  activityQuote: ActivityQuote;
  onUpdateQuote: (updated: ActivityQuote) => void;
  activityLibrary?: PresetActivity[];
}

export const ActivityLibraryModal: React.FC<ActivityLibraryModalProps> = ({
  isOpen,
  onClose,
  activityQuote,
  onUpdateQuote,
  activityLibrary = presetActivities,
}) => {
  const [search, setSearch] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // 每次打开弹窗时，根据当前 quoteDoc 中的包含活动智能初始化勾选集合
  useEffect(() => {
    if (!isOpen) return;

    const initialSet = new Set<string>();
    const currentText = (activityQuote.customActivityText || '').toLowerCase();
    const currentList = activityQuote.includedActivities || [];

    // 如果成人价格为 0 且无项目，视为纯包车，不勾选任何项目
    if (activityQuote.adultPrice === 0 && currentList.length === 0 && (!currentText || currentText.includes('暂不含门票'))) {
      setSelectedIds(new Set());
      return;
    }

    activityLibrary.forEach((act) => {
      const matchInList = currentList.some((name) => 
        name.includes(act.name) || act.name.includes(name)
      );
      // 提取活动主要关键字匹配
      const mainKeyword = act.name.split(' ')[0].replace(/[+（(].*$/, '').trim().toLowerCase();
      const matchInText = mainKeyword.length >= 2 && currentText.includes(mainKeyword);

      if (matchInList || matchInText) {
        initialSet.add(act.id);
      }
    });

    setSelectedIds(initialSet);
  }, [isOpen, activityQuote, activityLibrary]);

  if (!isOpen) return null;

  // 提取所有地点分类
  const locations = ['all', ...Array.from(new Set(activityLibrary.map((a) => a.location)))];

  const filtered = activityLibrary.filter((act) => {
    const matchLoc = selectedLocation === 'all' || act.location.includes(selectedLocation);
    const matchSearch = act.name.toLowerCase().includes(search.toLowerCase()) ||
      (act.description && act.description.toLowerCase().includes(search.toLowerCase()));
    return matchLoc && matchSearch;
  });

  // 切换勾选/反选单项
  const handleToggle = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  // 一键全选当前筛选
  const handleSelectAllFiltered = () => {
    const next = new Set(selectedIds);
    filtered.forEach((act) => next.add(act.id));
    setSelectedIds(next);
  };

  // 一键清空所有勾选（从零自选）
  const handleClearAll = () => {
    setSelectedIds(new Set());
  };

  // 动态实时求和计算已选项目费用
  const { totalAdultPrice, totalChildPrice, selectedCount, selectedItems } = useMemo(() => {
    let adultSum = 0;
    let childSum = 0;
    const items: PresetActivity[] = [];

    activityLibrary.forEach((act) => {
      if (selectedIds.has(act.id)) {
        adultSum += act.adultPrice || 0;
        childSum += act.childPrice || 0;
        items.push(act);
      }
    });

    return {
      totalAdultPrice: adultSum,
      totalChildPrice: childSum,
      selectedCount: items.length,
      selectedItems: items,
    };
  }, [selectedIds, activityLibrary]);

  // 确认应用勾选结果到主报价单
  const handleConfirmApply = () => {
    const actNames = selectedItems.map((a) => a.name);
    const newText = actNames.length > 0 
      ? actNames.join('；') 
      : '暂不含门票与自选玩乐项目（纯用车包车服务）';

    onUpdateQuote({
      ...activityQuote,
      adultPrice: totalAdultPrice,
      childPrice: totalChildPrice > 0 ? totalChildPrice : undefined,
      includedActivities: actNames,
      customActivityText: newText,
    });

    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.78)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
    }}>
      <div style={{
        background: 'var(--bg-topbar)',
        border: '1px solid var(--border-strong)',
        borderRadius: '12px',
        width: '780px',
        maxWidth: '94vw',
        maxHeight: '88vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 24px 60px rgba(0,0,0,0.75)',
        overflow: 'hidden',
      }}>
        {/* 顶部标题栏 */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600 }}>新西兰门票与特色活动价格库</h3>
              <span style={{
                fontSize: '11px',
                background: 'rgba(56, 189, 248, 0.12)',
                color: '#38bdf8',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                padding: '1px 8px',
                borderRadius: '10px',
                fontWeight: 500,
              }}>
                多选与即时算价
              </span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '3px' }}>
              直接勾选/取消勾选项目，系统自动精确求和并生成活动包含清单
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', color: 'var(--text-muted)', padding: '6px', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* 搜索与工具栏 */}
        <div style={{
          padding: '12px 20px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={15} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-dim)' }} />
              <input
                type="text"
                placeholder="搜索活动（如：霍比特、缆车、观鲸、冰川、萤火虫...）"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ width: '100%', paddingLeft: '32px' }}
              />
            </div>

            {/* 批量操作工具 */}
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                onClick={handleClearAll}
                style={{
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  color: '#f87171',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: 'pointer',
                  fontWeight: 500,
                }}
                title="清空所有已选活动，从零开始自选"
              >
                <Trash2 size={13} />
                <span>清空重选</span>
              </button>

              <button
                onClick={handleSelectAllFiltered}
                style={{
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-main)',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: 'pointer',
                  fontWeight: 500,
                }}
              >
                <span>全选当前</span>
              </button>
            </div>
          </div>

          {/* 地区快速筛选 */}
          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
            {locations.map((loc) => (
              <button
                key={loc}
                onClick={() => setSelectedLocation(loc)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '11.5px',
                  whiteSpace: 'nowrap',
                  background: selectedLocation === loc ? 'var(--figma-blue)' : 'var(--bg-input)',
                  color: selectedLocation === loc ? '#ffffff' : 'var(--text-muted)',
                  border: `1px solid ${selectedLocation === loc ? 'var(--figma-blue)' : 'var(--border-subtle)'}`,
                  cursor: 'pointer',
                }}
              >
                {loc === 'all' ? '全部地区' : loc}
              </button>
            ))}
          </div>
        </div>

        {/* 活动列表 */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-dim)', fontSize: '13px' }}>
              未找到匹配的景点门票活动，请更换关键词搜索
            </div>
          ) : (
            filtered.map((act) => {
              const isChecked = selectedIds.has(act.id);
              return (
                <div
                  key={act.id}
                  onClick={() => handleToggle(act.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: isChecked ? 'rgba(13, 153, 255, 0.08)' : 'var(--bg-panel)',
                    border: `1px solid ${isChecked ? 'rgba(13, 153, 255, 0.45)' : 'var(--border-subtle)'}`,
                    borderRadius: '8px',
                    padding: '12px 16px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!isChecked) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isChecked) e.currentTarget.style.borderColor = 'var(--border-subtle)';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, marginRight: '16px' }}>
                    {/* Checkbox 勾选框 */}
                    <div style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '5px',
                      border: `1.5px solid ${isChecked ? 'var(--figma-blue)' : 'var(--border-strong)'}`,
                      background: isChecked ? 'var(--figma-blue)' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ffffff',
                      flexShrink: 0,
                      transition: 'all 0.15s ease',
                    }}>
                      {isChecked && <Check size={14} strokeWidth={3} />}
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                        <span style={{ fontWeight: 600, fontSize: '13.5px', color: isChecked ? '#60a5fa' : 'var(--text-main)' }}>
                          {act.name}
                        </span>
                        <span style={{
                          fontSize: '10.5px',
                          background: 'rgba(255,255,255,0.06)',
                          padding: '1px 6px',
                          borderRadius: '4px',
                          color: 'var(--text-muted)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '3px',
                        }}>
                          <MapPin size={10} />
                          {act.location}
                        </span>
                      </div>
                      {act.description && (
                        <p style={{ fontSize: '11.5px', color: 'var(--text-dim)', lineHeight: '1.4' }}>
                          {act.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexShrink: 0 }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '15px', fontWeight: 700, color: '#60a5fa' }}>
                        NZD {act.adultPrice}
                        <span style={{ fontSize: '11px', fontWeight: 400, color: 'var(--text-dim)', marginLeft: '2px' }}>/成人</span>
                      </div>
                      {act.childPrice ? (
                        <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                          儿童 NZD {act.childPrice}
                        </div>
                      ) : null}
                    </div>

                    <div style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '11.5px',
                      fontWeight: 500,
                      background: isChecked ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.05)',
                      color: isChecked ? '#34d399' : 'var(--text-dim)',
                      border: `1px solid ${isChecked ? 'rgba(16, 185, 129, 0.3)' : 'transparent'}`,
                      minWidth: '60px',
                      textAlign: 'center',
                    }}>
                      {isChecked ? '已勾选' : '+ 勾选'}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* 底部实时统计与应用操作栏 */}
        <div style={{
          padding: '14px 20px',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'var(--bg-panel)',
        }}>
          {/* 左侧实时金额统计指示 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              已勾选: <strong style={{ color: 'var(--text-main)', fontSize: '14px' }}>{selectedCount}</strong> 项活动
            </span>
            <div style={{ width: '1px', height: '14px', background: 'var(--border-subtle)' }} />
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              成人门票合计: <strong style={{ color: '#60a5fa', fontSize: '15px' }}>NZD {totalAdultPrice}</strong> /人
            </span>
            {totalChildPrice > 0 && (
              <>
                <div style={{ width: '1px', height: '14px', background: 'var(--border-subtle)' }} />
                <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
                  儿童: NZD {totalChildPrice} /人
                </span>
              </>
            )}
          </div>

          {/* 右侧确认按钮 */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-muted)',
                padding: '7px 16px',
                borderRadius: '6px',
                fontSize: '12.5px',
                cursor: 'pointer',
              }}
            >
              取消
            </button>

            <button
              onClick={handleConfirmApply}
              style={{
                background: 'linear-gradient(135deg, #0d99ff 0%, #0284c7 100%)',
                color: '#ffffff',
                padding: '7px 20px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 10px rgba(13, 153, 255, 0.35)',
                cursor: 'pointer',
              }}
            >
              <Check size={14} />
              <span>确认应用 (NZD {totalAdultPrice}/人)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
