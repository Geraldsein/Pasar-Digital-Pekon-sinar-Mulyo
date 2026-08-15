import React from 'react';
import useScrollReveal from '../lib/useScrollReveal';

export default function AnimatedSection({
  children,
  className = '',
  delay = 0,
  animation = 'fade-up',
  style = {},
}) {
  const [ref, isVisible] = useScrollReveal();

  return (
    <div
      ref={ref}
      className={`animate-on-scroll ${animation} ${isVisible ? 'visible' : ''} ${className}`}
      style={{
        ...style,
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}
