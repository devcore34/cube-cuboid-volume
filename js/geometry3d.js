/**
 * ============================================================================
 * GEOMETRY3D.JS — ВЫСОКОПРОИЗВОДИТЕЛЬНЫЙ 3D-ДВИЖОК БЕЗ ЛАГОВ (60 FPS)
 * Оптимизирован для электронных досок (мультитач, без тяжёлых SVG-фильтров,
 * рендеринг через requestAnimationFrame) и смартфонов (единый захват
 * указателя на корневом SVG, плавное перетаскивание граней и уровня воды).
 * ============================================================================
 */

window.Geometry3D = (function () {
  'use strict';

  const SVG_NS = 'http://www.w3.org/2000/svg';

  function createSvgEl(tag, attrs = {}) {
    const el = document.createElementNS(SVG_NS, tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (v !== undefined && v !== null) {
        el.setAttribute(k, String(v));
      }
    }
    return el;
  }

  /**
   * 3D-проекция точки (x, y, z) с поворотом на углы rotX (pitch) и rotY (yaw)
   */
  function project3D(pt, rotXDeg, rotYDeg, cx, cy, focalLength) {
    const radY = (rotYDeg * Math.PI) / 180;
    const radX = (rotXDeg * Math.PI) / 180;

    const cosY = Math.cos(radY);
    const sinY = Math.sin(radY);
    const cosX = Math.cos(radX);
    const sinX = Math.sin(radX);

    const x1 = pt.x * cosY + pt.z * sinY;
    const z1 = -pt.x * sinY + pt.z * cosY;
    const y1 = pt.y;

    const y2 = y1 * cosX - z1 * sinX;
    const z2 = y1 * sinX + z1 * cosX;
    const x2 = x1;

    const f = focalLength || 760;
    const perspective = f / Math.max(240, f - z2);

    return {
      x: cx + x2 * perspective,
      y: cy + y2 * perspective,
      z: z2,
      rx: x2,
      ry: y2,
      rz: z2,
      scale: perspective
    };
  }

  /**
   * Поворот вектора нормали грани
   */
  function rotateNormal3D(n, rotXDeg, rotYDeg) {
    const radY = (rotYDeg * Math.PI) / 180;
    const radX = (rotXDeg * Math.PI) / 180;

    const cosY = Math.cos(radY);
    const sinY = Math.sin(radY);
    const cosX = Math.cos(radX);
    const sinX = Math.sin(radX);

    const x1 = n.x * cosY + n.z * sinY;
    const z1 = -n.x * sinY + n.z * cosY;
    const y1 = n.y;

    const y2 = y1 * cosX - z1 * sinX;
    const z2 = y1 * sinX + z1 * cosX;

    return { x: x1, y: y2, z: z2 };
  }

  /**
   * Миниатюрная иконка для карточек пошагового объяснения
   */
  function renderMiniShapeBadgeSVG(badgeType) {
    if (badgeType === 'liquid') {
      return `
        <svg viewBox="0 0 36 28" width="24" height="19" aria-hidden="true" style="display:inline-block;vertical-align:middle;">
          <rect x="7" y="4" width="22" height="21" rx="3" fill="#E0F2FE" stroke="#0284C7" stroke-width="2"/>
          <rect x="8" y="13" width="20" height="11" rx="2" fill="#38BDF8"/>
          <line x1="11" y1="9" x2="17" y2="9" stroke="#0369A1" stroke-width="1.6"/>
          <line x1="11" y1="15" x2="17" y2="15" stroke="#0C4A6E" stroke-width="1.6"/>
        </svg>`;
    }
    if (badgeType === 'bottle') {
      return `
        <svg viewBox="0 0 36 28" width="24" height="19" aria-hidden="true" style="display:inline-block;vertical-align:middle;">
          <rect x="14" y="2" width="8" height="4" rx="1" fill="#0284C7"/>
          <rect x="10" y="6" width="16" height="19" rx="4" fill="#38BDF8" stroke="#0369A1" stroke-width="2"/>
        </svg>`;
    }
    if (badgeType === 'square') {
      return `
        <svg viewBox="0 0 32 28" width="22" height="19" aria-hidden="true" style="display:inline-block;vertical-align:middle;">
          <rect x="6" y="4" width="20" height="20" rx="2" fill="#67E8F9" stroke="#0E7490" stroke-width="2.2"/>
        </svg>`;
    }
    if (badgeType === 'rect') {
      return `
        <svg viewBox="0 0 36 28" width="24" height="19" aria-hidden="true" style="display:inline-block;vertical-align:middle;">
          <rect x="3" y="6" width="30" height="16" rx="2" fill="#C4B5FD" stroke="#6D28D9" stroke-width="2.2"/>
        </svg>`;
    }
    if (badgeType === 'cuboid') {
      return `
        <svg viewBox="0 0 40 28" width="26" height="19" aria-hidden="true" style="display:inline-block;vertical-align:middle;">
          <polygon points="12,4 34,4 28,10 6,10" fill="#DDD6FE" stroke="#6D28D9" stroke-width="1.8" stroke-linejoin="round"/>
          <rect x="6" y="10" width="22" height="13" fill="#A78BFA" stroke="#6D28D9" stroke-width="1.8"/>
          <polygon points="28,10 34,4 34,17 28,23" fill="#7C3AED" stroke="#6D28D9" stroke-width="1.8" stroke-linejoin="round"/>
        </svg>`;
    }
    return `
      <svg viewBox="0 0 36 28" width="24" height="19" aria-hidden="true" style="display:inline-block;vertical-align:middle;">
        <polygon points="18,2 31,8 18,14 5,8" fill="#A5F3FC" stroke="#0E7490" stroke-width="1.8" stroke-linejoin="round"/>
        <polygon points="5,8 18,14 18,26 5,20" fill="#22D3EE" stroke="#0E7490" stroke-width="1.8" stroke-linejoin="round"/>
        <polygon points="18,14 31,8 31,20 18,26" fill="#0891B2" stroke="#0E7490" stroke-width="1.8" stroke-linejoin="round"/>
      </svg>`;
  }

  /**
   * Создаёт описания 6 граней, 12 рёбер и 8 вершин для 3D-фигуры
   */
  function buildSolidGeometry(W, H, D, isCube, cuboidVariant) {
    const hw = W / 2;
    const hh = H / 2;
    const hd = D / 2;

    const vertices = [
      { id: 1, x: -hw, y: -hh, z:  hd },
      { id: 2, x:  hw, y: -hh, z:  hd },
      { id: 3, x:  hw, y:  hh, z:  hd },
      { id: 4, x: -hw, y:  hh, z:  hd },
      { id: 5, x: -hw, y: -hh, z: -hd },
      { id: 6, x:  hw, y: -hh, z: -hd },
      { id: 7, x:  hw, y:  hh, z: -hd },
      { id: 8, x: -hw, y:  hh, z: -hd }
    ];

    const edges = [
      { id: 1,  v1: 0, v2: 1 },
      { id: 2,  v1: 1, v2: 2 },
      { id: 3,  v1: 2, v2: 3 },
      { id: 4,  v1: 3, v2: 0 },
      { id: 5,  v1: 4, v2: 5 },
      { id: 6,  v1: 5, v2: 6 },
      { id: 7,  v1: 6, v2: 7 },
      { id: 8,  v1: 7, v2: 4 },
      { id: 9,  v1: 0, v2: 4 },
      { id: 10, v1: 1, v2: 5 },
      { id: 11, v1: 2, v2: 6 },
      { id: 12, v1: 3, v2: 7 }
    ];

    const isSquareSide = isCube || cuboidVariant === '4rect2sq';

    const faces = [
      {
        id: 'front',
        num: 1,
        shortSide: 'Передняя',
        shapeName: isCube ? 'Квадрат' : 'Прямоугольник',
        shortShape: isCube ? 'Квадрат' : 'Прямоуг.',
        isSquare: isCube,
        verts: [0, 1, 2, 3],
        normal: { x: 0, y: 0, z: 1 },
        fill: isCube ? '#22D3EE' : '#A78BFA',
        stroke: isCube ? '#0E7490' : '#5B21B6'
      },
      {
        id: 'back',
        num: 2,
        shortSide: 'Задняя',
        shapeName: isCube ? 'Квадрат' : 'Прямоугольник',
        shortShape: isCube ? 'Квадрат' : 'Прямоуг.',
        isSquare: isCube,
        verts: [5, 4, 7, 6],
        normal: { x: 0, y: 0, z: -1 },
        fill: isCube ? '#06B6D4' : '#8B5CF6',
        stroke: isCube ? '#0E7490' : '#5B21B6'
      },
      {
        id: 'top',
        num: 3,
        shortSide: 'Верхняя',
        shapeName: isCube ? 'Квадрат' : 'Прямоугольник',
        shortShape: isCube ? 'Квадрат' : 'Прямоуг.',
        isSquare: isCube,
        verts: [4, 5, 1, 0],
        normal: { x: 0, y: -1, z: 0 },
        fill: isCube ? '#67E8F9' : '#C4B5FD',
        stroke: isCube ? '#0E7490' : '#5B21B6'
      },
      {
        id: 'bottom',
        num: 4,
        shortSide: 'Нижняя',
        shapeName: isCube ? 'Квадрат' : 'Прямоугольник',
        shortShape: isCube ? 'Квадрат' : 'Прямоуг.',
        isSquare: isCube,
        verts: [3, 2, 6, 7],
        normal: { x: 0, y: 1, z: 0 },
        fill: isCube ? '#0891B2' : '#7C3AED',
        stroke: isCube ? '#0E7490' : '#5B21B6'
      },
      {
        id: 'left',
        num: 5,
        shortSide: 'Левая',
        shapeName: isSquareSide ? 'Квадрат' : 'Прямоугольник',
        shortShape: isSquareSide ? 'Квадрат' : 'Прямоуг.',
        isSquare: isSquareSide,
        verts: [4, 0, 3, 7],
        normal: { x: -1, y: 0, z: 0 },
        fill: isSquareSide ? '#38BDF8' : '#9333EA',
        stroke: isSquareSide ? '#0369A1' : '#5B21B6'
      },
      {
        id: 'right',
        num: 6,
        shortSide: 'Правая',
        shapeName: isSquareSide ? 'Квадрат' : 'Прямоугольник',
        shortShape: isSquareSide ? 'Квадрат' : 'Прямоуг.',
        isSquare: isSquareSide,
        verts: [1, 5, 6, 2],
        normal: { x: 1, y: 0, z: 0 },
        fill: isSquareSide ? '#0EA5E9' : '#7E22CE',
        stroke: isSquareSide ? '#0369A1' : '#5B21B6'
      }
    ];

    return { vertices, edges, faces, W, H, D };
  }

  /**
   * ==========================================================================
   * ГЛАВНЫЙ ИНТЕРАКТИВНЫЙ ХОЛСТ (ОПТИМИЗИРОВАННЫЙ 60 FPS БЕЗ ЛАГОВ)
   * ==========================================================================
   */
  function createInteractiveCanvas(containerEl, sceneConfig, callbacks = {}) {
    if (!containerEl) return null;
    containerEl.innerHTML = '';

    const scene = JSON.parse(JSON.stringify(sceneConfig));

    let rotX = typeof scene.rotX === 'number' ? scene.rotX : -24;
    let rotY = typeof scene.rotY === 'number' ? scene.rotY : 36;
    let explodeAmount = typeof scene.explodeAmount === 'number' ? scene.explodeAmount : 0;
    let viewMode = scene.viewMode || '3d';
    let pointerTool = scene.pointerTool || 'rotate';
    let highlightPart = scene.highlightPart || 'faces';
    let cuboidVariant = scene.cuboidVariant || '6rect';
    let selectedFaceId = null;
    let autoRotateRaf = null;
    let renderScheduled = false;

    const faceOffsets = {
      front:  { dx: 0, dy: 0 },
      back:   { dx: 0, dy: 0 },
      top:    { dx: 0, dy: 0 },
      bottom: { dx: 0, dy: 0 },
      left:   { dx: 0, dy: 0 },
      right:  { dx: 0, dy: 0 }
    };
    const inspectedFaces = new Set();

    let tapOpen = false;
    let tapRaf = null;
    let tapTarget = scene.tapTarget || 'main';
    let waterPhase = 0;
    let mainBeakerMl = typeof scene.mainBeakerMl === 'number' ? scene.mainBeakerMl : 500;
    let smallBeakerMl = typeof scene.smallBeakerMl === 'number' ? scene.smallBeakerMl : 300;
    let vesselMl = typeof scene.vesselMl === 'number' ? scene.vesselMl : 0;
    let selectedVesselKey = scene.selectedVesselKey || 'bottle1000';

    const VESSELS = {
      bottle1000: { name: 'Бутылка на столе', capacityMl: 1000, capacityLabel: '1 л (1000 мл)', shape: 'bottle' },
      glass250:   { name: 'Питьевой стакан',  capacityMl: 250,  capacityLabel: '250 мл',        shape: 'glass'  },
      jar500:     { name: 'Стеклянная банка', capacityMl: 500,  capacityLabel: '500 мл',        shape: 'jar'    },
      jug1500:    { name: 'Большой кувшин',   capacityMl: 1500, capacityLabel: '1500 мл',       shape: 'jug'    }
    };

    const svg = createSvgEl('svg', {
      viewBox: '0 0 880 540',
      class: 'geometry-svg',
      role: 'img',
      'aria-label': scene.title || 'Интерактивная 3D-лаборатория'
    });
    svg.style.touchAction = 'none';
    svg.style.userSelect = 'none';

    // Лёгкие векторные градиенты без тяжёлых SVG-фильтров размытия (0 лагов на электронных досках!)
    const defs = createSvgEl('defs');
    defs.innerHTML = `
      <linearGradient id="waterGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#38BDF8" stop-opacity="0.88"/>
        <stop offset="100%" stop-color="#0284C7" stop-opacity="0.96"/>
      </linearGradient>
      <linearGradient id="glassGrad" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.72"/>
        <stop offset="25%" stop-color="#E0F2FE" stop-opacity="0.28"/>
        <stop offset="85%" stop-color="#BAE6FD" stop-opacity="0.35"/>
        <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0.65"/>
      </linearGradient>
      <linearGradient id="pipeGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#E2E8F0"/>
        <stop offset="50%" stop-color="#94A3B8"/>
        <stop offset="100%" stop-color="#475569"/>
      </linearGradient>
      <linearGradient id="woodTableGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#D99B52"/>
        <stop offset="70%" stop-color="#B87A33"/>
        <stop offset="100%" stop-color="#85521A"/>
      </linearGradient>
    `;
    svg.appendChild(defs);

    const rootG = createSvgEl('g');
    svg.appendChild(rootG);
    containerEl.appendChild(svg);

    function clientToSvgPoint(clientX, clientY) {
      const rect = svg.getBoundingClientRect();
      if (!rect.width || !rect.height) return { x: 0, y: 0 };
      return {
        x: ((clientX - rect.left) / rect.width) * 880,
        y: ((clientY - rect.top) / rect.height) * 540
      };
    }

    function notifyUpdate() {
      if (typeof callbacks.onStateChange === 'function') {
        callbacks.onStateChange(api.getState());
      }
    }

    /**
     * Коалесцированный рендеринг через requestAnimationFrame (не более 1 перерисовки за кадр 60 FPS)
     */
    function scheduleRender() {
      if (renderScheduled) return;
      renderScheduled = true;
      requestAnimationFrame(() => {
        renderScheduled = false;
        renderScene();
      });
    }

    // Единое состояние перетаскивания на корневом SVG (никогда не теряет pointerCapture при перерисовке!)
    let activeDrag = null;

    // ========================================================================
    // 1. РЕНДЕР 3D-КУБА И 3D-КУБОИДА
    // ========================================================================
    function render3DSolidScene() {
      rootG.innerHTML = '';

      const isCube = scene.type === 'cube';

      const topBanner = createSvgEl('g');
      topBanner.appendChild(createSvgEl('rect', {
        x: 16,
        y: 12,
        width: 848,
        height: 42,
        rx: 12,
        fill: '#F0F9FF',
        stroke: '#BAE6FD',
        'stroke-width': 1.5
      }));

      const bannerText = createSvgEl('text', {
        x: 30,
        y: 38,
        fill: '#0C4A6E',
        'font-size': '14',
        'font-weight': '800'
      });

      if (viewMode === 'flat6') {
        bannerText.textContent = isCube
          ? '📐 Все 6 граней куба рядом — это 6 ОДИНАКОВЫХ КВАДРАТОВ!'
          : (cuboidVariant === '4rect2sq'
              ? '📐 Грани кубоида (вид 2): 4 ПРЯМОУГОЛЬНИКА и 2 КВАДРАТА!'
              : '📐 Все 6 граней кубоида (вид 1) — ПРЯМОУГОЛЬНИКИ!');
      } else if (pointerTool === 'pullFace') {
        bannerText.textContent = '🖐 Потяни пальцем любую из 6 граней в сторону!';
      } else {
        bannerText.textContent = '🔄 Покрути 3D-фигуру пальцем на 360° или разбери её на грани!';
      }
      topBanner.appendChild(bannerText);

      topBanner.appendChild(createSvgEl('rect', {
        x: 726,
        y: 18,
        width: 126,
        height: 30,
        rx: 8,
        fill: '#0284C7'
      }));
      const angleTxt = createSvgEl('text', {
        x: 789,
        y: 38,
        'text-anchor': 'middle',
        fill: '#FFFFFF',
        'font-size': '12',
        'font-weight': '800'
      });
      angleTxt.textContent = explodeAmount > 5
        ? `Разобрано: ${Math.round((explodeAmount / 115) * 100)}%`
        : '3D • 360°';
      topBanner.appendChild(angleTxt);
      rootG.appendChild(topBanner);

      if (viewMode === 'flat6') {
        renderFlatSixFacesView(isCube);
        return;
      }

      const dims = isCube
        ? { W: 156, H: 156, D: 156 }
        : (cuboidVariant === '4rect2sq'
            ? { W: 215, H: 136, D: 136 }
            : { W: 220, H: 140, D: 112 });

      renderSingle3DSolid({
        W: dims.W,
        H: dims.H,
        D: dims.D,
        isCube,
        cuboidVariant,
        cx: 295,
        cy: 268,
        captionTitle: isCube
          ? 'КУБ — 6 равных квадратных граней'
          : (cuboidVariant === '4rect2sq'
              ? 'КУБОИД (вид 2): 4 прямоугольные и 2 квадратные грани'
              : 'КУБОИД (вид 1): 6 прямоугольных граней'),
        captionSub: isCube
          ? 'Все 12 рёбер куба равны между собой • 8 вершин'
          : 'Противоположные грани попарно равны • 12 рёбер • 8 вершин'
      });

      renderRightInspectorCard(isCube);
    }

    function renderSingle3DSolid(opts) {
      const { W, H, D, isCube, cuboidVariant: variant, cx, cy, captionTitle, captionSub } = opts;
      const geom = buildSolidGeometry(W, H, D, isCube, variant);

      const solidG = createSvgEl('g');

      if (highlightPart === 'space') {
        const innerCore = createSvgEl('g');
        const coreVerts = geom.vertices.map((v) =>
          project3D({ x: v.x * 0.78, y: v.y * 0.78, z: v.z * 0.78 }, rotX, rotY, cx, cy, 760)
        );
        geom.edges.forEach((e) => {
          const p1 = coreVerts[e.v1];
          const p2 = coreVerts[e.v2];
          innerCore.appendChild(createSvgEl('line', {
            x1: p1.x,
            y1: p1.y,
            x2: p2.x,
            y2: p2.y,
            stroke: '#10B981',
            'stroke-width': 2.5,
            'stroke-dasharray': '5 4',
            opacity: 0.9
          }));
        });
        solidG.appendChild(innerCore);
      }

      const projectedFaces = geom.faces.map((face) => {
        const manualOffset = faceOffsets[face.id] || { dx: 0, dy: 0 };
        const pts3D = face.verts.map((vIdx) => {
          const baseV = geom.vertices[vIdx];
          return {
            x: baseV.x + face.normal.x * explodeAmount,
            y: baseV.y + face.normal.y * explodeAmount,
            z: baseV.z + face.normal.z * explodeAmount
          };
        });

        const pts2D = pts3D.map((pt) => {
          const p = project3D(pt, rotX, rotY, cx, cy, 760);
          return {
            x: p.x + manualOffset.dx,
            y: p.y + manualOffset.dy,
            z: p.z
          };
        });

        const rotNorm = rotateNormal3D(face.normal, rotX, rotY);

        const baseCenter3D = {
          x: (face.normal.x * W) / 2,
          y: (face.normal.y * H) / 2,
          z: (face.normal.z * D) / 2
        };
        const baseCenter2D = project3D(baseCenter3D, rotX, rotY, cx, cy, 760);

        const avgZ = pts2D.reduce((acc, p) => acc + p.z, 0) / pts2D.length;
        const centerX = pts2D.reduce((acc, p) => acc + p.x, 0) / pts2D.length;
        const centerY = pts2D.reduce((acc, p) => acc + p.y, 0) / pts2D.length;

        return {
          face,
          pts2D,
          avgZ,
          centerX,
          centerY,
          baseCenter2D,
          rotNorm
        };
      });

      projectedFaces.sort((a, b) => a.avgZ - b.avgZ);

      projectedFaces.forEach((pf) => {
        const { face, pts2D, centerX, centerY, baseCenter2D, rotNorm } = pf;
        const isSelected = selectedFaceId === face.id;
        const manualOffset = faceOffsets[face.id] || { dx: 0, dy: 0 };
        const isPulled = explodeAmount > 14 || Math.hypot(manualOffset.dx, manualOffset.dy) > 6;
        const isFrontFacing = rotNorm.z > 0.08;

        const faceG = createSvgEl('g', {
          class: 'interactive-3d-face',
          'data-face-id': face.id,
          style: 'cursor: grab;'
        });

        if (isPulled) {
          faceG.appendChild(createSvgEl('line', {
            x1: baseCenter2D.x,
            y1: baseCenter2D.y,
            x2: centerX,
            y2: centerY,
            stroke: '#64748B',
            'stroke-width': 1.5,
            'stroke-dasharray': '4 4',
            opacity: 0.65
          }));
        }

        const pointsAttr = pts2D.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
        const poly = createSvgEl('polygon', {
          points: pointsAttr,
          fill: face.fill,
          'fill-opacity': highlightPart === 'edges' || highlightPart === 'vertices'
            ? '0.28'
            : (isPulled ? '0.90' : (isFrontFacing ? '0.88' : '0.45')),
          stroke: isSelected ? '#F59E0B' : face.stroke,
          'stroke-width': isSelected ? '3.8' : '2.4',
          'stroke-linejoin': 'round'
        });
        faceG.appendChild(poly);

        if ((highlightPart === 'faces' || isPulled || isSelected) && (isPulled || isFrontFacing)) {
          faceG.appendChild(createSvgEl('circle', {
            cx: centerX,
            cy: centerY,
            r: 14,
            fill: face.isSquare ? '#083344' : '#3B0764',
            'fill-opacity': '0.92',
            stroke: isSelected ? '#F59E0B' : '#FFFFFF',
            'stroke-width': 2
          }));
          const cNum = createSvgEl('text', {
            x: centerX,
            y: centerY + 4.5,
            'text-anchor': 'middle',
            fill: '#FFFFFF',
            'font-size': '12.5',
            'font-weight': '900'
          });
          cNum.textContent = String(face.num);
          faceG.appendChild(cNum);
        }

        solidG.appendChild(faceG);
      });

      if (highlightPart === 'space') {
        solidG.appendChild(createSvgEl('rect', {
          x: cx - 115,
          y: cy - 18,
          width: 230,
          height: 36,
          rx: 18,
          fill: '#ECFDF5',
          stroke: '#059669',
          'stroke-width': 2.5
        }));
        const spTxt = createSvgEl('text', {
          x: cx,
          y: cy + 5,
          'text-anchor': 'middle',
          fill: '#065F46',
          'font-size': '13',
          'font-weight': '900'
        });
        spTxt.textContent = '📦 Объём обозначают буквой V';
        solidG.appendChild(spTxt);
      }

      if (highlightPart === 'edges') {
        const projVerts = geom.vertices.map((v) => project3D(v, rotX, rotY, cx, cy, 760));
        geom.edges.forEach((edge) => {
          const p1 = projVerts[edge.v1];
          const p2 = projVerts[edge.v2];
          const mx = (p1.x + p2.x) / 2;
          const my = (p1.y + p2.y) / 2;

          solidG.appendChild(createSvgEl('line', {
            x1: p1.x,
            y1: p1.y,
            x2: p2.x,
            y2: p2.y,
            stroke: '#F59E0B',
            'stroke-width': 4.5,
            'stroke-linecap': 'round'
          }));

          solidG.appendChild(createSvgEl('circle', {
            cx: mx,
            cy: my,
            r: 11,
            fill: '#FFFBEB',
            stroke: '#D97706',
            'stroke-width': 2
          }));
          const eTxt = createSvgEl('text', {
            x: mx,
            y: my + 4,
            'text-anchor': 'middle',
            fill: '#92400E',
            'font-size': '10.5',
            'font-weight': '900'
          });
          eTxt.textContent = String(edge.id);
          solidG.appendChild(eTxt);
        });
      }

      if (highlightPart === 'vertices') {
        const projVerts = geom.vertices.map((v) => project3D(v, rotX, rotY, cx, cy, 760));
        projVerts.forEach((pv, idx) => {
          solidG.appendChild(createSvgEl('circle', {
            cx: pv.x,
            cy: pv.y,
            r: 13,
            fill: '#EF4444',
            stroke: '#FFFFFF',
            'stroke-width': 2.5
          }));
          const vTxt = createSvgEl('text', {
            x: pv.x,
            y: pv.y + 4,
            'text-anchor': 'middle',
            fill: '#FFFFFF',
            'font-size': '11',
            'font-weight': '900'
          });
          vTxt.textContent = String(idx + 1);
          solidG.appendChild(vTxt);
        });
      }

      const capY = 492;
      const capTitleEl = createSvgEl('text', {
        x: cx,
        y: capY,
        'text-anchor': 'middle',
        fill: '#0F172A',
        'font-size': '15.5',
        'font-weight': '900'
      });
      capTitleEl.textContent = captionTitle;
      solidG.appendChild(capTitleEl);

      const capSubEl = createSvgEl('text', {
        x: cx,
        y: capY + 21,
        'text-anchor': 'middle',
        fill: '#475569',
        'font-size': '12.5',
        'font-weight': '700'
      });
      capSubEl.textContent = captionSub;
      solidG.appendChild(capSubEl);

      rootG.appendChild(solidG);
    }

    function renderFlatSixFacesView(isCube) {
      const g = createSvgEl('g');

      const is4Rect2Sq = !isCube && cuboidVariant === '4rect2sq';
      const cards = isCube
        ? [
            { num: 1, title: 'Верхняя грань', w: 86, h: 86, fill: '#67E8F9', stroke: '#0E7490', isSq: true },
            { num: 2, title: 'Нижняя грань', w: 86, h: 86, fill: '#22D3EE', stroke: '#0E7490', isSq: true },
            { num: 3, title: 'Передняя грань', w: 86, h: 86, fill: '#06B6D4', stroke: '#0E7490', isSq: true },
            { num: 4, title: 'Задняя грань', w: 86, h: 86, fill: '#0891B2', stroke: '#0E7490', isSq: true },
            { num: 5, title: 'Левая грань', w: 86, h: 86, fill: '#38BDF8', stroke: '#0369A1', isSq: true },
            { num: 6, title: 'Правая грань', w: 86, h: 86, fill: '#0EA5E9', stroke: '#0369A1', isSq: true }
          ]
        : (is4Rect2Sq
            ? [
                { num: 1, title: 'Передняя грань', w: 126, h: 74, fill: '#A78BFA', stroke: '#5B21B6', isSq: false },
                { num: 2, title: 'Задняя грань', w: 126, h: 74, fill: '#8B5CF6', stroke: '#5B21B6', isSq: false },
                { num: 3, title: 'Верхняя грань', w: 126, h: 74, fill: '#C4B5FD', stroke: '#5B21B6', isSq: false },
                { num: 4, title: 'Нижняя грань', w: 126, h: 74, fill: '#7C3AED', stroke: '#5B21B6', isSq: false },
                { num: 5, title: 'Левая боковая грань', w: 76, h: 76, fill: '#38BDF8', stroke: '#0369A1', isSq: true },
                { num: 6, title: 'Правая боковая грань', w: 76, h: 76, fill: '#0EA5E9', stroke: '#0369A1', isSq: true }
              ]
            : [
                { num: 1, title: 'Передняя грань', w: 126, h: 76, fill: '#A78BFA', stroke: '#5B21B6', isSq: false },
                { num: 2, title: 'Задняя грань (равна 1-й)', w: 126, h: 76, fill: '#A78BFA', stroke: '#5B21B6', isSq: false },
                { num: 3, title: 'Верхняя грань', w: 126, h: 60, fill: '#C4B5FD', stroke: '#5B21B6', isSq: false },
                { num: 4, title: 'Нижняя грань (равна 3-й)', w: 126, h: 60, fill: '#C4B5FD', stroke: '#5B21B6', isSq: false },
                { num: 5, title: 'Левая боковая грань', w: 92, h: 76, fill: '#DDD6FE', stroke: '#5B21B6', isSq: false },
                { num: 6, title: 'Правая грань (равна 5-й)', w: 92, h: 76, fill: '#DDD6FE', stroke: '#5B21B6', isSq: false }
              ]);

      cards.forEach((c, idx) => {
        const col = idx % 3;
        const row = Math.floor(idx / 3);
        const boxX = 32 + col * 278;
        const boxY = 68 + row * 188;

        g.appendChild(createSvgEl('rect', {
          x: boxX,
          y: boxY,
          width: 260,
          height: 172,
          rx: 16,
          fill: '#FFFFFF',
          stroke: c.isSq ? '#06B6D4' : '#8B5CF6',
          'stroke-width': 2.5
        }));

        const titleTxt = createSvgEl('text', {
          x: boxX + 130,
          y: boxY + 23,
          'text-anchor': 'middle',
          fill: '#0F172A',
          'font-size': '13',
          'font-weight': '800'
        });
        titleTxt.textContent = `Грань №${c.num}: ${c.title}`;
        g.appendChild(titleTxt);

        const shapeX = boxX + (260 - c.w) / 2;
        const shapeY = boxY + 34 + (92 - c.h) / 2;
        g.appendChild(createSvgEl('rect', {
          x: shapeX,
          y: shapeY,
          width: c.w,
          height: c.h,
          rx: 4,
          fill: c.fill,
          stroke: c.stroke,
          'stroke-width': 3
        }));

        if (c.isSq) {
          const midX = shapeX + c.w / 2;
          const midY = shapeY + c.h / 2;
          g.appendChild(createSvgEl('line', { x1: midX, y1: shapeY - 4, x2: midX, y2: shapeY + 4, stroke: '#083344', 'stroke-width': 2.5 }));
          g.appendChild(createSvgEl('line', { x1: midX, y1: shapeY + c.h - 4, x2: midX, y2: shapeY + c.h + 4, stroke: '#083344', 'stroke-width': 2.5 }));
          g.appendChild(createSvgEl('line', { x1: shapeX - 4, y1: midY, x2: shapeX + 4, y2: midY, stroke: '#083344', 'stroke-width': 2.5 }));
          g.appendChild(createSvgEl('line', { x1: shapeX + c.w - 4, y1: midY, x2: shapeX + c.w + 4, y2: midY, stroke: '#083344', 'stroke-width': 2.5 }));
        }

        const badgeFill = c.isSq ? '#ECFEFF' : '#F5F3FF';
        const badgeStroke = c.isSq ? '#67E8F9' : '#DDD6FE';
        const badgeTextCol = c.isSq ? '#0E7490' : '#6D28D9';
        g.appendChild(createSvgEl('rect', {
          x: boxX + 20,
          y: boxY + 137,
          width: 220,
          height: 25,
          rx: 8,
          fill: badgeFill,
          stroke: badgeStroke,
          'stroke-width': 1.2
        }));
        const shapeLbl = createSvgEl('text', {
          x: boxX + 130,
          y: boxY + 154,
          'text-anchor': 'middle',
          fill: badgeTextCol,
          'font-size': '11.5',
          'font-weight': '900'
        });
        shapeLbl.textContent = c.isSq ? '■ КВАДРАТ (стороны равны)' : '▬ ПРЯМОУГОЛЬНИК';
        g.appendChild(shapeLbl);
      });

      g.appendChild(createSvgEl('rect', {
        x: 32,
        y: 456,
        width: 816,
        height: 64,
        rx: 14,
        fill: isCube ? '#ECFEFF' : '#F5F3FF',
        stroke: isCube ? '#06B6D4' : '#8B5CF6',
        'stroke-width': 2
      }));

      const sumTxt = createSvgEl('text', {
        x: 440,
        y: 484,
        'text-anchor': 'middle',
        fill: '#0F172A',
        'font-size': '15.5',
        'font-weight': '900'
      });
      sumTxt.textContent = isCube
        ? 'ИТОГО У КУБА: 6 одинаковых квадратных граней и 12 равных рёбер!'
        : (is4Rect2Sq
            ? 'ИТОГО У КУБОИДА (вид 2): 4 прямоугольные грани + 2 квадратные грани!'
            : 'ИТОГО У КУБОИДА (вид 1): все 6 граней — прямоугольники!');
      g.appendChild(sumTxt);

      const subSumTxt = createSvgEl('text', {
        x: 440,
        y: 506,
        'text-anchor': 'middle',
        fill: '#475569',
        'font-size': '12.5',
        'font-weight': '700'
      });
      subSumTxt.textContent = 'Нажми «🧊 Вернуть 3D-фигуру», чтобы снова собрать все 6 граней в пространстве.';
      g.appendChild(subSumTxt);

      rootG.appendChild(g);
    }

    function renderRightInspectorCard(isCube) {
      const cardG = createSvgEl('g');
      const x = 578;
      const y = 72;
      const w = 286;
      const h = 432;

      cardG.appendChild(createSvgEl('rect', {
        x,
        y,
        width: w,
        height: h,
        rx: 18,
        fill: '#FFFFFF',
        stroke: isCube ? '#A5F3FC' : '#DDD6FE',
        'stroke-width': 2.5
      }));

      cardG.appendChild(createSvgEl('rect', {
        x: x + 12,
        y: y + 12,
        width: w - 24,
        height: 40,
        rx: 10,
        fill: isCube ? '#0891B2' : '#7C3AED'
      }));
      const headTxt = createSvgEl('text', {
        x: x + w / 2,
        y: y + 37,
        'text-anchor': 'middle',
        fill: '#FFFFFF',
        'font-size': '14',
        'font-weight': '900'
      });
      headTxt.textContent = isCube ? '📦 Из чего состоит КУБ?' : '📦 Из чего состоит КУБОИД?';
      cardG.appendChild(headTxt);

      const rows = isCube
        ? [
            { badge: '6', color: '#0891B2', bg: '#ECFEFF', title: 'ГРАНИ (6 квадратов)', desc: 'Плоские стороны фигуры' },
            { badge: '12', color: '#D97706', bg: '#FFFBEB', title: 'РЁБРА (12 равных)', desc: 'Отрезки на стыке граней' },
            { badge: '8', color: '#DC2626', bg: '#FEF2F2', title: 'ВЕРШИНЫ (8 уголков)', desc: 'Точки, где сходятся рёбра' }
          ]
        : [
            {
              badge: '6',
              color: '#7C3AED',
              bg: '#F5F3FF',
              title: 'ГРАНИ (6 штук)',
              desc: cuboidVariant === '4rect2sq'
                ? '4 прямоуг. и 2 квадрата'
                : 'Все 6 — прямоугольники'
            },
            { badge: '12', color: '#D97706', bg: '#FFFBEB', title: 'РЁБРА (12 отрезков)', desc: 'Линии на стыке двух граней' },
            { badge: '8', color: '#DC2626', bg: '#FEF2F2', title: 'ВЕРШИНЫ (8 уголков)', desc: 'Точки, где сходятся рёбра' }
          ];

      rows.forEach((r, idx) => {
        const ry = y + 66 + idx * 72;
        cardG.appendChild(createSvgEl('rect', {
          x: x + 12,
          y: ry,
          width: w - 24,
          height: 60,
          rx: 12,
          fill: r.bg,
          stroke: r.color,
          'stroke-width': 1.5
        }));

        cardG.appendChild(createSvgEl('circle', {
          cx: x + 38,
          cy: ry + 30,
          r: 18,
          fill: r.color
        }));

        const bTxt = createSvgEl('text', {
          x: x + 38,
          y: ry + 35,
          'text-anchor': 'middle',
          fill: '#FFFFFF',
          'font-size': '14.5',
          'font-weight': '900'
        });
        bTxt.textContent = r.badge;
        cardG.appendChild(bTxt);

        const t1 = createSvgEl('text', {
          x: x + 64,
          y: ry + 25,
          fill: '#0F172A',
          'font-size': '13.5',
          'font-weight': '900'
        });
        t1.textContent = r.title;
        cardG.appendChild(t1);

        const t2 = createSvgEl('text', {
          x: x + 64,
          y: ry + 45,
          fill: '#475569',
          'font-size': '12',
          'font-weight': '700'
        });
        t2.textContent = r.desc;
        cardG.appendChild(t2);
      });

      const botY = y + 288;
      cardG.appendChild(createSvgEl('rect', {
        x: x + 12,
        y: botY,
        width: w - 24,
        height: 128,
        rx: 14,
        fill: '#ECFDF5',
        stroke: '#10B981',
        'stroke-width': 2
      }));

      const botTitle = createSvgEl('text', {
        x: x + w / 2,
        y: botY + 24,
        'text-anchor': 'middle',
        fill: '#065F46',
        'font-size': '13',
        'font-weight': '900'
      });
      botTitle.textContent = '🤖 Объём в математике — V:';
      cardG.appendChild(botTitle);

      const botLines = [
        'Куб или кубоид имеет ОБЪЁМ,',
        'так как занимает место',
        'в пространстве.',
        'Объём обозначают буквой V!'
      ];
      botLines.forEach((line, i) => {
        const lEl = createSvgEl('text', {
          x: x + w / 2,
          y: botY + 49 + i * 19,
          'text-anchor': 'middle',
          fill: '#047857',
          'font-size': '12.5',
          'font-weight': '800'
        });
        lEl.textContent = line;
        cardG.appendChild(lEl);
      });

      rootG.appendChild(cardG);
    }

    // ========================================================================
    // 2. ЕДИНЫЙ ВЫСОКОПРОИЗВОДИТЕЛЬНЫЙ ОБРАБОТЧИК ПАЛЬЦА И МЫШИ НА SVG
    // ========================================================================
    svg.addEventListener('pointerdown', (e) => {
      // Если клик по крану — обрабатывается самим краном
      if (e.target.closest && e.target.closest('.interactive-water-tap')) {
        return;
      }

      // Если сцена с мензурками или бутылкой — проверяем перетаскивание уровня воды
      const beakerEl = e.target.closest && e.target.closest('[data-water-vessel]');
      if (beakerEl) {
        const vId = beakerEl.getAttribute('data-water-vessel');
        const bottomY = Number(beakerEl.getAttribute('data-bottom-y'));
        const innerH = Number(beakerEl.getAttribute('data-inner-h'));
        const maxMl = Number(beakerEl.getAttribute('data-max-ml'));

        activeDrag = {
          mode: 'waterLevel',
          vesselId: vId,
          bottomY,
          innerH,
          maxMl
        };
        updateWaterLevelFromClientY(e.clientY, activeDrag);
        try {
          svg.setPointerCapture(e.pointerId);
        } catch (_) {}
        return;
      }

      if (scene.type === 'liquid' || scene.type === 'capacity') return;
      if (viewMode === 'flat6') return;

      stopAutoRotate();

      // Проверяем, нажал ли пользователь на конкретную 3D-грань
      const faceEl = e.target.closest && e.target.closest('[data-face-id]');
      if (faceEl) {
        const fId = faceEl.getAttribute('data-face-id');
        selectedFaceId = fId;
        inspectedFaces.add(fId);

        if (pointerTool === 'pullFace' || explodeAmount > 20) {
          const startSvgPt = clientToSvgPoint(e.clientX, e.clientY);
          const initOff = faceOffsets[fId] || { dx: 0, dy: 0 };
          activeDrag = {
            mode: 'face',
            faceId: fId,
            startSvgX: startSvgPt.x,
            startSvgY: startSvgPt.y,
            initDx: initOff.dx,
            initDy: initOff.dy
          };
          try {
            svg.setPointerCapture(e.pointerId);
          } catch (_) {}
          return;
        }
      }

      // Иначе вращаем 3D-фигуру в пространстве на 360°
      activeDrag = {
        mode: 'rotate',
        startClientX: e.clientX,
        startClientY: e.clientY,
        startRotX: rotX,
        startRotY: rotY
      };
      try {
        svg.setPointerCapture(e.pointerId);
      } catch (_) {}
    });

    function updateWaterLevelFromClientY(clientY, dragInfo) {
      const pt = clientToSvgPoint(0, clientY);
      const rel = Math.max(0, Math.min(1, (dragInfo.bottomY - pt.y) / dragInfo.innerH));
      const snappedMl = Math.round((rel * dragInfo.maxMl) / 50) * 50;

      if (dragInfo.vesselId === 'main') {
        tapTarget = 'main';
        mainBeakerMl = snappedMl;
      } else if (dragInfo.vesselId === 'small') {
        tapTarget = 'small';
        smallBeakerMl = snappedMl;
      } else if (dragInfo.vesselId === 'capacityVessel') {
        vesselMl = snappedMl;
      }
      scheduleRender();
    }

    svg.addEventListener('pointermove', (e) => {
      if (!activeDrag) return;

      if (activeDrag.mode === 'rotate') {
        const dx = e.clientX - activeDrag.startClientX;
        const dy = e.clientY - activeDrag.startClientY;
        rotY = (activeDrag.startRotY + dx * 0.65) % 360;
        rotX = Math.max(-75, Math.min(75, activeDrag.startRotX - dy * 0.55));
        scheduleRender();
        return;
      }

      if (activeDrag.mode === 'face') {
        const cur = clientToSvgPoint(e.clientX, e.clientY);
        faceOffsets[activeDrag.faceId] = {
          dx: Math.max(-210, Math.min(210, activeDrag.initDx + (cur.x - activeDrag.startSvgX))),
          dy: Math.max(-165, Math.min(165, activeDrag.initDy + (cur.y - activeDrag.startSvgY)))
        };
        scheduleRender();
        return;
      }

      if (activeDrag.mode === 'waterLevel') {
        updateWaterLevelFromClientY(e.clientY, activeDrag);
      }
    });

    const endActiveDrag = (e) => {
      if (!activeDrag) return;
      activeDrag = null;
      try {
        svg.releasePointerCapture(e.pointerId);
      } catch (_) {}
      scheduleRender();
      notifyUpdate();
    };
    svg.addEventListener('pointerup', endActiveDrag);
    svg.addEventListener('pointercancel', endActiveDrag);

    // ========================================================================
    // 3. РЕНДЕР КРАНА С ЖИДКОСТЬЮ, МЕНЗУРОК (СТР. 110 П. 3) И БУТЫЛКИ (СТР. 110 П. 4)
    // ========================================================================
    function renderLiquidTapScene() {
      rootG.innerHTML = '';

      const isCapacityMode = scene.type === 'capacity';

      rootG.appendChild(createSvgEl('rect', {
        x: 16,
        y: 12,
        width: 848,
        height: 42,
        rx: 12,
        fill: '#F0F9FF',
        stroke: '#BAE6FD',
        'stroke-width': 1.5
      }));

      const bannerTxt = createSvgEl('text', {
        x: 30,
        y: 38,
        fill: '#0C4A6E',
        'font-size': '14',
        'font-weight': '800'
      });
      bannerTxt.textContent = isCapacityMode
        ? '🚰 Нажми на КРАН с водой, чтобы наполнить посуду доверху (ЁМКОСТЬ)!'
        : '🚰 Нажми на вентиль КРАНА, чтобы налить воду в мензурки (1 л и 500 мл)!';
      rootG.appendChild(bannerTxt);

      rootG.appendChild(createSvgEl('rect', {
        x: 712,
        y: 18,
        width: 140,
        height: 30,
        rx: 8,
        fill: tapOpen ? '#10B981' : '#0284C7'
      }));
      const tapStatusTxt = createSvgEl('text', {
        x: 782,
        y: 38,
        'text-anchor': 'middle',
        fill: '#FFFFFF',
        'font-size': '12',
        'font-weight': '800'
      });
      tapStatusTxt.textContent = tapOpen ? '🚰 КРАН ОТКРЫТ' : '🚱 КРАН ЗАКРЫТ';
      rootG.appendChild(tapStatusTxt);

      if (isCapacityMode) {
        renderCapacityBottleAndTap();
      } else {
        renderTwoBeakersAndTap();
      }
    }

    function renderWaterTapWidget(spoutX, spoutY, streamBottomY, isPouring) {
      const tapG = createSvgEl('g', {
        class: 'interactive-water-tap',
        style: 'cursor: pointer;'
      });

      if (isPouring && streamBottomY > spoutY + 8) {
        const streamH = streamBottomY - spoutY;
        tapG.appendChild(createSvgEl('rect', {
          x: spoutX - 7,
          y: spoutY,
          width: 14,
          height: streamH,
          rx: 6,
          fill: 'url(#waterGrad)',
          opacity: 0.92
        }));

        const dropOffset = (waterPhase * 11) % 36;
        for (let y = spoutY + dropOffset; y < streamBottomY - 10; y += 36) {
          tapG.appendChild(createSvgEl('line', {
            x1: spoutX - 2,
            y1: y,
            x2: spoutX - 2,
            y2: Math.min(streamBottomY, y + 16),
            stroke: '#E0F2FE',
            'stroke-width': 3,
            'stroke-linecap': 'round'
          }));
          tapG.appendChild(createSvgEl('circle', {
            cx: spoutX + 4,
            cy: Math.min(streamBottomY - 4, y + 20),
            r: 3.2,
            fill: '#BAE6FD'
          }));
        }

        const splashSpread = 12 + Math.sin(waterPhase * 0.7) * 5;
        tapG.appendChild(createSvgEl('ellipse', {
          cx: spoutX,
          cy: streamBottomY,
          rx: splashSpread + 8,
          ry: 5,
          fill: '#E0F2FE',
          opacity: 0.85
        }));
      }

      const pipeLeftX = Math.max(24, spoutX - 130);
      tapG.appendChild(createSvgEl('rect', {
        x: pipeLeftX,
        y: spoutY - 42,
        width: spoutX - pipeLeftX + 12,
        height: 22,
        rx: 6,
        fill: 'url(#pipeGrad)',
        stroke: '#334155',
        'stroke-width': 2
      }));

      tapG.appendChild(createSvgEl('rect', {
        x: pipeLeftX - 8,
        y: spoutY - 50,
        width: 14,
        height: 38,
        rx: 4,
        fill: '#64748B',
        stroke: '#1E293B',
        'stroke-width': 2
      }));

      tapG.appendChild(createSvgEl('path', {
        d: `M ${spoutX - 14} ${spoutY - 42} Q ${spoutX + 14} ${spoutY - 42} ${spoutX + 14} ${spoutY - 14} L ${spoutX + 14} ${spoutY} L ${spoutX - 14} ${spoutY} Z`,
        fill: 'url(#pipeGrad)',
        stroke: '#334155',
        'stroke-width': 2
      }));

      tapG.appendChild(createSvgEl('rect', {
        x: spoutX - 15,
        y: spoutY - 5,
        width: 30,
        height: 7,
        rx: 2,
        fill: '#0284C7',
        stroke: '#0C4A6E',
        'stroke-width': 1.5
      }));

      const valveX = spoutX - 24;
      const valveY = spoutY - 56;
      tapG.appendChild(createSvgEl('rect', {
        x: valveX - 5,
        y: valveY,
        width: 10,
        height: 16,
        fill: '#64748B',
        stroke: '#1E293B',
        'stroke-width': 1.5
      }));

      const handleColor = isPouring ? '#10B981' : '#EF4444';
      const handleStroke = isPouring ? '#065F46' : '#991B1B';
      tapG.appendChild(createSvgEl('rect', {
        x: valveX - 30,
        y: valveY - 12,
        width: 60,
        height: 14,
        rx: 7,
        fill: handleColor,
        stroke: handleStroke,
        'stroke-width': 2
      }));
      tapG.appendChild(createSvgEl('circle', {
        cx: valveX,
        cy: valveY - 5,
        r: 10,
        fill: '#FFFFFF',
        stroke: handleStroke,
        'stroke-width': 2.5
      }));

      tapG.appendChild(createSvgEl('rect', {
        x: spoutX + 18,
        y: spoutY - 56,
        width: 186,
        height: 26,
        rx: 8,
        fill: isPouring ? '#ECFDF5' : '#FEF2F2',
        stroke: handleColor,
        'stroke-width': 1.8
      }));
      const valveTxt = createSvgEl('text', {
        x: spoutX + 111,
        y: spoutY - 39,
        'text-anchor': 'middle',
        fill: isPouring ? '#065F46' : '#991B1B',
        'font-size': '11.5',
        'font-weight': '900'
      });
      valveTxt.textContent = isPouring ? '🚱 Нажми: ЗАКРЫТЬ кран' : '🚰 Нажми: ОТКРЫТЬ кран!';
      tapG.appendChild(valveTxt);

      tapG.addEventListener('click', (e) => {
        e.stopPropagation();
        api.toggleTap();
      });

      rootG.appendChild(tapG);
    }

    function renderTwoBeakersAndTap() {
      const bigBeaker = {
        id: 'main',
        x: 90,
        y: 165,
        w: 215,
        h: 265,
        maxMl: 1000,
        stepMl: 100,
        currentMl: mainBeakerMl,
        title: 'Большая мензурка (до 1 л = 1000 мл)'
      };

      const smallBeaker = {
        id: 'small',
        x: 410,
        y: 225,
        w: 175,
        h: 205,
        maxMl: 500,
        stepMl: 100,
        currentMl: smallBeakerMl,
        title: 'Малая мензурка (100..500 мл)'
      };

      const activeBeaker = tapTarget === 'small' ? smallBeaker : bigBeaker;
      const spoutX = activeBeaker.x + activeBeaker.w / 2;
      const spoutY = 126;
      const activeFillRatio = Math.max(0, Math.min(1, activeBeaker.currentMl / activeBeaker.maxMl));
      const activeWaterY = activeBeaker.y + activeBeaker.h - activeFillRatio * (activeBeaker.h - 22) - 6;

      renderWaterTapWidget(spoutX, spoutY, activeWaterY, tapOpen);

      renderGraduatedBeaker(bigBeaker, tapTarget === 'main');
      renderGraduatedBeaker(smallBeaker, tapTarget === 'small');

      const infoX = 632;
      const infoY = 74;
      const infoW = 232;
      rootG.appendChild(createSvgEl('rect', {
        x: infoX,
        y: infoY,
        width: infoW,
        height: 415,
        rx: 16,
        fill: '#FFFFFF',
        stroke: '#7DD3FC',
        'stroke-width': 2.5
      }));

      rootG.appendChild(createSvgEl('rect', {
        x: infoX + 12,
        y: infoY + 12,
        width: infoW - 24,
        height: 38,
        rx: 10,
        fill: '#0284C7'
      }));

      const tHead = createSvgEl('text', {
        x: infoX + infoW / 2,
        y: infoY + 36,
        'text-anchor': 'middle',
        fill: '#FFFFFF',
        'font-size': '13.5',
        'font-weight': '900'
      });
      tHead.textContent = '💧 Объём жидкости (стр. 110)';
      rootG.appendChild(tHead);

      const ruleLines = [
        'Жидкость в ёмкости',
        'занимает пространство.',
        'Значит, у неё есть ОБЪЁМ!',
        'Обозначение объёма: V',
        '',
        'Единицы измерения V:',
        '• литр (л / l)',
        '• миллилитр (мл / ml)',
        '',
        'Запомни для тетради:',
        '1 л = 1000 мл',
        'Пол-литра = 500 мл'
      ];
      ruleLines.forEach((ln, i) => {
        const isBold = ln.includes('ОБЪЁМ') || ln.includes('Обозначение') || ln.startsWith('1 л') || ln.startsWith('Пол-литра') || ln.startsWith('Запомни') || ln.startsWith('Единицы');
        const txt = createSvgEl('text', {
          x: infoX + 18,
          y: infoY + 76 + i * 24,
          fill: ln.startsWith('1 л') || ln.includes('ОБЪЁМ') || ln.includes('Обозначение') ? '#0284C7' : '#1E293B',
          'font-size': '12.5',
          'font-weight': isBold ? '900' : '700'
        });
        txt.textContent = ln;
        rootG.appendChild(txt);
      });
    }

    function renderGraduatedBeaker(cfg, isTargetUnderTap) {
      const { id, x, y, w, h, maxMl, stepMl, currentMl, title } = cfg;
      const innerH = h - 22;
      const innerBottomY = y + h - 6;

      const g = createSvgEl('g', {
        style: 'cursor: ns-resize;',
        'data-water-vessel': id,
        'data-bottom-y': innerBottomY,
        'data-inner-h': innerH,
        'data-max-ml': maxMl
      });

      const fillRatio = Math.max(0, Math.min(1, currentMl / maxMl));
      const waterH = fillRatio * innerH;
      const waterTopY = innerBottomY - waterH;

      if (isTargetUnderTap) {
        g.appendChild(createSvgEl('rect', {
          x: x - 10,
          y: y - 10,
          width: w + 20,
          height: h + 20,
          rx: 18,
          fill: 'none',
          stroke: '#38BDF8',
          'stroke-width': 2.5,
          'stroke-dasharray': '7 5'
        }));
      }

      if (currentMl > 0) {
        g.appendChild(createSvgEl('rect', {
          x: x + 6,
          y: waterTopY,
          width: w - 12,
          height: Math.max(4, waterH),
          rx: 8,
          fill: 'url(#waterGrad)'
        }));

        g.appendChild(createSvgEl('ellipse', {
          cx: x + w / 2,
          cy: waterTopY,
          rx: (w - 14) / 2,
          ry: 5,
          fill: '#7DD3FC',
          stroke: '#0284C7',
          'stroke-width': 1.5
        }));
      }

      g.appendChild(createSvgEl('path', {
        d: `M ${x - 8} ${y} L ${x + 4} ${y + 14} L ${x + 4} ${y + h - 10} Q ${x + 4} ${y + h} ${x + 16} ${y + h} L ${x + w - 16} ${y + h} Q ${x + w - 4} ${y + h} ${x + w - 4} ${y + h - 10} L ${x + w - 4} ${y} Z`,
        fill: 'url(#glassGrad)',
        stroke: '#0284C7',
        'stroke-width': 3,
        'stroke-linejoin': 'round'
      }));

      const stepsCount = Math.round(maxMl / stepMl);
      for (let s = 1; s <= stepsCount; s++) {
        const mlVal = s * stepMl;
        const tickY = innerBottomY - (mlVal / maxMl) * innerH;
        const isMajor = maxMl === 1000 ? (mlVal === 500 || mlVal === 1000) : true;

        g.appendChild(createSvgEl('line', {
          x1: x + w * 0.36,
          y1: tickY,
          x2: x + w * (isMajor ? 0.58 : 0.50),
          y2: tickY,
          stroke: '#0F172A',
          'stroke-width': isMajor ? 2.4 : 1.7
        }));

        if (isMajor) {
          const lblTxt = createSvgEl('text', {
            x: x + w * 0.62,
            y: tickY + 4,
            fill: '#0F172A',
            'font-size': '12.5',
            'font-weight': '900'
          });
          if (maxMl === 1000 && mlVal === 1000) {
            lblTxt.textContent = '1 l (1 л)';
          } else if (maxMl === 1000 && mlVal === 500) {
            lblTxt.textContent = '500 ml';
          } else {
            lblTxt.textContent = mlVal === 500 ? '500 ml' : String(mlVal);
          }
          g.appendChild(lblTxt);
        }
      }

      g.appendChild(createSvgEl('rect', {
        x: x + w / 2 - 78,
        y: y + h + 12,
        width: 156,
        height: 32,
        rx: 10,
        fill: '#0284C7'
      }));
      const readTxt = createSvgEl('text', {
        x: x + w / 2,
        y: y + h + 33,
        'text-anchor': 'middle',
        fill: '#FFFFFF',
        'font-size': '13.5',
        'font-weight': '900'
      });
      readTxt.textContent = currentMl === 1000 ? 'V = 1 л (1000 мл)' : `Объём V = ${currentMl} мл`;
      g.appendChild(readTxt);

      const capTxt = createSvgEl('text', {
        x: x + w / 2,
        y: y + h + 60,
        'text-anchor': 'middle',
        fill: '#334155',
        'font-size': '12',
        'font-weight': '800'
      });
      capTxt.textContent = title;
      g.appendChild(capTxt);

      rootG.appendChild(g);
    }

    function renderCapacityBottleAndTap() {
      const vessel = VESSELS[selectedVesselKey] || VESSELS.bottle1000;
      const maxCap = vessel.capacityMl;
      const curMl = Math.min(maxCap, vesselMl);
      const isFull = curMl >= maxCap;

      const tableG = createSvgEl('g');
      tableG.appendChild(createSvgEl('polygon', {
        points: '55,428 545,428 580,468 25,468',
        fill: 'url(#woodTableGrad)',
        stroke: '#78350F',
        'stroke-width': 2.5,
        'stroke-linejoin': 'round'
      }));
      tableG.appendChild(createSvgEl('rect', {
        x: 25,
        y: 468,
        width: 555,
        height: 16,
        rx: 3,
        fill: '#78350F'
      }));
      rootG.appendChild(tableG);

      const vx = 215;
      const vy = 158;
      const vw = 136;
      const vh = 270;
      const spoutX = vx + vw / 2;
      const spoutY = 122;

      const fillRatio = Math.max(0, Math.min(1, curMl / maxCap));
      const waterBottomY = vy + vh - 8;
      const innerMaxH = vh - 38;
      const waterH = fillRatio * innerMaxH;
      const waterTopY = waterBottomY - waterH;

      renderWaterTapWidget(spoutX, spoutY, waterTopY, tapOpen);

      const vesselG = createSvgEl('g', {
        style: 'cursor: ns-resize;',
        'data-water-vessel': 'capacityVessel',
        'data-bottom-y': waterBottomY,
        'data-inner-h': innerMaxH,
        'data-max-ml': maxCap
      });

      const clipId = 'vesselClipPath';
      const bottlePathD = vessel.shape === 'bottle'
        ? `M ${vx + 48} ${vy} L ${vx + 88} ${vy} L ${vx + 88} ${vy + 28} Q ${vx + 126} ${vy + 58} ${vx + 126} ${vy + 98} L ${vx + 126} ${vy + vh - 16} Q ${vx + 126} ${vy + vh} ${vx + 108} ${vy + vh} L ${vx + 28} ${vy + vh} Q ${vx + 10} ${vy + vh} ${vx + 10} ${vy + vh - 16} L ${vx + 10} ${vy + 98} Q ${vx + 10} ${vy + 58} ${vx + 48} ${vy + 28} Z`
        : `M ${vx + 14} ${vy + 20} L ${vx + vw - 14} ${vy + 20} L ${vx + vw - 18} ${vy + vh - 12} Q ${vx + vw - 18} ${vy + vh} ${vx + vw - 30} ${vy + vh} L ${vx + 30} ${vy + vh} Q ${vx + 18} ${vy + vh} ${vx + 18} ${vy + vh - 12} Z`;

      const clipEl = createSvgEl('clipPath', { id: clipId });
      clipEl.appendChild(createSvgEl('path', { d: bottlePathD }));
      vesselG.appendChild(clipEl);

      if (curMl > 0) {
        const waterGroup = createSvgEl('g', { 'clip-path': `url(#${clipId})` });
        waterGroup.appendChild(createSvgEl('rect', {
          x: vx,
          y: waterTopY,
          width: vw,
          height: waterH + 20,
          fill: 'url(#waterGrad)'
        }));
        waterGroup.appendChild(createSvgEl('ellipse', {
          cx: spoutX,
          cy: waterTopY,
          rx: 56,
          ry: 5,
          fill: '#7DD3FC'
        }));
        vesselG.appendChild(waterGroup);
      }

      vesselG.appendChild(createSvgEl('path', {
        d: bottlePathD,
        fill: 'url(#glassGrad)',
        stroke: isFull ? '#059669' : '#0284C7',
        'stroke-width': isFull ? 4 : 3
      }));

      const fullLineY = waterBottomY - innerMaxH;
      vesselG.appendChild(createSvgEl('line', {
        x1: vx + 18,
        y1: fullLineY,
        x2: vx + vw - 18,
        y2: fullLineY,
        stroke: '#059669',
        'stroke-width': 2,
        'stroke-dasharray': '5 4'
      }));

      vesselG.appendChild(createSvgEl('rect', {
        x: vx + vw + 8,
        y: fullLineY - 13,
        width: 224,
        height: 26,
        rx: 8,
        fill: '#ECFDF5',
        stroke: '#10B981',
        'stroke-width': 1.5
      }));
      const brimTxt = createSvgEl('text', {
        x: vx + vw + 120,
        y: fullLineY + 4,
        'text-anchor': 'middle',
        fill: '#065F46',
        'font-size': '11.5',
        'font-weight': '900'
      });
      brimTxt.textContent = `◀ Полная: ЁМКОСТЬ = ${vessel.capacityLabel}`;
      vesselG.appendChild(brimTxt);

      rootG.appendChild(vesselG);

      rootG.appendChild(createSvgEl('rect', {
        x: 55,
        y: 490,
        width: 490,
        height: 38,
        rx: 10,
        fill: isFull ? '#ECFDF5' : '#EFF6FF',
        stroke: isFull ? '#10B981' : '#93C5FD',
        'stroke-width': 2
      }));
      const statusBottomTxt = createSvgEl('text', {
        x: 300,
        y: 514,
        'text-anchor': 'middle',
        fill: isFull ? '#065F46' : '#1E3A8A',
        'font-size': '13.5',
        'font-weight': '900'
      });
      statusBottomTxt.textContent = isFull
        ? `✅ Посуда полная доверху! Ёмкость = ${vessel.capacityLabel}`
        : `Сейчас налито: ${curMl} мл из ${maxCap} мл (посуда ещё не полная)`;
      rootG.appendChild(statusBottomTxt);

      const cardX = 606;
      const cardY = 74;
      const cardW = 258;
      rootG.appendChild(createSvgEl('rect', {
        x: cardX,
        y: cardY,
        width: cardW,
        height: 444,
        rx: 16,
        fill: '#FFFFFF',
        stroke: '#BAE6FD',
        'stroke-width': 2.5
      }));

      rootG.appendChild(createSvgEl('rect', {
        x: cardX + 12,
        y: cardY + 12,
        width: cardW - 24,
        height: 38,
        rx: 10,
        fill: '#0284C7'
      }));

      const cTitle = createSvgEl('text', {
        x: cardX + cardW / 2,
        y: cardY + 36,
        'text-anchor': 'middle',
        fill: '#FFFFFF',
        'font-size': '13.5',
        'font-weight': '900'
      });
      cTitle.textContent = '🍾 Что такое ЁМКОСТЬ?';
      rootG.appendChild(cTitle);

      const defLines = [
        'Правило со стр. 110:',
        '«Ёмкость посуды — это',
        'объём жидкости,',
        'необходимой для',
        'заполнения этой посуды.»',
        '',
        `Посуда: ${vessel.name}`,
        `Налито сейчас: ${curMl} мл`,
        `Полная ёмкость: ${maxCap} мл`,
        '',
        isFull
          ? '🎉 Посуда заполнена!'
          : `Долей ещё ${maxCap - curMl} мл!`
      ];

      defLines.forEach((ln, i) => {
        const lTxt = createSvgEl('text', {
          x: cardX + 18,
          y: cardY + 76 + i * 26,
          fill: ln.startsWith('🎉') ? '#059669' : (ln.startsWith('«') || ln.endsWith('»') ? '#0C4A6E' : '#334155'),
          'font-size': '12.5',
          'font-weight': ln.startsWith('Правило') || ln.startsWith('🎉') || ln.startsWith('Полная') ? '900' : '700'
        });
        lTxt.textContent = ln;
        rootG.appendChild(lTxt);
      });
    }

    // ========================================================================
    // 4. АНИМАЦИИ СТРУИ ВОДЫ И АВТО-ВРАЩЕНИЯ 3D
    // ========================================================================
    function startTapLoop() {
      if (tapRaf) return;
      const tick = () => {
        if (!tapOpen) {
          tapRaf = null;
          return;
        }
        waterPhase += 1;

        if (scene.type === 'capacity') {
          const vessel = VESSELS[selectedVesselKey] || VESSELS.bottle1000;
          if (vesselMl < vessel.capacityMl) {
            vesselMl = Math.min(vessel.capacityMl, vesselMl + 5);
          } else {
            tapOpen = false;
          }
        } else {
          if (tapTarget === 'small') {
            if (smallBeakerMl < 500) {
              smallBeakerMl = Math.min(500, smallBeakerMl + 2.5);
            } else {
              tapOpen = false;
            }
          } else {
            if (mainBeakerMl < 1000) {
              mainBeakerMl = Math.min(1000, mainBeakerMl + 5);
            } else {
              tapOpen = false;
            }
          }
        }

        renderScene();
        notifyUpdate();

        if (tapOpen) {
          tapRaf = requestAnimationFrame(tick);
        } else {
          tapRaf = null;
          mainBeakerMl = Math.round(mainBeakerMl / 10) * 10;
          smallBeakerMl = Math.round(smallBeakerMl / 10) * 10;
          vesselMl = Math.round(vesselMl / 10) * 10;
          renderScene();
          notifyUpdate();
        }
      };
      tapRaf = requestAnimationFrame(tick);
    }

    function stopTapLoop() {
      tapOpen = false;
      if (tapRaf) {
        cancelAnimationFrame(tapRaf);
        tapRaf = null;
      }
      mainBeakerMl = Math.round(mainBeakerMl / 10) * 10;
      smallBeakerMl = Math.round(smallBeakerMl / 10) * 10;
      vesselMl = Math.round(vesselMl / 10) * 10;
    }

    function stopAutoRotate() {
      if (autoRotateRaf) {
        cancelAnimationFrame(autoRotateRaf);
        autoRotateRaf = null;
      }
    }

    function renderScene() {
      if (scene.type === 'liquid' || scene.type === 'capacity') {
        renderLiquidTapScene();
      } else {
        render3DSolidScene();
      }
    }

    const api = {
      render: renderScene,
      destroy() {
        stopAutoRotate();
        stopTapLoop();
      },
      setPointerTool(tool) {
        pointerTool = tool;
        renderScene();
        notifyUpdate();
      },
      setExplodeAmount(val) {
        viewMode = '3d';
        explodeAmount = Math.max(0, Math.min(115, Number(val) || 0));
        scheduleRender();
        notifyUpdate();
      },
      toggleExplode() {
        stopAutoRotate();
        if (scene.type === 'liquid' || scene.type === 'capacity') {
          this.toggleTap();
          return;
        }
        viewMode = '3d';
        const target = explodeAmount > 35 ? 0 : 75;
        const start = explodeAmount;
        const t0 = performance.now();
        const anim = (now) => {
          const p = Math.min(1, (now - t0) / 400);
          const ease = 1 - Math.pow(1 - p, 3);
          explodeAmount = start + (target - start) * ease;
          if (target === 0) {
            Object.keys(faceOffsets).forEach((k) => {
              faceOffsets[k].dx *= (1 - ease);
              faceOffsets[k].dy *= (1 - ease);
            });
          }
          renderScene();
          if (p < 1) {
            requestAnimationFrame(anim);
          } else {
            notifyUpdate();
          }
        };
        requestAnimationFrame(anim);
      },
      setViewMode(mode) {
        stopAutoRotate();
        viewMode = mode;
        renderScene();
        notifyUpdate();
      },
      setHighlightPart(part) {
        highlightPart = part;
        viewMode = '3d';
        renderScene();
        notifyUpdate();
      },
      setCuboidVariant(variant) {
        cuboidVariant = variant;
        renderScene();
        notifyUpdate();
      },
      toggleAutoRotate() {
        if (autoRotateRaf) {
          stopAutoRotate();
          notifyUpdate();
          return false;
        }
        viewMode = '3d';
        const loop = () => {
          rotY = (rotY + 0.85) % 360;
          renderScene();
          autoRotateRaf = requestAnimationFrame(loop);
        };
        autoRotateRaf = requestAnimationFrame(loop);
        notifyUpdate();
        return true;
      },
      toggleTap() {
        if (tapOpen) {
          stopTapLoop();
          renderScene();
          notifyUpdate();
          return false;
        }
        if (scene.type === 'capacity') {
          const vessel = VESSELS[selectedVesselKey] || VESSELS.bottle1000;
          if (vesselMl >= vessel.capacityMl) {
            vesselMl = 0;
          }
        } else {
          if (tapTarget === 'small' && smallBeakerMl >= 500) smallBeakerMl = 0;
          if (tapTarget === 'main' && mainBeakerMl >= 1000) mainBeakerMl = 0;
        }
        tapOpen = true;
        startTapLoop();
        notifyUpdate();
        return true;
      },
      pourPortionMl(deltaMl) {
        stopTapLoop();
        if (scene.type === 'capacity') {
          const vessel = VESSELS[selectedVesselKey] || VESSELS.bottle1000;
          vesselMl = Math.max(0, Math.min(vessel.capacityMl, Math.round(vesselMl + deltaMl)));
        } else if (tapTarget === 'small') {
          smallBeakerMl = Math.max(0, Math.min(500, Math.round(smallBeakerMl + deltaMl)));
        } else {
          mainBeakerMl = Math.max(0, Math.min(1000, Math.round(mainBeakerMl + deltaMl)));
        }
        renderScene();
        notifyUpdate();
      },
      drainAllWater() {
        stopTapLoop();
        if (scene.type === 'capacity') {
          vesselMl = 0;
        } else if (tapTarget === 'small') {
          smallBeakerMl = 0;
        } else {
          mainBeakerMl = 0;
        }
        renderScene();
        notifyUpdate();
      },
      setTapTarget(targetId) {
        tapTarget = targetId;
        renderScene();
        notifyUpdate();
      },
      transferSmallToBigBeaker() {
        stopTapLoop();
        const spaceInBig = 1000 - mainBeakerMl;
        const moved = Math.min(spaceInBig, smallBeakerMl);
        mainBeakerMl += moved;
        smallBeakerMl -= moved;
        renderScene();
        notifyUpdate();
      },
      selectVessel(vesselKey) {
        stopTapLoop();
        if (VESSELS[vesselKey]) {
          selectedVesselKey = vesselKey;
          vesselMl = 0;
          renderScene();
          notifyUpdate();
        }
      },
      resetScene() {
        stopAutoRotate();
        stopTapLoop();
        rotX = typeof sceneConfig.rotX === 'number' ? sceneConfig.rotX : -24;
        rotY = typeof sceneConfig.rotY === 'number' ? sceneConfig.rotY : 36;
        explodeAmount = 0;
        viewMode = '3d';
        pointerTool = 'rotate';
        highlightPart = 'faces';
        Object.keys(faceOffsets).forEach((k) => {
          faceOffsets[k] = { dx: 0, dy: 0 };
        });
        mainBeakerMl = typeof sceneConfig.mainBeakerMl === 'number' ? sceneConfig.mainBeakerMl : 500;
        smallBeakerMl = typeof sceneConfig.smallBeakerMl === 'number' ? sceneConfig.smallBeakerMl : 300;
        vesselMl = typeof sceneConfig.vesselMl === 'number' ? sceneConfig.vesselMl : 0;
        renderScene();
        notifyUpdate();
      },
      getState() {
        const vessel = VESSELS[selectedVesselKey] || VESSELS.bottle1000;
        return {
          type: scene.type,
          rotX: Math.round(rotX),
          rotY: Math.round(rotY),
          explodeAmount: Math.round(explodeAmount),
          isExploded: explodeAmount > 30,
          viewMode,
          pointerTool,
          highlightPart,
          cuboidVariant,
          inspectedFacesCount: inspectedFaces.size,
          tapOpen,
          tapTarget,
          mainBeakerMl: Math.round(mainBeakerMl),
          smallBeakerMl: Math.round(smallBeakerMl),
          vesselMl: Math.round(vesselMl),
          selectedVesselKey,
          vesselCapacityMl: vessel.capacityMl,
          vesselName: vessel.name
        };
      }
    };

    renderScene();
    return api;
  }

  return {
    createInteractiveCanvas,
    renderMiniShapeBadgeSVG
  };
})();
