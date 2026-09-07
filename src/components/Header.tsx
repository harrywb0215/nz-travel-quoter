import React, { useRef, useState } from 'react';
import { 
  FileSpreadsheet, 
  Upload, 
  Printer, 
  Sparkles, 
  Compass, 
  BookOpen, 
  RotateCcw, 
  Settings,
  FolderArchive,
  Save,
  Trash2,
  Check
} from 'lucide-react';
import { parseItineraryExcel } from '../utils/excelParser';
import { figure1Itinerary, standard18DaysQuoteDoc } from '../constants/initialData';
import { getSavedQuotes, saveQuoteToHistory, deleteQuoteFromHistory } from '../utils/storage';
import type { QuoteDocument } from '../types/itinerary';

interface HeaderProps {
  quoteDoc: QuoteDocument;
  onUpdateDoc: (newDoc: QuoteDocument) => void;
  onExportExcel: () => void;
  onOpenActivityLibrary: () => void;
  onOpenSettings: () => void;
  isExporting?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  quoteDoc,
  onUpdateDoc,
  onExportExcel,
  onOpenActivityLibrary,
  onOpenSettings,
  isExporting = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [savedQuotes, setSavedQuotes] = useState<QuoteDocument[]>(getSavedQuotes());
  const [saveToast, setSaveToast] = useState(false);

