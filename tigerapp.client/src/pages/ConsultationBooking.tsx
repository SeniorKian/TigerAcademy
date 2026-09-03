import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiCheck, FiClock, FiMapPin, FiPhone, FiShield, FiUsers } from 'react-icons/fi';
import apiClient from '@/api/apiClient';
import { Container } from '@/design-system';
import PublicLayout from './PublicLayout';

interface Consultation {
  id: number;
  name: string;
  type: number;
  typeName: string;
  city?: string;
  durationMinutes?: number;
  price: number;
  description?: string;
  isActive: boolean;
}

type ConsultationFilter = 'all' | 'phone' | 'inperson' | 'online';

const formatPrice = (value: number) => new Intl.NumberFormat('fa-IR').format(value);

const ConsultationBooking: React.FC = () => {
  const navigate = useNavigate();
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ConsultationFilter>('all');

  useEffect(() => {
    const loadConsultations = async () => {
      try {
        const response = await apiClient.get('/consultations');
        const data = Array.isArray(response.data) ? response.data : [];
        setConsultations(data.filter((consultation: Consultation) => consultation.isActive));
      } catch (error) {
        console.error('Failed to load consultations:', error);
      } finally {
        setLoading(false);
      }
    };

    void loadConsultations();
  }, []);

  const filtered = consultations.filter((consultation) => {
    if (filter === 'phone') return consultation.type === 0;
    if (filter === 'inperson') return consultation.type === 1;
    if (filter === 'online') return consultation.type === 2;
    return true;
  });

  return (
    <PublicLayout>
      <section className="inner-page-hero">
        <Container size="xl">
          <div className="inner-page-hero-content">
            <span><FiPhone aria-hidden="true" /> یک گفت‌وگوی حرفه‌ای برای یک تصمیم مهم</span>
            <h1>جلسه مشاوره‌ات را انتخاب کن</h1>
            <p>تلفنی یا حضوری، کوتاه یا کامل؛ گزینه‌ای را بردار که با نیاز و شرایط تو هماهنگ‌تر است.</p>
          </div>
        </Container>
      </section>

      <section className="consultation-page">
        <Container size="xl">
          <div className="consultation-toolbar">
            <div>
              <span>جلسه‌های فعال</span>
              <h2>مشاوره تخصصی انتخاب رشته</h2>
            </div>
            <div className="consultation-filters" role="group" aria-label="فیلتر نوع مشاوره">
              {([
                { key: 'all', label: 'همه', icon: FiUsers },
                { key: 'phone', label: 'تلفنی', icon: FiPhone },
                { key: 'inperson', label: 'حضوری', icon: FiMapPin },
                { key: 'online', label: 'آنلاین', icon: FiUsers },
              ] as const).map((item) => (
                <button
                  key={item.key}
                  type="button"
                  className={filter === item.key ? 'is-active' : ''}
                  onClick={() => setFilter(item.key)}
                  aria-pressed={filter === item.key}
                >
                  <item.icon aria-hidden="true" /> {item.label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="consultation-grid" aria-label="در حال بارگذاری مشاوره‌ها">
              {Array.from({ length: 4 }).map((_, index) => <div key={index} className="consultation-card consultation-card-skeleton" />)}
            </div>
          ) : filtered.length > 0 ? (
            <div className="consultation-grid">
              {filtered.map((consultation) => (
                <article key={consultation.id} className="consultation-card">
                  <div className="consultation-card-top">
                    <span className={`consultation-type-icon ${consultation.type === 1 ? 'is-gold' : ''}`}>
                      {consultation.type === 0 ? <FiPhone aria-hidden="true" /> : consultation.type === 1 ? <FiMapPin aria-hidden="true" /> : <FiUsers aria-hidden="true" />}
                    </span>
                    <span className="consultation-kind">{consultation.type === 0 ? 'مشاوره تلفنی' : consultation.type === 1 ? 'مشاوره حضوری' : 'مشاوره آنلاین'}</span>
                  </div>
                  <h3>{consultation.name}</h3>
                  <p>{consultation.description}</p>
                  <div className="consultation-meta">
                    {consultation.durationMinutes && <span><FiClock aria-hidden="true" /> {consultation.durationMinutes} دقیقه</span>}
                    {consultation.city && <span><FiMapPin aria-hidden="true" /> {consultation.city}</span>}
                  </div>
                  <div className="consultation-card-footer">
                    <div className="consultation-price"><strong>{formatPrice(consultation.price)}</strong><small>تومان</small></div>
                    <button type="button" onClick={() => navigate(`/checkout?type=consultation&id=${consultation.id}`)}>رزرو جلسه <FiArrowLeft aria-hidden="true" /></button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="consultation-empty">
              <FiPhone aria-hidden="true" />
              <h3>در حال حاضر جلسه‌ای در این دسته موجود نیست</h3>
              <p>می‌توانی دسته دیگری را انتخاب کنی یا با ما تماس بگیری.</p>
            </div>
          )}

          <div className="consultation-benefits">
            {[
              { icon: FiShield, title: '۳۲ سال تجربه', text: 'تصمیم‌گیری بر پایه تجربه واقعی' },
              { icon: FiUsers, title: 'مشاور متخصص', text: 'همراهی متناسب با شرایط شما' },
              { icon: FiCheck, title: 'پشتیبانی کامل', text: 'کنارتان تا ثبت انتخاب نهایی' },
            ].map((benefit) => (
              <div key={benefit.title}>
                <span><benefit.icon aria-hidden="true" /></span>
                <p><strong>{benefit.title}</strong><small>{benefit.text}</small></p>
              </div>
            ))}
          </div>
        </Container>
      </section>
    </PublicLayout>
  );
};

export default ConsultationBooking;
