import { useEffect } from 'react';
import { apiUrl, hasRemoteApiBaseUrl } from '../utils/api';

const TEN_MINUTES = 10 * 60 * 1000;

export default function BackendKeepAlive() {
  useEffect(() => {
    if (!hasRemoteApiBaseUrl()) return undefined;

    const ping = () => {
      fetch(apiUrl('/api/health'), {
        method: 'GET',
        cache: 'no-store',
      }).catch(() => {});
    };

    ping();
    const intervalId = window.setInterval(ping, TEN_MINUTES);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  return null;
}
