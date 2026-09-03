import React, { useCallback, useEffect, useState } from 'react';
import apiClient from '@/api/apiClient';
import { FiUsers, FiSearch, FiShield, FiEdit2, FiChevronLeft, FiChevronRight, FiRefreshCw } from 'react-icons/fi';
import { Button, Card, EmptyState, Input, Modal, Skeleton } from '@/design-system';
import { useAuth } from '@/auth/AuthContext';
import { apiErrorMessage, confirmAction, showSuccess } from '@/design-system/feedback';
import PersianDatePicker from '@/components/PersianDatePicker';

interface UserItem {
  id: number;
  phoneNumber: string;
  fullName: string;
  email: string;
  province: string | null;
  city: string | null;
  quota: string | null;
  fieldOfStudy: string | null;
  birthDateShamsi: string | null;
  telegramId: string | null;
  isActive: boolean;
  createdAt: string;
  createdAtShamsi: string | null;
  role: string;
  roleName: string;
}
interface RoleOption { value: number; key: string; name: string; description: string; }
interface LookupItem { id: number; name: string; provinceId?: number; }
interface Lookups { provinces: LookupItem[]; cities: LookupItem[]; quotas: LookupItem[]; fields: LookupItem[]; }
interface UsersResult { items: UserItem[]; page: number; pageSize: number; totalCount: number; totalPages: number; }
const emptyResult: UsersResult = { items: [], page: 1, pageSize: 20, totalCount: 0, totalPages: 0 };
const emptyEditForm = { fullName: '', email: '', province: '', city: '', quota: '', fieldOfStudy: '', birthDate: '', telegramId: '' };

