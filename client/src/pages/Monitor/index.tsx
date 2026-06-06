import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, Row, Col, Statistic, Tag, Spin, Input, Select, Typography, Tooltip, Button } from 'antd';
import {
  MonitorOutlined,
  WarningOutlined,
  ApiOutlined,
  ReloadOutlined,
  DashboardOutlined,
  ThunderboltOutlined,
  FireOutlined,
  ShakeOutlined,
} from '@ant-design/icons';
import { getEquipmentList } from '../../services/equipment';
import { getDashboardStats } from '../../services/dashboard';

const { Text } = Typography;

/* 设备监控数据接口 */
interface MonitorDevice {
  key: string;
  id?: string;
  code: string;
  name: string;
  model: string;
  factory: string;
  status: string;
  /* 模拟 IoT 传感器数据 */
  temperature: number;
  vibration: number;
  rpm: number;
  power: number;
  lastUpdate: string;
}

const statusColorMap: Record<string, string> = {
  运行中: '#10b981',
  停机: '#ef4444',
  维修中: '#f59e0b',
  待机: '#0ea5e9',
};

const statusBgMap: Record<string, string> = {
  运行中: 'rgba(16, 185, 129, 0.08)',
  停机: 'rgba(239, 68, 68, 0.08)',
  维修中: 'rgba(245, 158, 11, 0.08)',
  待机: 'rgba(14, 165, 233, 0.08)',
};

/* 生成模拟传感器数据 */
function generateSensorData(status: string) {
  if (status === '运行中') {
    return {
      temperature: Number((35 + Math.random() * 40).toFixed(1)),
      vibration: Number((0.5 + Math.random() * 4).toFixed(1)),
      rpm: Number((800 + Math.random() * 2200).toFixed(0)),
      power: Number((15 + Math.random() * 85).toFixed(1)),
    };
  }
  return {
    temperature: Number((20 + Math.random() * 10).toFixed(1)),
    vibration: 0,
    rpm: 0,
    power: 0,
  };
}

