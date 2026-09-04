import React, { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { FiCompass, FiMapPin } from 'react-icons/fi';
import { useLocation } from 'react-router-dom';

type LoaderPhase = 'visible' | 'leaving' | 'hidden';

interface ActiveRouteLoaderProps {
  initial: boolean;
  onComplete: () => void;
}

const ActiveRouteLoader: React.FC<ActiveRouteLoaderProps> = ({ initial, onComplete }) => {
  const [phase, setPhase] = useState<LoaderPhase>('visible');

  useLayoutEffect(() => {
    const root = document.documentElement;
    const previousScrollBehavior = root.style.scrollBehavior;
    root.style.scrollBehavior = 'auto';
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    document.querySelectorAll<HTMLElement>('[data-route-scroll-container]')
      .forEach(element => element.scrollTo({ top: 0, left: 0, behavior: 'auto' }));
    root.style.scrollBehavior = previousScrollBehavior;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const visibleFor = reducedMotion ? 280 : initial ? 950 : 520;
    const exitFor = reducedMotion ? 0 : 260;
    const leaveTimer = window.setTimeout(() => setPhase('leaving'), visibleFor);
    const removeTimer = window.setTimeout(() => {
      onComplete();
      setPhase('hidden');
    }, visibleFor + exitFor);

    return () => {
      window.clearTimeout(leaveTimer);
      window.clearTimeout(removeTimer);
    };
  }, [initial, onComplete]);

  const active = phase !== 'hidden';
  useEffect(() => {
    if (!active) return;
    const previousOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    return () => { document.documentElement.style.overflow = previousOverflow; };
  }, [active]);

  useEffect(() => {
    const previous = window.history.scrollRestoration;
    window.history.scrollRestoration = 'manual';
    return () => { window.history.scrollRestoration = previous; };
  }, []);

  if (!active) return null;

  return (
    <div
      className={`route-preloader ${phase === 'leaving' ? 'is-leaving' : ''}`}
      role="status"
      aria-live="polite"
      aria-label="در حال آماده‌سازی صفحه"
      aria-busy="true"
    >
      <div className="route-preloader-glow" aria-hidden="true" />
      <div className="route-preloader-content">
        <div className="route-preloader-emblem" aria-hidden="true">
          <span className="route-preloader-orbit"><i /></span>
          <FiCompass />
        </div>

        <div className="route-preloader-copy">
          <strong>تایگر آکادمی</strong>
          <span>در حال آماده‌سازی مسیر آینده شما…</span>
        </div>

        <div className="route-preloader-path" aria-hidden="true">
          <span className="route-path-point is-start"><FiMapPin /></span>
          <i><b /></i>
          <span className="route-path-point is-finish"><FiMapPin /></span>
        </div>
      </div>
    </div>
  );
};

const PageTransitionLoader: React.FC = () => {
  const location = useLocation();
  const routeKey = `${location.pathname}${location.search}`;
  const [initialLoad, setInitialLoad] = useState(true);
  const completeInitialLoad = useCallback(() => setInitialLoad(false), []);
  return (
    <ActiveRouteLoader
      key={routeKey}
      initial={initialLoad}
      onComplete={completeInitialLoad}
    />
  );
};

export default PageTransitionLoader;
