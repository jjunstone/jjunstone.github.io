/**
 * Change Gate — 화면
 *
 * 한 화면에 요청, 변경 내용, 근거를 모두 놓는다. 방문자가 누르는 것은
 * 승인 또는 반려 한 번이다. 해석과 정책 평가는 화면을 넘기지 않고
 * 서비스가 한 번에 처리한다.
 *
 * 판단 규칙은 이 파일에 없다. 전부 도메인에서 읽어온다.
 */
(function () {
  'use strict';

  var Data = window.ChangeGateData;
  var Service = window.ChangeGateService;
  var D = window.ChangeGateDomain;
  var S = D.RequestStatus;

  var app = document.getElementById('app');
  var service = null;
  var snap = null;
  var holding = false;

  function esc(v) {
    return String(v === null || v === undefined ? '' : v)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  /** VPN-DEV, DEV-DB:READ 같은 키를 읽기 쉬운 형태로. */
  function name(key) { return esc(String(key).replace(':', ' / ')); }

  /** 권한 키에 붙는 한 줄 설명. 코드가 아니라 사람 말로 보이게. */
  var MEANS = {
    'VPN-USER': '기본 VPN 접속',
    'VPN-DEV': '개발망 VPN 접속',
    'VPN-OPS': '운영망 VPN 접속',
    'DEV-TOOLS': '개발 도구 그룹',
    'OPS-TOOLS': '운영 도구 그룹',
    'DEV-TOOLS:READ': '개발 도구 조회',
    'DEV-DB:READ': '개발 DB 조회',
    'DEV-DB:WRITE': '개발 DB 쓰기',
    'OPS-DB:READ': '운영 DB 조회',
    'PROD-DB:READ': '운영 DB 조회',
    'PROD-DB:WRITE': '운영 DB 쓰기'
  };
  function means(key) { return MEANS[key] || ''; }

  var RISK_KO = { LOW: '낮음', MEDIUM: '보통', HIGH: '높음' };

  var MISSING_KO = {
    'Resource': '어떤 권한이 필요한지',
    'Access Type': '읽기인지 쓰기인지',
    'Duration': '얼마나 오래 필요한지',
    'Business Justification': '왜 필요한지'
  };

  /* ───────────── 입구 ───────────── */

  function drawIntro() {
    app.innerHTML =
      '<section class="intro">' +
        '<p class="eyebrow">권한 변경 프로세스 · 가상 환경 데모</p>' +
        '<h1 class="intro-title">권한 요청을 그대로 실행하지 않고,<br>기준을 세워 판단하게 만들었습니다.</h1>' +
        '<p class="intro-line">요청을 해석해 <b>역할과 현재 권한을 확인</b>하고, ' +
        '최소 권한과 기간 제한 같은 기준을 적용해 변경안을 만듭니다. ' +
        '<b>사람이 승인한 계획만 실행</b>하고, 바뀐 뒤 실제 상태를 다시 확인합니다.</p>' +
        stages() +
        '<div class="pick">' +
          Data.runtime.map(function (s) {
            return '<button class="pick-card" type="button" data-open="' + esc(s.id) + '">' +
              '<span><span class="pick-name">' + esc(s.title || s.name) + '</span>' +
              '<span class="pick-req">' + esc(s.requestText) + '</span></span>' +
              '<span class="pick-go">열기 →</span>' +
              '</button>';
          }).join('') +
        '</div>' +
        '<p class="intro-foot">계정과 정책은 모두 가상입니다. 실제 시스템에 연결되어 있지 않고, ' +
        '요청 해석은 정해진 규칙으로 동작합니다. 판단을 제안하는 것과 실제로 바꾸는 것은 분리해 두었습니다.</p>' +
      '</section>';

    app.querySelectorAll('[data-open]').forEach(function (b) {
      b.addEventListener('click', function () { open(b.getAttribute('data-open')); });
    });
  }


  /**
   * 처리 단계를 한 줄로 보여준다. 어느 단계가 사람의 몫인지 표시해서
   * 제안과 실행의 경계를 첫 화면에서 알 수 있게 한다.
   */
  function stages() {
    var steps = [
      { n: '01', t: '요청 해석', d: '역할 · 현재 권한 확인' },
      { n: '02', t: '기준 적용', d: '최소 권한 · 기간 · 위험도' },
      { n: '03', t: '변경안 제안', d: '무엇을 주고 무엇을 거둘지' },
      { n: '04', t: '사람이 승인', d: '이 단계 없이 실행 안 됨', me: true },
      { n: '05', t: '승인 범위 실행', d: 'AD · VPN · DB' },
      { n: '06', t: '상태 확인', d: '요청 상태와 실제 상태 비교' }
    ];
    return '<ol class="stages">' + steps.map(function (s) {
      return '<li class="stage' + (s.me ? ' human' : '') + '">' +
        '<span class="stage-n">' + s.n + '</span>' +
        '<span class="stage-t">' + esc(s.t) + '</span>' +
        '<span class="stage-d">' + esc(s.d) + '</span>' +
        '</li>';
    }).join('') + '</ol>';
  }


  function findScenario(id) {
    var all = Data.runtime.concat(Data.library);
    for (var i = 0; i < all.length; i += 1) if (all[i].id === id) return all[i];
    return null;
  }

  /**
   * 케이스를 열면 판단이 필요한 지점까지 한 번에 진행한다.
   * 해석과 정책 평가는 사람이 결정할 것이 없어서 화면을 나누지 않는다.
   */
  function open(id) {
    var scenario = findScenario(id);
    if (!scenario) return;

    service = Service.createCaseService({
      fixtures: Data.fixtures,
      scenario: scenario,
      onChange: function (s) { snap = s; if (!holding) draw(); }
    });

    // prepare()는 해석 · 정책 · 검토를 연달아 실행하며 그때마다 알림을 보낸다.
    // 중간 상태는 아직 변경안이 없으므로 그리지 않고 마지막 것만 그린다.
    holding = true;
    service.prepare();
    holding = false;
    draw();
    window.scrollTo(0, 0);
  }

  function back() { service = null; snap = null; drawIntro(); window.scrollTo(0, 0); }

  /* ───────────── 심사 화면 ───────────── */

  function draw() {
    var s = snap;
    app.innerHTML = '<section class="case on">' + head(s) + bodyFor(s) + tail(s) + '</section>';
    wire();
  }

  var LABEL = {};
  LABEL[S.PENDING_APPROVAL] = { t: '승인 대기', c: 'wait' };
  LABEL[S.NEEDS_INFO] = { t: '정보 부족', c: 'wait' };
  LABEL[S.POLICY_BLOCKED] = { t: '정책 위반', c: 'no' };
  LABEL[S.EXCEPTION_REVIEW] = { t: '예외 검토로 이관', c: 'wait' };
  LABEL[S.NO_CHANGE_REQUIRED] = { t: '변경할 것 없음', c: 'wait' };
  LABEL[S.REJECTED] = { t: '반려', c: 'no' };
  LABEL[S.EXECUTING] = { t: '적용 중', c: 'run' };
  LABEL[S.VERIFYING] = { t: '확인 중', c: 'run' };
  LABEL[S.VERIFICATION_FAILED] = { t: '확인 실패', c: 'no' };
  LABEL[S.EXECUTION_FAILED] = { t: '적용 실패', c: 'no' };
  LABEL[S.COMPLETED] = { t: '완료', c: 'ok' };
  LABEL[S.CLOSED] = { t: '요청자에게 반환', c: 'wait' };

  function badge(status) {
    var l = LABEL[status] || { t: status, c: 'wait' };
    return '<span class="badge ' + l.c + '">' + esc(l.t) + '</span>';
  }

  function head(s) {
    var target = s.context.target;
    return '<div class="head">' +
      '<button class="head-back" type="button" data-back>← 목록</button>' +
      '<span class="head-id">' + esc(s.caseId) + '</span>' +
      '<span class="head-sep">·</span>' +
      '<span class="head-who"><b>' + esc(target.role) + '</b> <span>' + esc(target.department) + '</span></span>' +
      '<span class="head-right">' + badge(s.status) + '</span>' +
      '</div>';
  }

  function ask(s) {
    return '<div class="ask">' +
      '<span class="ask-tag">요청</span>' +
      '<span class="ask-text">' + esc(s.requestText) + '</span>' +
      '</div>';
  }

  /* ── 요청을 무엇으로 읽었나 ── */

  /**
   * 해석 결과를 보여준다. '요청을 읽었다'에서 끝나지 않도록 역할과 업무 맥락,
   * 그리고 요청에 없어서 제외한 범위까지 같이 놓는다.
   */
  function readRequest(s) {
    var i = s.interpretation;
    var c = s.context;
    var b = s.plan ? s.plan.basis : null;

    var rows = [
      ['요청 의도', i.isRoleChange ? '직무 변경에 따른 권한 재검토' : '개발 업무에 필요한 접근 요청'],
      ['대상 역할', i.isRoleChange ? c.effectiveRole + ' → ' + c.newRole : c.effectiveRole],
      ['소속', i.isRoleChange ? c.target.department + ' → ' + c.newDepartment : c.target.department]
    ];
    if (i.justification) rows.push(['업무 사유', i.justification]);
    if (b && b.excluded.length) rows.push(['요청에 없던 범위', b.excluded.join(', ') + ' (제외)']);

    return '<div class="read">' +
      '<div class="read-head"><span class="eyebrow">요청 해석</span>' +
      '<span class="read-src">기준 데이터: ' + esc(c.reference.map(refKo).join(' · ')) + '</span></div>' +
      '<dl class="read-list">' +
        rows.map(function (r) {
          return '<div class="read-row"><dt>' + esc(r[0]) + '</dt><dd>' + esc(r[1]) + '</dd></div>';
        }).join('') +
      '</dl></div>';
  }

  var REF_KO = { DIRECTORY: '계정 정보', 'ACCESS STATE': '현재 권한', 'ROLE POLICY': '역할 정책' };
  function refKo(r) { return REF_KO[r] || r; }

  /* ── 판단 기준: 이 화면의 중심 ── */

  /**
   * 왜 이 변경안인가. 권한 목록보다 먼저 읽혀야 하는 영역이다.
   * 적용한 설계 원칙을 이름으로 보여주고 Rule ID는 뒤에 작게 붙인다.
   */
  function basis(s) {
    if (!s.plan) return '';
    var b = s.plan.basis;

    return '<div class="basis">' +
      '<div class="basis-top">' +
        '<span class="eyebrow">판단 기준</span>' +
        '<h2 class="basis-say">' + esc(b.summary) + '</h2>' +
      '</div>' +
      '<div class="basis-grid">' +
        b.principles.map(function (pr) {
          return '<div class="pr">' +
            '<div class="pr-head"><span class="pr-check" aria-hidden="true">✓</span>' +
            '<span class="pr-label">' + esc(pr.label) + '</span>' +
            '<span class="pr-rule">' + esc(pr.ruleId) + '</span></div>' +
            '<p class="pr-desc">' + esc(pr.desc) + '</p>' +
            '</div>';
        }).join('') +
      '</div>' +
      '</div>';
  }

  /* ── 승인 기준: 왜 이 단계인가 ── */

  /**
   * 막힌 요청에도 판단 기준을 보여준다. 통과한 케이스와 같은 자리에 같은
   * 모양으로 놓아서, 정책이 결과를 실제로 바꾼다는 것이 읽히게 한다.
   */
  function blockedBasis(s) {
    var blocking = s.policy.results.filter(function (r) { return r.outcome === 'BLOCK'; });
    var seen = [];
    var items = [];

    blocking.forEach(function (r) {
      if (!r.principle || seen.indexOf(r.principle) !== -1) return;
      seen.push(r.principle);
      items.push({ label: r.principleLabel, desc: r.principleDesc, ruleId: r.ruleId, blocked: true });
    });
    items.push({
      label: '책임 분리',
      desc: '이 수준의 요청은 담당자 승인만으로 처리하지 않습니다.',
      ruleId: 'APPROVAL-03'
    });

    var route = s.policy.approvalRoute;

    return '<div class="basis">' +
      '<div class="basis-top">' +
        '<span class="eyebrow">판단 기준</span>' +
        '<h2 class="basis-say">' + esc(s.policy.approvalBasis.reason) + '</h2>' +
      '</div>' +
      '<div class="basis-grid">' +
        items.map(function (it) {
          return '<div class="pr' + (it.blocked ? ' stop' : '') + '">' +
            '<div class="pr-head"><span class="pr-check" aria-hidden="true">' +
            (it.blocked ? '✕' : '✓') + '</span>' +
            '<span class="pr-label">' + esc(it.label) + '</span>' +
            '<span class="pr-rule">' + esc(it.ruleId) + '</span></div>' +
            '<p class="pr-desc">' + esc(it.desc) + '</p>' +
            '</div>';
        }).join('') +
      '</div>' +
      '<div class="basis-foot">' +
        '<span class="basis-foot-k">이 요청에 필요한 승인</span>' +
        '<span class="basis-foot-v">' + esc(route.join(' → ')) + '</span>' +
      '</div>' +
      '</div>';
  }

  /** 계획을 만들기 전에 멈춘 경우의 기준. */
  function stoppedBasis(s, items) {
    return '<div class="basis">' +
      '<div class="basis-top"><span class="eyebrow">판단 기준</span></div>' +
      '<div class="basis-grid">' +
        items.map(function (it) {
          return '<div class="pr"><div class="pr-head">' +
            '<span class="pr-check" aria-hidden="true">✓</span>' +
            '<span class="pr-label">' + esc(it[0]) + '</span></div>' +
            '<p class="pr-desc">' + esc(it[1]) + '</p></div>';
        }).join('') +
      '</div></div>';
  }


  function approval(s) {
    if (!s.plan) return '';
    var a = s.plan.basis.approval;
    var route = s.plan.approvalRoute;
    var riskWord = RISK_KO[s.plan.risk.level] || s.plan.risk.level;
    var done = s.ledger.length > 0;

    return '<div class="appr">' +
      '<div class="appr-left">' +
        '<span class="eyebrow">승인 기준</span>' +
        '<p class="appr-type">' + esc(a.changeType) + '</p>' +
        '<p class="appr-why">' + esc(a.reason) + '</p>' +
      '</div>' +
      '<div class="appr-right">' +
        '<div class="appr-line"><span class="appr-k">위험도</span><span class="appr-v">' + esc(riskWord) + '</span></div>' +
        '<div class="appr-line"><span class="appr-k">승인 단계</span><span class="appr-v">' +
          route.map(function (r, idx) {
            var passed = done && idx === 0;
            return '<span class="appr-step' + (passed ? ' ok' : '') + '">' + esc(r) + '</span>';
          }).join('<span class="appr-arrow" aria-hidden="true">→</span>') +
        '</span></div>' +
      '</div>' +
      '</div>';
  }


  /* ── 화면 고르기 ── */

  function bodyFor(s) {
    if (s.status === S.NEEDS_INFO) {
      return ask(s) + needInfo(s) + stoppedBasis(s, [
        ['추측하지 않음', '없는 값을 채워 넣지 않습니다.'],
        ['실행 전 차단', '계획을 만들지 않으므로 실행할 것이 없습니다.']
      ]);
    }
    if (s.status === S.POLICY_BLOCKED || s.status === S.EXCEPTION_REVIEW) {
      var html = ask(s) + readRequest(s) + blocked(s) + blockedBasis(s);
      if (s.status === S.EXCEPTION_REVIEW) {
        html += closedLine('예외 검토로 넘겼습니다. 이 데모에서는 실행 경로를 만들지 않습니다.');
      }
      return html;
    }
    if (s.status === S.NO_CHANGE_REQUIRED) {
      return ask(s) + readRequest(s) + noChange(s) + stoppedBasis(s, [
        ['중복 변경 방지', '요청 상태가 현재 상태와 같아 변경을 만들지 않습니다.'],
        ['상태 기준 판단', '요청 문구가 아니라 실제 권한 상태를 보고 결정합니다.']
      ]);
    }
    if (s.status === S.REJECTED) return ask(s) + basis(s) + change(s) + closedLine('반려했습니다. 권한은 그대로이고 실행은 하지 않았습니다.');
    if (s.status === S.CLOSED) return ask(s) + closedLine('요청자에게 돌려보냈습니다.');

    // 읽는 순서: 무엇을 요청했나 → 무엇을 확인했나 → 어떤 기준을 적용했나
    //           → 어떤 변경안인가 → 누가 왜 승인하나 → 실제로 무엇이 바뀌었나
    var html = ask(s) + readRequest(s) + basis(s) + change(s) + approval(s);
    if (s.ledger.length) html += applied(s);
    if (s.verification) html += checked(s);
    return html + why(s);
  }

  /* ── 핵심: 변경 내용 ── */

  function change(s) {
    var plan = s.plan;
    var applied = s.ledger.length > 0;
    var confirmed = applied && s.verification && s.verification.passed;
    var heading = confirmed ? '바뀐 권한' : applied ? '승인한 변경' : '이 요청이 바꾸는 것';
    var order = { ADD: 0, REMOVE: 1, REVIEW: 2, UNCHANGED: 3 };
    var entries = plan.delta.entries.slice().sort(function (a, b) { return order[a.op] - order[b.op]; });

    var sign = { ADD: '+', REMOVE: '−', REVIEW: '?', UNCHANGED: '=' };
    var cls = { ADD: 'add', REMOVE: 'remove', REVIEW: 'hold', UNCHANGED: 'same' };
    var note = { ADD: '추가', REMOVE: '회수', REVIEW: '검토 필요', UNCHANGED: '이미 있음' };

    var html = '<div class="change">' +
      '<div class="change-top">' +
        '<span class="change-title">' + heading + '</span>' +
        '<span class="change-count">' + plan.delta.effective.length + '건</span>' +
      '</div>' +
      '<div class="rows">' +
        entries.map(function (e) {
          var m = means(e.key);
          return '<div class="row ' + cls[e.op] + '">' +
            '<span class="row-sign" aria-hidden="true">' + sign[e.op] + '</span>' +
            '<span class="row-what">' + name(e.key) +
            (m ? '<small class="row-why">' + esc(m) + '</small>' : '') + '</span>' +
            '<span class="row-note">' + esc(note[e.op]) + '</span>' +
            '</div>';
        }).join('') +
      '</div>';

    if (plan.duration) html += term(s);
    return html + '</div>';
  }

  function term(s) {
    var d = s.plan.duration;
    var editable = s.status === S.PENDING_APPROVAL && s.scenario.editableDurationOptions;

    var html = '<div class="term">' +
      '<span><b>' + esc(d.expiresOn) + '</b> 자동 회수 · ' + esc(d.days) + '일</span>';

    if (editable) {
      var opts = s.scenario.editableDurationOptions.filter(function (n) {
        return n <= s.interpretation.durationDays;
      });
      html += '<span class="term-cut">' + opts.map(function (n) {
        return '<button class="cut' + (n === s.durationDays ? ' on' : '') + '" type="button" data-cut="' + n + '"' +
          ' aria-pressed="' + (n === s.durationDays ? 'true' : 'false') + '">' + n + '일</button>';
      }).join('') + '</span>';
    }
    return html + '</div>';
  }

  /* ── 근거: 기본은 접힘 ── */

  function why(s) {
    var plan = s.plan;
    var risk = plan.risk;
    var passed = plan.policyResults.filter(function (r) { return r.outcome === 'PASS'; }).length;

    return '<details class="why">' +
      '<summary class="why-sum">' +
        '<b>정책 검사 상세</b>' +
        '<span>' + passed + '건 통과 · rule 단위 결과와 현재 권한 목록</span>' +
        '<span class="chev" aria-hidden="true">▾</span>' +
      '</summary>' +
      '<div class="why-body">' +
        plan.policyResults.map(function (r) {
          var c = r.outcome === 'PASS' ? 'y' : r.outcome === 'BLOCK' ? 'n' : 'dash';
          var mark = r.outcome === 'PASS' ? '통과' : r.outcome === 'BLOCK' ? '차단' : '해당없음';
          return '<div class="pass ' + c + '">' +
            '<span class="pass-mark">' + esc(mark) + '</span>' +
            '<span class="pass-id">' + esc(r.ruleId) + '</span>' +
            '<span class="pass-say">' + esc(r.statement) + '</span>' +
            '</div>';
        }).join('') +
        '<div class="why-cols">' +
          '<div class="why-col"><h4>위험도를 이렇게 본 이유</h4><ul class="plain">' +
            risk.factors.map(function (f) {
              return '<li><span class="m ' + (f.tone === 'WARN' ? 'warn' : 'good') + '">' +
                (f.tone === 'WARN' ? '주의' : '확인') + '</span><span>' + esc(f.text) + '</span></li>';
            }).join('') +
          '</ul></div>' +
          '<div class="why-col"><h4>권한 상태</h4><div class="state-pair">' +
            '<div><span class="k">현재</span><span class="v">' + listOf(plan.beforeState) + '</span></div>' +
            '<div><span class="k">변경 후</span><span class="v">' + listOf(plan.proposedState) + '</span></div>' +
          '</div></div>' +
        '</div>' +
      '</div>' +
      '</details>';
  }

  function listOf(state) {
    var all = state.adGroups.concat(state.resourceAccess);
    if (!all.length) return '없음';
    return all.map(function (k) { return name(k); }).join('<br>');
  }

  /* ── 막힌 요청 ── */

  function blocked(s) {
    var b = s.blockReason;
    var risk = s.policy.risk;

    return '<div class="stop-box">' +
      '<div class="stop-title">이 요청은 일반 승인으로 처리할 수 없습니다</div>' +
      '<p class="stop-say">' + name(b.requested.join(', ')) + ' 요청은 ' +
      esc(s.context.effectiveRole) + ' 역할의 허용 범위를 벗어납니다.</p>' +
      '<ul class="stop-list">' +
        s.policy.results.filter(function (r) { return r.outcome === 'BLOCK'; }).map(function (r) {
          return '<li><span class="m">' + esc(r.ruleId) + '</span><span>' + esc(r.statement) + '</span></li>';
        }).join('') +
        risk.factors.map(function (f) {
          return '<li><span class="m warn">주의</span><span>' + esc(f.text) + '</span></li>';
        }).join('') +
      '</ul>' +
      '<p class="stop-fix"><b>위험도가 높다는 것과 실행할 수 없다는 것은 다릅니다.</b> ' +
      '여기서는 승인 버튼을 아예 만들지 않았습니다. 예외 검토로 올리거나 요청자에게 돌려보냅니다.</p>' +
      '</div>';
  }

  function needInfo(s) {
    return '<div class="stop-box warn">' +
      '<div class="stop-title">요청에 빠진 내용이 있습니다</div>' +
      '<p class="stop-say">아래를 알 수 없어서 임의로 채우지 않고 요청자에게 되묻습니다.</p>' +
      '<ul class="stop-list">' +
        s.blockReason.missing.map(function (m) {
          return '<li><span class="m">필요</span><span>' + esc(MISSING_KO[m] || m) + '</span></li>';
        }).join('') +
      '</ul>' +
      (s.scenario.completionText
        ? '<p class="stop-fix">요청자가 보완했다고 가정하면 이렇게 들어옵니다.<br><b>' +
          esc(s.scenario.completionText) + '</b></p>'
        : '') +
      '</div>';
  }

  function noChange(s) {
    var keys = s.blockReason.entries.map(function (e) { return name(e.key); }).join(', ');
    return '<div class="stop-box calm">' +
      '<div class="stop-title">바꿀 것이 없습니다</div>' +
      '<p class="stop-say">' + keys + '' + D.particle(keys, '은', '는') + ' 이미 부여되어 있습니다. ' +
      '같은 권한을 다시 넣지 않고 기록만 남겼습니다.</p>' +
      '<p class="stop-fix"><b>실행은 하지 않았습니다.</b> 중복 요청에 같은 작업을 반복하면 만료일이 밀려서 회수 시점이 흐려집니다.</p>' +
      '</div>';
  }

  function closedLine(text) {
    return '<div class="stop-box calm"><p class="stop-say">' + esc(text) + '</p></div>';
  }

  /* ── 적용 결과 ── */

  var DO_KO = {
    ADD_GROUP_MEMBER: '그룹 추가',
    REMOVE_GROUP_MEMBER: '그룹 회수',
    ADD_RESOURCE_ACCESS: '권한 부여',
    REMOVE_RESOURCE_ACCESS: '권한 회수',
    SET_EXPIRY: '만료일 설정',
    VERIFY_ACCESS: '상태 확인',
    WRITE_AUDIT: '기록 저장'
  };
  var FLAG_KO = {
    PASSED: { t: '완료', c: 'y' }, FAILED: { t: '실패', c: 'n' },
    BLOCKED: { t: '차단', c: 'n' }, SKIPPED: { t: '생략', c: 'w' },
    RUNNING: { t: '진행 중', c: 'r' }, PENDING: { t: '대기', c: 'w' }
  };

  var SYS_KO = { ad: 'AD', vpn: 'VPN', database: 'DB', firewall: 'FW', hr: 'HR', verifier: '검증', audit: '기록' };

  function applied(s) {
    return '<div class="done">' +
      '<div class="done-top"><span class="done-title">적용한 작업</span>' +
      '<span class="more-note">승인한 ' + s.approvedExecution.approvedOperations.length + '건만 실행했습니다. 승인 범위 밖의 작업은 만들지 않습니다.</span></div>' +
      s.ledger.map(function (r) {
        var f = FLAG_KO[r.status] || { t: r.status, c: 'w' };
        return '<div class="step">' +
          '<span class="sys">' + esc(SYS_KO[r.system] || r.system) + '</span>' +
          '<span class="step-what">' + esc(DO_KO[r.type] || r.type) + ' · ' + name(r.scope) +
          (r.detail ? '<small>' + esc(r.detail) + '</small>' : '') + '</span>' +
          '<span class="step-flag ' + f.c + '">' + esc(f.t) + '</span>' +
          '</div>';
      }).join('') +
      '</div>';
  }

  function checked(s) {
    var v = s.verification;
    var head = v.passed
      ? '요청한 대로 적용됐는지 다시 읽어봤습니다'
      : '적용은 됐지만 상태가 확인되지 않았습니다';

    return '<div class="done">' +
      '<div class="done-top"><span class="done-title">' + esc(head) + '</span>' +
      (v.passed ? '' : '<span class="badge no">불일치 1건 이상</span>') + '</div>' +
      '<div class="vs-wrap"><div class="vs">' +
        v.rows.map(function (r) {
          return '<div class="vs-row' + (r.match ? '' : ' bad') + '">' +
            '<span class="vs-what">' + esc(r.label) + '</span>' +
            '<span class="vs-got">' + esc(r.match ? '확인됨' : '찾을 수 없음') + '</span>' +
            '<span class="vs-flag">' + esc(r.match ? '일치' : '불일치') + '</span>' +
            '</div>';
        }).join('') +
      '</div></div>' +
      (v.passed ? '' :
        '<div class="vs-note">적용에 성공했다고 완료로 넘기지 않습니다. 실제 상태까지 확인해야 완료입니다.</div>') +
      '</div>';
  }

  /* ── 결정 + 기록 ── */

  function tail(s) {
    return decide(s) + log(s) + more(s) + note(s);
  }

  function decide(s) {
    var say = '', btns = '';

    if (s.status === S.PENDING_APPROVAL) {
      say = '승인하면 위에 표시된 ' + s.plan.delta.effective.length + '건만 반영됩니다.';
      btns = '<button class="btn stop" type="button" data-do="reject">반려</button>' +
             '<button class="btn go" type="button" data-do="approve">승인</button>';
    } else if (s.status === S.POLICY_BLOCKED) {
      say = '실행 경로가 없습니다. 어디로 보낼지만 결정합니다.';
      btns = '<button class="btn" type="button" data-do="return">요청자에게 반환</button>' +
             '<button class="btn go" type="button" data-do="exception">예외 검토 요청</button>';
    } else if (s.status === S.NEEDS_INFO) {
      say = '빠진 내용을 채우면 다시 심사합니다.';
      btns = '<button class="btn" type="button" data-do="return">요청자에게 반환</button>' +
             (s.scenario.completionText
               ? '<button class="btn go" type="button" data-do="fill">보완된 요청으로 다시 보기</button>'
               : '');
    } else if (s.status === S.EXECUTING || s.status === S.VERIFYING || s.status === S.APPROVED) {
      say = '적용하고 있습니다.';
    } else {
      return '';
    }

    return '<div class="act"><p class="act-say">' + esc(say) + '</p>' +
      (btns ? '<div class="act-btns">' + btns + '</div>' : '') + '</div>';
  }

  var LOG_KO = {
    REQUEST_CREATED: '요청 접수', REQUEST_INTERPRETED: '요청 해석',
    INFORMATION_REQUIRED: '추가 정보 필요', CONTEXT_REFERENCED: '현재 권한 조회',
    POLICY_EVALUATED: '정책 평가', PLAN_GENERATED: '변경안 작성',
    REVIEW_OPENED: '검토 시작', PLAN_EDITED: '기간 축소',
    APPROVED: '승인', REJECTED: '반려',
    EXCEPTION_REVIEW_REQUESTED: '예외 검토 요청', RETURNED_TO_REQUESTER: '요청자 반환',
    EXECUTION_STARTED: '적용 시작', EXECUTION_SKIPPED: '적용 생략',
    EXECUTION_UNAVAILABLE: '실행 경로 없음', OPERATION_BLOCKED: '작업 차단',
    ADD_GROUP_MEMBER: '그룹 추가', REMOVE_GROUP_MEMBER: '그룹 회수',
    ADD_RESOURCE_ACCESS: '권한 부여', REMOVE_RESOURCE_ACCESS: '권한 회수',
    SET_EXPIRY: '만료일 설정', VERIFICATION_COMPLETED: '상태 확인',
    AUDIT_RECORDED: '기록 저장', CASE_CLOSED: '종료'
  };

  var RESULT_KO = {
    OPEN: '접수', STRUCTURED: '해석 완료', INCOMPLETE: '내용 부족',
    NEEDS_INFO: '보완 요청', CONFIRMED: '조회 완료',
    PASSED: '통과', BLOCKED: '차단', APPLIED: '적용', ALREADY_PRESENT: '이미 있음',
    RUNNING: '진행', VERIFIED: '확인됨', VERIFICATION_FAILED: '확인 실패',
    RECORDED: '저장', COMPLETED: '완료', REJECTED: '반려',
    NO_CHANGE_REQUIRED: '변경 없음', NO_EXECUTION: '실행 안 함',
    NO_EXECUTION_IN_DEMO: '실행 경로 없음', OUTSIDE_NORMAL_PATH: '일반 경로 밖',
    CLOSED: '종료', SCOPE_NARROWED: '범위 축소', PENDING_APPROVAL: '승인 대기',
    NO_EFFECTIVE_CHANGE: '변경 없음'
  };

  /** '5 operations approved' 같은 값은 숫자만 살려서 옮긴다. */
  function resultKo(v) {
    if (RESULT_KO[v]) return RESULT_KO[v];
    var m = String(v).match(/^(\d+)\s+operations?(\s+approved)?$/);
    if (m) return m[1] + '건' + (m[2] ? ' 승인' : '');
    return v;
  }

  function log(s) {
    if (!s.audit.length) return '';
    return '<details class="why" style="margin-top:14px">' +
      '<summary class="why-sum"><b>처리 기록 ' + s.audit.length + '건</b>' +
      '<span>누가 언제 무엇을 했는지 전부 남습니다</span>' +
      '<span class="chev" aria-hidden="true">▾</span></summary>' +
      '<div class="why-body"><div class="log">' +
        s.audit.map(function (e) {
          return '<div class="log-row">' +
            '<span class="log-t">' + esc(e.timestamp) + '</span>' +
            '<span class="log-do">' + esc(LOG_KO[e.action] || e.action) +
            '<small>' + esc(e.actor) + '</small></span>' +
            '<span class="log-r">' + esc(resultKo(e.result)) + '</span>' +
            '</div>';
        }).join('') +
      '</div></div></details>';
  }

  function more(s) {
    var others = Data.runtime.concat(Data.library).filter(function (x) { return x.id !== s.scenario.id; });
    // 승인을 기다리는 중이 아니라면 다음으로 넘어갈 길을 준다.
    var waiting = s.status === S.PENDING_APPROVAL || s.status === S.EXECUTING ||
      s.status === S.VERIFYING || s.status === S.APPROVED;
    if (waiting) return '';

    return '<div class="more">' +
      '<div class="more-h">다른 상황도 같은 방식으로 걸러집니다</div>' +
      '<p class="more-p">정상 흐름만큼 막히는 흐름이 중요합니다.</p>' +
      '<div class="more-list">' +
        others.map(function (x) {
          return '<button class="more-row" type="button" data-open="' + esc(x.id) + '">' +
            '<span><span class="more-name">' + esc(x.title || x.name) + '</span>' +
            '<span class="more-note">' + esc(x.note || x.summary) + '</span></span>' +
            '<span class="more-go">열기 →</span>' +
            '</button>';
        }).join('') +
      '</div>' +
      '<p class="more-p" style="margin-top:16px">' +
      '<a href="projects.html" style="color:var(--accent);font-weight:600">실제 프로젝트 보기 →</a></p>' +
      '</div>';
  }

  function note(s) {
    if (s.status !== S.COMPLETED && s.status !== S.VERIFICATION_FAILED) return '';
    return '<div class="note"><div class="note-h">만들면서 한 판단</div>' +
      '<p>권한 요청은 건마다 달라 보이지만 판단 기준은 반복됩니다. ' +
      '그래서 요청을 건별로 처리하지 않고 역할·범위·기간·승인 단계를 정책으로 떼어내고, ' +
      '실행은 승인된 범위만 수행하도록 분리했습니다. 적용 성공과 상태 확인도 별개로 봅니다.</p></div>';
  }

  /* ── 이벤트 ── */

  function wire() {
    var back$ = app.querySelector('[data-back]');
    if (back$) back$.addEventListener('click', back);

    app.querySelectorAll('[data-open]').forEach(function (b) {
      b.addEventListener('click', function () { open(b.getAttribute('data-open')); });
    });
    app.querySelectorAll('[data-cut]').forEach(function (b) {
      b.addEventListener('click', function () { service.editDuration(b.getAttribute('data-cut')); });
    });
    app.querySelectorAll('[data-do]').forEach(function (b) {
      b.addEventListener('click', function () { act(b.getAttribute('data-do')); });
    });
  }

  function act(what) {
    if (what === 'approve') { service.approveAndExecute(); return; }
    if (what === 'reject') { service.reject(); return; }
    if (what === 'exception') { service.requestExceptionReview(); return; }
    if (what === 'return') { service.returnToRequester(); return; }
    if (what === 'fill') {
      holding = true;
      service.provideInformation(snap.scenario.completionText);
      if (snap.status !== S.NEEDS_INFO) service.confirmContext();
      if (snap.status === S.PLANNED) service.openReview();
      holding = false;
      draw();
      return;
    }
  }

  drawIntro();
})();
