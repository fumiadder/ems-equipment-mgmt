import { useState, useEffect, useCallback } from 'react';
import { Table, Card, Tag, Space, Button, Typography } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { getSparePartList } from '../../services/sparePart';

const { Text } = Typography;

interface SparePartRecord {
  key?: string;
  id: string;
  code: string;
  name: string;
  spec: string;
  category: string;
  stock: number;
  minStock: number;
  unit: string;
  location: string;
}

const columns: ColumnsType<SparePartRecord> = [
  { title: '备件编号', dataIndex: 'code', key: 'code', width: 120, render: (text: string) => <Text strong style={{ color: 'var(--ems-text-secondary)' }}>{text}</Text> },
  { title: '备件名称', dataIndex: 'name', key: 'name' },
  { title: '规格', dataIndex: 'spec', key: 'spec', width: 120 },
  { title: '分类', dataIndex: 'category', key: 'category', width: 100 },
  {
    title: '库存',
    dataIndex: 'stock',
    key: 'stock',
    width: 80,
    render: (stock: number, record) => (
      <Tag color={stock < record.minStock ? '#ef4444' : '#10b981'}>
        {stock} {record.unit}
      </Tag>
    ),
  },
  { title: '安全库存', dataIndex: 'minStock', key: 'minStock', width: 100, render: (_, r) => `${r.minStock} ${r.unit}` },
  { title: '存放位置', dataIndex: 'location', key: 'location', width: 120 },
  {
    title: '操作',
    key: 'action',
    width: 120,
    render: () => (
      <Space>
        <a>入库</a>
        <a>出库</a>
      </Space>
    ),
  },
];

function SparePartList() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<SparePartRecord[]>([]);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, total: 0 });

  const fetchData = useCallback(async (page: number, pageSize: number) => {
    setLoading(true);
    try {
      const res = await getSparePartList({ page, pageSize });
      if (res.code === 0) {
        setData(res.data.list.map((item: SparePartRecord) => ({ ...item, key: item.id })));
        setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error('获取备件列表失败', err);
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
          <div className="ems-page-title">备件管理</div>
          <div className="ems-page-subtitle">管理备件库存与出入库记录</div>
        </div>
      </div>

      <div className="ems-filter-bar ems-animate-fade-up ems-delay-1">
        <Text type="secondary">共 {pagination.total} 项备件</Text>
        <Button type="primary" icon={<PlusOutlined />}>
          新增备件
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

export default SparePartList;
