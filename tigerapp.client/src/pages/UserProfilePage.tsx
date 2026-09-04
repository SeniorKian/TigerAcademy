import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import apiClient from '@/api/apiClient';
import { useAuth } from '@/auth/AuthContext';
import { FiUser, FiPhone, FiMapPin, FiBookOpen, FiSave, FiLogOut, FiCheckCircle, FiShoppingBag, FiAward, FiCalendar } from 'react-icons/fi';
import { Container, Button, Input, Card, Avatar, Skeleton } from '@/design-system';
import PersianDatePicker from '@/components/PersianDatePicker';
import PublicLayout from './PublicLayout';

interface UserProfileData {
  id: number;
  phoneNumber: string;
  fullName: string;
  email?: string;
  province?: string;
  city?: string;
  quota?: string;
  fieldOfStudy?: string;
  birthDate?: string;
  birthDateShamsi?: string;
  telegramId?: string;
  isActive: boolean;
}
interface LookupItem { id: number; name: string; provinceId?: number; }
interface Lookups { provinces: LookupItem[]; cities: LookupItem[]; quotas: LookupItem[]; fields: LookupItem[]; }
interface UserOrder { id: number; trackingCode?: string; planName?: string; consultationName?: string; amountFormatted: string; statusName: string; createdAtShamsi?: string; preferredDateShamsi?: string; preferredTimeRange?: string; }
type ProfileFieldName = 'fullName' | 'email' | 'province' | 'city' | 'quota' | 'fieldOfStudy' | 'birthDate' | 'telegramId';
type ProfileFieldErrors = Partial<Record<ProfileFieldName, string>>;

const apiFieldMap: Record<string, ProfileFieldName> = {
  FullName: 'fullName', Email: 'email', Province: 'province', City: 'city',
  Quota: 'quota', FieldOfStudy: 'fieldOfStudy', BirthDate: 'birthDate',
  BirthDateShamsi: 'birthDate', TelegramId: 'telegramId',
};

const readApiErrors = (error: unknown) => {
  const fallback = 'ذخیره اطلاعات انجام نشد. ورودی‌ها را بررسی و دوباره تلاش کنید.';
  if (!axios.isAxiosError(error)) return { summary: fallback, fields: {} as ProfileFieldErrors };

  const payload = error.response?.data as {
    message?: string;
    errors?: string[] | Record<string, string[]>;
  } | undefined;
  const fields: ProfileFieldErrors = {};
  const messages: string[] = [];

  if (Array.isArray(payload?.errors)) {
    messages.push(...payload.errors.filter(Boolean));
  } else if (payload?.errors && typeof payload.errors === 'object') {
    Object.entries(payload.errors).forEach(([key, values]) => {
      const message = values?.[0];
      if (!message) return;
      messages.push(message);
      const field = apiFieldMap[key];
      if (field) fields[field] = message;
    });
  }

  return {
    summary: messages.length ? [...new Set(messages)].join('، ') : payload?.message || fallback,
    fields,
  };
};

const UserProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { logout, updateUserName } = useAuth();
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<ProfileFieldErrors>({});
  const [loadError, setLoadError] = useState('');
  const [lookups, setLookups] = useState<Lookups>({ provinces: [], cities: [], quotas: [], fields: [] });
  const [orders, setOrders] = useState<UserOrder[]>([]);
  const [form, setForm] = useState({
    fullName: '', email: '', province: '', city: '',
    quota: '', fieldOfStudy: '', birthDate: '', telegramId: '',
  });

  useEffect(() => {
    let active = true;
    Promise.allSettled([apiClient.get('/users/profile'), apiClient.get('/lookups'), apiClient.get('/orders')]).then(([profileResponse, lookupResponse, ordersResponse]) => {
      if (!active) return;
      if (profileResponse.status === 'rejected' || lookupResponse.status === 'rejected') {
        setLoadError('دریافت اطلاعات پروفایل کامل نشد. اتصال را بررسی و دوباره تلاش کنید.');
        return;
      }
      const data = profileResponse.value.data;
      setProfile(data);
      setForm({
        fullName: data.fullName || '', email: data.email || '',
        province: data.province || '', city: data.city || '',
        quota: data.quota || '', fieldOfStudy: data.fieldOfStudy || '',
        birthDate: data.birthDateShamsi || '',
        telegramId: data.telegramId || '',
      });
      setLookups(lookupResponse.value.data);
      if (ordersResponse.status === 'fulfilled') {
        setOrders(Array.isArray(ordersResponse.value.data) ? ordersResponse.value.data : []);
      }
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const handleSave = async (event?: React.FormEvent) => {
    event?.preventDefault();
    setSaving(true);
    setSaved(false);
    setSaveError('');
    setFieldErrors({});
    try {
      const response = await apiClient.put<UserProfileData>('/users/profile', {
        fullName: form.fullName,
        email: form.email,
        province: form.province,
        city: form.city,
        quota: form.quota,
        fieldOfStudy: form.fieldOfStudy,
        birthDateShamsi: form.birthDate || null,
        clearBirthDate: !form.birthDate,
        telegramId: form.telegramId,
      });
      const updatedProfile = response.data;
      setProfile(updatedProfile);
      setForm({
        fullName: updatedProfile.fullName || '', email: updatedProfile.email || '',
        province: updatedProfile.province || '', city: updatedProfile.city || '',
        quota: updatedProfile.quota || '', fieldOfStudy: updatedProfile.fieldOfStudy || '',
        birthDate: updatedProfile.birthDateShamsi || '', telegramId: updatedProfile.telegramId || '',
      });
      updateUserName(updatedProfile.fullName);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      const parsed = readApiErrors(error);
      setFieldErrors(parsed.fields);
      setSaveError(parsed.summary);
      window.requestAnimationFrame(() => document.getElementById('profile-error-summary')?.focus());
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => { await logout(); navigate('/'); };

  const updateField = (field: ProfileFieldName, value: string) => {
    setForm(current => ({ ...current, [field]: value }));
    setFieldErrors(current => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
    setSaveError('');
  };

  if (loading) {
    return (
      <PublicLayout>
        <div className="py-12" style={{ background: '#F8FAFC' }}>
          <Container size="md">
            <Skeleton className="h-20 w-20 rounded-full mx-auto mb-4" />
            <Skeleton className="h-6 w-32 mx-auto mb-8" />
            <Skeleton className="h-64 w-full rounded-2xl" />
          </Container>
        </div>
      </PublicLayout>
    );
  }

  if (loadError || !profile) {
    return (
      <PublicLayout>
        <div className="py-12" style={{ background: '#F8FAFC' }}>
          <Container size="md">
            <Card padding="lg" className="text-center">
              <div className="auth-error" role="alert">{loadError || 'اطلاعات پروفایل در دسترس نیست.'}</div>
              <Button type="button" variant="primary" onClick={() => window.location.reload()}>تلاش دوباره</Button>
            </Card>
          </Container>
        </div>
      </PublicLayout>
    );
  }

  const selectedProvince = lookups.provinces.find(x => x.name === form.province);
  const cityOptions = selectedProvince ? lookups.cities.filter(x => x.provinceId === selectedProvince.id) : [];

  return (
    <PublicLayout>
      <div className="py-10 sm:py-14" style={{ background: '#F8FAFC' }}>
        <Container size="md">
          {/* Header */}
          <div className="text-center mb-8">
            <Avatar initials={profile?.fullName?.split(' ').map(n => n[0]).join('') || '👤'} size="lg" color="primary" />
            <h1 className="text-xl font-extrabold mt-4 text-neutral-dark">پروفایل من</h1>
            <p className="text-sm text-neutral-muted-foreground mt-1">{profile?.phoneNumber}</p>
          </div>

          {/* Form Card */}
          <Card padding="lg" className="profile-form-card">
            <div className="profile-form-intro">
              <span><FiUser aria-hidden="true" /></span>
              <div><h2>اطلاعات فردی و تحصیلی</h2><p>این اطلاعات کمک می‌کند پیشنهادها و مشاوره‌های دقیق‌تری دریافت کنید.</p></div>
            </div>
            <form className="profile-form-fields" onSubmit={handleSave}>
            <Input
              id="profile-full-name"
              label="نام و نام خانوادگی"
              icon={<FiUser />}
              placeholder="مثال: علی رضایی"
              value={form.fullName}
              onChange={(e) => updateField('fullName', e.target.value)}
              required
              autoComplete="name"
              error={Boolean(fieldErrors.fullName)}
              helperText={fieldErrors.fullName}
              aria-invalid={Boolean(fieldErrors.fullName)}
              aria-describedby={fieldErrors.fullName ? 'profile-full-name-help' : undefined}
            />

            <Input
              id="profile-email"
              label="ایمیل (اختیاری)"
              type="email"
              icon={<FiPhone />}
              placeholder="example@email.com"
              value={form.email}
              onChange={(e) => updateField('email', e.target.value)}
              dir="ltr"
              autoComplete="email"
              error={Boolean(fieldErrors.email)}
              helperText={fieldErrors.email}
              aria-invalid={Boolean(fieldErrors.email)}
            />

            <div className="profile-location-grid">
              <div><label className="form-label" htmlFor="profile-province"><FiMapPin aria-hidden="true" /> استان</label><select id="profile-province" className="form-input" value={form.province} aria-invalid={Boolean(fieldErrors.province)} onChange={e => { updateField('province', e.target.value); updateField('city', ''); }}><option value="">انتخاب استان…</option>{lookups.provinces.map(x => <option key={x.id} value={x.name}>{x.name}</option>)}</select>{fieldErrors.province && <p className="profile-field-error" role="alert">{fieldErrors.province}</p>}</div>
              <div><label className="form-label" htmlFor="profile-city"><FiMapPin aria-hidden="true" /> شهر</label><select id="profile-city" className="form-input" value={form.city} disabled={!form.province} aria-invalid={Boolean(fieldErrors.city)} onChange={e => updateField('city', e.target.value)}><option value="">{form.province ? 'انتخاب شهر…' : 'ابتدا استان را انتخاب کنید'}</option>{cityOptions.map(x => <option key={x.id} value={x.name}>{x.name}</option>)}</select>{fieldErrors.city && <p className="profile-field-error" role="alert">{fieldErrors.city}</p>}</div>
            </div>

            {/* Field of Study */}
            <div>
              <label className="form-label" htmlFor="profile-field">
                <FiBookOpen aria-hidden="true" /> رشته تحصیلی
              </label>
              <select
                id="profile-field"
                value={form.fieldOfStudy}
                onChange={(e) => updateField('fieldOfStudy', e.target.value)}
                className="form-input cursor-pointer"
                aria-invalid={Boolean(fieldErrors.fieldOfStudy)}
              >
                <option value="">انتخاب رشته تحصیلی…</option>
                {lookups.fields.map((f) => <option key={f.id} value={f.name}>{f.name}</option>)}
              </select>
              {fieldErrors.fieldOfStudy && <p className="profile-field-error" role="alert">{fieldErrors.fieldOfStudy}</p>}
            </div>

            {/* Quota */}
            <div>
              <label className="form-label"><FiAward aria-hidden="true" /> سهمیه</label>
              <div className="profile-quota-grid" role="group" aria-label="انتخاب سهمیه">
                {lookups.quotas.map((q) => (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => updateField('quota', form.quota === q.name ? '' : q.name)}
                    aria-pressed={form.quota === q.name}
                    className={form.quota === q.name ? 'is-selected' : ''}
                  >
                    {q.name}
                  </button>
                ))}
              </div>
              {fieldErrors.quota && <p className="profile-field-error" role="alert">{fieldErrors.quota}</p>}
            </div>

            <PersianDatePicker
              value={form.birthDate}
              onChange={(birthDate) => updateField('birthDate', birthDate)}
              error={fieldErrors.birthDate}
            />

            <Input
              id="profile-telegram"
              label="آیدی تلگرام"
              icon={<FiPhone />}
              placeholder="@username"
              value={form.telegramId}
              onChange={(e) => updateField('telegramId', e.target.value)}
              dir="ltr"
              autoComplete="off"
              error={Boolean(fieldErrors.telegramId)}
              helperText={fieldErrors.telegramId}
              aria-invalid={Boolean(fieldErrors.telegramId)}
            />

            {/* Actions */}
            <div className="pt-4 space-y-3">
              {saveError && <div id="profile-error-summary" className="auth-error" role="alert" tabIndex={-1}>{saveError}</div>}
              <Button type="submit" variant="primary" fullWidth size="lg" loading={saving}>
                {saved ? <><FiCheckCircle /> ذخیره شد!</> : <><FiSave /> ذخیره اطلاعات</>}
              </Button>
              <Button variant="danger" fullWidth size="md" onClick={handleLogout}>
                <FiLogOut /> خروج از حساب
              </Button>
            </div>
            </form>
          </Card>

          <Card padding="lg" className="mt-6">
            <h2 className="font-bold text-lg flex items-center gap-2 mb-4"><FiShoppingBag /> سفارش‌های من</h2>
            {orders.length === 0 ? <p className="text-sm text-slate-500">هنوز سفارشی ثبت نکرده‌اید.</p> : <div className="space-y-3">{orders.map(order => <div key={order.id} className="p-4 bg-slate-50 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3"><div><strong>{order.planName || order.consultationName || 'سفارش'}</strong><p className="text-xs text-slate-500 mt-1" dir="ltr">{order.trackingCode}</p>{order.preferredDateShamsi && <p className="text-xs text-blue-700 mt-1"><FiCalendar className="inline ml-1" />{order.preferredDateShamsi}، {order.preferredTimeRange}</p>}{order.createdAtShamsi && <p className="text-xs text-slate-400 mt-1">{order.createdAtShamsi}</p>}</div><div className="sm:text-left"><span className="badge badge-info">{order.statusName}</span><p className="text-sm font-bold mt-2">{order.amountFormatted}</p></div></div>)}</div>}
          </Card>
        </Container>
      </div>
    </PublicLayout>
  );
};

export default UserProfilePage;
