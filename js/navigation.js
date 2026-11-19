/**
 * ============================================================================
 * NAVIGATION.JS — 4 ПУНКТА ИНТЕРАКТИВНОГО ОБЪЯСНЕНИЯ ТЕМЫ (СТР. 110)
 * + ПОЛНЫЙ ЛИСТ «ЧТО ЗАПИСАТЬ В ТЕТРАДЬ»
 * ============================================================================
 */

window.LessonNavigation = (function () {
  'use strict';

  const LEVELS = [
    {
      id: 1,
      shortTitle: 'Что такое КУБ',
      fullTitle: 'Пункт 1. Куб: 6 квадратных граней, 12 равных рёбер и объём в пространстве'
    },
    {
      id: 2,
      shortTitle: 'Что такое КУБОИД',
      fullTitle: 'Пункт 2. Кубоид: 6 прямоугольных или 4 прямоугольные и 2 квадратные грани'
    },
    {
      id: 3,
      shortTitle: 'ОБЪЁМ жидкости (Кран)',
      fullTitle: 'Пункт 3. Объём жидкости в мензурках под краном: литры (л) и миллилитры (мл)'
    },
    {
      id: 4,
      shortTitle: 'ЁМКОСТЬ посуды (Кран)',
      fullTitle: 'Пункт 4. Ёмкость посуды: наполняем бутылку и сосуды водой из крана доверху'
    },
    {
      id: 5,
      shortTitle: '✍️ Запись в тетрадь',
      fullTitle: 'Готовый конспект в тетрадь по всем 4 пунктам темы'
    }
  ];

  function renderLevelsTrack(containerEl, activeLevelId, completedLevelsSet, onSelectLevel) {
    if (!containerEl) return;
    containerEl.innerHTML = '';

    LEVELS.forEach((lvl) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      const isActive = lvl.id === activeLevelId;
      const isDone = completedLevelsSet && completedLevelsSet.has(lvl.id);
      const isNotebook = lvl.id === 5;

      btn.className =
        'level-pill' +
        (isActive ? ' active' : '') +
        (isDone ? ' completed' : '') +
        (isNotebook ? ' notebook-pill' : '');
      btn.setAttribute('aria-current', isActive ? 'step' : 'false');
      btn.title = lvl.fullTitle;

      btn.innerHTML = `
        <span class="level-num">${isNotebook ? '📓' : (isDone && !isActive ? '✓' : lvl.id)}</span>
        <span class="level-title-text">${lvl.shortTitle}</span>
      `;

      btn.addEventListener('click', () => {
        if (typeof onSelectLevel === 'function') {
          onSelectLevel(lvl.id);
        }
      });

      containerEl.appendChild(btn);
    });
  }

  return {
    LEVELS,
    renderLevelsTrack
  };
})();
