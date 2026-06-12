import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Dropdown } from 'antd';
import {
  DashboardOutlined,
  AppstoreOutlined,
  FileTextOutlined,
  SearchOutlined,
  ToolOutlined,
  BarChartOutlined,
  MonitorOutlined,
  BellOutlined,
  SettingOutlined,
  LogoutOutlined,
  UserOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import './MainLayout.css';

const { Header, Sider, Content } = Layout;

/* 菜单项定义 */
const menuItems: MenuProps['items'] = [
  {
    key: '/dashboard',
    icon: <DashboardOutlined />,
    label: '仪表盘',
  },
  {
    key: 'equipment-group',
    icon: <AppstoreOutlined />,
    label: '设备管理',
    children: [
      { key: '/equipment', label: '设备台账' },
    ],
  },
  {
    key: 'work-order-group',
    icon: <FileTextOutlined />,
    label: '工单管理',
    children: [
      { key: '/work-order', label: '工单列表' },
    ],
  },
  {
    key: '/inspection',
    icon: <SearchOutlined />,
    label: '巡检管理',
  },
  {
    key: '/spare-part',
    icon: <ToolOutlined />,
    label: '备件管理',
  },
  {
    key: '/monitor',
    icon: <MonitorOutlined />,
    label: 'IoT 监控',
  },
  {
    key: 'data-group',
    icon: <BarChartOutlined />,
    label: '数据分析',
    children: [
      { key: '/report', label: '报表中心' },
      { key: '/screen', label: '大屏看板' },
    ],
  },
  {
    key: 'system-group',
    icon: <SettingOutlined />,
    label: '系统管理',
    children: [
      { key: '/organization', label: '组织架构' },
      { key: '/user', label: '用户管理' },
      { key: '/permission', label: '权限管理' },
    ],
  },
];

/* 路由到页面名称的映射 */
const pageNameMap: Record<string, string> = {
  '/dashboard': '仪表盘',
  '/equipment': '设备台账',
  '/work-order': '工单管理',
  '/inspection': '巡检管理',
  '/spare-part': '备件管理',
  '/monitor': 'IoT 监控',
  '/report': '报表中心',
  '/screen': '大屏看板',
  '/organization': '组织架构',
  '/user': '用户管理',
  '/permission': '权限管理',
};

function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  const [userName, setUserName] = useState('管理员');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setUserName(user.name || user.username || '管理员');
      } catch { /* ignore */ }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('ems_token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  /* 实时时钟 */
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('zh-CN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        })
      );
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  /* 菜单点击跳转 */
  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    navigate(key);
  };

  /* 当前选中菜单项 */
  const selectedKeys = [location.pathname];
  /* 当前展开的父级菜单 */
  const openKeys = (menuItems || [])
    .filter((item): item is any => item != null && 'children' in item)
    .filter((item) =>
      (item.children || []).some((child: any) => child.key === location.pathname)
    )
    .map((item) => item.key as string);

  /* 当前页面名称 */
  const currentPageName = pageNameMap[location.pathname] || '设备管理系统';

  return (
    <Layout className="main-layout">
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        className="main-sider"
        width={220}
        trigger={null}
      >
        <div className="logo">
          {collapsed ? (
            <span style={{ fontSize: 18, fontWeight: 800, background: 'var(--ems-gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>E</span>
          ) : (
            <>
              <span style={{ marginRight: 8, fontSize: 20 }}>⚙</span>
              <span>EMS 设备管理</span>
            </>
          )}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={selectedKeys}
          defaultOpenKeys={openKeys}
          items={menuItems}
          onClick={handleMenuClick}
        />
      </Sider>
      <Layout>
        <Header className="main-header">
          <div className="header-left">
            <span
              onClick={() => setCollapsed(!collapsed)}
              style={{ cursor: 'pointer', fontSize: 18, color: 'var(--ems-text-muted)', display: 'flex', alignItems: 'center' }}
            >
              {collapsed ? '☰' : '☰'}
            </span>
            <div className="header-breadcrumb">
              设备管理 / <span>{currentPageName}</span>
            </div>
          </div>
          <div className="header-right">
            <span className="header-time">{currentTime}</span>
            <div className="header-notification">
              <BellOutlined style={{ fontSize: 16 }} />
              <div className="notification-badge" />
            </div>
            <Dropdown menu={{ items: [
              { key: 'profile', icon: <UserOutlined />, label: '个人中心' },
              { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', danger: true },
            ], onClick: ({ key }) => { if (key === 'logout') handleLogout(); } }}>
              <div className="header-user" style={{ cursor: 'pointer' }}>
                <div className="header-user-avatar">{userName.charAt(0)}</div>
                <span className="header-user-name">{userName}</span>
              </div>
            </Dropdown>
          </div>
        </Header>
        <Content className="main-content ems-content-area">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}

export default MainLayout;
