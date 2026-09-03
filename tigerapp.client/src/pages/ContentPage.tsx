import React, { useCallback, useEffect, useState } from 'react';
import apiClient from '@/api/apiClient';
import { FiCheck, FiCode, FiEdit2, FiFileText, FiImage, FiPlus, FiTrash2, FiUpload, FiVideo, FiX, FiSearch, FiRefreshCw } from 'react-icons/fi';
import { Button, Card, EmptyState, Input, Pagination, Skeleton } from '@/design-system';
import HtmlEditor from '@/components/HtmlEditor';
import { apiErrorMessage, confirmAction, showSuccess } from '@/design-system/feedback';

interface ContentItem { id: number; key: string; value: string; type: number; typeName: string; page: string; section?: string; order: number; language?: string; isActive: boolean; }
interface ContentResult { items: ContentItem[]; page: number; pageSize: number; totalCount: number; totalPages: number; }
const emptyResult: ContentResult = { items: [], page: 1, pageSize: 12, totalCount: 0, totalPages: 0 };
const pages = ['home', 'about', 'services'];
const pageLabels: Record<string, string> = { home: 'صفحه اصلی', about: 'درباره ما', services: 'خدمات' };
const typeLabels = ['متن', 'تصویر', 'ویدیو', 'HTML', 'بنر', 'اسلایدر'];
const emptyForm = { key: '', value: '', type: 0, page: 'home', section: 'dynamic', order: 0, language: 'fa', isActive: true };

