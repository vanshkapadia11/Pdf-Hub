"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

/**
 * Slim progress bar at the very top of the page. It plays a quick
 * progress animation whenever the route changes, giving instant visual
 * feedback for client-side navigation.
 */
const LoadingBar = () => {
  const pathname = usePathname();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
    setProgress(0);

    const grow = requestAnimationFrame(() => setProgress(75));
    const complete = setTimeout(() => setProgress(100), 180);
    const hide = setTimeout(() => setVisible(false), 500);

    return () => {
      cancelAnimationFrame(grow);
      clearTimeout(complete);
      clearTimeout(hide);
    };
  }, [pathname]);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-[3px] bg-brand-gradient transition-opacity duration-200"
      style={{
        width: `${progress}%`,
        opacity: visible ? (progress >= 100 ? 0 : 1) : 0,
      }}
    />
  );
};

export default LoadingBar;
