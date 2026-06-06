import { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Table, Tag, Typography, Progress, Spin } from 'antd';
import {
  AppstoreOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  SearchOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { ColumnsType } from 'antd/es/table';
import {
  getDashboardStats,
  getRecentWorkOrders,
  getRecentEquipments,
} from '../services/dashboard';

const { Text } = Typography;

/* 设备状态数据（从 API 获取后填充） */
interface StatusItem {
  status: string;
  count: number;
  color: string;
  percent: number;
}

/* 最近工单数据 */
interface WorkOrderRecord {
  key: string;
  id: string;
  title: string;
  equipment: string;
  status: string;
  priority: string;
  createTime: string;
}

/* 最近设备数据 */
interface EquipmentRecord {
  key: string;
  id?: string;
  code: string;
  name: string;
  model: string;
  factory: string;
  workshop?: string;
  status: string;
  health?: number;
}

const statusColorMap: Record<string, string> = {
  运行中: '#10b981',
  停机: '#ef4444',
  维修中: '#f59e0b',
  待机: '#0ea5e9',
  处理中: '#0ea5e9',
  待处理: '#f59e0b',
  已完成: '#10b981',
};

const priorityColorMap: Record<string, string> = {
  P1: '#ef4444',
  P2: '#f59e0b',
  P3: '#0ea5e9',
  高: '#ef4444',
  中: '#f59e0b',
  低: '#10b981',
};

const workOrderColumns: ColumnsType<WorkOrderRecord> = [
  { title: '工单编号', dataIndex: 'id', key: 'id', render: (v: string) => <Text strong style={{ fontFamily: 'var(--ems-font-mono)', fontSize: 12 }}>{v}</Text> },
  { title: '工单标题', dataIndex: 'title', key: 'title' },
  { title: '关联设备', dataIndex: 'equipment', key: 'equipment', render: (v: string) => <Text type="secondary">{v}</Text> },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    render: (status: string) => (
      <Tag color={statusColorMap[status]} style={{ minWidth: 56, textAlign: 'center' }}>{status}</Tag>
    ),
  },
  {
    title: '优先级',
    dataIndex: 'priority',
    key: 'priority',
    render: (p: string) => (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 32,
        height: 22,
        borderRadius: 4,
        fontSize: 11,
        fontWeight: 700,
        fontFamily: 'var(--ems-font-mono)',
        color: priorityColorMap[p],
        background: `${priorityColorMap[p]}15`,
        border: `1px solid ${priorityColorMap[p]}30`,
      }}>
        {p}
      </span>
    ),
  },
  { title: '创建时间', dataIndex: 'createTime', key: 'createTime', render: (v: string) => <Text type="secondary" style={{ fontSize: 12 }}>{v}</Text> },
];

const equipmentColumns: ColumnsType<EquipmentRecord> = [
  { title: '设备编号', dataIndex: 'code', key: 'code', render: (v: string) => <Text strong style={{ fontFamily: 'var(--ems-font-mono)', fontSize: 12 }}>{v}</Text> },
  { title: '设备名称', dataIndex: 'name', key: 'name' },
  { title: '型号', dataIndex: 'model', key: 'model', render: (v: string) => <Text type="secondary">{v}</Text> },
  { title: '所属工厂', dataIndex: 'factory', key: 'factory' },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    render: (status: string) => (
      <Tag color={statusColorMap[status]}>{status}</Tag>
    ),
  },
  {
    title: '健康度',
    dataIndex: 'health',
    key: 'health',
    width: 160,
    render: (val: number) => (
      <Progress
        percent={val}
        size="small"
        strokeColor={val >= 80 ? '#10b981' : val >= 50 ? '#f59e0b' : '#ef4444'}
        format={(p) => <span style={{ fontSize: 12, fontWeight: 600 }}>{p}%</span>}
      />
    ),
  },
];

