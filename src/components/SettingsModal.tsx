import React, { useState, useRef } from 'react';
import { 
  X, 
  Settings, 
  DollarSign, 
  Car, 
  Ticket, 
  FileText, 
  Download, 
  Upload, 
  RotateCcw, 
  Plus, 
  Trash2, 
  Check, 
  AlertCircle,
  Sparkles,
  Eye,
  EyeOff,
  ExternalLink,
  Loader2
} from 'lucide-react';
import { 
  SystemConfig, 
  defaultSystemConfig, 
  saveSystemConfig, 
  exportConfigToFile, 
  importConfigFromFile 
} from '../utils/storage';
import { testGeminiApiKey } from '../utils/geminiVisionParser';
import type { PresetActivity } from '../types/itinerary';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: SystemConfig;
  onUpdateConfig: (newConfig: SystemConfig) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onUpdateConfig,
}) => {
  const [activeTab, setActiveTab] = useState<'allowance' | 'vehicles' | 'activities' | 'terms' | 'ai' | 'backup'>('allowance');
  const [currentConfig, setCurrentConfig] = useState<SystemConfig>(config);
  const [actSearch, setActSearch] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [isTestingApi, setIsTestingApi] = useState(false);
  const [testResult, setTestResult] = useState<{ success?: boolean; message?: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // 保存设置
  const handleSave = () => {
    saveSystemConfig(currentConfig);
    onUpdateConfig(currentConfig);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 600);
  };

  // 恢复出厂设置
  const handleResetDefault = () => {
    if (confirm('确定要恢复为出厂默认价格与配置吗？当前自定义修改将被重置。')) {
      setCurrentConfig(defaultSystemConfig);
      saveSystemConfig(defaultSystemConfig);
      onUpdateConfig(defaultSystemConfig);
      alert('已恢复为新西兰官方出厂基准配置！');
    }
  };

  // 更新 AI 配置
  const handleUpdateAi = (field: string, val: any) => {
    const updatedAi = {
      geminiApiKey: '',
      modelName: 'gemini-1.5-flash',
      enabled: true,
      ...(currentConfig.aiConfig || {}),
      [field]: val,
    };
    setCurrentConfig({
      ...currentConfig,
      aiConfig: updatedAi,
    });
  };

  // 测试 API Key 连通性
  const handleTestKey = async () => {
    const key = currentConfig.aiConfig?.geminiApiKey;
    if (!key || !key.trim()) {
      setTestResult({ success: false, message: '请先填写 Gemini API Key 后再测试！' });
      return;
    }
    setIsTestingApi(true);
    setTestResult(null);
    const res = await testGeminiApiKey(key, currentConfig.aiConfig?.modelName || 'gemini-1.5-flash');
    setIsTestingApi(false);
    setTestResult(res);
  };

  // 导入配置
  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const imported = await importConfigFromFile(file);
      setCurrentConfig(imported);
      onUpdateConfig(imported);
      alert('配置文件导入成功！所有价格参数已更新。');
    } catch (err: any) {
      alert('导入失败：' + (err.message || '文件格式错误'));
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // 新增车型
  const handleAddVehicle = () => {
    const newV = {
      id: `v-custom-${Date.now()}`,
      name: '新车型',
      northIslandPrice: 800,
      southIslandPrice: 900,
      holidaySurcharge: 180,
      capacity: '4-6人',
      desc: '舒适商务车型',
    };
    setCurrentConfig({
      ...currentConfig,
      vehicleList: [...currentConfig.vehicleList, newV],
    });
  };

  // 新增景点
  const handleAddActivity = () => {
    const newAct: PresetActivity = {
      id: `act-custom-${Date.now()}`,
      name: '新西兰新景点门票',
      location: '皇后镇',
      adultPrice: 100,
      childPrice: 50,
      description: '特色旅游体验项目',
    };
    setCurrentConfig({
      ...currentConfig,
      activityLibrary: [newAct, ...currentConfig.activityLibrary],
    });
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.78)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 150,
    }}>
      <div style={{
        background: 'var(--bg-topbar)',
        border: '1px solid var(--border-strong)',
        borderRadius: '12px',
        width: '820px',
        maxWidth: '94vw',
        height: '82vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 24px 70px rgba(0, 0, 0, 0.75)',
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Settings size={18} color="var(--figma-blue)" />
            <h3 style={{ fontSize: '15px', fontWeight: 600 }}>业务参数与价格维护中心</h3>
            <span className="badge badge-blue">永久保存在本地</span>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', color: 'var(--text-muted)' }}>
            <X size={18} />
          </button>
        </div>

        {/* 主体：左侧导航 Tab + 右侧设置内容 */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* 左侧 Tab 列表 */}
          <div style={{
            width: '180px',
            background: 'var(--bg-sidebar)',
            borderRight: '1px solid var(--border-subtle)',
            padding: '12px 8px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          }}>
            <button
              onClick={() => setActiveTab('allowance')}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '6px',
                fontSize: '12.5px',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: activeTab === 'allowance' ? 'var(--bg-panel)' : 'transparent',
                color: activeTab === 'allowance' ? '#fbbf24' : 'var(--text-muted)',
                fontWeight: activeTab === 'allowance' ? 600 : 400,
              }}
            >
              <DollarSign size={14} />
              司导补贴与工时
            </button>

            <button
              onClick={() => setActiveTab('vehicles')}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '6px',
                fontSize: '12.5px',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: activeTab === 'vehicles' ? 'var(--bg-panel)' : 'transparent',
                color: activeTab === 'vehicles' ? '#fbbf24' : 'var(--text-muted)',
                fontWeight: activeTab === 'vehicles' ? 600 : 400,
              }}
            >
              <Car size={14} />
              车型日租与附加费
            </button>

            <button
              onClick={() => setActiveTab('activities')}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '6px',
                fontSize: '12.5px',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: activeTab === 'activities' ? 'var(--bg-panel)' : 'transparent',
                color: activeTab === 'activities' ? '#38bdf8' : 'var(--text-muted)',
                fontWeight: activeTab === 'activities' ? 600 : 400,
              }}
            >
              <Ticket size={14} />
              景点门票价格库
            </button>

            <button
              onClick={() => setActiveTab('terms')}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '6px',
                fontSize: '12.5px',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: activeTab === 'terms' ? 'var(--bg-panel)' : 'transparent',
                color: activeTab === 'terms' ? '#34d399' : 'var(--text-muted)',
                fontWeight: activeTab === 'terms' ? 600 : 400,
              }}
            >
              <FileText size={14} />
              条款模板预设
            </button>

            <button
              onClick={() => setActiveTab('ai')}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '6px',
                fontSize: '12.5px',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: activeTab === 'ai' ? 'var(--bg-panel)' : 'transparent',
                color: activeTab === 'ai' ? '#c084fc' : 'var(--text-muted)',
                fontWeight: activeTab === 'ai' ? 600 : 400,
              }}
            >
              <Sparkles size={14} color="#c084fc" />
              AI 视觉识别设置
            </button>

            <div style={{ margin: '8px 0', borderTop: '1px solid var(--border-subtle)' }} />

            <button
              onClick={() => setActiveTab('backup')}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '6px',
                fontSize: '12.5px',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: activeTab === 'backup' ? 'var(--bg-panel)' : 'transparent',
                color: activeTab === 'backup' ? 'var(--text-main)' : 'var(--text-dim)',
              }}
            >
              <Download size={14} />
              备份与出厂恢复
            </button>
          </div>

          {/* 右侧面板内容 */}
          <div style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
            {/* Tab 1: 司导补贴与工时 */}
            {activeTab === 'allowance' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)' }}>新西兰司兼导常规补贴标准 (NZD)</h4>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                      南岛每日餐补基准 ($)
                    </label>
                    <input
                      type="number"
                      value={currentConfig.guideAllowance.southIslandMeal}
                      onChange={(e) => setCurrentConfig({
                        ...currentConfig,
                        guideAllowance: { ...currentConfig.guideAllowance, southIslandMeal: Number(e.target.value) || 0 },
                      })}
                      style={{ width: '100%' }}
                    />
                    <span style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '4px', display: 'block' }}>通常为 50 ~ 75 NZD/天</span>
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                      北岛每日餐补基准 ($)
                    </label>
                    <input
                      type="number"
                      value={currentConfig.guideAllowance.northIslandMeal}
                      onChange={(e) => setCurrentConfig({
                        ...currentConfig,
                        guideAllowance: { ...currentConfig.guideAllowance, northIslandMeal: Number(e.target.value) || 0 },
                      })}
                      style={{ width: '100%' }}
                    />
                    <span style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '4px', display: 'block' }}>通常为 40 ~ 60 NZD/天</span>
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                      异地过夜住宿补贴 ($/晚)
                    </label>
                    <input
                      type="number"
                      value={currentConfig.guideAllowance.accommodationSubsidy}
                      onChange={(e) => setCurrentConfig({
                        ...currentConfig,
                        guideAllowance: { ...currentConfig.guideAllowance, accommodationSubsidy: Number(e.target.value) || 0 },
                      })}
                      style={{ width: '100%' }}
                    />
                    <span style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '4px', display: 'block' }}>蒂阿瑙/但尼丁/库克山通常 180 ~ 300 NZD</span>
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                      每日标准工时上限 (小时)
                    </label>
                    <input
                      type="number"
                      value={currentConfig.guideAllowance.maxDailyHours}
                      onChange={(e) => setCurrentConfig({
                        ...currentConfig,
                        guideAllowance: { ...currentConfig.guideAllowance, maxDailyHours: Number(e.target.value) || 10 },
                      })}
                      style={{ width: '100%' }}
                    />
                    <span style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '4px', display: 'block' }}>新西兰法定司机工作时间不超过 10 小时</span>
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                      工时超时费单价 ($/小时 含GST)
                    </label>
                    <input
                      type="number"
                      value={currentConfig.guideAllowance.overtimeHourlyRate}
                      onChange={(e) => setCurrentConfig({
                        ...currentConfig,
                        guideAllowance: { ...currentConfig.guideAllowance, overtimeHourlyRate: Number(e.target.value) || 150 },
                      })}
                      style={{ width: '100%' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                      小费标准 ($/每人每天)
                    </label>
                    <input
                      type="number"
                      value={currentConfig.guideAllowance.tipPerDayPerPerson}
                      onChange={(e) => setCurrentConfig({
                        ...currentConfig,
                        guideAllowance: { ...currentConfig.guideAllowance, tipPerDayPerPerson: Number(e.target.value) || 6 },
                      })}
                      style={{ width: '100%' }}
                    />
                    <span style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '4px', display: 'block' }}>新西兰行规通常为 6 NZD/人/天</span>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: 车型日租与附加费 */}
            {activeTab === 'vehicles' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 600 }}>常用车型价格库配置</h4>
                  <button
                    onClick={handleAddVehicle}
                    style={{
                      background: 'rgba(245, 158, 11, 0.15)',
                      color: '#fbbf24',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <Plus size={13} /> 添加车型
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {currentConfig.vehicleList.map((v, idx) => (
                    <div
                      key={v.id}
                      style={{
                        background: 'var(--bg-panel)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '8px',
                        padding: '12px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                      }}
                    >
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <input
                          type="text"
                          value={v.name}
                          onChange={(e) => {
                            const list = [...currentConfig.vehicleList];
                            list[idx].name = e.target.value;
                            setCurrentConfig({ ...currentConfig, vehicleList: list });
                          }}
                          placeholder="车型名称"
                          style={{ flex: 1, fontWeight: 600 }}
                        />
                        <button
                          onClick={() => {
                            const list = currentConfig.vehicleList.filter((_, i) => i !== idx);
                            setCurrentConfig({ ...currentConfig, vehicleList: list });
                          }}
                          style={{ background: 'transparent', color: 'var(--text-dim)', padding: '4px' }}
                          title="删除车型"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                        <div>
                          <label style={{ fontSize: '11px', color: 'var(--text-dim)' }}>南岛基础日租 ($)</label>
                          <input
                            type="number"
                            value={v.southIslandPrice}
                            onChange={(e) => {
                              const list = [...currentConfig.vehicleList];
                              list[idx].southIslandPrice = Number(e.target.value) || 0;
                              setCurrentConfig({ ...currentConfig, vehicleList: list });
                            }}
                            style={{ width: '100%' }}
                          />
                        </div>

                        <div>
                          <label style={{ fontSize: '11px', color: 'var(--text-dim)' }}>北岛基础日租 ($)</label>
                          <input
                            type="number"
                            value={v.northIslandPrice}
                            onChange={(e) => {
                              const list = [...currentConfig.vehicleList];
                              list[idx].northIslandPrice = Number(e.target.value) || 0;
                              setCurrentConfig({ ...currentConfig, vehicleList: list });
                            }}
                            style={{ width: '100%' }}
                          />
                        </div>

                        <div>
                          <label style={{ fontSize: '11px', color: 'var(--text-dim)' }}>春节/旺季附加费 ($/天)</label>
                          <input
                            type="number"
                            value={v.holidaySurcharge}
                            onChange={(e) => {
                              const list = [...currentConfig.vehicleList];
                              list[idx].holidaySurcharge = Number(e.target.value) || 0;
                              setCurrentConfig({ ...currentConfig, vehicleList: list });
                            }}
                            style={{ width: '100%' }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab 3: 景点门票价格库 */}
            {activeTab === 'activities' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 600 }}>新西兰门票单价库维护</h4>
                  <button
                    onClick={handleAddActivity}
                    style={{
                      background: 'rgba(13, 153, 255, 0.15)',
                      color: '#38bdf8',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <Plus size={13} /> 新增景点门票
                  </button>
                </div>

                <input
                  type="text"
                  placeholder="搜索景点（如：霍比特、缆车、观鲸、萤火虫...）"
                  value={actSearch}
                  onChange={(e) => setActSearch(e.target.value)}
                  style={{ width: '100%' }}
                />

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '420px', overflowY: 'auto' }}>
                  {currentConfig.activityLibrary
                    .filter((a) => a.name.toLowerCase().includes(actSearch.toLowerCase()) || a.location.includes(actSearch))
                    .map((act, idx) => (
                      <div
                        key={act.id}
                        style={{
                          background: 'var(--bg-panel)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: '6px',
                          padding: '10px 12px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                        }}
                      >
                        <input
                          type="text"
                          value={act.name}
                          onChange={(e) => {
                            const list = [...currentConfig.activityLibrary];
                            list[idx].name = e.target.value;
                            setCurrentConfig({ ...currentConfig, activityLibrary: list });
                          }}
                          style={{ flex: 1 }}
                        />

                        <input
                          type="text"
                          value={act.location}
                          onChange={(e) => {
                            const list = [...currentConfig.activityLibrary];
                            list[idx].location = e.target.value;
                            setCurrentConfig({ ...currentConfig, activityLibrary: list });
                          }}
                          placeholder="地区"
                          style={{ width: '90px', fontSize: '12px' }}
                        />

                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>成人$</span>
                          <input
                            type="number"
                            value={act.adultPrice}
                            onChange={(e) => {
                              const list = [...currentConfig.activityLibrary];
                              list[idx].adultPrice = Number(e.target.value) || 0;
                              setCurrentConfig({ ...currentConfig, activityLibrary: list });
                            }}
                            style={{ width: '70px', fontWeight: 600, color: '#60a5fa' }}
                          />
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>儿童$</span>
                          <input
                            type="number"
                            value={act.childPrice || ''}
                            placeholder="无"
                            onChange={(e) => {
                              const list = [...currentConfig.activityLibrary];
                              list[idx].childPrice = Number(e.target.value) || undefined;
                              setCurrentConfig({ ...currentConfig, activityLibrary: list });
                            }}
                            style={{ width: '60px' }}
                          />
                        </div>

                        <button
                          onClick={() => {
                            const list = currentConfig.activityLibrary.filter((_, i) => i !== idx);
                            setCurrentConfig({ ...currentConfig, activityLibrary: list });
                          }}
                          style={{ background: 'transparent', color: 'var(--text-dim)' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Tab 4: 条款模板预设 */}
            {activeTab === 'terms' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 600 }}>默认报价条款模板</h4>

                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    价格包含默认模板
                  </label>
                  <textarea
                    rows={3}
                    value={currentConfig.defaultInclusions.join('\n')}
                    onChange={(e) => setCurrentConfig({
                      ...currentConfig,
                      defaultInclusions: e.target.value.split('\n').filter(Boolean),
                    })}
                    style={{ width: '100%', lineHeight: '1.5' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    价格不含默认模板
                  </label>
                  <textarea
                    rows={3}
                    value={currentConfig.defaultExclusions.join('\n')}
                    onChange={(e) => setCurrentConfig({
                      ...currentConfig,
                      defaultExclusions: e.target.value.split('\n').filter(Boolean),
                    })}
                    style={{ width: '100%', lineHeight: '1.5' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    说明条款默认模板
                  </label>
                  <textarea
                    rows={3}
                    value={currentConfig.defaultNotes.join('\n')}
                    onChange={(e) => setCurrentConfig({
                      ...currentConfig,
                      defaultNotes: e.target.value.split('\n').filter(Boolean),
                    })}
                    style={{ width: '100%', lineHeight: '1.5' }}
                  />
                </div>
              </div>
            )}

            {/* Tab 5: 备份与出厂恢复 */}
            {activeTab === 'backup' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 600 }}>配置数据备份与迁移</h4>
                
                <div style={{
                  background: 'var(--bg-panel)',
                  padding: '16px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}>
                  <div>
                    <strong style={{ fontSize: '13px', display: 'block' }}>导出当前所有价格配置为文件</strong>
                    <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
                      将车型日租、景点门票、餐补等参数打包为 JSON 配置文件，方便换电脑时迁移。
                    </span>
                  </div>
                  <button
                    onClick={exportConfigToFile}
                    style={{
                      background: 'var(--figma-blue)',
                      color: '#ffffff',
                      padding: '7px 14px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 500,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}
                  >
                    <Download size={13} />
                    导出配置文件
                  </button>
                </div>

                <div style={{
                  background: 'var(--bg-panel)',
                  padding: '16px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}>
                  <div>
                    <strong style={{ fontSize: '13px', display: 'block' }}>导入已备份的配置文件</strong>
                    <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
                      从之前导出的 JSON 文件恢复所有价格库与条款设置。
                    </span>
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImportFile}
                    accept=".json"
                    style={{ display: 'none' }}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-strong)',
                      color: 'var(--text-main)',
                      padding: '7px 14px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}
                  >
                    <Upload size={13} />
                    选择文件导入
                  </button>
                </div>

                <div style={{
                  background: 'rgba(239, 68, 68, 0.08)',
                  padding: '16px',
                  borderRadius: '8px',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}>
                  <div>
                    <strong style={{ fontSize: '13px', color: '#f87171', display: 'block' }}>恢复出厂默认基准设置</strong>
                    <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
                      清除所有自定义价格与景点，重置为新西兰行业初始标准。
                    </span>
                  </div>
                  <button
                    onClick={handleResetDefault}
                    style={{
                      background: '#ef4444',
                      color: '#ffffff',
                      padding: '7px 14px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 500,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}
                  >
                    <RotateCcw size={13} />
                    恢复出厂设置
                  </button>
                </div>
              </div>
            )}

            {/* 5. AI 视觉识别引擎配置 */}
            {activeTab === 'ai' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', maxWidth: '580px' }}>
                <div style={{
                  background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.12) 0%, rgba(59, 130, 246, 0.08) 100%)',
                  border: '1px solid rgba(168, 85, 247, 0.3)',
                  borderRadius: '8px',
                  padding: '14px 16px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <Sparkles size={16} color="#c084fc" />
                    <strong style={{ fontSize: '13.5px', color: 'var(--text-main)' }}>智能双轨制识别（多模态大模型 + 本地增强离线兜底）</strong>
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--text-dim)', lineHeight: '1.6' }}>
                    通过接入 Google Gemini 视觉大模型，能原生 100% 解析华文楷体、书法体、4 列表格排版，精准切分「行程」与「活动」门票，彻底解决中文乱码问题。若未配置 API Key，系统将自动无缝降级为纯前端 Canvas 增强离线引擎。
                  </p>
                </div>

                {/* 启用开关 */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  background: 'var(--bg-panel)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                }}>
                  <div>
                    <strong style={{ fontSize: '13px', display: 'block' }}>启用多模态 AI 视觉极速识别</strong>
                    <span style={{ fontSize: '11.5px', color: 'var(--text-dim)' }}>
                      优先使用 AI 大模型视觉能力解析上传的行程截图
                    </span>
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={currentConfig.aiConfig?.enabled !== false}
                      onChange={(e) => handleUpdateAi('enabled', e.target.checked)}
                      style={{ width: '18px', height: '18px', accentColor: 'var(--figma-blue)' }}
                    />
                  </label>
                </div>

                {/* API Key 输入框 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-main)' }}>
                      Gemini API Key <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <a
                      href="https://aistudio.google.com/app/apikey"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontSize: '11.5px',
                        color: 'var(--figma-blue)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px',
                        textDecoration: 'none',
                      }}
                    >
                      <span>免费获取 Gemini API Key</span>
                      <ExternalLink size={12} />
                    </a>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                      <input
                        type={showApiKey ? 'text' : 'password'}
                        value={currentConfig.aiConfig?.geminiApiKey || ''}
                        onChange={(e) => handleUpdateAi('geminiApiKey', e.target.value)}
                        placeholder="粘贴您的 AI Studio API Key (如 AIzaSy...)"
                        style={{
                          width: '100%',
                          fontSize: '12.5px',
                          padding: '8px 36px 8px 10px',
                          fontFamily: showApiKey ? 'monospace' : 'inherit',
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowApiKey(!showApiKey)}
                        style={{
                          position: 'absolute',
                          right: '8px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'transparent',
                          color: 'var(--text-dim)',
                          padding: '4px',
                        }}
                      >
                        {showApiKey ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={handleTestKey}
                      disabled={isTestingApi}
                      style={{
                        background: 'var(--bg-panel)',
                        border: '1px solid var(--border-strong)',
                        color: 'var(--text-main)',
                        padding: '0 14px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 500,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {isTestingApi ? (
                        <>
                          <Loader2 size={13} className="spin" />
                          测试中...
                        </>
                      ) : (
                        '测试连接'
                      )}
                    </button>
                  </div>

                  {/* 测试反馈提示 */}
                  {testResult && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '12px',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      marginTop: '4px',
                      background: testResult.success ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                      border: `1px solid ${testResult.success ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                      color: testResult.success ? '#34d399' : '#f87171',
                    }}>
                      {testResult.success ? <Check size={14} /> : <AlertCircle size={14} />}
                      <span>{testResult.message}</span>
                    </div>
                  )}
                </div>

                {/* 视觉模型选择 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', color: 'var(--text-dim)' }}>视觉解析模型</label>
                  <select
                    value={currentConfig.aiConfig?.modelName || 'gemini-1.5-flash'}
                    onChange={(e) => handleUpdateAi('modelName', e.target.value)}
                    style={{
                      width: '100%',
                      fontSize: '12.5px',
                      padding: '8px 10px',
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '6px',
                      color: 'var(--text-main)',
                    }}
                  >
                    <option value="gemini-1.5-flash">gemini-1.5-flash（推荐：极速毫秒级响应，免费额度超高）</option>
                    <option value="gemini-2.0-flash">gemini-2.0-flash（下一代模型：推理理解力极强）</option>
                    <option value="gemini-1.5-pro">gemini-1.5-pro（旗舰版：适合超长复杂排版文档）</option>
                  </select>
                </div>

                {/* 提示指引 */}
                <div style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  padding: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  fontSize: '11.5px',
                  color: 'var(--text-dim)',
                  lineHeight: '1.5',
                }}>
                  <strong style={{ color: 'var(--text-main)' }}>💡 温馨提示：</strong>
                  <span>1. Google AI Studio 提供的个人 API Key 每分钟支持 15 次调用，完全免费，定制游行程识别足够日常高频使用。</span>
                  <span>2. API Key 仅保存在您当前浏览器的本地存储中，不会上传到任何第三方服务器，请放心使用。</span>
                  <span>3. 如果暂时没有 API Key，也不影响使用，系统将自动使用本地增强 OCR 进行解析。</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 底部按钮栏 */}
        <div style={{
          padding: '14px 20px',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '10px',
          background: 'var(--bg-topbar)',
        }}>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              color: 'var(--text-muted)',
              padding: '7px 16px',
              borderRadius: '6px',
              fontSize: '13px',
            }}
          >
            取消
          </button>

          <button
            onClick={handleSave}
            style={{
              background: saveSuccess ? 'var(--figma-green)' : 'var(--figma-blue)',
              color: '#ffffff',
              padding: '7px 22px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            {saveSuccess ? (
              <>
                <Check size={14} />
                已保存到本地
              </>
            ) : (
              '保存修改'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
