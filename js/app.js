/**
 * ============================================================================
 * APP.JS — ЧИСТОЕ ИНТЕРАКТИВНОЕ ОБЪЯСНЕНИЕ ТЕМЫ (СТР. 110) + ЗАПИСЬ В ТЕТРАДЬ
 * Включает определения: что такое ГРАНЬ, РЕБРО, ВЕРШИНА, КУБ, КУБОИД,
 * ОБЪЁМ ЖИДКОСТИ, ЁМКОСТЬ ПОСУДЫ и обозначение объёма в математике через V.
 * ============================================================================
 */

(function () {
  'use strict';

  const AppState = {
    currentLevel: 1, // 1..4 (интерактивное объяснение) | 5 (полный лист записи в тетрадь)
    completedLevels: new Set(),
    activeCanvasController: null,
    revealedStepsCount: 1
  };

  // ==========================================================================
  // СОДЕРЖАНИЕ 4 ПУНКТОВ ОБЪЯСНЕНИЯ ТЕМЫ (СТРОГО ПО СТР. 110 БЕЗ ФОРМУЛ)
  // + ТОЧНЫЙ ТЕКСТ «ЧТО ЗАПИСАТЬ В ТЕТРАДЬ» ДЛЯ КАЖДОГО ПУНКТА
  // ==========================================================================
  const LESSON_TOPICS = {
    1: {
      badge: 'Пункт 1 из 4 • Стр. 110 учебника',
      title: '1. Что такое КУБ? Грани, рёбра, вершины и объём V',
      actionHint: 'Покрутите 3D-куб пальцем на 360°, разберите его на 6 квадратов и по очереди нажмите кнопки «🟦 6 Граней», «📏 12 Рёбер», «⚪ 8 Вершин» и «📦 Место в пространстве (объём V)».',
      scene: {
        type: 'cube',
        title: '3D-Куб: 6 граней, 12 равных рёбер, 8 вершин и объём V',
        rotX: -24,
        rotY: 36,
        explodeAmount: 0,
        highlightPart: 'faces'
      },
      steps: [
        {
          badgeType: 'square',
          symbol: 'Грани (6)',
          label: '1) Что такое ГРАНЬ? (нажмите «🟦 6 Граней» и «🧩 Разобрать»):',
          expr: 'Грань — это плоская сторона фигуры. У куба 6 равных квадратных граней'
        },
        {
          badgeType: 'cube',
          symbol: 'Рёбра (12) и Вершины (8)',
          label: '2) Что такое РЕБРО и ВЕРШИНА? (нажмите «📏 12 Рёбер» и «⚪ 8 Вершин»):',
          expr: 'Ребро — отрезок на стыке двух граней (все 12 рёбер куба равны). Вершина — точка (уголок), где сходятся рёбра (у куба 8 вершин)'
        },
        {
          badgeType: 'cube',
          symbol: 'Объём V',
          label: '3) Почему у куба есть объём и какой буквой он обозначается?',
          expr: 'Куб занимает место в пространстве, поэтому имеет объём. В математике объём обозначается заглавной латинской буквой V'
        }
      ],
      notebookTitle: '✍️ Записать в тетрадь (Пункт 1 — Куб, грани, рёбра, вершины и V):',
      notebookLines: [
        '1. КУБ — объёмная фигура (занимает место в пространстве, имеет объём V).',
        '• ГРАНЬ — плоская сторона фигуры. У куба 6 равных квадратных граней.',
        '• РЕБРО — отрезок (линия), где соединяются две грани. У куба 12 равных рёбер.',
        '• ВЕРШИНА — точка (уголок), где сходятся три ребра. У куба 8 вершин.',
        '• В математике ОБЪЁМ обозначается латинской буквой V.'
      ]
    },

    2: {
      badge: 'Пункт 2 из 4 • Стр. 110 учебника',
      title: '2. Что такое КУБОИД? (Два вида кубоида в 3D-пространстве)',
      actionHint: 'Переключайте под чертежом «Вид 1 (6 прямоугольников)» и «Вид 2 (4 прямоугольника и 2 квадрата)», крутите кубоид пальцем и разбирайте его на грани!',
      scene: {
        type: 'cuboid',
        title: '3D-Кубоид: 6 граней, 12 рёбер, 8 вершин и объём V',
        cuboidVariant: '6rect',
        rotX: -24,
        rotY: 36,
        explodeAmount: 0,
        highlightPart: 'faces'
      },
      steps: [
        {
          badgeType: 'rect',
          symbol: 'Вид 1',
          label: '1) Первый вид кубоида (как коробка или книга):',
          expr: 'Все 6 граней — ПРЯМОУГОЛЬНИКИ (противоположные грани равны)'
        },
        {
          badgeType: 'square',
          symbol: 'Вид 2',
          label: '2) Второй вид кубоида (нажмите «Вид 2» под чертежом):',
          expr: '4 грани — ПРЯМОУГОЛЬНЫЕ, а 2 боковые грани — КВАДРАТНЫЕ'
        },
        {
          badgeType: 'cuboid',
          symbol: 'V • 6 • 12 • 8',
          label: '3) Грани, рёбра, вершины и объём V кубоида:',
          expr: 'У любого кубоида 6 граней, 12 рёбер, 8 вершин и есть объём V в пространстве'
        }
      ],
      notebookTitle: '✍️ Записать в тетрадь (Пункт 2 — Кубоид):',
      notebookLines: [
        '2. КУБОИД — объёмная фигура (занимает место в пространстве, имеет объём V).',
        '• Грани кубоида (6 шт.): 6 прямоугольных ИЛИ 4 прямоугольные и 2 квадратные грани.',
        '• Противоположные грани и рёбра кубоида попарно равны.',
        '• У кубоида: 6 граней, 12 рёбер и 8 вершин.'
      ]
    },

    3: {
      badge: 'Пункт 3 из 4 • Стр. 110 учебника',
      title: '3. ОБЪЁМ жидкости (V): кран с водой и мерные мензурки (л и мл)',
      actionHint: 'Нажмите на вентиль КРАНА на чертеже (или кнопку «🚰 Открыть кран»), чтобы наливать воду в большую мензурку (1 л = 1000 мл) и малую мензурку (100..500 мл)!',
      scene: {
        type: 'liquid',
        title: 'Интерактивный кран с водой и две мензурки со стр. 110',
        tapTarget: 'main',
        mainBeakerMl: 500,
        smallBeakerMl: 300
      },
      steps: [
        {
          badgeType: 'liquid',
          symbol: 'Объём V',
          label: '1) Почему у жидкости есть объём V?',
          expr: 'Жидкость в ёмкости занимает определённое пространство — значит, у неё есть ОБЪЁМ (обозначается буквой V)'
        },
        {
          badgeType: 'liquid',
          symbol: 'л и мл',
          label: '2) В чём измеряют объём жидкости V?',
          expr: 'Объём жидкости V измеряется в литрах (л / l) или миллилитрах (мл / ml)'
        },
        {
          badgeType: 'liquid',
          symbol: '1 л = 1000 мл',
          label: '3) Как связаны литр и миллилитр на шкале мензурки?',
          expr: 'В 1 литре 1000 миллилитров: 1 л = 1000 мл (половина литра: V = 500 мл)'
        }
      ],
      notebookTitle: '✍️ Записать в тетрадь (Пункт 3 — Объём жидкости V):',
      notebookLines: [
        '3. ОБЪЁМ ЖИДКОСТИ (V) — жидкость в сосуде занимает место в пространстве, значит, имеет объём V.',
        '• Объём в математике обозначается заглавной латинской буквой V.',
        '• Единицы измерения объёма жидкости: литр (л) и миллилитр (мл).',
        '• 1 л = 1000 мл   (половина литра: V = 500 мл).'
      ]
    },

    4: {
      badge: 'Пункт 4 из 4 • Стр. 110 учебника',
      title: '4. ЁМКОСТЬ посуды: наполняем бутылку и сосуды из крана доверху',
      actionHint: 'Откройте кран над бутылкой на деревянном столе (или выберите стакан, банку, кувшин) и наполните посуду водой до самого верха!',
      scene: {
        type: 'capacity',
        title: 'Кран с водой и бутылка на столе (стр. 110)',
        selectedVesselKey: 'bottle1000',
        vesselMl: 400
      },
      steps: [
        {
          badgeType: 'bottle',
          symbol: 'Определение',
          label: '1) Что такое ёмкость посуды (правило №4 со стр. 110)?',
          expr: 'Ёмкость посуды — это объём жидкости V, необходимый для заполнения этой посуды доверху'
        },
        {
          badgeType: 'bottle',
          symbol: 'Разница',
          label: '2) В чём отличие объёма воды сейчас от ёмкости бутылки?',
          expr: 'В бутылке может быть налито V = 400 мл воды, а до краёв она вмещает V = 1000 мл (1 л) — это её ЁМКОСТЬ'
        },
        {
          badgeType: 'bottle',
          symbol: 'Примеры',
          label: '3) Примеры ёмкости разной посуды (проверьте под краном):',
          expr: 'Стакан = 250 мл • Банка = 500 мл • Бутылка = 1 л (1000 мл) • Кувшин = 1500 мл'
        }
      ],
      notebookTitle: '✍️ Записать в тетрадь (Пункт 4 — Ёмкость посуды):',
      notebookLines: [
        '4. ЁМКОСТЬ ПОСУДЫ — это объём жидкости (V), необходимый для полного заполнения этой посуды.',
        '• Пример: чтобы заполнить бутылку доверху, нужен объём воды V = 1000 мл (1 л) — значит, ёмкость бутылки равна 1 л.'
      ]
    }
  };

  // ==========================================================================
  // ИНИЦИАЛИЗАЦИЯ И СОБЫТИЯ
  // ==========================================================================
  function initApp() {
    bindHeaderControls();
    bindDockControls();
    renderNavigationBar();
    renderWorkspace();
  }

  function bindHeaderControls() {
    const nbHeaderBtn = document.getElementById('openNotebookSheetBtn');
    if (nbHeaderBtn) {
      nbHeaderBtn.addEventListener('click', () => {
        selectLevel(5);
      });
    }

    const fsHeaderBtn = document.getElementById('fullscreenHeaderBtn');
    if (fsHeaderBtn) {
      fsHeaderBtn.addEventListener('click', toggleFullscreen);
    }
  }

  function bindDockControls() {
    const prevBtn = document.getElementById('dockPrevStepBtn');
    const nextBtn = document.getElementById('dockNextStepBtn');
    const sepBtn = document.getElementById('dockSeparateToggleBtn');
    const repeatBtn = document.getElementById('dockRepeatBtn');
    const nbDockBtn = document.getElementById('dockNotebookBtn');
    const fsBtn = document.getElementById('dockFullscreenBtn');

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        if (AppState.currentLevel > 1) {
          selectLevel(AppState.currentLevel - 1);
        }
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        AppState.completedLevels.add(AppState.currentLevel);
        if (AppState.currentLevel < 5) {
          selectLevel(AppState.currentLevel + 1);
        } else {
          selectLevel(1);
        }
      });
    }

    if (sepBtn) {
      sepBtn.addEventListener('click', () => {
        if (AppState.activeCanvasController) {
          AppState.activeCanvasController.toggleExplode();
        }
      });
    }

    if (repeatBtn) {
      repeatBtn.addEventListener('click', () => {
        if (AppState.activeCanvasController) {
          AppState.activeCanvasController.resetScene();
        }
        AppState.revealedStepsCount = 1;
        renderWorkspace();
      });
    }

    if (nbDockBtn) {
      nbDockBtn.addEventListener('click', () => {
        selectLevel(5);
      });
    }

    if (fsBtn) {
      fsBtn.addEventListener('click', toggleFullscreen);
    }
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }

  function selectLevel(levelId) {
    AppState.currentLevel = levelId;
    AppState.revealedStepsCount = 1;
    renderNavigationBar();
    renderWorkspace();
  }

  function renderNavigationBar() {
    const trackEl = document.getElementById('levelsTrackContainer');
    window.LessonNavigation.renderLevelsTrack(
      trackEl,
      AppState.currentLevel,
      AppState.completedLevels,
      (lvlId) => selectLevel(lvlId)
    );
  }

  function renderWorkspace() {
    const root = document.getElementById('workspaceRoot');
    if (!root) return;

    if (AppState.activeCanvasController && typeof AppState.activeCanvasController.destroy === 'function') {
      AppState.activeCanvasController.destroy();
      AppState.activeCanvasController = null;
    }

    if (AppState.currentLevel === 5) {
      renderFullNotebookPage(root);
      return;
    }

    renderTopicExplanation(root, AppState.currentLevel);
  }

  // ==========================================================================
  // ПАНЕЛЬ ИНСТРУМЕНТОВ ПОД 3D-ЧЕРТЕЖОМ ИЛИ КРАНОМ
  // ==========================================================================
  function buildCanvasToolbarHTML(scene) {
    const isLiquid = scene.type === 'liquid';
    const isCapacity = scene.type === 'capacity';
    const isCuboid = scene.type === 'cuboid';

    if (isLiquid) {
      return `
        <div class="canvas-controls-strip">
          <div class="control-btn-group" style="display:flex;flex-wrap:wrap;gap:6px;width:100%;align-items:center;">
            <button type="button" class="action-btn primary" id="btnToggleWaterTap">
              🚰 Открыть кран (наливать воду)
            </button>
            <button type="button" class="action-btn" id="btnPourPlus100">
              ➕ Налить +100 мл
            </button>
            <button type="button" class="action-btn" id="btnPourPlus50">
              ➕ Налить +50 мл
            </button>
            <button type="button" class="action-btn" id="btnPourMinus100">
              ➖ Отлить 100 мл
            </button>
            <button type="button" class="action-btn" id="btnTransferBeakers">
              🫗 Перелить из малой в большую
            </button>
            <button type="button" class="action-btn" id="btnDrainWater">
              💧 Слить воду (0 мл)
            </button>
          </div>
          <div class="control-btn-group" style="display:flex;flex-wrap:wrap;gap:6px;width:100%;margin-top:4px;align-items:center;">
            <span style="font-size:12.5px;font-weight:800;color:var(--text-secondary);">Куда направлен кран:</span>
            <button type="button" class="action-btn active-highlight" id="btnTargetBigBeaker">
              🥛 Большая мензурка (1 л = 1000 мл)
            </button>
            <button type="button" class="action-btn" id="btnTargetSmallBeaker">
              🥛 Малая мензурка (100..500 мл)
            </button>
            <button type="button" class="action-btn" id="btnResetSceneAction" style="margin-left:auto;">
              ↺ Сбросить
            </button>
          </div>
        </div>
      `;
    }

    if (isCapacity) {
      return `
        <div class="canvas-controls-strip">
          <div class="control-btn-group" style="display:flex;flex-wrap:wrap;gap:6px;width:100%;align-items:center;">
            <button type="button" class="action-btn primary" id="btnToggleWaterTap">
              🚰 Открыть кран (наполнять посуду)
            </button>
            <button type="button" class="action-btn" id="btnPourPlus250">
              🫗 Налить стакан (+250 мл)
            </button>
            <button type="button" class="action-btn" id="btnPourPlus100">
              ➕ Налить +100 мл
            </button>
            <button type="button" class="action-btn" id="btnDrainWater">
              💧 Опустошить посуду (0 мл)
            </button>
          </div>
          <div class="control-btn-group" style="display:flex;flex-wrap:wrap;gap:6px;width:100%;margin-top:4px;align-items:center;">
            <span style="font-size:12.5px;font-weight:800;color:var(--text-secondary);">Выберите посуду на столе:</span>
            <button type="button" class="action-btn vessel-select-btn active-highlight" data-vessel="bottle1000">
              🍾 Бутылка (1 л = 1000 мл)
            </button>
            <button type="button" class="action-btn vessel-select-btn" data-vessel="glass250">
              🥛 Стакан (250 мл)
            </button>
            <button type="button" class="action-btn vessel-select-btn" data-vessel="jar500">
              🫙 Банка (500 мл)
            </button>
            <button type="button" class="action-btn vessel-select-btn" data-vessel="jug1500">
              🏺 Кувшин (1500 мл)
            </button>
          </div>
        </div>
      `;
    }

    return `
      <div class="canvas-controls-strip">
        <div class="control-btn-group" style="display:flex;flex-wrap:wrap;gap:6px;width:100%;align-items:center;">
          <button type="button" class="action-btn primary" id="btnExplode3DToggle">
            🧩 Разобрать в пространстве на 6 граней
          </button>
          <button type="button" class="action-btn" id="btnFlatSixView">
            📐 Все 6 граней рядом (плоско)
          </button>
          <button type="button" class="action-btn active-highlight" id="btnToolRotate3D">
            🔄 Крутить 3D пальцем
          </button>
          <button type="button" class="action-btn" id="btnToolPullFaces">
            🖐 Тянуть грани пальцем
          </button>
          <button type="button" class="action-btn" id="btnAutoRotate3D">
            🎥 Авто-вращение 360°
          </button>
          <button type="button" class="action-btn" id="btnResetSceneAction">
            ↺ Собрать
          </button>
        </div>

        <div class="control-btn-group" style="display:flex;flex-wrap:wrap;gap:8px;width:100%;margin-top:4px;align-items:center;">
          <label for="explodeRangeSlider" style="font-size:12.5px;font-weight:800;color:var(--text-secondary);display:flex;align-items:center;gap:6px;">
            <span>💥 Раздвинуть грани:</span>
            <input type="range" id="explodeRangeSlider" min="0" max="115" value="${scene.explodeAmount || 0}" style="width:120px;accent-color:#0284C7;cursor:pointer;" />
          </label>

          <button type="button" class="action-btn part-filter-btn active-highlight" data-part="faces">
            🟦 6 Граней
          </button>
          <button type="button" class="action-btn part-filter-btn" data-part="edges">
            📏 12 Рёбер
          </button>
          <button type="button" class="action-btn part-filter-btn" data-part="vertices">
            ⚪ 8 Вершин
          </button>
          <button type="button" class="action-btn part-filter-btn" data-part="space">
            📦 Объём (V)
          </button>
        </div>

        ${isCuboid ? `
        <div class="control-btn-group" style="display:flex;flex-wrap:wrap;gap:6px;width:100%;margin-top:4px;align-items:center;">
          <span style="font-size:12.5px;font-weight:800;color:#5B21B6;">Два вида кубоида (стр. 110 п. 2):</span>
          <button type="button" class="action-btn cuboid-variant-btn ${scene.cuboidVariant !== '4rect2sq' ? 'active-highlight' : ''}" data-variant="6rect">
            🟣 Вид 1: Все 6 граней — прямоугольники
          </button>
          <button type="button" class="action-btn cuboid-variant-btn ${scene.cuboidVariant === '4rect2sq' ? 'active-highlight' : ''}" data-variant="4rect2sq">
            🔷 Вид 2: 4 прямоугольные и 2 квадратные грани
          </button>
        </div>
        ` : ''}
      </div>
    `;
  }

  function wireCanvasToolbarEvents(ctrl) {
    if (!ctrl) return;

    const explodeBtn = document.getElementById('btnExplode3DToggle');
    const flatSixBtn = document.getElementById('btnFlatSixView');
    const rotateToolBtn = document.getElementById('btnToolRotate3D');
    const pullToolBtn = document.getElementById('btnToolPullFaces');
    const autoRotBtn = document.getElementById('btnAutoRotate3D');
    const resetBtn = document.getElementById('btnResetSceneAction');
    const explodeSlider = document.getElementById('explodeRangeSlider');

    if (explodeBtn) explodeBtn.addEventListener('click', () => ctrl.toggleExplode());
    if (flatSixBtn) {
      flatSixBtn.addEventListener('click', () => {
        const st = ctrl.getState();
        ctrl.setViewMode(st.viewMode === 'flat6' ? '3d' : 'flat6');
      });
    }
    if (rotateToolBtn && pullToolBtn) {
      rotateToolBtn.addEventListener('click', () => {
        ctrl.setPointerTool('rotate');
        rotateToolBtn.classList.add('active-highlight');
        pullToolBtn.classList.remove('active-highlight');
      });
      pullToolBtn.addEventListener('click', () => {
        ctrl.setPointerTool('pullFace');
        pullToolBtn.classList.add('active-highlight');
        rotateToolBtn.classList.remove('active-highlight');
      });
    }
    if (autoRotBtn) {
      autoRotBtn.addEventListener('click', () => {
        const active = ctrl.toggleAutoRotate();
        autoRotBtn.textContent = active ? '⏸ Стоп вращение' : '🎥 Авто-вращение 360°';
      });
    }
    if (explodeSlider) {
      explodeSlider.addEventListener('input', (e) => ctrl.setExplodeAmount(Number(e.target.value)));
    }

    document.querySelectorAll('.part-filter-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const part = btn.getAttribute('data-part');
        ctrl.setHighlightPart(part);
        document.querySelectorAll('.part-filter-btn').forEach((b) =>
          b.classList.toggle('active-highlight', b.getAttribute('data-part') === part)
        );
      });
    });

    document.querySelectorAll('.cuboid-variant-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const variant = btn.getAttribute('data-variant');
        ctrl.setCuboidVariant(variant);
        document.querySelectorAll('.cuboid-variant-btn').forEach((b) =>
          b.classList.toggle('active-highlight', b.getAttribute('data-variant') === variant)
        );
      });
    });

    const tapBtn = document.getElementById('btnToggleWaterTap');
    const plus100Btn = document.getElementById('btnPourPlus100');
    const plus50Btn = document.getElementById('btnPourPlus50');
    const plus250Btn = document.getElementById('btnPourPlus250');
    const minus100Btn = document.getElementById('btnPourMinus100');
    const transferBtn = document.getElementById('btnTransferBeakers');
    const drainBtn = document.getElementById('btnDrainWater');
    const targetBigBtn = document.getElementById('btnTargetBigBeaker');
    const targetSmallBtn = document.getElementById('btnTargetSmallBeaker');

    if (tapBtn) tapBtn.addEventListener('click', () => ctrl.toggleTap());
    if (plus100Btn) plus100Btn.addEventListener('click', () => ctrl.pourPortionMl(100));
    if (plus50Btn) plus50Btn.addEventListener('click', () => ctrl.pourPortionMl(50));
    if (plus250Btn) plus250Btn.addEventListener('click', () => ctrl.pourPortionMl(250));
    if (minus100Btn) minus100Btn.addEventListener('click', () => ctrl.pourPortionMl(-100));
    if (transferBtn) transferBtn.addEventListener('click', () => ctrl.transferSmallToBigBeaker());
    if (drainBtn) drainBtn.addEventListener('click', () => ctrl.drainAllWater());

    if (targetBigBtn && targetSmallBtn) {
      targetBigBtn.addEventListener('click', () => {
        ctrl.setTapTarget('main');
        targetBigBtn.classList.add('active-highlight');
        targetSmallBtn.classList.remove('active-highlight');
      });
      targetSmallBtn.addEventListener('click', () => {
        ctrl.setTapTarget('small');
        targetSmallBtn.classList.add('active-highlight');
        targetBigBtn.classList.remove('active-highlight');
      });
    }

    document.querySelectorAll('.vessel-select-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const vKey = btn.getAttribute('data-vessel');
        ctrl.selectVessel(vKey);
        document.querySelectorAll('.vessel-select-btn').forEach((b) =>
          b.classList.toggle('active-highlight', b.getAttribute('data-vessel') === vKey)
        );
      });
    });

    if (resetBtn) resetBtn.addEventListener('click', () => ctrl.resetScene());
  }

  function syncToolbarWithCanvasState(state) {
    const explodeBtn = document.getElementById('btnExplode3DToggle');
    if (explodeBtn) {
      const nextExplodeText = state.isExploded
        ? '🧊 Собрать 3D-фигуру обратно'
        : '🧩 Разобрать в пространстве на 6 граней';
      if (explodeBtn.textContent.trim() !== nextExplodeText) {
        explodeBtn.textContent = nextExplodeText;
      }
    }

    const flatSixBtn = document.getElementById('btnFlatSixView');
    if (flatSixBtn) {
      const nextFlatText = state.viewMode === 'flat6'
        ? '🧊 Вернуть 3D-фигуру'
        : '📐 Все 6 граней рядом (плоско)';
      if (flatSixBtn.textContent.trim() !== nextFlatText) {
        flatSixBtn.textContent = nextFlatText;
      }
    }

    const explodeSlider = document.getElementById('explodeRangeSlider');
    if (explodeSlider && Number(explodeSlider.value) !== state.explodeAmount) {
      explodeSlider.value = String(state.explodeAmount);
    }

    const tapBtn = document.getElementById('btnToggleWaterTap');
    if (tapBtn) {
      const nextTapText = state.tapOpen
        ? '🚱 Закрыть кран (остановить воду)'
        : '🚰 Открыть кран (наливать воду)';
      if (tapBtn.textContent.trim() !== nextTapText) {
        tapBtn.textContent = nextTapText;
      }
    }

    const dockSepBtn = document.getElementById('dockSeparateToggleBtn');
    if (dockSepBtn) {
      const nextDockText = (state.type === 'liquid' || state.type === 'capacity')
        ? (state.tapOpen ? '🚱 Закрыть кран' : '🚰 Открыть кран')
        : (state.isExploded ? '🧊 Собрать грани' : '🧩 Разобрать на грани');
      if (dockSepBtn.textContent.trim() !== nextDockText) {
        dockSepBtn.textContent = nextDockText;
      }
    }
  }

  // ==========================================================================
  // РЕНДЕР ПУНКТОВ 1–4: ИНТЕРАКТИВНЫЙ 3D-ЧЕРТЁЖ + ОБЪЯСНЕНИЕ + ЗАПИСЬ В ТЕТРАДЬ
  // ==========================================================================
  function renderTopicExplanation(root, levelId) {
    const data = LESSON_TOPICS[levelId] || LESSON_TOPICS[1];
    const totalSteps = data.steps.length;
    const shownCount = Math.min(totalSteps, AppState.revealedStepsCount);

    root.innerHTML = `
      <div class="lesson-grid">
        <!-- ЛЕВАЯ ЧАСТЬ: Интерактивная 3D-фигура или Кран с водой -->
        <section class="canvas-panel" aria-label="Интерактивная демонстрация">
          <div class="canvas-topbar">
            <div class="canvas-title-block">
              <span class="level-badge">${data.badge}</span>
              <span class="canvas-title">${data.title}</span>
            </div>
          </div>

          <div class="svg-canvas-wrapper" id="mainGeometryCanvas"></div>

          ${buildCanvasToolbarHTML(data.scene)}
        </section>

        <!-- ПРАВАЯ ЧАСТЬ: Пошаговое объяснение + Тетрадный лист «Что записать в тетрадь» -->
        <aside class="explanation-panel" aria-label="Объяснение и запись в тетрадь">
          <div class="step-card">
            <div class="task-condition-box">
              <div class="task-condition-title">🖐 Что показываем на доске</div>
              <div class="task-condition-text" style="font-size:14px;color:#0369A1;">${data.actionHint}</div>
            </div>

            <!-- Пошаговое объяснение -->
            <div class="step-reveal-bar">
              <button type="button" class="step-reveal-btn" id="btnRevealNextStep" ${shownCount >= totalSteps ? 'disabled' : ''}>
                ${shownCount >= totalSteps
                  ? `✓ Показаны все шаги объяснения (${totalSteps} из ${totalSteps})`
                  : `➕ Показать следующий шаг объяснения (${shownCount + 1} из ${totalSteps})`}
              </button>
              ${shownCount > 1 ? `
                <button type="button" class="step-reset-btn" id="btnResetSteps">
                  ↺ Сначала
                </button>
              ` : ''}
            </div>

            <div class="formula-box">
              ${data.steps.slice(0, shownCount).map((st, idx) => `
                <div class="formula-line ${idx === shownCount - 1 ? 'highlight' : ''}">
                  <span style="font-weight:800;color:var(--text-secondary);">${st.label}</span>
                  <span style="display:inline-flex;align-items:center;gap:6px;flex-wrap:wrap;font-weight:900;color:var(--text-primary);">
                    <span class="area-Sub">
                      ${window.Geometry3D.renderMiniShapeBadgeSVG(st.badgeType)}
                      <span>${st.symbol}</span>
                    </span>
                    <span>— ${st.expr}</span>
                  </span>
                </div>
              `).join('')}
            </div>

            <!-- ТЕТРАДНЫЙ ЛИСТ В КЛЕТОЧКУ: ЧТО ЗАПИСАТЬ В ТЕТРАДЬ ПО ЭТОМУ ПУНКТУ -->
            <div class="notebook-sheet-box">
              <div class="notebook-sheet-header">
                <span>${data.notebookTitle}</span>
                <span class="notebook-tag">В тетрадь</span>
              </div>
              <div class="notebook-sheet-body">
                ${data.notebookLines.map((line, i) => `
                  <div class="notebook-line ${i === 0 ? 'notebook-main-def' : ''}">${line}</div>
                `).join('')}
              </div>
            </div>

            <div style="display:flex;gap:8px;margin-top:4px;flex-wrap:wrap;">
              <button type="button" class="action-btn primary" id="btnGoNextLevelInline" style="flex:1;justify-content:center;">
                ${levelId < 4 ? `Следующий пункт (${levelId + 1} из 4) ▶` : '📓 Открыть весь конспект в тетрадь ▶'}
              </button>
            </div>
          </div>
        </aside>
      </div>
    `;

    const canvasContainer = document.getElementById('mainGeometryCanvas');
    AppState.activeCanvasController = window.Geometry3D.createInteractiveCanvas(
      canvasContainer,
      data.scene,
      {
        onStateChange(st) {
          syncToolbarWithCanvasState(st);
        }
      }
    );

    wireCanvasToolbarEvents(AppState.activeCanvasController);

    const revealBtn = document.getElementById('btnRevealNextStep');
    if (revealBtn) {
      revealBtn.addEventListener('click', () => {
        if (AppState.revealedStepsCount < totalSteps) {
          AppState.revealedStepsCount++;
          if (AppState.activeCanvasController && typeof AppState.activeCanvasController.destroy === 'function') {
            AppState.activeCanvasController.destroy();
          }
          renderTopicExplanation(root, levelId);
        }
      });
    }

    const resetStepsBtn = document.getElementById('btnResetSteps');
    if (resetStepsBtn) {
      resetStepsBtn.addEventListener('click', () => {
        AppState.revealedStepsCount = 1;
        if (AppState.activeCanvasController && typeof AppState.activeCanvasController.destroy === 'function') {
          AppState.activeCanvasController.destroy();
        }
        renderTopicExplanation(root, levelId);
      });
    }

    const nextLvlBtn = document.getElementById('btnGoNextLevelInline');
    if (nextLvlBtn) {
      nextLvlBtn.addEventListener('click', () => {
        AppState.completedLevels.add(levelId);
        selectLevel(levelId + 1);
      });
    }
  }

  // ==========================================================================
  // ПУНКТ 5: ПОЛНЫЙ ТЕТРАДНЫЙ ЛИСТ В КЛЕТОЧКУ НА ВЕСЬ ЭКРАН ДЛЯ КЛАССА
  // ==========================================================================
  function renderFullNotebookPage(root) {
    root.innerHTML = `
      <div class="full-notebook-wrapper">
        <div class="full-notebook-sheet">
          <div class="full-notebook-margin-line" aria-hidden="true"></div>

          <div class="full-notebook-content">
            <div class="full-notebook-top-row">
              <span class="notebook-badge-pill">✍️ Запишите в рабочую тетрадь</span>
              <span class="notebook-page-ref">Учебник, стр. 110</span>
            </div>

            <h2 class="full-notebook-topic-title">Тема: «Куб, кубоид, объём (V) и ёмкость»</h2>

            <!-- ВАЖНЫЙ БЛОК: ОПРЕДЕЛЕНИЯ ГРАНИ, РЕБРА, ВЕРШИНЫ И ОБЪЁМА V -->
            <div class="notebook-rule-block" style="margin-bottom:16px;border-left-color:#D97706;border-color:#FCD34D;background:rgba(255, 251, 235, 0.94);">
              <div class="notebook-rule-text">
                <div class="nb-heading" style="color:#B45309;">📌 Основные понятия (записать в тетрадь):</div>
                <div class="nb-line">• 🟦 <strong>ГРАНЬ</strong> — это плоская сторона (многоугольник: квадрат или прямоугольник) объёмной фигуры.</div>
                <div class="nb-line">• 🟧 <strong>РЕБРО</strong> — это отрезок (линия), по которому соединяются две соседние грани.</div>
                <div class="nb-line">• 🟥 <strong>ВЕРШИНА</strong> — это точка (уголок), в которой сходятся три ребра.</div>
                <div class="nb-line nb-formula-highlight">
                  📦 <strong>ОБЪЁМ</strong> в математике обозначается заглавной латинской буквой <strong>V</strong> (любая фигура или жидкость, занимающая место в пространстве, имеет объём <strong>V</strong>).
                </div>
              </div>

              <!-- Наглядный чертёж с указателями Вершины, Ребра и Грани -->
              <div class="notebook-sketch-box">
                <svg viewBox="0 0 245 170" width="230" height="160" aria-label="Схема вершины, ребра и грани на кубе">
                  <defs>
                    <pattern id="nbGrid0" width="20" height="20" patternUnits="userSpaceOnUse">
                      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#BAE6FD" stroke-width="1"/>
                    </pattern>
                  </defs>
                  <rect width="245" height="170" fill="url(#nbGrid0)" rx="8"/>
                  <!-- Задний квадрат -->
                  <rect x="65" y="25" width="76" height="76" fill="none" stroke="#0284C7" stroke-width="1.8" stroke-dasharray="4 4"/>
                  <line x1="35" y1="55" x2="65" y2="25" stroke="#0369A1" stroke-width="2.2"/>
                  <line x1="111" y1="55" x2="141" y2="25" stroke="#0369A1" stroke-width="2.2"/>
                  <line x1="35" y1="131" x2="65" y2="101" stroke="#0284C7" stroke-width="1.8" stroke-dasharray="4 4"/>
                  <!-- Выделенное оранжевым цветом РЕБРО -->
                  <line x1="111" y1="131" x2="141" y2="101" stroke="#D97706" stroke-width="4.2"/>
                  <!-- Передняя ГРАНЬ -->
                  <rect x="35" y="55" width="76" height="76" fill="rgba(56, 189, 248, 0.25)" stroke="#0369A1" stroke-width="2.5"/>
                  <!-- Красная точка ВЕРШИНА -->
                  <circle cx="141" cy="25" r="5.5" fill="#DC2626" stroke="#FFFFFF" stroke-width="1.5"/>

                  <!-- Подписи со стрелками -->
                  <line x1="147" y1="25" x2="168" y2="25" stroke="#DC2626" stroke-width="2"/>
                  <text x="172" y="29" fill="#991B1B" font-size="11.5" font-weight="900">Вершина</text>

                  <line x1="128" y1="114" x2="168" y2="114" stroke="#D97706" stroke-width="2"/>
                  <text x="172" y="118" fill="#92400E" font-size="11.5" font-weight="900">Ребро</text>

                  <text x="73" y="96" text-anchor="middle" fill="#0C4A6E" font-size="12" font-weight="900">Грань</text>
                  <text x="122" y="158" text-anchor="middle" fill="#065F46" font-size="11.5" font-weight="900">Объём фигуры — V</text>
                </svg>
              </div>
            </div>

            <div class="full-notebook-grid-cards">
              <!-- 1. КУБ -->
              <div class="notebook-rule-block">
                <div class="notebook-rule-text">
                  <div class="nb-heading">1. КУБ</div>
                  <div class="nb-line">• <strong>Куб</strong> — объёмная фигура (имеет <strong>объём V</strong>, так как занимает место в пространстве).</div>
                  <div class="nb-line">• У куба <strong>6 квадратных граней</strong> (все 6 граней — равные квадраты).</div>
                  <div class="nb-line">• У куба <strong>12 рёбер</strong> (все рёбра куба равны между собой).</div>
                  <div class="nb-line">• У куба <strong>8 вершин</strong>.</div>
                </div>
                <div class="notebook-sketch-box">
                  <svg viewBox="0 0 200 155" width="185" height="142" aria-label="Рисунок куба по клеточкам в тетради">
                    <rect width="200" height="155" fill="url(#nbGrid0)" rx="8"/>
                    <rect x="70" y="20" width="80" height="80" fill="none" stroke="#0284C7" stroke-width="2" stroke-dasharray="5 4"/>
                    <line x1="40" y1="50" x2="70" y2="20" stroke="#0369A1" stroke-width="2.5"/>
                    <line x1="120" y1="50" x2="150" y2="20" stroke="#0369A1" stroke-width="2.5"/>
                    <line x1="40" y1="130" x2="70" y2="100" stroke="#0284C7" stroke-width="2" stroke-dasharray="5 4"/>
                    <line x1="120" y1="130" x2="150" y2="100" stroke="#0369A1" stroke-width="2.5"/>
                    <rect x="40" y="50" width="80" height="80" fill="rgba(56, 189, 248, 0.16)" stroke="#0369A1" stroke-width="2.8"/>
                    <text x="100" y="148" text-anchor="middle" fill="#0C4A6E" font-size="11.5" font-weight="900">Рисунок: КУБ (4×4 клетки)</text>
                  </svg>
                </div>
              </div>

              <!-- 2. КУБОИД -->
              <div class="notebook-rule-block">
                <div class="notebook-rule-text">
                  <div class="nb-heading">2. КУБОИД</div>
                  <div class="nb-line">• <strong>Кубоид</strong> — объёмная фигура (имеет <strong>объём V</strong>, так как занимает место в пространстве).</div>
                  <div class="nb-line">• В кубоиде <strong>6 прямоугольных</strong> ИЛИ <strong>4 прямоугольные и 2 квадратные грани</strong>.</div>
                  <div class="nb-line">• Противоположные грани кубоида попарно равны.</div>
                  <div class="nb-line">• У кубоида <strong>6 граней, 12 рёбер и 8 вершин</strong>.</div>
                </div>
                <div class="notebook-sketch-box">
                  <svg viewBox="0 0 220 155" width="200" height="142" aria-label="Рисунок кубоида по клеточкам в тетради">
                    <rect width="220" height="155" fill="url(#nbGrid0)" rx="8"/>
                    <rect x="60" y="25" width="120" height="60" fill="none" stroke="#7C3AED" stroke-width="2" stroke-dasharray="5 4"/>
                    <line x1="30" y1="55" x2="60" y2="25" stroke="#5B21B6" stroke-width="2.5"/>
                    <line x1="150" y1="55" x2="180" y2="25" stroke="#5B21B6" stroke-width="2.5"/>
                    <line x1="30" y1="115" x2="60" y2="85" stroke="#7C3AED" stroke-width="2" stroke-dasharray="5 4"/>
                    <line x1="150" y1="115" x2="180" y2="85" stroke="#5B21B6" stroke-width="2.5"/>
                    <rect x="30" y="55" width="120" height="60" fill="rgba(167, 139, 250, 0.18)" stroke="#5B21B6" stroke-width="2.8"/>
                    <text x="110" y="148" text-anchor="middle" fill="#4C1D95" font-size="11.5" font-weight="900">Рисунок: КУБОИД (6×3 клетки)</text>
                  </svg>
                </div>
              </div>

              <!-- 3. ОБЪЁМ ЖИДКОСТИ (V) -->
              <div class="notebook-rule-block">
                <div class="notebook-rule-text">
                  <div class="nb-heading">3. ОБЪЁМ ЖИДКОСТИ (V)</div>
                  <div class="nb-line">• Жидкость в ёмкости занимает определённое пространство — значит, у неё есть <strong>объём (V)</strong>.</div>
                  <div class="nb-line">• Объём жидкости <strong>V</strong> измеряется в <strong>литрах (л)</strong> или <strong>миллилитрах (мл)</strong>.</div>
                  <div class="nb-line nb-formula-highlight">📌 Запомнить: <strong>1 л = 1000 мл</strong> &nbsp;&nbsp;|&nbsp;&nbsp; <strong>пол-литра: V = 500 мл</strong></div>
                </div>
              </div>

              <!-- 4. ЁМКОСТЬ ПОСУДЫ -->
              <div class="notebook-rule-block">
                <div class="notebook-rule-text">
                  <div class="nb-heading">4. ЁМКОСТЬ ПОСУДЫ</div>
                  <div class="nb-line">• <strong>Ёмкость посуды</strong> — это объём жидкости (<strong>V</strong>), необходимый для <strong>полного заполнения</strong> этой посуды доверху.</div>
                  <div class="nb-line">• <em>Пример:</em> если в пустую бутылку до самого верха помещается <strong>V = 1000 мл (1 л)</strong> воды, то <strong>ёмкость этой бутылки = 1 л</strong>.</div>
                </div>
              </div>
            </div>

            <div style="display:flex;gap:10px;justify-content:center;margin-top:16px;flex-wrap:wrap;">
              <button type="button" class="action-btn primary" id="btnBackToInteractive1">
                🧊 Вернуться к 3D-кубу (Пункт 1)
              </button>
              <button type="button" class="action-btn" id="btnBackToInteractive2">
                🟣 К 3D-кубоиду (Пункт 2)
              </button>
              <button type="button" class="action-btn" id="btnBackToInteractive3">
                🚰 К крану и мензуркам (Пункт 3)
              </button>
              <button type="button" class="action-btn" id="btnBackToInteractive4">
                🍾 К ёмкости посуды (Пункт 4)
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    const b1 = document.getElementById('btnBackToInteractive1');
    const b2 = document.getElementById('btnBackToInteractive2');
    const b3 = document.getElementById('btnBackToInteractive3');
    const b4 = document.getElementById('btnBackToInteractive4');
    if (b1) b1.addEventListener('click', () => selectLevel(1));
    if (b2) b2.addEventListener('click', () => selectLevel(2));
    if (b3) b3.addEventListener('click', () => selectLevel(3));
    if (b4) b4.addEventListener('click', () => selectLevel(4));
  }

  document.addEventListener('DOMContentLoaded', initApp);
})();
