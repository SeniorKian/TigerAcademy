import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '@/api/apiClient';
import { FiCheck, FiArrowRight, FiStar, FiShield, FiPhone } from 'react-icons/fi';
import { Container, Button, Card, PriceDisplay, Skeleton } from '@/design-system';
import PublicLayout from './PublicLayout';

interface Plan {
  id: number;
  name: string;
  description: string;
  price: number;
  features: string[];
  imageUrl?: string;
  videoUrl?: string;
  isActive: boolean;
}

const PlanDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    apiClient.get(`/plans/${id}`).then(response => { if (active) setPlan(response.data); }).catch(() => undefined).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  if (loading) {
    return (
      <PublicLayout>
        <div className="py-12" style={{ background: '#F8FAFC' }}>
          <Container size="lg">
            <Skeleton className="h-8 w-32 mb-4" />
            <Skeleton className="h-64 w-full mb-6" />
            <Skeleton className="h-6 w-48 mb-4" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-3/4" />
          </Container>
        </div>
      </PublicLayout>
    );
  }

  if (!plan) {
    return (
      <PublicLayout>
        <div className="flex flex-col items-center justify-center min-h-[50vh]" style={{ background: '#F8FAFC' }}>
          <p className="text-lg font-bold mb-4 text-neutral-dark">طرح یافت نشد</p>
          <Button variant="primary" onClick={() => navigate('/')}>بازگشت به صفحه اصلی</Button>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <div className="py-8 sm:py-12" style={{ background: '#F8FAFC' }}>
        <Container size="lg">
          {/* Back button */}
          <button onClick={() => navigate('/')}
            className="flex items-center gap-2 mb-6 text-sm font-medium transition cursor-pointer hover:opacity-80"
            style={{ color: '#1E3A5F' }}>
            <FiArrowRight /> بازگشت
          </button>

          <Card padding="none" className="overflow-hidden">
            {/* Banner */}
            {plan.videoUrl && /(?:youtube\.com|youtu\.be|aparat\.com)/i.test(plan.videoUrl) ? (
              <div className="w-full aspect-video bg-slate-900 flex items-center justify-center">
                <iframe src={plan.videoUrl} className="w-full h-full" allowFullScreen title={plan.name} />
              </div>
            ) : plan.videoUrl ? (
              <video src={plan.videoUrl} controls preload="metadata" className="w-full aspect-video bg-black" />
            ) : plan.imageUrl ? (
              <div className="w-full h-48 sm:h-64 bg-slate-100">
                <img src={plan.imageUrl} alt={plan.name} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-full h-32 sm:h-40 flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #1E3A5F, #2563EB)' }}>
                <FiStar className="text-5xl" style={{ color: '#ca8a04' }} />
              </div>
            )}

            <div className="p-6 sm:p-8 lg:p-10">
              {/* Title + Price */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
                <div className="flex-1">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-dark">{plan.name}</h1>
                  <p className="mt-2 text-sm sm:text-base text-neutral-secondary leading-relaxed">{plan.description}</p>
                </div>
                <PriceDisplay amount={plan.price} size="lg" />
              </div>

              {/* Features */}
              {plan.features && plan.features.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-base font-bold text-neutral-dark mb-4">ویژگی‌های این طرح</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {plan.features.map((feature, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: '#F8FAFC' }}>
                        <span className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ background: '#DCFCE7' }}>
                          <FiCheck className="text-[11px]" style={{ color: '#16A34A' }} />
                        </span>
                        <span className="text-sm text-neutral-foreground">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Trust Badges */}
              <div className="flex flex-wrap gap-3 mb-8">
                {[
                  { icon: FiShield, text: 'پرداخت امن' },
                  { icon: FiStar, text: 'تضمین کیفیت' },
                  { icon: FiPhone, text: 'پشتیبانی ۲۴ ساعته' },
                ].map((badge) => (
                  <span key={badge.text} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium"
                    style={{ background: '#DCFCE7', color: '#166534' }}>
                    <badge.icon /> {badge.text}
                  </span>
                ))}
              </div>

              {/* CTA */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button variant="accent" size="lg" fullWidth onClick={() => navigate(`/checkout?type=plan&id=${plan.id}`)}>
                  خرید این طرح
                </Button>
                <Button variant="secondary" size="lg" fullWidth onClick={() => window.location.href = 'tel:09124054575'}>
                  <FiPhone /> مشاوره رایگان
                </Button>
              </div>

              {/* Security note */}
              <p className="mt-4 flex items-center gap-2 text-xs text-neutral-muted-foreground">
                <FiShield /> تمامی اطلاعات شما با رمزنگاری AES-256 محافظت می‌شود
              </p>
            </div>
          </Card>
        </Container>
      </div>
    </PublicLayout>
  );
};

export default PlanDetail;
