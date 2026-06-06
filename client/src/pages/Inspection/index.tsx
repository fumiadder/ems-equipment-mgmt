import { useState, useEffect, useCallback } from 'react';
import { Table, Card, Tag, Space, Button, Typography } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { getInspectionList } from '../../services/inspection';

const { Text } = Typography;

interface InspectionRecord {
  key?: string;
  id: string;
  name: string;
  equipmentName: string;
  frequency: string;
  status: string;
  nextTime: string;
  assignee: string;
}

const statusColorMap: Record<string, string> = {
  执行中: '#0ea5e9',
  待执行: '#f59e0b',
  已完成: '#10b981',
  已逾期: '#ef4444',
};

const columns: ColumnsType<InspectionRecord> = [
  { title: '计划编号', dataIndex: 'id', key: 'id', width: 120, render: (text: string) => <Text strong style={{ color: 'var(--ems-text-secondary)' }}>{text}</Text> },
  { title: '计划名称', dataIndex: 'name', key: 'name' },
  { title: '巡检设备', dataIndex: 'equipmentName', key: 'equipmentName' },
  { title: '频次', dataIndex: 'frequency', key: 'frequency', width: 100 },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    width: 100,
    render: (status: string) => <Tag color={statusColorMap[status]}>{status}</Tag>,
  },
  { title: '下次执行', dataIndex: 'nextTime', key: 'nextTime', width: 160 },
  { title: '负责人', dataIndex: 'assignee', key: 'assignee', width: 80 },
  {
    title: '操作',
    key: 'action',
    width: 120,
    render: () => (
      <Space>
        <a>执行</a>
        <a>记录</a>
      </Space>
    ),
  },
];

function InspectionList() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<InspectionRecord[]>([]);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, total: 0 });

  const fetchData = useCallback(async (page: number, pageSize: number) => {
    setLoading(true);
    try {
      const res = await getInspectionList({ page, pageSize });
      if (res.code === 0) {
        setData(res.data.list.map((item: InspectionRecord) => ({ ...item, key: item.id })));
        setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error('获取巡检列表失败', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(1, pagination.pageSize);
  }, [fetchData, pagination.pageSize]);

  const handleTableChange = (pag: any) => {
    fetchData(pag.current, pag.pageSize);
  };

  return (
    <div>
      <div className="ems-page-header ems-animate-fade-up">
        <div>
          <div className="ems-page-title">巡检管理</div>
          <div className="ems-page-subtitle">管理巡检计划与执行记录</div>
        </div>
      </div>

      <div className="ems-filter-bar ems-animate-fade-up ems-delay-1">
        <Text type="secondary">共 {pagination.total} 条巡检计划</Text>
        <Button type="primary" icon={<PlusOutlined />}>
          新建计划
        </Button>
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
          }}
          onChange={handleTableChange}
          scroll={{ x: 900 }}
        />
      </Card>
    </div>
  );
}

export default InspectionList;
