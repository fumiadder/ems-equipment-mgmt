import { useState, useEffect, useCallback } from 'react';
import { Card, Row, Col, Typography, Spin, Table, Tag, Tabs, Statistic, Progress, Empty } from 'antd';
import {
  BarChartOutlined,
  PieChartOutlined,
  LineChartOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
  AppstoreOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ToolOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { getDashboardStats } from '../../services/dashboard';
import { getEquipmentList } from '../../services/equipment';
import { getWorkOrderList } from '../../services/workOrder';

const { Text } = Typography;

/* 设备状态分布数据 */
interface StatusItem {
  status: string;
  count: number;
  color: string;
  percent: number;
}

/* 工单记录 */
interface WorkOrderRecord {
  key: string;
  id: string;
  title: string;
  equipment: string;
  status: string;
  priority: string;
  createTime: string;
}

/* 设备记录 */
interface EquipmentRecord {
  key: string;
  code: string;
  name: string;
  model: string;
  factory: string;
  status: string;
}

const statusColorMap: Record<string, string> = {
  运行中: '#10b981',
  停机: '#ef4444',
  维修中: '#f59e0b',
  待机: '#0ea5e9',
  处理中: '#0ea5e9',
  待处理: '#f59e0b',
  已完成: '#10b981',
  已关闭: '#94a3b8',
};

const priorityColorMap: Record<string, string> = {
  P1: '#ef4444',
  P2: '#f59e0b',
  P3: '#0ea5e9',
  高: '#ef4444',
  中: '#f59e0b',
  低: '#10b981',
};

/* 报表类型卡片 */
const reportTypes = [
  {
    icon: <BarChartOutlined style={{ fontSize: 28, color: '#0ea5e9' }} />,
    title: '设备运行报表',
    desc: '统计各设备运行时长、停机次数、故障率等指标',
    variant: 'ems-stat-card--primary' as const,
  },
  {
    icon: <PieChartOutlined style={{ fontSize: 28, color: '#10b981' }} />,
    title: '工单统计报表',
    desc: '分析工单数量趋势、完成率、平均处理时长',
    variant: 'ems-stat-card--success' as const,
  },
  {
    icon: <LineChartOutlined style={{ fontSize: 28, color: '#6366f1' }} />,
    title: '备件消耗报表',
    desc: '追踪备件使用情况、库存周转率、采购建议',
    variant: 'ems-stat-card--info' as const,
  },
  {
    icon: <BarChartOutlined style={{ fontSize: 28, color: '#f59e0b' }} />,
    title: '巡检执行报表',
    desc: '统计巡检计划执行率、异常发现数量',
    variant: 'ems-stat-card--warning' as const,
  },
  {
    icon: <PieChartOutlined style={{ fontSize: 28, color: '#ec4899' }} />,
    title: '能耗分析报表',
    desc: '分析设备能耗趋势、能效比、节能建议',
    variant: 'ems-stat-card--danger' as const,
  },
  {
    icon: <LineChartOutlined style={{ fontSize: 28, color: '#14b8a6' }} />,
    title: '综合分析报表',
    desc: '多维度综合分析设备管理整体状况',
    variant: 'ems-stat-card--success' as const,
  },
];

/* 工单表格列 */
const workOrderColumns: ColumnsType<WorkOrderRecord> = [
  {
    title: '工单编号',
    dataIndex: 'id',
    key: 'id',
    render: (v: string) => (
      <Text strong style={{ fontFamily: 'var(--ems-font-mono)', fontSize: 12 }}>{v}</Text>
    ),
  },
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
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: 32, height: 22, borderRadius: 4, fontSize: 11, fontWeight: 700,
        fontFamily: 'var(--ems-font-mono)', color: priorityColorMap[p],
        background: `${priorityColorMap[p]}15`, border: `1px solid ${priorityColorMap[p]}30`,
      }}>
        {p}
      </span>
    ),
  },
  { title: '创建时间', dataIndex: 'createTime', key: 'createTime', render: (v: string) => <Text type="secondary" style={{ fontSize: 12 }}>{v}</Text> },
];

