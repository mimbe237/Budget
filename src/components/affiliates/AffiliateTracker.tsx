"use client";

import { useEffect } from 'react';

const STORAGE_KEYS = {
  code: 'aff:code',
  deviceId: 'aff:deviceId',
  clickId: 'aff:clickId',
  ts: 'aff:ts',
  expiry: 'aff:expiry',
} as const;

function setCookie(name: string, value: string, days: number) {
  const d = new Date();
  d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
  const expires = 'expires=' + d.toUTCString();
  document.cookie = `${name}=${value};${expires};path=/;SameSite=Lax`;
}

function getCookie(name: string) {
  const cname = name + '=';
  const decodedCookie = decodeURIComponent(document.cookie);
  const ca = decodedCookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1);
    if (c.indexOf(cname) === 0) return c.substring(cname.length, c.length);
  }
  return '';
}

export function AffiliateTracker() {
  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      const aff = url.searchParams.get('aff');
      if (!aff) return;

      const utm_source = url.searchParams.get('utm_source') || '';
      const utm_medium = url.searchParams.get('utm_medium') || '';
      const utm_campaign = url.searchParams.get('utm_campaign') || '';
      const landing = url.origin + url.pathname;
      const referer = document.referrer || '';

      // Persist code
      localStorage.setItem(STORAGE_KEYS.code, aff);
      setCookie('aff', aff, 90);

      const trackUrl = process.env.NEXT_PUBLIC_TRACK_CLICK_URL;
      if (!trackUrl) return; // No network tracking configured

      const params = new URLSearchParams({ aff, utm_source, utm_medium, landing });
      if (utm_campaign) params.append('utm_campaign', utm_campaign);
      if (referer) params.append('referer', referer);

      fetch(`${trackUrl}?${params.toString()}`, {
        method: 'GET',
        credentials: 'include',
      })
        .then((r) => r.json().catch(() => ({})))
        .then((data) => {
          if (data?.deviceId) localStorage.setItem(STORAGE_KEYS.deviceId, data.deviceId);
          if (data?.clickId) localStorage.setItem(STORAGE_KEYS.clickId, data.clickId);
          if (data?.cookieDays) setCookie('aff', aff, Number(data.cookieDays) || 90);
          localStorage.setItem(STORAGE_KEYS.ts, Date.now().toString());
          const expiryDays = Number(data?.cookieDays) || 90;
          localStorage.setItem(STORAGE_KEYS.expiry, (Date.now() + expiryDays * 86400000).toString());
        })
        .catch(() => {
          // Silent fail
        });
    } catch (e) {
      // ignore
    }
  }, []);

  return null;
}