const UsersPage: React.FC = () => {
  const [result, setResult] = useState<UsersResult>(emptyResult);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [province, setProvince] = useState('');
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [lookups, setLookups] = useState<Lookups>({ provinces: [], cities: [], quotas: [], fields: [] });
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<UserItem | null>(null);
  const [editForm, setEditForm] = useState(emptyEditForm);
  const [editError, setEditError] = useState('');
  const [saving, setSaving] = useState(false);
  const { isAdmin } = useAuth();

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const response = await apiClient.get<UsersResult>('/users', {
        params: { page, pageSize: 20, search: search || undefined, role: role || undefined, isActive: status || undefined, province: province || undefined },
      });
      setResult(response.data);
    } catch (err) { setError(apiErrorMessage(err, 'دریافت کاربران ناموفق بود.')); }
    finally { setLoading(false); }
  }, [page, search, role, status, province]);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    let active = true;
    apiClient.get<Lookups>('/lookups').then(response => { if (active) setLookups(response.data); }).catch(() => undefined);
    if (isAdmin) apiClient.get<RoleOption[]>('/users/roles').then(response => { if (active) setRoles(response.data); }).catch(() => undefined);
    return () => { active = false; };
  }, [isAdmin]);

  const submitSearch = (event: React.FormEvent) => { event.preventDefault(); setPage(1); setSearch(searchInput.trim()); };

  const toggleStatus = async (user: UserItem) => {
    const confirmed = await confirmAction({ title: user.isActive ? 'غیرفعال‌کردن حساب' : 'فعال‌کردن حساب', text: `وضعیت حساب «${user.fullName}» تغییر کند؟`, danger: user.isActive, confirmText: user.isActive ? 'بله، غیرفعال شود' : 'بله، فعال شود', onConfirm: () => apiClient.put(`/users/${user.id}/status`, { isActive: !user.isActive }) });
    if (confirmed) {
      setResult(current => ({ ...current, items: current.items.map(item => item.id === user.id ? { ...item, isActive: !item.isActive } : item) }));
      showSuccess('وضعیت حساب به‌روزرسانی شد');
    }
  };

  const updateRole = async (user: UserItem, roleOption: RoleOption) => {
    if (user.role === roleOption.key) return;
    const confirmed = await confirmAction({ title: 'تغییر سطح دسترسی', text: `نقش «${user.fullName}» از «${user.roleName}» به «${roleOption.name}» تغییر کند؟\n${roleOption.description}`, confirmText: 'تأیید تغییر نقش', onConfirm: () => apiClient.put(`/users/${user.id}/role`, { role: roleOption.value }) });
    if (confirmed) {
      setResult(current => ({ ...current, items: current.items.map(item => item.id === user.id ? { ...item, role: roleOption.key, roleName: roleOption.name } : item) }));
      showSuccess('نقش کاربر به‌روزرسانی شد');
    }
  };

  const openEdit = (user: UserItem) => {
    setEditing(user);
    setEditForm({ fullName: user.fullName || '', email: user.email || '', province: user.province || '', city: user.city || '', quota: user.quota || '', fieldOfStudy: user.fieldOfStudy || '', birthDate: user.birthDateShamsi || '', telegramId: user.telegramId || '' });
    setEditError('');
  };
  const closeEdit = () => { if (saving) return; setEditing(null); setEditForm(emptyEditForm); setEditError(''); };
  const saveEdit = async () => {
    if (!editing) return;
    if (!editForm.fullName.trim()) { setEditError('نام و نام‌خانوادگی الزامی است.'); return; }
    setSaving(true); setEditError('');
    try {
      const response = await apiClient.put<UserItem>(`/users/${editing.id}`, {
        fullName: editForm.fullName.trim(),
        email: editForm.email,
        province: editForm.province,
        city: editForm.city,
        quota: editForm.quota,
        fieldOfStudy: editForm.fieldOfStudy,
        birthDateShamsi: editForm.birthDate || null,
        clearBirthDate: !editForm.birthDate,
        telegramId: editForm.telegramId,
      });
      setResult(current => ({ ...current, items: current.items.map(item => item.id === editing.id ? { ...item, ...response.data } : item) }));
      showSuccess('اطلاعات کاربر به‌روزرسانی شد');
      closeEdit();
    } catch (err) { setEditError(apiErrorMessage(err, 'ذخیره اطلاعات کاربر انجام نشد.')); }
    finally { setSaving(false); }
  };

  const selectedProvince = lookups.provinces.find(x => x.name === editForm.province);
  const cityOptions = selectedProvince ? lookups.cities.filter(x => x.provinceId === selectedProvince.id) : [];

  return (
    <div className="space-y-6 fade-in">
      <div className="admin-page-header">
        <div>
          <span className="admin-page-eyebrow"><FiUsers /> مدیریت کاربران</span>
          <h1>کاربران سایت</h1>
          <p>{result.totalCount.toLocaleString('fa-IR')} کاربر ثبت‌نام شده</p>
        </div>
        <Button variant="secondary" onClick={load} leftIcon={<FiRefreshCw />}>به‌روزرسانی</Button>
      </div>

      {isAdmin && roles.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          {roles.map(roleOption => (
            <div key={roleOption.key} className="card p-4">
              <div className="flex items-center gap-2 font-bold"><FiShield className="text-amber-500" /> {roleOption.name}</div>
              <p className="text-xs text-slate-500 mt-2 leading-6">{roleOption.description}</p>
            </div>
          ))}
        </div>
      )}

      <Card padding="md">
        <form className="admin-filter-bar" onSubmit={submitSearch}>
          <Input aria-label="جستجوی کاربر" placeholder="نام، شماره موبایل یا ایمیل" value={searchInput} onChange={event => setSearchInput(event.target.value)} icon={<FiSearch />} />
          <select className="form-input" aria-label="فیلتر نقش" value={role} onChange={event => { setPage(1); setRole(event.target.value); }}>
            <option value="">همه نقش‌ها</option>
            {roles.map(roleOption => <option key={roleOption.key} value={roleOption.key}>{roleOption.name}</option>)}
          </select>
          <select className="form-input" aria-label="فیلتر وضعیت" value={status} onChange={event => { setPage(1); setStatus(event.target.value); }}>
            <option value="">همه وضعیت‌ها</option>
            <option value="true">فعال</option>
            <option value="false">غیرفعال</option>
          </select>
          <select className="form-input" aria-label="فیلتر استان" value={province} onChange={event => { setPage(1); setProvince(event.target.value); }}>
            <option value="">همه استان‌ها</option>
            {lookups.provinces.map(item => <option key={item.id} value={item.name}>{item.name}</option>)}
          </select>
          <Button type="submit">جستجو</Button>
        </form>
      </Card>

      {error && <div className="auth-error" role="alert">{error}</div>}

      {loading ? <Skeleton className="h-64 rounded-xl" /> : result.items.length === 0 ? (
        <EmptyState icon={<FiUsers size={42} />} title="کاربری پیدا نشد" description="فیلترها را تغییر دهید یا عبارت جستجوی دیگری را امتحان کنید." />
      ) : <>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>نام کامل</th>
                <th>شماره موبایل</th>
                <th>ایمیل</th>
                <th>استان</th>
                <th>رشته</th>
                <th>تاریخ تولد</th>
                <th>وضعیت</th>
                <th>نقش و دسترسی</th>
                <th>تاریخ عضویت</th>
                <th>عملیات</th>
              </tr>
            </thead>
            <tbody>
              {result.items.map(user => (
                <tr key={user.id}>
                  <td className="font-medium">{user.fullName}</td>
                  <td className="font-mono text-xs" dir="ltr">{user.phoneNumber}</td>
                  <td className="text-sm text-slate-500">{user.email || '—'}</td>
                  <td className="text-sm">{user.province || '—'}</td>
                  <td className="text-sm">{user.fieldOfStudy || '—'}</td>
                  <td className="text-sm text-slate-500">{user.birthDateShamsi || '—'}</td>
                  <td>
                    <span className={`badge ${user.isActive ? 'badge-success' : 'badge-danger'}`}>
                      {user.isActive ? 'فعال' : 'غیرفعال'}
                    </span>
                  </td>
                  <td>{isAdmin ? <select className="form-input min-w-36" value={user.role} onChange={event => { const roleOption = roles.find(item => item.key === event.target.value); if (roleOption) void updateRole(user, roleOption); }}>{roles.map(roleOption => <option key={roleOption.key} value={roleOption.key}>{roleOption.name}</option>)}</select> : <span className="badge badge-info">{user.roleName}</span>}</td>
                  <td className="text-sm text-slate-500" dir="rtl">{user.createdAtShamsi || '—'}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <button type="button" className="admin-icon-button" onClick={() => openEdit(user)} aria-label={`ویرایش ${user.fullName}`} title="ویرایش"><FiEdit2 /></button>
                      {isAdmin && <button type="button" className={`btn text-xs ${user.isActive ? 'btn-danger' : 'btn-success'}`} onClick={() => toggleStatus(user)}>{user.isActive ? 'غیرفعال‌کردن' : 'فعال‌کردن'}</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="admin-pagination">
          <span>نمایش {result.items.length.toLocaleString('fa-IR')} از {result.totalCount.toLocaleString('fa-IR')} کاربر</span>
          <div>
            <button type="button" disabled={page <= 1} onClick={() => setPage(value => value - 1)} aria-label="صفحه قبل"><FiChevronRight /></button>
            <strong>صفحه {page.toLocaleString('fa-IR')} از {Math.max(1, result.totalPages).toLocaleString('fa-IR')}</strong>
            <button type="button" disabled={page >= result.totalPages} onClick={() => setPage(value => value + 1)} aria-label="صفحه بعد"><FiChevronLeft /></button>
          </div>
        </div>
      </>}

      <Modal open={Boolean(editing)} onClose={closeEdit} title="ویرایش اطلاعات کاربر" size="lg">
        {editing && <div className="space-y-4">
          {editError && <div className="auth-error" role="alert">{editError}</div>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="نام و نام‌خانوادگی" value={editForm.fullName} onChange={e => setEditForm({ ...editForm, fullName: e.target.value })} />
            <Input label="شماره موبایل" value={editing.phoneNumber} disabled dir="ltr" helperText="شماره موبایل قابل ویرایش نیست" />
          </div>
          <Input label="ایمیل" type="email" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} dir="ltr" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="form-label">استان</label>
              <select className="form-input" value={editForm.province} onChange={e => setEditForm({ ...editForm, province: e.target.value, city: '' })}>
                <option value="">انتخاب استان…</option>
                {lookups.provinces.map(x => <option key={x.id} value={x.name}>{x.name}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">شهر</label>
              <select className="form-input" value={editForm.city} disabled={!editForm.province} onChange={e => setEditForm({ ...editForm, city: e.target.value })}>
                <option value="">{editForm.province ? 'انتخاب شهر…' : 'ابتدا استان را انتخاب کنید'}</option>
                {cityOptions.map(x => <option key={x.id} value={x.name}>{x.name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="form-label">رشته تحصیلی</label>
              <select className="form-input" value={editForm.fieldOfStudy} onChange={e => setEditForm({ ...editForm, fieldOfStudy: e.target.value })}>
                <option value="">انتخاب رشته تحصیلی…</option>
                {lookups.fields.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">سهمیه</label>
              <select className="form-input" value={editForm.quota} onChange={e => setEditForm({ ...editForm, quota: e.target.value })}>
                <option value="">بدون سهمیه</option>
                {lookups.quotas.map(q => <option key={q.id} value={q.name}>{q.name}</option>)}
              </select>
            </div>
          </div>
          <PersianDatePicker value={editForm.birthDate} onChange={birthDate => setEditForm({ ...editForm, birthDate })} />
          <Input label="آیدی تلگرام" value={editForm.telegramId} onChange={e => setEditForm({ ...editForm, telegramId: e.target.value })} dir="ltr" placeholder="@username" />
        </div>}
        <div className="flex gap-3 mt-6">
          <Button fullWidth loading={saving} onClick={saveEdit}>ذخیره</Button>
          <Button variant="secondary" fullWidth onClick={closeEdit}>انصراف</Button>
        </div>
      </Modal>
    </div>
  );
};

export default UsersPage;
