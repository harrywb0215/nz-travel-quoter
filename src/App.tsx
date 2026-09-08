import React, { useState } from 'react';
import { Header } from './components/Header';
import { OverviewDashboard } from './components/Dashboard/OverviewDashboard';
import { VehicleConfig } from './components/ConfigPanel/VehicleConfig';
import { ActivityConfig } from './components/ConfigPanel/ActivityConfig';
import { ItineraryManager } from './components/ConfigPanel/ItineraryManager';
import { QuotePaperPreview } from './components/PreviewCanvas/QuotePaperPreview';
import { ActivityLibraryModal } from './components/ActivityLibraryModal';
import { SettingsModal } from './components/SettingsModal';
import { standard18DaysQuoteDoc } from './constants/initialData';
import { getSystemConfig, SystemConfig, saveQuoteToHistory } from './utils/storage';
import type { QuoteDocument, ItineraryItem } from './types/itinerary';
import { exportQuoteToExcel } from './utils/excelExporter';
import { autoCalculateCostBreakdown } from './utils/costCalculator';
import { 
  LayoutDashboard, 
  SlidersHorizontal, 
  FileCheck2, 
  Car, 
  Ticket, 
  Calendar, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Sparkles, 
  CheckCircle2,
  Eye,
  ArrowRight
} from 'lucide-react';

