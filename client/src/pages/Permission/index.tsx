import { useState, useEffect, useCallback } from 'react';
import { Table, Card, Tag, Space, Button, Typography, Input, Select, Tabs, Badge, message, Modal, Row, Col } from 'antd';
import { PlusOutlined, SearchOutlined, UserOutlined, TeamOutlined, SafetyOutlined, EditOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { getUserList } from '../../services/user';
import { getOrganizationTree } from '../../services/organization';

const { Text } = Typography;

/* 用户记录 */
interface UserRecord {
  key: string;
  id?: string;
  username: string;
  name: string;
  department: string;
  role: string;
  phone: string;
  email?: string;
  status: string;
  organizationId?: string;
}

/* 组织树节点 */
interface OrgNode {
  id: string;
  name: string;
  children?: OrgNode[];
}

/* 权限编码记录 */
interface PermissionRecord {
  key: string;
  code: string;
  name: string;
  description: string;
  type: string;
  status: string;
}

/* 权限编码静态数据 */
const permissionData: PermissionRecord[] = [
  { key: '1', code: 'perm:equipment:view', name: '设备查看', description: '查看设备台账和详情', type: '菜单', status: '启用' },
  { key: '2', code: 'perm:equipment:edit', name: '设备编辑', description: '新增和编辑设备信息', type: '操作', status: '启用' },
  { key: '3', code: 'perm:workorder:create', name: '创建工单', description: '创建维修和保养工单', type: '操作', status: '启用' },
  { key: '4', code: 'perm:workorder:approve', name: '工单审批', description: '审批工单状态变更', type: '操作', status: '启用' },
  { key: '5', code: 'perm:user:manage', name: '用户管理', description: '管理用户账号和权限', type: '菜单', status: '启用' },
  { key: '6', code: 'perm:report:export', name: '报表导出', description: '导出各类统计报表', type: '操作', status: '停用' },
  { key: '7', code: 'perm:inspection:manage', name: '巡检管理', description: '创建和管理巡检计划', type: '菜单', status: '启用' },
  { key: '8', code: 'perm:sparepart:manage', name: '备件管理', description: '管理备件库存和出入库', type: '菜单', status: '启用' },
  { key: '9', code: 'perm:monitor:view', name: '监控查看', description: '查看 IoT 设备监控数据', type: '菜单', status: '启用' },
  { key: '10', code: 'perm:screen:view', name: '大屏查看', description: '查看大屏看板数据', type: '菜单', status: '启用' },
];

const typeColorMap: Record<string, string> = {
  菜单: '#0ea5e9',
  操作: '#10b981',
  数据: '#f59e0b',
};

const roleColorMap: Record<string, string> = {
  超级管理员: '#ef4444',
  设备管理员: '#0ea5e9',
  维修工程师: '#f59e0b',
  巡检员: '#10b981',
  操作员: '#6366f1',
};

/* 角色选项 */
const roleOptions = [
  { value: '超级管理员', label: '超级管理员' },
  { value: '设备管理员', label: '设备管理员' },
  { value: '维修工程师', label: '维修工程师' },
  { value: '巡检员', label: '巡检员' },
  { value: '操作员', label: '操作员' },
];

/* 权限表格列 */
const permColumns: ColumnsType<PermissionRecord> = [
  {
    title: '权限编码',
    dataIndex: 'code',
    key: 'code',
    width: 200,
    render: (v: string) => (
      <Text strong style={{ fontFamily: 'var(--ems-font-mono)', fontSize: 12 }}>
        {v}
      </Text>
    ),
  },
  { title: '权限名称', dataIndex: 'name', key: 'name', width: 120 },
  { title: '描述', dataIndex: 'description', key: 'description' },
  {
    title: '类型',
    dataIndex: 'type',
    key: 'type',
    width: 80,
    render: (type: string) => <Tag color={typeColorMap[type]}>{type}</Tag>,
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    width: 80,
    render: (status: string) => (
      <Badge
        status={status === '启用' ? 'success' : 'error'}
        text={<span style={{ fontSize: 12 }}>{status}</span>}
      />
    ),
  },
  {
    title: '操作',
    key: 'action',
    width: 120,
    render: () => (
      <Space size={4}>
        <a
          style={{ fontSize: 12, transition: 'color 0.2s' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--ems-primary)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '')}
        >
          编辑
        </a>
        <a
          style={{ fontSize: 12, transition: 'color 0.2s' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--ems-danger)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '')}
        >
          删除
        </a>
      </Space>
    ),
  },
];

