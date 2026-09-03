import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiArrowLeft,
  FiAward,
  FiBookOpen,
  FiCalendar,
  FiCheck,
  FiChevronDown,
  FiClock,
  FiCompass,
  FiHeart,
  FiMapPin,
  FiMessageCircle,
  FiPhone,
  FiShield,
  FiStar,
  FiTarget,
  FiTrendingUp,
  FiUsers,
} from 'react-icons/fi';
import apiClient from '@/api/apiClient';
import { Container } from '@/design-system';
import heroJourney from '@/assets/hero-journey.webp';
import PublicLayout from './PublicLayout';

interface Plan {
  id: number;
  name: string;
  description: string;
  price: number;
  features: string[];
}

interface Faq {
  id: number;
  question: string;
  answer: string;
  category: string;
}

interface ManagedContent { id: number; key: string; value: string; type: number; section?: string; order: number; }

const sanitizeHtml = (value: string) => {
  const documentFragment = new DOMParser().parseFromString(value, 'text/html');
  documentFragment.querySelectorAll('script,style,iframe,object,embed,form').forEach(node => node.remove());
  documentFragment.body.querySelectorAll('*').forEach(node => Array.from(node.attributes).forEach(attribute => {
    if (attribute.name.startsWith('on') || /javascript:/i.test(attribute.value)) node.removeAttribute(attribute.name);
  }));
  return documentFragment.body.innerHTML;
};

const formatPrice = (value: number) => new Intl.NumberFormat('fa-IR').format(value);
const formatIndex = (value: number) => new Intl.NumberFormat('fa-IR', {
  minimumIntegerDigits: 2,
  useGrouping: false,
}).format(value);

