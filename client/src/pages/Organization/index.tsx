import { useState, useEffect, useCallback } from 'react';
import { Table, Card, Tag, Space, Button, Typography } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { getOrganizationTree } from '../../services/organization';

const { Text } = Typography;

interface OrganizationRecord {
  key?: string;
  id: string;
  name: string;
  code: string;
  manager: string;
  memberCount: number;
  status: string;
  children?: OrganizationRecord[];
}

const columns: ColumnsType<OrganizationRecord> = [
  { title: '组织名称', dataIndex: 'name', key: 'name' },
  {
    title: '组织编码',
    dataIndex: 'code',
    key: 'code',
    width: 160,
    render: (v: string) => (
      <Text strong style={{ fontFamily: 'var(--ems-font-mono)', fontSize: 12 }}>
        {v}
      </Text>
    ),
  },
  { title: '负责人', dataIndex: 'manager', key: 'manager', width: 120 },
  { title: '成员数', dataIndex: 'memberCount', key: 'memberCount', width: 100 },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    width: 80,
    render: (status: string) => (
      <Tag color={status === '启用' ? '#10b981' : '#ef4444'}>{status}</Tag>
    ),
  },
  {
    title: '操作',
    key: 'action',
    width: 180,
    render: () => (
      <Space>
        <a>编辑</a>
        <a>添加子级</a>
        <a>删除</a>
      </Space>
    ),
  },
];

/** 递归为树形数据中的每个节点添加 key 字段 */
function addTreeKey(nodes: OrganizationRecord[]): OrganizationRecord[] {
  return nodes.map((node) => ({
    ...node,
    key: node.id,
    children: node.children ? addTreeKey(node.children) : undefined,
  }));
}

function OrganizationPage() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<OrganizationRecord[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getOrganizationTree();
      if (res.code === 0) {
        setData(addTreeKey(res.data));
      }
    } catch (err) {
      console.error('获取组织架构失败', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div>
      {/* 页面标题 */}
      <div className="ems-page-header ems-animate-fade-up">
        <div>
          <div className="ems-page-title">组织架构管理</div>
          <div className="ems-page-subtitle">维护企业组织层级与部门结构</div>
        </div>
      </div>

      {/* 筛选/操作区域 */}
      <div className="ems-filter-bar ems-animate-fade-up ems-delay-1">
        <div />
        <Button type="primary" icon={<PlusOutlined />}>
          新增组织
        </Button>
      </div>

      {/* 表格卡片 */}
      <Card className="ems-animate-fade-up ems-delay-2" bordered={false}>
        <Table
          columns={columns}
          dataSource={data}
          loading={loading}
          pagination={false}
          scroll={{ x: 800 }}
        />
      </Card>
    </div>
  );
}

export default OrganizationPage;
