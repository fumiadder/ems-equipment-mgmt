import { useState, useEffect, useCallback } from 'react';
import { Table, Input, Button, Tag, Space, Card, Typography, Modal, Form, message } from 'antd';
import { SearchOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { ColumnsType } from 'antd/es/table';
import { getEquipmentList, createEquipment } from '../../services/equipment';

const { Text } = Typography;

interface EquipmentRecord {
  key: string;
  id?: string;
  code: string;
  name: string;
  model: string;
  factory: string;
  workshop: string;
  status: string;
}

const statusColorMap: Record<string, string> = {
  运行中: '#10b981',
  停机: '#ef4444',
  维修中: '#f59e0b',
  待机: '#3b82f6',
};

function EquipmentList() {
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<EquipmentRecord[]>([]);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, total: 0 });
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();

  /* 获取设备列表 */
  const fetchData = useCallback(async (page: number, pageSize: number, keyword?: string) => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page, pageSize };
      if (keyword) {
        params.keyword = keyword;
      }
      const res: any = await getEquipmentList(params);
      if (res.code === 0) {
        const list = res.data?.list ?? [];
        const pag = res.data?.pagination ?? {};
        setData(
          list.map((item: any, index: number) => ({
            key: item.id ?? String(index + 1),
            id: item.id,
            code: item.code ?? '',
            name: item.name ?? '',
            model: item.model ?? '',
            factory: item.factory ?? '',
            workshop: item.workshop ?? '',
            status: item.status ?? '',
          })),
        );
        setPagination({
          page: pag.page ?? page,
          pageSize: pag.pageSize ?? pageSize,
          total: pag.total ?? 0,
        });
      }
    } catch (err) {
      console.error('获取设备列表失败', err);
    } finally {
      setLoading(false);
    }
  }, [searchText]);

  /* 组件挂载时获取数据 */
  useEffect(() => {
    fetchData(1, pagination.pageSize);
  }, [fetchData, pagination.pageSize]);

  /* 点击查询按钮 */
  const handleSearch = () => {
    fetchData(1, pagination.pageSize, searchText || undefined);
  };

  /* 分页变更 */
  const handleTableChange = (pag: any) => {
    fetchData(pag.current, pag.pageSize, searchText || undefined);
  };

  /* 打开新增设备弹窗 */
  const handleOpenModal = () => {
    form.resetFields();
    setModalOpen(true);
  };

  /* 新增设备 */
  const handleCreateEquipment = async () => {
    try {
      const values = await form.validateFields();
      const res: any = await createEquipment(values);
      if (res.code === 0) {
        message.success('新增设备成功');
        setModalOpen(false);
        form.resetFields();
        fetchData(1, pagination.pageSize, searchText || undefined);
      } else {
        message.error(res.message || '新增设备失败');
      }
    } catch (err: any) {
      if (err?.errorFields) {
        message.error('请填写必填字段');
      } else {
        message.error('新增设备失败');
      }
    }
  };

  const columns: ColumnsType<EquipmentRecord> = [
    {
      title: '设备编号',
      dataIndex: 'code',
      key: 'code',
      width: 120,
      render: (code: string) => (
        <Text strong style={{ fontFamily: 'var(--ems-font-mono)', fontSize: 12 }}>{code}</Text>
      ),
    },
    { title: '设备名称', dataIndex: 'name', key: 'name' },
    { title: '型号', dataIndex: 'model', key: 'model', width: 120 },
    { title: '所属工厂', dataIndex: 'factory', key: 'factory', width: 100 },
    { title: '车间', dataIndex: 'workshop', key: 'workshop', width: 120 },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => <Tag color={statusColorMap[status]}>{status}</Tag>,
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_, record) => (
        <Space>
          <a
            onClick={() => navigate(`/equipment/${record.id ?? record.key}`)}
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
            编辑
          </a>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="ems-page-header ems-animate-fade-up">
        <div>
          <div className="ems-page-title">设备台账</div>
          <div className="ems-page-subtitle">管理所有设备的基础信息与运行状态</div>
        </div>
      </div>

      <div className="ems-filter-bar ems-animate-fade-up ems-delay-1">
        <Space>
          <Input
            placeholder="搜索设备名称/编号/型号"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onPressEnter={handleSearch}
            style={{ width: 280 }}
            allowClear
          />
          <Button type="primary" onClick={handleSearch}>查询</Button>
        </Space>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenModal}>
          新增设备
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
            onChange: (page, pageSize) => handleTableChange({ current: page, pageSize }),
          }}
          scroll={{ x: 800 }}
        />
      </Card>

      <Modal
        title="新增设备"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleCreateEquipment}
        width={600}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item label="设备编号" name="code" rules={[{ required: true, message: '请输入设备编号' }]}>
            <Input placeholder="请输入设备编号" />
          </Form.Item>
          <Form.Item label="设备名称" name="name" rules={[{ required: true, message: '请输入设备名称' }]}>
            <Input placeholder="请输入设备名称" />
          </Form.Item>
          <Form.Item label="设备型号" name="model" rules={[{ required: true, message: '请输入设备型号' }]}>
            <Input placeholder="请输入设备型号" />
          </Form.Item>
          <Form.Item label="制造商" name="manufacturer">
            <Input placeholder="请输入制造商" />
          </Form.Item>
          <Form.Item label="所属工厂" name="factory" rules={[{ required: true, message: '请输入所属工厂' }]}>
            <Input placeholder="请输入所属工厂" />
          </Form.Item>
          <Form.Item label="车间" name="workshop" rules={[{ required: true, message: '请输入车间' }]}>
            <Input placeholder="请输入车间" />
          </Form.Item>
          <Form.Item label="产线" name="productionLine">
            <Input placeholder="请输入产线" />
          </Form.Item>
          <Form.Item label="安装位置" name="location">
            <Input placeholder="请输入安装位置" />
          </Form.Item>
          <Form.Item label="设备类型" name="type">
            <Input placeholder="请输入设备类型" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default EquipmentList;
