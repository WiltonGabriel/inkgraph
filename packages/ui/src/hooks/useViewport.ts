import { useState, useEffect } from 'react';

export interface ViewportInfo {
  readonly width: number;
  readonly isMobile: boolean;
  readonly isTablet: boolean;
  readonly isDesktop: boolean;
}

function getViewportInfo(): ViewportInfo {
  const width = typeof window !== 'undefined' ? window.innerWidth : 1280;
  return {
    width,
    isMobile: width < 768,
    isTablet: width >= 768 && width < 1100,
    isDesktop: width >= 1100,
  };
}

export function useViewport(): ViewportInfo {
  const [info, setInfo] = useState<ViewportInfo>(getViewportInfo);

  useEffect(() => {
    const onResize = () => setInfo(getViewportInfo());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return info;
}
