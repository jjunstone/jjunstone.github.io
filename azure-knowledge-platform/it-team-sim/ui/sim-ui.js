/**
 * IT TEAM SIMULATOR — UI 레이어
 *
 * 레이아웃: 상단(제목·진행중 시나리오·가상시간) / 좌측(사건 목록) /
 *          중앙(사무실 평면도 — 캐릭터가 실제로 좌석과 상황실 사이를 오간다) /
 *          우측(상황·의사결정 패널) / 하단(타임라인)
 *
 * 판단 로직은 이 파일에 없다. 전부 ITSimDomain에서 읽어온다.
 * 이동·말풍선·연결선 애니메이션은 Motion(모션 라이브러리, CDN)으로 구현한다.
 * Motion 로드에 실패해도 레이아웃과 상태 전이는 CSS 트랜지션만으로 동작한다.
 */
(function () {
  'use strict';

  var Data = window.ITSimData;
  var Domain = window.ITSimDomain;

  var app = document.getElementById('app');
  var session = null;      // 현재 진행 중인 ITSimDomain 세션 (없으면 사건 선택 화면)
  var selectedPersonId = null; // 사이드 패널에서 상세정보를 보고 있는 담당자
  var motionReady = false;
  var motionLib = null;
  var walkFrame = 0; // 참여 중인 캐릭터의 걷기 프레임(0/1), 타이머로 교차

  (async function loadMotion() {
    try {
      motionLib = await import('https://cdn.jsdelivr.net/npm/motion@11/+esm');
      motionReady = true;
      document.documentElement.classList.add('motion-ready');
    } catch (e) {
      motionReady = false;
    }
  })();

  function esc(v) {
    return String(v === null || v === undefined ? '' : v)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function byId(id) {
    return Data.roster.filter(function (r) { return r.id === id; })[0] || null;
  }

  /* ───────────── 픽셀 아바타 생성기 ─────────────
   * 12x17 그리드를 기반으로 캐릭터를 <rect> 타일로 그린다.
   * 머리 모양(hair)으로 12명을 구분하고, 걷기 프레임(0/1)으로 다리 위치를 바꿔
   * 참여 중인 캐릭터가 실제로 걷는 것처럼 보이게 한다. */
  var PIXEL_COLS = 12;
  var PIXEL_ROWS = 17; // 0행은 머리 위 장식(번/스파이크) 전용 여유 공간
  var HEAD_OFFSET = 1;

  var HAIR_MASKS = {
    'short-side':    [[0,3,8],[1,2,3],[1,8,9]],
    'short-round':   [[0,3,8],[1,2,9]],
    'long-straight': [[0,3,8],[1,2,9],[2,2,3],[2,8,9],[3,2,3],[3,8,9],[4,2,3],[4,8,9]],
    'bun':           [[-1,5,6],[0,3,8],[1,2,9]],
    'bald-glasses':  [[1,2,3],[1,8,9]],
    'curly':         [[-1,3,8],[0,2,9],[1,2,3],[1,8,9]],
    'ponytail':      [[0,3,8],[1,2,9],[2,9,10],[3,9,10],[4,9,10]],
    'buzz':          [[0,3,8]],
    'long-wave':     [[0,3,8],[1,2,9],[2,2,4],[2,7,9],[3,2,4],[3,7,9]],
    'short-spiky':   [[-1,3,4],[-1,5,6],[-1,7,8],[0,3,8],[1,2,9]],
    'bob':           [[0,3,8],[1,2,9],[2,2,3],[2,8,9],[3,2,3],[3,8,9]],
    'long-tied':     [[0,3,8],[1,2,9],[2,8,10],[3,8,10]],
  };

  function shadeColor(hex) {
    var c = hex.replace('#', '');
    var num = parseInt(c, 16);
    var r = Math.max(0, Math.floor(((num >> 16) & 0xff) * 0.72));
    var g = Math.max(0, Math.floor(((num >> 8) & 0xff) * 0.72));
    var b = Math.max(0, Math.floor((num & 0xff) * 0.72));
    function h(x) { var s = x.toString(16); return s.length < 2 ? '0' + s : s; }
    return '#' + h(r) + h(g) + h(b);
  }

  function buildPixelGrid(hairStyle, walkFrame) {
    var grid = [];
    for (var i = 0; i < PIXEL_ROWS; i++) { grid.push(new Array(PIXEL_COLS).fill(0)); }
    function fillRange(baseRow, c0, c1, val) {
      var r = baseRow + HEAD_OFFSET;
      if (r < 0 || r >= PIXEL_ROWS) return;
      for (var c = c0; c <= c1 && c < PIXEL_COLS; c++) { if (c >= 0) grid[r][c] = val; }
    }
    for (var hr = 1; hr <= 6; hr++) fillRange(hr, 3, 8, 1);
    fillRange(4, 4, 4, 5); fillRange(4, 7, 7, 5);
    fillRange(7, 3, 8, 3);
    for (var tr = 8; tr <= 11; tr++) fillRange(tr, 2, 9, 3);
    fillRange(10, 2, 9, 4);
    fillRange(12, 3, 8, 3);
    fillRange(13, 3, 5, 6); fillRange(13, 6, 8, 6);
    fillRange(14, 3, 5, 6); fillRange(14, 6, 8, 6);
    fillRange(15, walkFrame === 0 ? 3 : 6, walkFrame === 0 ? 5 : 8, 6);
    var mask = HAIR_MASKS[hairStyle] || HAIR_MASKS['short-side'];
    mask.forEach(function (m) { fillRange(m[0], m[1], m[2], 2); });
    return grid;
  }

  function pixelAvatarSvg(person, walkFrame) {
    var grid = buildPixelGrid(person.hair, walkFrame || 0);
    var cell = 4;
    var palette = {
      1: '#f4c7a0',
      2: '#2b2b2b',
      3: person.color,
      4: shadeColor(person.color),
      5: '#1c1c1c',
      6: '#20242c',
    };
    var rects = '';
    for (var r = 0; r < grid.length; r++) {
      for (var c = 0; c < grid[r].length; c++) {
        var val = grid[r][c];
        if (!val) continue;
        rects += '<rect x="' + (c * cell) + '" y="' + (r * cell) + '" width="' + cell + '" height="' + cell + '" fill="' + palette[val] + '"/>';
      }
    }
    var w = PIXEL_COLS * cell;
    var h = PIXEL_ROWS * cell;
    return '<svg class="pixel-avatar-svg" viewBox="0 0 ' + w + ' ' + h + '" shape-rendering="crispEdges" aria-hidden="true">' + rects + '</svg>';
  }

  /**
   * 캐릭터 아바타를 렌더링한다. person.avatarImage가 지정되어 있으면 실제 이미지를,
   * 없으면 픽셀 SVG를 그린다. 나중에 ./it-team-sim/avatars/ 폴더에 {person.id}.png
   * 같은 이미지를 넣고 sim-data.js의 roster 항목에 avatarImage 경로를 추가하면
   * 코드를 더 고치지 않고도 이미지로 교체된다.
   */
  function renderAvatar(person, walkFrame) {
    if (person && person.avatarImage) {
      return '<img class="photo-avatar-img" src="' + esc(person.avatarImage) + '" alt="" aria-hidden="true">';
    }
    return pixelAvatarSvg(person, walkFrame);
  }

  /* ───────────── 상황실(war room) 좌표 배치 ─────────────
   * 참여자 수에 맞춰 상황실 내부 좌표를 배정한다. */
  var WAR_ROOM_SLOTS = {
    1: [{ x: 50, y: 46 }],
    2: [{ x: 38, y: 46 }, { x: 62, y: 46 }],
    3: [{ x: 50, y: 30 }, { x: 34, y: 56 }, { x: 66, y: 56 }],
    4: [{ x: 36, y: 30 }, { x: 64, y: 30 }, { x: 36, y: 58 }, { x: 64, y: 58 }],
  };

  function warRoomSlotsFor(count) {
    return WAR_ROOM_SLOTS[count] || WAR_ROOM_SLOTS[4];
  }

  /**
   * 현재 세션 기준으로 각 담당자(roster 전원)의 화면 좌표와 상태를 계산한다.
   * - 비참여자: 자기 좌석(seat)에 고정, idle
   * - 참여자: 상황실 슬롯으로 이동, 발언자는 speaking, 나머지는 standby
   */
  function computePositions() {
    var positions = {};
    Data.roster.forEach(function (r) {
      positions[r.id] = { x: r.seat.x, y: r.seat.y, mode: 'idle', role: null };
    });

    if (!session) return positions;

    var state = session.getState();
    var scenario = state.scenario;
    var stage = session.currentStage();
    var participants = scenario.participants;
    var slots = warRoomSlotsFor(participants.length);

    participants.forEach(function (pid, idx) {
      var slot = slots[idx] || slots[slots.length - 1];
      var mode = 'standby';
      if (stage.speaker === pid) mode = 'speaking';
      if (stage.listener === pid) mode = 'listening';
      if (scenario.player === pid) mode = (mode === 'standby') ? 'player' : mode + '-player';
      positions[pid] = { x: slot.x, y: slot.y, mode: mode, role: null };
    });

    return positions;
  }

  /* ───────────── 상단 ───────────── */

  function topbar() {
    var scenarioTitle = session ? session.getState().scenario.title : '사건을 선택하세요';
    var elapsed = session ? formatClock(session.getState().elapsedMinutes) : '09:00';
    return '<header class="sim-top">' +
      '<div class="sim-top-left">' +
        '<span class="sim-brand">IT TEAM SIMULATOR</span>' +
      '</div>' +
      '<span class="sim-current">' + esc(scenarioTitle) + '</span>' +
      '<div class="sim-top-right">' +
        '<span class="sim-clock">가상시간 ' + elapsed + '</span>' +
        (session ? '<button class="sim-btn-ghost" type="button" data-exit>사건 목록으로</button>' : '') +
        '<a class="sim-btn-ghost" href="./lab.html">LAB으로</a>' +
      '</div>' +
    '</header>';
  }

  function formatClock(mins) {
    var start = 9 * 60; // 오전 9시 기준
    var total = start + mins;
    var h = Math.floor(total / 60) % 24;
    var m = total % 60;
    return (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m;
  }

  /* ───────────── 좌측: 사건 목록 ───────────── */

  function caseList() {
    var cards = Data.scenarios.map(function (sc) {
      var isOpen = session && session.getState().scenario.id === sc.id;
      return '<button class="case-card' + (isOpen ? ' case-card-open' : '') + '" type="button" data-open-case="' + esc(sc.id) + '">' +
        '<div class="case-card-top">' +
          '<span class="case-cat">' + esc(sc.category) + '</span>' +
          '<span class="case-diff case-diff-' + esc(sc.difficulty) + '">' + esc(sc.difficulty) + '</span>' +
        '</div>' +
        '<div class="case-title">' + esc(sc.title) + '</div>' +
        '<div class="case-meta">' + esc(sc.departments.join(' · ')) + ' · 약 ' + esc(sc.estMinutes) + '분</div>' +
        '<div class="case-challenge">' + esc(sc.coreChallenge) + '</div>' +
        (sc.isAssumption ? '<div class="case-assumption">시뮬레이터 가정 시나리오</div>' : '') +
      '</button>';
    }).join('');
    return '<aside class="sim-cases">' +
      '<div class="sim-cases-title">사건 목록</div>' +
      cards +
    '</aside>';
  }

  /* ───────────── 중앙: 사무실 평면도 + 조직 캐릭터 ───────────── */

  function officeFloor() {
    var positions = computePositions();
    var stage = session ? session.currentStage() : null;

    var zoneLabels = '<div class="floor-zone-box" style="left:3%;top:4%;width:40%;height:28%;"><span class="floor-zone-label">DBA팀</span></div>' +
      '<div class="floor-zone-box" style="left:57%;top:4%;width:40%;height:28%;"><span class="floor-zone-label">보안팀</span></div>' +
      '<div class="floor-zone-box" style="left:3%;top:36%;width:40%;height:28%;"><span class="floor-zone-label">네트워크팀</span></div>' +
      '<div class="floor-zone-box" style="left:57%;top:36%;width:40%;height:28%;"><span class="floor-zone-label">인프라/DevOps팀</span></div>' +
      '<div class="floor-zone-box" style="left:30%;top:68%;width:40%;height:26%;"><span class="floor-zone-label">서버팀</span></div>' +
      '<div class="war-room-ring' + (session ? ' war-room-active' : '') + '"></div>' +
      (session ? '<div class="war-room-label">상황실</div>' : '');

    // SVG connector layer (speaker -> listener)
    var connectorSvg = '';
    if (session && stage && stage.listener) {
      var from = positions[stage.speaker];
      var to = positions[stage.listener];
      if (from && to) {
        connectorSvg = '<svg class="org-connectors" viewBox="0 0 100 100" preserveAspectRatio="none">' +
          '<line class="connector-line" x1="' + from.x + '" y1="' + from.y + '" x2="' + to.x + '" y2="' + to.y + '" />' +
          '<circle class="connector-pulse" r="1.4"><animateMotion dur="1.4s" repeatCount="indefinite" path="M' + from.x + ',' + from.y + ' L' + to.x + ',' + to.y + '" /></circle>' +
        '</svg>';
      }
    }

    var nodes = Data.roster.map(function (r) {
      var pos = positions[r.id];
      var isParticipant = session && session.getState().scenario.participants.indexOf(r.id) !== -1;
      var modeClass = isParticipant ? ' mode-' + pos.mode.replace(/ /g, '-') : ' mode-idle';
      var statusText = !isParticipant ? '대기'
        : pos.mode.indexOf('speaking') !== -1 ? '보고 중'
        : pos.mode.indexOf('listening') !== -1 ? '확인 중'
        : pos.mode.indexOf('player') !== -1 ? '담당 중'
        : '투입됨';
      return '<div class="org-node' + modeClass + '" data-person="' + esc(r.id) + '" ' +
          'style="left:' + pos.x + '%;top:' + pos.y + '%;--role-color:' + esc(r.color) + '" ' +
          'role="button" tabindex="0" aria-label="' + esc(r.name) + ' 상세 정보">' +
        '<div class="org-avatar">' + renderAvatar(r, isParticipant ? walkFrame : 0) + '</div>' +
        '<div class="org-name">' + esc(r.name) + '</div>' +
        '<div class="org-status' + (isParticipant ? '' : ' org-status-idle') + '">' + esc(statusText) + '</div>' +
      '</div>';
    }).join('');

    return '<section class="sim-org">' +
      '<div class="sim-org-title">전산보안실 조직도 — 캐릭터를 클릭하면 담당 업무를 볼 수 있습니다</div>' +
      '<div class="org-floor">' + zoneLabels + connectorSvg + nodes + '</div>' +
      personDetailPanel() +
    '</section>';
  }

  function truncate(s, n) {
    if (!s) return '';
    return s.length > n ? s.slice(0, n - 1) + '…' : s;
  }

  function personDetailPanel() {
    if (!selectedPersonId) return '';
    var p = byId(selectedPersonId);
    if (!p) return '';
    var inCase = session && session.getState().scenario.participants.indexOf(p.id) !== -1;
    return '<div class="person-popover" data-person-popover>' +
      '<button class="person-popover-close" type="button" data-close-person aria-label="닫기">×</button>' +
      '<div class="person-popover-head" style="--role-color:' + esc(p.color) + '">' +
        '<div class="person-popover-avatar">' + renderAvatar(p, 0) + '</div>' +
        '<div>' +
          '<div class="person-popover-name">' + esc(p.name) + '</div>' +
          '<div class="person-popover-dept">' + esc(p.dept) + '</div>' +
        '</div>' +
      '</div>' +
      '<div class="person-popover-authority">' + esc(p.authority) + '</div>' +
      '<div class="person-popover-label">담당 업무</div>' +
      '<ul class="person-popover-list">' + p.responsibilities.map(function (r) { return '<li>' + esc(r) + '</li>'; }).join('') + '</ul>' +
      (inCase ? '<div class="person-popover-tag">현재 사건에 투입됨</div>' : '<div class="person-popover-tag person-popover-tag-idle">현재 대기 중</div>') +
    '</div>';
  }

  /* ───────────── 우측: 상황 및 의사결정 패널 ───────────── */

  function decisionPanel() {
    if (!session) {
      return '<section class="sim-panel sim-panel-empty">' +
        '<p>좌측에서 사건을 선택하면 조직도의 캐릭터가 움직이고, 여기 상황 설명과 의사결정 카드가 표시됩니다.</p>' +
      '</section>';
    }
    var state = session.getState();
    var stage = session.currentStage();
    var scenario = state.scenario;
    var playerRole = byId(scenario.player);

    var html = '<section class="sim-panel">';
    html += '<div class="sim-panel-head">';
    html += '<span class="sim-panel-eyebrow">진행 중 · 당신은 ' + esc(playerRole ? playerRole.name : '') + '</span>';
    html += '<h2 class="sim-panel-title">' + esc(scenario.title) + '</h2>';
    html += '<p class="sim-panel-brief">' + esc(scenario.briefing) + '</p>';
    html += '</div>';

    if (!state.done) {
      html += '<div class="sim-narration">' + esc(stage.narration) + '</div>';
      if (stage.facts && stage.facts.length) {
        html += '<ul class="sim-facts">' + stage.facts.map(function (f) {
          return '<li>' + esc(f) + '</li>';
        }).join('') + '</ul>';
      }
      html += '<div class="sim-choices">';
      (stage.choices || []).forEach(function (c) {
        html += '<button class="sim-choice-card" type="button" data-choice="' + esc(c.id) + '">' +
          '<span class="sim-choice-label">' + esc(c.label) + '</span>' +
          '<span class="sim-choice-arrow">선택 →</span>' +
        '</button>';
      });
      html += '</div>';
    } else {
      var resultClass = stage.result === 'resolved' ? 'result-resolved' : 'result-partial';
      html += '<div class="sim-result ' + resultClass + '">';
      html += '<div class="sim-result-badge">' + (stage.result === 'resolved' ? '정상 해결' : '부분 해결 — 개선 필요') + '</div>';
      html += '<p class="sim-result-summary">' + esc(stage.summary) + '</p>';
      html += '<div class="sim-lessons-title">이 사건에서 확인할 점</div>';
      html += '<ul class="sim-lessons">' + (stage.lessons || []).map(function (l) {
        return '<li>' + esc(l) + '</li>';
      }).join('') + '</ul>';
      html += '<button class="sim-btn-primary" type="button" data-exit>사건 목록으로 돌아가기</button>';
      html += '</div>';
    }

    html += '</section>';
    return html;
  }

  /* ───────────── 우측 하단: 보고 스레드 ─────────────
   * 누가 누구에게 보고/요청했는지를 이메일 체인처럼 시간 순서대로 쌓아 보여준다.
   * Domain의 state.thread를 그대로 읽어 렌더링만 한다. */
  function reportThread() {
    if (!session) {
      return '<section class="sim-thread sim-thread-empty"></section>';
    }
    var state = session.getState();
    var items = state.thread.map(function (msg) {
      var fromP = byId(msg.from);
      var toP = msg.to ? byId(msg.to) : null;
      var kindClass = msg.isAction ? ' thread-msg-action' : (msg.terminal ? ' thread-msg-terminal' : '');
      var routeLabel = msg.isAction
        ? (esc(fromP ? fromP.name : '') + '의 조치')
        : (toP ? (esc(fromP ? fromP.name : '') + ' → ' + esc(toP.name)) : (esc(fromP ? fromP.name : '') + ' → 전체 공유'));
      return '<div class="thread-msg' + kindClass + '">' +
        '<div class="thread-msg-avatar" style="--role-color:' + esc(fromP ? fromP.color : '#8a8a8a') + '">' +
          (fromP ? renderAvatar(fromP, 0) : '') +
        '</div>' +
        '<div class="thread-msg-body">' +
          '<div class="thread-msg-head">' +
            '<span class="thread-msg-route">' + routeLabel + '</span>' +
            '<span class="thread-msg-time">' + esc(msg.at) + '</span>' +
          '</div>' +
          '<p class="thread-msg-text">' + esc(msg.body) + '</p>' +
        '</div>' +
      '</div>';
    }).join('');
    return '<section class="sim-thread">' +
      '<div class="sim-thread-title">보고 스레드 — 누가 누구에게 전달했는지</div>' +
      '<div class="thread-list">' + items + '</div>' +
    '</section>';
  }
  /* ───────────── 하단: 타임라인 ───────────── */

  function timeline() {
    if (!session) return '<footer class="sim-timeline sim-timeline-empty"></footer>';
    var items = session.getState().timeline.map(function (t) {
      return '<div class="tl-item">' +
        '<span class="tl-time">' + esc(t.at) + '</span>' +
        '<span class="tl-label">' + esc(t.label) + '</span>' +
        (t.detail ? '<span class="tl-detail">' + esc(t.detail) + '</span>' : '') +
      '</div>';
    }).join('');
    return '<footer class="sim-timeline"><div class="tl-title">사건 타임라인</div><div class="tl-list">' + items + '</div></footer>';
  }

  /* ───────────── 전체 렌더 ───────────── */

  var prevPositions = null;

  function draw() {
    app.innerHTML = topbar() + '<div class="sim-body">' + caseList() + officeFloor() +
      '<div class="sim-right-col">' + decisionPanel() + reportThread() + '</div>' +
    '</div>' + timeline();
    wire();
    animateEntrance();
  }

  function animateEntrance() {
    if (!motionReady || !motionLib) return;
    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;
    var animate = motionLib.animate;
    var stagger = motionLib.stagger;

    // 캐릭터 노드: 위치가 바뀐 경우(사건 참여/이동) 부드럽게 slide-in
    var nodes = app.querySelectorAll('.org-node');
    nodes.forEach(function (el) {
      var isParticipant = el.className.indexOf('mode-idle') === -1;
      if (isParticipant) {
        animate(el, { scale: [0.86, 1], opacity: [0, 1] }, { duration: 0.45, easing: [0.22, 1, 0.36, 1] });
      }
    });

    // 말풍선 pop-in
    var bubbles = app.querySelectorAll('.org-bubble');
    bubbles.forEach(function (el) {
      animate(el, { scale: [0.7, 1], opacity: [0, 1], y: [6, 0] }, { duration: 0.3, delay: 0.15, easing: [0.34, 1.56, 0.64, 1] });
    });

    // 연결선 draw-in
    var lines = app.querySelectorAll('.connector-line');
    lines.forEach(function (el) {
      animate(el, { opacity: [0, 1] }, { duration: 0.4 });
    });

    // 사건 카드 / 선택 카드 stagger
    animate('.sim-choice-card', { opacity: [0, 1], y: [8, 0] }, { duration: 0.35, delay: stagger(0.06) });

    // 담당자 상세 패널 pop
    var pop = app.querySelector('[data-person-popover]');
    if (pop) {
      animate(pop, { scale: [0.92, 1], opacity: [0, 1] }, { duration: 0.25, easing: [0.22, 1, 0.36, 1] });
    }
  }

  function wire() {
    app.querySelectorAll('[data-open-case]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        openCase(btn.getAttribute('data-open-case'));
      });
    });
    app.querySelectorAll('[data-choice]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (!session) return;
        session.choose(btn.getAttribute('data-choice'));
        draw();
      });
    });
    app.querySelectorAll('[data-exit]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        session = null;
        selectedPersonId = null;
        draw();
      });
    });
    app.querySelectorAll('[data-person]').forEach(function (node) {
      node.addEventListener('click', function () {
        var pid = node.getAttribute('data-person');
        selectedPersonId = (selectedPersonId === pid) ? null : pid;
        draw();
      });
      node.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          node.click();
        }
      });
    });
    var closeBtn = app.querySelector('[data-close-person]');
    if (closeBtn) {
      closeBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        selectedPersonId = null;
        draw();
      });
    }
  }

  function openCase(id) {
    var scenario = Data.scenarios.filter(function (s) { return s.id === id; })[0];
    if (!scenario) return;
    session = Domain.createCaseSession(scenario);
    selectedPersonId = null;
    draw();
  }


  /* 참여 중인 캐릭터만 걷기 프레임을 바꿔 다리를 교차시킨다.
   * 전체 draw()를 다시 부르지 않고 아바타 SVG만 바꿔서 팝오버 등 다른 상태를 건드리지 않는다. */
  setInterval(function () {
    if (!session) return;
    walkFrame = walkFrame === 0 ? 1 : 0;
    var participants = session.getState().scenario.participants;
    participants.forEach(function (pid) {
      var selector = "[data-person=\"" + pid + "\"] .org-avatar";
      var node = app.querySelector(selector);
      if (!node) return;
      var person = byId(pid);
      if (!person) return;
      node.innerHTML = renderAvatar(person, walkFrame);
    });
  }, 420);
  draw();
})();