/* 设备表格列 */
const equipmentColumns: ColumnsType<EquipmentRecord> = [
  {
    title: '设备编号',
    dataIndex: 'code',
    key: 'code',
    render: (v: string) => <Text strong style={{ fontFamily: 'var(--ems-font-mono)', fontSize: 12 }}>{v}</Text>,
  },
  { title: '设备名称', dataIndex: 'name', key: 'name' },
  { title: '型号', dataIndex: 'model', key: 'model', render: (v: string) => <Text type="secondary">{v}</Text> },
  { title: '所属工厂', dataIndex: 'factory', key: 'factory' },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    render: (status: string) => <Tag color={statusColorMap[status]}>{status}</Tag>,
  },
];

function ReportPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [statsLoading, setStatsLoading] = useState(true);
  const [equipmentLoading, setEquipmentLoading] = useState(true);
  const [workOrderLoading, setWorkOrderLoading] = useState(true);
  const [statsData, setStatsData] = useState({
    totalEquipment: 0,
    runningCount: 0,
    pendingWorkOrders: 0,
    todayInspections: 0,
    runningRate: '0%',
  });
  const [statusDistribution, setStatusDistribution] = useState<StatusItem[]>([]);
  const [equipmentList, setEquipmentList] = useState<EquipmentRecord[]>([]);
  const [workOrderList, setWorkOrderList] = useState<WorkOrderRecord[]>([]);

  /* 获取统计数据 */
  const fetchStats = useCallback(async () => {
    try {
      const res: any = await getDashboardStats();
      if (res.code === 0) {
        const data = res.data;
        const total = data.totalEquipment ?? 0;
        const running = data.runningEquipment ?? 0;
        setStatsData({
          totalEquipment: total,
          runningCount: running,
          pendingWorkOrders: data.pendingOrders ?? 0,
          todayInspections: data.todayInspections ?? 0,
          runningRate: total > 0 ? `${((running / total) * 100).toFixed(1)}%` : '0%',
        });

        /* 设备状态分布 */
        const statusList = data.statusDistribution ?? [];
        const defaultColorMap: Record<string, string> = {
          运行中: '#10b981', 停机: '#ef4444', 维修中: '#f59e0b', 待机: '#0ea5e9',
        };
        const sum = statusList.reduce((s: number, item: any) => s + (item.count ?? 0), 0);
        setStatusDistribution(
          statusList.map((item: any) => ({
            status: item.status ?? '',
            count: item.count ?? 0,
            color: defaultColorMap[item.status] ?? '#6b7280',
            percent: sum > 0 ? Number(((item.count ?? 0) / sum * 100).toFixed(1)) : 0,
          })),
        );
      }
    } catch (err) {
      console.error('获取统计数据失败', err);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  /* 获取设备列表 */
  const fetchEquipment = useCallback(async () => {
    try {
      const res: any = await getEquipmentList({ page: 1, pageSize: 20 });
      if (res.code === 0) {
        const list = res.data?.list ?? [];
        setEquipmentList(
          list.map((item: any, index: number) => ({
            key: item.id ?? String(index + 1),
            code: item.code ?? '',
            name: item.name ?? '',
            model: item.model ?? '',
            factory: item.factory ?? '',
            status: item.status ?? '',
          })),
        );
      }
    } catch (err) {
      console.error('获取设备列表失败', err);
    } finally {
      setEquipmentLoading(false);
    }
  }, []);

  /* 获取工单列表 */
  const fetchWorkOrders = useCallback(async () => {
    try {
      const res: any = await getWorkOrderList({ page: 1, pageSize: 20 });
      if (res.code === 0) {
        const list = res.data?.list ?? [];
        setWorkOrderList(
          list.map((item: any, index: number) => ({
            key: item.id ?? String(index + 1),
            id: item.id ?? item.workOrderNo ?? '',
            title: item.title ?? item.name ?? '',
            equipment: item.equipment ?? item.equipmentName ?? '',
            status: item.status ?? '',
            priority: item.priority ?? '',
            createTime: item.createTime ?? item.createdAt ?? '',
          })),
        );
      }
    } catch (err) {
      console.error('获取工单列表失败', err);
    } finally {
      setWorkOrderLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    fetchEquipment();
    fetchWorkOrders();
  }, [fetchStats, fetchEquipment, fetchWorkOrders]);

  /* 报表概览 Tab */
  const renderOverview = () => (
    <div>
      {/* 核心指标 */}
      <Spin spinning={statsLoading}>
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={6}>
            <div className="ems-stat-card ems-stat-card--primary ems-animate-fade-up ems-delay-1" style={{ padding: '20px 20px 20px 24px' }}>
              <Statistic title="设备总数" value={statsData.totalEquipment} prefix={<AppstoreOutlined />} valueStyle={{ color: 'var(--ems-primary)', fontSize: 28 }} />
            </div>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <div className="ems-stat-card ems-stat-card--success ems-animate-fade-up ems-delay-2" style={{ padding: '20px 20px 20px 24px' }}>
              <Statistic title="运行中" value={statsData.runningCount} prefix={<CheckCircleOutlined />} valueStyle={{ color: '#10b981', fontSize: 28 }} />
              <div style={{ marginTop: 8, fontSize: 12, color: 'var(--ems-text-muted)' }}>运行率 {statsData.runningRate}</div>
            </div>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <div className="ems-stat-card ems-stat-card--warning ems-animate-fade-up ems-delay-3" style={{ padding: '20px 20px 20px 24px' }}>
              <Statistic title="待处理工单" value={statsData.pendingWorkOrders} prefix={<ExclamationCircleOutlined />} valueStyle={{ color: '#f59e0b', fontSize: 28 }} />
            </div>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <div className="ems-stat-card ems-stat-card--info ems-animate-fade-up ems-delay-4" style={{ padding: '20px 20px 20px 24px' }}>
              <Statistic title="今日巡检" value={statsData.todayInspections} prefix={<ClockCircleOutlined />} valueStyle={{ color: '#6366f1', fontSize: 28 }} />
            </div>
          </Col>
        </Row>
      </Spin>

      {/* 设备状态分布 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={12}>
          <Card className="ems-animate-fade-up ems-delay-3" title="设备状态分布" style={{ height: '100%' }}>
            <Spin spinning={statsLoading}>
              {statusDistribution.length > 0 ? (
                <Row gutter={16} align="middle">
                  <Col span={10} style={{ display: 'flex', justifyContent: 'center' }}>
                    <svg width="180" height="180" viewBox="0 0 180 180">
                      {(() => {
                        const cx = 90, cy = 90, r = 70, strokeWidth = 18;
                        const circumference = 2 * Math.PI * r;
                        let offset = 0;
                        return statusDistribution.map((item) => {
                          const dashLength = (item.percent / 100) * circumference;
                          const gap = 3;
                          const el = (
                            <circle
                              key={item.status}
                              cx={cx} cy={cy} r={r} fill="none"
                              stroke={item.color} strokeWidth={strokeWidth}
                              strokeDasharray={`${dashLength - gap} ${circumference - dashLength + gap}`}
                              strokeDashoffset={-offset}
                              strokeLinecap="round"
                              style={{ opacity: 0.85 }}
                            />
                          );
                          offset += dashLength;
                          return el;
                        });
                      })()}
                      <text x={90} y={82} textAnchor="middle" fill="var(--ems-text-primary)" fontSize="28" fontWeight="700" fontFamily="var(--ems-font-display)">{statsData.totalEquipment}</text>
                      <text x={90} y={102} textAnchor="middle" fill="var(--ems-text-muted)" fontSize="12">设备总数</text>
                    </svg>
                  </Col>
                  <Col span={14}>
                    {statusDistribution.map((item) => (
                      <div key={item.status} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ width: 10, height: 10, borderRadius: 3, background: item.color, display: 'inline-block' }} />
                          <span style={{ fontWeight: 500 }}>{item.status}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <span style={{ fontWeight: 700, fontFamily: 'var(--ems-font-display)', fontSize: 18 }}>{item.count}</span>
                          <Progress percent={item.percent} size="small" strokeColor={item.color} style={{ width: 80, margin: 0 }} showInfo={false} />
                        </div>
                      </div>
                    ))}
                  </Col>
                </Row>
              ) : (
                <Empty description="暂无数据" />
              )}
            </Spin>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card className="ems-animate-fade-up ems-delay-4" title="设备运行率" style={{ height: '100%' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '16px 0' }}>
              <div style={{ position: 'relative', width: 160, height: 160 }}>
                <svg width="160" height="160" viewBox="0 0 160 160">
                  <circle cx={80} cy={80} r={65} fill="none" stroke="#e2e8f0" strokeWidth="12" />
                  <circle
                    cx={80} cy={80} r={65} fill="none"
                    stroke="url(#reportGradient)" strokeWidth="12"
                    strokeDasharray={`${(parseFloat(statsData.runningRate) / 100) * 2 * Math.PI * 65} ${2 * Math.PI * 65}`}
                    strokeLinecap="round"
                    transform="rotate(-90 80 80)"
                    style={{ transition: 'stroke-dasharray 1s ease-out' }}
                  />
                  <defs>
                    <linearGradient id="reportGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#0ea5e9" />
                      <stop offset="100%" stopColor="#10b981" />
                    </linearGradient>
                  </defs>
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontFamily: 'var(--ems-font-display)', fontSize: 36, fontWeight: 800, background: 'var(--ems-gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    {statsData.runningRate}
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--ems-text-muted)' }}>设备运行率</span>
                </div>
              </div>
              <Row gutter={24} style={{ marginTop: 24, width: '100%' }}>
                <Col span={8} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: 'var(--ems-text-muted)', marginBottom: 4 }}>可用率</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#10b981', fontFamily: 'var(--ems-font-display)' }}>92%</div>
                </Col>
                <Col span={8} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: 'var(--ems-text-muted)', marginBottom: 4 }}>性能率</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#0ea5e9', fontFamily: 'var(--ems-font-display)' }}>95%</div>
                </Col>
                <Col span={8} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: 'var(--ems-text-muted)', marginBottom: 4 }}>质量率</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#6366f1', fontFamily: 'var(--ems-font-display)' }}>98%</div>
                </Col>
              </Row>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );

  /* 设备状态报表 Tab */
  const renderEquipmentReport = () => (
    <Card className="ems-animate-fade-up ems-delay-2" title="设备状态明细" bordered={false}>
      <Table
        columns={equipmentColumns}
        dataSource={equipmentList}
        loading={equipmentLoading}
        pagination={{ pageSize: 10, showTotal: (total) => `共 ${total} 条` }}
        scroll={{ x: 700 }}
        size="middle"
      />
    </Card>
  );

  /* 工单统计报表 Tab */
  const renderWorkOrderReport = () => (
    <Card className="ems-animate-fade-up ems-delay-2" title="工单统计明细" bordered={false}>
      <Table
        columns={workOrderColumns}
        dataSource={workOrderList}
        loading={workOrderLoading}
        pagination={{ pageSize: 10, showTotal: (total) => `共 ${total} 条` }}
        scroll={{ x: 700 }}
        size="middle"
      />
    </Card>
  );

  const tabItems = [
    {
      key: 'overview',
      label: (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <PieChartOutlined /> 数据概览
        </span>
      ),
      children: renderOverview(),
    },
    {
      key: 'equipment',
      label: (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <AppstoreOutlined /> 设备状态报表
        </span>
      ),
      children: renderEquipmentReport(),
    },
    {
      key: 'workorder',
      label: (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <ToolOutlined /> 工单统计报表
        </span>
      ),
      children: renderWorkOrderReport(),
    },
  ];

  return (
    <div>
      <div className="ems-page-header ems-animate-fade-up">
        <div>
          <div className="ems-page-title">报表中心</div>
          <div className="ems-page-subtitle">查看与导出各类设备管理报表</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: '6px 12px', borderRadius: 20,
            background: 'var(--ems-success-bg)', color: 'var(--ems-success)',
            fontSize: 12, fontWeight: 600,
          }}>
            <FileExcelOutlined /> 导出 Excel
          </span>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: '6px 12px', borderRadius: 20,
            background: 'var(--ems-danger-bg)', color: 'var(--ems-danger)',
            fontSize: 12, fontWeight: 600,
          }}>
            <FilePdfOutlined /> 导出 PDF
          </span>
        </div>
      </div>

      {/* 报表类型卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {reportTypes.map((card, index) => (
          <Col xs={24} sm={12} lg={8} key={card.title}>
            <Card
              hoverable
              className={`ems-stat-card ${card.variant} ems-animate-fade-up ems-delay-${Math.min(index + 1, 6)}`}
              style={{ padding: '20px 20px 20px 24px', cursor: 'pointer' }}
            >
              <div style={{ marginBottom: 12 }}>{card.icon}</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ems-text-primary)', marginBottom: 6 }}>
                {card.title}
              </div>
              <Text type="secondary" style={{ fontSize: 12, lineHeight: 1.6 }}>{card.desc}</Text>
            </Card>
          </Col>
        ))}
      </Row>

      {/* 数据报表 Tabs */}
      <Card className="ems-animate-fade-up ems-delay-4" bordered={false}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          tabBarStyle={{ marginBottom: 16 }}
        />
      </Card>
    </div>
  );
}

export default ReportPage;
