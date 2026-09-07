import React from 'react';
import { Car, DollarSign, Plus, Trash2, HelpCircle } from 'lucide-react';
import { VehicleQuote, ItineraryItem } from '../../types/itinerary';
import { presetVehicles } from '../../constants/initialData';
import type { VehicleConfigItem, SystemConfig } from '../../utils/storage';
import { autoCalculateCostBreakdown } from '../../utils/costCalculator';

interface VehicleConfigProps {
  vehicleQuote: VehicleQuote;
  itinerary: ItineraryItem[];
  onChange: (updated: VehicleQuote) => void;
  onUpdateItinerary?: (updatedItinerary: ItineraryItem[]) => void;
  vehicleList?: VehicleConfigItem[];
  systemConfig?: SystemConfig;
}

export const VehicleConfig: React.FC<VehicleConfigProps> = ({
  vehicleQuote,
  itinerary,
  onChange,
  onUpdateItinerary,
  vehicleList,
  systemConfig,
}) => {
  const activeVehicles = vehicleList && vehicleList.length > 0 ? vehicleList : presetVehicles;

  // 计算实际需要用车的有效天数
  const totalDays = itinerary.length;
  const needCarDays = itinerary.filter((i) => !i.noCar).length;
  const noCarDays = totalDays - needCarDays;

  // 快捷更换车型并更新包含项中的车型文字，同时联动刷新底表明细
  const handleSelectModel = (modelName: string) => {
    const matched = activeVehicles.find((v) => v.name === modelName);
    const updatedInclusions = vehicleQuote.inclusions.map((inc) => {
      if (inc.startsWith('车：')) {
        return `车：${modelName}，燃油，机场卡，车辆保险`;
      }
      return inc;
    });

    if (systemConfig && onUpdateItinerary) {
      const { updatedItinerary, totalCarPrice } = autoCalculateCostBreakdown(
        itinerary,
        modelName,
        systemConfig
      );
      onUpdateItinerary(updatedItinerary);
      onChange({
        ...vehicleQuote,
        vehicleModel: modelName,
        inclusions: updatedInclusions,
        totalPrice: totalCarPrice > 0 ? totalCarPrice : vehicleQuote.totalPrice,
      });
    } else {
      const dayPrice = (matched as any)?.southIslandPrice || (matched as any)?.baseDayPrice || 850;
      const estimatedPrice = dayPrice * needCarDays;

      onChange({
        ...vehicleQuote,
        vehicleModel: modelName,
        inclusions: updatedInclusions,
        totalPrice: estimatedPrice || vehicleQuote.totalPrice,
      });
    }
  };

  // 修改价格包含项
  const updateInclusion = (idx: number, val: string) => {
    const list = [...vehicleQuote.inclusions];
    list[idx] = val;
    onChange({ ...vehicleQuote, inclusions: list });
  };

  // 修改价格不含项
  const updateExclusion = (idx: number, val: string) => {
    const list = [...vehicleQuote.exclusions];
    list[idx] = val;
    onChange({ ...vehicleQuote, exclusions: list });
  };

  // 修改说明项
  const updateNote = (idx: number, val: string) => {
    const list = [...vehicleQuote.notes];
    list[idx] = val;
    onChange({ ...vehicleQuote, notes: list });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* 1. 用车总价与车型 */}
      <div style={{
        background: 'var(--bg-panel)',
        borderRadius: '8px',
        padding: '16px',
        border: '1px solid var(--border-subtle)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, fontSize: '14px' }}>
            <Car size={16} color="var(--figma-amber)" />
            <span>1. 行程用车总报价</span>
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
            总计 {totalDays} 天 (用车 {needCarDays} 天{noCarDays > 0 ? `，${noCarDays}天不用车` : ''})
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
              预设车型
            </label>
            <select
              value={vehicleQuote.vehicleModel}
              onChange={(e) => handleSelectModel(e.target.value)}
              style={{ width: '100%' }}
            >
              {activeVehicles.map((v) => (
                <option key={v.id} value={v.name}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
              用车总报价 (NZD)
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="number"
                value={vehicleQuote.totalPrice}
                onChange={(e) => onChange({ ...vehicleQuote, totalPrice: Number(e.target.value) || 0 })}
                style={{
                  width: '100%',
                  paddingLeft: '32px',
                  fontWeight: 700,
                  fontSize: '15px',
                  color: '#fbbf24',
                }}
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
          <strong>1. 以上行程用车：{vehicleQuote.currency} {vehicleQuote.totalPrice.toLocaleString()}</strong>
        </div>
      </div>

      {/* 2. 价格包含 */}
      <div style={{
        background: 'var(--bg-panel)',
        borderRadius: '8px',
        padding: '16px',
        border: '1px solid var(--border-subtle)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <span style={{ fontSize: '13px', fontWeight: 600 }}>价格包含条款</span>
          <button
            onClick={() => onChange({ ...vehicleQuote, inclusions: [...vehicleQuote.inclusions, ''] })}
            style={{
              background: 'transparent',
              color: 'var(--figma-blue)',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '2px',
            }}
          >
            <Plus size={13} /> 增加一条
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {vehicleQuote.inclusions.map((item, idx) => (
            <div key={idx} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <input
                type="text"
                value={item}
                onChange={(e) => updateInclusion(idx, e.target.value)}
                style={{ flex: 1 }}
              />
              <button
                onClick={() => {
                  const list = vehicleQuote.inclusions.filter((_, i) => i !== idx);
                  onChange({ ...vehicleQuote, inclusions: list });
                }}
                style={{ background: 'transparent', color: 'var(--text-dim)', padding: '4px' }}
                title="删除"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 3. 价格不含 */}
      <div style={{
        background: 'var(--bg-panel)',
        borderRadius: '8px',
        padding: '16px',
        border: '1px solid var(--border-subtle)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <span style={{ fontSize: '13px', fontWeight: 600 }}>价格不含条款 (带序号)</span>
          <button
            onClick={() => onChange({ ...vehicleQuote, exclusions: [...vehicleQuote.exclusions, ''] })}
            style={{
              background: 'transparent',
              color: 'var(--figma-blue)',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '2px',
            }}
          >
            <Plus size={13} /> 增加一条
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {vehicleQuote.exclusions.map((item, idx) => (
            <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{
                width: '20px',
                textAlign: 'center',
                fontSize: '12px',
                color: 'var(--text-dim)',
                fontWeight: 600,
              }}>
                {idx + 1}
              </span>
              <input
                type="text"
                value={item}
                onChange={(e) => updateExclusion(idx, e.target.value)}
                style={{ flex: 1 }}
              />
              <button
                onClick={() => {
                  const list = vehicleQuote.exclusions.filter((_, i) => i !== idx);
                  onChange({ ...vehicleQuote, exclusions: list });
                }}
                style={{ background: 'transparent', color: 'var(--text-dim)', padding: '4px' }}
                title="删除"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 4. 说明条款 */}
      <div style={{
        background: 'var(--bg-panel)',
        borderRadius: '8px',
        padding: '16px',
        border: '1px solid var(--border-subtle)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <span style={{ fontSize: '13px', fontWeight: 600 }}>说明条款 (工时超时/有效期)</span>
          <button
            onClick={() => onChange({ ...vehicleQuote, notes: [...vehicleQuote.notes, ''] })}
            style={{
              background: 'transparent',
              color: 'var(--figma-blue)',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '2px',
            }}
          >
            <Plus size={13} /> 增加一条
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {vehicleQuote.notes.map((item, idx) => (
            <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{
                width: '20px',
                textAlign: 'center',
                fontSize: '12px',
                color: 'var(--text-dim)',
                fontWeight: 600,
              }}>
                {idx + 1}
              </span>
              <input
                type="text"
                value={item}
                onChange={(e) => updateNote(idx, e.target.value)}
                style={{ flex: 1 }}
              />
              <button
                onClick={() => {
                  const list = vehicleQuote.notes.filter((_, i) => i !== idx);
                  onChange({ ...vehicleQuote, notes: list });
                }}
                style={{ background: 'transparent', color: 'var(--text-dim)', padding: '4px' }}
                title="删除"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
