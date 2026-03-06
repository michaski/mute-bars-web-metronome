import { useRef, useState, useEffect, useCallback } from 'react';

const DISMISS_THRESHOLD = 100;

export function useBottomSheet(isOpen: boolean, onClose: () => void) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef<number | null>(null);
  const [dragDelta, setDragDelta] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Open animation
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      // Trigger animation on next frame so initial translateY(100%) is painted
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsAnimating(true);
        });
      });
    } else {
      setIsAnimating(false);
      // Wait for close animation to finish
      const timer = setTimeout(() => setIsVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [isOpen]);

  const onDragStart = useCallback((e: React.TouchEvent) => {
    dragStartY.current = e.touches[0].clientY;
    setDragDelta(0);
  }, []);

  const onDragMove = useCallback((e: React.TouchEvent) => {
    if (dragStartY.current === null) return;
    const delta = Math.max(0, e.touches[0].clientY - dragStartY.current);
    setDragDelta(delta);
  }, []);

  const onDragEnd = useCallback(() => {
    if (dragDelta > DISMISS_THRESHOLD) {
      onClose();
    }
    dragStartY.current = null;
    setDragDelta(0);
  }, [dragDelta, onClose]);

  const sheetStyle: React.CSSProperties = {
    transform: dragDelta > 0
      ? `translateY(${dragDelta}px)`
      : isAnimating ? 'translateY(0)' : 'translateY(100%)',
    transition: dragDelta > 0 ? 'none' : 'transform 300ms ease-out',
  };

  const backdropStyle: React.CSSProperties = {
    opacity: isAnimating && dragDelta === 0 ? 1 : dragDelta > 0 ? Math.max(0, 1 - dragDelta / 300) : 0,
    transition: dragDelta > 0 ? 'none' : 'opacity 300ms ease-out',
  };

  return {
    sheetRef,
    isVisible,
    sheetStyle,
    backdropStyle,
    dragHandlers: {
      onTouchStart: onDragStart,
      onTouchMove: onDragMove,
      onTouchEnd: onDragEnd,
    },
  };
}
