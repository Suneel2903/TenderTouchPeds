'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

type Direction = 'left' | 'right';

interface Props {
  direction: Direction;
  children: ReactNode;
}

export default function AnimatedOnScroll({ direction, children }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
          } else {
            // Hide again so animation replays when scrolling back
            setVisible(false);
          }
        });
      },
      { threshold: 0.3 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const animClass =
    direction === 'left' ? 'motion-safe:animate-fade-in-left' : 'motion-safe:animate-fade-in-right';

  return (
    <div
      ref={ref}
      className={visible ? animClass : 'opacity-0 translate-y-2 transition-opacity duration-300'}
    >
      {children}
    </div>
  );
}



