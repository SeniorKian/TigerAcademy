import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { FiArrowLeft, FiArrowRight, FiCheck, FiEye, FiEyeOff, FiLock, FiPhone, FiShield } from 'react-icons/fi';
import { useAuth } from '@/auth/AuthContext';
import { Input } from '@/design-system';
import { getSafeReturnTo } from '@/utils/navigation';

const Login: React.FC = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isManagementLogin = getSafeReturnTo(searchParams.get('returnTo'))?.startsWith('/admin') ?? false;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    const success = await login(phoneNumber, password);
    if (success) {
      const savedUser = JSON.parse(localStorage.getItem('user') || '{}') as { role?: string };
      const hasPanelAccess = ['Admin', 'Consultant', 'ContentManager'].includes(savedUser.role || '');
      navigate(getSafeReturnTo(searchParams.get('returnTo')) || (hasPanelAccess ? '/admin/dashboard' : '/profile'));
    }
    else setError('شماره موبایل یا رمز عبور اشتباه است');
    setLoading(false);
  };

  return (
    <main className="login-page">
      <Link to="/" className="login-brand" aria-label="بازگشت به تایگر آکادمی">
        <span className="site-brand-mark" aria-hidden="true">T</span>
        <span className="site-brand-copy"><strong>تایگر آکادمی</strong><small>انتخاب آگاهانه، آینده روشن</small></span>
      </Link>

      <div className="login-layout">
        <section className="login-story">
          <span><FiShield aria-hidden="true" /> پنل امن تایگر آکادمی</span>
          <h1>خوش برگشتی؛<br />مسیرت را ادامه بده.</h1>
          <p>سفارش‌ها، جلسات و اطلاعات پروفایلت همه در یک فضای ساده و امن در دسترس هستند.</p>
          <div>
            {['پیگیری سفارش‌ها', 'مدیریت جلسات مشاوره', 'ویرایش اطلاعات شخصی'].map((item) => <small key={item}><FiCheck aria-hidden="true" /> {item}</small>)}
          </div>
        </section>

        <section className="auth-card login-card">
          <div className="auth-card-header">
            <div><h2>{isManagementLogin ? 'ورود به پنل مدیریت' : 'ورود به حساب کاربری'}</h2><p>{isManagementLogin ? 'با حساب مدیر، مشاور یا مدیر محتوا وارد شوید.' : 'شماره موبایل و رمز عبور را وارد کن'}</p></div>
          </div>

          {error && <div className="auth-error" role="alert">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <Input
              label="شماره موبایل"
              type="tel"
              icon={<FiPhone aria-hidden="true" />}
              placeholder="09121234567"
              value={phoneNumber}
              onChange={(event) => setPhoneNumber(event.target.value)}
              required
              dir="ltr"
              inputMode="tel"
              maxLength={11}
              autoComplete="tel"
            />

            <div className="auth-password-field">
              <label htmlFor="login-password">رمز عبور <span aria-hidden="true">*</span></label>
              <div>
                <FiLock className="auth-field-icon" aria-hidden="true" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  dir="ltr"
                  autoComplete="current-password"
                />
                <button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'مخفی کردن رمز' : 'نمایش رمز'}>
                  {showPassword ? <FiEyeOff aria-hidden="true" /> : <FiEye aria-hidden="true" />}
                </button>
              </div>
            </div>

            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? <span className="auth-spinner" aria-label="در حال ورود" /> : <>ورود به حساب <FiArrowLeft aria-hidden="true" /></>}
            </button>
          </form>

          <p className="auth-switch">حساب نداری؟ <Link to={`/register${getSafeReturnTo(searchParams.get('returnTo')) ? `?returnTo=${encodeURIComponent(getSafeReturnTo(searchParams.get('returnTo'))!)}` : ''}`}>ثبت‌نام کن</Link></p>
          <Link to="/" className="auth-back"><FiArrowRight aria-hidden="true" /> بازگشت به سایت</Link>
        </section>
      </div>
    </main>
  );
};

export default Login;
