import React, { useState } from 'react';
import { Header } from './components/Header';
import { VehicleConfig } from './components/ConfigPanel/VehicleConfig';
import { ActivityConfig } from './components/ConfigPanel/ActivityConfig';
import { ItineraryManager } from './components/ConfigPanel/ItineraryManager';
import { QuotePaperPreview } from './components/PreviewCanvas/QuotePaperPreview';
import { ActivityLibraryModal } from './components/ActivityLibraryModal';
import { SettingsModal } from './components/SettingsModal';
import { standard18DaysQuoteDoc } from './constants/initialData';
import { getSystemConfig, SystemConfig } from './utils/storage';
import type { QuoteDocument, ItineraryItem } from './types/itinerary';
import { exportQuoteToExcel } from './utils/excelExporter';
import { Car, Ticket, Calendar, ZoomIn, ZoomOut, Maximize2, Sparkles, CheckCircle2 } from 'lucide-react';

export function App() {
  const [quoteDoc, setQuoteDoc] = useState<QuoteDocument>(standard18DaysQuoteDoc);
  const [systemConfig, setSystemConfig] = useState<SystemConfig>(getSystemConfig());
  const [activeTab, setActiveTab] = useState<'vehicle' | 'activity' | 'itinerary'>('vehicle');
  const [scale, setScale] = useState<number>(0.92);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showToast, setShowToast] = useState(false);

  // 导出带报价 Excel
  const handleExportExcel = async () => {
    try {
      setIsExporting(true);
      await exportQuoteToExcel(quoteDoc, `${quoteDoc.title || '26.12.18 南北岛18天'}.xlsx`);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3500);
    } catch (err: any) {
      alert('导出 Excel 失败：' + (err.message || '未知错误'));
    } finally {
      setIsExporting(false);
    }
  };

  // 在画布上直接行内编辑行程条目
  const handleUpdateItineraryItem = (idx: number, field: keyof ItineraryItem, val: any) => {
    const list = [...quoteDoc.itinerary];
    list[idx] = {
      ...list[idx],
      [field]: val,
    };
    if (field === 'activity' && typeof val === 'string') {
      list[idx].noCar = val.includes('不用车');
    }
    setQuoteDoc({ ...quoteDoc, itinerary: list });
  };

  return (
    <div className="app-container">
      {/* 1. 顶部 Figma 风格工具栏 */}
      <Header
        quoteDoc={quoteDoc}
        onUpdateDoc={setQuoteDoc}
        onExportExcel={handleExportExcel}
        onOpenActivityLibrary={() => setIsLibraryOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        isExporting={isExporting}
      />

      {/* 2. 主工作区：左侧配置面板 + 右侧高保真画布 */}
      <div className="main-workspace">
        {/* 左侧 Inspector 面板 */}
        <aside className="left-inspector">
          {/* Tab 导航切换 */}
          <div style={{
            display: 'flex',
            borderBottom: '1px solid var(--border-subtle)',
            background: 'var(--bg-topbar)',
            padding: '4px 8px',
            gap: '4px',
          }}>
            <button
              onClick={() => setActiveTab('vehicle')}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                background: activeTab === 'vehicle' ? 'var(--bg-panel)' : 'transparent',
                color: activeTab === 'vehicle' ? '#fbbf24' : 'var(--text-muted)',
                border: activeTab === 'vehicle' ? '1px solid var(--border-subtle)' : '1px solid transparent',
              }}
            >
              <Car size={14} />
              1. 用车报价
            </button>

            <button
              onClick={() => setActiveTab('activity')}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                background: activeTab === 'activity' ? 'var(--bg-panel)' : 'transparent',
                color: activeTab === 'activity' ? '#38bdf8' : 'var(--text-muted)',
                border: activeTab === 'activity' ? '1px solid var(--border-subtle)' : '1px solid transparent',
              }}
            >
              <Ticket size={14} />
              2. 活动门票
            </button>

            <button
              onClick={() => setActiveTab('itinerary')}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                background: activeTab === 'itinerary' ? 'var(--bg-panel)' : 'transparent',
                color: activeTab === 'itinerary' ? '#34d399' : 'var(--text-muted)',
                border: activeTab === 'itinerary' ? '1px solid var(--border-subtle)' : '1px solid transparent',
              }}
            >
              <Calendar size={14} />
              3. 行程管理
            </button>
          </div>

          {/* Tab 对应内容区 */}
          <div style={{ flex: 1, padding: '16px', overflowY: 'auto' }}>
            {activeTab === 'vehicle' && (
              <VehicleConfig
                vehicleQuote={quoteDoc.vehicleQuote}
                itinerary={quoteDoc.itinerary}
                vehicleList={systemConfig.vehicleList}
                onChange={(updated) => setQuoteDoc({ ...quoteDoc, vehicleQuote: updated })}
              />
            )}

            {activeTab === 'activity' && (
              <ActivityConfig
                activityQuote={quoteDoc.activityQuote}
                itinerary={quoteDoc.itinerary}
                onChange={(updated) => setQuoteDoc({ ...quoteDoc, activityQuote: updated })}
                onOpenLibrary={() => setIsLibraryOpen(true)}
              />
            )}

            {activeTab === 'itinerary' && (
              <ItineraryManager
                itinerary={quoteDoc.itinerary}
                onChange={(updated) => setQuoteDoc({ ...quoteDoc, itinerary: updated })}
              />
            )}
          </div>
        </aside>

        {/* 右侧所见即所得图二预览视口 */}
        <main className="right-canvas-viewport">
          {/* 画布悬浮控制条 */}
          <div className="canvas-floating-controls">
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Sparkles size={13} color="var(--figma-amber)" />
              标准格式预览（对齐 26.12.18 南北岛18天.xlsx）
            </span>

            <div style={{ width: '1px', height: '14px', background: 'var(--border-subtle)' }} />

            {/* 缩放控制器 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                onClick={() => setScale((s) => Math.max(0.6, Number((s - 0.1).toFixed(2))))}
                style={{ background: 'transparent', color: 'var(--text-muted)', padding: '2px' }}
                title="缩小"
              >
                <ZoomOut size={14} />
              </button>
              <span style={{ fontSize: '11px', minWidth: '34px', textAlign: 'center', color: 'var(--text-dim)' }}>
                {Math.round(scale * 100)}%
              </span>
              <button
                onClick={() => setScale((s) => Math.min(1.4, Number((s + 0.1).toFixed(2))))}
                style={{ background: 'transparent', color: 'var(--text-muted)', padding: '2px' }}
                title="放大"
              >
                <ZoomIn size={14} />
              </button>
              <button
                onClick={() => setScale(0.92)}
                style={{ background: 'transparent', color: 'var(--text-muted)', padding: '2px' }}
                title="重置缩放"
              >
                <Maximize2 size={13} />
              </button>
            </div>
          </div>

          {/* 纸张主体 */}
          <QuotePaperPreview
            quoteDoc={quoteDoc}
            onUpdateItineraryItem={handleUpdateItineraryItem}
            onUpdatePsNote={(ps) => setQuoteDoc({ ...quoteDoc, psNote: ps })}
            scale={scale}
          />
        </main>
      </div>

      {/* 导出成功气泡通知 */}
      {showToast && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          background: 'rgba(16, 185, 129, 0.95)',
          color: '#ffffff',
          padding: '12px 20px',
          borderRadius: '8px',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          zIndex: 999,
          fontSize: '13px',
          fontWeight: 500,
        }}>
          <CheckCircle2 size={18} />
          <span>已成功生成并导出对齐标准的 Excel 报价单！</span>
        </div>
      )}

      {/* 门票价格库弹窗 */}
      <ActivityLibraryModal
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
        activityQuote={quoteDoc.activityQuote}
        activityLibrary={systemConfig.activityLibrary}
        onUpdateQuote={(updated) => setQuoteDoc({ ...quoteDoc, activityQuote: updated })}
      />

      {/* 业务参数与价格设置弹窗 */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        config={systemConfig}
        onUpdateConfig={setSystemConfig}
      />
    </div>
  );
}
export default App;
