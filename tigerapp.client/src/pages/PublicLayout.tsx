import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  FiArrowLeft,
  FiChevronDown,
  FiHelpCircle,
  FiHome,
  FiLogIn,
  FiLogOut,
  FiMapPin,
  FiMenu,
  FiMessageCircle,
  FiPhone,
  FiShield,
  FiStar,
  FiUser,
  FiX,
  FiZap,
} from 'react-icons/fi';
import type { IconType } from 'react-icons';
import { useAuth } from '@/auth/AuthContext';
import { Container } from '@/design-system';
import apiClient from '@/api/apiClient';

type NavLink = { to: string; label: string; icon: IconType; children?: NavLink[] };

const defaultNavLinks: NavLink[] = [
  { to: '/', label: 'خانه', icon: FiHome },
  { to: '/consultations', label: 'مشاوره', icon: FiMessageCircle },
  { to: '/#plans', label: 'طرح‌ها', icon: FiStar },
  { to: '/#faq', label: 'سوالات متداول', icon: FiHelpCircle },
  { to: '/#contact', label: 'تماس با ما', icon: FiPhone },
];

const contactPhones = ['۰۹۱۲-۴۰۵-۴۵۷۵', '۰۹۱۸-۲۰۹-۳۰۳۶', '۰۹۰۲-۲۰۹-۳۰۳۶'];
const defaultBranding = { siteName: 'تایگر آکادمی', siteSubtitle: 'انتخاب آگاهانه، آینده روشن', supportPhone: '09124054575', footerText: 'طراحی شده برای انتخاب‌های روشن‌تر', registrationEnabled: true, maintenanceMode: false };

let cancelActivePageScroll: (() => void) | null = null;

const animatePageScroll = (targetTop: number) => {
  cancelActivePageScroll?.();

  const root = document.documentElement;
  const startTop = window.scrollY;
  const distance = Math.max(0, targetTop) - startTop;
  if (Math.abs(distance) < 2) {
    window.scrollTo(0, Math.max(0, targetTop));
    return;
  }

  const previousScrollBehavior = root.style.scrollBehavior;
  const duration = Math.min(760, Math.max(440, Math.abs(distance) * 0.18));
  const startedAt = performance.now();
  let frame = 0;
  let finished = false;

  root.style.scrollBehavior = 'auto';
  const cleanup = () => {
    if (finished) return;
    finished = true;
    if (frame) window.cancelAnimationFrame(frame);
    root.style.scrollBehavior = previousScrollBehavior;
    cancelActivePageScroll = null;
  };
  cancelActivePageScroll = cleanup;

  const step = (now: number) => {
    const progress = Math.min(1, (now - startedAt) / duration);
    const eased = progress < 0.5
      ? 4 * progress * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 3) / 2;
    window.scrollTo(0, startTop + distance * eased);

    if (progress < 1) {
      frame = window.requestAnimationFrame(step);
      return;
    }

    root.style.scrollBehavior = previousScrollBehavior;
    finished = true;
    cancelActivePageScroll = null;
  };

  frame = window.requestAnimationFrame(step);
};

const PublicLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [navLinks, setNavLinks] = useState(defaultNavLinks);
  const [branding, setBranding] = useState(defaultBranding);
  const { isAuthenticated, canAccessAdmin, logout } = useAuth();
  const showManagementLink = isAuthenticated && canAccessAdmin;
  const managementUrl = '/admin/dashboard';
  const managementLabel = 'پنل مدیریت';
  const navigate = useNavigate();
  const location = useLocation();
  const currentPersianYear = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { year: 'numeric' }).format(new Date());
  const displayedPhones = branding.supportPhone ? [branding.supportPhone, ...contactPhones.slice(1)] : contactPhones;

  useEffect(() => () => cancelActivePageScroll?.(), []);

  useEffect(() => {
    let active = true;
    apiClient.get<Array<{ id: number; title: string; link: string; children?: Array<{ id: number; title: string; link: string }> }>>('/menu').then(response => {
      if (!active || !Array.isArray(response.data) || response.data.length === 0) return;
      const iconFor = (link: string) => link.includes('consult') ? FiMessageCircle : link.includes('plan') ? FiStar : link.includes('faq') ? FiHelpCircle : link.includes('contact') ? FiPhone : FiHome;
      const normalize = (link: string) => link === '/plans' ? '/#plans' : link === '/faq' ? '/#faq' : link === '/contact' ? '/#contact' : link;
      const links = response.data.map(item => ({
        to: normalize(item.link),
        label: item.title,
        icon: iconFor(item.link),
        children: (item.children || []).map(child => ({ to: normalize(child.link), label: child.title, icon: iconFor(child.link) })),
      }));
      setNavLinks(links);
    }).catch(() => undefined);
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    apiClient.get('/settings/public').then(response => { if (active) setBranding({ ...defaultBranding, ...response.data }); }).catch(() => undefined);
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!menuOpen && !openDropdown) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setMenuOpen(false); setOpenDropdown(null); }
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [menuOpen, openDropdown]);

  const handleNavClick = (to: string) => {
    setMenuOpen(false);
    setOpenDropdown(null);
    if (/^https?:\/\//i.test(to)) {
      window.open(to, '_blank', 'noopener,noreferrer');
      return;
    }
    if (/^(tel:|mailto:)/i.test(to)) {
      window.open(to, '_self');
      return;
    }
    const target = to.startsWith('#') ? `/${to}` : to;
    if (target === '/') {
      if (location.pathname !== '/') {
        navigate('/');
        window.setTimeout(() => animatePageScroll(0), 120);
      } else {
        window.history.replaceState(window.history.state, '', '/');
        animatePageScroll(0);
      }
      return;
    }

    if (!target.startsWith('/#')) {
      navigate(target);
      return;
    }

    const id = target.slice(2);
    const scrollToSection = () => {
      const element = document.getElementById(id);
      if (!element) return;
      const headerHeight = document.querySelector<HTMLElement>('.site-header')?.offsetHeight ?? 0;
      const top = Math.max(0, window.scrollY + element.getBoundingClientRect().top - headerHeight - 12);
      animatePageScroll(top);
    };

    if (location.pathname === '/') {
      scrollToSection();
      return;
    }

    navigate('/');
    window.setTimeout(scrollToSection, 120);
  };

  const signOut = async () => {
    await logout();
    navigate('/');
    setMenuOpen(false);
  };

  return (
    <div className="site-shell min-h-screen flex flex-col">
      <a href="#main-content" className="skip-link">رفتن به محتوای اصلی</a>

      <header className="site-header">
        {branding.maintenanceMode && (
          <div className="site-maintenance-notice" role="status">
            سامانه در حالت نگهداری است؛ ممکن است بعضی خدمات موقتاً در دسترس نباشند.
          </div>
        )}
        <Container size="xl">
          <div className="site-nav">
            <Link to="/" className="site-brand" aria-label="تایگر آکادمی، صفحه اصلی">
              <span className="site-brand-mark" aria-hidden="true"><span>T</span></span>
              <span className="site-brand-copy">
                <strong>{branding.siteName}</strong>
                <small>{branding.siteSubtitle}</small>
              </span>
            </Link>

            <nav className="site-nav-links" aria-label="ناوبری اصلی">
              {navLinks.map((link) => {
                const childActive = link.children?.some(child => location.pathname === child.to);
                const active = link.to === '/' ? location.pathname === '/' && !location.hash : location.pathname === link.to || childActive;
                if (link.children?.length) return (
                  <div key={link.to} className={`site-nav-group ${openDropdown === link.to ? 'is-open' : ''}`}>
                    <button type="button" className={`site-nav-link ${active ? 'is-active' : ''}`} aria-haspopup="menu" aria-expanded={openDropdown === link.to} onClick={() => setOpenDropdown(current => current === link.to ? null : link.to)}>
                      {link.label}<FiChevronDown className="site-nav-chevron" aria-hidden="true" />
                    </button>
                    <div className="site-nav-dropdown" role="menu">
                      {link.children.map(child => <button key={child.to} type="button" role="menuitem" onClick={() => handleNavClick(child.to)} className={location.pathname === child.to ? 'is-active' : ''}><child.icon aria-hidden="true" /><span>{child.label}</span><FiArrowLeft aria-hidden="true" /></button>)}
                    </div>
                  </div>
                );
                return (
                  <button
                    key={link.to}
                    type="button"
                    onClick={() => handleNavClick(link.to)}
                    className={`site-nav-link ${active ? 'is-active' : ''}`}
                    aria-current={active ? 'page' : undefined}
                  >
                    {link.label}
                  </button>
                );
              })}
            </nav>

            <div className="site-nav-actions">
              {showManagementLink && <Link to={managementUrl} className="site-login-link site-admin-link"><FiShield aria-hidden="true" /> {managementLabel}</Link>}
              {isAuthenticated ? (
                <>
                  <Link to="/profile" className="site-login-link"><FiUser aria-hidden="true" /> پروفایل</Link>
                  <button type="button" className="site-login-link" onClick={signOut}><FiLogOut aria-hidden="true" /> خروج</button>
                </>
              ) : (
                <>
                  <Link to="/login" className="site-login-link"><FiLogIn aria-hidden="true" /> ورود</Link>
                  {branding.registrationEnabled && <Link to="/register" className="site-header-cta">شروع رایگان <FiArrowLeft aria-hidden="true" /></Link>}
                </>
              )}
            </div>

            <button
              type="button"
              className="site-menu-button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-expanded={menuOpen}
              aria-controls="mobile-navigation"
              aria-label={menuOpen ? 'بستن منو' : 'باز کردن منو'}
            >
              {menuOpen ? <FiX aria-hidden="true" /> : <FiMenu aria-hidden="true" />}
            </button>
          </div>
        </Container>

        <div id="mobile-navigation" className={`site-mobile-menu ${menuOpen ? 'is-open' : ''}`} aria-hidden={!menuOpen}>
          <Container size="xl">
            <nav className="site-mobile-menu-inner" aria-label="ناوبری موبایل">
              {navLinks.map((link) => <div key={link.to} className="site-mobile-group">
                <button type="button" onClick={() => handleNavClick(link.to)} className="site-mobile-link">
                  <link.icon aria-hidden="true" /><span>{link.label}</span><FiArrowLeft className="mobile-link-arrow" aria-hidden="true" />
                </button>
                {!!link.children?.length && <div className="site-mobile-submenu">{link.children.map(child => <button key={child.to} type="button" onClick={() => handleNavClick(child.to)} className="site-mobile-link site-mobile-child"><child.icon aria-hidden="true" /><span>{child.label}</span><FiArrowLeft className="mobile-link-arrow" aria-hidden="true" /></button>)}</div>}
              </div>)}
              <div className="site-mobile-auth">
                {showManagementLink && <Link to={managementUrl} className="site-mobile-primary site-mobile-admin-link" onClick={() => setMenuOpen(false)}><FiShield aria-hidden="true" /> {managementLabel}<FiArrowLeft aria-hidden="true" /></Link>}
                {isAuthenticated ? (
                  <>
                    <Link to="/profile" className="site-mobile-secondary"><FiUser aria-hidden="true" /> پروفایل</Link>
                    <button type="button" className="site-mobile-secondary" onClick={signOut}><FiLogOut aria-hidden="true" /> خروج</button>
                  </>
                ) : (
                  <>
                    <Link to="/login" className="site-mobile-secondary"><FiLogIn aria-hidden="true" /> ورود</Link>
                    {branding.registrationEnabled && <Link to="/register" className="site-mobile-primary">ساخت حساب کاربری</Link>}
                  </>
                )}
              </div>
            </nav>
          </Container>
        </div>
      </header>

      <main id="main-content" className="flex-1" data-route-scroll-container>{children}</main>

      <footer className="site-footer">
        <Container size="xl">
          <div className="footer-banner">
            <div>
              <span className="footer-banner-kicker"><FiShield aria-hidden="true" /> مشاوره اولیه رایگان</span>
              <h2>برای یک انتخاب مطمئن، تنها نیستید.</h2>
              <p>تیم تایگر از اولین سؤال تا آخرین انتخاب کنار شماست.</p>
            </div>
            <button type="button" onClick={() => handleNavClick('/consultations')} className="footer-banner-button">
              رزرو مشاوره <FiArrowLeft aria-hidden="true" />
            </button>
          </div>

          <div className="site-footer-grid">
            <div className="footer-brand-block">
              <div className="site-brand footer-brand">
                <span className="site-brand-mark" aria-hidden="true"><FiZap /></span>
                <span className="site-brand-copy"><strong>{branding.siteName}</strong><small>{branding.siteSubtitle}</small></span>
              </div>
              <p>آکادمی تخصصی انتخاب رشته کنکور با مشاوره تلفنی، حضوری و منتورینگ اختصاصی.</p>
            </div>

            <div>
              <h3>دسترسی سریع</h3>
              <ul>
                {navLinks.slice(0, 4).map((link) => (
                  <li key={link.to}><button type="button" onClick={() => handleNavClick(link.to)}>{link.label}</button></li>
                ))}
                {showManagementLink && <li><Link to={managementUrl} className="footer-admin-link"><FiShield aria-hidden="true" /> {managementLabel}</Link></li>}
              </ul>
            </div>

            <div>
              <h3>خدمات</h3>
              <ul>
                {['مشاوره تلفنی', 'مشاوره حضوری', 'منتورینگ ویژه', 'انتخاب رشته'].map((item) => <li key={item}><span>{item}</span></li>)}
              </ul>
            </div>

            <div>
              <h3>ارتباط با ما</h3>
              <ul className="footer-contact-list">
                {displayedPhones.map((phone) => (
                  <li key={phone}><a href={`tel:${phone.replace(/-/g, '')}`} dir="ltr"><FiPhone aria-hidden="true" /> {phone}</a></li>
                ))}
                <li><span><FiMapPin aria-hidden="true" /> قم، سالاریه، بلوار شیخ مفید</span></li>
              </ul>
            </div>
          </div>

          <div className="site-footer-bottom">
            <p>© {currentPersianYear} تمامی حقوق برای {branding.siteName} محفوظ است.</p>
            <p>{branding.footerText}</p>
          </div>
        </Container>
      </footer>
    </div>
  );
};

export default PublicLayout;
