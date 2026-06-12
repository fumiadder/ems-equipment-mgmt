import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import EquipmentList from './pages/Equipment/index';
import EquipmentDetail from './pages/Equipment/Detail';
import WorkOrderList from './pages/WorkOrder/index';
import WorkOrderDetail from './pages/WorkOrder/Detail';
import InspectionList from './pages/Inspection/index';
import SparePartList from './pages/SparePart/index';
import OrganizationPage from './pages/Organization/index';
import UserPage from './pages/User/index';
import ReportPage from './pages/Report/index';
import MonitorPage from './pages/Monitor/index';
import ScreenPage from './pages/Screen/index';
import PermissionPage from './pages/Permission/index';

function App() {
  const isAuthenticated = !!localStorage.getItem('ems_token');

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={isAuthenticated ? <MainLayout /> : <Navigate to="/login" replace />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="equipment" element={<EquipmentList />} />
        <Route path="equipment/:id" element={<EquipmentDetail />} />
        <Route path="work-order" element={<WorkOrderList />} />
        <Route path="work-order/:id" element={<WorkOrderDetail />} />
        <Route path="inspection" element={<InspectionList />} />
        <Route path="spare-part" element={<SparePartList />} />
        <Route path="monitor" element={<MonitorPage />} />
        <Route path="report" element={<ReportPage />} />
        <Route path="screen" element={<ScreenPage />} />
        <Route path="organization" element={<OrganizationPage />} />
        <Route path="user" element={<UserPage />} />
        <Route path="permission" element={<PermissionPage />} />
      </Route>
    </Routes>
  );
}

export default App;
