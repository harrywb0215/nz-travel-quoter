import React, { useState, useRef } from 'react';
import { 
  Building2, 
  User, 
  FileText, 
  Image as ImageIcon, 
  FileSpreadsheet, 
  MessageSquare, 
  Upload, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  Calendar, 
  Users, 
  Phone, 
  Eye, 
  AlertCircle,
  Loader2,
  RefreshCw
} from 'lucide-react';
import type { QuoteDocument, QuoterInfo, ClientInfo, QuoteMeta, ItineraryItem } from '../../types/itinerary';
import { recognizeItineraryFromImage, parsePlainTextToItinerary } from '../../utils/imageOcrParser';
import { parseItineraryExcel } from '../../utils/excelParser';
import { loadSystemConfig } from '../../utils/storage';
import { parseItineraryWithGeminiVision } from '../../utils/geminiVisionParser';

interface OverviewDashboardProps {
  quoteDoc: QuoteDocument;
  onUpdateDoc: (newDoc: QuoteDocument) => void;
  onSwitchToPreview: () => void;
  onSwitchToEditor: () => void;
  onExportExcel: () => void;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({
  quoteDoc,
  onUpdateDoc,
  onSwitchToPreview,
  onSwitchToEditor,
  onExportExcel,
}) => {
  const [ingestionTab, setIngestionTab] = useState<'image' | 'excel' | 'text'>('image');
  const [isOcrProcessing, setIsOcrProcessing] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrStatusText, setOcrStatusText] = useState('');
  const [pastedText, setPastedText] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const excelInputRef = useRef<HTMLInputElement>(null);

  const { quoterInfo, clientInfo, quoteMeta, itinerary, vehicleQuote, activityQuote } = quoteDoc;

  // 根据起止日期自动计算出游天数
  const calculatedDays = React.useMemo(() => {
    const start = clientInfo?.startDate;
    const end = clientInfo?.endDate;
    if (!start || !end) return itinerary?.length || 0;
    try {
      const d1 = new Date(start + 'T00:00:00');
      const d2 = new Date(end + 'T00:00:00');
      if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return itinerary?.length || 0;
      const diffDays = Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      return diffDays > 0 ? diffDays : 0;
    } catch {
      return itinerary?.length || 0;
    }
  }, [clientInfo?.startDate, clientInfo?.endDate, itinerary?.length]);

  // 更新报价方
  const handleUpdateQuoter = (field: keyof QuoterInfo, val: string) => {
    onUpdateDoc({
      ...quoteDoc,
      quoterInfo: { ...quoterInfo, [field]: val },
    });
  };

  // 更新客户信息
  const handleUpdateClient = (field: keyof ClientInfo, val: any) => {
    onUpdateDoc({
      ...quoteDoc,
      clientInfo: { ...clientInfo, [field]: val },
    });
  };

  // 更新报价单信息
  const handleUpdateMeta = (field: keyof QuoteMeta, val: any) => {
    onUpdateDoc({
      ...quoteDoc,
      quoteMeta: { ...quoteMeta, [field]: val },
    });
  };

  // 处理图片识别上传（智能双轨制：优先 Gemini 视觉多模态，未配置时自动使用本地 Canvas 增强离线 OCR）
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsOcrProcessing(true);
      setOcrProgress(15);

      const sysConfig = loadSystemConfig();
      const hasGeminiKey = Boolean(sysConfig.aiConfig?.geminiApiKey?.trim() && sysConfig.aiConfig?.enabled !== false);

      let items: ItineraryItem[] = [];

      if (hasGeminiKey) {
        // 主轨：Gemini 视觉大模型多模态解析（针对楷体字、表格排版原生 0 乱码）
        setOcrStatusText('正在使用 Gemini 视觉大模型高精度解析（楷体多列表格智能拆解）...');
        setOcrProgress(35);
        try {
          items = await parseItineraryWithGeminiVision(
            file,
            sysConfig.aiConfig!.geminiApiKey,
            sysConfig.aiConfig?.modelName || 'gemini-1.5-flash'
          );
          setOcrProgress(95);
        } catch (aiErr: any) {
          console.warn('Gemini 视觉识别调用异常，自动降级为本地增强离线引擎:', aiErr);
          setOcrStatusText('云端 AI 响应超时或异常，正在自动无缝切换为本地增强 OCR 引擎兜底...');
          setOcrProgress(45);
          const fallbackResult = await recognizeItineraryFromImage(file, (p, status) => {
            setOcrProgress(p);
            setOcrStatusText(status);
          });
          items = fallbackResult.items;
        }
      } else {
        // 辅轨：纯前端 Canvas 预处理增强 + 词库纠错兜底
        setOcrStatusText('正在使用本地增强 OCR 图像引擎识别...');
        setOcrProgress(25);
        const result = await recognizeItineraryFromImage(file, (p, status) => {
          setOcrProgress(p);
          setOcrStatusText(status);
        });
        items = result.items;
      }

