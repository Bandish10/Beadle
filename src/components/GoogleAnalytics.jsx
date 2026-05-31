import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;

export default function GoogleAnalytics() {
  const location = useLocation();

  useEffect(() => {
    if (!measurementId || document.getElementById('ga-loader')) return;

    const loader = document.createElement('script');
    loader.id = 'ga-loader';
    loader.async = true;
    loader.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    document.head.appendChild(loader);

    const config = document.createElement('script');
    config.id = 'ga-config';
    config.text = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${measurementId}', { send_page_view: false });
    `;
    document.head.appendChild(config);
  }, []);

  useEffect(() => {
    if (!measurementId || typeof window.gtag !== 'function') return;
    window.gtag('event', 'page_view', {
      page_path: `${location.pathname}${location.search}`,
      page_title: document.title,
    });
  }, [location.pathname, location.search]);

  return null;
}
