import React, { useCallback, useEffect, useState } from 'react';
import apiClient from '@/api/apiClient';
import { FiPlus, FiEdit2, FiPhone, FiTrash2, FiSearch, FiChevronLeft, FiChevronRight, FiRefreshCw } from 'react-icons/fi';
import { Button, Card, Input, Modal, Skeleton, EmptyState } from '@/design-system';
import { apiErrorMessage, confirmAction, showSuccess } from '@/design-system/feedback';

interface Consultation { id: number; name: string; type: number; typeName: string; city: string | null; durationMinutes: number | null; price: number; description: string; order: number; isActive: boolean; }
interface ConsultationsResult { items: Consultation[]; page: number; pageSize: number; totalCount: number; totalPages: number; }
const emptyResult: ConsultationsResult = { items: [], page: 1, pageSize: 20, totalCount: 0, totalPages: 0 };
const emptyForm = { name: '', description: '', type: 0, price: 0, durationMinutes: 30, city: '', order: 0, isActive: true };

const ConsultationsPage: React.FC = () => {
  const [result, setResult] = useState<ConsultationsResult>(emptyResult);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Consultation | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const response = await apiClient.get<ConsultationsResult>('/consultations/admin/all', {
        params: { page, pageSize: 20, search: search || undefined, type: typeFilter || undefined, isActive: statusFilter || undefined },
      });
      setResult(response.data);
    } catch (err) { setError(apiErrorMessage(err, 'دریافت مشاوره‌ها ناموفق بود.')); }
    finally { setLoading(false); }
  }, [page, search, typeFilter, statusFilter]);

  useEffect(() => { void load(); }, [load]);
  const submitSearch = (event: React.FormEvent) => { event.preventDefault(); setPage(1); setSearch(searchInput.trim()); };

  const close = () => { setShowModal(false); setEditing(null); setForm(emptyForm); setError(''); };
  const openEdit = (item: Consultation) => { setEditing(item); setForm({ name: item.name, description: item.description || '', type: item.type, price: item.price, durationMinutes: item.durationMinutes || 30, city: item.city || '', order: item.order, isActive: item.isActive }); setShowModal(true); };
  const save = async () => {
    if (!form.name.trim() || form.price < 0 || form.durationMinutes <= 0) { setError('عنوان، قیمت و مدت معتبر الزامی است.'); return; }
    const payload = { ...form, city: form.type === 1 ? form.city : null };
    setSaving(true); setError('');
    try { if (editing) await apiClient.put(`/consultations/${editing.id}`, { id: editing.id, ...payload }); else await apiClient.post('/consultations', payload); close(); await load(); }
    catch { setError('ذخیره مشاوره انجام نشد.'); } finally { setSaving(false); }
  };
  const remove = async (id: number) => { const confirmed = await confirmAction({ title: 'غیرفعال‌کردن مشاوره', text: `«${result.items.find(item => item.id === id)?.name || 'این مشاوره'}» دیگر برای رزرو نمایش داده نمی‌شود. اطلاعات قبلی محفوظ است و می‌توانید دوباره آن را فعال کنید.`, onConfirm: () => apiClient.delete(`/consultations/${id}`) }); if (confirmed) { showSuccess('مشاوره غیرفعال شد'); await load(); } };

  return <div className="space-y-6 fade-in">
    <div className="admin-page-header">
      <div><span className="admin-page-eyebrow"><FiPhone /> مدیریت مشاوره‌ها</span><h1>مشاوره‌ها</h1><p>{result.totalCount.toLocaleString('fa-IR')} مورد ثبت‌شده</p></div>
      <div className="flex gap-2"><Button variant="secondary" onClick={load} leftIcon={<FiRefreshCw />}>به‌روزرسانی</Button><Button onClick={() => setShowModal(true)} leftIcon={<FiPlus />}>مشاوره جدید</Button></div>
    </div>

    <Card padding="md">
      <form className="admin-filter-bar" onSubmit={submitSearch}>
        <Input aria-label="جستجوی مشاوره" placeholder="عنوان یا شهر" value={searchInput} onChange={event => setSearchInput(event.target.value)} icon={<FiSearch />} />
        <select className="form-input" aria-label="فیلتر نوع" value={typeFilter} onChange={event => { setPage(1); setTypeFilter(event.target.value); }}>
          <option value="">همه انواع</option>
          <option value="0">تلفنی</option>
          <option value="1">حضوری</option>
          <option value="2">آنلاین</option>
        </select>
        <select className="form-input" aria-label="فیلتر وضعیت" value={statusFilter} onChange={event => { setPage(1); setStatusFilter(event.target.value); }}>
          <option value="">همه وضعیت‌ها</option>
          <option value="true">فعال</option>
          <option value="false">غیرفعال</option>
        </select>
        <Button type="submit">جستجو</Button>
      </form>
    </Card>

    {error && !showModal && <div className="auth-error">{error}</div>}
    {loading ? <Skeleton className="h-64 rounded-xl" /> : result.items.length === 0 ? <EmptyState icon={<FiPhone size={42} />} title="مشاوره‌ای پیدا نشد" description="فیلترها را تغییر دهید یا اولین خدمت مشاوره را اضافه کنید." /> : <>
      <div className="table-container"><table><thead><tr><th>عنوان</th><th>نوع</th><th>قیمت</th><th>مدت</th><th>مکان</th><th>ترتیب</th><th>وضعیت</th><th>عملیات</th></tr></thead><tbody>{result.items.map(item => <tr key={item.id}>
        <td className="font-medium">{item.name}</td><td><span className="badge badge-info">{item.typeName}</span></td><td>{item.price.toLocaleString('fa-IR')} تومان</td><td>{item.durationMinutes?.toLocaleString('fa-IR') || '—'} دقیقه</td><td>{item.city || '—'}</td><td>{item.order.toLocaleString('fa-IR')}</td><td><span className={`badge ${item.isActive ? 'badge-success' : 'badge-danger'}`}>{item.isActive ? 'فعال' : 'غیرفعال'}</span></td><td><div className="flex gap-2"><button className="admin-icon-button" onClick={() => openEdit(item)} aria-label="ویرایش"><FiEdit2 /></button><button className="admin-icon-button" onClick={() => remove(item.id)} aria-label="غیرفعال‌کردن"><FiTrash2 /></button></div></td>
      </tr>)}</tbody></table></div>
      <div className="admin-pagination">
        <span>نمایش {result.items.length.toLocaleString('fa-IR')} از {result.totalCount.toLocaleString('fa-IR')} مورد</span>
        <div>
          <button type="button" disabled={page <= 1} onClick={() => setPage(value => value - 1)} aria-label="صفحه قبل"><FiChevronRight /></button>
          <strong>صفحه {page.toLocaleString('fa-IR')} از {Math.max(1, result.totalPages).toLocaleString('fa-IR')}</strong>
          <button type="button" disabled={page >= result.totalPages} onClick={() => setPage(value => value + 1)} aria-label="صفحه بعد"><FiChevronLeft /></button>
        </div>
      </div>
    </>}
    <Modal open={showModal} onClose={close} title={editing ? 'ویرایش مشاوره' : 'مشاوره جدید'} size="md"><div className="space-y-4">{error && showModal && <div className="auth-error">{error}</div>}
      <Input label="عنوان" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
      <div><label className="form-label">توضیحات</label><textarea className="form-input min-h-[80px]" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3"><div><label className="form-label">نوع</label><select className="form-input" value={form.type} onChange={e => setForm({ ...form, type: Number(e.target.value) })}><option value={0}>تلفنی</option><option value={1}>حضوری</option><option value={2}>آنلاین</option></select></div><Input label="قیمت (تومان)" type="number" value={form.price} onChange={e => setForm({ ...form, price: Number(e.target.value) })} /></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3"><Input label="مدت (دقیقه)" type="number" value={form.durationMinutes} onChange={e => setForm({ ...form, durationMinutes: Number(e.target.value) })} /><Input label="ترتیب" type="number" value={form.order} onChange={e => setForm({ ...form, order: Number(e.target.value) })} /></div>
      {form.type === 1 && <Input label="شهر / مکان" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} />}
      <label className="flex gap-2 items-center"><input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} /> فعال باشد</label>
    </div><div className="flex gap-3 mt-6"><Button fullWidth loading={saving} onClick={save}>ذخیره</Button><Button variant="secondary" fullWidth onClick={close}>انصراف</Button></div></Modal>
  </div>;
};
export default ConsultationsPage;