      if (!items || items.length === 0) {
        setErrorMessage('未能从图片中解析出行程结构。建议：若截图字体较为特殊，可在顶部“价格与参数设置”中配置 Gemini API Key 享受 99.9% 楷体精准识别，或尝试复制文字后使用“微信/文本智能粘贴”。');
        return;
      }

      // 识别成功：更新主文档并立即自动跳转到「参数微调工作台」
      onUpdateDoc({
        ...quoteDoc,
        itinerary: items,
        title: `${clientInfo.name || '客户'} 新西兰行程报价单`,
      });

      // 立即自动跳转到参数微调工作台 (图二)
      onSwitchToEditor();
    } catch (err: any) {
      console.error('识别报错:', err);
      setErrorMessage(`图片识别出错：${err.message || '识别引擎未能成功处理该图片'}。建议检查网络连接或上传更清晰的截图。`);
    } finally {
      setIsOcrProcessing(false);
      if (imageInputRef.current) imageInputRef.current.value = '';
    }
  };

  // 处理 Excel 上传解析
  const handleExcelFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const items = await parseItineraryExcel(file);
      if (!items || items.length === 0) {
        setErrorMessage('Excel 中未识别到有效的行程行。请确认表格中是否包含“日期”、“行程”或“活动”等表头列。');
        return;
      }

      // 导入成功：更新主文档并立即跳转到「参数微调工作台」
      onUpdateDoc({
        ...quoteDoc,
        itinerary: items,
        title: file.name.replace(/\.[^/.]+$/, ''),
      });

      // 立即自动跳转到参数微调工作台 (图二)
      onSwitchToEditor();
    } catch (err: any) {
      console.error('Excel 导入报错:', err);
      setErrorMessage(`Excel 导入解析出错：${err.message || '文件可能损坏或格式不兼容'}。请检查文件是否为标准 .xlsx / .xls / .csv 格式。`);
    } finally {
      if (excelInputRef.current) excelInputRef.current.value = '';
    }
  };

  // 处理纯文本一键提取
  const handleParseText = () => {
    if (!pastedText.trim()) {
      setErrorMessage('请输入或粘贴中英文行程文字！');
      return;
    }
    try {
      const items = parsePlainTextToItinerary(pastedText);
      if (!items || items.length === 0) {
        setErrorMessage('未能从输入文字中识别出天数。请确保包含“Day 1”、“D1”、“第1天”或类似日期标记。');
        return;
      }

      // 解析成功：更新主文档并立即跳转到「参数微调工作台」
      onUpdateDoc({
        ...quoteDoc,
        itinerary: items,
      });

      // 立即自动跳转到参数微调工作台 (图二)
      onSwitchToEditor();
    } catch (err: any) {
      setErrorMessage(`文本拆解出错：${err.message || '未知错误'}`);
    }
  };

  return (
    <div style={{
      flex: 1,
      overflowY: 'auto',
      padding: '24px 32px',
      background: 'var(--bg-app)',
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
      maxWidth: '1280px',
      margin: '0 auto',
      width: '100%',
    }}>
      {/* 顶部简明横幅 */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(13, 153, 255, 0.12) 0%, rgba(16, 185, 129, 0.08) 100%)',
        border: '1px solid rgba(13, 153, 255, 0.25)',
        borderRadius: '10px',
        padding: '14px 20px',
      }}>
        <h2 style={{ fontSize: '16px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>新西兰定制游行程报价工作台</span>
          <span className="badge badge-green">实战版</span>
        </h2>
        <p style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '3px' }}>
          快速确认双方信息，上传中英文图片/文档秒级提取行程，一键生成符合标准格式的带报价 Excel。
        </p>
      </div>

      {/* 核心三模块卡片网格 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
        {/* 1. 报价方信息卡片 */}
        <div style={{
          background: 'var(--bg-panel)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '10px',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '8px' }}>
            <Building2 size={16} color="var(--figma-blue)" />
            <span style={{ fontSize: '13.5px', fontWeight: 600 }}>1. 报价方信息 (我方)</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div>
              <label style={{ fontSize: '11px', color: 'var(--text-dim)', display: 'block', marginBottom: '2px' }}>车队/定制游品牌</label>
              <input
                type="text"
                value={quoterInfo?.companyName || ''}
                onChange={(e) => handleUpdateQuoter('companyName', e.target.value)}
                style={{ width: '100%', fontSize: '12.5px' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-dim)', display: 'block', marginBottom: '2px' }}>司导姓名</label>
                <input
                  type="text"
                  value={quoterInfo?.agentName || ''}
                  onChange={(e) => handleUpdateQuoter('agentName', e.target.value)}
                  style={{ width: '100%', fontSize: '12.5px' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-dim)', display: 'block', marginBottom: '2px' }}>微信号</label>
                <input
                  type="text"
                  value={quoterInfo?.wechat || ''}
                  onChange={(e) => handleUpdateQuoter('wechat', e.target.value)}
                  style={{ width: '100%', fontSize: '12.5px' }}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '11px', color: 'var(--text-dim)', display: 'block', marginBottom: '2px' }}>联系电话 / 资质牌号</label>
              <input
                type="text"
                value={`${quoterInfo?.phone || ''} • ${quoterInfo?.license || ''}`}
                onChange={(e) => handleUpdateQuoter('phone', e.target.value)}
                style={{ width: '100%', fontSize: '12.5px' }}
              />
            </div>
          </div>
        </div>

        {/* 2. 报价单信息卡片 */}
        <div style={{
          background: 'var(--bg-panel)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '10px',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '8px' }}>
            <FileText size={16} color="var(--figma-amber)" />
            <span style={{ fontSize: '13.5px', fontWeight: 600 }}>2. 报价单概况</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-dim)', display: 'block', marginBottom: '2px' }}>报价单号</label>
                <input
                  type="text"
                  value={quoteMeta?.quoteNo || 'NZQ-202612-001'}
                  onChange={(e) => handleUpdateMeta('quoteNo', e.target.value)}
                  style={{ width: '100%', fontSize: '12px' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-dim)', display: 'block', marginBottom: '2px' }}>有效期</label>
                <input
                  type="text"
                  value={`${quoteMeta?.expiryWeeks || 2} 周内有效`}
                  readOnly
                  style={{ width: '100%', fontSize: '12px', background: 'rgba(255,255,255,0.03)' }}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '11px', color: 'var(--text-dim)', display: 'block', marginBottom: '2px' }}>车型与用车报价 (NZD)</label>
              <div style={{
                background: 'rgba(255, 255, 0, 0.08)',
                border: '1px solid rgba(255, 255, 0, 0.25)',
                borderRadius: '6px',
                padding: '6px 10px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <span style={{ fontSize: '12px', color: '#fef08a' }}>{vehicleQuote.vehicleModel}</span>
                <strong style={{ fontSize: '14px', color: '#fbbf24' }}>NZD {vehicleQuote.totalPrice.toLocaleString()}</strong>
              </div>
            </div>

            <div>
              <label style={{ fontSize: '11px', color: 'var(--text-dim)', display: 'block', marginBottom: '2px' }}>活动门票核算 (NZD/人)</label>
              <div style={{
                background: 'rgba(13, 153, 255, 0.08)',
                border: '1px solid rgba(13, 153, 255, 0.25)',
                borderRadius: '6px',
                padding: '6px 10px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <span style={{ fontSize: '12px', color: '#93c5fd' }}>成人人均门票</span>
                <strong style={{ fontSize: '14px', color: '#60a5fa' }}>NZD {activityQuote.adultPrice}/人</strong>
              </div>
            </div>
          </div>
        </div>

        {/* 3. 客户信息卡片 */}
        <div style={{
          background: 'var(--bg-panel)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '10px',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '8px' }}>
            <User size={16} color="var(--figma-green)" />
            <span style={{ fontSize: '13.5px', fontWeight: 600 }}>3. 客户档案信息</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '8px' }}>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-dim)', display: 'block', marginBottom: '2px' }}>客户姓名/称呼</label>
                <input
                  type="text"
                  value={clientInfo?.name || ''}
                  onChange={(e) => handleUpdateClient('name', e.target.value)}
                  style={{ width: '100%', fontSize: '12.5px' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-dim)', display: 'block', marginBottom: '2px' }}>出行人数</label>
                <input
                  type="text"
                  value={`${clientInfo?.adultCount || 4}大 ${clientInfo?.childCount || 0}小`}
                  onChange={(e) => {
                    const match = e.target.value.match(/(\d+)/);
                    if (match) handleUpdateClient('adultCount', Number(match[1]));
                  }}
                  style={{ width: '100%', fontSize: '12.5px' }}
                />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <label style={{ fontSize: '11px', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Calendar size={12} color="var(--figma-green)" />
                  出行时间区间 (日期选择器)
                </label>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: calculatedDays > 0 ? '#34d399' : '#f87171',
                  background: calculatedDays > 0 ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.25)',
                  border: `1px solid ${calculatedDays > 0 ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.4)'}`,
                  padding: '1px 8px',
                  borderRadius: '10px',
                }}>
                  {calculatedDays > 0 ? `共 ${calculatedDays} 天` : '日期区间有误'}
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '6px', alignItems: 'center' }}>
                <input
                  type="date"
                  value={clientInfo?.startDate || ''}
                  onChange={(e) => handleUpdateClient('startDate', e.target.value)}
                  style={{
                    width: '100%',
                    fontSize: '11.5px',
                    padding: '5px 8px',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '6px',
                    color: 'var(--text-main)',
                    colorScheme: 'dark',
                    cursor: 'pointer',
                  }}
                />
                <span style={{ fontSize: '11px', color: 'var(--text-dim)', fontWeight: 500 }}>至</span>
                <input
                  type="date"
                  value={clientInfo?.endDate || ''}
                  onChange={(e) => handleUpdateClient('endDate', e.target.value)}
                  style={{
                    width: '100%',
                    fontSize: '11.5px',
                    padding: '5px 8px',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '6px',
                    color: 'var(--text-main)',
                    colorScheme: 'dark',
                    cursor: 'pointer',
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '11px', color: 'var(--text-dim)', display: 'block', marginBottom: '2px' }}>需求偏好 / 备注</label>
              <input
                type="text"
                value={clientInfo?.specialDemands || ''}
                onChange={(e) => handleUpdateClient('specialDemands', e.target.value)}
                placeholder="例如：需要行李拖斗、重点摄影"
                style={{ width: '100%', fontSize: '12px' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 4. 核心焦点：图片与多源行程智能识别中心 */}
      <div style={{
        background: 'var(--bg-panel)',
        border: '1px solid var(--border-strong)',
        borderRadius: '12px',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        boxShadow: 'var(--shadow-figma-md)',
      }}>
        {/* 顶部识别方式切换 Tab */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <Sparkles size={18} color="var(--figma-blue)" />
            <h3 style={{ fontSize: '15px', fontWeight: 600 }}>4. 智能行程识别中心</h3>
            <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>支持中英文图片、Excel 与微信文字提取</span>
            {(() => {
              const cfg = loadSystemConfig();
              const hasKey = Boolean(cfg.aiConfig?.geminiApiKey?.trim() && cfg.aiConfig?.enabled !== false);
              return hasKey ? (
                <span style={{
                  fontSize: '11px',
                  color: '#c084fc',
                  background: 'rgba(168, 85, 247, 0.12)',
                  border: '1px solid rgba(168, 85, 247, 0.3)',
                  padding: '2px 8px',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}>
                  <Sparkles size={11} />
                  已启用 Gemini AI 视觉（楷体多列表格 100% 结构化）
                </span>
              ) : (
                <span style={{
                  fontSize: '11px',
                  color: '#fbbf24',
                  background: 'rgba(245, 158, 11, 0.12)',
                  border: '1px solid rgba(245, 158, 11, 0.25)',
                  padding: '2px 8px',
                  borderRadius: '10px',
                }}>
                  纯前端 Canvas 增强离线引擎（设置中可配 Gemini Key 享 0 乱码）
                </span>
              );
            })()}
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={() => setIngestionTab('image')}
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                fontSize: '12.5px',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: ingestionTab === 'image' ? 'var(--figma-blue)' : 'var(--bg-input)',
                color: ingestionTab === 'image' ? '#ffffff' : 'var(--text-muted)',
              }}
            >
              <ImageIcon size={14} />
              中英文图片识别 (OCR)
            </button>

            <button
              onClick={() => setIngestionTab('excel')}
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                fontSize: '12.5px',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: ingestionTab === 'excel' ? 'var(--figma-blue)' : 'var(--bg-input)',
                color: ingestionTab === 'excel' ? '#ffffff' : 'var(--text-muted)',
              }}
            >
              <FileSpreadsheet size={14} />
              中英文 Excel 导入
            </button>

            <button
              onClick={() => setIngestionTab('text')}
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                fontSize: '12.5px',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: ingestionTab === 'text' ? 'var(--figma-blue)' : 'var(--bg-input)',
                color: ingestionTab === 'text' ? '#ffffff' : 'var(--text-muted)',
              }}
            >
              <MessageSquare size={14} />
              微信/文本智能粘贴
            </button>
          </div>
        </div>

        {/* Tab 1: 图片识别区域 */}
        {ingestionTab === 'image' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input
              type="file"
              ref={imageInputRef}
              onChange={handleImageFileChange}
              accept="image/*"
              style={{ display: 'none' }}
            />

            <div
              onClick={() => !isOcrProcessing && imageInputRef.current?.click()}
              style={{
                border: '2px dashed var(--border-strong)',
                borderRadius: '10px',
                padding: '36px 20px',
                textAlign: 'center',
                cursor: isOcrProcessing ? 'not-allowed' : 'pointer',
                background: 'rgba(255, 255, 255, 0.02)',
                transition: 'border-color 0.2s ease',
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--figma-blue)'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-strong)'}
            >
              {isOcrProcessing ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                  <Loader2 size={32} color="var(--figma-blue)" className="animate-spin" />
                  <span style={{ fontSize: '14px', fontWeight: 600 }}>{ocrStatusText}</span>
                  <div style={{ width: '280px', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${ocrProgress}%`, height: '100%', background: 'var(--figma-blue)', transition: 'width 0.3s ease' }} />
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>支持中英文双语识别，识别后自动拆解行程行</span>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: 'rgba(13, 153, 255, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--figma-blue)',
                    marginBottom: '4px',
                  }}>
                    <Upload size={22} />
                  </div>
                  <strong style={{ fontSize: '14px' }}>点击或拖拽上传中英文行程截图 / 拍照图片</strong>
                  <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
                    支持 PNG, JPG, JPEG, WEBP 格式（微信聊天截图、小红书行程图、中英文旅行社宣传单等）
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Excel 导入区域 */}
        {ingestionTab === 'excel' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input
              type="file"
              ref={excelInputRef}
              onChange={handleExcelFileChange}
              accept=".xlsx,.xls,.csv"
              style={{ display: 'none' }}
            />

            <div
              onClick={() => excelInputRef.current?.click()}
              style={{
                border: '2px dashed var(--border-strong)',
                borderRadius: '10px',
                padding: '36px 20px',
                textAlign: 'center',
                cursor: 'pointer',
                background: 'rgba(255, 255, 255, 0.02)',
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--figma-green)'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-strong)'}
            >
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  background: 'rgba(16, 185, 129, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--figma-green)',
                  marginBottom: '4px',
                }}>
                  <FileSpreadsheet size={22} />
                </div>
                <strong style={{ fontSize: '14px' }}>点击或拖拽上传中英文 Excel 表格 (.xlsx, .xls, .csv)</strong>
                <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
                  自动识别“日期/Date”、“行程/Route/Itinerary”、“活动/Activity/Attraction”等中英文列
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: 微信文本粘贴区域 */}
        {ingestionTab === 'text' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <textarea
              rows={5}
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              placeholder="直接把客户在微信、邮件中发来的中英文行程文字粘贴在这里。例如：
Day 1 12月18日 皇后镇接机 游览
Day 2 12月19日 皇后镇 - 格林诺奇 TSS+晚餐
Day 3 12月20日 皇后镇 天空缆车"
              style={{ width: '100%', lineHeight: '1.6' }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={handleParseText}
                style={{
                  background: 'var(--figma-blue)',
                  color: '#ffffff',
                  padding: '7px 18px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Sparkles size={14} />
                一键智能拆解行程
              </button>
            </div>
          </div>
        )}

        {/* 当前行程就绪状态横条 */}
        <div style={{
          background: 'var(--bg-app)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '8px',
          padding: '12px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={16} color="var(--figma-green)" />
            <span style={{ fontSize: '13px', fontWeight: 500 }}>
              当前已就绪行程：<strong>{itinerary.length} 天</strong>
              （用车 {itinerary.filter(i => !i.noCar).length} 天{itinerary.filter(i => i.noCar).length > 0 ? `，${itinerary.filter(i => i.noCar).length}天不用车` : ''}）
            </span>
          </div>

          <button
            onClick={onSwitchToEditor}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-main)',
              padding: '5px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>进入参数微调工作台</span>
            <ArrowRight size={13} />
          </button>
        </div>
      </div>

      {/* 识别/导入出错醒目弹窗 */}
      {errorMessage && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999,
        }}>
          <div style={{
            background: 'var(--bg-topbar)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            borderRadius: '12px',
            width: '460px',
            maxWidth: '90vw',
            padding: '24px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ef4444',
                flexShrink: 0,
              }}>
                <AlertCircle size={20} />
              </div>
              <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-main)' }}>识别或导入提示</h3>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
              {errorMessage}
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => setErrorMessage(null)}
                style={{
                  background: 'var(--figma-blue)',
                  color: '#ffffff',
                  padding: '7px 20px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 500,
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
