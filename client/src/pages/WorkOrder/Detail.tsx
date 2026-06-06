import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Tag, Button, Steps, Timeline, Typography, Spin, message } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { getWorkOrderDetail } from '../../services/workOrder';

const { Text } = Typography;

const statusColorMap: Record<string, string> = {
  待处理: '#f59e0b',
  已派单: '#3b82f6',
  处理中: '#0ea5e9',
  已完成: '#10b981',
  已关闭: '#6b7280',
};

const priorityColorMap: Record<string, string> = {
  P1: '#ef4444',
  P2: '#f59e0b',
  P3: '#10b981',
};

const stepMap: Record<string, number> = {
  待处理: 0,
  已派单: 1,
  处理中: 2,
  已完成: 3,
};

function WorkOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<any>(null);

  useEffect(() => {
    if (!id) return;
    const fetchDetail = async () => {
      setLoading(true);
      try {
        const res: any = await getWorkOrderDetail(id);
        if (res.code === 0) {
          setDetail(res.data);
        } else {
          message.error(res.message || '获取工单详情失败');
        }
      } catch (err) {
        console.error('获取工单详情失败', err);
        message.error('获取工单详情失败');
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  const currentStep = detail ? stepMap[detail.status] ?? 0 : 0;

  const statusFlow = detail
    ? [
        { label: '待处理', date: detail.createdAt ? new Date(detail.createdAt).toLocaleString('zh-CN') : '-', operator: '系统', color: '#f59e0b' },
        ...(detail.status !== '待处理'
          ? [{ label: '已派单', date: detail.assignedAt ? new Date(detail.assignedAt).toLocaleString('zh-CN') : '-', operator: detail.assignedByName || '管理员', color: '#3b82f6' }]
          : []),
        ...(detail.status === '处理中' || detail.status === '已完成'
          ? [{ label: '处理中', date: detail.startedAt ? new Date(detail.startedAt).toLocaleString('zh-CN') : '-', operator: detail.assignedToName || '-', color: '#0ea5e9' }]
          : []),
        ...(detail.status === '已完成'
          ? [{ label: '已完成', date: detail.resolvedAt ? new Date(detail.resolvedAt).toLocaleString('zh-CN') : '-', operator: detail.assignedToName || '-', color: '#10b981' }]
          : []),
      ]
    : [];

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }

  if (!detail) {
    return (
      <div>
        <div className="ems-page-header ems-animate-fade-up">
          <div className="ems-page-title">工单详情</div>
        </div>
        <Card className="ems-animate-fade-up ems-delay-1">
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--ems-text-muted)' }}>
            工单不存在或已被删除
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <div className="ems-page-header ems-animate-fade-up">
        <div>
          <div className="ems-page-title">工单详情 - {detail.orderNo || detail.id}</div>
          <div className="ems-page-subtitle">查看工单信息、状态流转与操作记录</div>
        </div>
      </div>

      <div className="ems-filter-bar ems-animate-fade-up ems-delay-1">
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/work-order')}>
          返回列表
        </Button>
      </div>

      <Card title="工单信息" className="ems-animate-fade-up ems-delay-2" style={{ marginBottom: 24 }}>
        <Descriptions bordered column={2}>
          <Descriptions.Item label="工单编号">
            <Text strong style={{ fontFamily: 'var(--ems-font-mono)', fontSize: 12 }}>
              {detail.orderNo || detail.id}
            </Text>
          </Descriptions.Item>
          <Descriptions.Item label="工单标题">{detail.title}</Descriptions.Item>
          <Descriptions.Item label="关联设备">{detail.equipmentName || `设备#${detail.equipmentId}`}</Descriptions.Item>
          <Descriptions.Item label="工单类型">{detail.faultType || detail.type || '-'}</Descriptions.Item>
          <Descriptions.Item label="状态">
            <Tag color={statusColorMap[detail.status]}>{detail.status}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="优先级">
            <Tag color={priorityColorMap[detail.faultLevel || detail.priority]}>{detail.faultLevel || detail.priority}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="负责人">{detail.assignedToName || '-'}</Descriptions.Item>
          <Descriptions.Item label="报告人">{detail.createdByName || '-'}</Descriptions.Item>
          <Descriptions.Item label="创建时间">
            {detail.createdAt ? new Date(detail.createdAt).toLocaleString('zh-CN') : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="描述" span={2}>{detail.description || '-'}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="状态流转" className="ems-animate-fade-up ems-delay-3" style={{ marginBottom: 24 }}>
        <Steps
          current={currentStep}
          items={[
            { title: '待处理' },
            { title: '已派单' },
            { title: '处理中' },
            { title: '已完成' },
          ]}
        />
      </Card>

      <Card title="操作记录" className="ems-animate-fade-up ems-delay-4">
        <Timeline
          items={statusFlow.map((item) => ({
            color: item.color,
            children: (
              <div>
                <strong>{item.label}</strong>
                <div style={{ color: '#999', fontSize: 12 }}>
                  {item.date} - {item.operator}
                </div>
              </div>
            ),
          }))}
        />
      </Card>
    </div>
  );
}

export default WorkOrderDetail;
