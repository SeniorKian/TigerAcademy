import React, { useEffect, useState } from 'react';
import apiClient from '@/api/apiClient';
import { FiArrowUpLeft, FiCalendar, FiDollarSign, FiPackage, FiPhone, FiShoppingBag, FiTrendingUp, FiUsers } from 'react-icons/fi';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface DashboardStats {
  totalUsers: number;
  totalPlans: number;
  totalConsultations: number;
  totalOrders: number;
  totalRevenue: number;
  todayDate: string;
  monthlyOrders: Array<{ month: string; orders: number }>;
  consultationBreakdown: Array<{ type: string; name: string; value: number }>;
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const response = await apiClient.get('/admin/dashboard');
        setStats(response.data);
      } catch (error) {
        console.error('Failed to load stats:', error);
      } finally {
        setLoading(false);
      }
    };
    void loadStats();
  }, []);

  const statCards = [
    { label: 'کل کاربران', value: stats?.totalUsers || 0, hint: 'اعضای ثبت‌نام‌شده', icon: FiUsers, tone: 'blue' },
    { label: 'طرح‌های فعال', value: stats?.totalPlans || 0, hint: 'بسته‌های قابل فروش', icon: FiPackage, tone: 'green' },
    { label: 'مشاوره‌ها', value: stats?.totalConsultations || 0, hint: 'خدمات قابل رزرو', icon: FiPhone, tone: 'purple' },
    { label: 'سفارش‌ها', value: stats?.totalOrders || 0, hint: 'کل تراکنش‌ها', icon: FiShoppingBag, tone: 'gold' },
  ];

  const barData = (stats?.monthlyOrders || []).map(item => ({
    name: new Intl.DateTimeFormat('fa-IR', { month: 'short' }).format(new Date(`${item.month}-01T00:00:00`)),
    orders: item.orders,
  }));

  const chartColors = ['#2563EB', '#D98B0B', '#16A34A'];
  const pieData = (stats?.consultationBreakdown || []).map((item, index) => ({ ...item, color: chartColors[index % chartColors.length] }));

  const formatNumber = (value: number) => new Intl.NumberFormat('fa-IR').format(value);

  if (loading) {
    return (
      <div className="admin-page admin-loading-page" aria-label="در حال بارگذاری داشبورد">
        <div className="admin-skeleton admin-skeleton-heading" />
        <div className="admin-stat-grid">{[0, 1, 2, 3].map((item) => <div key={item} className="admin-skeleton admin-skeleton-stat" />)}</div>
        <div className="admin-skeleton admin-skeleton-revenue" />
        <div className="admin-chart-grid">{[0, 1].map((item) => <div key={item} className="admin-skeleton admin-skeleton-chart" />)}</div>
      </div>
    );
  }

  return (
    <div className="admin-page admin-dashboard-page">
      <div className="admin-page-header">
        <div>
          <span className="admin-page-eyebrow"><FiCalendar aria-hidden="true" /> {stats?.todayDate || 'امروز'}</span>
          <h1>مرکز کنترل آکادمی</h1>
          <p>آخرین وضعیت کاربران، خدمات و فروش را در یک نگاه ببینید.</p>
        </div>
        <a href="/" target="_blank" rel="noopener noreferrer" className="admin-secondary-action">مشاهده سایت <FiArrowUpLeft aria-hidden="true" /></a>
      </div>

      <section className="admin-stat-grid" aria-label="شاخص‌های اصلی">
        {statCards.map((card) => (
          <article key={card.label} className="admin-stat-card">
            <span className={`admin-stat-icon is-${card.tone}`}><card.icon aria-hidden="true" /></span>
            <div><span>{card.label}</span><strong>{formatNumber(card.value)}</strong><small>{card.hint}</small></div>
          </article>
        ))}
      </section>

      <section className="admin-revenue-card">
        <div>
          <span className="admin-revenue-kicker"><FiDollarSign aria-hidden="true" /> عملکرد مالی</span>
          <p>درآمد کل ثبت‌شده</p>
          <strong>{formatNumber(stats?.totalRevenue || 0)} <small>تومان</small></strong>
        </div>
        <span className="admin-revenue-icon" aria-hidden="true"><FiTrendingUp /></span>
      </section>

      <section className="admin-chart-grid" aria-label="نمودارهای عملکرد">
        <article className="admin-chart-card">
          <div className="admin-card-heading"><div><span>روند فروش</span><h2>آمار سفارشات ماهانه</h2></div><small>۶ ماه اخیر</small></div>
          <div className="admin-chart-canvas">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 8, right: 0, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="4 5" vertical={false} stroke="#E7EBF0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#718096' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94A3B8' }} />
                <Tooltip contentStyle={{ fontFamily: 'Vazirmatn', direction: 'rtl', borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '12px' }} />
                <Bar dataKey="orders" fill="#183A62" radius={[7, 7, 2, 2]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="admin-chart-card">
          <div className="admin-card-heading"><div><span>ترکیب خدمات</span><h2>مشاوره‌ها بر اساس نوع</h2></div><small>{formatNumber(stats?.totalConsultations || 0)} خدمت</small></div>
          <div className="admin-pie-layout">
            <div className="admin-pie-canvas">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={62} outerRadius={92} paddingAngle={4} dataKey="value" stroke="none">
                    {pieData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ fontFamily: 'Vazirmatn', direction: 'rtl', borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="admin-chart-legend">
              {pieData.map((item) => <div key={item.name}><span style={{ backgroundColor: item.color }} /><p><strong>{item.name}</strong><small>{formatNumber(item.value)} مورد</small></p></div>)}
            </div>
          </div>
        </article>
      </section>
    </div>
  );
};

export default Dashboard;
