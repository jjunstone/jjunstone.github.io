/**
 * CHANGE GATE — Synthetic Data
 *
 * Every value in this file is invented for the demo. There are no real
 * accounts, domains, organisational units, addresses, firewall rules,
 * database schemas or internal policy documents anywhere in it.
 *
 * Scenario content lives here rather than in the UI, so adding a scenario
 * does not require a UI change.
 */
window.ChangeGateData = (function () {
  'use strict';

  /* ── Directory ─────────────────────────────────────────── */

  var directory = {
    users: [
      { id: 'U-1042', name: '이준석', department: '인프라팀', role: '플랫폼 엔지니어',   status: 'ACTIVE' },
      { id: 'U-2287', name: '김민수', department: '개발팀',   role: '백엔드 개발자',     status: 'ACTIVE' },
      { id: 'U-3310', name: '박서연', department: '보안팀',   role: '보안 담당자',       status: 'ACTIVE' },
      { id: 'U-3902', name: '정우진', department: '운영팀',   role: '서비스 오너',       status: 'ACTIVE' }
    ],
    operators: {
      administrator: 'U-1042',
      securityAdministrator: 'U-3310',
      serviceOwner: 'U-3902'
    },
    accessState: {
      'U-2287': {
        adGroups: ['VPN-USER'],
        resourceAccess: ['DEV-TOOLS:READ'],
        expirations: {}
      }
    }
  };

  /* ── Role policy ───────────────────────────────────────── */

  var rolePolicy = {
    groupCatalog: {
      'VPN-USER':  { system: 'vpn', label: 'Corporate VPN — baseline' },
      'VPN-DEV':   { system: 'vpn', label: 'VPN — development segment' },
      'VPN-OPS':   { system: 'vpn', label: 'VPN — operations segment' },
      'DEV-TOOLS': { system: 'ad',  label: 'Development tooling group' },
      'OPS-TOOLS': { system: 'ad',  label: 'Operations tooling group' }
    },
    resourceCatalog: {
      'DEV-TOOLS': { system: 'ad',       tier: 'NON-PRODUCTION', accessTypes: ['READ'] },
      'DEV-DB':    { system: 'database', tier: 'NON-PRODUCTION', accessTypes: ['READ', 'WRITE'] },
      'OPS-DB':    { system: 'database', tier: 'NON-PRODUCTION', accessTypes: ['READ'] },
      'PROD-DB':   { system: 'database', tier: 'PRODUCTION',     accessTypes: ['READ', 'WRITE'] }
    },
    roles: {
      '백엔드 개발자': {
        allowedGroups: ['VPN-USER', 'VPN-DEV', 'DEV-TOOLS'],
        allowedResourceAccess: ['DEV-TOOLS:READ', 'DEV-DB:READ'],
        temporaryGroups: ['VPN-DEV'],
        temporaryResourceAccess: ['DEV-DB:READ']
      },
      '운영 엔지니어': {
        allowedGroups: ['VPN-USER', 'VPN-OPS', 'OPS-TOOLS'],
        allowedResourceAccess: ['OPS-TOOLS:READ', 'OPS-DB:READ'],
        temporaryGroups: [],
        temporaryResourceAccess: []
      }
    },
    roleTransitions: {
      '백엔드 개발자>운영 엔지니어': {
        grantGroups: ['VPN-OPS', 'OPS-TOOLS'],
        revokeGroups: ['DEV-TOOLS'],
        revokeResourceAccess: ['DEV-TOOLS:READ'],
        reviewGroups: ['VPN-DEV'],
        reviewResourceAccess: ['DEV-DB:READ']
      }
    },
    restrictions: [
      { match: 'PROD-DB:WRITE', ruleId: 'PROD-DB-04', statement: '운영 DB 쓰기 권한은 이 역할에 부여할 수 없습니다.', exemptRoles: [] },
      { match: 'PROD-DB:READ',  ruleId: 'PROD-DB-04', statement: '운영 DB 접근은 별도 승인 역할에만 허용됩니다.', exemptRoles: [] }
    ],
    approvalRoutes: {
      STANDARD: ['인프라 담당자'],
      ELEVATED: ['인프라 담당자', '보안 담당자'],
      HIGH:     ['인프라 담당자', '보안 담당자', '서비스 오너']
    },
    durationPolicy: { maxDays: 90, expiryRequiredFor: 'TEMPORARY', onExpiry: '자동 회수' }
  };

  /* ── Rule identifiers (fictional) ──────────────────────── */

  /**
   * 설계 원칙. 화면에서 Rule ID보다 먼저 읽히는 정보다.
   *
   * 이 데모의 가치는 '어떤 권한을 줬는가'가 아니라 '어떤 기준으로 줬는가'에
   * 있으므로, 각 rule이 구현하는 원칙에 이름을 붙여 앞에 내놓는다.
   */
  var principles = {
    LEAST_PRIVILEGE:      { label: '최소 권한',        desc: '업무에 필요한 범위까지만 부여합니다.' },
    ROLE_BASED_ACCESS:    { label: '역할 기반 접근',   desc: '직무에 따라 접근 범위를 정합니다.' },
    TIME_BOUND_ACCESS:    { label: '시한부 접근',      desc: '필요한 기간만 유지하고 끝나면 회수합니다.' },
    SEPARATION_OF_DUTIES: { label: '책임 분리',        desc: '위험한 변경은 다른 사람의 승인을 거칩니다.' },
    SOURCE_OF_TRUTH:      { label: '기준 데이터 확인', desc: '사람과 권한 정보를 원천에서 조회합니다.' },
    ACCESS_REVOCATION:    { label: '권한 회수',        desc: '역할이 바뀌면 이전 권한을 거둡니다.' },
    IDEMPOTENCY:          { label: '중복 변경 방지',   desc: '이미 같은 상태면 바꾸지 않습니다.' },
    VERIFY_AFTER_CHANGE:  { label: '변경 후 검증',     desc: '실행 결과를 실제 상태와 비교합니다.' }
  };

  var policyRules = {
    principles: principles,
    rules: [
      { id: 'IDENT-06',        order: 1, principle: 'SOURCE_OF_TRUTH',      name: '대상 확인' },
      { id: 'ACCESS-ROLE-01',  order: 2, principle: 'ROLE_BASED_ACCESS',    name: '역할 범위' },
      { id: 'ACCESS-SCOPE-05', order: 3, principle: 'LEAST_PRIVILEGE',      name: '접근 범위' },
      { id: 'PROD-DB-04',      order: 4, principle: 'LEAST_PRIVILEGE',      name: '운영 자원 제한' },
      { id: 'ACCESS-TEMP-02',  order: 5, principle: 'TIME_BOUND_ACCESS',    name: '기간 제한' },
      { id: 'APPROVAL-03',     order: 6, principle: 'SEPARATION_OF_DUTIES', name: '승인 경로' },
      { id: 'STATE-07',        order: 7, principle: 'IDEMPOTENCY',          name: '현재 상태 비교' },
      { id: 'REVOKE-08',       order: 8, principle: 'ACCESS_REVOCATION',    name: '이전 권한 회수' },
      { id: 'VERIFY-09',       order: 9, principle: 'VERIFY_AFTER_CHANGE',  name: '변경 후 확인' }
    ]
  };

  /* ── Runtime scenarios ─────────────────────────────────── */

  var runtime = [
    {
      id: 'RT-01',
      caseId: 'CHG-2481',
      name: 'STANDARD ACCESS',
      title: '개발환경 접근 요청',
      summary: '기간을 정해 권한을 추가하는 일반적인 경우',
      requestType: 'ACCESS REQUEST',
      requesterId: 'U-1042',
      targetUserId: 'U-2287',
      requestText: '김민수님에게 개발환경 접근을 위해 VPN-DEV와 DEV-DB / READ 권한을 30일간 추가해주세요.',
      reference: ['DIRECTORY', 'ACCESS STATE', 'ROLE POLICY'],
      editableDurationOptions: [30, 14, 7],
      expectedResult: 'COMPLETED'
    },
    {
      id: 'RT-02',
      caseId: 'CHG-2493',
      name: 'ROLE CHANGE',
      title: '운영팀으로 부서 이동',
      summary: '부서가 바뀌면 무엇을 주고 무엇을 회수할지',
      requestType: 'ROLE CHANGE',
      requesterId: 'U-1042',
      targetUserId: 'U-2287',
      requestText: '김민수의 부서가 개발팀에서 운영팀으로 변경됐습니다. 직무 변경에 따라 접근권한을 검토해주세요.',
      reference: ['DIRECTORY', 'ACCESS STATE', 'ROLE POLICY'],
      newRole: '운영 엔지니어',
      newDepartment: '운영팀',
      accessStateOverride: {
        adGroups: ['VPN-USER', 'VPN-DEV', 'DEV-TOOLS'],
        resourceAccess: ['DEV-TOOLS:READ', 'DEV-DB:READ'],
        expirations: {}
      },
      expectedResult: 'COMPLETED'
    },
    {
      id: 'RT-03',
      caseId: 'CHG-2507',
      name: 'HIGH-RISK TEST',
      title: '운영 DB 쓰기 권한 요청',
      summary: '운영 DB 쓰기 요청이 정책에서 막히는 경우',
      requestType: 'ACCESS REQUEST',
      requesterId: 'U-1042',
      targetUserId: 'U-2287',
      requestText: '김민수에게 PROD-DB WRITE 권한을 추가해주세요.',
      reference: ['DIRECTORY', 'ACCESS STATE', 'ROLE POLICY'],
      expectedResult: 'POLICY_BLOCKED'
    }
  ];

  /* ── Scenario library (edge cases) ─────────────────────── */

  var library = [
    {
      id: 'LIB-01',
      caseId: 'CHG-2512',
      name: 'INCOMPLETE REQUEST',
      title: '내용이 빠진 요청',
      summary: '요청에 필요한 정보가 빠진 경우',
      note: '임의로 값을 채우지 않고 필요한 정보를 되묻습니다.',
      requestType: 'ACCESS REQUEST',
      requesterId: 'U-1042',
      targetUserId: 'U-2287',
      requestText: '김민수님 개발환경 접근 권한을 처리해주세요.',
      reference: ['DIRECTORY', 'ACCESS STATE', 'ROLE POLICY'],
      completionText: '김민수님에게 개발환경 접근을 위해 VPN-DEV와 DEV-DB / READ 권한을 30일간 추가해주세요.',
      editableDurationOptions: [30, 14, 7],
      expectedResult: 'NEEDS_INFO'
    },
    {
      id: 'LIB-02',
      caseId: 'CHG-2518',
      name: 'DUPLICATE REQUEST',
      title: '이미 있는 권한을 또 요청',
      summary: '이미 같은 권한이 있는 경우',
      note: '바꿀 것이 없으면 아무 작업도 하지 않습니다.',
      requestType: 'ACCESS REQUEST',
      requesterId: 'U-1042',
      targetUserId: 'U-2287',
      requestText: '김민수님에게 개발환경 접근을 위해 VPN-DEV 권한을 30일간 추가해주세요.',
      reference: ['DIRECTORY', 'ACCESS STATE', 'ROLE POLICY'],
      accessStateOverride: {
        adGroups: ['VPN-USER', 'VPN-DEV'],
        resourceAccess: ['DEV-TOOLS:READ'],
        expirations: { 'VPN-DEV': '2026-10-14' }
      },
      expectedResult: 'NO_CHANGE_REQUIRED'
    },
    {
      id: 'LIB-03',
      caseId: 'CHG-2524',
      name: 'VERIFICATION DRIFT',
      title: '적용은 됐는데 확인이 안 되는 경우',
      summary: '적용은 됐지만 상태가 확인되지 않는 경우',
      note: '적용 성공과 상태 확인을 따로 봅니다.',
      requestType: 'ACCESS REQUEST',
      requesterId: 'U-1042',
      targetUserId: 'U-2287',
      requestText: '김민수님에게 개발환경 접근을 위해 VPN-DEV와 DEV-DB / READ 권한을 30일간 추가해주세요.',
      reference: ['DIRECTORY', 'ACCESS STATE', 'ROLE POLICY'],
      adapterFaults: { database: { dropOnRead: ['DEV-DB:READ'] } },
      editableDurationOptions: [30, 14, 7],
      expectedResult: 'VERIFICATION_FAILED'
    }
  ];

  return {
    fixtures: { directory: directory, rolePolicy: rolePolicy, policyRules: policyRules },
    runtime: runtime,
    library: library
  };
})();
