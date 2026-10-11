import React, { useRef, useState, useEffect } from 'react';

interface MagneticButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
  strength?: number; // Distance multiplier (default: 0.3)
}

export const MagneticButton: React.FC<MagneticButtonProps> = ({
  children,
  className = '',
  strength = 0.28,
  onClick,
  ...rest
}) => {
  const btnRef = useRef<HTMLButtonElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    // Detect touch device or reduced motion preference
    const touchQuery = window.matchMedia('(pointer: coarse)');
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const check = () => {
      setIsTouch(touchQuery.matches || motionQuery.matches);
    };
    check();
    touchQuery.addEventListener?.('change', check);
    motionQuery.addEventListener?.('change', check);
    return () => {
      touchQuery.removeEventListener?.('change', check);
      motionQuery.removeEventListener?.('change', check);
    };
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (isTouch || !btnRef.current) return;
    const { clientX, clientY } = e;
    const { left, top, width, height } = btnRef.current.getBoundingClientRect();
    const centerX = left + width / 2;
    const centerY = top + height / 2;
    const deltaX = (clientX - centerX) * strength;
    const deltaY = (clientY - centerY) * strength;
    setPosition({ x: deltaX, y: deltaY });
  };

  const handleMouseLeave = () => {
    if (!isTouch) {
      setPosition({ x: 0, y: 0 });
    }
  };

  return (
    <button
      ref={btnRef}
      className={`magnetic-btn ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      style={
        isTouch
          ? undefined
          : {
              transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
              transition:
                position.x === 0 && position.y === 0
                  ? 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
                  : 'transform 0.1s linear',
            }
      }
      {...rest}
    >
      {children}
    </button>
  );
};

export default MagneticButton;