const ContentPage: React.FC = () => {
  const [result, setResult] = useState<ContentResult>(emptyResult);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [pageFilter, setPageFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<ContentItem | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const response = await apiClient.get<ContentResult>('/content/admin/all', {
        params: { pageNumber: page, pageSize: 12, search: search || undefined, page: pageFilter || undefined, type: typeFilter || undefined, isActive: statusFilter || undefined },
      });
      setResult(response.data);
    } catch (err) { setError(apiErrorMessage(err, 'دریافت محتوا ناموفق بود.')); }
    finally { setLoading(false); }
  }, [page, search, pageFilter, typeFilter, statusFilter]);

  useEffect(() => { void load(); }, [load]);
  const submitSearch = (event: React.FormEvent) => { event.preventDefault(); setPage(1); setSearch(searchInput.trim()); };

  const close = () => { setShowModal(false); setEditing(null); setForm(emptyForm); setError(''); };
  const edit = (item: ContentItem) => { setEditing(item); setForm({ key: item.key, value: item.value, type: item.type, page: item.page, section: item.section || '', order: item.order, language: item.language || 'fa', isActive: item.isActive }); setShowModal(true); };
  const save = async () => { if (!form.key.trim() || !form.value.trim() || !form.page.trim()) { setError('کلید، صفحه و مقدار محتوا الزامی است.'); return; } try { if (editing) await apiClient.put(`/content/${editing.id}`, form); else await apiClient.post('/content', form); close(); await load(); } catch { setError('ذخیره محتوا انجام نشد.'); } };
  const remove = async (id: number) => { const confirmed = await confirmAction({ title: 'غیرفعال‌کردن محتوا', text: `محتوای «${result.items.find(item => item.id === id)?.key || id}» از سایت پنهان می‌شود؛ اطلاعات حذف نمی‌شوند و قابل فعال‌سازی مجدد هستند.`, onConfirm: () => apiClient.delete(`/content/${id}`) }); if (confirmed) { showSuccess('محتوا غیرفعال شد'); await load(); } };
  const upload = async (file?: File) => { if (!file) return; const data = new FormData(); data.append('file', file); setUploading(true); setError(''); try { const response = await apiClient.post<{ url: string }>('/content/upload', data, { headers: { 'Content-Type': 'multipart/form-data' } }); const nextValue = form.type === 5 && form.value ? `${form.value}\n${response.data.url}` : response.data.url; setForm({ ...form, value: nextValue }); } catch { setError('آپلود ناموفق بود؛ فرمت یا حجم فایل را بررسی کنید.'); } finally { setUploading(false); } };
  const mediaType = [1, 2, 4, 5].includes(form.type);

  return <div className="space-y-6 fade-in">
    <div className="admin-page-header">
      <div><span className="admin-page-eyebrow"><FiFileText /> محتوای واقعی سایت</span><h1>مدیریت محتوا</h1><p>{result.totalCount.toLocaleString('fa-IR')} آیتم ثبت‌شده</p></div>
      <div className="flex gap-2"><Button variant="secondary" onClick={load} leftIcon={<FiRefreshCw />}>به‌روزرسانی</Button><Button onClick={() => setShowModal(true)} leftIcon={<FiPlus />}>محتوای جدید</Button></div>
    </div>

    <Card padding="md">
      <form className="admin-filter-bar" onSubmit={submitSearch}>
        <Input aria-label="جستجوی محتوا" placeholder="کلید یا مقدار محتوا" value={searchInput} onChange={event => setSearchInput(event.target.value)} icon={<FiSearch />} />
        <select className="form-input" aria-label="فیلتر صفحه" value={pageFilter} onChange={event => { setPage(1); setPageFilter(event.target.value); }}>
          <option value="">همه صفحات</option>
          {pages.map(p => <option key={p} value={p}>{pageLabels[p]}</option>)}
        </select>
        <select className="form-input" aria-label="فیلتر نوع" value={typeFilter} onChange={event => { setPage(1); setTypeFilter(event.target.value); }}>
          <option value="">همه انواع</option>
          {typeLabels.map((label, index) => <option key={label} value={index}>{label}</option>)}
        </select>
        <select className="form-input" aria-label="فیلتر وضعیت" value={statusFilter} onChange={event => { setPage(1); setStatusFilter(event.target.value); }}>
          <option value="">همه وضعیت‌ها</option>
          <option value="true">فعال</option>
          <option value="false">غیرفعال</option>
        </select>
        <Button type="submit">جستجو</Button>
      </form>
    </Card>

    {error && !showModal && <div className="auth-error mb-4">{error}</div>}
    {loading ? <Skeleton className="h-64 rounded-xl" /> : result.items.length === 0 ? <EmptyState icon={<FiFileText size={42} />} title="محتوایی پیدا نشد" description="فیلترها را تغییر دهید یا متن، تصویر یا ویدیو اضافه کنید." /> : <>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">{result.items.map(item => { const Icon = item.type === 1 || item.type >= 4 ? FiImage : item.type === 2 ? FiVideo : FiCode; return <article key={item.id} className="card"><div className="flex justify-between mb-4"><span className="admin-content-icon"><Icon /></span><div className="flex gap-2"><span className="badge badge-info">{pageLabels[item.page] || item.page}</span><span className={`badge ${item.isActive ? 'badge-success' : 'badge-danger'}`}>{item.isActive ? 'فعال' : 'غیرفعال'}</span></div></div>
        {(item.type === 1 || item.type === 4) && <img src={item.value} alt="پیش‌نمایش" className="w-full h-36 object-cover rounded-xl mb-3" />}{item.type === 2 && <video src={item.value} controls preload="metadata" className="w-full h-36 rounded-xl mb-3" />}
        <p className="font-mono text-xs text-slate-400" dir="ltr">{item.key}</p><h2 className="font-bold mt-2">{item.typeName}</h2><p className="text-sm text-slate-500 mt-2 line-clamp-3 break-all">{item.value}</p><div className="flex justify-between items-center mt-5 pt-4 border-t"><span className="text-xs text-slate-400">ترتیب {item.order.toLocaleString('fa-IR')}</span><div className="flex gap-2"><button className="admin-icon-button" onClick={() => edit(item)} aria-label="ویرایش"><FiEdit2 /></button><button className="admin-icon-button" onClick={() => remove(item.id)} aria-label="غیرفعال"><FiTrash2 /></button></div></div></article>; })}</div>
      <Pagination current={page} total={result.totalCount} perPage={result.pageSize} onChange={setPage} />
    </>}
    {showModal && <div className="modal-overlay" onClick={close}><section className="modal-content" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true"><div className="flex justify-between mb-6"><div><h2 className="text-lg font-bold">{editing ? 'ویرایش محتوا' : 'محتوای جدید'}</h2><p className="text-xs text-slate-500 mt-1">برای تصویر و ویدیو می‌توانید فایل آپلود کنید یا URL بدهید.</p></div><button className="admin-icon-button" onClick={close}><FiX /></button></div>{error && showModal && <div className="auth-error mb-4">{error}</div>}<div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3"><div><label className="form-label">کلید انگلیسی</label><input className="form-input font-mono" dir="ltr" value={form.key} onChange={e => setForm({ ...form, key: e.target.value })} placeholder="home.dynamic.intro" /></div><div><label className="form-label">شناسه صفحه</label><input className="form-input font-mono" list="content-page-options" dir="ltr" value={form.page} onChange={e => setForm({ ...form, page: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })} placeholder="home یا rules" /><datalist id="content-page-options">{pages.map(p => <option key={p} value={p}>{pageLabels[p]}</option>)}</datalist><p className="text-xs text-slate-400 mt-1">برای صفحه سفارشی مثل قوانین، مقدار rules وارد کنید؛ آدرس آن /page/rules خواهد بود.</p></div></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3"><div><label className="form-label">نوع محتوا</label><select className="form-input" value={form.type} onChange={e => setForm({ ...form, type: Number(e.target.value), value: '' })}>{typeLabels.map((label, index) => <option key={label} value={index}>{label}</option>)}</select></div><div><label className="form-label">بخش</label><input className="form-input" value={form.section} onChange={e => setForm({ ...form, section: e.target.value })} placeholder="dynamic" /></div></div>
      {mediaType && <label className="btn btn-secondary w-full cursor-pointer"><FiUpload /> {uploading ? 'در حال آپلود…' : 'انتخاب و آپلود فایل'}<input type="file" hidden accept={form.type === 2 ? 'video/mp4,video/webm,video/ogg' : 'image/jpeg,image/png,image/webp,image/gif'} onChange={e => void upload(e.target.files?.[0])} /></label>}
      <div><label className="form-label">{form.type === 3 ? 'ویرایشگر HTML' : mediaType ? (form.type === 5 ? 'آدرس تصاویر (هر خط یک URL)' : 'آدرس فایل') : 'مقدار محتوا'}</label>{form.type === 3 ? <HtmlEditor value={form.value} onChange={value => setForm(current => ({ ...current, value }))} /> : <textarea className="form-input min-h-[120px]" dir={mediaType ? 'ltr' : 'rtl'} value={form.value} onChange={e => setForm({ ...form, value: e.target.value })} placeholder={form.type === 2 ? '/uploads/...mp4 یا https://...' : ''} />}</div>
      {form.type === 2 && form.value && <video src={form.value} controls className="w-full max-h-56 rounded-xl bg-black" />}{(form.type === 1 || form.type === 4) && form.value && <img src={form.value} alt="پیش‌نمایش" className="w-full max-h-56 object-contain rounded-xl bg-slate-50" />}
      <div className="grid grid-cols-2 gap-3"><div><label className="form-label">ترتیب</label><input type="number" className="form-input" value={form.order} onChange={e => setForm({ ...form, order: Number(e.target.value) })} /></div><div><label className="form-label">زبان</label><select className="form-input" value={form.language} onChange={e => setForm({ ...form, language: e.target.value })}><option value="fa">فارسی</option><option value="en">English</option></select></div></div><label className="flex gap-2"><input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} /> فعال باشد</label>
    </div><div className="flex gap-3 mt-6"><button className="btn btn-primary flex-1" onClick={save}><FiCheck /> ذخیره</button><button className="btn btn-secondary flex-1" onClick={close}>انصراف</button></div></section></div>}
  </div>;
};
export default ContentPage;
