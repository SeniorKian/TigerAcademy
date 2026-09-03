import React, { useCallback, useEffect, useState } from 'react';
import { FiCheck, FiChevronLeft, FiChevronRight, FiCreditCard, FiEye, FiRefreshCw, FiSearch, FiX } from 'react-icons/fi';
import apiClient from '@/api/apiClient';
import { Button, Card, EmptyState, Input, Modal, Skeleton } from '@/design-system';
import { useAuth } from '@/auth/AuthContext';

interface Payment {
  id: number; orderId: number; trackingCode?: string; userName?: string; userPhone?: string;
  amount: number; status: number; statusName: string; gateway?: string; receiptUrl?: string;
  bankReference?: string; cardLastFour?: string; createdAtShamsi?: string; paidAtShamsi?: string; orderNotes?: string;
}
interface PaymentResult { items: Payment[]; page: number; pageSize: number; totalCount: number; totalPages: number; }
const emptyResult: PaymentResult = { items: [], page: 1, pageSize: 20, totalCount: 0, totalPages: 0 };

const PaymentsPage: React.FC = () => {
  const { user } = useAuth();
  const [result, setResult] = useState<PaymentResult>(emptyResult);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState<Payment | null>(null);
  const [reviewNote, setReviewNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const response = await apiClient.get<PaymentResult>('/payments', { params: { page, pageSize: 20, status: status || undefined, search: search || undefined } });
      setResult(response.data);
    } catch { setError('دریافت تراکنش‌ها ناموفق بود.'); }
    finally { setLoading(false); }
  }, [page, search, status]);

  useEffect(() => { void load(); }, [load]);
  const submitSearch = (event: React.FormEvent) => { event.preventDefault(); setPage(1); setSearch(searchInput.trim()); };
  const review = async (approved: boolean) => {
    if (!reviewing) return;
    setSaving(true); setError(''); setMessage('');
    try {
      const response = await apiClient.put<{ message: string }>(`/payments/${reviewing.id}/review`, { approved, note: reviewNote });
      setMessage(response.data.message); setReviewing(null); setReviewNote(''); await load();
    } catch { setError('بررسی رسید انجام نشد؛ وضعیت تراکنش را دوباره بررسی کنید.'); }
    finally { setSaving(false); }
  };

  return <div className="space-y-6 fade-in">
    <div className="admin-page-header"><div><span className="admin-page-eyebrow"><FiCreditCard /> کنترل مالی</span><h1>تراکنش‌ها و رسیدها</h1><p>پرداخت‌های آنلاین و رسیدهای کارت‌به‌کارت را یکجا پیگیری کنید.</p></div><Button variant="secondary" onClick={load} leftIcon={<FiRefreshCw />}>به‌روزرسانی</Button></div>
    {message && <div className="p-4 rounded-xl bg-green-50 text-green-700" role="status">{message}</div>}
    {error && <div className="auth-error" role="alert">{error}</div>}
    <Card padding="md"><form className="admin-filter-bar" onSubmit={submitSearch}><Input aria-label="جستجوی تراکنش" placeholder="کد سفارش، نام، موبایل یا پیگیری بانک" value={searchInput} onChange={event => setSearchInput(event.target.value)} icon={<FiSearch />} /><select className="form-input" aria-label="فیلتر وضعیت" value={status} onChange={event => { setPage(1); setStatus(event.target.value); }}><option value="">همه وضعیت‌ها</option><option value="1">در حال بررسی</option><option value="2">موفق</option><option value="3">رد یا ناموفق</option><option value="4">بازپرداخت‌شده</option></select><Button type="submit">جستجو</Button></form></Card>
    {loading ? <Skeleton className="h-56 rounded-xl" /> : result.items.length === 0 ? <EmptyState icon={<FiCreditCard size={42} />} title="تراکنشی پیدا نشد" description="فیلترها را تغییر دهید یا منتظر ثبت پرداخت جدید بمانید." /> : <>
      <div className="table-container"><table><thead><tr><th>سفارش</th><th>مشتری</th><th>مبلغ</th><th>روش</th><th>تاریخ</th><th>وضعیت</th><th>رسید / عملیات</th></tr></thead><tbody>{result.items.map(payment => <tr key={payment.id}>
        <td><strong dir="ltr" className="font-mono text-xs">{payment.trackingCode || `#${payment.orderId}`}</strong></td>
        <td><strong>{payment.userName || '—'}</strong><small className="block text-slate-500 mt-1" dir="ltr">{payment.userPhone}</small></td>
        <td className="font-bold">{payment.amount.toLocaleString('fa-IR')} تومان</td><td>{payment.gateway === 'CardToCard' ? 'کارت‌به‌کارت' : payment.gateway || '—'}</td>
        <td className="text-slate-500">{payment.createdAtShamsi || '—'}</td><td><span className={`badge ${payment.status === 2 ? 'badge-success' : payment.status === 1 ? 'badge-warning' : payment.status === 3 ? 'badge-danger' : 'badge-info'}`}>{payment.statusName}</span></td>
        <td><div className="flex items-center gap-2">{payment.receiptUrl && <a className="admin-icon-button" href={payment.receiptUrl} target="_blank" rel="noreferrer" aria-label="مشاهده رسید"><FiEye /></a>}{payment.gateway === 'CardToCard' && payment.status === 1 && <Button size="sm" onClick={() => setReviewing(payment)}>بررسی رسید</Button>}</div></td>
      </tr>)}</tbody></table></div>
      <div className="admin-pagination"><span>نمایش {result.items.length.toLocaleString('fa-IR')} از {result.totalCount.toLocaleString('fa-IR')} تراکنش</span><div><button type="button" disabled={page <= 1} onClick={() => setPage(value => value - 1)} aria-label="صفحه قبل"><FiChevronRight /></button><strong>صفحه {page.toLocaleString('fa-IR')} از {Math.max(1, result.totalPages).toLocaleString('fa-IR')}</strong><button type="button" disabled={page >= result.totalPages} onClick={() => setPage(value => value + 1)} aria-label="صفحه بعد"><FiChevronLeft /></button></div></div>
    </>}
    <Modal open={Boolean(reviewing)} onClose={() => { if (!saving) { setReviewing(null); setReviewNote(''); } }} title="بررسی رسید کارت‌به‌کارت" size="md">{reviewing && <div className="space-y-4">
      <div className="receipt-review-summary"><div><span>سفارش</span><strong dir="ltr">{reviewing.trackingCode}</strong></div><div><span>مبلغ</span><strong>{reviewing.amount.toLocaleString('fa-IR')} تومان</strong></div><div><span>پیگیری بانک</span><strong>{reviewing.bankReference || 'وارد نشده'}</strong></div><div><span>۴ رقم کارت</span><strong dir="ltr">{reviewing.cardLastFour || 'وارد نشده'}</strong></div></div>
      {reviewing.receiptUrl && (reviewing.receiptUrl.toLowerCase().endsWith('.pdf') ? <a className="btn btn-secondary w-full" href={reviewing.receiptUrl} target="_blank" rel="noreferrer"><FiEye /> باز کردن فایل PDF</a> : <a href={reviewing.receiptUrl} target="_blank" rel="noreferrer"><img className="receipt-review-image" src={reviewing.receiptUrl} alt={`رسید سفارش ${reviewing.trackingCode}`} /></a>)}
      {reviewing.orderNotes && <div className="receipt-order-note"><strong>توضیحات سفارش</strong><p>{reviewing.orderNotes}</p></div>}
      <label><span className="form-label">یادداشت بررسی (اختیاری)</span><textarea className="form-input min-h-20" value={reviewNote} onChange={event => setReviewNote(event.target.value)} /></label>
      {user?.role === 'Admin' ? <div className="grid grid-cols-2 gap-3"><Button loading={saving} onClick={() => review(true)} leftIcon={<FiCheck />}>تأیید پرداخت</Button><Button variant="danger" disabled={saving} onClick={() => review(false)} leftIcon={<FiX />}>رد رسید</Button></div> : <p className="text-sm text-amber-700 bg-amber-50 p-3 rounded-xl">مشاهده برای مشاور مجاز است؛ تأیید مالی فقط توسط مدیر کل انجام می‌شود.</p>}
    </div>}</Modal>
  </div>;
};
export default PaymentsPage;
