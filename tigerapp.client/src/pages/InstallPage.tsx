import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { AxiosError } from 'axios';
import {
  FiArrowLeft, FiArrowRight, FiCheck, FiCheckCircle, FiDatabase, FiEye,
  FiEyeOff, FiFileText, FiLock, FiCopy, FiServer, FiShield, FiUserCheck,
} from 'react-icons/fi';
import apiClient from '@/api/apiClient';
import { useInstallation } from '@/installation/InstallationGate';

type FieldErrors = Record<string, string[]>;

interface InstallerForm {
  siteName: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const initialForm: InstallerForm = {
  siteName: 'تایگر آکادمی', firstName: '', lastName: '', phoneNumber: '', email: '', password: '', confirmPassword: '',
};

const envTemplate = `POSTGRES_DB=tigerapp
POSTGRES_USER=tigerapp
POSTGRES_PASSWORD=یک-رمز-قوی-و-تصادفی
TIGERAPP_JWT_SECRET=یک-کلید-تصادفی-حداقل-۳۲-کاراکتری

ConnectionStrings__DefaultConnection=Host=localhost;Port=5432;Database=\${POSTGRES_DB};Username=\${POSTGRES_USER};Password=\${POSTGRES_PASSWORD};Timeout=5
JwtSettings__Secret=\${TIGERAPP_JWT_SECRET}`;

const getApiMessage = (error: unknown, fallback: string) => {
  const axiosError = error as AxiosError<{ message?: string; errors?: FieldErrors }>;
  return axiosError.response?.data?.message || fallback;
};

const InstallPage: React.FC = () => {
  const { status, refresh } = useInstallation();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [databaseVerified, setDatabaseVerified] = useState(false);
  const [form, setForm] = useState<InstallerForm>(initialForm);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [envCopied, setEnvCopied] = useState(false);

  const headers = { 'X-Tiger-Installer': 'setup-wizard' };

  const copyEnvTemplate = async () => {
    await navigator.clipboard.writeText(envTemplate);
    setEnvCopied(true);
    window.setTimeout(() => setEnvCopied(false), 1800);
  };

  const updateField = (name: keyof InstallerForm, value: string) => {
    setForm((current) => ({ ...current, [name]: value }));
    setFieldErrors((current) => {
      if (!current[name]) return current;
      const next = { ...current };
      delete next[name];
      return next;
    });
  };

  const testDatabase = async () => {
    setLoading(true);
    setMessage('');
    try {
      await apiClient.post('/installation/test-database', {}, { headers });
      setDatabaseVerified(true);
      setStep(2);
    } catch (error) {
      setDatabaseVerified(false);
      setMessage(getApiMessage(error, 'اتصال PostgreSQL برقرار نشد. تنظیمات سرور را بررسی کنید.'));
    } finally {
      setLoading(false);
    }
  };

  const validateAdmin = () => {
    const errors: FieldErrors = {};
    if (!form.siteName.trim()) errors.siteName = ['نام سیستم را وارد کنید.'];
    if (!form.firstName.trim()) errors.firstName = ['نام مدیر را وارد کنید.'];
    if (!form.lastName.trim()) errors.lastName = ['نام خانوادگی مدیر را وارد کنید.'];
    if (!/^09[0-9]{9}$/.test(form.phoneNumber)) errors.phoneNumber = ['شماره موبایل ۱۱ رقمی معتبر وارد کنید.'];
    if (form.password.length < 12) errors.password = ['رمز عبور حداقل ۱۲ کاراکتر باشد.'];
    if (form.password !== form.confirmPassword) errors.confirmPassword = ['تکرار رمز عبور یکسان نیست.'];
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      setMessage('لطفاً خطاهای فرم را برطرف کنید.');
      return false;
    }
    setMessage('');
    return true;
  };

  const goToReview = (event: React.FormEvent) => {
    event.preventDefault();
    if (validateAdmin()) setStep(3);
  };