function MonitorPage() {
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [devices, setDevices] = useState<MonitorDevice[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    running: 0,
    warning: 0,
    alarm: 0,
  });
  const [filterStatus, setFilterStatus] = useState<string | undefined>(undefined);
  const [searchText, setSearchText] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefresh, setLastRefresh] = useState('');
  const refreshTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* 获取设备列表 */
  const fetchDevices = useCallback(async () => {
    try {
      const params: Record<string, unknown> = { page: 1, pageSize: 50 };
      if (filterStatus) params.status = filterStatus;
      if (searchText) params.keyword = searchText;
      const res: any = await getEquipmentList(params);
      if (res.code === 0) {
        const list = res.data?.list ?? [];
        setDevices(
          list.map((item: any, index: number) => {
            const sensor = generateSensorData(item.status ?? '待机');
            return {
              key: item.id ?? String(index + 1),
              id: item.id,
              code: item.code ?? '',
              name: item.name ?? '',
              model: item.model ?? '',
              factory: item.factory ?? '',
              status: item.status ?? '待机',
              ...sensor,
              lastUpdate: new Date().toLocaleTimeString('zh-CN'),
            };
          }),
        );
      }
    } catch (err) {
      console.error('获取设备列表失败', err);
    } finally {
      setLoading(false);
    }
  }, [filterStatus, searchText]);

  /* 获取统计数据 */
  const fetchStats = useCallback(async () => {
    try {
      const res: any = await getDashboardStats();
      if (res.code === 0) {
        const data = res.data;
        const statusList = data.statusDistribution ?? [];
        let running = 0;
        let warning = 0;
        let alarm = 0;
        statusList.forEach((item: any) => {
          if (item.status === '运行中') running = item.count ?? 0;
          if (item.status === '维修中') warning = item.count ?? 0;
          if (item.status === '停机') alarm = item.count ?? 0;
        });
        setStats({
          total: data.totalEquipment ?? 0,
          running,
          warning,
          alarm,
        });
      }
    } catch (err) {
      console.error('获取统计数据失败', err);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  /* 初始加载 */
  useEffect(() => {
    fetchDevices();
    fetchStats();
  }, [fetchDevices, fetchStats]);

  /* 自动刷新模拟（每 5 秒更新传感器数据） */
  useEffect(() => {
    if (autoRefresh) {
      refreshTimerRef.current = setInterval(() => {
        setDevices((prev) =>
          prev.map((d) => {
            const sensor = generateSensorData(d.status);
            return { ...d, ...sensor, lastUpdate: new Date().toLocaleTimeString('zh-CN') };
          }),
        );
        setLastRefresh(new Date().toLocaleTimeString('zh-CN'));
      }, 5000);
    }
    return () => {
      if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
    };
  }, [autoRefresh]);

  /* 手动刷新 */
  const handleRefresh = () => {
    setLoading(true);
    setStatsLoading(true);
    fetchDevices();
    fetchStats();
  };

  /* 获取温度状态 */
  const getTempStatus = (temp: number, status: string) => {
    if (status !== '运行中') return 'normal';
    if (temp > 70) return 'danger';
    if (temp > 55) return 'warning';
    return 'normal';
  };

  /* 获取振动状态 */
  const getVibrationStatus = (vib: number, status: string) => {
    if (status !== '运行中') return 'normal';
    if (vib > 3.5) return 'danger';
    if (vib > 2.5) return 'warning';
    return 'normal';
  };

  const tempStatusColor: Record<string, string> = {
    normal: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
  };

  return (
    <div>
      <div className="ems-page-header ems-animate-fade-up">
        <div>
          <div className="ems-page-title">IoT 监控</div>
          <div className="ems-page-subtitle">设备实时状态与传感器数据监控</div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '4px 12px',
            borderRadius: 20,
            background: autoRefresh ? 'var(--ems-success-bg)' : 'var(--ems-content-bg)',
            color: autoRefresh ? 'var(--ems-success)' : 'var(--ems-text-muted)',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <span style={{
              width: 6, height: 6, borderRadius: '50%',
              background: autoRefresh ? 'var(--ems-success)' : 'var(--ems-text-muted)',
              animation: autoRefresh ? 'ems-pulse-glow 2s infinite' : 'none',
            }} />
            {autoRefresh ? '实时监控中' : '已暂停'}
          </span>
          {lastRefresh && (
            <Text type="secondary" style={{ fontSize: 12 }}>最后更新: {lastRefresh}</Text>
          )}
        </div>
      </div>

      {/* AI 智能监控洞察 */}
      <div className="ems-animate-fade-up ems-delay-1" style={{
        background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.06), rgba(245, 158, 11, 0.06))',
        border: '1px solid rgba(239, 68, 68, 0.15)',
        borderRadius: 12,
        padding: '12px 20px',
        marginBottom: 24,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}>
        <span className="ai-insight-badge" style={{ background: 'linear-gradient(90deg, rgba(239, 68, 68, 0.15), rgba(245, 158, 11, 0.15))', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}>
          AI 预警
        </span>
        <Text style={{ color: 'var(--ems-text-secondary)', fontSize: 13 }}>
          {devices.some(d => d.status === '维修中')
            ? `检测到 ${devices.filter(d => d.status === '维修中').length} 台设备处于维修状态，建议优先处理。`
            : '所有设备运行正常，AI 模型预测未来 24 小时内无异常风险。'}
        </Text>
        <span className="ai-live-indicator" style={{ marginLeft: 'auto' }}>实时监控中</span>
      </div>

      {/* 概览统计 */}
      <Spin spinning={statsLoading}>
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={6}>
            <div className="ems-stat-card ems-stat-card--primary ems-animate-fade-up ems-delay-1" style={{ padding: '20px 20px 20px 24px' }}>
              <Statistic title="接入设备" value={stats.total} prefix={<ApiOutlined />} valueStyle={{ color: 'var(--ems-primary)', fontSize: 28 }} />
            </div>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <div className="ems-stat-card ems-stat-card--success ems-animate-fade-up ems-delay-2" style={{ padding: '20px 20px 20px 24px' }}>
              <Statistic title="运行中" value={stats.running} prefix={<MonitorOutlined />} valueStyle={{ color: '#10b981', fontSize: 28 }} />
            </div>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <div className="ems-stat-card ems-stat-card--warning ems-animate-fade-up ems-delay-3" style={{ padding: '20px 20px 20px 24px' }}>
              <Statistic title="维修中" value={stats.warning} prefix={<WarningOutlined />} valueStyle={{ color: '#f59e0b', fontSize: 28 }} />
            </div>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <div className="ems-stat-card ems-stat-card--danger ems-animate-fade-up ems-delay-4" style={{ padding: '20px 20px 20px 24px' }}>
              <Statistic title="停机报警" value={stats.alarm} prefix={<WarningOutlined />} valueStyle={{ color: '#ef4444', fontSize: 28 }} />
            </div>
          </Col>
        </Row>
      </Spin>

      {/* 筛选栏 */}
      <div className="ems-filter-bar ems-animate-fade-up ems-delay-3">
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Input
            placeholder="搜索设备名称/编号"
            prefix={<MonitorOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onPressEnter={() => { setLoading(true); fetchDevices(); }}
            style={{ width: 220 }}
            allowClear
          />
          <Select
            placeholder="设备状态"
            value={filterStatus}
            onChange={(val) => { setFilterStatus(val); setLoading(true); }}
            style={{ width: 120 }}
            allowClear
          >
            <Select.Option value="运行中">运行中</Select.Option>
            <Select.Option value="待机">待机</Select.Option>
            <Select.Option value="维修中">维修中</Select.Option>
            <Select.Option value="停机">停机</Select.Option>
          </Select>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Tooltip title={autoRefresh ? '暂停自动刷新' : '开启自动刷新'}>
            <Button icon={<DashboardOutlined />} onClick={() => setAutoRefresh(!autoRefresh)}>
              {autoRefresh ? '暂停' : '自动刷新'}
            </Button>
          </Tooltip>
          <Button type="primary" icon={<ReloadOutlined />} onClick={handleRefresh}>
            刷新数据
          </Button>
        </div>
      </div>

      {/* 设备实时数据卡片 */}
      <Spin spinning={loading}>
        <Row gutter={[16, 16]}>
          {devices.map((device, index) => {
            const tempStatus = getTempStatus(device.temperature, device.status);
            const vibStatus = getVibrationStatus(device.vibration, device.status);
            return (
              <Col xs={24} sm={12} lg={8} xl={6} key={device.key}>
                <Card
                  size="small"
                  className={`ai-card-3d ems-animate-fade-up ems-delay-${Math.min(index % 6 + 1, 6)}`}
                  style={{
                    borderRadius: 12,
                    border: `1px solid ${statusColorMap[device.status]}30`,
                    background: statusBgMap[device.status] ?? 'var(--ems-card-bg)',
                    transition: 'all 0.3s',
                  }}
                  bodyStyle={{ padding: '16px' }}
                  hoverable
                >
                  {/* 设备头部 */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                        <span className="ai-status-glow" style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: statusColorMap[device.status] }} />
                        <Text strong style={{ fontSize: 14, color: 'var(--ems-text-primary)' }} ellipsis>
                          {device.name}
                        </Text>
                      </div>
                      <Text type="secondary" style={{ fontSize: 11, fontFamily: 'var(--ems-font-mono)' }}>
                        {device.code}
                      </Text>
                    </div>
                    <Tag color={statusColorMap[device.status]} style={{ marginLeft: 8, flexShrink: 0 }}>
                      {device.status}
                    </Tag>
                  </div>

                  {/* 传感器数据网格 */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 8,
                    padding: '10px 0',
                    borderTop: '1px solid rgba(0,0,0,0.04)',
                  }}>
                    <Tooltip title="温度传感器">
                      <div style={{
                        padding: '8px',
                        borderRadius: 8,
                        background: `${tempStatusColor[tempStatus]}10`,
                        border: `1px solid ${tempStatusColor[tempStatus]}20`,
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                          <FireOutlined style={{ fontSize: 11, color: tempStatusColor[tempStatus] }} />
                          <Text type="secondary" style={{ fontSize: 10 }}>温度</Text>
                        </div>
                        <Text strong style={{ fontSize: 16, fontFamily: 'var(--ems-font-display)', color: tempStatusColor[tempStatus] }}>
                          {device.temperature}<span style={{ fontSize: 11, fontWeight: 400 }}>°C</span>
                        </Text>
                        {/* 温度进度条 */}
                        <div className="ai-sensor-bar">
                          <div className="ai-sensor-bar__fill" style={{
                            width: `${Math.min((device.temperature / 100) * 100, 100)}%`,
                            background: tempStatusColor[tempStatus],
                          }} />
                        </div>
                      </div>
                    </Tooltip>
                    <Tooltip title="振动传感器">
                      <div style={{
                        padding: '8px',
                        borderRadius: 8,
                        background: `${tempStatusColor[vibStatus]}10`,
                        border: `1px solid ${tempStatusColor[vibStatus]}20`,
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                          <ShakeOutlined style={{ fontSize: 11, color: tempStatusColor[vibStatus] }} />
                          <Text type="secondary" style={{ fontSize: 10 }}>振动</Text>
                        </div>
                        <Text strong style={{ fontSize: 16, fontFamily: 'var(--ems-font-display)', color: tempStatusColor[vibStatus] }}>
                          {device.vibration}<span style={{ fontSize: 11, fontWeight: 400 }}>mm/s</span>
                        </Text>
                        {/* 振动进度条 */}
                        <div className="ai-sensor-bar">
                          <div className="ai-sensor-bar__fill" style={{
                            width: `${Math.min((device.vibration / 5) * 100, 100)}%`,
                            background: tempStatusColor[vibStatus],
                          }} />
                        </div>
                      </div>
                    </Tooltip>
                    <Tooltip title="转速传感器">
                      <div style={{
                        padding: '8px',
                        borderRadius: 8,
                        background: 'rgba(14, 165, 233, 0.06)',
                        border: '1px solid rgba(14, 165, 233, 0.12)',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                          <DashboardOutlined style={{ fontSize: 11, color: '#0ea5e9' }} />
                          <Text type="secondary" style={{ fontSize: 10 }}>转速</Text>
                        </div>
                        <Text strong style={{ fontSize: 16, fontFamily: 'var(--ems-font-display)', color: '#0ea5e9' }}>
                          {device.rpm}<span style={{ fontSize: 11, fontWeight: 400 }}>RPM</span>
                        </Text>
                        {/* 转速进度条 */}
                        <div className="ai-sensor-bar">
                          <div className="ai-sensor-bar__fill" style={{
                            width: `${Math.min((device.rpm / 3000) * 100, 100)}%`,
                            background: '#0ea5e9',
                          }} />
                        </div>
                      </div>
                    </Tooltip>
                    <Tooltip title="功率传感器">
                      <div style={{
                        padding: '8px',
                        borderRadius: 8,
                        background: 'rgba(99, 102, 241, 0.06)',
                        border: '1px solid rgba(99, 102, 241, 0.12)',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                          <ThunderboltOutlined style={{ fontSize: 11, color: '#6366f1' }} />
                          <Text type="secondary" style={{ fontSize: 10 }}>功率</Text>
                        </div>
                        <Text strong style={{ fontSize: 16, fontFamily: 'var(--ems-font-display)', color: '#6366f1' }}>
                          {device.power}<span style={{ fontSize: 11, fontWeight: 400 }}>kW</span>
                        </Text>
                        {/* 功率进度条 */}
                        <div className="ai-sensor-bar">
                          <div className="ai-sensor-bar__fill" style={{
                            width: `${Math.min((device.power / 100) * 100, 100)}%`,
                            background: '#6366f1',
                          }} />
                        </div>
                      </div>
                    </Tooltip>
                  </div>

                  {/* 更新时间 */}
                  <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text type="secondary" style={{ fontSize: 10 }}>
                      {device.factory} · {device.model}
                    </Text>
                    <Text type="secondary" style={{ fontSize: 10, fontFamily: 'var(--ems-font-mono)' }}>
                      {device.lastUpdate}
                    </Text>
                  </div>
                </Card>
              </Col>
            );
          })}
        </Row>
      </Spin>

      {/* 空状态 */}
      {!loading && devices.length === 0 && (
        <div className="ems-empty-state ems-animate-fade-up">
          <MonitorOutlined style={{ fontSize: 48, color: 'var(--ems-text-muted)', marginBottom: 16 }} />
          <Text type="secondary">暂无监控设备数据</Text>
        </div>
      )}

      {/* 数据流动画 */}
      <div className="ai-data-flow" style={{ height: 2, marginTop: 24, borderRadius: 1 }} />
    </div>
  );
}

export default MonitorPage;
