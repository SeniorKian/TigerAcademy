import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FiAlertCircle, FiCheckCircle, FiRefreshCw } from 'react-icons/fi';
import { Card, Container } from '@/design-system';
import PublicLayout from './PublicLayout';

const PaymentResultPage: React.FC = () => {
  const [params] = useSearchParams();
  const status = params.get('status');
  const successful = status === 'success';
  const cancelled = status === 'cancelled';
  const reference = params.get('refId');
  return <PublicLayout><main className="py-14 sm:py-20 bg-slate-50 min-h-[70vh]"><Container size="sm"><Card padding="lg" className="text-center">
    {successful ? <FiCheckCircle className="mx-auto text-6xl text-green-600" /> : cancelled ? <FiAlertCircle className="mx-auto text-6xl text-amber-500" /> : <FiRefreshCw className="mx-auto text-6xl text-red-500" />}
    <h1 className="text-2xl font-black mt-5">{successful ? 'پرداخت با موفقیت تأیید شد' : cancelled ? 'پرداخت لغو شد' : 'پرداخت تأیید نشد'}</h1>
    <p className="text-slate-500 mt-3">{successful ? 'وضعیت سفارش شما به‌صورت خودکار به پرداخت‌شده تغییر کرد.' : cancelled ? 'مبلغی از حساب شما ثبت نشده و می‌توانید دوباره تلاش کنید.' : 'برای بررسی وضعیت یا تلاش مجدد، سفارش خود را در پروفایل باز کنید.'}</p>
    {successful && reference && <div className="mt-5 rounded-xl bg-green-50 p-4"><small className="text-green-700">شماره مرجع</small><code className="block mt-1 text-lg" dir="ltr">{reference}</code></div>}
    <div className="flex flex-col sm:flex-row justify-center gap-3 mt-7"><Link to="/profile" className="btn btn-primary">مشاهده سفارش‌ها</Link><Link to="/" className="btn btn-secondary">بازگشت به سایت</Link></div>
  </Card></Container></main></PublicLayout>;
};

export default PaymentResultPage;
