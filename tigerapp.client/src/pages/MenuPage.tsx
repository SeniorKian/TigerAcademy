import React, { useEffect, useRef, useState } from 'react';
import { FiEdit2, FiExternalLink, FiEye, FiEyeOff, FiLink, FiPlus, FiRefreshCw, FiSearch, FiTrash2 } from 'react-icons/fi';
import apiClient from '@/api/apiClient';
import { Button, Input, Modal, Skeleton } from '@/design-system';
import { apiErrorMessage, confirmAction, showSuccess } from '@/design-system/feedback';
import { normalizeMenuLink, validateMenuLink } from '@/utils/menuLinks';

interface MenuItem { id: number; title: string; link: string; icon?: string; order: number; parentId?: number | null; isActive: boolean; }
type LinkMode = 'preset' | 'page' | 'external';
const empty = { title: '', link: '/', icon: '', order: 0, parentId: null as number | null, isActive: true };
const presets = [{ label: 'خانه', value: '/' }, { label: 'مشاوره‌ها', value: '/consultations' }, { label: 'طرح‌ها', value: '/#plans' }, { label: 'سوالات متداول', value: '/#faq' }, { label: 'تماس با ما', value: '/#contact' }];
const detectMode = (link: string): LinkMode => /^(https?:|tel:|mailto:)/i.test(link) ? 'external' : link.startsWith('/page/') ? 'page' : 'preset';
const sortItems = (items: MenuItem[]) => [...items].sort((a, b) => a.order - b.order || a.id - b.id);

