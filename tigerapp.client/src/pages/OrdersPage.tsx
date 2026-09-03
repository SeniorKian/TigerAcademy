import React, { useCallback, useEffect, useState } from 'react';
import apiClient from '@/api/apiClient';
import { FiShoppingBag, FiCheck, FiX, FiChevronLeft, FiChevronRight, FiRefreshCw, FiSearch } from 'react-icons/fi';
import { Button, Card, EmptyState, Input, Skeleton } from '@/design-system';
import { apiErrorMessage, confirmAction, showSuccess } from '@/design-system/feedback';

interface Order {
  id: number;
  userId: number;
  userName: string;
  userPhone: string;
  type: number;
  typeName: string;
  planName: string | null;
  consultationName: string | null;
  amount: number;
  amountFormatted: string;
  status: number;
  statusName: string;
  trackingCode: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  createdAtShamsi: string | null;
  paidAtShamsi: string | null;
}
interface OrdersResult { items: Order[]; page: number; pageSize: number; totalCount: number; totalPages: number; }
const emptyResult: OrdersResult = { items: [], page: 1, pageSize: 20, totalCount: 0, totalPages: 0 };

const OrdersPage: React.FC = () => {
  const [result, setResult] = useState<OrdersResult>(emptyResult);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [type, setType] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const response = await apiClient.get<OrdersResult>('/orders/all', {
        params: { page, pageSize: 20, search: search || undefined, status: status || undefined, type: type || undefined },
      });
      setResult(response.data);
    } catch (err) { setError(apiErrorMessage(err, 'دریافت سفارش‌ها ناموفق بود.')); }
    finally { setLoading(false); }
  }, [page, search, status, type]);

  useEffect(() => { void load(); }, [load]);
  const submitSearch = (event: React.FormEvent) => { event.preventDefault(); setPage(1); setSearch(searchInput.trim()); };

  const updateStatus = async (id: number, newStatus: string) => {
    const action = newStatus === '2' ? 'تأیید پرداخت' : newStatus === '3' ? 'تکمیل سفارش' : 'لغو سفارش';
    const order = result.items.find(item => item.id === id);
    const confirmed = await confirmAction({ title: action, text: `${action} برای سفارش «${order?.trackingCode || id}» انجام شود؟`, confirmText: `بله، ${action}`, danger: newStatus === '5', onConfirm: () => apiClient.put(`/orders/${id}/status`, { status: Number(newStatus), notes: order?.notes }) });
    if (confirmed) { showSuccess('وضعیت سفارش تغییر کرد'); await load(); }
  };

  return (
    <div className="space-y-6 fade-in">
      <div className="admin-page-header">
        <div>
          <span className="admin-page-eyebrow"><FiShoppingBag /> مدیریت سفارشات</span>
          <h1>سفارش‌ها</h1>
          <p>{result.totalCount.toLocaleString('fa-IR')} سفارش ثبت شده</p>
        </div>
        <Button variant="secondary" onClick={load} leftIcon={<FiRefreshCw />}>به‌روزرسانی</Button>
      </div>

      <Card padding="md">
        <form className="admin-filter-bar" onSubmit={submitSearch}>
          <Input aria-label="جستجوی سفارش" placeholder="کد پیگیری، نام یا شماره موبایل" value={searchInput} onChange={event => setSearchInput(event.target.value)} icon={<FiSearch />} />
          <select className="form-input" aria-label="فیلتر وضعیت" value={status} onChange={event => { setPage(1); setStatus(event.target.value); }}>
            <option value="">همه وضعیت‌ها</option>
            <option value="0">در انتظار پرداخت</option>
            <option value="1">در حال پردازش</option>
            <option value="2">پرداخت شده</option>
            <option value="3">تکمیل شده</option>
            <option value="4">ناموفق</option>
            <option value="5">لغو شده</option>
            <option value="6">بازپرداخت شده</option>
            <option value="7">منقضی شده</option>
          </select>
          <select className="form-input" aria-label="فیلتر نوع" value={type} onChange={event => { setPage(1); setType(event.target.value); }}>
            <option value="">همه انواع</option>
            <option value="1">طرح</option>
            <option value="2">مشاوره</option>
          </select>
          <Button type="submit">جستجو</Button>
        </form>
      </Card>

      {error && <div className="auth-error" role="alert">{error}</div>}

      {loading ? <Skeleton className="h-64 rounded-xl" /> : result.items.length === 0 ? (
        <EmptyState icon={<FiShoppingBag size={42} />} title="سفارشی پیدا نشد" description="فیلترها را تغییر دهید یا منتظر ثبت سفارش جدید بمانید." />
      ) : <>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>کد پیگیری</th>
                <th>مشتری</th>
                <th>شماره</th>
                <th>نوع</th>
                <th>آیتم</th>
                <th>مبلغ</th>
                <th>تاریخ</th>
                <th>وضعیت</th>
                <th>عملیات</th>
              </tr>
            </thead>
            <tbody>
              {result.items.map((order) => (
                <tr key={order.id}>
                  <td className="font-mono text-xs">{order.trackingCode || '—'}</td>
                  <td className="font-medium">{order.userName || '—'}</td>
                  <td className="font-mono text-xs" dir="ltr">{order.userPhone || '—'}</td>
                  <td>
                    <span className={`badge ${order.type === 1 ? 'badge-info' : 'badge-warning'}`}>
                      {order.typeName}
                    </span>
                  </td>
                  <td>{order.planName || order.consultationName || '—'}</td>
                  <td className="persian-number font-bold text-orange-500">
                    {new Intl.NumberFormat('fa-IR').format(order.amount)} ت
                  </td>
                  <td className="text-sm text-slate-500" dir="rtl">{order.createdAtShamsi || '—'}</td>
                  <td>
                    <span className={`badge ${
                      order.status === 0 ? 'badge-warning' :
                      order.status === 1 ? 'badge-info' :
                      order.status === 2 || order.status === 3 ? 'badge-success' :
                      'badge-danger'
                    }`}>
                      {order.statusName}
                    </span>
                  </td>
                  <td>
                    <div className="flex gap-1">
                      {(order.status === 0 || order.status === 1) && (
                        <>
                          <button onClick={() => updateStatus(order.id, '2')} className="btn btn-success text-xs py-1 px-2" title="تأیید پرداخت">
                            <FiCheck />
                          </button>
                          <button onClick={() => updateStatus(order.id, '5')} className="btn btn-danger text-xs py-1 px-2" title="لغو">
                            <FiX />
                          </button>
                        </>
                      )}
                      {order.status === 2 && (
                        <button onClick={() => updateStatus(order.id, '3')} className="btn btn-success text-xs py-1 px-2" title="تکمیل">
                          <FiCheck /> تکمیل
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="admin-pagination">
          <span>نمایش {result.items.length.toLocaleString('fa-IR')} از {result.totalCount.toLocaleString('fa-IR')} سفارش</span>
          <div>
            <button type="button" disabled={page <= 1} onClick={() => setPage(value => value - 1)} aria-label="صفحه قبل"><FiChevronRight /></button>
            <strong>صفحه {page.toLocaleString('fa-IR')} از {Math.max(1, result.totalPages).toLocaleString('fa-IR')}</strong>
            <button type="button" disabled={page >= result.totalPages} onClick={() => setPage(value => value + 1)} aria-label="صفحه بعد"><FiChevronLeft /></button>
          </div>
        </div>
      </>}
    </div>
  );
};

export default OrdersPage;
