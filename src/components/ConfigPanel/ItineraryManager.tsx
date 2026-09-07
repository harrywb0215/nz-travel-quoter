import React from 'react';
import { Calendar, Plus, Trash2, ArrowUp, ArrowDown, Ban, CheckCircle2 } from 'lucide-react';
import { ItineraryItem } from '../../types/itinerary';

interface ItineraryManagerProps {
  itinerary: ItineraryItem[];
  onChange: (updated: ItineraryItem[]) => void;
}

export const ItineraryManager: React.FC<ItineraryManagerProps> = ({
  itinerary,
  onChange,
}) => {
  // 添加一天
  const handleAddDay = () => {
    const nextDayNum = itinerary.length + 1;
    const newItem: ItineraryItem = {
      id: `custom-day-${Date.now()}`,
      day: `Day ${nextDayNum}`,
      date: `1月${nextDayNum}日`,
      route: '待输入行程路线',
      activity: '',
      noCar: false,
    };
    onChange([...itinerary, newItem]);
  };

  // 删除某一天
  const handleDeleteDay = (id: string) => {
    if (itinerary.length <= 1) {
      alert('至少保留一天行程！');
      return;
    }
    const filtered = itinerary.filter((item) => item.id !== id);
    // 重新编排 Day 序号
    const reindexed = filtered.map((item, idx) => ({
      ...item,
      day: `Day ${idx + 1}`,
    }));
    onChange(reindexed);
  };

  // 切换不用车状态
  const handleToggleNoCar = (id: string) => {
    const updated = itinerary.map((item) => {
      if (item.id === id) {
        const nextNoCar = !item.noCar;
        return {
          ...item,
          noCar: nextNoCar,
          activity: nextNoCar ? (item.activity ? `${item.activity} (不用车)` : '不用车') : item.activity.replace(/\(?不用车\)?/g, '').trim(),
        };
      }
      return item;
    });
    onChange(updated);
  };

  // 移动排序
  const handleMove = (idx: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && idx === 0) || (direction === 'down' && idx === itinerary.length - 1)) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    const list = [...itinerary];
    const temp = list[idx];
    list[idx] = list[targetIdx];
    list[targetIdx] = temp;
    // 重新编排 Day 序号
    const reindexed = list.map((item, i) => ({
      ...item,
      day: `Day ${i + 1}`,
    }));
    onChange(reindexed);
  };

  return (
    <div style={{
      background: 'var(--bg-panel)',
      borderRadius: '8px',
      padding: '16px',
      border: '1px solid var(--border-subtle)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, fontSize: '14px' }}>
          <Calendar size={16} color="var(--figma-green)" />
          <span>行程天数列表 ({itinerary.length} 天)</span>
        </div>

        <button
          onClick={handleAddDay}
          style={{
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: '#34d399',
            fontSize: '12px',
            padding: '4px 8px',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <Plus size={13} />
          增加 1 天
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '380px', overflowY: 'auto', paddingRight: '4px' }}>
        {itinerary.map((item, idx) => (
          <div
            key={item.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: item.noCar ? 'rgba(239, 68, 68, 0.08)' : 'var(--bg-app)',
              border: item.noCar ? '1px solid rgba(239, 68, 68, 0.25)' : '1px solid var(--border-subtle)',
              borderRadius: '6px',
              padding: '6px 10px',
              fontSize: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '85px' }}>
              <span style={{ fontWeight: 600, color: item.noCar ? '#f87171' : 'var(--text-main)' }}>{item.day}</span>
              <span style={{ color: 'var(--text-dim)', fontSize: '11px' }}>{item.date}</span>
            </div>

            <div style={{ flex: 1, margin: '0 8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={item.route}>
              <span>{item.route || '未设定路线'}</span>
              {item.activity && (
                <span style={{ color: item.noCar ? '#f87171' : 'var(--text-muted)', marginLeft: '6px', fontSize: '11px' }}>
                  • {item.activity}
                </span>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <button
                onClick={() => handleToggleNoCar(item.id)}
                style={{
                  background: item.noCar ? '#ef4444' : 'transparent',
                  color: item.noCar ? '#ffffff' : 'var(--text-dim)',
                  border: item.noCar ? 'none' : '1px solid var(--border-subtle)',
                  borderRadius: '4px',
                  padding: '3px 6px',
                  fontSize: '11px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px',
                }}
                title={item.noCar ? '当前标记为不用车' : '点击标记为不用车'}
              >
                <Ban size={11} />
                {item.noCar ? '不用车' : '用车'}
              </button>

              <button
                onClick={() => handleMove(idx, 'up')}
                disabled={idx === 0}
                style={{ background: 'transparent', color: idx === 0 ? 'var(--text-dim)' : 'var(--text-muted)', padding: '3px' }}
                title="上移"
              >
                <ArrowUp size={12} />
              </button>

              <button
                onClick={() => handleMove(idx, 'down')}
                disabled={idx === itinerary.length - 1}
                style={{ background: 'transparent', color: idx === itinerary.length - 1 ? 'var(--text-dim)' : 'var(--text-muted)', padding: '3px' }}
                title="下移"
              >
                <ArrowDown size={12} />
              </button>

              <button
                onClick={() => handleDeleteDay(item.id)}
                style={{ background: 'transparent', color: '#f87171', padding: '3px' }}
                title="删除此天"
              >
                <Trash2 size={12} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