const MenuPage: React.FC = () => {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<MenuItem | null>(null);
  const [form, setForm] = useState(empty);
  const [linkMode, setLinkMode] = useState<LinkMode>('preset');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const operationLock = useRef(false);
  const errorRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const controller = new AbortController();
    apiClient.get<MenuItem[]>('/menu/admin/all', { signal: controller.signal })
      .then(response => setItems(sortItems(response.data)))
      .catch(error => { if (!controller.signal.aborted) setError(apiErrorMessage(error, 'دریافت منو ناموفق بود.')); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, []);

  async function reload() {
    setLoading(true); setError('');
    try { const response = await apiClient.get<MenuItem[]>('/menu/admin/all'); setItems(sortItems(response.data)); }
    catch (error) { setError(apiErrorMessage(error, 'دریافت منو ناموفق بود.')); }
    finally { setLoading(false); }
  }

  const close = () => {
    if (operationLock.current) return;
    setOpen(false); setEditing(null); setForm(empty); setLinkMode('preset'); setError('');
  };
  const create = () => { setEditing(null); setForm(empty); setLinkMode('preset'); setError(''); setOpen(true); };
  const edit = (item: MenuItem) => {
    const link = normalizeMenuLink(item.link);
    setEditing(item); setForm({ title: item.title, link, icon: item.icon || '', order: item.order, parentId: item.parentId || null, isActive: item.isActive });
    setLinkMode(detectMode(link)); setError(''); setOpen(true);
  };
  const fail = (message: string) => { setError(message); requestAnimationFrame(() => errorRef.current?.focus()); };
  const hasChildren = !!editing && items.some(item => item.parentId === editing.id);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (operationLock.current) return;
    if (!form.title.trim() || form.title.trim().length > 100) return fail('عنوان باید بین ۱ تا ۱۰۰ کاراکتر باشد.');
    const linkError = validateMenuLink(form.link);
    if (linkError) return fail(linkError);
    if (!Number.isInteger(form.order) || form.order < 0 || form.order > 100000) return fail('ترتیب باید عدد صحیح بین صفر و ۱۰۰٬۰۰۰ باشد.');
    if (form.parentId) {
      const parent = items.find(item => item.id === form.parentId);
      if (!parent || parent.parentId || parent.id === editing?.id || hasChildren) return fail('زیرمنو باید به یک منوی اصلی متصل شود؛ منوی دارای فرزند نمی‌تواند زیرمنو شود.');
      if (form.isActive && !parent.isActive) return fail('ابتدا منوی والد را فعال کنید.');
    }
    operationLock.current = true; setSaving(true); setError('');
    try {
      const payload = { ...form, title: form.title.trim(), link: normalizeMenuLink(form.link) };
      const response = editing ? await apiClient.put<MenuItem>(`/menu/${editing.id}`, payload) : await apiClient.post<MenuItem>('/menu', payload);
      setItems(current => sortItems([...current.filter(item => item.id !== response.data.id), response.data]));
      setOpen(false); setEditing(null); setForm(empty); setLinkMode('preset');
      showSuccess(editing ? 'تغییرات پیوند ذخیره شد' : 'پیوند جدید ساخته شد');
    } catch (error) { fail(apiErrorMessage(error, 'ذخیره پیوند انجام نشد.')); }
    finally { operationLock.current = false; setSaving(false); }
  }

  async function toggleActive(item: MenuItem) {
    if (operationLock.current) return;
    operationLock.current = true;
    const activeChildren = items.filter(child => child.parentId === item.id && child.isActive).length;
    try {
      const confirmed = await confirmAction({
        title: item.isActive ? 'این پیوند غیرفعال شود؟' : 'این پیوند فعال شود؟',
        text: item.isActive
          ? `«${item.title}» از منوی سایت پنهان می‌شود؛ اطلاعات آن حذف نمی‌شود و می‌توانید دوباره فعالش کنید.${activeChildren ? ' زیرمنوهای آن هم تا فعال‌سازی والد نمایش داده نمی‌شوند.' : ''}`
          : `«${item.title}» دوباره در منوی سایت نمایش داده می‌شود.`,
        confirmText: item.isActive ? 'بله، غیرفعال شود' : 'بله، فعال شود', danger: item.isActive,
        onConfirm: () => item.isActive ? apiClient.delete(`/menu/${item.id}`) : apiClient.put(`/menu/${item.id}`, { ...item, link: normalizeMenuLink(item.link), isActive: true }),
      });
      if (confirmed) {
        setItems(current => current.map(row => row.id === item.id ? { ...row, isActive: !item.isActive } : row));
        showSuccess(item.isActive ? 'پیوند غیرفعال شد' : 'پیوند فعال شد');
      }
    } finally { operationLock.current = false; }
  }

  async function deletePermanently(item: MenuItem) {
    if (operationLock.current) return;
    operationLock.current = true;
    try {
      const confirmed = await confirmAction({
        title: 'حذف دائمی پیوند؟',
        text: `«${item.title}» برای همیشه از منوی سایت و این فهرست پاک می‌شود. این کار قابل بازگشت نیست.\nفقط پیوند حذف می‌شود؛ محتوای صفحه مقصد و فایل‌های آن باقی می‌مانند. اگر زیرمنو دارد، ابتدا زیرمنوها را جابه‌جا یا حذف کنید.`,
        confirmText: 'بله، برای همیشه حذف کن',
        onConfirm: () => apiClient.delete(`/menu/${item.id}/permanent`),
      });
      if (confirmed) {
        setItems(current => current.filter(row => row.id !== item.id));
        showSuccess('پیوند برای همیشه حذف شد');
        requestAnimationFrame(() => headingRef.current?.focus());
      }
    } finally { operationLock.current = false; }
  }

  const changeMode = (mode: LinkMode) => { setLinkMode(mode); setForm(current => ({ ...current, link: mode === 'preset' ? '/' : mode === 'page' ? '/page/' : 'https://' })); };
  const visibleItems = items.filter(item => `${item.title} ${item.link}`.toLowerCase().includes(search.trim().toLowerCase()) && (statusFilter === 'all' || item.isActive === (statusFilter === 'active')));
  if (loading) return <Skeleton className="h-64 rounded-xl" />;

  return <div className="space-y-6 fade-in">
    <div className="flex flex-wrap justify-between items-center gap-4">
      <div><span className="admin-page-eyebrow"><FiLink /> ناوبری کاملاً پویا</span><h1 ref={headingRef} tabIndex={-1}>منو و پیوندهای سایت</h1><p>پیوند داخلی، صفحه سفارشی، شماره تماس یا وب‌سایت خارجی بسازید.</p></div>
      <Button onClick={create} leftIcon={<FiPlus />}>پیوند جدید</Button>
    </div>
    {error && !open && <div className="auth-error" role="alert">{error} <button onClick={reload} className="underline">تلاش دوباره</button></div>}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      <div className="card p-4"><strong>پیوند داخلی</strong><p className="text-xs text-slate-500 mt-2">بخش‌های آماده مثل طرح‌ها و مشاوره‌ها</p></div>
      <div className="card p-4"><strong>صفحه سفارشی</strong><p className="text-xs text-slate-500 mt-2">مثلاً /page/rules؛ محتوا از CMS خوانده می‌شود</p></div>
      <div className="card p-4"><strong>پیوند خارجی</strong><p className="text-xs text-slate-500 mt-2">وب‌سایت، تلفن یا ایمیل با بازشدن صحیح</p></div>
    </div>
    <div className="card p-4 flex flex-wrap items-center gap-3">
      <div className="flex-1 min-w-40"><Input aria-label="جستجوی پیوند" placeholder="جستجو در عنوان یا آدرس…" icon={<FiSearch />} value={search} onChange={e => setSearch(e.target.value)} /></div>
      <select className="form-input sm:!w-auto" aria-label="وضعیت پیوندها" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}><option value="all">همه وضعیت‌ها</option><option value="active">فعال</option><option value="inactive">غیرفعال</option></select>
      <Button variant="secondary" onClick={reload} leftIcon={<FiRefreshCw />}>بازخوانی</Button>
    </div>
    <div className="table-container"><table><thead><tr><th>عنوان</th><th>نوع</th><th>پیوند واقعی</th><th>والد</th><th>ترتیب</th><th>وضعیت</th><th>عملیات</th></tr></thead><tbody>
      {visibleItems.map(item => {
        const parent = items.find(row => row.id === item.parentId);
        return <tr key={item.id}>
          <td className="font-medium">{item.title}</td><td><span className="badge badge-info">{detectMode(item.link) === 'external' ? 'خارجی' : detectMode(item.link) === 'page' ? 'صفحه سفارشی' : 'داخلی'}</span></td>
          <td dir="ltr">{validateMenuLink(item.link) ? <span className="text-red-600">پیوند نیاز به اصلاح دارد</span> : <a href={normalizeMenuLink(item.link)} target={/^(tel:|mailto:)/i.test(item.link) ? undefined : '_blank'} rel="noopener noreferrer" className="text-blue-600 inline-flex gap-1 items-center break-all">{normalizeMenuLink(item.link)} <FiExternalLink className="shrink-0" /></a>}</td>
          <td>{parent?.title || 'اصلی'}{item.isActive && parent && !parent.isActive && <span className="block text-xs text-amber-700">والد غیرفعال؛ در سایت پنهان</span>}</td>
          <td>{item.order.toLocaleString('fa-IR')}</td><td><span className={`badge ${item.isActive ? 'badge-success' : 'badge-danger'}`}>{item.isActive ? 'فعال' : 'غیرفعال'}</span></td>
          <td><div className="flex flex-wrap items-center gap-2 min-w-44">
            <button type="button" className="admin-icon-button" onClick={() => edit(item)} aria-label={`ویرایش ${item.title}`} title="ویرایش"><FiEdit2 aria-hidden="true" /></button>
            <button type="button" className="admin-icon-button" onClick={() => void toggleActive(item)} aria-label={`${item.isActive ? 'غیرفعال‌کردن' : 'فعال‌کردن'} ${item.title}`} title={item.isActive ? 'غیرفعال‌کردن (قابل بازگشت)' : 'فعال‌کردن'}>{item.isActive ? <FiEyeOff aria-hidden="true" className="text-amber-700" /> : <FiEye aria-hidden="true" className="text-green-700" />}</button>
            <button type="button" className="admin-icon-button text-red-600 hover:!text-red-700 hover:!border-red-200 hover:!bg-red-50" onClick={() => void deletePermanently(item)} aria-label={`حذف دائمی ${item.title}`} title="حذف دائمی"><FiTrash2 aria-hidden="true" /></button>
          </div></td>
        </tr>;
      })}
      {!visibleItems.length && <tr><td colSpan={7} className="!py-10 text-center text-slate-500">پیوندی با این مشخصات پیدا نشد.</td></tr>}
    </tbody></table></div>
    <p className="text-xs text-slate-500 leading-6">{visibleItems.length.toLocaleString('fa-IR')} پیوند · آیکون چشم برای فعال/غیرفعال‌کردن است؛ «حذف دائمی» پیوند را بدون امکان بازگشت پاک می‌کند. در هر دو حالت محتوای صفحه مقصد باقی می‌ماند.</p>

    <Modal open={open} onClose={close} title={editing ? 'ویرایش پیوند' : 'پیوند جدید'} size="lg">
      <form onSubmit={save} noValidate><fieldset disabled={saving} className="space-y-4 min-w-0">
        {error && <div ref={errorRef} tabIndex={-1} className="auth-error" role="alert">{error}</div>}
        <Input id="menu-title" label="عنوان نمایشی" required maxLength={100} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
        <div><p className="form-label">نوع پیوند</p><div className="grid grid-cols-3 gap-2" role="group" aria-label="نوع پیوند">{([['preset', 'داخلی'], ['page', 'صفحه جدید'], ['external', 'خارجی']] as const).map(([mode, label]) => <button key={mode} type="button" aria-pressed={linkMode === mode} className={`btn ${linkMode === mode ? 'btn-primary' : 'btn-secondary'}`} onClick={() => changeMode(mode)}>{label}</button>)}</div></div>
        {linkMode === 'preset' ? <div><label htmlFor="menu-destination" className="form-label">مقصد</label><select id="menu-destination" className="form-input" value={form.link} onChange={e => setForm({ ...form, link: e.target.value })}>{!presets.some(item => item.value === form.link) && <option value={form.link}>{form.link}</option>}{presets.map(item => <option key={item.value} value={item.value}>{item.label} — {item.value}</option>)}</select></div>
          : linkMode === 'page' ? <div><Input id="menu-slug" label="شناسه صفحه" value={form.link.replace('/page/', '')} onChange={e => setForm({ ...form, link: `/page/${e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')}` })} dir="ltr" placeholder="rules" /><p className="text-xs text-slate-500 mt-2">ایجاد پیوند به‌تنهایی صفحه نمی‌سازد؛ در بخش محتوا، صفحه‌ای با همین شناسه بسازید و فعال کنید.</p></div>
            : <Input id="menu-url" label="آدرس کامل" maxLength={200} value={form.link} onChange={e => setForm({ ...form, link: e.target.value })} dir="ltr" placeholder="https://example.com" />}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input id="menu-order" label="ترتیب" type="number" min={0} max={100000} value={form.order} onChange={e => setForm({ ...form, order: Number(e.target.value) })} />
          <div><label htmlFor="menu-parent" className="form-label">زیرمنوی</label><select id="menu-parent" className="form-input" disabled={hasChildren} value={form.parentId || ''} onChange={e => setForm({ ...form, parentId: e.target.value ? Number(e.target.value) : null })}><option value="">منوی اصلی</option>{items.filter(item => item.id !== editing?.id && !item.parentId && (item.isActive || item.id === form.parentId)).map(item => <option key={item.id} value={item.id}>{item.title}{!item.isActive ? ' (غیرفعال)' : ''}</option>)}</select></div>
        </div>
        {hasChildren && <p className="text-xs text-slate-500">این منو زیرمنو دارد؛ برای تغییر والد، ابتدا زیرمنوهایش را جابه‌جا کنید.</p>}
        <label className="flex items-center gap-2 text-sm min-h-10"><input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} /> در سایت فعال باشد</label>
        <div className="p-3 rounded-xl bg-slate-50 text-sm break-all"><span className="text-slate-500">پیش‌نمایش مقصد: </span><bdi dir="ltr">{form.link}</bdi></div>
        <div className="flex flex-col sm:flex-row gap-3 pt-2"><Button fullWidth type="submit" loading={saving}>ذخیره پیوند</Button><Button fullWidth type="button" variant="secondary" onClick={close}>انصراف</Button></div>
      </fieldset></form>
    </Modal>
  </div>;
};
export default MenuPage;
