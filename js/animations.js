/**
 * ============================================================================
 * ANIMATIONS.JS — УПРАВЛЕНИЕ АНИМАЦИЯМИ И РЕЖИМОМ ПЛАВНОСТИ
 * ============================================================================
 */

window.LessonAnimations = (function () {
  'use strict';

  let reducedMotion = false;

  function isReducedMotion() {
    return reducedMotion;
  }

  function toggleReducedMotion() {
    reducedMotion = !reducedMotion;
    document.body.classList.toggle('reduced-motion', reducedMotion);
    return reducedMotion;
  }

  return {
    isReducedMotion,
    toggleReducedMotion
  };
})();