function PermissionPage() {
  const [activeTab, setActiveTab] = useState('users');
  const [userLoading, setUserLoading] = useState(true);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [searchText, setSearchText] = useState('');
  const [filterRole, setFilterRole] = useState<string | undefined>(undefined);
  const [_orgTree, setOrgTree] = useState<OrgNode[]>([]);
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>('');

  /* 获取用户列表 */
  const fetchUsers = useCallback(async () => {
    try {
      const params: Record<string, unknown> = { page: 1, pageSize: 50 };
      if (searchText) params.keyword = searchText;
      const res: any = await getUserList(params);
      if (res.code === 0) {
        const list = res.data?.list ?? res.data ?? [];
        let filtered = list;
        if (filterRole) {
          filtered = list.filter((item: any) => item.role === filterRole);
        }
        setUsers(
          filtered.map((item: any, index: number) => ({
            key: item.id ?? String(index + 1),
            id: item.id,
            username: item.username ?? '',
            name: item.name ?? '',
            department: item.department ?? '',
            role: item.role ?? '',
            phone: item.phone ?? '',
            email: item.email ?? '',
            status: item.status ?? '启用',
            organizationId: item.organizationId ?? '',
          })),
        );
      }
    } catch (err) {
      console.error('获取用户列表失败', err);
    } finally {
      setUserLoading(false);
    }
  }, [searchText, filterRole]);

  /* 获取组织树 */
  const fetchOrgTree = useCallback(async () => {
    try {
      const res: any = await getOrganizationTree();
      if (res.code === 0) {
        setOrgTree(res.data ?? []);
      }
    } catch (err) {
      console.error('获取组织树失败', err);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
    fetchOrgTree();
  }, [fetchUsers, fetchOrgTree]);

  /* 搜索 */
  const handleSearch = () => {
    setUserLoading(true);
    fetchUsers();
  };

  /* 打开角色分配弹窗 */
  const handleAssignRole = (record: UserRecord) => {
    setSelectedUser(record);
    setSelectedRole(record.role);
    setRoleModalOpen(true);
  };

  /* 确认角色分配 */
  const handleRoleSubmit = () => {
    if (!selectedRole) {
      message.warning('请选择角色');
      return;
    }
    message.success(`已将 ${selectedUser?.name ?? ''} 的角色更新为 ${selectedRole}`);
    setRoleModalOpen(false);
    setSelectedUser(null);
    setSelectedRole('');
  };

  /* 用户表格列 */
  const userColumns: ColumnsType<UserRecord> = [
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
      width: 120,
      render: (v: string) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            background: 'var(--ems-gradient-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <UserOutlined style={{ color: '#fff', fontSize: 12 }} />
          </div>
          <Text strong style={{ fontFamily: 'var(--ems-font-mono)', fontSize: 12 }}>{v}</Text>
        </div>
      ),
    },
    { title: '姓名', dataIndex: 'name', key: 'name', width: 100 },
    { title: '部门', dataIndex: 'department', key: 'department', width: 160 },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      width: 130,
      render: (role: string) => (
        <Tag color={roleColorMap[role] ?? '#94a3b8'}>{role}</Tag>
      ),
    },
    { title: '手机号', dataIndex: 'phone', key: 'phone', width: 140, render: (v: string) => <Text type="secondary" style={{ fontFamily: 'var(--ems-font-mono)', fontSize: 12 }}>{v}</Text> },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status: string) => (
        <Badge
          status={status === '启用' ? 'success' : 'error'}
          text={<span style={{ fontSize: 12 }}>{status}</span>}
        />
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_: any, record: UserRecord) => (
        <Space size={4}>
          <a
            style={{ fontSize: 12, transition: 'color 0.2s' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--ems-primary)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '')}
          >
            编辑
          </a>
          <a
            style={{ fontSize: 12, transition: 'color 0.2s' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--ems-accent)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '')}
            onClick={() => handleAssignRole(record)}
          >
            分配角色
          </a>
          <a
            style={{ fontSize: 12, transition: 'color 0.2s' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--ems-danger)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '')}
          >
            重置密码
          </a>
        </Space>
      ),
    },
  ];

  /* 用户管理 Tab */
  const renderUserManagement = () => (
    <div>
      {/* 筛选/操作区域 */}
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
          <Select
            placeholder="角色筛选"
            value={filterRole}
            onChange={(val) => { setFilterRole(val); setUserLoading(true); }}
            style={{ width: 140 }}
            allowClear
          >
            {roleOptions.map((opt) => (
              <Select.Option key={opt.value} value={opt.value}>{opt.label}</Select.Option>
            ))}
          </Select>
          <Button type="primary" onClick={handleSearch}>查询</Button>
        </Space>
        <Button type="primary" icon={<PlusOutlined />}>
          新增用户
        </Button>
      </div>

      {/* 用户统计 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <div className="ems-stat-card ems-stat-card--primary ems-animate-fade-up ems-delay-2" style={{ padding: '16px 16px 16px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <TeamOutlined style={{ color: 'var(--ems-primary)', fontSize: 18 }} />
              <div>
                <div style={{ fontSize: 11, color: 'var(--ems-text-muted)' }}>用户总数</div>
                <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'var(--ems-font-display)', color: 'var(--ems-primary)' }}>{users.length}</div>
              </div>
            </div>
          </div>
        </Col>
        <Col span={6}>
          <div className="ems-stat-card ems-stat-card--success ems-animate-fade-up ems-delay-3" style={{ padding: '16px 16px 16px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <SafetyOutlined style={{ color: '#10b981', fontSize: 18 }} />
              <div>
                <div style={{ fontSize: 11, color: 'var(--ems-text-muted)' }}>启用用户</div>
                <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'var(--ems-font-display)', color: '#10b981' }}>{users.filter((u) => u.status === '启用').length}</div>
              </div>
            </div>
          </div>
        </Col>
        <Col span={6}>
          <div className="ems-stat-card ems-stat-card--warning ems-animate-fade-up ems-delay-4" style={{ padding: '16px 16px 16px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <UserOutlined style={{ color: '#f59e0b', fontSize: 18 }} />
              <div>
                <div style={{ fontSize: 11, color: 'var(--ems-text-muted)' }}>角色类型</div>
                <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'var(--ems-font-display)', color: '#f59e0b' }}>{roleOptions.length}</div>
              </div>
            </div>
          </div>
        </Col>
        <Col span={6}>
          <div className="ems-stat-card ems-stat-card--info ems-animate-fade-up ems-delay-5" style={{ padding: '16px 16px 16px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <SafetyOutlined style={{ color: '#6366f1', fontSize: 18 }} />
              <div>
                <div style={{ fontSize: 11, color: 'var(--ems-text-muted)' }}>权限编码</div>
                <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'var(--ems-font-display)', color: '#6366f1' }}>{permissionData.length}</div>
              </div>
            </div>
          </div>
        </Col>
      </Row>

      {/* 用户表格 */}
      <Card className="ems-animate-fade-up ems-delay-3" bordered={false}>
        <Table
          columns={userColumns}
          dataSource={users}
          loading={userLoading}
          pagination={{ pageSize: 10, showTotal: (total) => `共 ${total} 条` }}
          scroll={{ x: 900 }}
          size="middle"
        />
      </Card>
    </div>
  );

  /* 权限编码 Tab */
  const renderPermissionCodes = () => (
    <div>
      <div className="ems-filter-bar ems-animate-fade-up ems-delay-1">
        <Space>
          <Input
            placeholder="搜索权限编码/名称"
            prefix={<SearchOutlined />}
            style={{ width: 260 }}
            allowClear
          />
          <Button type="primary">查询</Button>
        </Space>
        <Button type="primary" icon={<PlusOutlined />}>
          新增权限
        </Button>
      </div>

      <Card className="ems-animate-fade-up ems-delay-2" bordered={false}>
        <Table
          columns={permColumns}
          dataSource={permissionData}
          pagination={{ pageSize: 10, showTotal: (total) => `共 ${total} 条` }}
          scroll={{ x: 800 }}
          size="middle"
        />
      </Card>
    </div>
  );

  const tabItems = [
    {
      key: 'users',
      label: (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <TeamOutlined /> 用户与角色管理
        </span>
      ),
      children: renderUserManagement(),
    },
    {
      key: 'permissions',
      label: (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <SafetyOutlined /> 权限编码管理
        </span>
      ),
      children: renderPermissionCodes(),
    },
  ];

  return (
    <div>
      {/* 页面标题 */}
      <div className="ems-page-header ems-animate-fade-up">
        <div>
          <div className="ems-page-title">权限管理</div>
          <div className="ems-page-subtitle">管理系统内用户角色分配与权限编码策略</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: '4px 12px', borderRadius: 20,
            background: 'var(--ems-primary-bg)', color: 'var(--ems-primary)',
            fontSize: 12, fontWeight: 600,
          }}>
            <EditOutlined /> 角色权限配置
          </span>
        </div>
      </div>

      {/* Tabs */}
      <Card className="ems-animate-fade-up ems-delay-1" bordered={false}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          tabBarStyle={{ marginBottom: 0 }}
        />
      </Card>

      {/* 角色分配弹窗 */}
      <Modal
        title={
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <EditOutlined style={{ color: 'var(--ems-primary)' }} />
            角色分配 — {selectedUser?.name ?? ''}
          </span>
        }
        open={roleModalOpen}
        onOk={handleRoleSubmit}
        onCancel={() => { setRoleModalOpen(false); setSelectedUser(null); }}
        width={480}
        okText="确认分配"
        cancelText="取消"
      >
        <div style={{ padding: '16px 0' }}>
          <div style={{ marginBottom: 16 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>当前角色</Text>
            <div style={{ marginTop: 4 }}>
              <Tag color={roleColorMap[selectedUser?.role ?? '']} style={{ fontSize: 13, padding: '4px 14px' }}>
                {selectedUser?.role ?? '未分配'}
              </Tag>
            </div>
          </div>
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>分配新角色</Text>
            <Select
              value={selectedRole}
              onChange={setSelectedRole}
              style={{ width: '100%', marginTop: 8 }}
              size="large"
              placeholder="请选择角色"
            >
              {roleOptions.map((opt) => (
                <Select.Option key={opt.value} value={opt.value}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Badge color={roleColorMap[opt.value]} />
                    {opt.label}
                  </div>
                </Select.Option>
              ))}
            </Select>
          </div>
          <div style={{ marginTop: 20, padding: '12px 14px', borderRadius: 8, background: 'var(--ems-primary-bg)' }}>
            <Text style={{ fontSize: 12, color: 'var(--ems-text-secondary)' }}>
              提示：角色变更将影响该用户的系统访问权限和数据操作范围，请谨慎操作。
            </Text>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default PermissionPage;
