import { useState, useEffect, useCallback } from 'react';
import { Table, Card, Tag, Space, Button, Input, Typography, Modal, Form, Select, message, Spin } from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { getUserList, createUser } from '../../services/user';

const { Text } = Typography;

interface UserRecord {
  key: string;
  id: string;
  username: string;
  name: string;
  department: string;
  role: string;
  phone: string;
  status: string;
}

function UserPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<UserRecord[]>([]);
  const [searchText, setSearchText] = useState('');
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, total: 0 });

  const fetchData = useCallback(async (page: number, pageSize: number, keyword?: string) => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page, pageSize };
      if (keyword) params.keyword = keyword;
      const res: any = await getUserList(params);
      if (res.code === 0) {
        const list = res.data?.list ?? [];
        const pag = res.data?.pagination ?? {};
        setData(
          list.map((item: any) => ({
            key: String(item.id),
            id: String(item.id),
            username: item.username ?? '',
            name: item.name ?? '',
            department: item.organization?.name ?? item.department ?? '-',
            role: item.role?.name ?? item.role ?? '-',
            phone: item.phone ?? '-',
            status: item.status === 'active' || item.status === '启用' ? '启用' : '停用',
          })),
        );
        setPagination({
          page: pag.page ?? page,
          pageSize: pag.pageSize ?? pageSize,
          total: pag.total ?? 0,
        });
      }
    } catch (err) {
      console.error('获取用户列表失败', err);
      message.error('获取用户列表失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(1, pagination.pageSize);
  }, [fetchData, pagination.pageSize]);

  const handleSearch = () => {
    fetchData(1, pagination.pageSize, searchText || undefined);
  };

  const handleTableChange = (pag: any) => {
    fetchData(pag.current, pag.pageSize, searchText || undefined);
  };

  const handleOpenModal = () => {
    form.resetFields();
    setModalOpen(true);
  };

  const handleCreate = async () => {
    try {
      const values = await form.validateFields();
      setConfirmLoading(true);
      const res: any = await createUser(values);
      if (res.code === 0) {
        message.success('用户创建成功');
        setModalOpen(false);
        form.resetFields();
        fetchData(1, pagination.pageSize);
      } else {
        message.error(res.message || '创建失败');
      }
    } catch (err: any) {
      if (err?.errorFields) {
        message.error('请填写必填字段');
      } else {
        message.error(err?.message || '创建失败');
      }
    } finally {
      setConfirmLoading(false);
    }
  };

  const columns: ColumnsType<UserRecord> = [
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
      width: 120,
      render: (v: string) => (
        <Text strong style={{ fontFamily: 'var(--ems-font-mono)', fontSize: 12 }}>
          {v}
        </Text>
      ),
    },
    { title: '姓名', dataIndex: 'name', key: 'name', width: 100 },
    { title: '部门', dataIndex: 'department', key: 'department' },
    { title: '角色', dataIndex: 'role', key: 'role', width: 140 },
    { title: '手机号', dataIndex: 'phone', key: 'phone', width: 140 },
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
      width: 150,
      render: () => (
        <Space>
          <a>编辑</a>
          <a>重置密码</a>
          <a>禁用</a>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="ems-page-header ems-animate-fade-up">
        <div>
          <div className="ems-page-title">用户管理</div>
          <div className="ems-page-subtitle">管理系统用户账号、角色分配与状态</div>
        </div>
      </div>

      <div className="ems-filter-bar ems-animate-fade-up ems-delay-1">
        <Space>
          <Input
            placeholder="搜索用户名/姓名"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onPressEnter={handleSearch}
            style={{ width: 240 }}
            allowClear
          />
          <Button type="primary" onClick={handleSearch}>查询</Button>
        </Space>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenModal}>
          新增用户
        </Button>
      </div>

      <Card className="ems-animate-fade-up ems-delay-2" bordered={false}>
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
          scroll={{ x: 900 }}
        />
      </Card>

      <Modal
        title="新增用户"
        open={modalOpen}
        onOk={handleCreate}
        onCancel={() => setModalOpen(false)}
        confirmLoading={confirmLoading}
        destroyOnClose
        width={560}
        okText="确认创建"
        cancelText="取消"
      >
        <Form
          form={form}
          layout="horizontal"
          labelCol={{ span: 6 }}
          wrapperCol={{ span: 16 }}
          style={{ marginTop: 24 }}
        >
          <Form.Item
            name="username"
            label="用户名"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input placeholder="请输入用户名" />
          </Form.Item>
          <Form.Item
            name="name"
            label="姓名"
            rules={[{ required: true, message: '请输入姓名' }]}
          >
            <Input placeholder="请输入姓名" />
          </Form.Item>
          <Form.Item
            name="department"
            label="部门"
            rules={[{ required: true, message: '请输入部门' }]}
          >
            <Input placeholder="请输入部门" />
          </Form.Item>
          <Form.Item
            name="role"
            label="角色"
            rules={[{ required: true, message: '请选择角色' }]}
          >
            <Select placeholder="请选择角色">
              <Select.Option value="超级管理员">超级管理员</Select.Option>
              <Select.Option value="维修工程师">维修工程师</Select.Option>
              <Select.Option value="巡检员">巡检员</Select.Option>
              <Select.Option value="设备管理员">设备管理员</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="phone"
            label="手机号"
            rules={[
              { required: true, message: '请输入手机号' },
              { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' },
            ]}
          >
            <Input placeholder="请输入手机号" maxLength={11} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default UserPage;
