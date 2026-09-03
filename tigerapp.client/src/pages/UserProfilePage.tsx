import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '@/api/apiClient';
import { useAuth } from '@/auth/AuthContext';
import { FiUser, FiPhone, FiMapPin, FiBookOpen, FiSave, FiLogOut, FiCheckCircle, FiShoppingBag, FiAward } from 'react-icons/fi';
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
interface UserOrder { id: number; trackingCode?: string; planName?: string; consultationName?: string; amountFormatted: string; statusName: string; createdAtShamsi?: string; }

const UserProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [lookups, setLookups] = useState<Lookups>({ provinces: [], cities: [], quotas: [], fields: [] });
  const [orders, setOrders] = useState<UserOrder[]>([]);
  const [form, setForm] = useState({
    fullName: '', email: '', province: '', city: '',
    quota: '', fieldOfStudy: '', birthDate: '', telegramId: '',
  });

  useEffect(() => {
    let active = true;
    Promise.all([apiClient.get('/users/profile'), apiClient.get('/lookups'), apiClient.get('/orders')]).then(([profileResponse, lookupResponse, ordersResponse]) => {
      if (!active) return;
      const data = profileResponse.data;
      setProfile(data);
      setForm({
        fullName: data.fullName || '', email: data.email || '',
        province: data.province || '', city: data.city || '',
        quota: data.quota || '', fieldOfStudy: data.fieldOfStudy || '',
        birthDate: data.birthDateShamsi || '',
        telegramId: data.telegramId || '',
      });
      setLookups(lookupResponse.data);
      setOrders(Array.isArray(ordersResponse.data) ? ordersResponse.data : []);
    }).catch(() => undefined).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const handleSave = async (event?: React.FormEvent) => {
    event?.preventDefault();
    setSaving(true);
    setSaved(false);
    setSaveError('');
    try {
      await apiClient.put('/users/profile', {
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
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Failed to save profile:', error);
      setSaveError('ذخیره اطلاعات انجام نشد؛ ورودی‌ها و تاریخ تولد را بررسی کنید.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => { await logout(); navigate('/'); };

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
              label="نام و نام خانوادگی"
              icon={<FiUser />}
              placeholder="مثال: علی رضایی"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            />

            <Input
              label="ایمیل (اختیاری)"
              type="email"
              icon={<FiPhone />}
              placeholder="example@email.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              dir="ltr"
            />

            <div className="profile-location-grid">
              <div><label className="form-label" htmlFor="profile-province"><FiMapPin aria-hidden="true" /> استان</label><select id="profile-province" className="form-input" value={form.province} onChange={e => setForm({ ...form, province: e.target.value, city: '' })}><option value="">انتخاب استان…</option>{lookups.provinces.map(x => <option key={x.id} value={x.name}>{x.name}</option>)}</select></div>
              <div><label className="form-label" htmlFor="profile-city"><FiMapPin aria-hidden="true" /> شهر</label><select id="profile-city" className="form-input" value={form.city} disabled={!form.province} onChange={e => setForm({ ...form, city: e.target.value })}><option value="">{form.province ? 'انتخاب شهر…' : 'ابتدا استان را انتخاب کنید'}</option>{cityOptions.map(x => <option key={x.id} value={x.name}>{x.name}</option>)}</select></div>
            </div>

            {/* Field of Study */}
            <div>
              <label className="form-label" htmlFor="profile-field">
                <FiBookOpen aria-hidden="true" /> رشته تحصیلی
              </label>
              <select
                id="profile-field"
                value={form.fieldOfStudy}
                onChange={(e) => setForm({ ...form, fieldOfStudy: e.target.value })}
                className="form-input cursor-pointer"
              >
                <option value="">انتخاب رشته تحصیلی…</option>
                {lookups.fields.map((f) => <option key={f.id} value={f.name}>{f.name}</option>)}
              </select>
            </div>

            {/* Quota */}
            <div>
              <label className="form-label"><FiAward aria-hidden="true" /> سهمیه</label>
              <div className="profile-quota-grid" role="group" aria-label="انتخاب سهمیه">
                {lookups.quotas.map((q) => (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => setForm({ ...form, quota: form.quota === q.name ? '' : q.name })}
                    aria-pressed={form.quota === q.name}
                    className={form.quota === q.name ? 'is-selected' : ''}
                  >
                    {q.name}
                  </button>
                ))}
              </div>
            </div>

            <PersianDatePicker
              value={form.birthDate}
              onChange={(birthDate) => setForm({ ...form, birthDate })}
            />

            <Input
              label="آیدی تلگرام"
              icon={<FiPhone />}
              placeholder="@username"
              value={form.telegramId}
              onChange={(e) => setForm({ ...form, telegramId: e.target.value })}
              dir="ltr"
            />

            {/* Actions */}
            <div className="pt-4 space-y-3">
              {saveError && <div className="auth-error" role="alert">{saveError}</div>}
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
            {orders.length === 0 ? <p className="text-sm text-slate-500">هنوز سفارشی ثبت نکرده‌اید.</p> : <div className="space-y-3">{orders.map(order => <div key={order.id} className="p-4 bg-slate-50 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3"><div><strong>{order.planName || order.consultationName || 'سفارش'}</strong><p className="text-xs text-slate-500 mt-1" dir="ltr">{order.trackingCode}</p>{order.createdAtShamsi && <p className="text-xs text-slate-400 mt-1">{order.createdAtShamsi}</p>}</div><div className="sm:text-left"><span className="badge badge-info">{order.statusName}</span><p className="text-sm font-bold mt-2">{order.amountFormatted}</p></div></div>)}</div>}
          </Card>
        </Container>
      </div>
    </PublicLayout>
  );
};

export default UserProfilePage;