const SectionTitle: React.FC<{
  eyebrow: string;
  title: React.ReactNode;
  description?: string;
  align?: 'center' | 'start';
  light?: boolean;
}> = ({ eyebrow, title, description, align = 'center', light = false }) => (
  <div className={`landing-section-title ${align === 'start' ? 'is-start' : ''} ${light ? 'is-light' : ''}`}>
    <span className="landing-eyebrow">{eyebrow}</span>
    <h2>{title}</h2>
    {description && <p>{description}</p>}
  </div>
);

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [managedContent, setManagedContent] = useState<ManagedContent[]>([]);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  useEffect(() => {
    const loadLandingData = async () => {
      const [plansResult, faqsResult, contentResult] = await Promise.allSettled([
        apiClient.get('/plans'),
        apiClient.get('/faqs'),
        apiClient.get('/content/home?language=fa'),
      ]);

      if (plansResult.status === 'fulfilled') {
        const data = Array.isArray(plansResult.value.data) ? plansResult.value.data : [];
        setPlans(data.filter((plan: Plan) => plan.id !== undefined));
      } else {
        console.error('Failed to load plans:', plansResult.reason);
      }

      if (faqsResult.status === 'fulfilled') {
        setFaqs(Array.isArray(faqsResult.value.data) ? faqsResult.value.data : []);
      } else {
        console.error('Failed to load FAQs:', faqsResult.reason);
      }

      if (contentResult.status === 'fulfilled') {
        setManagedContent(Array.isArray(contentResult.value.data) ? contentResult.value.data : []);
      }
    };

    void loadLandingData();
  }, []);

  useEffect(() => {
    if (!window.location.hash) return;
    const id = window.location.hash.slice(1);
    window.setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }), 120);
  }, []);

  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const stats = [
    { value: '۳۲+', label: 'سال تجربه تخصصی', icon: FiCalendar },
    { value: '۱۰,۰۰۰+', label: 'انتخاب رشته موفق', icon: FiUsers },
    { value: '۹۸٪', label: 'رضایت داوطلبان', icon: FiHeart },
    { value: '۳', label: 'شعبه فعال', icon: FiMapPin },
  ];

  const services = [
    {
      icon: FiPhone,
      number: '۰۱',
      title: 'مشاوره تلفنی',
      description: 'گفت‌وگوی مستقیم با مشاور متخصص، بدون محدودیت جغرافیایی و متناسب با شرایط شما.',
      action: () => navigate('/consultations'),
    },
    {
      icon: FiUsers,
      number: '۰۲',
      title: 'مشاوره حضوری',
      description: 'جلسه اختصاصی در دفاتر قم، کرج و تهران برای بررسی دقیق انتخاب‌ها و اولویت‌ها.',
      action: () => navigate('/consultations'),
    },
    {
      icon: FiStar,
      number: '۰۳',
      title: 'منتورینگ ویژه',
      description: 'همراهی قدم‌به‌قدم، برنامه‌ریزی اختصاصی و پشتیبانی ویژه تا رسیدن به نتیجه مطلوب.',
      action: () => scrollTo('plans'),
    },
  ];

  const journey = [
    { icon: FiMessageCircle, title: 'شناخت دقیق شما', text: 'علایق، رتبه، شرایط خانوادگی و هدف تحصیلی را کنار هم می‌گذاریم.' },
    { icon: FiCompass, title: 'طراحی مسیر شخصی', text: 'انتخاب‌ها را بر اساس داده واقعی و تجربه ۳۲ ساله اولویت‌بندی می‌کنیم.' },
    { icon: FiTarget, title: 'انتخاب با اطمینان', text: 'تا ثبت نهایی انتخاب رشته همراهتان می‌مانیم و هیچ سؤال بی‌پاسخی نمی‌ماند.' },
  ];

  const achievements = [
    { icon: FiTarget, text: 'بیش از ۱۰,۰۰۰ انتخاب رشته موفق' },
    { icon: FiTrendingUp, text: '۹۸٪ رضایت دانشجویان' },
    { icon: FiShield, text: 'تضمین بازگشت وجه در صورت عدم رضایت' },
    { icon: FiBookOpen, text: 'برنامه‌ریزی اختصاصی برای هر داوطلب' },
  ];

  return (
    <PublicLayout>
      <section className="landing-hero">
        <div className="hero-grid-lines" aria-hidden="true" />
        <Container size="xl">
          <div className="landing-hero-grid">
            <div className="landing-hero-copy">
              <div className="hero-proof-badge">
                <span className="hero-proof-icon"><FiAward aria-hidden="true" /></span>
                <span>بیش از ۳۲ سال تجربه موفق</span>
              </div>

              <h1>
                انتخاب رشته فقط یک فرم نیست؛
                <span>شروع آینده توست.</span>
              </h1>

              <p>
                با راهنمایی <strong>استاد بهرام خدری</strong> و تیم مجرب مشاوران، انتخاب‌هایت را آگاهانه بچین و با خیال آسوده مسیر آینده‌ات را بساز.
              </p>

              <div className="hero-actions">
                <button type="button" className="button-primary" onClick={() => scrollTo('plans')}>
                  مشاهده طرح‌ها <FiArrowLeft aria-hidden="true" />
                </button>
                <button type="button" className="button-secondary-on-dark" onClick={() => navigate('/consultations')}>
                  <FiPhone aria-hidden="true" /> مشاوره رایگان
                </button>
              </div>

              <div className="hero-assurances" aria-label="مزیت‌های خدمات">
                {['مشاوره اولیه رایگان', 'پشتیبانی تا انتخاب نهایی', 'تضمین بازگشت وجه'].map((item) => (
                  <span key={item}><FiCheck aria-hidden="true" /> {item}</span>
                ))}
              </div>
            </div>

            <div className="landing-hero-visual" aria-label="تصویر نمادین مسیر موفقیت تحصیلی">
              <div className="hero-visual-orbit" aria-hidden="true" />
              <div className="hero-visual-frame">
                <img src={heroJourney} alt="مسیر نمادین انتخاب رشته از کتاب تا قطب‌نمای موفقیت" />
              </div>
              <div className="hero-floating-card hero-floating-card-top">
                <FiStar aria-hidden="true" />
                <span><strong>۹۸٪</strong><small>رضایت داوطلبان</small></span>
              </div>
              <div className="hero-floating-card hero-floating-card-bottom">
                <FiClock aria-hidden="true" />
                <span><strong>همراهی کامل</strong><small>تا ثبت انتخاب نهایی</small></span>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <section className="trust-strip" aria-label="آمار تایگر آکادمی">
        <Container size="xl">
          <div className="trust-strip-grid">
            {stats.map((stat) => (
              <div key={stat.label} className="trust-stat">
                <span className="trust-stat-icon"><stat.icon aria-hidden="true" /></span>
                <span><strong>{stat.value}</strong><small>{stat.label}</small></span>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section className="landing-section services-section">
        <Container size="xl">
          <SectionTitle
            eyebrow="خدمات تایگر"
            title={<>هر چیزی که برای یک <span>انتخاب مطمئن</span> لازم داری</>}
            description="از یک گفت‌وگوی کوتاه تا منتورینگ کامل؛ مدل همراهی را متناسب با نیاز خودت انتخاب کن."
          />

          <div className="services-grid">
            {services.map((service, index) => (
              <button
                type="button"
                key={service.title}
                className={`service-card ${index === 0 ? 'is-featured' : ''}`}
                onClick={service.action}
              >
                <span className="service-card-number">{service.number}</span>
                <span className="service-card-icon"><service.icon aria-hidden="true" /></span>
                <span className="service-card-content">
                  <strong>{service.title}</strong>
                  <small>{service.description}</small>
                </span>
                <span className="service-card-action">اطلاعات بیشتر <FiArrowLeft aria-hidden="true" /></span>
              </button>
            ))}
          </div>
        </Container>
      </section>

      <section className="landing-section journey-section">
        <Container size="xl">
          <div className="journey-layout">
            <SectionTitle
              eyebrow="روش کار ما"
              title={<>سه قدم تا یک تصمیم <span>آرام و آگاهانه</span></>}
              description="به‌جای پیشنهادهای کلی، یک مسیر روشن و شخصی برای خودت می‌سازی."
              align="start"
            />

            <div className="journey-steps">
              {journey.map((step, index) => (
                <article key={step.title} className="journey-step">
                  <span className="journey-step-index">{formatIndex(index + 1)}</span>
                  <span className="journey-step-icon"><step.icon aria-hidden="true" /></span>
                  <div>
                    <h3>{step.title}</h3>
                    <p>{step.text}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </Container>
      </section>

      <section className="landing-section mentor-section">
        <Container size="xl">
          <div className="mentor-layout">
            <div className="mentor-portrait-card">
              <div className="mentor-monogram" aria-hidden="true">ب</div>
              <div className="mentor-title">
                <span>مشاور ارشد انتخاب رشته</span>
                <h3>استاد بهرام خدری</h3>
              </div>
              <blockquote>«انتخاب درست، نتیجه شناخت درست از خودت و فرصت‌های پیش روست.»</blockquote>
              <div className="mentor-card-stats">
                <span><strong>۳۲+</strong><small>سال تجربه</small></span>
                <span><strong>۱۰هزار+</strong><small>دانشجوی موفق</small></span>
              </div>
            </div>

            <div className="mentor-copy">
              <SectionTitle
                eyebrow="درباره تایگر"
                title={<>تجربه‌ای که کنار <span>داده و شناخت</span> قرار می‌گیرد</>}
                align="start"
              />
              <p>
                با بیش از ۳۲ سال سابقه تدریس و مشاوره در زمینه انتخاب رشته کنکور، هزاران داوطلب با همراهی استاد بهرام خدری و تیم تایگر به بهترین نتیجه متناسب با شرایط خود رسیده‌اند.
              </p>
              <div className="achievement-grid">
                {achievements.map((achievement) => (
                  <div key={achievement.text} className="achievement-item">
                    <span><achievement.icon aria-hidden="true" /></span>
                    <p>{achievement.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Container>
      </section>

      {managedContent.length > 0 && <section className="landing-section" aria-label="محتوای تازه">
        <Container size="xl"><div className="grid grid-cols-1 md:grid-cols-2 gap-6">{managedContent.map(item => <article key={item.id} className="card overflow-hidden">
          {item.type === 0 && <p className="text-base leading-8 text-slate-700 whitespace-pre-line">{item.value}</p>}
          {(item.type === 1 || item.type === 4) && <img src={item.value} alt={item.key} className="w-full max-h-[420px] object-cover rounded-xl" />}
          {item.type === 2 && <video src={item.value} controls preload="metadata" className="w-full rounded-xl bg-black" />}
          {item.type === 3 && <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: sanitizeHtml(item.value) }} />}
          {item.type === 5 && <div className="grid grid-cols-2 gap-3">{item.value.split(/\r?\n/).filter(Boolean).map(url => <img key={url} src={url} alt="" className="w-full h-48 object-cover rounded-xl" />)}</div>}
        </article>)}</div></Container>
      </section>}

      <section id="plans" className="landing-section plans-section scroll-mt-24">
        <Container size="xl">
          <SectionTitle
            eyebrow="طرح‌های مشاوره"
            title={<>همراهی متناسب با <span>نیاز و هدف تو</span></>}
            description="شفاف، بدون هزینه پنهان و با امکان بررسی کامل جزئیات هر طرح."
          />

          <div className="plans-grid">
            {plans.length === 0 ? (
              Array.from({ length: 3 }).map((_, index) => <div key={index} className="plan-card plan-card-skeleton" aria-hidden="true" />)
            ) : (
              plans.map((plan, index) => {
                const featured = index === Math.min(1, plans.length - 1);
                return (
                  <article key={plan.id} className={`plan-card ${featured ? 'is-featured' : ''}`}>
                    {featured && <span className="plan-popular"><FiStar aria-hidden="true" /> پیشنهاد تایگر</span>}
                    <div className="plan-card-head">
                      <span className="plan-icon"><FiStar aria-hidden="true" /></span>
                      <div><h3>{plan.name}</h3><p>{plan.description}</p></div>
                    </div>
                    <div className="plan-price"><strong>{formatPrice(plan.price)}</strong><span>تومان</span></div>
                    <ul>
                      {(Array.isArray(plan.features) ? plan.features : []).map((feature) => (
                        <li key={feature}><FiCheck aria-hidden="true" /> {feature}</li>
                      ))}
                    </ul>
                    <div className="plan-actions">
                      <button type="button" className="plan-detail-button" onClick={() => navigate(`/plans/${plan.id}`)}>مشاهده جزئیات</button>
                      <button type="button" className="plan-select-button" onClick={() => navigate(`/checkout?type=plan&id=${plan.id}`)}>انتخاب این طرح <FiArrowLeft aria-hidden="true" /></button>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </Container>
      </section>

      {faqs.length > 0 && (
        <section id="faq" className="landing-section faq-section scroll-mt-24">
          <Container size="xl">
            <div className="faq-layout">
              <div className="faq-intro">
                <SectionTitle
                  eyebrow="سوالات متداول"
                  title={<>پاسخ کوتاه برای سؤال‌های <span>مهم تو</span></>}
                  description="اگر پاسخ خودت را پیدا نکردی، مشاوران ما آماده گفت‌وگو هستند."
                  align="start"
                />
                <button type="button" className="faq-contact-button" onClick={() => navigate('/consultations')}>
                  <FiPhone aria-hidden="true" /> گفت‌وگو با مشاور
                </button>
              </div>

              <div className="faq-list">
                {faqs.map((faq, index) => {
                  const open = expandedFaq === faq.id;
                  const contentId = `faq-answer-${faq.id}`;
                  return (
                    <article key={faq.id} className={`faq-item ${open ? 'is-open' : ''}`}>
                      <button
                        type="button"
                        onClick={() => setExpandedFaq(open ? null : faq.id)}
                        aria-expanded={open}
                        aria-controls={contentId}
                      >
                        <span className="faq-number">{formatIndex(index + 1)}</span>
                        <span>{faq.question}</span>
                        <FiChevronDown aria-hidden="true" />
                      </button>
                      <div id={contentId} className="faq-answer" hidden={!open}><p>{faq.answer}</p></div>
                    </article>
                  );
                })}
              </div>
            </div>
          </Container>
        </section>
      )}

      <section id="contact" className="contact-section scroll-mt-24">
        <Container size="xl">
          <div className="contact-panel">
            <div className="contact-copy">
              <span className="contact-icon"><FiPhone aria-hidden="true" /></span>
              <div>
                <h2>اولین قدم را با یک مشاوره رایگان بردار.</h2>
                <p>شرایطت را بگو؛ ما بهترین مسیر همراهی را پیشنهاد می‌دهیم.</p>
              </div>
            </div>
            <div className="contact-phones">
              {['۰۹۱۲-۴۰۵-۴۵۷۵', '۰۹۱۸-۲۰۹-۳۰۳۶', '۰۹۰۲-۲۰۹-۳۰۳۶'].map((phone) => (
                <a key={phone} href={`tel:${phone.replace(/-/g, '')}`} dir="ltr">{phone}</a>
              ))}
            </div>
          </div>
        </Container>
      </section>
    </PublicLayout>
  );
};

export default LandingPage;
