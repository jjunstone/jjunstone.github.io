/**
 * CHANGE GATE — Domain Layer
 *
 * Pure decision logic. No DOM access, no adapter access, no rendering.
 * The UI reads from this layer; it never re-implements a rule here.
 *
 * Boundary that this file exists to protect:
 *
 *   Planner Output -> Policy Validation -> Human Approval -> ApprovedExecution
 *
 * A ChangePlan is a proposal. Only an ApprovedExecution can reach an executor,
 * and it can never carry an operation the plan did not contain.
 */
window.ChangeGateDomain = (function () {
  'use strict';

/* ────────────────────────────────────────────────────────────
   State machine
   ──────────────────────────────────────────────────────────── */

const RequestStatus = Object.freeze({
  DRAFT: 'DRAFT',
  ANALYZING: 'ANALYZING',
  NEEDS_INFO: 'NEEDS_INFO',
  PLANNED: 'PLANNED',
  NO_CHANGE_REQUIRED: 'NO_CHANGE_REQUIRED',
  POLICY_BLOCKED: 'POLICY_BLOCKED',
  EXCEPTION_REVIEW: 'EXCEPTION_REVIEW',
  PENDING_APPROVAL: 'PENDING_APPROVAL',
  REJECTED: 'REJECTED',
  APPROVED: 'APPROVED',
  EXECUTING: 'EXECUTING',
  EXECUTION_FAILED: 'EXECUTION_FAILED',
  VERIFYING: 'VERIFYING',
  VERIFICATION_FAILED: 'VERIFICATION_FAILED',
  COMPLETED: 'COMPLETED',
  CLOSED: 'CLOSED',
});

const TRANSITIONS = Object.freeze({
  DRAFT: ['ANALYZING'],
  ANALYZING: ['NEEDS_INFO', 'POLICY_BLOCKED', 'PLANNED'],
  NEEDS_INFO: ['ANALYZING', 'CLOSED'],
  PLANNED: ['PENDING_APPROVAL', 'NO_CHANGE_REQUIRED', 'POLICY_BLOCKED'],
  NO_CHANGE_REQUIRED: ['CLOSED'],
  POLICY_BLOCKED: ['EXCEPTION_REVIEW', 'CLOSED'],
  EXCEPTION_REVIEW: ['CLOSED'],
  PENDING_APPROVAL: ['APPROVED', 'REJECTED', 'POLICY_BLOCKED'],
  REJECTED: ['CLOSED'],
  APPROVED: ['EXECUTING'],
  EXECUTING: ['VERIFYING', 'EXECUTION_FAILED'],
  EXECUTION_FAILED: ['CLOSED'],
  VERIFYING: ['COMPLETED', 'VERIFICATION_FAILED'],
  VERIFICATION_FAILED: ['CLOSED'],
  COMPLETED: ['CLOSED'],
  CLOSED: [],
});

  function canTransition(from, to) {
  return (TRANSITIONS[from] || []).includes(to);
}

/** Terminal states where no execution path exists. */
  const NON_EXECUTABLE_STATES = Object.freeze([
  RequestStatus.NEEDS_INFO,
  RequestStatus.POLICY_BLOCKED,
  RequestStatus.EXCEPTION_REVIEW,
  RequestStatus.NO_CHANGE_REQUIRED,
  RequestStatus.REJECTED,
]);

/* ────────────────────────────────────────────────────────────
   Access state helpers
   ──────────────────────────────────────────────────────────── */

  function cloneAccessState(state) {
  return {
    adGroups: [...(state.adGroups || [])],
    resourceAccess: [...(state.resourceAccess || [])],
    expirations: { ...(state.expirations || {}) },
  };
}

function uniq(list) {
  return [...new Set(list)];
}

/* ────────────────────────────────────────────────────────────
   Request interpretation (deterministic resolver)
   ──────────────────────────────────────────────────────────── */

const GROUP_TOKENS = ['VPN-DEV', 'VPN-OPS', 'VPN-USER', 'DEV-TOOLS', 'OPS-TOOLS'];
const RESOURCE_TOKENS = ['PROD-DB', 'DEV-DB', 'OPS-DB', 'DEV-TOOLS'];
const ACCESS_TOKENS = ['READ', 'WRITE'];

/**
 * Deterministic interpretation of the request text.
 *
 * This is a demo resolver, not a language model. It extracts tokens that are
 * literally present and reports anything it cannot find as missing. It never
 * invents a resource, an access type, a duration or a justification.
 */
  function interpretRequest(rawText, scenario) {
  const upper = (rawText || '').toUpperCase();

  const groups = GROUP_TOKENS.filter((g) => upper.includes(g));
  const resources = RESOURCE_TOKENS.filter((r) => upper.includes(r));
  const accessTypes = ACCESS_TOKENS.filter((a) => upper.includes(a));

  const durationMatch = (rawText || '').match(/(\d+)\s*(일|days?|day)/i);
  const durationDays = durationMatch ? Number(durationMatch[1]) : null;

  const isRoleChange =
    /부서|직무|역할|전배|이동|role change/i.test(rawText || '') &&
    Boolean(scenario && scenario.newRole);

  const intent = isRoleChange ? 'Role Change' : 'Access Request';

  // Pair each named resource with an access type that appears in the text.
  const resourceAccess = [];
  for (const res of resources) {
    if (groups.includes(res) && !accessTypes.length) continue;
    for (const access of accessTypes) {
      const pattern = new RegExp(res + '\\s*[/:·\\s-]*\\s*' + access, 'i');
      if (pattern.test(upper) || (resources.length === 1 && accessTypes.length === 1)) {
        resourceAccess.push(res + ':' + access);
      }
    }
  }

  const justification = extractJustification(rawText);

  const missing = [];
  if (!isRoleChange) {
    if (!groups.length && !resources.length) missing.push('Resource');
    if (!accessTypes.length && resources.filter((r) => !groups.includes(r)).length) missing.push('Access Type');
    if (durationDays === null && !isPermanentRequest(rawText)) missing.push('Duration');
    if (!justification) missing.push('Business Justification');
  }

  return {
    intent,
    isRoleChange,
    requestedGroups: uniq(groups.filter((g) => g !== 'VPN-USER')),
    requestedResourceAccess: uniq(resourceAccess),
    durationDays,
    accessClass: durationDays === null ? (isPermanentRequest(rawText) ? 'PERMANENT' : 'UNSPECIFIED') : 'TEMPORARY',
    justification,
    missing,
    complete: missing.length === 0,
  };
}

function isPermanentRequest(rawText) {
  return /영구|permanent|상시/i.test(rawText || '');
}

/**
 * Reads a business reason out of the request text.
 *
 * Requires a stated purpose clause. A request that only names an environment
 * in passing is treated as having no justification, so the case reports the
 * field as missing rather than echoing a phrase back as if it were a reason.
 */
  function extractJustification(rawText) {
  const text = rawText || '';
  const purposePatterns = [
    /([^.,\n]{2,}?)(?:을|를)?\s*위(?:해|하여)/,
    /([^.,\n]{2,}?(?:부서|직무|역할)[^.,\n]*?변경(?:됐|되었|된)[^.,\n]*)/,
  ];
  for (const p of purposePatterns) {
    const m = text.match(p);
    if (m && m[1]) {
      const candidate = cleanPhrase(m[1]);
      if (candidate) return candidate;
    }
  }
  return null;
}

/**
 * 뽑아낸 구절 앞에 남은 이름과 조사를 털어낸다.
 *
 * '김민수님에게 개발환경 접근을 위해' 에서 '에게 개발환경 접근' 처럼 조사로
 * 시작하는 조각이 남으면 문장으로 읽히지 않으므로 잘라낸다.
 */
function cleanPhrase(phrase) {
  let out = String(phrase).trim();

  // 사람 이름과 호칭, 뒤따르는 조사를 함께 제거한다.
  out = out.replace(/^[가-힣]{2,4}\s*님?\s*(?:에게|의|에|은|는|이|가)?\s*/, '');

  // 그래도 조사로 시작하면 그 조사까지 버린다.
  out = out.replace(/^(?:에게|에서|으로|에|의|을|를|은|는|이|가|와|과)\s*/, '');

  out = out.trim();
  return out.length >= 3 ? out : null;
}

/* ────────────────────────────────────────────────────────────
   Context assembly
   ──────────────────────────────────────────────────────────── */

  function buildContext({ directory, scenario }) {
  const target = directory.users.find((u) => u.id === scenario.targetUserId);
  const requester = directory.users.find((u) => u.id === scenario.requesterId);
  const baseState = directory.accessState[scenario.targetUserId] || {
    adGroups: [], resourceAccess: [], expirations: {},
  };
  const currentAccess = cloneAccessState(scenario.accessStateOverride || baseState);

  return {
    requester,
    target,
    currentAccess,
    effectiveRole: target ? target.role : null,
    newRole: scenario.newRole || null,
    newDepartment: scenario.newDepartment || null,
    reference: scenario.reference || [],
  };
}

/**
 * Looks for an outright restriction on anything the request named.
 *
 * Checked before the request is judged incomplete: if a resource is
 * restricted for the role, the case cannot proceed regardless of how much
 * supporting detail is supplied, and asking the requester for a duration or a
 * justification first would be misleading.
 */
function findHardRestriction({ interpretation, context, rolePolicy }) {
  const role = interpretation.isRoleChange ? context.newRole : context.effectiveRole;
  for (const ra of interpretation.requestedResourceAccess) {
    const hit = rolePolicy.restrictions.find(
      (r) => r.match === ra && !r.exemptRoles.includes(role)
    );
    if (hit) return { restriction: hit, requested: ra, role };
  }
  return null;
}

/* ────────────────────────────────────────────────────────────
   Requested state resolution
   ──────────────────────────────────────────────────────────── */

/**
 * Turns an interpretation into the set of grants and revocations under review.
 * Role changes are resolved from the role transition model rather than from
 * whatever the request text happened to mention.
 */
  function resolveRequestedChange({ interpretation, context, rolePolicy }) {
  if (interpretation.isRoleChange) {
    const key = context.effectiveRole + '>' + context.newRole;
    const transition = rolePolicy.roleTransitions[key];
    if (!transition) {
      return {
        grantGroups: [], grantResourceAccess: [],
        revokeGroups: [], revokeResourceAccess: [],
        reviewGroups: [], reviewResourceAccess: [], unmapped: true,
      };
    }
    return {
      grantGroups: [...transition.grantGroups],
      grantResourceAccess: [],
      revokeGroups: [...transition.revokeGroups],
      revokeResourceAccess: [...(transition.revokeResourceAccess || [])],
      reviewGroups: [...(transition.reviewGroups || [])],
      reviewResourceAccess: [...(transition.reviewResourceAccess || [])],
      unmapped: false,
    };
  }

  return {
    grantGroups: [...interpretation.requestedGroups],
    grantResourceAccess: [...interpretation.requestedResourceAccess],
    revokeGroups: [],
    revokeResourceAccess: [],
    reviewGroups: [],
    reviewResourceAccess: [],
    unmapped: false,
  };
}

/* ────────────────────────────────────────────────────────────
   Delta
   ──────────────────────────────────────────────────────────── */

/**
 * Compares current state against the requested change.
 *
 * Anything already present is reported as UNCHANGED rather than re-applied,
 * which is what lets the caller detect a no-op before an executor is involved.
 */
  function computeDelta({ currentAccess, requested }) {
  const entries = [];

  for (const g of requested.grantGroups) {
    entries.push({
      kind: 'GROUP',
      key: g,
      label: g,
      op: currentAccess.adGroups.includes(g) ? 'UNCHANGED' : 'ADD',
    });
  }
  for (const ra of requested.grantResourceAccess) {
    entries.push({
      kind: 'RESOURCE',
      key: ra,
      label: ra.replace(':', ' / '),
      op: currentAccess.resourceAccess.includes(ra) ? 'UNCHANGED' : 'ADD',
    });
  }
  for (const g of requested.revokeGroups) {
    entries.push({
      kind: 'GROUP',
      key: g,
      label: g,
      op: currentAccess.adGroups.includes(g) ? 'REMOVE' : 'UNCHANGED',
    });
  }
  for (const ra of requested.revokeResourceAccess || []) {
    entries.push({
      kind: 'RESOURCE',
      key: ra,
      label: ra.replace(':', ' / '),
      op: currentAccess.resourceAccess.includes(ra) ? 'REMOVE' : 'UNCHANGED',
    });
  }
  for (const g of requested.reviewGroups) {
    entries.push({ kind: 'GROUP', key: g, label: g, op: 'REVIEW' });
  }
  for (const ra of requested.reviewResourceAccess) {
    entries.push({ kind: 'RESOURCE', key: ra, label: ra.replace(':', ' / '), op: 'REVIEW' });
  }

  const effective = entries.filter((e) => e.op === 'ADD' || e.op === 'REMOVE');
  return { entries, effective, isNoOp: effective.length === 0 };
}

  function projectProposedState({ currentAccess, delta, expiresOn }) {
  const next = cloneAccessState(currentAccess);
  for (const e of delta.entries) {
    if (e.op === 'ADD' && e.kind === 'GROUP' && !next.adGroups.includes(e.key)) next.adGroups.push(e.key);
    if (e.op === 'ADD' && e.kind === 'RESOURCE' && !next.resourceAccess.includes(e.key)) next.resourceAccess.push(e.key);
    if (e.op === 'REMOVE' && e.kind === 'GROUP') next.adGroups = next.adGroups.filter((g) => g !== e.key);
    if (e.op === 'REMOVE' && e.kind === 'RESOURCE') next.resourceAccess = next.resourceAccess.filter((r) => r !== e.key);
    if (expiresOn && e.op === 'ADD') next.expirations[e.key] = expiresOn;
  }
  next.adGroups.sort();
  next.resourceAccess.sort();
  return next;
}

/* ────────────────────────────────────────────────────────────
   Policy evaluation
   ──────────────────────────────────────────────────────────── */

/**
 * Evaluates the requested change as an ordered rule trace.
 *
 * Every entry names the rule that produced it, so the review screen can show
 * grounds rather than a verdict. A single BLOCK anywhere removes the normal
 * execution path for the whole case.
 */
  function evaluatePolicy({ interpretation, context, requested, rolePolicy, policyRules }) {
  const results = [];
  const byId = (id) => policyRules.rules.find((r) => r.id === id);
  const push = (ruleId, outcome, statement) => {
    const rule = byId(ruleId);
    const key = rule ? rule.principle : null;
    const principle = key && policyRules.principles ? policyRules.principles[key] : null;
    results.push({
      ruleId,
      outcome,
      statement,
      name: rule ? rule.name : ruleId,
      principle: key,
      principleLabel: principle ? principle.label : null,
      principleDesc: principle ? principle.desc : null,
    });
  };

  const targetRole = interpretation.isRoleChange ? context.newRole : context.effectiveRole;
  const roleModel = rolePolicy.roles[targetRole];

  // IDENT-06
  if (!context.target) {
    push('IDENT-06', 'BLOCK', '대상 계정을 찾을 수 없습니다.');
  } else if (context.target.status !== 'ACTIVE') {
    push('IDENT-06', 'BLOCK', '대상 계정이 사용 중이 아닙니다.');
  } else {
    push('IDENT-06', 'PASS', context.target.name + ' 계정이 사용 중입니다.');
  }

  // ACCESS-ROLE-01
  if (!roleModel) {
    push('ACCESS-ROLE-01', 'BLOCK', (targetRole || '해당 역할') + '에 정의된 권한 범위가 없습니다.');
  } else {
    const offending = requested.grantGroups.filter((g) => !roleModel.allowedGroups.includes(g));
    if (offending.length) {
      push('ACCESS-ROLE-01', 'BLOCK', topic(offending) + ' ' + targetRole + '에게 허용되지 않습니다.');
    } else if (requested.grantGroups.length) {
      push('ACCESS-ROLE-01', 'PASS', topic(requested.grantGroups) + ' ' + targetRole + '에게 허용된 그룹입니다.');
    } else {
      push('ACCESS-ROLE-01', 'PASS', targetRole + ' 범위를 벗어나는 그룹 요청이 없습니다.');
    }
  }

  // ACCESS-SCOPE-05 and PROD-DB-04
  let restrictionHit = null;
  for (const ra of requested.grantResourceAccess) {
    const restriction = rolePolicy.restrictions.find(
      (r) => r.match === ra && !r.exemptRoles.includes(targetRole)
    );
    if (restriction) { restrictionHit = { restriction, requested: ra }; break; }
  }

  if (restrictionHit) {
    push('ACCESS-SCOPE-05', 'BLOCK', topic(restrictionHit.requested.replace(':', ' / ')) + ' ' + targetRole + '의 허용 범위를 벗어납니다.');
    push(restrictionHit.restriction.ruleId, 'BLOCK', restrictionHit.restriction.statement);
  } else if (roleModel) {
    const outOfScope = requested.grantResourceAccess.filter((ra) => !roleModel.allowedResourceAccess.includes(ra));
    if (outOfScope.length) {
      push('ACCESS-SCOPE-05', 'BLOCK', topic(outOfScope.map((r) => r.replace(':', ' / '))) + ' ' + targetRole + '의 허용 범위를 벗어납니다.');
    } else if (requested.grantResourceAccess.length) {
      push('ACCESS-SCOPE-05', 'PASS', topic(requested.grantResourceAccess.map((r) => r.replace(':', ' / '))) + ' 역할 범위 안에 있습니다.');
    } else {
      push('ACCESS-SCOPE-05', 'PASS', '현재 범위를 벗어나는 접근 요청이 없습니다.');
    }
  }

  // ACCESS-TEMP-02
  if (interpretation.isRoleChange) {
    push('ACCESS-TEMP-02', 'NOT_APPLICABLE', '직무 변경에 따른 권한은 기간제가 아닙니다.');
  } else if (interpretation.accessClass === 'TEMPORARY') {
    const overMax = interpretation.durationDays > rolePolicy.durationPolicy.maxDays;
    if (overMax) {
      push('ACCESS-TEMP-02', 'BLOCK', '요청 기간이 최대 ' + rolePolicy.durationPolicy.maxDays + '일을 넘습니다.');
    } else {
      push('ACCESS-TEMP-02', 'PASS', '만료일이 지정되어 기간이 끝나면 자동 회수됩니다.');
    }
  } else if (interpretation.accessClass === 'PERMANENT') {
    push('ACCESS-TEMP-02', 'WARN', '기간 없는 권한 요청입니다. 만료일을 설정할 수 없습니다.');
  }

  // APPROVAL-03
  const risk = assessRisk({ interpretation, context, requested, rolePolicy, targetRole });
  const route = resolveRoute({ risk, requested });
  push('APPROVAL-03', 'PASS', route.reason);

  // REVOKE-08 — 회수가 있는 변경에서만 의미가 있다.
  const revoked = requested.revokeGroups.concat(requested.revokeResourceAccess || []);
  if (revoked.length) {
    push('REVOKE-08', 'PASS', topic(revoked.map((r) => r.replace(':', ' / '))) +
      ' 새 직무에서 쓰지 않으므로 함께 회수합니다.');
  }

  // VERIFY_AFTER_CHANGE — 실행이 끝나면 상태를 다시 읽어 맞춰본다.
  if (!results.some((r) => r.outcome === 'BLOCK')) {
    push('VERIFY-09', 'PASS', '적용 후 실제 상태를 다시 읽어 요청한 상태와 비교합니다.');
  }

  const blocked = results.some((r) => r.outcome === 'BLOCK');
  return {
    results,
    blocked,
    risk,
    approvalRoute: rolePolicy.approvalRoutes[route.tier],
    routeTier: route.tier,
    approvalBasis: route,
  };
}

/**
 * 승인 경로와 그 이유를 함께 만든다.
 *
 * 중요한 것은 승인자가 누구인지가 아니라 왜 승인 단계가 달라지는지다.
 * 그래서 tier만 반환하지 않고 사유를 같이 돌려준다.
 */
function resolveRoute({ risk, requested }) {
  if (risk.level === 'HIGH') {
    return {
      tier: 'HIGH',
      changeType: '역할 범위를 넘는 접근 요청',
      reason: '역할에 허용되지 않은 접근이라 담당자 승인만으로는 처리하지 않습니다.',
    };
  }

  const revokes = requested.revokeGroups.length + (requested.revokeResourceAccess || []).length;
  if (revokes) {
    return {
      tier: 'ELEVATED',
      changeType: '기존 권한 회수를 포함한 변경',
      reason: '지금 쓰고 있는 권한을 거두는 변경이라 회수 범위를 한 번 더 확인합니다.',
    };
  }

  return {
    tier: 'STANDARD',
    changeType: '역할 범위 안의 권한 추가',
    reason: '역할 범위 안이고 기간이 정해져 있어 담당자 승인으로 처리합니다.',
  };
}

/**
 * Reports the factors behind a risk tier instead of a fabricated score.
 * Nothing here is measured, so nothing here is presented as a measurement.
 */
  function assessRisk({ interpretation, context, requested, rolePolicy, targetRole }) {
  const factors = [];
  let level = 'LOW';

  const role = targetRole || context.effectiveRole;
  const roleModel = rolePolicy.roles[role];

  const touchesProduction = requested.grantResourceAccess.some((ra) => {
    const resource = ra.split(':')[0];
    const meta = rolePolicy.resourceCatalog[resource];
    return meta && meta.tier === 'PRODUCTION';
  });
  const hasWrite = requested.grantResourceAccess.some((ra) => ra.endsWith(':WRITE'));
  const outsideRole = roleModel
    ? requested.grantGroups.some((g) => !roleModel.allowedGroups.includes(g)) ||
      requested.grantResourceAccess.some((ra) => !roleModel.allowedResourceAccess.includes(ra))
    : true;

  if (touchesProduction) { factors.push({ tone: 'WARN', text: '운영 환경 자원입니다' }); level = 'HIGH'; }
  if (hasWrite) { factors.push({ tone: 'WARN', text: '데이터를 바꿀 수 있는 쓰기 권한입니다' }); level = 'HIGH'; }
  if (touchesProduction && hasWrite) factors.push({ tone: 'WARN', text: '사고 시 복구가 어렵습니다' });
  if (outsideRole) { factors.push({ tone: 'WARN', text: '역할에 정의된 권한이 아닙니다' }); level = 'HIGH'; }

  if (level !== 'HIGH') {
    if (requested.grantResourceAccess.length) factors.push({ tone: 'OK', text: '개발 환경 자원입니다' });
    if (interpretation.accessClass === 'TEMPORARY') factors.push({ tone: 'OK', text: '기간이 끝나면 자동 회수됩니다' });
    if (requested.grantResourceAccess.every((ra) => ra.endsWith(':READ')) && requested.grantResourceAccess.length) {
      factors.push({ tone: 'OK', text: '조회만 가능하고 변경은 못 합니다' });
    }
    const revokes = requested.revokeGroups.length + (requested.revokeResourceAccess || []).length;
    if (revokes) factors.push({ tone: 'OK', text: '기존 권한을 함께 회수합니다' });
    level = requested.grantResourceAccess.length || revokes ? 'MEDIUM' : 'LOW';
  }

  return { level, factors };
}

/* ────────────────────────────────────────────────────────────
   Change plan
   ──────────────────────────────────────────────────────────── */

const OPERATION_LABEL = Object.freeze({
  ADD_GROUP_MEMBER: 'ADD_GROUP_MEMBER',
  REMOVE_GROUP_MEMBER: 'REMOVE_GROUP_MEMBER',
  ADD_RESOURCE_ACCESS: 'ADD_RESOURCE_ACCESS',
  REMOVE_RESOURCE_ACCESS: 'REMOVE_RESOURCE_ACCESS',
  SET_EXPIRY: 'SET_EXPIRY',
  VERIFY_ACCESS: 'VERIFY_ACCESS',
  WRITE_AUDIT: 'WRITE_AUDIT',
});


/**
 * Builds the proposal a human reviews. Every operation carries its own scope
 * and starts unapproved, because approval is granted per operation later.
 */
  function buildChangePlan({ caseId, interpretation, context, requested, delta, policy, rolePolicy, durationDays, today }) {
  const operations = [];
  let seq = 1;
  const nextId = () => String(seq++).padStart(2, '0');

  const expiresOn =
    durationDays !== null && durationDays !== undefined
      ? addDays(today, durationDays)
      : null;

  for (const e of delta.effective) {
    if (e.op === 'ADD' && e.kind === 'GROUP') {
      operations.push({
        id: nextId(),
        type: 'ADD_GROUP_MEMBER',
        target: context.target.name,
        scope: e.key,
        system: (rolePolicy.groupCatalog[e.key] || {}).system || 'ad',
        approvalState: 'UNAPPROVED',
      });
    }
    if (e.op === 'REMOVE' && e.kind === 'GROUP') {
      operations.push({
        id: nextId(),
        type: 'REMOVE_GROUP_MEMBER',
        target: context.target.name,
        scope: e.key,
        system: (rolePolicy.groupCatalog[e.key] || {}).system || 'ad',
        approvalState: 'UNAPPROVED',
      });
    }
    if (e.op === 'ADD' && e.kind === 'RESOURCE') {
      operations.push({
        id: nextId(),
        type: 'ADD_RESOURCE_ACCESS',
        target: context.target.name,
        scope: e.key,
        system: (rolePolicy.resourceCatalog[e.key.split(':')[0]] || {}).system || 'database',
        approvalState: 'UNAPPROVED',
      });
    }
    if (e.op === 'REMOVE' && e.kind === 'RESOURCE') {
      operations.push({
        id: nextId(),
        type: 'REMOVE_RESOURCE_ACCESS',
        target: context.target.name,
        scope: e.key,
        system: (rolePolicy.resourceCatalog[e.key.split(':')[0]] || {}).system || 'database',
        approvalState: 'UNAPPROVED',
      });
    }
  }

  if (expiresOn && delta.effective.some((e) => e.op === 'ADD')) {
    const expiryScopes = delta.effective.filter((e) => e.op === 'ADD').map((e) => e.key);
    operations.push({
      id: nextId(),
      type: 'SET_EXPIRY',
      target: context.target.name,
      scope: expiresOn,
      system: 'ad',
      approvalState: 'UNAPPROVED',
      meta: { durationDays, onExpiry: rolePolicy.durationPolicy.onExpiry, appliesTo: expiryScopes },
    });
  }

  const verifyTargets = delta.effective.map((e) => ({ op: e.op, kind: e.kind, key: e.key }));
  operations.push({
    id: nextId(),
    type: 'VERIFY_ACCESS',
    target: verifyTargets.length + ' targets',
    scope: verifyTargets.map((t) => t.key).join(' + '),
    system: 'verifier',
    approvalState: 'UNAPPROVED',
    meta: { verifyTargets },
  });
  operations.push({
    id: nextId(),
    type: 'WRITE_AUDIT',
    target: caseId,
    scope: caseId,
    system: 'audit',
    approvalState: 'UNAPPROVED',
  });

  return {
    caseId,
    interpretation,
    context,
    requested,
    delta,
    operations,
    policyResults: policy.results,
    risk: policy.risk,
    approvalRoute: policy.approvalRoute,
    routeTier: policy.routeTier,
    beforeState: cloneAccessState(context.currentAccess),
    proposedState: projectProposedState({ currentAccess: context.currentAccess, delta, expiresOn }),
    duration: expiresOn
      ? { days: durationDays, grantedOn: today, expiresOn, onExpiry: rolePolicy.durationPolicy.onExpiry }
      : null,
    basis: buildDecisionBasis({ interpretation, context, requested, delta, policy, rolePolicy, durationDays, expiresOn }),
  };
}

/**
 * 이 변경안을 왜 이렇게 만들었는지 정리한다.
 *
 * 권한 목록은 결과이고, 이 값이 판단이다. 화면에서 가장 먼저 읽히도록
 * 별도 구조로 만들어 UI에 넘긴다.
 */
function buildDecisionBasis({ interpretation, context, requested, delta, policy, rolePolicy, durationDays, expiresOn }) {
  const applied = [];
  const seen = [];
  for (const r of policy.results) {
    if (r.outcome !== 'PASS' || !r.principle || seen.includes(r.principle)) continue;
    seen.push(r.principle);
    applied.push({ key: r.principle, label: r.principleLabel, desc: r.principleDesc, ruleId: r.ruleId });
  }

  // 요청에 들어 있지 않아 제외된 범위. 최소 권한을 눈에 보이게 만든다.
  const excluded = [];
  for (const resource of Object.keys(rolePolicy.resourceCatalog)) {
    const meta = rolePolicy.resourceCatalog[resource];
    if (meta.tier !== 'PRODUCTION') continue;
    const touched = requested.grantResourceAccess.some((ra) => ra.split(':')[0] === resource);
    if (!touched) excluded.push(resource);
  }

  const grants = delta.effective.filter((e) => e.op === 'ADD').length;
  const revokes = delta.effective.filter((e) => e.op === 'REMOVE').length;

  return {
    role: interpretation.isRoleChange ? context.newRole : context.effectiveRole,
    previousRole: interpretation.isRoleChange ? context.effectiveRole : null,
    need: interpretation.justification,
    scope: interpretation.isRoleChange ? '새 직무에 필요한 범위' : '개발 환경 범위',
    excluded,
    principles: applied,
    grants,
    revokes,
    duration: expiresOn ? { days: durationDays, expiresOn, onExpiry: rolePolicy.durationPolicy.onExpiry } : null,
    approval: policy.approvalBasis,
    summary: summariseDecision({ interpretation, context, grants, revokes, durationDays, excluded }),
  };
}

/** 변경안을 한 문장으로 설명한다. */
function summariseDecision({ interpretation, context, grants, revokes, durationDays, excluded }) {
  if (interpretation.isRoleChange) {
    return context.newRole + ' 업무에 필요한 권한 ' + grants + '건을 주고, 이전 직무에서만 쓰던 ' +
      revokes + '건을 회수합니다.';
  }
  const tail = durationDays ? durationDays + '일 뒤 자동 회수합니다.' : '기간 제한 없이 유지합니다.';
  const head = excluded.length
    ? '운영 환경은 요청에 없어 제외하고, 개발 범위 ' + grants + '건만 부여합니다. '
    : '요청 범위 ' + grants + '건을 부여합니다. ';
  return head + tail;
}

  function addDays(isoDate, days) {
  const d = new Date(isoDate + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + Number(days));
  return d.toISOString().slice(0, 10);
}

/**
 * 앞 글자의 받침에 따라 조사를 고른다.
 *
 * 'VPN-DEV은(는)' 처럼 기계가 쓴 듯한 표기를 피하기 위한 것이다. 권한 이름은
 * 영문이나 숫자로 끝나므로 읽는 소리를 기준으로 판단한다.
 */
function particle(word, withBatchim, withoutBatchim) {
  const text = String(word).trim();
  const last = text.slice(-1).toUpperCase();

  if (/[A-Z0-9]/.test(last)) {
    // L, M, N, R 로 끝나는 알파벳과 0, 1, 6, 8 은 받침이 있는 소리로 읽는다.
    return 'LMNR'.indexOf(last) !== -1 || '0168'.indexOf(last) !== -1
      ? withBatchim : withoutBatchim;
  }

  const code = text.charCodeAt(text.length - 1);
  if (code >= 0xac00 && code <= 0xd7a3) {
    return (code - 0xac00) % 28 !== 0 ? withBatchim : withoutBatchim;
  }
  return withBatchim;
}

/** 목록 뒤에 알맞은 '은/는'을 붙인다. */
function topic(list) {
  const text = Array.isArray(list) ? list.join(', ') : String(list);
  return text + particle(text, '은', '는');
}

/* ────────────────────────────────────────────────────────────
   Approval gate
   ──────────────────────────────────────────────────────────── */

/**
 * Converts a reviewed plan into an ApprovedExecution.
 *
 * Refuses to issue one when the case is blocked, and drops any requested
 * operation id that is not in the plan. This is the only place an execution
 * token is minted, and it can only ever narrow the plan.
 */
  function approve({ plan, approverId, approverRole, approvedOperationIds, timestamp, status }) {
  if (status !== RequestStatus.PENDING_APPROVAL) {
    throw new Error('Approval requires PENDING_APPROVAL. Current: ' + status);
  }
  if (plan.policyResults.some((r) => r.outcome === 'BLOCK')) {
    throw new Error('Approval refused: policy block present.');
  }

  const requestedIds = approvedOperationIds || plan.operations.map((o) => o.id);
  const approvedOperations = plan.operations
    .filter((o) => requestedIds.includes(o.id))
    .map((o) => ({
      id: o.id,
      type: o.type,
      target: o.target,
      scope: o.scope,
      system: o.system,
      meta: o.meta,
      approvalState: 'APPROVED',
    }));

  if (!approvedOperations.length) throw new Error('Approval refused: no operations approved.');

  return Object.freeze({
    caseId: plan.caseId,
    requestId: plan.caseId,
    approverId,
    approverRole,
    approvalTimestamp: timestamp,
    approvedOperations: Object.freeze(approvedOperations),
    planFingerprint: fingerprintPlan(plan),
  });
}

function fingerprintPlan(plan) {
  return plan.operations.map((o) => o.id + ':' + o.type + ':' + o.scope).join('|');
}

/**
 * Gate check run by the executor before touching any adapter.
 * Rejects anything that is not traceable back to the approved token.
 */
  function assertExecutable({ approvedExecution, plan, operation }) {
  if (!approvedExecution) return { ok: false, reason: 'NO_APPROVAL' };
  if (approvedExecution.requestId !== plan.caseId) return { ok: false, reason: 'REQUEST_MISMATCH' };
  if (approvedExecution.planFingerprint !== fingerprintPlan(plan)) return { ok: false, reason: 'PLAN_CHANGED_AFTER_APPROVAL' };

  const approved = approvedExecution.approvedOperations.find((o) => o.id === operation.id);
  if (!approved) return { ok: false, reason: 'OPERATION_NOT_APPROVED' };
  if (approved.type !== operation.type) return { ok: false, reason: 'OPERATION_TYPE_MISMATCH' };
  if (approved.scope !== operation.scope) return { ok: false, reason: 'SCOPE_MISMATCH' };
  if (approved.target !== operation.target) return { ok: false, reason: 'TARGET_MISMATCH' };
  return { ok: true };
}

/* ────────────────────────────────────────────────────────────
   Verification
   ──────────────────────────────────────────────────────────── */

/**
 * Compares the state that was requested against the state actually read back.
 * Execution success and verification success are deliberately separate results.
 */
  function verify({ verifyTargets, observedState }) {
  const rows = verifyTargets.map((t) => {
    const present =
      t.kind === 'GROUP'
        ? observedState.adGroups.includes(t.key)
        : observedState.resourceAccess.includes(t.key);

    const requestedValue = t.op === 'ADD'
      ? (t.kind === 'GROUP' ? 'MEMBER' : 'ENABLED')
      : (t.kind === 'GROUP' ? 'NOT MEMBER' : 'DISABLED');

    const verifiedValue = present
      ? (t.kind === 'GROUP' ? 'MEMBER' : 'ENABLED')
      : 'NOT FOUND';

    const match = t.op === 'ADD' ? present : !present;
    return { key: t.key, label: t.key.replace(':', ' / '), requestedValue, verifiedValue: match ? requestedValue : verifiedValue, match };
  });

  const passed = rows.every((r) => r.match);
  return { rows, passed, result: passed ? 'VERIFIED' : 'VERIFICATION_FAILED' };
}

/* ────────────────────────────────────────────────────────────
   Audit
   ──────────────────────────────────────────────────────────── */

  function createAuditLog() {
  const events = [];
  return {
    record(event) {
      events.push({
        requestId: event.requestId,
        executionId: event.executionId,
        timestamp: event.timestamp,
        actor: event.actor,
        action: event.action,
        target: event.target,
        before: event.before,
        after: event.after,
        result: event.result,
        approver: event.approver,
      });
      return events[events.length - 1];
    },
    all() { return [...events]; },
    clear() { events.length = 0; },
  };
}

  return {
    RequestStatus: RequestStatus,
    NON_EXECUTABLE_STATES: NON_EXECUTABLE_STATES,
    OPERATION_LABEL: OPERATION_LABEL,
    canTransition: canTransition,
    cloneAccessState: cloneAccessState,
    interpretRequest: interpretRequest,
    buildContext: buildContext,
    resolveRequestedChange: resolveRequestedChange,
    computeDelta: computeDelta,
    projectProposedState: projectProposedState,
    evaluatePolicy: evaluatePolicy,
    assessRisk: assessRisk,
    buildChangePlan: buildChangePlan,
    addDays: addDays,
    approve: approve,
    particle: particle,
    topic: topic,
    findHardRestriction: findHardRestriction,
    assertExecutable: assertExecutable,
    verify: verify,
    createAuditLog: createAuditLog
  };
})();
