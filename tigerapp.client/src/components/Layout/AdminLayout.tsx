import React, { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext';
import {
  FiBell,
  FiChevronLeft,
  FiCreditCard,
  FiExternalLink,
  FiFileText,
  FiGrid,
  FiHelpCircle,
  FiLogOut,
  FiMenu,
  FiPackage,
  FiPhone,
  FiShoppingBag,
  FiUsers,
  FiX,
  FiZap,
  FiSettings,
} from 'react-icons/fi';

interface LayoutProps { children: React.ReactNode; }

const menuItems = [
  { path: '/admin/dashboard', label: 'داشبورد', description: 'نمای کلی عملکرد', icon: FiGrid, roles: ['Admin', 'Consultant', 'ContentManager'] },
  { path: '/admin/plans', label: 'طرح‌ها', description: 'مدیریت بسته‌ها', icon: FiPackage, roles: ['Admin', 'ContentManager'] },
  { path: '/admin/consultations', label: 'مشاوره‌ها', description: 'جلسات و خدمات', icon: FiPhone, roles: ['Admin', 'Consultant'] },
  { path: '/admin/orders', label: 'سفارشات', description: 'پرداخت‌ها و وضعیت', icon: FiShoppingBag, roles: ['Admin', 'Consultant'] },
  { path: '/admin/payments', label: 'تراکنش‌ها', description: 'درگاه و بررسی رسید', icon: FiCreditCard, roles: ['Admin', 'Consultant'] },
  { path: '/admin/users', label: 'کاربران و نقش‌ها', description: 'سطوح دسترسی', icon: FiUsers, roles: ['Admin', 'Consultant'] },
  { path: '/admin/content', label: 'محتوا', description: 'متن‌ها و رسانه‌ها', icon: FiFileText, roles: ['Admin', 'ContentManager'] },
  { path: '/admin/faqs', label: 'سوالات متداول', description: 'پرسش و پاسخ‌ها', icon: FiHelpCircle, roles: ['Admin', 'ContentManager'] },
  { path: '/admin/menu', label: 'منو و پیوندها', description: 'ناوبری پویا', icon: FiMenu, roles: ['Admin', 'ContentManager'] },
  { path: '/admin/settings', label: 'تنظیمات سیستم', description: 'هویت و درگاه‌ها', icon: FiSettings, roles: ['Admin'] },
];

const AdminLayout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const accessibleMenuItems = menuItems.filter(item => item.roles.includes(user?.role || ''));
  const currentPage = accessibleMenuItems.find((item) => item.path === location.pathname) ?? accessibleMenuItems[0] ?? menuItems[0];

  useEffect(() => {
    if (!mobileOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileOpen(false);
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [mobileOpen]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const initials = `${user?.firstName?.[0] || 'م'}${user?.lastName?.[0] || ''}`;

  return (
    <div className={`admin-shell ${sidebarCollapsed ? 'is-collapsed' : ''}`}>
      <button
        type="button"
        className={`admin-sidebar-overlay ${mobileOpen ? 'is-visible' : ''}`}
        aria-label="بستن منوی مدیریت"
        tabIndex={mobileOpen ? 0 : -1}
        onClick={() => setMobileOpen(false)}
      />

      <aside className={`admin-sidebar ${mobileOpen ? 'is-open' : ''}`} aria-label="منوی مدیریت">
        <div className="admin-sidebar-brand-row">
          <Link to="/admin/dashboard" className="admin-sidebar-brand" aria-label="تایگر آکادمی، داشبورد مدیریت" onClick={() => setMobileOpen(false)}>
            <span className="admin-sidebar-logo" aria-hidden="true"><FiZap /></span>
            <span className="admin-sidebar-brand-copy">
              <strong>تایگر آکادمی</strong>
              <small>مرکز کنترل مدیریت</small>
            </span>
          </Link>

          <button
            type="button"
            className="admin-sidebar-toggle admin-desktop-toggle"
            onClick={() => setSidebarCollapsed((value) => !value)}
            aria-label={sidebarCollapsed ? 'باز کردن سایدبار' : 'جمع کردن سایدبار'}
          >
            <FiChevronLeft className={sidebarCollapsed ? 'is-rotated' : ''} aria-hidden="true" />
          </button>
          <button type="button" className="admin-sidebar-toggle admin-mobile-close" onClick={() => setMobileOpen(false)} aria-label="بستن منو">
            <FiX aria-hidden="true" />
          </button>
        </div>

        <a className="admin-view-site" href="/" target="_blank" rel="noopener noreferrer">
          <FiExternalLink aria-hidden="true" />
          <span>مشاهده وب‌سایت</span>
        </a>

        <nav className="admin-sidebar-nav" aria-label="صفحات مدیریت">
          <span className="admin-sidebar-label">مدیریت آکادمی</span>
          {accessibleMenuItems.map((item) => (
            <NavLink key={item.path} to={item.path} onClick={() => setMobileOpen(false)} className={({ isActive }) => `admin-nav-item ${isActive ? 'is-active' : ''}`} title={sidebarCollapsed ? item.label : undefined}>
              <span className="admin-nav-icon"><item.icon aria-hidden="true" /></span>
              <span className="admin-nav-copy"><strong>{item.label}</strong><small>{item.description}</small></span>
            </NavLink>
          ))}
        </nav>

        <div className="admin-sidebar-account">
          <span className="admin-avatar" aria-hidden="true">{initials}</span>
          <span className="admin-account-copy"><strong>{user?.firstName || 'مدیر'} {user?.lastName || 'سیستم'}</strong><small>{user?.role === 'Admin' ? 'مدیر کل' : user?.role === 'Consultant' ? 'مشاور' : 'مدیر محتوا'}</small></span>
          <button type="button" className="admin-logout-button" onClick={handleLogout} aria-label="خروج از حساب"><FiLogOut aria-hidden="true" /></button>
        </div>
      </aside>

      <div className="admin-workspace">
        <header className="admin-topbar">
          <div className="admin-topbar-title">
            <button type="button" className="admin-mobile-menu" onClick={() => setMobileOpen(true)} aria-label="باز کردن منوی مدیریت"><FiMenu aria-hidden="true" /></button>
            <div><small>پنل مدیریت / {currentPage.label}</small><strong>{currentPage.label}</strong></div>
          </div>
          <div className="admin-topbar-actions">
            <span className="admin-date-chip">{new Date().toLocaleDateString('fa-IR-u-ca-persian', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            <button type="button" className="admin-icon-button" aria-label="اعلان‌ها"><FiBell aria-hidden="true" /><span className="admin-notification-dot" aria-hidden="true" /></button>
            <span className="admin-avatar admin-avatar-small" aria-hidden="true">{initials}</span>
          </div>
        </header>
        <main className="admin-main">{children}</main>
      </div>
    </div>
  );
};

export default AdminLayout;