  const completeInstallation = async () => {
    if (!databaseVerified || !validateAdmin()) return;
    setLoading(true);
    setMessage('');
    try {
      await apiClient.post('/installation/complete', form, { headers });
      await refresh();
      navigate('/login', { replace: true });
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string; errors?: FieldErrors }>;
      if (axiosError.response?.data?.errors) setFieldErrors(axiosError.response.data.errors);
      setMessage(getApiMessage(error, 'نصب کامل نشد. مشکل اعلام‌شده را برطرف و دوباره تلاش کنید.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="install-page" dir="rtl">
      <div className="install-shell">
        <aside className="install-aside">
          <div className="install-brand"><span>T</span><div><strong>تایگر آکادمی</strong><small>راه‌اندازی امن سیستم</small></div></div>
          <div className="install-aside-copy">
            <span><FiShield aria-hidden="true" /> نصب محافظت‌شده</span>
            <h1>سه قدم تا شروع،<br />با قفل دائمی نصب.</h1>
            <p>رمز PostgreSQL هرگز وارد مرورگر نمی‌شود. ویزارد فقط اتصال از پیش تنظیم‌شده سرور را بررسی می‌کند.</p>
          </div>
          <ul className="install-security-list">
            <li><FiCheck aria-hidden="true" /> فعال فقط تا پایان نخستین نصب</li>
            <li><FiCheck aria-hidden="true" /> مایگریشن رسمی EF Core</li>
            <li><FiCheck aria-hidden="true" /> قفل دیتابیس و فایل پس از نصب</li>
          </ul>
        </aside>

        <section className="install-card" aria-labelledby="install-title">
          <header className="install-card-header">
            <div><small>مرحله {step} از ۳</small><h2 id="install-title">{step === 1 ? 'بررسی زیرساخت' : step === 2 ? 'ساخت مدیر سیستم' : 'تأیید و نصب نهایی'}</h2></div>
            <span className="install-secure-badge"><FiLock aria-hidden="true" /> اتصال امن</span>
          </header>

          <ol className="install-progress" aria-label="مراحل نصب">
            {[['پایگاه داده', FiDatabase], ['مدیر سیستم', FiUserCheck], ['راه‌اندازی', FiCheckCircle]].map(([label, Icon], index) => {
              const itemStep = index + 1;
              return <li key={label as string} className={itemStep <= step ? 'is-active' : ''} aria-current={itemStep === step ? 'step' : undefined}><span>{itemStep < step ? <FiCheck aria-hidden="true" /> : <Icon aria-hidden="true" />}</span><small>{label as string}</small></li>;
            })}
          </ol>

          {message && <div className="install-alert" role="alert">{message}</div>}

          {step === 1 && (
            <div className="install-step">
              <div className="install-db-status">
                <span><FiServer aria-hidden="true" /></span>
                <div><strong>PostgreSQL</strong><small>{status.databaseReachable ? 'سرور دیتابیس در دسترس است' : 'اتصال از تنظیمات امن سرور بررسی می‌شود'}</small></div>
                <i className={status.databaseReachable ? 'is-online' : ''}>{status.databaseReachable ? 'در دسترس' : 'بررسی نشده'}</i>
              </div>
              <details className="install-env-guide" open={!status.databaseReachable}>
                <summary><span><FiFileText aria-hidden="true" /><span><strong>راهنمای تنظیم اتصال در فایل .env</strong><small>قبل از ادامه، اطلاعات PostgreSQL را در سرور وارد کنید.</small></span></span><i aria-hidden="true" /></summary>
                <div className="install-env-content">
                  <ol>
                    <li>فایل <code dir="ltr">.env.example</code> کنار <code dir="ltr">docker-compose.yml</code> را با نام <code dir="ltr">.env</code> کپی کنید.</li>
                    <li>مقادیر نمونه زیر را با اطلاعات واقعی و رمزهای قوی جایگزین کنید.</li>
                    <li>پس از ذخیره فایل، سرویس را یک‌بار راه‌اندازی مجدد کنید و دکمه بررسی اتصال را بزنید.</li>
                  </ol>
                  <div className="install-env-code">
                    <div><span>نمونه فایل .env</span><button type="button" onClick={copyEnvTemplate}><FiCopy aria-hidden="true" /> {envCopied ? 'کپی شد' : 'کپی نمونه'}</button></div>
                    <pre dir="ltr"><code>{envTemplate}</code></pre>
                  </div>
                  <p><FiShield aria-hidden="true" /> فایل <code dir="ltr">.env</code> در Git ثبت نمی‌شود؛ آن را عمومی یا برای دیگران ارسال نکنید.</p>
                </div>
              </details>
              <button className="install-primary" type="button" onClick={testDatabase} disabled={loading}>{loading ? 'در حال بررسی…' : <>بررسی اتصال و ادامه <FiArrowLeft aria-hidden="true" /></>}</button>
            </div>
          )}

          {step === 2 && (
            <form className="install-step install-form" onSubmit={goToReview} noValidate>
              <Field label="نام سیستم" name="siteName" value={form.siteName} error={fieldErrors.siteName?.[0]} onChange={updateField} autoComplete="organization" />
              <div className="install-form-grid"><Field label="نام مدیر" name="firstName" value={form.firstName} error={fieldErrors.firstName?.[0]} onChange={updateField} autoComplete="given-name" /><Field label="نام خانوادگی" name="lastName" value={form.lastName} error={fieldErrors.lastName?.[0]} onChange={updateField} autoComplete="family-name" /></div>
              <div className="install-form-grid"><Field label="شماره موبایل" name="phoneNumber" value={form.phoneNumber} error={fieldErrors.phoneNumber?.[0]} onChange={updateField} type="tel" dir="ltr" autoComplete="tel" inputMode="tel" maxLength={11} /><Field label="ایمیل (اختیاری)" name="email" value={form.email} error={fieldErrors.email?.[0]} onChange={updateField} type="email" dir="ltr" autoComplete="email" /></div>
              <div className="install-form-grid"><PasswordField label="رمز عبور مدیر" name="password" value={form.password} error={fieldErrors.password?.[0]} onChange={updateField} visible={showPassword} toggle={() => setShowPassword((value) => !value)} autoComplete="new-password" /><PasswordField label="تکرار رمز عبور" name="confirmPassword" value={form.confirmPassword} error={fieldErrors.confirmPassword?.[0]} onChange={updateField} visible={showPassword} autoComplete="new-password" /></div>
              <small className="install-password-hint"><FiShield aria-hidden="true" /> حداقل ۱۲ کاراکتر؛ رمز را در یک مدیر رمز عبور ذخیره کنید.</small>
              <div className="install-actions"><button type="button" className="install-secondary" onClick={() => setStep(1)}><FiArrowRight aria-hidden="true" /> بازگشت</button><button type="submit" className="install-primary">بررسی نهایی <FiArrowLeft aria-hidden="true" /></button></div>
            </form>
          )}

          {step === 3 && (
            <div className="install-step">
              <div className="install-review">
                <div><small>سیستم</small><strong>{form.siteName}</strong></div>
                <div><small>مدیر اولیه</small><strong>{form.firstName} {form.lastName}</strong><span dir="ltr">{form.phoneNumber}</span></div>
                <div><small>دیتابیس</small><strong>PostgreSQL</strong><span>اتصال تأیید شد</span></div>
              </div>
              <div className="install-final-warning"><FiLock aria-hidden="true" /><p><strong>پس از این مرحله ویزارد دوباره باز نمی‌شود.</strong><span>مایگریشن اجرا، مدیر ساخته و قفل نصب در دیتابیس و دیسک ثبت می‌شود.</span></p></div>
              <div className="install-actions"><button type="button" className="install-secondary" onClick={() => setStep(2)} disabled={loading}><FiArrowRight aria-hidden="true" /> ویرایش اطلاعات</button><button type="button" className="install-primary" onClick={completeInstallation} disabled={loading}>{loading ? 'در حال اجرای مایگریشن…' : <>نصب و قفل سیستم <FiCheckCircle aria-hidden="true" /></>}</button></div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
};

interface FieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'name' | 'value' | 'onChange'> {
  label: string;
  name: keyof InstallerForm;
  value: string;
  error?: string;
  onChange: (name: keyof InstallerForm, value: string) => void;
}

const Field: React.FC<FieldProps> = ({ label, name, value, error, onChange, ...props }) => {
  const errorId = `${name}-error`;
  return <div className="install-field"><label htmlFor={name}>{label}</label><input id={name} name={name} value={value} onChange={(event) => onChange(name, event.target.value)} aria-invalid={!!error} aria-describedby={error ? errorId : undefined} {...props} />{error && <small id={errorId} className="install-field-error">{error}</small>}</div>;
};

const PasswordField: React.FC<FieldProps & { visible: boolean; toggle?: () => void }> = ({ label, name, value, error, onChange, visible, toggle, ...props }) => {
  const errorId = `${name}-error`;
  return <div className="install-field"><label htmlFor={name}>{label}</label><div className="install-password"><input id={name} name={name} type={visible ? 'text' : 'password'} value={value} onChange={(event) => onChange(name, event.target.value)} dir="ltr" aria-invalid={!!error} aria-describedby={error ? errorId : undefined} {...props} />{toggle && <button type="button" onClick={toggle} aria-label={visible ? 'مخفی کردن رمز' : 'نمایش رمز'}>{visible ? <FiEyeOff aria-hidden="true" /> : <FiEye aria-hidden="true" />}</button>}</div>{error && <small id={errorId} className="install-field-error">{error}</small>}</div>;
};

export default InstallPage;