export function App() {
  const [quoteDoc, setQuoteDoc] = useState<QuoteDocument>(standard18DaysQuoteDoc);
  const [systemConfig, setSystemConfig] = useState<SystemConfig>(getSystemConfig());
  
  // 核心视图模式：overview (首页概览与图片识别，默认) | editor (双栏工作台) | preview (纯预览)
  const [viewMode, setViewMode] = useState<'overview' | 'editor' | 'preview'>('overview');
  
  const [activeTab, setActiveTab] = useState<'vehicle' | 'activity' | 'itinerary'>('vehicle');
  const [scale, setScale] = useState<number>(0.92);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('已成功生成并导出对齐标准的 Excel 报价单！');

  // 确认生成标准报价并自动跳转至标签 3 查看和下载
  const handleConfirmAndGenerate = () => {
    saveQuoteToHistory(quoteDoc);
    setViewMode('preview');
    setToastMessage('🎉 标准商业报价已确认生成！已自动为您切换至最终标准 Excel 预览与下载页面。');
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3500);
  };

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

  // 核心联动：更新行程列表并实时自动重算底表与用车总报价
  const handleUpdateItineraryWithRecalculation = (newItinerary: ItineraryItem[]) => {
    const { updatedItinerary, totalCarPrice } = autoCalculateCostBreakdown(
      newItinerary,
      quoteDoc.vehicleQuote.vehicleModel,
      systemConfig
    );
    setQuoteDoc(prev => ({
      ...prev,
      itinerary: updatedItinerary,
      vehicleQuote: {
        ...prev.vehicleQuote,
        carDays: updatedItinerary.filter(i => !i.noCar).length,
        totalPrice: totalCarPrice,
      },
    }));
  };

  // 核心联动：切换车型并实时原子化重算整单底表与总报价
  const handleSelectVehicleModel = (modelName: string) => {
    const { updatedItinerary, totalCarPrice } = autoCalculateCostBreakdown(
      quoteDoc.itinerary,
      modelName,
      systemConfig
    );

    const updatedInclusions = quoteDoc.vehicleQuote.inclusions.map((inc) => {
      if (inc.startsWith('车：')) {
        return `车：${modelName}，燃油，机场卡，车辆保险`;
      }
      return inc;
    });

    setQuoteDoc((prev) => ({
      ...prev,
      itinerary: updatedItinerary,
      vehicleQuote: {
        ...prev.vehicleQuote,
        vehicleModel: modelName,
        inclusions: updatedInclusions,
        carDays: updatedItinerary.filter((i) => !i.noCar).length,
        totalPrice: totalCarPrice > 0 ? totalCarPrice : prev.vehicleQuote.totalPrice,
      },
    }));
  };

  // 在画布上直接行内编辑行程条目并智能联动重算
  const handleUpdateItineraryItem = (idx: number, field: keyof ItineraryItem, val: any) => {
    const list = [...quoteDoc.itinerary];
    const isActivityChange = field === 'activity' && typeof val === 'string';
    const isRouteChange = field === 'route' && typeof val === 'string';

    list[idx] = {
      ...list[idx],
      [field]: val,
    };
    if (isActivityChange) {
      list[idx].noCar = val.includes('不用车');
    }

    if (isActivityChange || isRouteChange) {
      handleUpdateItineraryWithRecalculation(list);
    } else {
      setQuoteDoc(prev => ({ ...prev, itinerary: list }));
    }
  };

  return (
    <div className="app-container">
      {/* 1. 顶部 Header */}
      <Header
        quoteDoc={quoteDoc}
        onUpdateDoc={setQuoteDoc}
        onExportExcel={handleExportExcel}
        onOpenActivityLibrary={() => setIsLibraryOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        isExporting={isExporting}
      />

      {/* 2. 页面主视图导航控制器 (清晰的三段式业务心智) */}
      <div style={{
        background: 'var(--bg-topbar)',
        borderBottom: '1px solid var(--border-subtle)',
        padding: '6px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 15,
      }}>
        <div style={{
          display: 'flex',
          background: 'var(--bg-input)',
          padding: '3px',
          borderRadius: '8px',
          border: '1px solid var(--border-subtle)',
          gap: '3px',
        }}>
          <button
            onClick={() => setViewMode('overview')}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '12.5px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: viewMode === 'overview' ? 'var(--figma-blue)' : 'transparent',
              color: viewMode === 'overview' ? '#ffffff' : 'var(--text-muted)',
            }}
          >
            <LayoutDashboard size={14} />
            1. 首页与智能识别 (报价方/客户/图片识别)
          </button>

          <button
            onClick={() => setViewMode('editor')}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '12.5px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: viewMode === 'editor' ? 'var(--figma-blue)' : 'transparent',
              color: viewMode === 'editor' ? '#ffffff' : 'var(--text-muted)',
            }}
          >
            <SlidersHorizontal size={14} />
            2. 参数微调工作台 (用车/活动/行程管理)
          </button>

          <button
            onClick={() => setViewMode('preview')}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '12.5px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: viewMode === 'preview' ? 'var(--figma-blue)' : 'transparent',
              color: viewMode === 'preview' ? '#ffffff' : 'var(--text-muted)',
            }}
          >
            <FileCheck2 size={14} />
            3. 最终标准 Excel 预览与下载
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', color: 'var(--text-dim)' }}>
          <span>当前单据: <strong style={{ color: 'var(--text-main)' }}>{quoteDoc.title}</strong></span>
          <span>•</span>
          <span>客户: <strong style={{ color: '#60a5fa' }}>{quoteDoc.clientInfo?.name}</strong></span>
          <span>•</span>
          <span>行程: <strong style={{ color: '#34d399' }}>{quoteDoc.itinerary?.length} 天</strong></span>
        </div>
      </div>

      {/* 3. 页面主工作区切换 */}
      {viewMode === 'overview' && (
        <OverviewDashboard
          quoteDoc={quoteDoc}
          onUpdateDoc={setQuoteDoc}
          onSwitchToPreview={() => setViewMode('preview')}
          onSwitchToEditor={() => setViewMode('editor')}
          onExportExcel={handleExportExcel}
          onOpenActivityLibrary={() => setIsLibraryOpen(true)}
        />
      )}

      {viewMode === 'editor' && (
        <div className="main-workspace">
          {/* 左侧 Inspector 面板 */}
          <aside className="left-inspector">
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
                用车报价
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
                活动门票
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
                行程管理
              </button>
            </div>

            <div style={{ flex: 1, padding: '16px', overflowY: 'auto' }}>
              {activeTab === 'vehicle' && (
                <VehicleConfig
                  vehicleQuote={quoteDoc.vehicleQuote}
                  itinerary={quoteDoc.itinerary}
                  vehicleList={systemConfig.vehicleList}
                  systemConfig={systemConfig}
                  onSelectModel={handleSelectVehicleModel}
                  onUpdateItinerary={handleUpdateItineraryWithRecalculation}
                  onChange={(updated) => setQuoteDoc(prev => ({ ...prev, vehicleQuote: updated }))}
                />
              )}

              {activeTab === 'activity' && (
                <ActivityConfig
                  activityQuote={quoteDoc.activityQuote}
                  itinerary={quoteDoc.itinerary}
                  onChange={(updated) => setQuoteDoc(prev => ({ ...prev, activityQuote: updated }))}
                  onOpenLibrary={() => setIsLibraryOpen(true)}
                />
              )}

              {activeTab === 'itinerary' && (
                <ItineraryManager
                  itinerary={quoteDoc.itinerary}
                  onChange={handleUpdateItineraryWithRecalculation}
                />
              )}
            </div>

            {/* 左侧面板底部常驻操作栏 */}
            <div style={{
              padding: '12px 16px',
              borderTop: '1px solid var(--border-subtle)',
              background: 'var(--bg-topbar)',
              display: 'flex',
              gap: '8px',
              alignItems: 'center',
            }}>
              <button
                onClick={() => setViewMode('preview')}
                style={{
                  flex: 1,
                  background: 'var(--bg-panel)',
                  border: '1px solid var(--border-strong)',
                  color: 'var(--text-main)',
                  padding: '7px 10px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '5px',
                }}
                title="切换至标准纸张版面预览"
              >
                <Eye size={13} color="#38bdf8" />
                预览
              </button>

              <button
                onClick={handleConfirmAndGenerate}
                style={{
                  flex: 1.4,
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: '#ffffff',
                  padding: '7px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '5px',
                  boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
                }}
                title="确认生成并跳转至最终标准 Excel"
              >
                <Sparkles size={13} />
                确认生成标准报价
              </button>
            </div>
          </aside>

          {/* 右侧所见即所得图二预览画布 */}
          <main className="right-canvas-viewport">
            <div className="canvas-floating-controls" style={{ gap: '10px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Sparkles size={13} color="var(--figma-amber)" />
                所见即所得画布（单元格支持双击直接编辑）
              </span>

              <div style={{ width: '1px', height: '14px', background: 'var(--border-subtle)' }} />

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

              <div style={{ width: '1px', height: '14px', background: 'var(--border-subtle)' }} />

              {/* 预览按钮 */}
              <button
                onClick={() => setViewMode('preview')}
                style={{
                  background: 'var(--bg-panel)',
                  border: '1px solid var(--border-strong)',
                  color: 'var(--text-main)',
                  padding: '5px 12px',
                  borderRadius: '6px',
                  fontSize: '12.5px',
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                }}
                title="直接切换至最终标准 Excel 纸张版面预览"
              >
                <Eye size={13} color="#38bdf8" />
                预览
              </button>

              {/* 确认生成标准报价 */}
              <button
                onClick={handleConfirmAndGenerate}
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: '#ffffff',
                  padding: '5px 16px',
                  borderRadius: '6px',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 10px rgba(16, 185, 129, 0.35)',
                }}
                title="保存并跳转到最终标准 Excel 标签进行查看和下载"
              >
                <Sparkles size={13} />
                确认生成标准报价
                <ArrowRight size={13} />
              </button>
            </div>

            <QuotePaperPreview
              quoteDoc={quoteDoc}
              onUpdateItineraryItem={handleUpdateItineraryItem}
              onUpdatePsNote={(ps) => setQuoteDoc({ ...quoteDoc, psNote: ps })}
              scale={scale}
            />
          </main>
        </div>
      )}

      {viewMode === 'preview' && (
        <div style={{ flex: 1, overflowY: 'auto', background: 'var(--canvas-bg)', display: 'flex', flexDirection: 'column' }}>
          <main className="right-canvas-viewport" style={{ flex: 1, minHeight: '100%', padding: '24px 24px 100px' }}>
            <div className="canvas-floating-controls" style={{ gap: '10px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Sparkles size={13} color="var(--figma-amber)" />
                标准格式预览（完全对齐 26.12.18 南北岛18天.xlsx）
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

              <div style={{ width: '1px', height: '14px', background: 'var(--border-subtle)' }} />

              {/* 含核算底表切换复选框（与 Header 状态同步联动） */}
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '11.5px',
                fontWeight: 600,
                color: quoteDoc.includeCostBreakdown !== false ? '#34d399' : 'var(--text-dim)',
                background: quoteDoc.includeCostBreakdown !== false ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255, 255, 255, 0.04)',
                border: `1px solid ${quoteDoc.includeCostBreakdown !== false ? 'rgba(16, 185, 129, 0.35)' : 'var(--border-subtle)'}`,
                padding: '3px 10px',
                borderRadius: '6px',
                cursor: 'pointer',
                userSelect: 'none',
                transition: 'all 0.2s ease',
              }}>
                <input
                  type="checkbox"
                  checked={quoteDoc.includeCostBreakdown !== false}
                  onChange={(e) => setQuoteDoc({ ...quoteDoc, includeCostBreakdown: e.target.checked })}
                  style={{ width: '13px', height: '13px', accentColor: '#10b981', cursor: 'pointer' }}
                />
                <span>含核算底表 (E~L)</span>
              </label>

              <div style={{ width: '1px', height: '14px', background: 'var(--border-subtle)' }} />

              <button
                onClick={() => setViewMode('editor')}
                style={{
                  background: 'var(--bg-panel)',
                  border: '1px solid var(--border-strong)',
                  color: 'var(--text-main)',
                  padding: '5px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                }}
              >
                <SlidersHorizontal size={13} color="#60a5fa" />
                返回参数微调
              </button>

              <button
                onClick={handleExportExcel}
                disabled={isExporting}
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: '#ffffff',
                  padding: '5px 16px',
                  borderRadius: '6px',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
                }}
              >
                <FileCheck2 size={14} />
                {isExporting ? '正在生成并导出...' : '下载最终标准 Excel'}
              </button>
            </div>

            <QuotePaperPreview
              quoteDoc={quoteDoc}
              onUpdateItineraryItem={handleUpdateItineraryItem}
              onUpdatePsNote={(ps) => setQuoteDoc({ ...quoteDoc, psNote: ps })}
              scale={scale}
            />
          </main>
        </div>
      )}

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
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 门票价格库弹窗 */}
      {isLibraryOpen && (
        <ActivityLibraryModal
          isOpen={isLibraryOpen}
          onClose={() => setIsLibraryOpen(false)}
          activityQuote={quoteDoc.activityQuote}
          activityLibrary={systemConfig.activityLibrary}
          onUpdateQuote={(updated) => setQuoteDoc(prev => ({ ...prev, activityQuote: updated }))}
        />
      )}

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
