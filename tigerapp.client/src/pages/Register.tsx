import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { FiArrowRight, FiCheck, FiCheckCircle, FiLock, FiPhone, FiShield, FiUser } from 'react-icons/fi';
import apiClient from '@/api/apiClient';
import { useAuth } from '@/auth/AuthContext';
import { Input } from '@/design-system';
import PublicLayout from './PublicLayout';
import { getSafeReturnTo } from '@/utils/navigation';

interface ApiError {
  response?: {
    data?: {
      message?: string;
      errors?: string[];
    };
  };
}

const Register: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const [form, setForm] = useState({ phoneNumber: '', password: '', confirmPassword: '', firstName: '', lastName: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      await apiClient.post('/auth/register', form);
      const success = await login(form.phoneNumber, form.password);
      const returnTo = getSafeReturnTo(searchParams.get('returnTo'));
      navigate(success ? (returnTo || '/profile') : `/login${returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ''}`);
    } catch (caughtError: unknown) {
      const apiError = caughtError as ApiError;
      const message = apiError.response?.data?.message || apiError.response?.data?.errors?.[0] || 'خطا در ثبت‌نام';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PublicLayout>
      <section className="auth-public-section">
        <div className="auth-background-orb" aria-hidden="true" />
        <div className="auth-public-container">
          <aside className="auth-story">
            <span className="auth-story-kicker"><FiShield aria-hidden="true" /> شروع یک مسیر مطمئن</span>
            <h1>حسابت را بساز؛ ادامه مسیر را با هم می‌رویم.</h1>
            <p>ثبت‌نام کمتر از یک دقیقه زمان می‌برد و بعد از آن می‌توانی طرح یا جلسه مشاوره‌ات را انتخاب کنی.</p>
            <div className="auth-story-points">
              {['مشاوره اولیه رایگان', 'دسترسی به طرح‌های اختصاصی', 'پیگیری وضعیت سفارش و جلسات'].map((item) => (
                <span key={item}><FiCheck aria-hidden="true" /> {item}</span>
              ))}
            </div>
          </aside>

          <div className="auth-card">
            <div className="auth-card-header">
              <span className="auth-card-mark" aria-hidden="true">T</span>
              <div><h2>ثبت‌نام در تایگر آکادمی</h2><p>اطلاعات اصلی خودت را وارد کن</p></div>
            </div>

            {error && <div className="auth-error" role="alert">{error}</div>}

            <form onSubmit={handleRegister} className="auth-form">
              <div className="auth-name-grid">
                <Input
                  label="نام"
                  icon={<FiUser aria-hidden="true" />}
                  placeholder="علی"
                  value={form.firstName}
                  onChange={(event) => setForm({ ...form, firstName: event.target.value })}
                  required
                  autoComplete="given-name"
                />
                <Input
                  label="نام خانوادگی"
                  placeholder="رضایی"
                  value={form.lastName}
                  onChange={(event) => setForm({ ...form, lastName: event.target.value })}
                  required
                  autoComplete="family-name"
                />
              </div>

              <Input
                label="شماره موبایل"
                type="tel"
                icon={<FiPhone aria-hidden="true" />}
                placeholder="09123456789"
                value={form.phoneNumber}
                onChange={(event) => setForm({ ...form, phoneNumber: event.target.value })}
                required
                dir="ltr"
                inputMode="tel"
                maxLength={11}
                autoComplete="tel"
              />

              <Input
                label="رمز عبور"
                type="password"
                icon={<FiLock aria-hidden="true" />}
                placeholder="حداقل ۶ کاراکتر"
                value={form.password}
                onChange={(event) => setForm({ ...form, password: event.target.value })}
                required
                dir="ltr"
                minLength={6}
                autoComplete="new-password"
              />

              <Input
                label="تکرار رمز عبور"
                type="password"
                icon={<FiLock aria-hidden="true" />}
                placeholder="رمز عبور را دوباره وارد کن"
                value={form.confirmPassword}
                onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })}
                required
                dir="ltr"
                minLength={6}
                autoComplete="new-password"
              />

              <button type="submit" className="auth-submit" disabled={loading}>
                {loading ? <span className="auth-spinner" aria-label="در حال ثبت‌نام" /> : <><FiCheckCircle aria-hidden="true" /> ساخت حساب کاربری</>}
              </button>
            </form>

            <p className="auth-switch">قبلاً ثبت‌نام کرده‌ای؟ <Link to={`/login${getSafeReturnTo(searchParams.get('returnTo')) ? `?returnTo=${encodeURIComponent(getSafeReturnTo(searchParams.get('returnTo'))!)}` : ''}`}>وارد شو</Link></p>
            <Link to="/" className="auth-back"><FiArrowRight aria-hidden="true" /> بازگشت به صفحه اصلی</Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
};

export default Register;
