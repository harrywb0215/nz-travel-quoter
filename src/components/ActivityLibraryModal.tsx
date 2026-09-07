import React, { useState } from 'react';
import { X, Search, Plus, Check, MapPin, DollarSign } from 'lucide-react';
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

  if (!isOpen) return null;

  // 提取所有地点分类
  const locations = ['all', ...Array.from(new Set(activityLibrary.map((a) => a.location)))];

  const filtered = activityLibrary.filter((act) => {
    const matchLoc = selectedLocation === 'all' || act.location.includes(selectedLocation);
    const matchSearch = act.name.toLowerCase().includes(search.toLowerCase()) ||
      (act.description && act.description.toLowerCase().includes(search.toLowerCase()));
    return matchLoc && matchSearch;
  });

  // 判断是否已在包含清单中
  const isIncluded = (name: string) => {
    const currentText = activityQuote.customActivityText || activityQuote.includedActivities.join('；');
    return currentText.includes(name.split(' ')[0]);
  };

  // 添加某活动并累加金额
  const handleToggleActivity = (act: PresetActivity) => {
    const cleanName = act.name.split(' ')[0] + (act.name.includes('+') ? ' + 游玩' : '');
    const currentText = activityQuote.customActivityText || activityQuote.includedActivities.join('；');

    if (currentText.includes(cleanName)) {
      // 已经存在，提示
      alert(`活动 "${cleanName}" 已在包含清单中`);
      return;
    }

    const newText = currentText ? `${currentText}；${act.name}` : act.name;
    const newAdultTotal = (activityQuote.adultPrice || 0) + act.adultPrice;

    onUpdateQuote({
      ...activityQuote,
      customActivityText: newText,
      adultPrice: newAdultTotal,
      includedActivities: [...activityQuote.includedActivities, act.name],
    });
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.75)',
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
        width: '750px',
        maxWidth: '92vw',
        maxHeight: '85vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 24px 60px rgba(0,0,0,0.7)',
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
            <h3 style={{ fontSize: '16px', fontWeight: 600 }}>新西兰门票与特色活动价格库</h3>
            <p style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '2px' }}>
              点击活动直接添加到报价单“活动包含”中，并自动累加成人门票费用
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', color: 'var(--text-muted)', padding: '6px' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* 搜索与地区筛选 */}
        <div style={{
          padding: '12px 20px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          gap: '12px',
          alignItems: 'center',
        }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={15} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-dim)' }} />
            <input
              type="text"
              placeholder="搜索活动名称或关键字（如：缆车、霍比特村、萤火虫...）"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '100%', paddingLeft: '32px' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', maxWidth: '340px' }}>
            {locations.map((loc) => (
              <button
                key={loc}
                onClick={() => setSelectedLocation(loc)}
                style={{
                  padding: '6px 10px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  whiteSpace: 'nowrap',
                  background: selectedLocation === loc ? 'var(--figma-blue)' : 'var(--bg-input)',
                  color: selectedLocation === loc ? '#ffffff' : 'var(--text-muted)',
                }}
              >
                {loc === 'all' ? '全部地区' : loc}
              </button>
            ))}
          </div>
        </div>

        {/* 列表 */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filtered.map((act) => {
            const added = isIncluded(act.name);
            return (
              <div
                key={act.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'var(--bg-panel)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  padding: '12px 16px',
                  transition: 'background 0.15s ease',
                }}
              >
                <div style={{ flex: 1, marginRight: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 600, fontSize: '14px' }}>{act.name}</span>
                    <span style={{
                      fontSize: '11px',
                      background: 'rgba(255,255,255,0.06)',
                      padding: '2px 6px',
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
                    <p style={{ fontSize: '12px', color: 'var(--text-dim)' }}>{act.description}</p>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: '#60a5fa' }}>
                      NZD {act.adultPrice}
                    </div>
                    {act.childPrice && (
                      <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                        儿童 NZD {act.childPrice}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => handleToggleActivity(act)}
                    style={{
                      background: added ? 'rgba(16, 185, 129, 0.2)' : 'var(--figma-blue)',
                      color: added ? '#34d399' : '#ffffff',
                      border: added ? '1px solid rgba(16, 185, 129, 0.4)' : 'none',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 500,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    {added ? (
                      <>
                        <Check size={13} />
                        已添加
                      </>
                    ) : (
                      <>
                        <Plus size={13} />
                        加入报价
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* 底部 */}
        <div style={{
          padding: '12px 20px',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'flex-end',
          background: 'var(--bg-topbar)',
        }}>
          <button
            onClick={onClose}
            style={{
              background: 'var(--figma-blue)',
              color: '#ffffff',
              padding: '7px 18px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 500,
            }}
          >
            完成
          </button>
        </div>
      </div>
    </div>
  );
};
