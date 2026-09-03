import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FiArrowLeft, FiCalendar, FiCheck, FiCheckCircle, FiClock, FiCopy, FiCreditCard, FiExternalLink, FiFileText, FiHash, FiHome, FiShield, FiShoppingBag, FiUploadCloud } from 'react-icons/fi';
import apiClient from '@/api/apiClient';
import { Button, Card, Container, PriceDisplay, Skeleton } from '@/design-system';
import PersianDatePicker from '@/components/PersianDatePicker';
import PublicLayout from './PublicLayout';

interface Purchasable { id: number; name: string; description?: string; price: number; isActive: boolean; }
interface Order { id: number; trackingCode: string; amount: number; statusName: string; }
interface PaymentSettings { onlinePaymentEnabled: boolean; cardToCardEnabled: boolean; cardNumber: string; cardHolder: string; }
interface ApiError { response?: { data?: { message?: string } } }
type PaymentMethod = 'online' | 'card' | 'manual';

const CheckoutPage: React.FC = () => {
  const [params] = useSearchParams();
  const type = params.get('type');
  const id = Number(params.get('id'));
  const invalidRequest = !id || !['plan', 'consultation'].includes(type || '');
  const [item, setItem] = useState<Purchasable | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [settings, setSettings] = useState<PaymentSettings>({ onlinePaymentEnabled: false, cardToCardEnabled: false, cardNumber: '', cardHolder: '' });
  const [method, setMethod] = useState<PaymentMethod>('manual');
  const [loading, setLoading] = useState(!invalidRequest);
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [receipt, setReceipt] = useState<File | null>(null);
  const [bankReference, setBankReference] = useState('');
  const [cardLastFour, setCardLastFour] = useState('');
  const [receiptSubmitted, setReceiptSubmitted] = useState(false);
  const [preferredDate, setPreferredDate] = useState('');
  const [preferredTime, setPreferredTime] = useState('');
  const [error, setError] = useState(invalidRequest ? 'لینک سفارش معتبر نیست.' : '');

  useEffect(() => {
    let active = true;
    if (invalidRequest) return;
    const itemUrl = type === 'plan' ? `/plans/${id}` : '/consultations';
    Promise.all([apiClient.get(itemUrl), apiClient.get<PaymentSettings>('/settings/public')])
      .then(([itemResponse, settingsResponse]) => {
        if (!active) return;
        const value = type === 'plan' ? itemResponse.data : (itemResponse.data as Purchasable[]).find(x => x.id === id);
        setItem((value as Purchasable) || null);
        const paymentSettings = settingsResponse.data;
        setSettings(paymentSettings);
        setMethod(paymentSettings.onlinePaymentEnabled ? 'online' : paymentSettings.cardToCardEnabled ? 'card' : 'manual');
      })
      .catch(() => { if (active) setError('آیتم موردنظر یا تنظیمات پرداخت دریافت نشد.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id, type, invalidRequest]);

  const startOnlinePayment = async (orderId: number) => {
    setSubmitting(true);
    setError('');
    try {
      const response = await apiClient.post<{ redirectUrl: string }>(`/payments/zarinpal/start/${orderId}`);
      window.open(response.data.redirectUrl, '_self');
    } catch (caughtError: unknown) {
      const apiError = caughtError as ApiError;
      setError(apiError.response?.data?.message || 'شروع پرداخت آنلاین انجام نشد؛ سفارش شما محفوظ است.');
      setSubmitting(false);
    }
  };

  const createOrder = async () => {
    if (type === 'consultation' && (!preferredDate || !preferredTime)) {
      setError('تاریخ و بازه زمانی ترجیحی مشاوره را انتخاب کنید.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const payload = type === 'plan'
        ? { type: 1, planId: id }
        : { type: 2, consultationId: id, notes: `زمان ترجیحی مشاوره: ${preferredDate}، ساعت ${preferredTime}` };
      const response = await apiClient.post<Order>('/orders', payload);
      setOrder(response.data);
      window.requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
      if (method === 'online') await startOnlinePayment(response.data.id);
      else setSubmitting(false);
    } catch (caughtError: unknown) {
      const apiError = caughtError as ApiError;
      setError(apiError.response?.data?.message || 'ثبت سفارش انجام نشد؛ لطفاً دوباره تلاش کنید.');
      setSubmitting(false);
    }
  };

  const submitReceipt = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!order || !receipt) {
      setError('ابتدا تصویر یا فایل رسید را انتخاب کنید.');
      return;
    }
    if (cardLastFour && !/^\d{4}$/.test(cardLastFour)) {
      setError('چهار رقم آخر کارت باید دقیقاً ۴ رقم باشد.');
      return;
    }
    setSubmitting(true);
    setError('');
    const body = new FormData();
    body.append('receipt', receipt);
    if (bankReference.trim()) body.append('bankReference', bankReference.trim());
    if (cardLastFour) body.append('cardLastFour', cardLastFour);
    try {
      await apiClient.post(`/payments/card-receipt/${order.id}`, body, { headers: { 'Content-Type': 'multipart/form-data' } });
      setReceiptSubmitted(true);
      setOrder({ ...order, statusName: 'در حال بررسی رسید' });
    } catch (caughtError: unknown) {
      const apiError = caughtError as ApiError;
      setError(apiError.response?.data?.message || 'ارسال رسید انجام نشد؛ فرمت و حجم فایل را بررسی کنید.');
    } finally {
      setSubmitting(false);
    }
  };

  const copyCard = async () => {
    await navigator.clipboard.writeText(settings.cardNumber.replace(/\s/g, ''));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  if (loading) return <PublicLayout><main className="py-16 bg-slate-50 min-h-[70vh]"><Container size="md"><Skeleton className="h-80 rounded-2xl" /></Container></main></PublicLayout>;

  return <PublicLayout><main className="py-10 sm:py-16 bg-slate-50 min-h-[70vh]"><Container size="md">
    {order ? <Card padding="lg" className="checkout-success-card">
      <div className="checkout-success-hero">
        <span className="checkout-success-icon"><FiCheckCircle aria-hidden="true" /></span>
        <span className="checkout-status-pill">ثبت موفق سفارش</span>
        <h1>سفارش شما با موفقیت ثبت شد</h1>
        <p>اطلاعات سفارش ذخیره شد؛ کد پیگیری را تا پایان فرایند نزد خود نگه دارید.</p>
      </div>
      <div className="checkout-tracking-panel">
        <div><span><FiHash aria-hidden="true" /> کد پیگیری سفارش</span><strong dir="ltr">{order.trackingCode}</strong></div>
        <button type="button" onClick={() => navigator.clipboard.writeText(order.trackingCode)} aria-label="کپی کد پیگیری"><FiCopy aria-hidden="true" /><span>کپی کد</span></button>
      </div>
      {error && <div className="auth-error mb-4" role="alert">{error}</div>}
      {method === 'card' && settings.cardToCardEnabled ? <section className="checkout-card-payment" aria-labelledby="card-payment-title">
        <div className="checkout-card-payment-head">
          <span><FiCreditCard aria-hidden="true" /></span>
          <div><h2 id="card-payment-title">پرداخت کارت‌به‌کارت</h2><p>مبلغ زیر را واریز کنید و رسید را همین‌جا برای بررسی مدیر ثبت کنید.</p></div>
        </div>
        <div className="checkout-payment-summary">
          <div><small>مبلغ قابل پرداخت</small><strong>{order.amount.toLocaleString('fa-IR')} <span>تومان</span></strong></div>
          <span className="checkout-payment-divider" />
          <div><small>وضعیت فعلی</small><strong className="checkout-order-status">{order.statusName}</strong></div>
        </div>
        <div className="checkout-bank-card">
          <div className="checkout-bank-card-brand"><FiCreditCard aria-hidden="true" /><span>اطلاعات حساب مقصد</span></div>
          <code dir="ltr">{settings.cardNumber}</code>
          <div><small>صاحب حساب</small><strong>{settings.cardHolder || 'صاحب حساب'}</strong></div>
          <button type="button" onClick={copyCard}>{copied ? <><FiCheck /> کپی شد</> : <><FiCopy /> کپی شماره کارت</>}</button>
        </div>
        <ol className="checkout-payment-steps">
          <li><span>۱</span><p>شماره کارت را کپی کنید.</p></li>
          <li><span>۲</span><p>مبلغ سفارش را انتقال دهید.</p></li>
          <li><span>۳</span><p>رسید را در فرم زیر بارگذاری کنید.</p></li>
        </ol>
        {receiptSubmitted ? <div className="checkout-receipt-success" role="status">
          <FiCheckCircle aria-hidden="true" />
          <div><strong>رسید ثبت شد</strong><p>پس از بررسی مدیر، وضعیت سفارش در پروفایل شما به‌روزرسانی می‌شود.</p></div>
        </div> : <form className="checkout-receipt-form" onSubmit={submitReceipt} noValidate>
          <div className="checkout-receipt-heading"><FiUploadCloud aria-hidden="true" /><div><strong>بارگذاری رسید پرداخت</strong><small>JPG، PNG، WEBP یا PDF تا سقف ۶ مگابایت</small></div></div>
          <label className={`checkout-receipt-dropzone ${receipt ? 'has-file' : ''}`}>
            <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={event => setReceipt(event.target.files?.[0] || null)} />
            <FiFileText aria-hidden="true" />
            <span>{receipt ? receipt.name : 'انتخاب تصویر یا فایل رسید'}</span>
            {receipt && <small>{(receipt.size / 1024 / 1024).toLocaleString('fa-IR', { maximumFractionDigits: 2 })} مگابایت</small>}
          </label>
          <div className="checkout-receipt-fields">
            <label><span>شماره پیگیری بانکی <small>(اختیاری)</small></span><input value={bankReference} onChange={event => setBankReference(event.target.value)} inputMode="numeric" dir="ltr" /></label>
            <label><span>۴ رقم آخر کارت <small>(اختیاری)</small></span><input value={cardLastFour} onChange={event => setCardLastFour(event.target.value.replace(/\D/g, '').slice(0, 4))} inputMode="numeric" dir="ltr" maxLength={4} /></label>
          </div>
          <Button type="submit" fullWidth loading={submitting} disabled={!receipt}><FiUploadCloud /> ثبت رسید برای بررسی</Button>
        </form>}
      </section> : method === 'online' && <div className="rounded-xl bg-blue-50 p-4 text-blue-800 text-sm">
        سفارش محفوظ است؛ برای انتقال امن به زرین‌پال دوباره تلاش کنید.
        <Button fullWidth className="mt-4" loading={submitting} onClick={() => startOnlinePayment(order.id)}><FiExternalLink /> ادامه پرداخت آنلاین</Button>
      </div>}
      {method === 'manual' && <p className="text-sm text-amber-700 bg-amber-50 p-3 rounded-xl">روش پرداخت آنلاین هنوز فعال نیست؛ وضعیت سفارش «{order.statusName}» باقی می‌ماند.</p>}
      <div className="checkout-success-actions">
        <Link to="/profile" className="btn btn-primary"><FiShoppingBag aria-hidden="true" /> مشاهده سفارش‌ها <FiArrowLeft aria-hidden="true" /></Link>
        <Link to="/" className="checkout-home-link"><FiHome aria-hidden="true" /> بازگشت به خانه</Link>
      </div>
    </Card> : <Card padding="lg">
      <div className="flex items-center gap-3 mb-6"><span className="admin-content-icon"><FiShoppingBag /></span><div><h1 className="text-xl font-black">مرور و ثبت سفارش</h1><p className="text-sm text-slate-500">اطلاعات انتخابت را بررسی کن</p></div></div>
      {error && <div className="auth-error mb-4" role="alert">{error}</div>}
      {item ? <>
        <div className="p-5 rounded-2xl bg-slate-50"><h2 className="font-bold text-lg">{item.name}</h2><p className="text-sm text-slate-500 mt-2">{item.description}</p><div className="mt-5"><PriceDisplay amount={item.price} size="lg" /></div></div>
        {type === 'consultation' && <section className="checkout-schedule" aria-labelledby="checkout-schedule-title">
          <div className="checkout-schedule-title"><span><FiCalendar aria-hidden="true" /></span><div><h3 id="checkout-schedule-title">زمان ترجیحی جلسه</h3><p>مدیر پس از پرداخت، زمان نهایی را با شما هماهنگ می‌کند.</p></div></div>
          <div className="checkout-schedule-grid">
            <PersianDatePicker label="تاریخ ترجیحی" value={preferredDate} onChange={setPreferredDate} />
            <div><label className="form-label" htmlFor="preferred-time"><FiClock aria-hidden="true" /> بازه زمانی</label><select id="preferred-time" className="form-input" value={preferredTime} onChange={event => setPreferredTime(event.target.value)}><option value="">انتخاب ساعت…</option><option value="۰۹:۰۰ تا ۱۱:۰۰">۰۹:۰۰ تا ۱۱:۰۰</option><option value="۱۱:۰۰ تا ۱۳:۰۰">۱۱:۰۰ تا ۱۳:۰۰</option><option value="۱۴:۰۰ تا ۱۶:۰۰">۱۴:۰۰ تا ۱۶:۰۰</option><option value="۱۶:۰۰ تا ۱۸:۰۰">۱۶:۰۰ تا ۱۸:۰۰</option><option value="۱۸:۰۰ تا ۲۰:۰۰">۱۸:۰۰ تا ۲۰:۰۰</option></select></div>
          </div>
        </section>}
        {(settings.onlinePaymentEnabled || settings.cardToCardEnabled) && <div className="mt-5"><h3 className="font-bold mb-3">روش پرداخت</h3><div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {settings.onlinePaymentEnabled && <button type="button" onClick={() => setMethod('online')} className={`text-right rounded-2xl border p-4 transition ${method === 'online' ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-100' : 'border-slate-200 bg-white'}`}><FiCreditCard className="text-blue-600 mb-2" /><strong className="block">پرداخت آنلاین</strong><small className="text-slate-500">انتقال امن به زرین‌پال</small></button>}
          {settings.cardToCardEnabled && <button type="button" onClick={() => setMethod('card')} className={`text-right rounded-2xl border p-4 transition ${method === 'card' ? 'border-amber-500 bg-amber-50 ring-2 ring-amber-100' : 'border-slate-200 bg-white'}`}><FiCreditCard className="text-amber-600 mb-2" /><strong className="block">کارت‌به‌کارت</strong><small className="text-slate-500">نمایش شماره کارت بعد از ثبت</small></button>}
        </div></div>}
        <div className="flex items-center gap-2 text-sm text-slate-500 my-5"><FiShield /> مبلغ و شناسه سفارش در سمت سرور اعتبارسنجی می‌شود.</div>
        <Button fullWidth size="lg" loading={submitting} onClick={createOrder}><FiCreditCard /> {method === 'online' ? 'ثبت و پرداخت آنلاین' : 'ثبت سفارش'}</Button>
      </> : !error && <div className="auth-error">آیتم موردنظر در دسترس نیست.</div>}
    </Card>}
  </Container></main></PublicLayout>;
};

export default CheckoutPage;
