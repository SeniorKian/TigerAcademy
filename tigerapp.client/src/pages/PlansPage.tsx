import React, { useCallback, useEffect, useState } from 'react';
import apiClient from '@/api/apiClient';
import { FiPlus, FiEdit2, FiTrash2, FiPackage, FiSearch, FiRefreshCw } from 'react-icons/fi';
import { Card, Button, Badge, Input, Modal, EmptyState, Skeleton, PriceDisplay, Pagination } from '@/design-system';
import { apiErrorMessage, confirmAction, showSuccess } from '@/design-system/feedback';

interface Plan { id: number; name: string; description: string; price: number; imageUrl?: string; videoUrl?: string; features: string[]; order: number; isActive: boolean; }
interface PlansResult { items: Plan[]; page: number; pageSize: number; totalCount: number; totalPages: number; }
const emptyResult: PlansResult = { items: [], page: 1, pageSize: 12, totalCount: 0, totalPages: 0 };
const emptyForm = { name: '', description: '', price: 0, imageUrl: '', videoUrl: '', features: '', order: 0, isActive: true };

const PlansPage: React.FC = () => {
  const [result, setResult] = useState<PlansResult>(emptyResult);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [formData, setFormData] = useState(emptyForm);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const response = await apiClient.get<PlansResult>('/plans/admin/all', {
        params: { page, pageSize: 12, search: search || undefined, isActive: statusFilter || undefined },
      });
      setResult(response.data);
    } catch (err) { setError(apiErrorMessage(err, 'دریافت طرح‌ها ناموفق بود.')); }
    finally { setLoading(false); }
  }, [page, search, statusFilter]);

  useEffect(() => { void load(); }, [load]);
  const submitSearch = (event: React.FormEvent) => { event.preventDefault(); setPage(1); setSearch(searchInput.trim()); };

  const closeModal = () => { setShowModal(false); setEditingPlan(null); setFormData(emptyForm); setError(''); };
  const handleSave = async () => {
    if (!formData.name.trim() || !formData.description.trim() || formData.price < 0) { setError('نام، توضیحات و قیمت معتبر الزامی است.'); return; }
    const payload = { ...formData, features: formData.features.split(/[,\n]/).map(x => x.trim()).filter(Boolean) };
    setSaving(true); setError('');
    try {
      if (editingPlan) await apiClient.put(`/plans/${editingPlan.id}`, { id: editingPlan.id, ...payload });
      else await apiClient.post('/plans', payload);
      closeModal(); await load();
    } catch { setError('ذخیره طرح انجام نشد. اطلاعات را بررسی کنید.'); }
    finally { setSaving(false); }
  };
  const handleDelete = async (id: number) => {
    const confirmed = await confirmAction({ title: 'غیرفعال‌کردن طرح', text: `«${result.items.find(item => item.id === id)?.name || 'این طرح'}» از سایت پنهان می‌شود. اطلاعات و سفارش‌های قبلی حذف نمی‌شوند و از بخش ویرایش قابل فعال‌سازی است.`, onConfirm: () => apiClient.delete(`/plans/${id}`) });
    if (confirmed) { showSuccess('طرح غیرفعال شد'); await load(); }
  };
  const openEdit = (plan: Plan) => {
    setEditingPlan(plan);
    setFormData({ name: plan.name, description: plan.description, price: plan.price, imageUrl: plan.imageUrl || '', videoUrl: plan.videoUrl || '', features: plan.features.join('\n'), order: plan.order, isActive: plan.isActive });
    setShowModal(true);
  };

  return <div className="space-y-6 fade-in">
    <div className="admin-page-header">
      <div><span className="admin-page-eyebrow"><FiPackage /> مدیریت طرح‌ها</span><h1>طرح‌ها</h1><p>{result.totalCount.toLocaleString('fa-IR')} طرح ثبت‌شده</p></div>
      <div className="flex gap-2"><Button variant="secondary" onClick={load} leftIcon={<FiRefreshCw />}>به‌روزرسانی</Button><Button onClick={() => { setEditingPlan(null); setFormData(emptyForm); setShowModal(true); }} leftIcon={<FiPlus />}>طرح جدید</Button></div>
    </div>

    <Card padding="md">
      <form className="admin-filter-bar" onSubmit={submitSearch}>
        <Input aria-label="جستجوی طرح" placeholder="نام طرح" value={searchInput} onChange={event => setSearchInput(event.target.value)} icon={<FiSearch />} />
        <select className="form-input" aria-label="فیلتر وضعیت" value={statusFilter} onChange={event => { setPage(1); setStatusFilter(event.target.value); }}>
          <option value="">همه وضعیت‌ها</option>
          <option value="true">فعال</option>
          <option value="false">غیرفعال</option>
        </select>
        <Button type="submit">جستجو</Button>
      </form>
    </Card>

    {error && !showModal && <div className="auth-error" role="alert">{error}</div>}
    {loading ? <Skeleton className="h-64 rounded-xl" /> : result.items.length === 0 ? <EmptyState icon={<FiPackage size={44} />} title="طرحی پیدا نشد" description="فیلترها را تغییر دهید یا اولین طرح را بسازید." /> : <>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">{result.items.map(plan => <Card key={plan.id} padding="lg" className="flex flex-col">
        {plan.imageUrl && <img src={plan.imageUrl} alt="" className="w-full h-36 object-cover rounded-xl mb-4" />}
        <div className="flex items-start justify-between gap-3"><h3 className="font-bold">{plan.name}</h3><Badge variant={plan.isActive ? 'success' : 'danger'}>{plan.isActive ? 'فعال' : 'غیرفعال'}</Badge></div>
        <p className="text-sm text-neutral-secondary my-3 line-clamp-3">{plan.description}</p><PriceDisplay amount={plan.price} size="lg" />
        {!!plan.features.length && <ul className="text-xs mt-3 space-y-1">{plan.features.slice(0, 4).map(item => <li key={item}>• {item}</li>)}</ul>}
        <div className="flex gap-2 mt-auto pt-4"><Button variant="secondary" size="sm" fullWidth leftIcon={<FiEdit2 />} onClick={() => openEdit(plan)}>ویرایش</Button><Button variant="danger" size="sm" fullWidth leftIcon={<FiTrash2 />} onClick={() => handleDelete(plan.id)}>غیرفعال</Button></div>
      </Card>)}</div>
      <Pagination current={page} total={result.totalCount} perPage={result.pageSize} onChange={setPage} />
    </>}
    <Modal open={showModal} onClose={closeModal} title={editingPlan ? 'ویرایش طرح' : 'طرح جدید'} size="lg">
      <div className="space-y-4">{error && showModal && <div className="auth-error" role="alert">{error}</div>}
        <Input label="نام طرح" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
        <div><label className="form-label">توضیحات</label><textarea className="form-input min-h-[90px]" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} /></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3"><Input label="قیمت (تومان)" type="number" value={formData.price} onChange={e => setFormData({ ...formData, price: Number(e.target.value) })} dir="ltr" /><Input label="ترتیب نمایش" type="number" value={formData.order} onChange={e => setFormData({ ...formData, order: Number(e.target.value) })} dir="ltr" /></div>
        <Input label="آدرس تصویر" value={formData.imageUrl} onChange={e => setFormData({ ...formData, imageUrl: e.target.value })} dir="ltr" placeholder="https://..." />
        <Input label="آدرس ویدیو" value={formData.videoUrl} onChange={e => setFormData({ ...formData, videoUrl: e.target.value })} dir="ltr" placeholder="https://..." />
        <div><label className="form-label">امکانات (هر مورد یک خط)</label><textarea className="form-input min-h-[100px]" value={formData.features} onChange={e => setFormData({ ...formData, features: e.target.value })} /></div>
        <label className="flex items-center gap-2"><input type="checkbox" checked={formData.isActive} onChange={e => setFormData({ ...formData, isActive: e.target.checked })} /> طرح فعال باشد</label>
      </div><div className="flex gap-3 mt-6"><Button fullWidth loading={saving} onClick={handleSave}>ذخیره</Button><Button variant="secondary" fullWidth onClick={closeModal}>انصراف</Button></div>
    </Modal>
  </div>;
};
export default PlansPage;
