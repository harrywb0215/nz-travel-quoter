import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  Printer, 
  Compass, 
  Settings,
  FolderArchive,
  Save,
  Trash2,
  Check,
  ChevronDown,
  Plus
} from 'lucide-react';
import { getSavedQuotes, saveQuoteToHistory, deleteQuoteFromHistory } from '../utils/storage';
import type { QuoteDocument } from '../types/itinerary';

interface HeaderProps {
  quoteDoc: QuoteDocument;
  onUpdateDoc: (newDoc: QuoteDocument) => void;
  onExportExcel: () => void;
  onOpenActivityLibrary?: () => void;
  onOpenSettings: () => void;
  isExporting?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  quoteDoc,
  onUpdateDoc,
  onExportExcel,
  onOpenSettings,
  isExporting = false,
}) => {
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [savedQuotes, setSavedQuotes] = useState<QuoteDocument[]>(getSavedQuotes());
  const [saveSuccess, setSaveSuccess] = useState(false);

  // 保存当前报价单到草稿箱
  const handleSaveDraft = () => {
    const updated = saveQuoteToHistory(quoteDoc);
    setSavedQuotes(updated);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  // 删除历史草稿
  const handleDeleteDraft = (title: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = deleteQuoteFromHistory(title);
    setSavedQuotes(updated);
  };

  // 载入历史草稿
  const handleLoadDraft = (doc: QuoteDocument) => {
    onUpdateDoc(doc);
    setIsHistoryOpen(false);
  };

  return (
    <header className="top-header">
      {/* 1. 品牌区 */}
      <div className="brand-section">
        <div className="brand-logo">
          <div className="brand-logo-icon">
            <Compass size={17} />
          </div>
          <span>NZ Travel Quoter</span>
        </div>
        <span className="badge badge-blue">商业定制版</span>
      </div>

      {/* 2. 中间：系统设置、草稿箱、核算底表开关（聚合精简） */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* 系统价格与参数设置 */}
        <button
          onClick={onOpenSettings}
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-main)',
            padding: '6px 12px',
            borderRadius: '6px',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'background 0.2s',
          }}
          title="维护车型单价、餐补住宿费、门票价格库与 AI 视觉配置"
        >
          <Settings size={13} color="#60a5fa" />
          价格与系统设置
        </button>

        {/* 统一草稿箱下拉管理 */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => {
              setSavedQuotes(getSavedQuotes());
              setIsHistoryOpen(!isHistoryOpen);
            }}
            style={{
              background: isHistoryOpen ? 'var(--bg-panel)' : 'rgba(255, 255, 255, 0.05)',
              border: `1px solid ${isHistoryOpen ? 'var(--figma-blue)' : 'var(--border-subtle)'}`,
              color: 'var(--text-main)',
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            <FolderArchive size={13} color="#fbbf24" />
            <span>草稿箱 ({savedQuotes.length})</span>
            <ChevronDown size={12} color="var(--text-dim)" />
          </button>

          {isHistoryOpen && (
            <div style={{
              position: 'absolute',
              top: '38px',
              left: 0,
              width: '310px',
              background: 'var(--bg-topbar)',
              border: '1px solid var(--border-strong)',
              borderRadius: '8px',
              boxShadow: '0 16px 40px rgba(0, 0, 0, 0.65)',
              zIndex: 100,
              padding: '8px',
              maxHeight: '380px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}>
              {/* 顶部：快捷存为新草稿按钮 */}
              <button
                onClick={handleSaveDraft}
                style={{
                  width: '100%',
                  background: saveSuccess ? 'rgba(16, 185, 129, 0.15)' : 'rgba(13, 153, 255, 0.12)',
                  border: `1px solid ${saveSuccess ? 'rgba(16, 185, 129, 0.35)' : 'rgba(13, 153, 255, 0.3)'}`,
                  color: saveSuccess ? '#34d399' : '#60a5fa',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                }}
              >
                {saveSuccess ? <Check size={14} /> : <Plus size={14} />}
                {saveSuccess ? '当前单据已成功保存！' : '将当前单据存为新草稿'}
              </button>

              <div style={{ fontSize: '11px', color: 'var(--text-dim)', padding: '4px 6px', borderBottom: '1px solid var(--border-subtle)' }}>
                本地已保存的报价单 ({savedQuotes.length})
              </div>

              <div style={{ overflowY: 'auto', maxHeight: '240px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                {savedQuotes.length === 0 ? (
                  <div style={{ padding: '20px 10px', textAlign: 'center', fontSize: '12px', color: 'var(--text-dim)' }}>
                    暂无历史草稿，点击上方按钮即可随时保存当前单据
                  </div>
                ) : (
                  savedQuotes.map((q, idx) => {
                    const isCurrent = quoteDoc.title === q.title;
                    return (
                      <div
                        key={idx}
                        onClick={() => handleLoadDraft(q)}
                        style={{
                          padding: '7px 10px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          fontSize: '12px',
                          background: isCurrent ? 'rgba(13, 153, 255, 0.12)' : 'transparent',
                          border: isCurrent ? '1px solid rgba(13, 153, 255, 0.25)' : '1px solid transparent',
                        }}
                        onMouseEnter={(e) => {
                          if (!isCurrent) e.currentTarget.style.background = 'var(--bg-panel)';
                        }}
                        onMouseLeave={(e) => {
                          if (!isCurrent) e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                          <strong style={{ display: 'block', color: isCurrent ? '#60a5fa' : 'var(--text-main)', fontSize: '12px' }}>
                            {q.title}
                          </strong>
                          <span style={{ fontSize: '10.5px', color: 'var(--text-dim)' }}>
                            {q.itinerary?.length} 天 • {q.clientInfo?.name || '未知客户'} • {q.updatedAt?.slice(0, 10)}
                          </span>
                        </div>
                        <button
                          onClick={(e) => handleDeleteDraft(q.title, e)}
                          title="删除此草稿"
                          style={{
                            background: 'transparent',
                            color: 'var(--text-dim)',
                            padding: '4px',
                            cursor: 'pointer',
                            borderRadius: '4px',
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-dim)'}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* 导出时是否带 E~L 列成本核算底表开关（微胶囊风格） */}
        <label style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '11.5px',
          color: quoteDoc.includeCostBreakdown !== false ? '#34d399' : 'var(--text-dim)',
          background: quoteDoc.includeCostBreakdown !== false ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 255, 255, 0.04)',
          border: `1px solid ${quoteDoc.includeCostBreakdown !== false ? 'rgba(16, 185, 129, 0.3)' : 'var(--border-subtle)'}`,
          padding: '4px 10px',
          borderRadius: '6px',
          cursor: 'pointer',
          userSelect: 'none',
          transition: 'all 0.2s ease',
        }}>
          <input
            type="checkbox"
            checked={quoteDoc.includeCostBreakdown !== false}
            onChange={(e) => onUpdateDoc({ ...quoteDoc, includeCostBreakdown: e.target.checked })}
            style={{ width: '13px', height: '13px', accentColor: '#10b981', cursor: 'pointer' }}
          />
          <span>含核算底表 (E~L)</span>
        </label>
      </div>

      {/* 3. 右侧交付区：PDF 与生成标准 Excel */}
      <div className="header-actions" style={{ gap: '8px' }}>
        {/* PDF 打印与另存为 */}
        <button
          onClick={() => window.print()}
          style={{
            background: 'var(--bg-panel)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-muted)',
            padding: '6px 12px',
            borderRadius: '6px',
            fontSize: '12.5px',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            cursor: 'pointer',
          }}
          title="打印或直接另存为高清 PDF"
        >
          <Printer size={14} />
          <span>PDF</span>
        </button>

        {/* 生成标准商业报价 Excel */}
        <button
          onClick={onExportExcel}
          disabled={isExporting}
          style={{
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: '#ffffff',
            padding: '6px 16px',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 2px 10px rgba(16, 185, 129, 0.35)',
            cursor: isExporting ? 'not-allowed' : 'pointer',
          }}
        >
          <FileSpreadsheet size={15} />
          <span>{isExporting ? '生成中...' : '生成标准报价 Excel'}</span>
        </button>
      </div>
    </header>
  );
};
