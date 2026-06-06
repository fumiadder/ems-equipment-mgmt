import { useState, useEffect, useCallback } from 'react';
import { Table, Card, Tag, Select, Space, Button, Typography, Modal, Form, Input, InputNumber, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { ColumnsType } from 'antd/es/table';
import { getWorkOrderList, createWorkOrder } from '../../services/workOrder';

const { Text } = Typography;

interface WorkOrderRecord {
  key: string;
  id: string;
  title: string;
  equipment: string;
  type: string;
  status: string;
  priority: string;
  assignee: string;
  createTime: string;
}

const statusColorMap: Record<string, string> = {
  待处理: '#f59e0b',
  处理中: '#3b82f6',
  已完成: '#10b981',
  已关闭: '#6b7280',
};

const priorityColorMap: Record<string, string> = {
  高: '#ef4444',
  中: '#f59e0b',
  低: '#10b981',
};

function WorkOrderList() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<WorkOrderRecord[]>([]);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, total: 0 });
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();

  /* 获取工单列表 */
  const fetchData = useCallback(async (page: number, pageSize: number, status?: string) => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page, pageSize };
      if (status) {
        params.status = status;
      }
      const res: any = await getWorkOrderList(params);
      if (res.code === 0) {
        const list = res.data?.list ?? [];
        const pag = res.data?.pagination ?? {};
        setData(
          list.map((item: any, index: number) => ({
            key: item.id ?? String(index + 1),
            id: item.orderNo ?? item.id ?? '',
            title: item.title ?? '',
            equipment: item.equipmentName ?? `设备#${item.equipmentId ?? ''}`,
            type: item.faultType ?? item.type ?? '',
            status: item.status ?? '',
            priority: item.faultLevel ?? item.priority ?? '',
            assignee: item.assignedToName ?? item.assignee ?? '',
            createTime: item.createdAt ? new Date(item.createdAt).toLocaleDateString('zh-CN') : '',
          })),
        );
        setPagination({
          page: pag.page ?? page,
          pageSize: pag.pageSize ?? pageSize,
          total: pag.total ?? 0,
        });
      }
    } catch (err) {
      console.error('获取工单列表失败', err);
    } finally {
      setLoading(false);
    }
  }, []);

  /* 组件挂载时获取数据 */
  useEffect(() => {
    fetchData(1, pagination.pageSize, statusFilter);
  }, [fetchData, pagination.pageSize]);

  /* 状态筛选变更 */
  const handleStatusChange = (value: string | undefined) => {
    setStatusFilter(value);
    fetchData(1, pagination.pageSize, value);
  };

  /* 分页变更 */
  const handleTableChange = (pag: any) => {
    fetchData(pag.current, pag.pageSize, statusFilter);
  };

  /* 打开新建工单弹窗 */
  const handleOpenModal = () => {
    form.resetFields();
    setModalOpen(true);
  };

  /* 创建工单 */
  const handleCreateWorkOrder = async () => {
    try {
      const values = await form.validateFields();
      const res: any = await createWorkOrder(values);
      if (res.code === 0) {
        message.success('创建工单成功');
        setModalOpen(false);
        form.resetFields();
        fetchData(1, pagination.pageSize, statusFilter);
      } else {
        message.error(res.message || '创建工单失败');
      }
    } catch (err: any) {
      if (err?.errorFields) {
        message.error('请填写必填字段');
      } else {
        message.error('创建工单失败');
      }
    }
  };

  const columns: ColumnsType<WorkOrderRecord> = [
    {
      title: '工单编号',
      dataIndex: 'id',
      key: 'id',
      width: 140,
      render: (id: string) => (
        <Text strong style={{ fontFamily: 'var(--ems-font-mono)', fontSize: 12 }}>{id}</Text>
      ),
    },
    { title: '工单标题', dataIndex: 'title', key: 'title' },
    { title: '关联设备', dataIndex: 'equipment', key: 'equipment', width: 140 },
    { title: '类型', dataIndex: 'type', key: 'type', width: 80 },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => <Tag color={statusColorMap[status]}>{status}</Tag>,
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 80,
      render: (priority: string) => <Tag color={priorityColorMap[priority]}>{priority}</Tag>,
    },
    { title: '负责人', dataIndex: 'assignee', key: 'assignee', width: 80 },
    { title: '创建时间', dataIndex: 'createTime', key: 'createTime', width: 160 },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_, record) => (
        <Space>
          <a
            onClick={() => navigate(`/work-order/${record.key}`)}
            style={{ transition: 'color 0.2s' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--ems-primary)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '')}
          >
            详情
          </a>
          <a
            style={{ transition: 'color 0.2s' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--ems-primary)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '')}
          >
            处理
          </a>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="ems-page-header ems-animate-fade-up">
        <div>
          <div className="ems-page-title">工单管理</div>
          <div className="ems-page-subtitle">跟踪设备维修与保养工单的全生命周期</div>
        </div>
      </div>

      <div className="ems-filter-bar ems-animate-fade-up ems-delay-1">
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
          <Space>
            <Select
              placeholder="状态筛选"
              allowClear
              style={{ width: 140 }}
              value={statusFilter}
              onChange={handleStatusChange}
              options={[
                { label: '待处理', value: '待处理' },
                { label: '处理中', value: '处理中' },
                { label: '已完成', value: '已完成' },
                { label: '已关闭', value: '已关闭' },
              ]}
            />
          </Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenModal}>
            创建工单
          </Button>
        </div>
      </div>

      <Card className="ems-animate-fade-up ems-delay-2">
        <Table
          columns={columns}
          dataSource={data}
          loading={loading}
          pagination={{
            current: pagination.page,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showTotal: (total) => `共 ${total} 条`,
            onChange: (page, pageSize) => handleTableChange({ current: page, pageSize }),
          }}
          scroll={{ x: 1100 }}
        />
      </Card>

      <Modal
        title="新建工单"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleCreateWorkOrder}
        width={600}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item label="工单标题" name="title" rules={[{ required: true, message: '请输入工单标题' }]}>
            <Input placeholder="请输入工单标题" />
          </Form.Item>
          <Form.Item label="关联设备" name="equipmentId" rules={[{ required: true, message: '请输入关联设备ID' }]}>
            <InputNumber placeholder="请输入设备ID" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="工单类型" name="type">
            <Select
              placeholder="请选择工单类型"
              options={[
                { label: '机械故障', value: '机械故障' },
                { label: '电气故障', value: '电气故障' },
                { label: '液压故障', value: '液压故障' },
                { label: '其他', value: '其他' },
              ]}
            />
          </Form.Item>
          <Form.Item label="优先级" name="priority">
            <Select
              placeholder="请选择优先级"
              options={[
                { label: 'P1', value: 'P1' },
                { label: 'P2', value: 'P2' },
                { label: 'P3', value: 'P3' },
              ]}
            />
          </Form.Item>
          <Form.Item label="故障描述" name="description">
            <Input.TextArea rows={4} placeholder="请输入故障描述" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default WorkOrderList;
