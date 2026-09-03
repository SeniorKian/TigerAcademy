import React, { useCallback, useEffect, useState } from 'react';
import apiClient from '@/api/apiClient';
import { FiPlus, FiHelpCircle, FiX, FiCheck, FiChevronDown, FiChevronUp, FiEdit2, FiTrash2, FiSearch, FiChevronLeft, FiChevronRight, FiRefreshCw } from 'react-icons/fi';
import { Button, Card, EmptyState, Input, Skeleton } from '@/design-system';
import { apiErrorMessage, confirmAction, showSuccess } from '@/design-system/feedback';

interface Faq { id: number; question: string; answer: string; category: string; order: number; isActive: boolean; }
interface FaqsResult { items: Faq[]; page: number; pageSize: number; totalCount: number; totalPages: number; }
const emptyResult: FaqsResult = { items: [], page: 1, pageSize: 20, totalCount: 0, totalPages: 0 };
const emptyForm = { question: '', answer: '', category: '', order: 0, isActive: true };

const FaqsPage: React.FC = () => {
  const [result, setResult] = useState<FaqsResult>(emptyResult);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [categoryInput, setCategoryInput] = useState('');
  const [category, setCategory] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Faq | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const response = await apiClient.get<FaqsResult>('/faqs/admin/all', {
        params: { page, pageSize: 20, search: search || undefined, category: category || undefined, isActive: statusFilter || undefined },
      });
      setResult(response.data);
    } catch (err) { setError(apiErrorMessage(err, 'دریافت سوالات ناموفق بود.')); }
    finally { setLoading(false); }
  }, [page, search, category, statusFilter]);

  useEffect(() => { void load(); }, [load]);
  const submitSearch = (event: React.FormEvent) => { event.preventDefault(); setPage(1); setSearch(searchInput.trim()); setCategory(categoryInput.trim()); };

  const close = () => { setShowModal(false); setEditing(null); setForm(emptyForm); setError(''); };
  const openEdit = (faq: Faq) => { setEditing(faq); setForm({ question: faq.question, answer: faq.answer, category: faq.category || '', order: faq.order, isActive: faq.isActive }); setShowModal(true); };
  const save = async () => { if (!form.question.trim() || !form.answer.trim()) { setError('سؤال و پاسخ الزامی است.'); return; } try { if (editing) await apiClient.put(`/faqs/${editing.id}`, form); else await apiClient.post('/faqs', form); close(); await load(); } catch { setError('ذخیره سؤال انجام نشد.'); } };
  const remove = async (id: number) => { const confirmed = await confirmAction({ title: 'غیرفعال‌کردن سؤال', text: `«${result.items.find(item => item.id === id)?.question || 'این سؤال'}» از سایت پنهان می‌شود. از بخش ویرایش می‌توانید دوباره آن را فعال کنید.`, onConfirm: () => apiClient.delete(`/faqs/${id}`) }); if (confirmed) { showSuccess('سؤال غیرفعال شد'); await load(); } };

  return <div className="space-y-6 fade-in">
    <div className="admin-page-header">
      <div><span className="admin-page-eyebrow"><FiHelpCircle /> مرکز راهنما</span><h1>سوالات متداول</h1><p>{result.totalCount.toLocaleString('fa-IR')} سؤال ثبت‌شده</p></div>
      <div className="flex gap-2"><Button variant="secondary" onClick={load} leftIcon={<FiRefreshCw />}>به‌روزرسانی</Button><Button onClick={() => setShowModal(true)} leftIcon={<FiPlus />}>سؤال جدید</Button></div>
    </div>

    <Card padding="md">
      <form className="admin-filter-bar" onSubmit={submitSearch}>
        <Input aria-label="جستجوی سوال" placeholder="جستجو در سؤال یا پاسخ" value={searchInput} onChange={event => setSearchInput(event.target.value)} icon={<FiSearch />} />
        <Input aria-label="فیلتر دسته‌بندی" placeholder="دسته‌بندی" value={categoryInput} onChange={event => setCategoryInput(event.target.value)} />
        <select className="form-input" aria-label="فیلتر وضعیت" value={statusFilter} onChange={event => { setPage(1); setStatusFilter(event.target.value); }}>
          <option value="">همه وضعیت‌ها</option>
          <option value="true">فعال</option>
          <option value="false">غیرفعال</option>
        </select>
        <Button type="submit">جستجو</Button>
      </form>
    </Card>

    {error && !showModal && <div className="auth-error mb-4">{error}</div>}
    {loading ? <Skeleton className="h-64 rounded-xl" /> : result.items.length === 0 ? <EmptyState icon={<FiHelpCircle size={40} />} title="سؤالی پیدا نشد" description="فیلترها را تغییر دهید یا اولین سؤال پرتکرار را اضافه کنید." /> : <>
      <div className="space-y-3">{result.items.map(faq => <article key={faq.id} className="card"><div className="flex items-start gap-3"><button type="button" className="admin-faq-trigger flex-1" onClick={() => setExpandedId(expandedId === faq.id ? null : faq.id)}><div><p className="font-medium text-slate-800">{faq.question}</p><div className="flex gap-2 mt-2">{faq.category && <span className="badge badge-info">{faq.category}</span>}<span className={`badge ${faq.isActive ? 'badge-success' : 'badge-danger'}`}>{faq.isActive ? 'فعال' : 'غیرفعال'}</span></div></div>{expandedId === faq.id ? <FiChevronUp /> : <FiChevronDown />}</button><button className="admin-icon-button" onClick={() => openEdit(faq)} aria-label="ویرایش"><FiEdit2 /></button><button className="admin-icon-button" onClick={() => remove(faq.id)} aria-label="غیرفعال‌کردن"><FiTrash2 /></button></div>{expandedId === faq.id && <div className="mt-4 p-4 bg-slate-50 rounded-lg text-sm leading-7">{faq.answer}</div>}</article>)}</div>
      <div className="admin-pagination">
        <span>نمایش {result.items.length.toLocaleString('fa-IR')} از {result.totalCount.toLocaleString('fa-IR')} سؤال</span>
        <div>
          <button type="button" disabled={page <= 1} onClick={() => setPage(value => value - 1)} aria-label="صفحه قبل"><FiChevronRight /></button>
          <strong>صفحه {page.toLocaleString('fa-IR')} از {Math.max(1, result.totalPages).toLocaleString('fa-IR')}</strong>
          <button type="button" disabled={page >= result.totalPages} onClick={() => setPage(value => value + 1)} aria-label="صفحه بعد"><FiChevronLeft /></button>
        </div>
      </div>
    </>}
    {showModal && <div className="modal-overlay" onClick={close}><div className="modal-content" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true"><div className="flex justify-between mb-6"><h3 className="text-lg font-bold">{editing ? 'ویرایش سؤال' : 'سؤال جدید'}</h3><button className="admin-icon-button" onClick={close}><FiX /></button></div>{error && showModal && <div className="auth-error mb-4">{error}</div>}<div className="space-y-4"><div><label className="form-label">سؤال</label><input className="form-input" value={form.question} onChange={e => setForm({ ...form, question: e.target.value })} /></div><div><label className="form-label">پاسخ</label><textarea className="form-input min-h-[120px]" value={form.answer} onChange={e => setForm({ ...form, answer: e.target.value })} /></div><div className="grid grid-cols-2 gap-3"><div><label className="form-label">دسته‌بندی</label><input className="form-input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} /></div><div><label className="form-label">ترتیب</label><input type="number" className="form-input" value={form.order} onChange={e => setForm({ ...form, order: Number(e.target.value) })} /></div></div><label className="flex gap-2"><input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} /> فعال باشد</label></div><div className="flex gap-3 mt-6"><button className="btn btn-primary flex-1" onClick={save}><FiCheck /> ذخیره</button><button className="btn btn-secondary flex-1" onClick={close}>انصراف</button></div></div></div>}
  </div>;
};
export default FaqsPage;
