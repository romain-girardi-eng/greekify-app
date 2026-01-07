/**
 * useSwipe Hook - Detect swipe gestures for mobile
 */

import { useState, useCallback, useRef } from 'react';

interface SwipeState {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  isSwiping: boolean;
}

interface SwipeConfig {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number; // Minimum distance for swipe
  preventScrollOnSwipe?: boolean;
}

interface SwipeHandlers {
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
}

interface UseSwipeReturn {
  handlers: SwipeHandlers;
  swipeOffset: { x: number; y: number };
  isSwiping: boolean;
}

export function useSwipe(config: SwipeConfig = {}): UseSwipeReturn {
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    threshold = 50,
    preventScrollOnSwipe = true,
  } = config;

  const [swipeOffset, setSwipeOffset] = useState({ x: 0, y: 0 });
  const [isSwiping, setIsSwiping] = useState(false);
  const swipeState = useRef<SwipeState>({
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    isSwiping: false,
  });

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    swipeState.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      currentX: touch.clientX,
      currentY: touch.clientY,
      isSwiping: true,
    };
    setIsSwiping(true);
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!swipeState.current.isSwiping) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - swipeState.current.startX;
    const deltaY = touch.clientY - swipeState.current.startY;

    swipeState.current.currentX = touch.clientX;
    swipeState.current.currentY = touch.clientY;

    // Prevent scrolling if horizontal swipe is dominant
    if (preventScrollOnSwipe && Math.abs(deltaX) > Math.abs(deltaY)) {
      e.preventDefault();
    }

    setSwipeOffset({ x: deltaX, y: deltaY });
  }, [preventScrollOnSwipe]);

  const onTouchEnd = useCallback((_e: React.TouchEvent) => {
    const { startX, startY, currentX, currentY } = swipeState.current;
    const deltaX = currentX - startX;
    const deltaY = currentY - startY;

    // Determine swipe direction
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // Horizontal swipe
      if (deltaX > threshold && onSwipeRight) {
        onSwipeRight();
      } else if (deltaX < -threshold && onSwipeLeft) {
        onSwipeLeft();
      }
    } else {
      // Vertical swipe
      if (deltaY > threshold && onSwipeDown) {
        onSwipeDown();
      } else if (deltaY < -threshold && onSwipeUp) {
        onSwipeUp();
      }
    }

    // Reset state
    swipeState.current.isSwiping = false;
    setIsSwiping(false);
    setSwipeOffset({ x: 0, y: 0 });
  }, [threshold, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown]);

  return {
    handlers: {
      onTouchStart,
      onTouchMove,
      onTouchEnd,
    },
    swipeOffset,
    isSwiping,
  };
}

// Utility to get swipe rating based on direction and offset
export function getSwipeRating(offset: number, threshold: number = 50): number | null {
  const absOffset = Math.abs(offset);

  if (absOffset < threshold) return null;

  // Right swipe = higher rating (good/easy)
  if (offset > 0) {
    if (absOffset > threshold * 2) return 4; // Easy
    return 3; // Good
  }

  // Left swipe = lower rating (again/hard)
  if (offset < 0) {
    if (absOffset > threshold * 2) return 1; // Again
    return 2; // Hard
  }

  return null;
}
