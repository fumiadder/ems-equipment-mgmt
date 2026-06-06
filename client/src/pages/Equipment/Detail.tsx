import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, Descriptions, Tag, Button, Timeline, Typography, Spin } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { getEquipmentDetail } from '../../services/equipment';

const { Text } = Typography;

/* 生命周期时间轴数据（后端暂无此接口，保留 mock 数据） */
const lifecycleData = [
  { label: '设备采购', date: '2022-01-20', color: '#3b82f6' },
  { label: '到货验收', date: '2022-02-28', color: '#3b82f6' },
  { label: '安装调试', date: '2022-03-10', color: '#06b6d4' },
  { label: '正式投用', date: '2022-03-15', color: '#10b981' },
  { label: '首次保养', date: '2022-06-15', color: '#10b981' },
  { label: '定期巡检', date: '2023-03-15', color: '#10b981' },
  { label: '维修记录', date: '2023-09-20', color: '#f59e0b' },
  { label: '最近保养', date: '2024-01-10', color: '#10b981' },
];

const statusColorMap: Record<string, string> = {
  运行中: '#10b981',
  停机: '#ef4444',
  维修中: '#f59e0b',
  待机: '#3b82f6',
};

/* 设备详情接口返回类型 */
interface EquipmentDetailData {
  code: string;
  name: string;
  model: string;
  manufacturer: string;
  factory: string;
  workshop: string;
  status: string;
  installDate: string;
  warrantyDate: string;
  lastMaintenance: string;
  nextMaintenance: string;
  [key: string]: any;
}

function EquipmentDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<EquipmentDetailData>({
    code: '',
    name: '',
    model: '',
    manufacturer: '',
    factory: '',
    workshop: '',
    status: '',
    installDate: '',
    warrantyDate: '',
    lastMaintenance: '',
    nextMaintenance: '',
  });

  /* 获取设备详情 */
  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    const fetchDetail = async () => {
      setLoading(true);
      try {
        const res: any = await getEquipmentDetail(id);
        if (!cancelled && res.code === 0) {
          const data = res.data ?? {};
          setDetail({
            code: data.code ?? '',
            name: data.name ?? '',
            model: data.model ?? '',
            manufacturer: data.manufacturer ?? '',
            factory: data.factory ?? '',
            workshop: data.workshop ?? '',
            status: data.status ?? '',
            installDate: data.installDate ?? data.install_date ?? '',
            warrantyDate: data.warrantyDate ?? data.warranty_date ?? '',
            lastMaintenance: data.lastMaintenance ?? data.last_maintenance ?? '',
            nextMaintenance: data.nextMaintenance ?? data.next_maintenance ?? '',
          });
        }
      } catch (err) {
        console.error('获取设备详情失败', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchDetail();
    return () => { cancelled = true; };
  }, [id]);

  return (
    <div>
      <div className="ems-page-header ems-animate-fade-up">
        <div>
          <div className="ems-page-title">设备详情 - {detail.name || '加载中...'}</div>
          <div className="ems-page-subtitle">查看设备基础信息与生命周期记录</div>
        </div>
      </div>

      <div className="ems-filter-bar ems-animate-fade-up ems-delay-1">
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/equipment')}>
          返回列表
        </Button>
      </div>

      {/* 设备基本信息 */}
      <Spin spinning={loading}>
        <Card title="设备信息" className="ems-animate-fade-up ems-delay-2" style={{ marginBottom: 24 }}>
          <Descriptions bordered column={2}>
            <Descriptions.Item label="设备编号">
              <Text strong style={{ fontFamily: 'var(--ems-font-mono)', fontSize: 12 }}>{detail.code}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="设备名称">{detail.name}</Descriptions.Item>
            <Descriptions.Item label="设备型号">
              <Text strong style={{ fontFamily: 'var(--ems-font-mono)', fontSize: 12 }}>{detail.model}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="制造商">{detail.manufacturer}</Descriptions.Item>
            <Descriptions.Item label="所属工厂">{detail.factory}</Descriptions.Item>
            <Descriptions.Item label="车间">{detail.workshop}</Descriptions.Item>
            <Descriptions.Item label="设备状态">
              <Tag color={statusColorMap[detail.status]}>{detail.status}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="安装日期">{detail.installDate}</Descriptions.Item>
            <Descriptions.Item label="质保到期日">{detail.warrantyDate}</Descriptions.Item>
            <Descriptions.Item label="上次保养">{detail.lastMaintenance}</Descriptions.Item>
            <Descriptions.Item label="下次保养">{detail.nextMaintenance}</Descriptions.Item>
          </Descriptions>
        </Card>
      </Spin>

      {/* 生命周期时间轴（暂时保留 mock 数据） */}
      <Card title="生命周期" className="ems-animate-fade-up ems-delay-3">
        <Timeline
          items={lifecycleData.map((item) => ({
            color: item.color,
            children: (
              <div>
                <strong>{item.label}</strong>
                <div style={{ color: '#999', fontSize: 12 }}>{item.date}</div>
              </div>
            ),
          }))}
        />
      </Card>
    </div>
  );
}

export default EquipmentDetail;