  // 处理文件上传解析
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const items = await parseItineraryExcel(file);
      onUpdateDoc({
        ...quoteDoc,
        itinerary: items,
        title: file.name.replace(/\.[^/.]+$/, ''),
        updatedAt: new Date().toISOString().slice(0, 10),
      });
      alert(`成功解析并载入 ${items.length} 天行程数据！`);
    } catch (err: any) {
      alert('解析 Excel 失败：' + (err.message || '请检查表格格式'));
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // 保存当前报价单到草稿箱
  const handleSaveDraft = () => {
    const updated = saveQuoteToHistory(quoteDoc);
    setSavedQuotes(updated);
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2000);
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
      <div className="brand-section">
        <div className="brand-logo">
          <div className="brand-logo-icon">
            <Compass size={17} />
          </div>
          <span>NZ Travel Quoter</span>
        </div>
        <span className="badge badge-blue">正式版</span>
      </div>

      {/* 中间：快捷模板与配置中心入口 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          onClick={() => onUpdateDoc({ ...standard18DaysQuoteDoc })}
          style={{
            background: 'rgba(245, 158, 11, 0.18)',
            border: '1px solid rgba(245, 158, 11, 0.4)',
            color: '#fbbf24',
            padding: '5px 12px',
            borderRadius: '6px',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontWeight: 600,
          }}
          title="载入 26.12.18 南北岛18天 官方标准模板"
        >
          <Sparkles size={13} />
          标准模板 (南北岛18天)
        </button>

        <button
          onClick={() => onUpdateDoc({
            ...quoteDoc,
            title: '客户原始行程单 (18天) 待报价',
            itinerary: figure1Itinerary,
            updatedAt: new Date().toISOString().slice(0, 10),
          })}
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-main)',
            padding: '5px 10px',
            borderRadius: '6px',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
          }}
          title="载入客户发来的纯行程单原表"
        >
          <RotateCcw size={13} />
          客户原表 (图一)
        </button>

        <button
          onClick={onOpenActivityLibrary}
          style={{
            background: 'rgba(13, 153, 255, 0.1)',
            border: '1px solid rgba(13, 153, 255, 0.25)',
            color: '#38bdf8',
            padding: '5px 10px',
            borderRadius: '6px',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
          }}
        >
          <BookOpen size={13} />
          新西兰门票库
        </button>

        {/* 业务配置与价格中心按钮 */}
        <button
          onClick={onOpenSettings}
          style={{
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.35)',
            color: '#34d399',
            padding: '5px 11px',
            borderRadius: '6px',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            fontWeight: 500,
          }}
          title="配置南岛/北岛餐补、异地住宿费、车型单价、门票价格"
        >
          <Settings size={13} />
          价格与参数设置
        </button>

        {/* 历史草稿箱 */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => {
              setSavedQuotes(getSavedQuotes());
              setIsHistoryOpen(!isHistoryOpen);
            }}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-muted)',
              padding: '5px 10px',
              borderRadius: '6px',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
            }}
          >
            <FolderArchive size={13} />
            历史草稿 ({savedQuotes.length})
          </button>

          {isHistoryOpen && (
            <div style={{
              position: 'absolute',
              top: '36px',
              left: 0,
              width: '280px',
              background: 'var(--bg-topbar)',
              border: '1px solid var(--border-strong)',
              borderRadius: '8px',
              boxShadow: 'var(--shadow-figma-md)',
              zIndex: 100,
              padding: '8px',
              maxHeight: '320px',
              overflowY: 'auto',
            }}>
              <div style={{ fontSize: '11px', color: 'var(--text-dim)', padding: '4px 8px', borderBottom: '1px solid var(--border-subtle)', marginBottom: '6px' }}>
                已保存的本地历史报价单
              </div>
              {savedQuotes.length === 0 ? (
                <div style={{ padding: '16px', textAlign: 'center', fontSize: '12px', color: 'var(--text-dim)' }}>
                  暂无保存的草稿，点击“存为草稿”即可保存当前单据
                </div>
              ) : (
                savedQuotes.map((q, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleLoadDraft(q)}
                    style={{
                      padding: '8px 10px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '12px',
                      background: quoteDoc.title === q.title ? 'var(--bg-panel)' : 'transparent',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-panel)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = quoteDoc.title === q.title ? 'var(--bg-panel)' : 'transparent'}
                  >
                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                      <strong style={{ display: 'block', color: 'var(--text-main)' }}>{q.title}</strong>
                      <span style={{ fontSize: '10px', color: 'var(--text-dim)' }}>{q.itinerary?.length}天 • {q.updatedAt?.slice(0, 10)}</span>
                    </div>
                    <button
                      onClick={(e) => handleDeleteDraft(q.title, e)}
                      style={{ background: 'transparent', color: 'var(--text-dim)', padding: '2px 4px' }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* 导出时是否带 E~L 列成本核算底表开关 */}
        <label style={{
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          fontSize: '11px',
          color: 'var(--text-muted)',
          marginLeft: '6px',
          cursor: 'pointer',
        }}>
          <input
            type="checkbox"
            checked={quoteDoc.includeCostBreakdown !== false}
            onChange={(e) => onUpdateDoc({ ...quoteDoc, includeCostBreakdown: e.target.checked })}
            style={{ width: '13px', height: '13px', cursor: 'pointer' }}
          />
          <span>含核算底表(E~L)</span>
        </label>
      </div>

      {/* 右侧：上传、保存草稿与导出主要操作 */}
      <div className="header-actions">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept=".xlsx,.xls,.csv"
          style={{ display: 'none' }}
        />

        <button
          onClick={handleSaveDraft}
          style={{
            background: 'var(--bg-panel)',
            border: '1px solid var(--border-subtle)',
            color: saveToast ? '#34d399' : 'var(--text-muted)',
            padding: '7px 11px',
            borderRadius: '6px',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
          }}
          title="将当前报价单保存到本地草稿箱"
        >
          {saveToast ? <Check size={13} /> : <Save size={13} />}
          {saveToast ? '已保存草稿' : '存为草稿'}
        </button>

        <button
          onClick={() => fileInputRef.current?.click()}
          style={{
            background: 'var(--bg-panel)',
            border: '1px solid var(--border-strong)',
            color: 'var(--text-main)',
            padding: '7px 13px',
            borderRadius: '6px',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontWeight: 500,
          }}
        >
          <Upload size={14} />
          上传客户行程单
        </button>

        <button
          onClick={() => window.print()}
          style={{
            background: 'var(--bg-panel)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-muted)',
            padding: '7px 11px',
            borderRadius: '6px',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
          }}
          title="打印或直接另存为高清 PDF"
        >
          <Printer size={14} />
          PDF
        </button>

        <button
          onClick={onExportExcel}
          disabled={isExporting}
          style={{
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: '#ffffff',
            padding: '7px 16px',
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
          {isExporting ? '生成中...' : '生成标准报价 Excel'}
        </button>
      </div>
    </header>
  );
};
