/**
 * CHANGE GATE — Case Service
 *
 * Owns the domain state for one change case and is the only layer permitted to
 * call an adapter. The UI sends intents here and renders the snapshot that
 * comes back; it never calls a mock adapter and never decides a rule itself.
 *
 *   UI  ->  Case Service  ->  Domain  ->  Adapters
 */
window.ChangeGateService = (function () {
  'use strict';

  var D = window.ChangeGateDomain;
  var A = window.ChangeGateAdapters;
  var RequestStatus = D.RequestStatus;

  var STEPS = Object.freeze([
    { id: 'request',      no: '01', label: 'REQUEST' },
    { id: 'context',      no: '02', label: 'CONTEXT' },
    { id: 'policy',       no: '03', label: 'POLICY' },
    { id: 'review',       no: '04', label: 'REVIEW' },
    { id: 'execution',    no: '05', label: 'EXECUTION' },
    { id: 'verification', no: '06', label: 'VERIFICATION' },
    { id: 'audit',        no: '07', label: 'AUDIT' }
  ]);

  /** Fixed demo clock so the synthetic record reads consistently. */
  var DEMO_TODAY = '2026-09-21';
  var CLOCK_START_MINUTES = 14 * 60 + 2;

  function createCaseService(options) {
    var fixtures = options.fixtures;
    var scenario = options.scenario;
    var onChange = options.onChange;

    var audit = D.createAuditLog();
    var clockTick = 0;

    var state = {
      status: RequestStatus.DRAFT,
      step: 'request',
      reachedSteps: ['request'],
      requestText: scenario.requestText,
      interpretation: null,
      context: null,
      requested: null,
      policy: null,
      plan: null,
      approvedExecution: null,
      ledger: [],
      verification: null,
      durationDays: null,
      executionId: null,
      blockReason: null,
      exceptionRequested: false,
      env: null,
      today: DEMO_TODAY
    };

    function nextTimestamp() {
      var total = CLOCK_START_MINUTES + clockTick;
      clockTick += 1;
      var h = String(Math.floor(total / 60) % 24);
      var m = String(total % 60);
      return (h.length < 2 ? '0' + h : h) + ':' + (m.length < 2 ? '0' + m : m);
    }

    function setStatus(next) {
      if (state.status !== next && !D.canTransition(state.status, next)) {
        throw new Error('Illegal transition ' + state.status + ' -> ' + next);
      }
      state.status = next;
    }

    /**
     * Moves to a step and marks everything up to it as reached.
     *
     * A case can jump forward legitimately: a no-op is detected during policy
     * evaluation and lands on review, and a terminal state lands on audit.
     * Those earlier steps did run, so the rail must let the visitor go back and
     * read them.
     */
    function goStep(id) {
      state.step = id;
      var target = -1;
      for (var i = 0; i < STEPS.length; i += 1) if (STEPS[i].id === id) target = i;
      if (target === -1) return;
      for (var j = 0; j <= target; j += 1) {
        if (state.reachedSteps.indexOf(STEPS[j].id) === -1) state.reachedSteps.push(STEPS[j].id);
      }
    }

    function record(event) {
      var payload = { requestId: scenario.caseId, timestamp: nextTimestamp() };
      Object.keys(event).forEach(function (k) { payload[k] = event[k]; });
      return audit.record(payload);
    }

    function emit() { if (onChange) onChange(snapshot()); }

    /** A closed case always keeps its change record within reach. */
    function markAuditReachable() {
      if (state.reachedSteps.indexOf('audit') === -1) state.reachedSteps.push('audit');
    }

    function snapshot() {
      return {
        caseId: scenario.caseId,
        scenario: scenario,
        status: state.status,
        step: state.step,
        steps: STEPS,
        reachedSteps: state.reachedSteps.slice(),
        requestText: state.requestText,
        interpretation: state.interpretation,
        context: state.context,
        requested: state.requested,
        policy: state.policy,
        plan: state.plan,
        approvedExecution: state.approvedExecution,
        ledger: state.ledger.map(function (r) { return Object.assign({}, r); }),
        verification: state.verification,
        durationDays: state.durationDays,
        blockReason: state.blockReason,
        exceptionRequested: state.exceptionRequested,
        audit: audit.all(),
        today: state.today,
        expiresOn: state.durationDays ? D.addDays(state.today, state.durationDays) : null
      };
    }

    function userName(id) {
      var u = fixtures.directory.users.filter(function (x) { return x.id === id; })[0];
      return u ? u.name : id;
    }
    /** 기록에는 실명보다 역할이 먼저 읽히도록 직무를 쓴다. */
    function userRole(id) {
      var u = fixtures.directory.users.filter(function (x) { return x.id === id; })[0];
      return u ? u.role : id;
    }
    function requesterName() { return userRole(scenario.requesterId); }
    function operatorName(key) { return userName(fixtures.directory.operators[key]); }

    /* ── 01 Request ───────────────────────────────────────── */

    function analyze(rawTextOverride) {
      state.requestText = rawTextOverride || state.requestText;
      state.blockReason = null;
      setStatus(RequestStatus.ANALYZING);

      record({ actor: '요청자 · ' + requesterName(), action: 'REQUEST_CREATED', target: scenario.caseId, result: 'OPEN' });

      var interpretation = D.interpretRequest(state.requestText, scenario);
      state.interpretation = interpretation;
      state.context = D.buildContext({ directory: fixtures.directory, scenario: scenario });

      // 제한된 자원이면 요청 내용이 덜 채워졌더라도 정책 판단이 먼저다.
      // 기간이나 사유를 먼저 물으면 진행할 수 있는 요청처럼 보인다.
      var restriction = D.findHardRestriction({
        interpretation: interpretation,
        context: state.context,
        rolePolicy: fixtures.rolePolicy
      });

      record({
        actor: '요청 해석',
        action: 'REQUEST_INTERPRETED',
        target: scenario.caseId,
        result: (interpretation.complete || restriction) ? 'STRUCTURED' : 'INCOMPLETE'
      });

      if (!interpretation.complete && !restriction) {
        setStatus(RequestStatus.NEEDS_INFO);
        state.blockReason = { kind: 'NEEDS_INFO', missing: interpretation.missing };
        record({ actor: '요청 해석', action: 'INFORMATION_REQUIRED', target: interpretation.missing.join(', '), result: 'NEEDS_INFO' });
        goStep('request');
        emit();
        return;
      }

      state.durationDays = interpretation.durationDays;
      goStep('context');
      emit();
    }

    function provideInformation(text) {
      if (state.status !== RequestStatus.NEEDS_INFO) return;
      setStatus(RequestStatus.ANALYZING);
      state.status = RequestStatus.DRAFT;
      analyze(text);
    }

    /* ── 02 Context ───────────────────────────────────────── */

    function confirmContext() {
      record({ actor: '요청 해석', action: 'CONTEXT_REFERENCED', target: state.context.target.name, result: 'CONFIRMED' });
      evaluate();
    }

    /* ── 03 Policy ────────────────────────────────────────── */

    function evaluate() {
      state.requested = D.resolveRequestedChange({
        interpretation: state.interpretation,
        context: state.context,
        rolePolicy: fixtures.rolePolicy
      });

      state.policy = D.evaluatePolicy({
        interpretation: state.interpretation,
        context: state.context,
        requested: state.requested,
        rolePolicy: fixtures.rolePolicy,
        policyRules: fixtures.policyRules
      });

      record({ actor: '정책 검사', action: 'POLICY_EVALUATED', target: scenario.caseId, result: state.policy.blocked ? 'BLOCKED' : 'PASSED' });

      if (state.policy.blocked) {
        var blocking = state.policy.results.filter(function (r) { return r.outcome === 'BLOCK'; })[0];
        state.blockReason = {
          kind: 'POLICY_BLOCKED',
          ruleId: blocking.ruleId,
          statement: blocking.statement,
          requested: state.requested.grantGroups.concat(state.requested.grantResourceAccess)
        };
        setStatus(RequestStatus.POLICY_BLOCKED);
        goStep('policy');
        markAuditReachable();
        emit();
        return;
      }

      var delta = D.computeDelta({ currentAccess: state.context.currentAccess, requested: state.requested });

      state.plan = D.buildChangePlan({
        caseId: scenario.caseId,
        interpretation: state.interpretation,
        context: state.context,
        requested: state.requested,
        delta: delta,
        policy: state.policy,
        rolePolicy: fixtures.rolePolicy,
        durationDays: state.durationDays,
        today: state.today
      });

      setStatus(RequestStatus.PLANNED);
      record({
        actor: '요청 해석',
        action: 'PLAN_GENERATED',
        target: scenario.caseId,
        result: delta.isNoOp ? 'NO_EFFECTIVE_CHANGE' : delta.effective.length + ' operations'
      });

      if (delta.isNoOp) {
        setStatus(RequestStatus.NO_CHANGE_REQUIRED);
        state.blockReason = {
          kind: 'NO_CHANGE_REQUIRED',
          entries: delta.entries.filter(function (e) { return e.op === 'UNCHANGED'; })
        };
        record({ actor: '시스템', action: 'EXECUTION_SKIPPED', target: scenario.caseId, result: 'NO_CHANGE_REQUIRED' });
        goStep('review');
        markAuditReachable();
        emit();
        return;
      }

      goStep('policy');
      emit();
    }

    function openReview() {
      if (state.status === RequestStatus.PLANNED) {
        setStatus(RequestStatus.PENDING_APPROVAL);
        record({ actor: '인프라 담당자', action: 'REVIEW_OPENED', target: scenario.caseId, result: 'PENDING_APPROVAL' });
      }
      goStep('review');
      emit();
    }

    /* ── 04 Decision ──────────────────────────────────────── */

    /** Narrowing the duration is allowed. Widening it is not. */
    function editDuration(days) {
      if (state.status !== RequestStatus.PENDING_APPROVAL) return;
      if (!state.plan || !state.plan.duration) return;
      if (Number(days) > Number(state.interpretation.durationDays)) return;

      var before = state.durationDays;
      state.durationDays = Number(days);
      var delta = D.computeDelta({ currentAccess: state.context.currentAccess, requested: state.requested });
      state.plan = D.buildChangePlan({
        caseId: scenario.caseId,
        interpretation: state.interpretation,
        context: state.context,
        requested: state.requested,
        delta: delta,
        policy: state.policy,
        rolePolicy: fixtures.rolePolicy,
        durationDays: state.durationDays,
        today: state.today
      });
      record({
        actor: '인프라 담당자',
        action: 'PLAN_EDITED',
        target: 'DURATION',
        before: before + ' days',
        after: state.durationDays + ' days',
        result: 'SCOPE_NARROWED'
      });
      emit();
    }

    function reject(reason) {
      if (state.status !== RequestStatus.PENDING_APPROVAL) return;
      setStatus(RequestStatus.REJECTED);
      state.blockReason = { kind: 'REJECTED', reason: reason || '현재 역할에 필요한 범위로 보기 어렵습니다.' };
      record({ actor: '인프라 담당자', action: 'REJECTED', target: scenario.caseId, result: 'REJECTED', approver: operatorName('administrator') });
      record({ actor: '시스템', action: 'EXECUTION_SKIPPED', target: scenario.caseId, result: 'NO_EXECUTION' });
      goStep('audit');
      emit();
    }

    function requestExceptionReview() {
      if (state.status !== RequestStatus.POLICY_BLOCKED) return;
      setStatus(RequestStatus.EXCEPTION_REVIEW);
      state.exceptionRequested = true;
      record({ actor: '인프라 담당자', action: 'EXCEPTION_REVIEW_REQUESTED', target: scenario.caseId, result: 'OUTSIDE_NORMAL_PATH' });
      record({ actor: '시스템', action: 'EXECUTION_UNAVAILABLE', target: scenario.caseId, result: 'NO_EXECUTION_IN_DEMO' });
      goStep('audit');
      emit();
    }

    function returnToRequester() {
      if (state.status !== RequestStatus.POLICY_BLOCKED && state.status !== RequestStatus.NEEDS_INFO) return;
      record({ actor: '인프라 담당자', action: 'RETURNED_TO_REQUESTER', target: requesterName(), result: 'CLOSED' });
      setStatus(RequestStatus.CLOSED);
      goStep('audit');
      emit();
    }

    /**
     * Approval mints the execution token through the domain layer and then
     * hands off to execution. Nothing here assembles the token by hand.
     */
    function approveAndExecute(approvedOperationIds) {
      if (state.status !== RequestStatus.PENDING_APPROVAL) return Promise.resolve();

      var approverRole = '인프라 담당자';
      var approverName = operatorName('administrator');

      state.approvedExecution = D.approve({
        plan: state.plan,
        approverId: fixtures.directory.operators.administrator,
        approverRole: approverRole,
        approvedOperationIds: approvedOperationIds,
        timestamp: state.today + ' ' + nextTimestamp(),
        status: state.status
      });

      setStatus(RequestStatus.APPROVED);
      record({
        actor: approverRole,
        action: 'APPROVED',
        target: scenario.caseId,
        result: state.approvedExecution.approvedOperations.length + ' operations approved',
        approver: approverName
      });

      goStep('execution');
      emit();
      return execute();
    }

    /* ── 05 Controlled execution ───────────────────────────── */

    function pause(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

    /**
     * Runs interpretation, context and policy in one move and stops at the
     * point where a person is actually needed.
     *
     * Every stage still executes and still records its audit event. Splitting
     * them into separate button presses made the visitor click through work
     * that required no decision from them.
     */
    function prepare() {
      analyze();
      if (state.status !== RequestStatus.ANALYZING) return;
      confirmContext();
      if (state.status === RequestStatus.PLANNED) openReview();
    }

    function summariseState(s) {
      return s.adGroups.concat(s.resourceAccess).join(', ');
    }

    function execute() {
      setStatus(RequestStatus.EXECUTING);
      state.executionId = 'EXEC-' + scenario.caseId.replace('CHG-', '');

      state.env = A.createMockEnvironment({
        initialState: D.cloneAccessState(state.context.currentAccess),
        faults: scenario.adapterFaults
      });

      state.ledger = state.approvedExecution.approvedOperations.map(function (op) {
        return {
          id: op.id,
          type: op.type,
          target: op.target,
          scope: op.scope,
          system: op.system,
          meta: op.meta,
          status: 'PENDING',
          detail: null
        };
      });

      record({ actor: '실행', action: 'EXECUTION_STARTED', target: scenario.caseId, executionId: state.executionId, result: 'RUNNING' });
      emit();

      var index = 0;

      function step() {
        if (index >= state.ledger.length) {
          setStatus(RequestStatus.COMPLETED);
          record({ actor: '시스템', action: 'CASE_CLOSED', target: scenario.caseId, executionId: state.executionId, result: 'COMPLETED', approver: operatorName('administrator') });
          // Stay on verification. Execution success and verification success are
          // separate results, so the visitor reads the comparison before the
          // audit record rather than being moved past it.
          goStep('verification');
          markAuditReachable();
          emit();
          return Promise.resolve();
        }

        var row = state.ledger[index];
        index += 1;

        var planOperation = state.plan.operations.filter(function (o) { return o.id === row.id; })[0];

        // Gate re-check immediately before the adapter call.
        var gate = D.assertExecutable({ approvedExecution: state.approvedExecution, plan: state.plan, operation: planOperation });
        if (!gate.ok) {
          row.status = 'BLOCKED';
          row.detail = gate.reason;
          setStatus(RequestStatus.EXECUTION_FAILED);
          record({ actor: '실행', action: 'OPERATION_BLOCKED', target: row.scope, executionId: state.executionId, result: gate.reason });
          goStep('audit');
          emit();
          return Promise.resolve();
        }

        row.status = 'RUNNING';
        emit();

        if (row.type === 'VERIFY_ACCESS') {
          var observed = state.env.readVerificationState();

          // Verify the approved scope, not the originally proposed scope. If an
          // operation was dropped at approval, its absence afterwards is the
          // correct outcome rather than a verification failure.
          var approvedScopes = state.approvedExecution.approvedOperations.map(function (o) { return o.scope; });
          var verifyTargets = planOperation.meta.verifyTargets.filter(function (t) {
            return approvedScopes.indexOf(t.key) !== -1;
          });

          state.verification = D.verify({ verifyTargets: verifyTargets, observedState: observed });
          setStatus(RequestStatus.VERIFYING);
          row.status = state.verification.passed ? 'PASSED' : 'FAILED';
          row.detail = state.verification.passed
            ? '승인한 범위와 일치'
            : '승인한 범위와 다름';
          row.scope = verifyTargets.map(function (t) { return t.key; }).join(' + ');
          row.target = verifyTargets.length + ' targets';
          record({ actor: '상태 확인', action: 'VERIFICATION_COMPLETED', target: row.scope, executionId: state.executionId, result: state.verification.result });
          goStep('verification');
          emit();

          if (!state.verification.passed) {
            setStatus(RequestStatus.VERIFICATION_FAILED);
            var auditRow = state.ledger.filter(function (r) { return r.type === 'WRITE_AUDIT'; })[0];
            if (auditRow) { auditRow.status = 'PASSED'; auditRow.detail = '불일치 기록'; }
            record({ actor: '기록', action: 'AUDIT_RECORDED', target: scenario.caseId, executionId: state.executionId, result: 'VERIFICATION_FAILED', approver: operatorName('administrator') });
            goStep('verification');
            markAuditReachable();
            emit();
            return Promise.resolve();
          }
          return pause(260).then(step);
        }

        if (row.type === 'WRITE_AUDIT') {
          row.status = 'PASSED';
          row.detail = '저장 완료';
          record({
            actor: '기록',
            action: 'AUDIT_RECORDED',
            target: scenario.caseId,
            executionId: state.executionId,
            before: summariseState(state.plan.beforeState),
            after: summariseState(state.env.readState()),
            result: 'RECORDED',
            approver: operatorName('administrator')
          });
          emit();
          return pause(200).then(step);
        }

        var adapter = state.env.adapters[row.system] || state.env.adapters.ad;
        return adapter.apply(row).then(function (result) {
          row.status = result.ok ? (result.result === 'ALREADY_PRESENT' ? 'SKIPPED' : 'PASSED') : 'FAILED';
          row.detail = result.detail;
          record({ actor: '실행', action: row.type, target: row.scope, executionId: state.executionId, result: result.result });

          if (!result.ok) {
            setStatus(RequestStatus.EXECUTION_FAILED);
            goStep('audit');
            emit();
            return;
          }
          emit();
          return pause(160).then(step);
        });
      }

      return pause(240).then(step);
    }

    return {
      snapshot: snapshot,
      analyze: analyze,
      prepare: prepare,
      provideInformation: provideInformation,
      confirmContext: confirmContext,
      openReview: openReview,
      editDuration: editDuration,
      reject: reject,
      approveAndExecute: approveAndExecute,
      requestExceptionReview: requestExceptionReview,
      returnToRequester: returnToRequester,
      goToStep: function (id) {
        if (state.reachedSteps.indexOf(id) !== -1) { state.step = id; emit(); }
      }
    };
  }

  return { STEPS: STEPS, createCaseService: createCaseService };
})();
