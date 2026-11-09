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

  /**
   * 캐릭터 아바타를 렌더링한다. 이미지 로딩에 의존하지 않고,
   * 이름 첫 글자를 역할 색상 원형 배지로 보여준다.
   */
  function renderAvatar(person) {
    if (!person) return '';
    var initial = esc((person.shortLabel || person.name || '').slice(0, 1));
    return '<span class="org-avatar" style="--role-color:' + esc(person.color) + '">' + initial + '</span>';
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

  var ZONE_ORDER = ['총괄', 'DBA팀', '보안팀', '네트워크팀', '인프라/DevOps팀', '서버팀'];

  function renderPersonNode(r, pos, isParticipant) {
    var modeClass = isParticipant ? ' mode-' + pos.mode.replace(/ /g, '-') : ' mode-idle';
    var statusText = !isParticipant ? '대기'
      : pos.mode.indexOf('speaking') !== -1 ? '보고 중'
      : pos.mode.indexOf('listening') !== -1 ? '확인 중'
      : pos.mode.indexOf('player') !== -1 ? '담당 중'
      : '투입됨';
    return '<div class="org-node' + modeClass + '" data-person="' + esc(r.id) + '" ' +
        'style="--role-color:' + esc(r.color) + '" ' +
        'role="button" tabindex="0" aria-label="' + esc(r.name) + ' 상세 정보">' +
      renderAvatar(r) +
      '<div>' +
        '<div class="org-name">' + esc(r.name) + '</div>' +
        '<div class="org-status' + (isParticipant ? '' : ' org-status-idle') + '">' + esc(statusText) + '</div>' +
      '</div>' +
    '</div>';
  }

  function serviceStatusBoard() {
    var affectedDepts = session ? session.getState().scenario.departments : [];
    var chips = Data.services.map(function (svc) {
      var isAffected = affectedDepts.indexOf(svc.dept) !== -1;
      var cls = isAffected ? ' svc-affected' : '';
      var statusLabel = isAffected ? '대응 중' : '정상';
      return '<span class="svc-chip' + cls + '" title="' + esc(svc.dept) + ' · ' + esc(statusLabel) + '">' +
        '<span class="svc-dot"></span>' + esc(svc.name) +
      '</span>';
    }).join('');
    return '<div class="svc-board"><div class="svc-board-label">전산실 운영 서비스 20종' + (session ? ' — 빨간 점은 현재 사건으로 대응 중인 서비스' : '') + '</div><div class="svc-board-chips">' + chips + '</div></div>';
  }

  function officeFloor() {
    var positions = computePositions();
    var participants = session ? session.getState().scenario.participants : [];

    var zones = ZONE_ORDER.map(function (deptName) {
      var members = Data.roster.filter(function (r) { return r.dept === deptName; });
      var people = members.map(function (r) {
        var isParticipant = participants.indexOf(r.id) !== -1;
        return renderPersonNode(r, positions[r.id], isParticipant);
      }).join('');
      return '<div class="org-zone" data-zone="' + esc(deptName) + '">' +
        '<div class="org-zone-label">' + esc(deptName) + '</div>' +
        '<div class="org-zone-people">' + people + '</div>' +
      '</div>';
    }).join('');

    var warRoomZone = '';
    if (session) {
      var warRoomPeople = participants.map(function (pid) {
        var r = byId(pid);
        if (!r) return '';
        return renderPersonNode(r, positions[pid], true);
      }).join('');
      warRoomZone = '<div class="org-zone org-zone-warroom">' +
        '<div class="org-zone-label">상황실 — 현재 투입된 담당자</div>' +
        '<div class="org-zone-people">' + warRoomPeople + '</div>' +
      '</div>';
    }

    return '<section class="sim-org">' +
      '<div class="sim-org-title">전산보안실 조직도 — 캐릭터를 클릭하면 담당 업무를 볼 수 있습니다</div>' +
      serviceStatusBoard() +
      '<div class="org-floor' + (session ? '' : ' no-session') + '">' + warRoomZone + zones + '</div>' +
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
        '<div class="person-popover-avatar">' + renderAvatar(p) + '</div>' +
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
        '<div class="sim-intro-eyebrow">이 LAB을 만든 이유</div>' +
        '<h2 class="sim-intro-title">헬프데스크가 아니라, 전산실 전체를 운영하는 관점</h2>' +
        '<p class="sim-intro-lead">' +
          'IT 부서는 "장애를 고치는 곳"으로만 보이기 쉽지만, 실제로는 12개 역할이 각자의 승인 권한과 책임 범위를 가지고 ' +
          '서로의 업무를 넘겨받는 조직입니다. 이 LAB은 금융권 전산실을 가정해 20개 서비스와 24개 업무 흐름을 설계하고, ' +
          '그중 역할 경계가 가장 날카롭게 드러나는 5개 상황을 플레이 가능한 시나리오로 옮긴 것입니다.' +
        '</p>' +
        '<div class="sim-intro-block">' +
          '<div class="sim-intro-block-title">여기서 직접 확인할 수 있는 것</div>' +
          '<ul class="sim-intro-list">' +
            '<li>가운데 조직도의 12개 역할이 각각 어떤 서비스에 책임(Accountable)을 지는지</li>' +
            '<li>장애·요청이 발생했을 때 누가 1차 대응하고, 언제 상위 역할에 에스컬레이션해야 하는지</li>' +
            '<li>"내 담당이 아니다"와 "내가 더 빨리 알아챌 수 있었다"가 동시에 성립하는 책임 경계의 모호함</li>' +
            '<li>기술 선택(예: VPN 게이트웨이, PAM, SIEM)이 실제 운영 업무량과 역할 분담에 미치는 영향</li>' +
          '</ul>' +
        '</div>' +
        '<p class="sim-intro-cta">왼쪽 사건 목록에서 하나를 선택하면 조직도의 담당자들이 상황실로 이동하고, 선택에 따라 결과가 갈립니다.</p>' +
        '<p class="sim-intro-note">조직·서비스·업무 흐름의 전체 설계 근거는 저장소의 IT TEAM-design/ 문서에 있으며, ' +
          '이 중 5개 시나리오는 설계 문서의 정상 절차를 장애/예외 상황으로 재구성한 가정입니다.' +
        '</p>' +
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
          (fromP ? renderAvatar(fromP) : '') +
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

    // 참여 중인 캐릭터 노드: 상황실 투입 시 부드럽게 fade-in
    var nodes = app.querySelectorAll('.org-node');
    nodes.forEach(function (el) {
      var isParticipant = el.className.indexOf('mode-idle') === -1;
      if (isParticipant) {
        animate(el, { opacity: [0, 1] }, { duration: 0.3, easing: [0.22, 1, 0.36, 1] });
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

  draw();
})();