function Dashboard() {
  const navigate = useNavigate();

  /* 统计卡片数据 */
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsData, setStatsData] = useState({
    totalEquipment: 0,
    runningCount: 0,
    pendingWorkOrders: 0,
    todayInspections: 0,
    runningRate: '0%',
    inspectionRate: '0%',
    equipmentChange: 0,
    workOrderChange: 0,
  });

  /* 设备状态分布 */
  const [statusLoading, setStatusLoading] = useState(true);
  const [equipmentStatusData, setEquipmentStatusData] = useState<StatusItem[]>([]);

  /* 最近工单 */
  const [workOrderLoading, setWorkOrderLoading] = useState(true);
  const [recentWorkOrders, setRecentWorkOrders] = useState<WorkOrderRecord[]>([]);

  /* 最近设备 */
  const [equipmentLoading, setEquipmentLoading] = useState(true);
  const [recentEquipments, setRecentEquipments] = useState<EquipmentRecord[]>([]);

  /* 获取仪表盘统计数据（含设备状态分布） */
  useEffect(() => {
    let cancelled = false;
    const fetchStats = async () => {
      try {
        const res: any = await getDashboardStats();
        if (!cancelled && res.code === 0) {
          const data = res.data;
          setStatsData({
            totalEquipment: data.totalEquipment ?? 0,
            runningCount: data.runningEquipment ?? 0,
            pendingWorkOrders: data.pendingOrders ?? 0,
            todayInspections: data.todayInspections ?? 0,
            runningRate: data.runningRate ?? `${((data.runningEquipment ?? 0) / Math.max(data.totalEquipment ?? 1, 1) * 100).toFixed(1)}%`,
            inspectionRate: data.inspectionRate ?? `${((data.todayInspections ?? 0) / Math.max((data.totalInspections ?? 10), 1) * 100).toFixed(0)}%`,
            equipmentChange: data.equipmentChange ?? 0,
            workOrderChange: data.workOrderChange ?? 0,
          });

          /* 从 stats 响应中提取设备状态分布 */
          const statusList = data.statusDistribution ?? [];
          const defaultColorMap: Record<string, string> = {
            运行中: '#10b981',
            停机: '#ef4444',
            维修中: '#f59e0b',
            待机: '#0ea5e9',
          };
          const total = statusList.reduce((sum: number, item: any) => sum + (item.count ?? 0), 0);
          const mapped = statusList.map((item: any) => ({
            status: item.status ?? '',
            count: item.count ?? 0,
            color: defaultColorMap[item.status] ?? '#6b7280',
            percent: total > 0 ? Number(((item.count ?? 0) / total * 100).toFixed(1)) : 0,
          }));
          setEquipmentStatusData(mapped);
        }
      } catch (err) {
        console.error('获取仪表盘统计失败', err);
      } finally {
        if (!cancelled) {
          setStatsLoading(false);
          setStatusLoading(false);
        }
      }
    };
    fetchStats();
    return () => { cancelled = true; };
  }, []);

  /* 获取最近工单 */
  useEffect(() => {
    let cancelled = false;
    const fetchWorkOrders = async () => {
      try {
        const res: any = await getRecentWorkOrders();
        if (!cancelled && res.code === 0) {
          const list = res.data?.list ?? res.data ?? [];
          setRecentWorkOrders(
            list.map((item: any, index: number) => ({
              key: item.id ?? String(index + 1),
              id: item.orderNo ?? item.id ?? '',
              title: item.title ?? '',
              equipment: item.equipmentName ?? `设备#${item.equipmentId ?? ''}`,
              status: item.status ?? '',
              priority: item.faultLevel ?? item.priority ?? '',
              createTime: item.createdAt ? new Date(item.createdAt).toLocaleDateString('zh-CN') : '',
            })),
          );
        }
      } catch (err) {
        console.error('获取最近工单失败', err);
      } finally {
        if (!cancelled) setWorkOrderLoading(false);
      }
    };
    fetchWorkOrders();
    return () => { cancelled = true; };
  }, []);

  /* 获取最近设备 */
  useEffect(() => {
    let cancelled = false;
    const fetchEquipments = async () => {
      try {
        const res: any = await getRecentEquipments();
        if (!cancelled && res.code === 0) {
          const list = res.data?.list ?? res.data ?? [];
          setRecentEquipments(
            list.map((item: any, index: number) => ({
              key: item.id ?? String(index + 1),
              id: item.id,
              code: item.code ?? '',
              name: item.name ?? '',
              model: item.model ?? '',
              factory: item.factory ?? '',
              workshop: item.workshop ?? '',
              status: item.status ?? '',
              health: item.health ?? item.healthScore ?? (item.status === '运行中' ? 95 : item.status === '待机' ? 80 : 60),
            })),
          );
        }
      } catch (err) {
        console.error('获取最近设备失败', err);
      } finally {
        if (!cancelled) setEquipmentLoading(false);
      }
    };
    fetchEquipments();
    return () => { cancelled = true; };
  }, []);

  return (
    <div>
      {/* 页面标题 */}
      <div className="ems-page-header ems-animate-fade-up">
        <div>
          <div className="ems-page-title">仪表盘</div>
          <div className="ems-page-subtitle">设备运行状态总览 · 实时数据</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '4px 12px',
            borderRadius: 20,
            background: 'var(--ems-success-bg)',
            color: 'var(--ems-success)',
            fontSize: 12,
            fontWeight: 600,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--ems-success)', animation: 'ems-pulse-glow 2s infinite' }} />
            系统正常
          </span>
        </div>
      </div>

      {/* AI 智能洞察横幅 */}
      <div className="ems-animate-fade-up ems-delay-1" style={{
        background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.08), rgba(99, 102, 241, 0.08))',
        border: '1px solid rgba(14, 165, 233, 0.2)',
        borderRadius: 12,
        padding: '12px 20px',
        marginBottom: 24,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}>
        <span className="ai-insight-badge">AI 洞察</span>
        <Text style={{ color: 'var(--ems-text-secondary)', fontSize: 13 }}>
          {statsData.runningCount > 0
            ? `系统检测到 ${statsData.runningCount} 台设备正常运行，运行率 ${((statsData.runningCount / Math.max(statsData.totalEquipment, 1)) * 100).toFixed(1)}%。建议关注待处理工单。`
            : '正在分析设备运行数据...'}
        </Text>
        <span className="ai-live-indicator" style={{ marginLeft: 'auto' }}>实时分析中</span>
      </div>

      {/* 统计卡片 */}
      <Spin spinning={statsLoading}>
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={6}>
            <Card className="ems-stat-card ems-stat-card--primary ems-animate-fade-up ems-delay-1 ai-neon-card">
              <Statistic
                title="设备总数"
                value={statsData.totalEquipment}
                prefix={
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #0ea5e9, #6366f1)',
                    marginRight: 8,
                    boxShadow: '0 2px 8px rgba(14, 165, 233, 0.3)',
                  }}>
                    <AppstoreOutlined style={{ color: '#fff', fontSize: 18 }} />
                  </div>
                }
                valueStyle={{ color: 'var(--ems-primary)', fontSize: 28 }}
              />
              <div style={{ marginTop: 8, fontSize: 12, color: 'var(--ems-text-muted)' }}>
                {statsData.equipmentChange >= 0 ? (
                  <><ArrowUpOutlined style={{ color: 'var(--ems-success)', fontSize: 10 }} /> 较上月 +{statsData.equipmentChange}</>
                ) : (
                  <><ArrowDownOutlined style={{ color: 'var(--ems-danger)', fontSize: 10 }} /> 较上月 {statsData.equipmentChange}</>
                )}
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="ems-stat-card ems-stat-card--success ems-animate-fade-up ems-delay-2 ai-neon-card">
              <Statistic
                title="运行中"
                value={statsData.runningCount}
                prefix={
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    marginRight: 8,
                    boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
                  }}>
                    <CheckCircleOutlined style={{ color: '#fff', fontSize: 18 }} />
                  </div>
                }
                valueStyle={{ color: 'var(--ems-success)', fontSize: 28 }}
              />
              <div style={{ marginTop: 8, fontSize: 12, color: 'var(--ems-text-muted)' }}>
                运行率 {statsData.runningRate}
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="ems-stat-card ems-stat-card--warning ems-animate-fade-up ems-delay-3 ai-neon-card">
              <Statistic
                title="待处理工单"
                value={statsData.pendingWorkOrders}
                prefix={
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                    marginRight: 8,
                    boxShadow: '0 2px 8px rgba(245, 158, 11, 0.3)',
                  }}>
                    <ExclamationCircleOutlined style={{ color: '#fff', fontSize: 18 }} />
                  </div>
                }
                valueStyle={{ color: 'var(--ems-accent)', fontSize: 28 }}
              />
              <div style={{ marginTop: 8, fontSize: 12, color: 'var(--ems-text-muted)' }}>
                {statsData.workOrderChange <= 0 ? (
                  <><ArrowDownOutlined style={{ color: 'var(--ems-success)', fontSize: 10 }} /> 较昨日 {statsData.workOrderChange}</>
                ) : (
                  <><ArrowUpOutlined style={{ color: 'var(--ems-danger)', fontSize: 10 }} /> 较昨日 +{statsData.workOrderChange}</>
                )}
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="ems-stat-card ems-stat-card--info ems-animate-fade-up ems-delay-4 ai-neon-card">
              <Statistic
                title="今日巡检"
                value={statsData.todayInspections}
                prefix={
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    marginRight: 8,
                    boxShadow: '0 2px 8px rgba(99, 102, 241, 0.3)',
                  }}>
                    <SearchOutlined style={{ color: '#fff', fontSize: 18 }} />
                  </div>
                }
                valueStyle={{ color: 'var(--ems-info)', fontSize: 28 }}
              />
              <div style={{ marginTop: 8, fontSize: 12, color: 'var(--ems-text-muted)' }}>
                完成率 {statsData.inspectionRate}
              </div>
            </Card>
          </Col>
        </Row>
      </Spin>

      {/* 设备状态分布 + OEE */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={14}>
          <Card title="设备状态分布" className="ems-animate-fade-up ems-delay-3 ai-neon-card">
            <Spin spinning={statusLoading}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px 0' }}>
                <svg width="200" height="200" viewBox="0 0 200 200">
                  {/* Background circle */}
                  <circle cx="100" cy="100" r="70" fill="none" stroke="#e2e8f0" strokeWidth="20" />
                  {/* Animated segments - render dynamically based on equipmentStatusData */}
                  {equipmentStatusData.map((item, i) => {
                    const total = equipmentStatusData.reduce((s, d) => s + d.count, 0);
                    const offset = equipmentStatusData.slice(0, i).reduce((s, d) => s + d.count, 0);
                    const circumference = 2 * Math.PI * 70;
                    const dashArray = `${(item.count / total) * circumference} ${circumference}`;
                    const dashOffset = -(offset / total) * circumference;
                    return (
                      <circle
                        key={item.status}
                        cx="100" cy="100" r="70"
                        fill="none"
                        stroke={item.color}
                        strokeWidth="20"
                        strokeDasharray={dashArray}
                        strokeDashoffset={dashOffset}
                        strokeLinecap="round"
                        transform="rotate(-90 100 100)"
                        style={{
                          filter: `drop-shadow(0 0 6px ${item.color})`,
                          animation: `ai-ring-grow 1s ease-out ${i * 0.2}s both`,
                        }}
                      />
                    );
                  })}
                  {/* Center text */}
                  <text x="100" y="95" textAnchor="middle" style={{ fontSize: 28, fontWeight: 700, fill: 'var(--ems-text-primary)' }}>
                    {statsData.totalEquipment}
                  </text>
                  <text x="100" y="115" textAnchor="middle" style={{ fontSize: 12, fill: 'var(--ems-text-muted)' }}>
                    设备总数
                  </text>
                </svg>
              </div>
              {/* Legend */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: 20, flexWrap: 'wrap', marginTop: 16 }}>
                {equipmentStatusData.map(item => (
                  <div key={item.status} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: item.color, boxShadow: `0 0 6px ${item.color}` }} />
                    <span style={{ fontSize: 12, color: 'var(--ems-text-secondary)' }}>{item.status}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ems-text-primary)' }}>{item.count}</span>
                    <span style={{ fontSize: 11, color: 'var(--ems-text-muted)' }}>({item.percent}%)</span>
                  </div>
                ))}
              </div>
            </Spin>
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card className="ems-animate-fade-up ems-delay-4 ai-neon-card" title="OEE 综合效率" style={{ background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.03), rgba(99, 102, 241, 0.03))' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '16px 0' }}>
              {/* OEE 大数字 */}
              <div style={{ position: 'relative', width: 140, height: 140 }}>
                <svg width="140" height="140" viewBox="0 0 140 140">
                  <circle cx={70} cy={70} r={58} fill="none" stroke="#e2e8f0" strokeWidth="10" />
                  <circle
                    cx={70} cy={70} r={58} fill="none"
                    stroke="url(#oeeGradient)" strokeWidth="10"
                    strokeDasharray={`${0.853 * 2 * Math.PI * 58} ${2 * Math.PI * 58}`}
                    strokeLinecap="round"
                    transform="rotate(-90 70 70)"
                    style={{ transition: 'stroke-dasharray 1s ease-out', filter: 'drop-shadow(0 0 8px rgba(14, 165, 233, 0.5))' }}
                  />
                  <defs>
                    <linearGradient id="oeeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#0ea5e9" />
                      <stop offset="100%" stopColor="#6366f1" />
                    </linearGradient>
                  </defs>
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontFamily: 'var(--ems-font-display)', fontSize: 32, fontWeight: 800, background: 'var(--ems-gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>85.3%</span>
                  <span style={{ fontSize: 11, color: 'var(--ems-text-muted)', marginTop: -2 }}>OEE</span>
                </div>
              </div>
              {/* 子指标 */}
              <Row gutter={16} style={{ marginTop: 20, width: '100%' }}>
                <Col span={8} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: 'var(--ems-text-muted)', marginBottom: 4 }}>可用率</div>
                  <div className="ai-progress-glow" style={{ fontSize: 18, fontWeight: 700, color: '#10b981', fontFamily: 'var(--ems-font-display)', textShadow: '0 0 8px rgba(16, 185, 129, 0.4)' }}>92%</div>
                </Col>
                <Col span={8} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: 'var(--ems-text-muted)', marginBottom: 4 }}>性能率</div>
                  <div className="ai-progress-glow" style={{ fontSize: 18, fontWeight: 700, color: '#0ea5e9', fontFamily: 'var(--ems-font-display)', textShadow: '0 0 8px rgba(14, 165, 233, 0.4)' }}>95%</div>
                </Col>
                <Col span={8} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: 'var(--ems-text-muted)', marginBottom: 4 }}>质量率</div>
                  <div className="ai-progress-glow" style={{ fontSize: 18, fontWeight: 700, color: '#6366f1', fontFamily: 'var(--ems-font-display)', textShadow: '0 0 8px rgba(99, 102, 241, 0.4)' }}>98%</div>
                </Col>
              </Row>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 最近工单 */}
      <Card
        className="ems-animate-fade-up ems-delay-5"
        title="最近工单"
        style={{ marginBottom: 24 }}
        extra={<a onClick={() => navigate('/work-order')} style={{ fontSize: 13 }}>查看全部 →</a>}
      >
        <Table
          columns={workOrderColumns}
          dataSource={recentWorkOrders}
          loading={workOrderLoading}
          pagination={false}
          size="middle"
        />
      </Card>

      {/* 设备概览 */}
      <Card
        className="ems-animate-fade-up ems-delay-6"
        title="设备概览"
        extra={<a onClick={() => navigate('/equipment')} style={{ fontSize: 13 }}>查看全部 →</a>}
      >
        <Table
          columns={equipmentColumns}
          dataSource={recentEquipments}
          loading={equipmentLoading}
          pagination={false}
          size="middle"
        />
      </Card>
    </div>
  );
}

export default Dashboard;
