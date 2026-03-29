import React, { useEffect, useState } from 'react';
import axiosInstance from '../../../axios';

type Props = {
  proxyUrl: string | null;
  alt: string;
  className?: string;
};

/**
 * Loads proxied training avatar via axios (Bearer + cookies); plain &lt;img src&gt; would omit Authorization.
 */
const TrainingAvatarImg: React.FC<Props> = ({ proxyUrl, alt, className }) => {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    if (!proxyUrl) {
      setSrc(null);
      return;
    }
    let cancelled = false;
    let objectUrl: string | null = null;
    axiosInstance
      .get(proxyUrl, { responseType: 'blob' })
      .then((r) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(r.data);
        setSrc(objectUrl);
      })
      .catch(() => {
        if (!cancelled) setSrc(null);
      });
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [proxyUrl]);

  if (!src) return null;
  return <img src={src} alt={alt} className={className} />;
};

export default TrainingAvatarImg;
