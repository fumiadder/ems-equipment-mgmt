import { useState, useEffect, useCallback, useRef } from 'react';
import { Row, Col, Card, Statistic, Typography, Spin, Tag, Badge } from 'antd';
import {
  AppstoreOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ToolOutlined,
  WarningOutlined,
  ClockCircleOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import { getDashboardStats, getRecentWorkOrders } from '../../services/dashboard';

const { Text } = Typography;

/* 设备状态分布 */
interface StatusItem {
  status: string;
  count: number;
  color: string;
  percent: number;
}

/* 告警记录 */
interface AlertRecord {
  key: string;
  id: string;
  title: string;
  equipment: string;
  level: string;
  time: string;
}

/* 大屏看板页 - 深色主题 */
const darkCardStyle: React.CSSProperties = {
  background: '#1e293b',
  border: '1px solid rgba(148, 163, 184, 0.15)',
  borderRadius: 12,
};

const darkTextStyle: React.CSSProperties = {
  color: 'var(--ems-sidebar-text-active)',
};

function ScreenPage() {
  /* 扫描线效果 */
  const scanLine = <div className="ai-scan-line" />;
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalEquipment: 0,
    runningCount: 0,
    pendingOrders: 0,
    repairing: 0,
    runningRate: '0%',
    todayInspections: 0,
  });
  const [statusDistribution, setStatusDistribution] = useState<StatusItem[]>([]);
  const [alerts, setAlerts] = useState<AlertRecord[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleString('zh-CN'));
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* 获取数据 */
  const fetchData = useCallback(async () => {
    try {
      const res: any = await getDashboardStats();
      if (res.code === 0) {
        const data = res.data;
        const total = data.totalEquipment ?? 0;
        const running = data.runningEquipment ?? 0;

        /* 统计各状态数量 */
        const statusList = data.statusDistribution ?? [];
        let repairing = 0;
        const defaultColorMap: Record<string, string> = {
          运行中: '#10b981', 停机: '#ef4444', 维修中: '#f59e0b', 待机: '#0ea5e9',
        };
        const sum = statusList.reduce((s: number, item: any) => s + (item.count ?? 0), 0);
        const mapped = statusList.map((item: any) => {
          if (item.status === '维修中') repairing = item.count ?? 0;
          return {
            status: item.status ?? '',
            count: item.count ?? 0,
            color: defaultColorMap[item.status] ?? '#6b7280',
            percent: sum > 0 ? Number(((item.count ?? 0) / sum * 100).toFixed(1)) : 0,
          };
        });

        setStats({
          totalEquipment: total,
          runningCount: running,
          pendingOrders: data.pendingOrders ?? 0,
          repairing,
          runningRate: total > 0 ? `${((running / total) * 100).toFixed(1)}%` : '0%',
          todayInspections: data.todayInspections ?? 0,
        });
        setStatusDistribution(mapped);
      }

      /* 获取最近工单作为告警数据 */
      const woRes: any = await getRecentWorkOrders();
      if (woRes.code === 0) {
        const list = woRes.data?.list ?? woRes.data ?? [];
        setAlerts(
          list.slice(0, 5).map((item: any, index: number) => ({
            key: item.id ?? String(index + 1),
            id: item.id ?? '',
            title: item.title ?? item.name ?? '设备异常告警',
            equipment: item.equipment ?? item.equipmentName ?? '',
            level: item.priority === 'P1' || item.priority === '高' ? '严重' : item.priority === 'P2' || item.priority === '中' ? '警告' : '提示',
            time: item.createTime ?? item.createdAt ?? '',
          })),
        );
      }
    } catch (err) {
      console.error('获取大屏数据失败', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* 时钟更新 */
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setCurrentTime(new Date().toLocaleString('zh-CN'));
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const alertLevelColor: Record<string, string> = {
    严重: '#ef4444',
    警告: '#f59e0b',
    提示: '#0ea5e9',
  };

  const runningRateNum = parseFloat(stats.runningRate) || 0;

  return (
    <div
      style={{
        background: 'var(--ems-sidebar-bg)',
        minHeight: 'calc(100vh - 180px)',
        padding: 16,
        position: 'relative',
      }}
    >
      {/* 粒子背景 */}
      <div style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 0,
        background: `
          radial-gradient(circle at 20% 50%, rgba(14, 165, 233, 0.03) 0%, transparent 50%),
          radial-gradient(circle at 80% 50%, rgba(99, 102, 241, 0.03) 0%, transparent 50%)
        `,
      }} />

      {scanLine}
      {/* 页面标题 + 时钟 */}
      <div className="ems-page-header ems-animate-fade-up" style={{ justifyContent: 'center', marginBottom: 20 }}>
        <div style={{ textAlign: 'center' }}>
          <div
            className="ems-page-title"
            style={{
              color: 'var(--ems-primary)',
              fontSize: 26,
              textAlign: 'center',
              marginBottom: 4,
              letterSpacing: '0.05em',
            }}
          >
            设备管理大屏看板
          </div>
          <div className="ems-page-subtitle" style={{ color: 'rgba(148, 163, 184, 0.7)', textAlign: 'center' }}>
            Equipment Management Dashboard
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{
            fontFamily: 'var(--ems-font-display)',
            fontSize: 20,
            fontWeight: 700,
            color: 'var(--ems-sidebar-text-active)',
            letterSpacing: '0.02em',
          }}>
            {currentTime}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6, marginTop: 4 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', animation: 'ems-pulse-glow 2s infinite' }} />
            <Text style={{ color: 'rgba(148, 163, 184, 0.7)', fontSize: 12 }}>系统运行正常</Text>
          </div>
        </div>
      </div>

      <Spin spinning={loading}>
        {/* 顶部统计 */}
        <Row gutter={16} style={{ marginBottom: 20 }}>
          <Col span={6}>
            <div style={{
              ...darkCardStyle,
              padding: '24px 20px',
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden',
            }} className="ai-neon-glow ems-animate-fade-up ems-delay-1">
              {/* Glow border */}
              <div style={{
                position: 'absolute',
                inset: 0,
                borderRadius: 12,
                background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.2), transparent, rgba(99, 102, 241, 0.2))',
                opacity: 0.3,
                pointerEvents: 'none',
              }} />
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #0ea5e9, #6366f1)',
                marginBottom: 12,
                boxShadow: '0 0 20px rgba(14, 165, 233, 0.4)',
              }}>
                <AppstoreOutlined style={{ color: '#fff', fontSize: 24 }} />
              </div>
              <div style={{ fontSize: 36, fontWeight: 700, color: '#f1f5f9', fontFamily: 'var(--ems-font-mono)' }}>
                {stats.totalEquipment}
              </div>
              <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>设备总数</div>
            </div>
          </Col>
          <Col span={6}>
            <div style={{
              ...darkCardStyle,
              padding: '24px 20px',
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden',
            }} className="ai-neon-glow ems-animate-fade-up ems-delay-2">
              {/* Glow border */}
              <div style={{
                position: 'absolute',
                inset: 0,
                borderRadius: 12,
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), transparent, rgba(5, 150, 105, 0.2))',
                opacity: 0.3,
                pointerEvents: 'none',
              }} />
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                marginBottom: 12,
                boxShadow: '0 0 20px rgba(16, 185, 129, 0.4)',
              }}>
                <CheckCircleOutlined style={{ color: '#fff', fontSize: 24 }} />
              </div>
              <div style={{ fontSize: 36, fontWeight: 700, color: '#f1f5f9', fontFamily: 'var(--ems-font-mono)' }}>
                {stats.runningCount}
              </div>
              <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>运行中</div>
            </div>
          </Col>
          <Col span={6}>
            <div style={{
              ...darkCardStyle,
              padding: '24px 20px',
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden',
            }} className="ai-neon-glow ems-animate-fade-up ems-delay-3">
              {/* Glow border */}
              <div style={{
                position: 'absolute',
                inset: 0,
                borderRadius: 12,
                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2), transparent, rgba(217, 119, 6, 0.2))',
                opacity: 0.3,
                pointerEvents: 'none',
              }} />
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                marginBottom: 12,
                boxShadow: '0 0 20px rgba(245, 158, 11, 0.4)',
              }}>
                <ExclamationCircleOutlined style={{ color: '#fff', fontSize: 24 }} />
              </div>
              <div style={{ fontSize: 36, fontWeight: 700, color: '#f1f5f9', fontFamily: 'var(--ems-font-mono)' }}>
                {stats.pendingOrders}
              </div>
              <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>待处理工单</div>
            </div>
          </Col>
          <Col span={6}>
            <div style={{
              ...darkCardStyle,
              padding: '24px 20px',
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden',
            }} className="ai-neon-glow ems-animate-fade-up ems-delay-4">
              {/* Glow border */}
              <div style={{
                position: 'absolute',
                inset: 0,
                borderRadius: 12,
                background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2), transparent, rgba(220, 38, 38, 0.2))',
                opacity: 0.3,
                pointerEvents: 'none',
              }} />
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                marginBottom: 12,
                boxShadow: '0 0 20px rgba(239, 68, 68, 0.4)',
              }}>
                <ToolOutlined style={{ color: '#fff', fontSize: 24 }} />
              </div>
              <div style={{ fontSize: 36, fontWeight: 700, color: '#f1f5f9', fontFamily: 'var(--ems-font-mono)' }}>
                {stats.repairing}
              </div>
              <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>维修中</div>
            </div>
          </Col>
        </Row>

        {/* 中间区域 - 设备状态分布 + OEE */}
        <Row gutter={16} style={{ marginBottom: 20 }}>
          <Col span={12}>
            <Card
              title={<span style={darkTextStyle}>设备状态分布</span>}
              style={darkCardStyle}
              className="ems-animate-fade-up ems-delay-3"
              bordered={false}
            >
              {statusDistribution.length > 0 ? (
                <Row gutter={16} align="middle">
                  <Col span={10} style={{ display: 'flex', justifyContent: 'center' }}>
                    <svg width="200" height="200" viewBox="0 0 200 200">
                      {(() => {
                        const cx = 100, cy = 100, r = 78, strokeWidth = 20;
                        const circumference = 2 * Math.PI * r;
                        let offset = 0;
                        return statusDistribution.map((item) => {
                          const dashLength = (item.percent / 100) * circumference;
                          const gap = 4;
                          const el = (
                            <circle
                              key={item.status}
                              cx={cx} cy={cy} r={r} fill="none"
                              stroke={item.color} strokeWidth={strokeWidth}
                              strokeDasharray={`${dashLength - gap} ${circumference - dashLength + gap}`}
                              strokeDashoffset={-offset}
                              strokeLinecap="round"
                              style={{ opacity: 0.9 }}
                            />
                          );
                          offset += dashLength;
                          return el;
                        });
                      })()}
                      <text x={100} y={92} textAnchor="middle" fill="#f1f5f9" fontSize="32" fontWeight="700" fontFamily="var(--ems-font-display)">{stats.totalEquipment}</text>
                      <text x={100} y={114} textAnchor="middle" fill="rgba(148,163,184,0.7)" fontSize="12">设备总数</text>
                    </svg>
                  </Col>
                  <Col span={14}>
                    {statusDistribution.map((item) => (
                      <div key={item.status} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid rgba(148, 163, 184, 0.08)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <Badge color={item.color} />
                          <span style={{ fontWeight: 500, color: '#f1f5f9' }}>{item.status}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                          <span style={{ fontWeight: 700, fontFamily: 'var(--ems-font-display)', fontSize: 20, color: item.color }}>{item.count}</span>
                          <span style={{ fontSize: 12, color: 'rgba(148, 163, 184, 0.6)', width: 48, textAlign: 'right' }}>{item.percent}%</span>
                        </div>
                      </div>
                    ))}
                  </Col>
                </Row>
              ) : (
                <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: 'rgba(148, 163, 184, 0.5)' }}>暂无数据</Text>
                </div>
              )}
            </Card>
          </Col>
          <Col span={12}>
            <Card
              title={<span style={darkTextStyle}>OEE 综合效率</span>}
              style={darkCardStyle}
              className="ems-animate-fade-up ems-delay-4"
              bordered={false}
            >
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '16px 0' }}>
                {/* OEE 大数字 */}
                <div style={{ position: 'relative', width: 180, height: 180 }}>
                  <svg width="180" height="180" viewBox="0 0 180 180">
                    <circle cx={90} cy={90} r={72} fill="none" stroke="rgba(148, 163, 184, 0.1)" strokeWidth="12" />
                    <circle
                      cx={90} cy={90} r={72} fill="none"
                      stroke="url(#screenOeeGradient)" strokeWidth="12"
                      strokeDasharray={`${(runningRateNum / 100) * 2 * Math.PI * 72} ${2 * Math.PI * 72}`}
                      strokeLinecap="round"
                      transform="rotate(-90 90 90)"
                      style={{ transition: 'stroke-dasharray 1s ease-out' }}
                    />
                    <defs>
                      <linearGradient id="screenOeeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#0ea5e9" />
                        <stop offset="100%" stopColor="#6366f1" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontFamily: 'var(--ems-font-display)', fontSize: 40, fontWeight: 800, background: 'linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                      {stats.runningRate}
                    </span>
                    <span style={{ fontSize: 12, color: 'rgba(148, 163, 184, 0.7)', marginTop: -2 }}>OEE</span>
                  </div>
                </div>
                {/* 子指标 */}
                <Row gutter={24} style={{ marginTop: 24, width: '100%' }}>
                  <Col span={8} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 11, color: 'rgba(148, 163, 184, 0.6)', marginBottom: 4 }}>可用率</div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: '#10b981', fontFamily: 'var(--ems-font-display)' }}>92%</div>
                  </Col>
                  <Col span={8} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 11, color: 'rgba(148, 163, 184, 0.6)', marginBottom: 4 }}>性能率</div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: '#0ea5e9', fontFamily: 'var(--ems-font-display)' }}>95%</div>
                  </Col>
                  <Col span={8} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 11, color: 'rgba(148, 163, 184, 0.6)', marginBottom: 4 }}>质量率</div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: '#6366f1', fontFamily: 'var(--ems-font-display)' }}>98%</div>
                  </Col>
                </Row>
              </div>
            </Card>
          </Col>
        </Row>

        {/* 底部区域 - 告警 + 设备运行率 + 今日巡检 */}
        <Row gutter={16}>
          <Col span={16}>
            <Card
              title={
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <WarningOutlined style={{ color: '#ef4444' }} />
                  <span style={darkTextStyle}>实时告警</span>
                </span>
              }
              style={darkCardStyle}
              className="ems-animate-fade-up ems-delay-5"
              bordered={false}
            >
              {alerts.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {alerts.map((alert, idx) => (
                    <div
                      key={alert.key}
                      className="ai-alert-item"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        borderRadius: 8,
                        background: `${alertLevelColor[alert.level]}10`,
                        border: `1px solid ${alertLevelColor[alert.level]}20`,
                        transition: 'all 0.2s',
                        animationDelay: `${idx * 0.1}s`,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Badge color={alertLevelColor[alert.level]} />
                        <div>
                          <div style={{ color: '#f1f5f9', fontWeight: 500, fontSize: 13 }}>{alert.title}</div>
                          <div style={{ color: 'rgba(148, 163, 184, 0.6)', fontSize: 11, marginTop: 2 }}>
                            {alert.equipment}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Tag color={alertLevelColor[alert.level]} style={{ margin: 0 }}>{alert.level}</Tag>
                        <span style={{ color: 'rgba(148, 163, 184, 0.6)', fontSize: 11, fontFamily: 'var(--ems-font-mono)' }}>
                          {alert.time}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ height: 150, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ textAlign: 'center' }}>
                    <SafetyCertificateOutlined style={{ fontSize: 36, color: '#10b981', marginBottom: 8 }} />
                    <div style={{ color: 'rgba(148, 163, 184, 0.6)', fontSize: 13 }}>暂无告警信息</div>
                  </div>
                </div>
              )}
            </Card>
          </Col>
          <Col span={8}>
            <Row gutter={16}>
              <Col span={24} style={{ marginBottom: 16 }}>
                <Card
                  title={<span style={darkTextStyle}>设备运行率</span>}
                  style={darkCardStyle}
                  className="ems-animate-fade-up ems-delay-5"
                  bordered={false}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 0' }}>
                    <Statistic
                      value={runningRateNum}
                      precision={1}
                      suffix="%"
                      valueStyle={{
                        color: '#10b981',
                        fontSize: 48,
                        fontFamily: 'var(--ems-font-display)',
                      }}
                    />
                    <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <CheckCircleOutlined style={{ color: '#10b981', fontSize: 12 }} />
                      <Text style={{ color: 'rgba(148, 163, 184, 0.6)', fontSize: 12 }}>运行良好</Text>
                    </div>
                  </div>
                </Card>
              </Col>
              <Col span={24}>
                <Card
                  title={<span style={darkTextStyle}>今日巡检</span>}
                  style={darkCardStyle}
                  className="ems-animate-fade-up ems-delay-6"
                  bordered={false}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px 0' }}>
                    <Statistic
                      value={stats.todayInspections}
                      prefix={<ClockCircleOutlined />}
                      valueStyle={{
                        color: '#6366f1',
                        fontSize: 40,
                        fontFamily: 'var(--ems-font-display)',
                      }}
                    />
                  </div>
                </Card>
              </Col>
            </Row>
          </Col>
        </Row>
      </Spin>
    </div>
  );
}

export default ScreenPage;
