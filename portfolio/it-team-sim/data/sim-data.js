/**
 * IT TEAM SIMULATOR — Data Layer
 *
 * 전산보안실 12인 조직과 5개 사건 시나리오의 원본 데이터.
 * 조직·서비스·업무 플로우 설계는 IT TEAM-design/ 폴더의 설계 문서를 기반으로 한다.
 *
 * isAssumption: true로 표시된 시나리오는 설계 문서의 "정상 흐름"을 시뮬레이터용
 * "장애/실패" 상황으로 재구성한 것이며, 설계 문서에 명시된 절차가 아니라
 * 시뮬레이터가 만든 가정이다. false인 시나리오는 설계 문서의 절차를 그대로 따른다.
 *
 * seat: 조직도 평면 위의 좌표 (0~100 퍼센트 기준). 사건이 시작되면 참여자는
 * 이 좌석에서 중앙 상황실(war room)로 이동한다.
 * player: 각 시나리오에서 사용자가 조작하는 역할의 id.
 * stage.speaker: 해당 단계에서 발언/행동하는 담당자 id.
 * stage.listener: 있으면 speaker -> listener로 연결선이 그려진다 (보고/요청/에스컬레이션).
 */
window.ITSimData = (function () {
  'use strict';

  var roster = [
  {
    "id": "ciso",
    "name": "CISO",
    "dept": "총괄",
    "level": "executive",
    "authority": "전산실 총괄 — 전사 보안/운영 최종 승인",
    "color": "#1c1c1c",
    "shortLabel": "CISO",
    "hair": "short-side",
    "avatarImage": "./it-team-sim/avatars/dba_lead.png",
    "seat": { "x": 50, "y": 8 },
    "responsibilities": [
      "전산실 전체 의사결정 최종 승인(DBA, 보안, 네트워크, 서버, 인프라 전 영역)",
      "월간 경영진 보고 및 외부 감사·규제 대응 총괄",
      "팀 간 책임 경계 충돌 시 최종 조정",
      "대형 장애·보안사건 발생 시 경영진 보고 라인 담당",
      "ISO 27001, ISMS-P, 전자금융거래법 등 규정 준수 최종 책임"
    ]
  },
  {
    "id": "dba_lead",
    "name": "DBA팀장",
    "dept": "DBA팀",
    "level": "lead",
    "authority": "DB 운영·백업 최종 승인",
    "color": "#173c78",
    "shortLabel": "DBA팀장",
    "hair": "short-side",
    "avatarImage": "./it-team-sim/avatars/dba_lead.png",
    "seat": { "x": 16.3, "y": 21 },
    "responsibilities": [
      "데이터베이스 운영 및 성능 최적화(가용성 목표 99.9%, OLTP 응답 200ms 이내)",
      "백업/재해복구 관리 및 월간 DR 드릴 검증(RTO/RPO 달성 여부)",
      "DB 접근권한 요청 심의 및 분기별 접근권한 감사",
      "보안 패치 계획 검증 — 트랜잭션 안전성·롤백 가능성 관점",
      "ITSM(변경·문제·요청) 조율 및 외주 서비스데스크 위탁 관리"
    ]
  },
  {
    "id": "db_employee",
    "name": "DB사원",
    "dept": "DBA팀",
    "level": "staff",
    "authority": "DB 운영 지원",
    "color": "#173c78",
    "shortLabel": "DB사원",
    "hair": "short-round",
    "avatarImage": "./it-team-sim/avatars/db_employee.png",
    "seat": { "x": 29.7, "y": 21 },
    "responsibilities": [
      "일일 백업 모니터링 및 실행 검증",
      "DB 헬스체크·알람 대응, 접근 요청 1차 처리",
      "CMDB(구성관리DB) 주담당 — 서버/DB/네트워크/클라우드 자산 정보 등록·유지",
      "쿼리/스키마 점검 지원 및 DBA팀장 보조",
      "장애 시 즉시 DBA팀장 보고 후 진단 정보 수집"
    ]
  },
  {
    "id": "security_lead",
    "name": "보안팀장",
    "dept": "보안팀",
    "level": "lead",
    "authority": "IAM/보안 최종 승인",
    "color": "#b42318",
    "shortLabel": "보안팀장",
    "hair": "long-straight",
    "avatarImage": "./it-team-sim/avatars/security_lead.png",
    "seat": { "x": 67, "y": 21 },
    "responsibilities": [
      "IAM/EDR/PAM/DLP/인증서 정책 최종 승인",
      "보안 사건 심각도 판단(Critical/High/Medium/Low) 및 초기 대응 지휘",
      "일일 보안이벤트·실패 로그인·특권계정 활동 모니터링",
      "월간 종합 접근권한 감사 및 보안 교육 실시",
      "외주 SOC 경고 수신 라인 및 솔루션담당자 기술지원 창구"
    ]
  },
  {
    "id": "security_employee",
    "name": "보안사원",
    "dept": "보안팀",
    "level": "staff",
    "authority": "보안 운영 실무",
    "color": "#b42318",
    "shortLabel": "보안사원",
    "hair": "bun",
    "avatarImage": "./it-team-sim/avatars/security_employee.png",
    "seat": { "x": 77, "y": 21 },
    "responsibilities": [
      "SOC 경고 심각도 1차 분류 및 사건 조사 개시",
      "로그 모니터링·보안 이벤트 조사 지원",
      "접근권한 감사 실무, DLP 위반 관련자 통보 및 조사",
      "장애 시 즉시 보안팀장 보고 및 증거 보존",
      "보안팀장 보조 및 1차 대응"
    ]
  },
  {
    "id": "security_support",
    "name": "보안팀 지원인력",
    "dept": "보안팀",
    "level": "support",
    "authority": "보안 솔루션 기술 운영",
    "color": "#b42318",
    "shortLabel": "보안지원",
    "hair": "bald-glasses",
    "avatarImage": "./it-team-sim/avatars/security_support.png",
    "seat": { "x": 87, "y": 21 },
    "responsibilities": [
      "보안 솔루션(IAM/EDR/SIEM/DLP) 기술 운영 및 로그 수집",
      "보안 이벤트 로그 정제·분류, 오탐/실제 위협 판별 지원",
      "휴일·야간 포함 정기 모니터링 및 경보 대응",
      "월간 솔루션 성능 리포트, 라이선스·용량 검토",
      "팀장·사원의 의사결정을 데이터로 지원(Responsible 역할)"
    ]
  },
  {
    "id": "network_manager",
    "name": "네트워크과장",
    "dept": "네트워크팀",
    "level": "lead",
    "authority": "방화벽/VPN/DNS 최종 승인",
    "color": "#b54708",
    "shortLabel": "네트과장",
    "hair": "curly",
    "avatarImage": "./it-team-sim/avatars/network_manager.png",
    "seat": { "x": 16.3, "y": 53 },
    "responsibilities": [
      "방화벽/VPN/DNS 정책 최종 승인 및 방화벽 예외 규칙 기술 검토",
      "네트워크 장애 초동 대응 지휘(로그 확인 → 연결성 검사 → DDoS 여부 판단)",
      "일일 네트워크 가용성·대역폭·방화벽 히트 현황 모니터링",
      "주간 방화벽 규칙 감사, 월간 종합 네트워크 감사",
      "보안팀과의 교차 조사 판단(무단 접근 시 트래픽 패턴 분석)"
    ]
  },
  {
    "id": "network_employee",
    "name": "네트워크사원",
    "dept": "네트워크팀",
    "level": "staff",
    "authority": "네트워크 운영 지원",
    "color": "#b54708",
    "shortLabel": "네트사원",
    "hair": "ponytail",
    "avatarImage": "./it-team-sim/avatars/network_employee.png",
    "seat": { "x": 29.7, "y": 53 },
    "responsibilities": [
      "네트워크 장비/회선 모니터링 및 1차 알람 대응",
      "방화벽 규칙 구현(과장 지시에 따른 실행)",
      "DNS 레코드 추가·수정 및 IP 주소 할당(IPAM)",
      "VPN 계정 생성·활성화 및 접속 지원",
      "장애 시 즉시 네트워크과장 호출 후 진단 정보 수집"
    ]
  },
  {
    "id": "server_manager",
    "name": "서버과장",
    "dept": "서버팀",
    "level": "lead",
    "authority": "서버/클라우드/자산 최종 승인",
    "color": "#0f6656",
    "shortLabel": "서버과장",
    "hair": "buzz",
    "avatarImage": "./it-team-sim/avatars/server_manager.png",
    "seat": { "x": 50, "y": 84 },
    "responsibilities": [
      "서버 인프라 운영 및 성능 관리(가용성·CPU/메모리·디스크 사용률 모니터링)",
      "보안 패치 계획·테스트·배포 승인(Critical 72시간, High 2주 이내 적용)",
      "클라우드/SaaS 승인 권한(부), IT 자산 승인 권한(부)",
      "퇴사자 자산 회수 확인 및 서버팀 체크리스트 관리",
      "장애 시 리소스 확인 → 변경사항 검토 → 재시작 시도 → DBA팀장 호출"
    ]
  },
  {
    "id": "server_employee",
    "name": "서버사원",
    "dept": "서버팀",
    "level": "staff",
    "authority": "서버 운영 지원",
    "color": "#0f6656",
    "shortLabel": "서버사원",
    "hair": "short-spiky",
    "avatarImage": "./it-team-sim/avatars/server_manager.png",
    "seat": { "x": 60, "y": 84 },
    "responsibilities": [
      "프로덕션 서버 패치 적용 실행(서버과장 승인 후)",
      "서버 가용성·헬스 상태 일일 점검",
      "정기 유지보수 시간 작업 수행 및 기능 검증 지원",
      "서버과장과 매일 협업, 장애 시 1차 조치",
      "서버 로그 수집 및 이상 징후 보고"
    ]
  },
  {
    "id": "infra_devops_manager",
    "name": "인프라/DevOps과장",
    "dept": "인프라/DevOps팀",
    "level": "lead",
    "authority": "K8s/CI-CD 최종 승인",
    "color": "#6b4fbb",
    "shortLabel": "DevOps과장",
    "hair": "long-wave",
    "avatarImage": "./it-team-sim/avatars/infra_devops_manager.png",
    "seat": { "x": 65, "y": 53 },
    "responsibilities": [
      "Kubernetes 클러스터 운영 및 CI/CD 파이프라인 최종 승인",
      "배포 장애 대응 지휘 및 롤백/재배포 의사결정",
      "컨테이너 보안·컴플라이언스(이미지 취약점 스캔) 관리",
      "클라우드 비용 최적화 검토 및 월간 백업·복구 테스트",
      "개발팀-인프라팀 협력 조정, ISMS-P/ISO 27001 컴플라이언스 검증"
    ]
  },
  {
    "id": "infra_employee_1",
    "name": "인프라관리사원1",
    "dept": "인프라/DevOps팀",
    "level": "staff",
    "authority": "클라우드/백업/자산 운영",
    "color": "#6b4fbb",
    "shortLabel": "인프사원1",
    "hair": "short-spiky",
    "avatarImage": "./it-team-sim/avatars/infra_employee_1.png",
    "seat": { "x": 81, "y": 53 },
    "responsibilities": [
      "클라우드/SaaS 서비스 운영 모니터링",
      "백업 실행 모니터링 및 월간 백업 드릴 시 랜덤 DB 복구 테스트",
      "IT 자산 인벤토리 업데이트 및 주간 자산 조정",
      "주간 클라우드 비용 검토(인프사원2와 분담)",
      "DBA팀장과 백업 조율(주 2회)"
    ]
  },
  {
    "id": "infra_employee_2",
    "name": "인프라관리사원2",
    "dept": "인프라/DevOps팀",
    "level": "staff",
    "authority": "클라우드/백업/자산 운영",
    "color": "#6b4fbb",
    "shortLabel": "인프사원2",
    "hair": "bob",
    "avatarImage": "./it-team-sim/avatars/infra_employee_2.png",
    "seat": { "x": 89, "y": 53 },
    "responsibilities": [
      "클라우드/SaaS 서비스 운영 모니터링",
      "백업 실행 모니터링 및 자산 인벤토리 업데이트",
      "인증서 배포 및 신규 서비스 적용 확인",
      "주간 클라우드 비용 검토, 서버과장과 주 2회 협업",
      "DBA팀장과 백업 조율(주 2회)"
    ]
  },
  {
    "id": "devops_employee",
    "name": "DevOps사원",
    "dept": "인프라/DevOps팀",
    "level": "staff",
    "authority": "CI/CD 파이프라인 운영",
    "color": "#6b4fbb",
    "shortLabel": "DevOps사원",
    "hair": "long-tied",
    "avatarImage": "./it-team-sim/avatars/devops_employee.png",
    "seat": { "x": 73, "y": 53 },
    "responsibilities": [
      "CI/CD 파이프라인 운영(빌드·테스트·배포 모니터링)",
      "컨테이너 이미지 빌드·레지스트리 관리, 취약점 스캔 결과 검토",
      "Kubernetes Pod 배포 후 헬스체크 모니터링 및 배포 이상 1차 확인",
      "자동화 스크립트 개발·유지보수, 인프라 코드 형상관리",
      "장애 시 파이프라인 로그 확인 → 원인 파악 → 과장 보고 → 지시에 따른 복구"
    ]
  }
];

  var scenarios = [
  {
  "id": "onboarding",
  "title": "신규 입사자 계정 발급",
  "category": "계정 및 IAM",
  "difficulty": "하",
  "departments": [
    "보안팀",
    "네트워크팀",
    "DBA팀"
  ],
  "estMinutes": 6,
  "coreChallenge": "여러 팀의 권한 배정을 입사일 전에 맞추면서도 과잉 권한을 주지 않기",
  "briefing": "다음 주 월요일 입사하는 신규 개발자의 계정 발급 요청이 들어왔다. HR은 '부서 배정은 개발2팀, 접근은 기존 팀원과 동일하게' 라고만 적어놨다.",
  "participants": [
    "security_lead",
    "network_manager",
    "dba_lead"
  ],
  "player": "security_lead",
  "isAssumption": false,
  "stages": [
    {
      "id": "start",
      "speaker": "security_lead",
      "listener": "network_manager",
      "narration": "보안팀장이 AD 계정을 임시 비밀번호로 생성했다. \"네트워크팀, DBA팀 — 이 사람 권한을 '기존 팀원과 동일'하게 맞춰야 하는데, 그 팀원이 몇 명 있고 권한이 제각각이라 기준이 애매합니다.\"",
      "facts": [
        "개발2팀 기존 팀원 4명, 권한 범위가 서로 다름 (일부는 프로덕션 DB 읽기 권한 보유)",
        "HR 요청서에는 구체적 시스템/권한 목록 없음",
        "입사일까지 3영업일 남음"
      ],
      "choices": [
        {
          "id": "match_senior",
          "label": "가장 권한이 넓은 팀원 기준으로 맞춘다 — \"일 시작하고 또 요청받는 게 더 번거롭다\"",
          "next": "over_provisioned",
          "consequence": "입사 첫날부터 업무는 막힘없지만, 신입에게 프로덕션 DB 읽기 권한까지 자동으로 들어간다"
        },
        {
          "id": "minimal_then_expand",
          "label": "최소 권한(개발 환경)만 먼저 배정하고, DBA팀장에 추가 권한 필요 여부를 확인한다",
          "next": "minimal_granted",
          "consequence": "입사 첫날 권한이 좁을 수 있지만 최소 권한 원칙은 지킨다"
        }
      ]
    },
    {
      "id": "over_provisioned",
      "speaker": "dba_lead",
      "listener": "security_lead",
      "terminal": true,
      "result": "partial",
      "summary": "신규 입사자가 첫날부터 업무에 바로 투입됐지만, DBA팀장이 분기 접근권한 감사에서 \"입사 당일부터 프로덕션 DB 읍기 권한이 왜 필요했는지\" 를 소명해야 하는 상황이 생겼다.",
      "narration": "DBA팀장이 분기 감사 중 이 계정을 짚었다. \"입사 당일 발급된 권한인데 프로덕션 DB 접근이 포함돼 있네요. 업무상 필요성이 바로 확인이 안 되는데요.\"",
      "lessons": [
        "'기존 팀원과 동일'은 기준이 아니라 확인해야 할 질문이다 — 팀원마다 권한이 다르면 그 차이의 이유부터 봐야 한다",
        "편의를 위해 넓은 권한으로 맞추면, 그 책임은 감사 시점에 다시 돌아온다"
      ]
    },
    {
      "id": "minimal_granted",
      "speaker": "dba_lead",
      "listener": "security_lead",
      "terminal": true,
      "result": "resolved",
      "summary": "최소 권한으로 시작하고, 실제 업무에서 프로덕션 DB 조회가 필요해지는 시점에 정식 요청을 받아 추가하는 흐름으로 정리됐다.",
      "narration": "DBA팀장이 답했다. \"지금 당장은 개발 환경만 있으면 충분합니다. 필요해지면 그때 정식 요청 넣으라고 하세요.\"",
      "lessons": [
        "입사 시점에 모든 권한을 한꺼번에 주지 않는 것이 최소 권한 원칙의 기본이다",
        "'필요해지면 요청'이 번거로워 보여도, 권한 부여 이력이 남아 감사에 유리하다"
      ]
    }
  ]
},
{
  "id": "dept_transfer",
  "title": "부서 이동 권한 재조정",
  "category": "계정 및 IAM",
  "difficulty": "하",
  "departments": [
    "보안팀",
    "DBA팀",
    "네트워크팀",
    "서버팀"
  ],
  "estMinutes": 7,
  "coreChallenge": "이전 부서 권한을 확실히 제거하지 않으면 생기는 '권한 누적' 문제를 놓치지 않기",
  "briefing": "직원 한 명이 DBA팀에서 보안팀으로 부서를 이동했다. HR 알림에는 새 부서만 적혀 있고, 이전 부서 권한 제거는 각 팀 담당자가 알아서 확인해야 한다.",
  "participants": [
    "security_lead",
    "dba_lead",
    "network_manager"
  ],
  "player": "security_lead",
  "isAssumption": false,
  "stages": [
    {
      "id": "start",
      "speaker": "security_lead",
      "listener": "dba_lead",
      "narration": "보안팀장이 새 부서 권한(IAM 시스템 접근)을 배정했다. \"DBA팀장님, 이분 DB 접근 권한은 이제 필요 없어진 거죠? 확인 부탁드립니다.\"",
      "facts": [
        "해당 직원은 DBA팀에서 2년간 근무, DB 쓰기 권한까지 보유",
        "새 부서(보안팀)에서는 DB 직접 접근이 필요 없음",
        "DBA팀장이 바쁜 시기라 응답이 늦어지고 있음"
      ],
      "choices": [
        {
          "id": "wait_for_dba",
          "label": "DBA팀장 확인이 올 때까지 기다린다 — 성급하게 권한을 지웠다가 업무에 지장 생기면 안 된다",
          "next": "delayed_removal",
          "consequence": "3일간 이전 부서 권한이 그대로 남아있는 상태가 된다"
        },
        {
          "id": "remove_proactively",
          "label": "DBA팀장에 재확인하면서, 당장 불필요해 보이는 쓰기 권한부터 선제적으로 제거한다",
          "next": "proactive_removal",
          "consequence": "DBA팀장이 뒤늦게 \"사실 그 사람이 마이그레이션 작업 마무리를 맡고 있었다\"고 알려와 약간의 혼선이 생기지만, 곧 정리된다"
        }
      ]
    },
    {
      "id": "delayed_removal",
      "speaker": "dba_lead",
      "listener": "security_lead",
      "terminal": true,
      "result": "partial",
      "summary": "3일 뒤 DBA팀장이 권한 제거를 승인했지만, 그 사이 이전 부서 권한이 남아있던 기간이 분기 감사에서 지적 대상이 됐다.",
      "narration": "DBA팀장이 뒤늦게 답했다. \"아, 이제 괜찮습니다. 지워주세요.\" 보안팀장은 3일간의 공백을 감사 로그에 소명해야 한다.",
      "lessons": [
        "부서 이동 시 이전 부서 권한은 '확인 후 제거'가 아니라 '제거를 전제로 예외만 확인'하는 순서가 안전하다",
        "담당자 응답 지연이 곧 권한 공백 기간이 된다는 걸 염두에 둬야 한다"
      ]
    },
    {
      "id": "proactive_removal",
      "speaker": "dba_lead",
      "listener": "security_lead",
      "terminal": true,
      "result": "resolved",
      "summary": "쓰기 권한은 즉시 제거했고, 진행 중이던 마이그레이션 작업은 임시 접근 요청으로 별도 처리해 양쪽 다 문제없이 정리됐다.",
      "narration": "DBA팀장이 \"마이그레이션 건은 임시 접근으로 다시 요청드릴게요\" 라고 답하며 상황이 깔끔하게 정리됐다.",
      "lessons": [
        "불필요해 보이는 권한을 먼저 제거하고 예외를 그때그때 처리하는 쪽이, 권한을 쌓아둔 채 확인을 기다리는 것보다 안전하다"
      ]
    }
  ]
},
{
  "id": "vpn_outage",
  "title": "VPN 장애",
  "category": "네트워크 및 VPN",
  "difficulty": "중",
  "departments": [
    "네트워크팀",
    "보안팀"
  ],
  "estMinutes": 10,
  "coreChallenge": "네트워크팀과 보안팀의 책임 영역이 겹치는 지점에서, 누가 먼저 움직여야 할지 판단하고 조율하기",
  "briefing": "오전 9시 12분, 재택근무 중인 직원들의 VPN 접속 실패 신고가 쏟아지고 있다. 영업 개시 10분 전이라 영업부서 임원 전화가 이미 두 번 왔다.",
  "participants": [
    "network_manager",
    "network_employee",
    "security_lead"
  ],
  "player": "network_manager",
  "isAssumption": true,
  "stages": [
    {
      "id": "triage",
      "speaker": "network_employee",
      "listener": "network_manager",
      "narration": "네트워크사원이 급하게 뛰어왔다. \"과장님, VPN 접속 실패 신고가 12건째입니다. 다 재택 직원들이에요. 영업부서 박상무님이 직접 전화하셨습니다.\"",
      "facts": [
        "VPN 동시 접속자 수: 평소 대비 40% 수준 (오히려 적다)",
        "VPN 게이트웨이 CPU 사용률 92%",
        "최근 1시간 내 방화벽 정책 변경 없음",
        "영업 개시 10분 전, 임원 문의 2건 접수"
      ],
      "choices": [
        {
          "id": "check_logs",
          "label": "일단 로그부터 본다 — \"섣불리 손대지 말고 원인 확인 먼저\"",
          "next": "logs_checked",
          "consequence": "3분 소요. 원인 파악 후 조치하지만 그 사이 신고가 더 늘어난다"
        },
        {
          "id": "call_security",
          "label": "보안팀장에 바로 전화한다 — \"MFA 쪽일 수도 있으니 같이 봐야 할 것 같다\"",
          "next": "security_pulled_in_early",
          "consequence": "보안팀장이 당장 합류하지만, 아직 네트워크 자체 문제일 가능성도 배제 못한 상태라 \"로그부터 보고 불러야 하지 않냐\"는 말을 듣는다"
        }
      ]
    },
    {
      "id": "logs_checked",
      "speaker": "network_manager",
      "narration": "로그를 열어보니 VPN 게이트웨이 세션 테이블이 포화 상태다. 그런데 특이하게 MFA 인증 실패율이 평소 2%에서 35%로 치솟아 있다. 이건 네트워크 장비 문제가 아니라 인증 쪽 문제처럼 보인다.",
      "facts": [
        "세션 테이블 포화 (한계치 대비 98%)",
        "MFA 인증 실패율 급증 (평소 2% → 35%)",
        "실패 로그 패턴: 동일 사용자가 10~15회씩 재시도"
      ],
      "choices": [
        {
          "id": "restart_gateway",
          "label": "일단 게이트웨이 세션을 강제 초기화한다 — 당장 급한 불부터 끈다",
          "next": "gateway_restarted",
          "consequence": "정상 접속자도 전부 재인증해야 해서 10분간 더 큰 혼란이 생길 수 있다"
        },
        {
          "id": "check_mfa_source",
          "label": "보안팀장에 MFA 쪽 협업을 요청한다 — \"이거 저희 영역이 아닌 것 같습니다\"",
          "next": "security_pulled_in",
          "consequence": "보안팀장이 합류하지만, 네트워크팀이 먼저 원인을 좁혀놓은 덕에 대응이 빨라진다"
        }
      ]
    },
    {
      "id": "security_pulled_in",
      "speaker": "security_lead",
      "listener": "network_manager",
      "narration": "보안팀장이 Azure AD 상태 페이지를 열어봤다. \"어, 이거 저희 쪽 문제 아니네요. Azure AD MFA 리전에 알려진 장애가 올라와 있어요. 지금 전세계적으로 보고되고 있습니다.\" 안도와 동시에 애매한 기류가 흐른다 — 외부 요인이면 누가 이걸 더 빨리 알아챌 수 있었나.",
      "facts": [
        "Microsoft Azure AD MFA 리전 장애 (공식 상태 페이지 게시, 09:05 발생)",
        "게이트웨이 세션 포화는 MFA 재시도 폭증의 '결과'였을 뿐, 원인이 아니었음",
        "예상 복구 시각: 공급자 측 미정"
      ],
      "choices": [
        {
          "id": "wait_and_monitor",
          "label": "공급자 복구를 기다리며 세션 테이블만 선제 정리한다",
          "next": "resolved_external",
          "consequence": "원인 규명 완료. 다만 \"이걸 더 일찍 확인할 수 없었냐\"는 질문이 남는다"
        }
      ]
    },
    {
      "id": "security_pulled_in_early",
      "speaker": "security_lead",
      "listener": "network_manager",
      "narration": "보안팀장이 급하게 합류했지만 아직 로그를 못 본 상태라 뭐부터 봐야 할지 몇 분을 허비한다. \"저희가 먼저 로그를 봤으면 바로 나왔을 문제인데요.\" 네트워크사원이 옆에서 눈치를 보고 있다.",
      "facts": [
        "보안팀장 합류, 그러나 네트워크 측 로그 공유 전이라 중복 확인 발생",
        "초동 조사에 7분 추가 소요",
        "임원 문의 1건 추가 접수"
      ],
      "choices": [
        {
          "id": "check_logs_late",
          "label": "지금이라도 로그를 같이 확인한다",
          "next": "logs_checked",
          "consequence": "결국 로그 확인을 거치게 되고, 먼저 보지 않고 전화부터 한 판단이 타임라인에 그대로 남는다"
        }
      ]
    },
    {
      "id": "gateway_restarted",
      "speaker": "network_manager",
      "narration": "세션을 초기화하자 잠시 접속이 몰리며 혼란이 커졌다가 안정되는 듯했지만, 15분 후 똑같은 증상이 재발했다. MFA 실패율은 그대로다 — 세션 초기화는 증상만 건드렸을 뿐 원인을 해결하지 못했다.",
      "facts": [
        "동일 증상 재발 (15분 후)",
        "MFA 실패율 여전히 30%대",
        "임원 문의 추가 1건, \"아직도 안 되냐\"는 반응"
      ],
      "choices": [
        {
          "id": "escalate_now",
          "label": "이제라도 보안팀장에 에스컬레이션한다",
          "next": "security_pulled_in",
          "consequence": "근본 원인 파악까지 총 25분이 더 걸렸고, 그 시간 동안의 혼란은 되돌릴 수 없다"
        }
      ]
    },
    {
      "id": "resolved_external",
      "terminal": true,
      "result": "resolved",
      "speaker": "network_manager",
      "summary": "근본 원인은 외부 MFA 공급자 장애였다. 네트워크팀 혼자서는 알 수 없는 영역이었지만, MFA 실패율이라는 신호는 네트워크팀의 1차 로그에도 이미 찍혀 있었다. '내 담당이 아니다'와 '내가 먼저 알아챌 수 있었다'는 두 가지가 동시에 맞는 상황이었다.",
      "lessons": [
        "네트워크 증상의 원인이 항상 네트워크 안에 있는 것은 아니다",
        "MFA 실패율처럼 타 팀 영역의 지표라도, 1차 대응자가 보는 로그에 같이 찍힌다면 확인 목록에 넣어둘 필요가 있다",
        "외부 요인이 원인이어도 '더 빨리 알아챌 수 있었는가'는 별개의 질문으로 남는다"
      ]
    }
  ]
},
  {
  "id": "firewall_exception",
  "title": "방화벽 예외 요청",
  "category": "네트워크 및 VPN",
  "difficulty": "하",
  "departments": [
    "네트워크팀",
    "보안팀",
    "DBA팀"
  ],
  "estMinutes": 6,
  "coreChallenge": "'급하다'는 사업부서 압박 속에서 임시 예외가 영구 구멍으로 남지 않게 만들기",
  "briefing": "마케팅부서가 외부 분석 업체와 데이터를 주고받아야 한다며 특정 포트를 열어달라고 요청했다. \"오늘 중으로 꼭 필요하다\"는 말이 세 번째 메신저에 또 적혀 있다.",
  "participants": [
    "network_manager",
    "security_lead",
    "dba_lead"
  ],
  "player": "network_manager",
  "isAssumption": false,
  "stages": [
    {
      "id": "start",
      "speaker": "network_manager",
      "listener": "security_lead",
      "narration": "네트워크과장이 요청서를 열어봤다. 출발지, 목적지, 포트는 적혀 있는데 '기간'이 비어 있다. \"이거 상시로 열어달라는 건가요?\" 라고 물었더니 요청자는 \"일단 급한 거부터요\" 라고만 답한다.",
      "facts": [
        "요청 포트: 외부 분석 업체向, 특정 TCP 포트",
        "기간 미기재, 종료 조건 없음",
        "요청자는 비기술 부서 담당자"
      ],
      "choices": [
        {
          "id": "open_permanent",
          "label": "일단 열어주고 나중에 정리한다 — 급하다니 먼저 열어준다",
          "next": "permanent_hole",
          "consequence": "당장 민원은 해결되지만, '나중에 정리'가 실제로 되는 경우는 드물다"
        },
        {
          "id": "set_expiry",
          "label": "자동 만료 기간(예: 30일)을 붙여서 열고, DBA팀장 최종 승인을 받는다",
          "next": "approved_with_expiry",
          "consequence": "요청자는 \"왜 또 번거롭게 하냐\"고 하지만, 기술적으로는 필요한 절차대로 처리된다"
        }
      ]
    },
    {
      "id": "permanent_hole",
      "speaker": "security_lead",
      "listener": "network_manager",
      "terminal": true,
      "result": "partial",
      "summary": "6개월 뒤 보안팀 정기 감사에서 이 예외 규칙이 발견됐다. 아무도 종료 조건을 기억하지 못했고, 그 분석 업체와의 계약은 이미 끝나 있었다.",
      "narration": "보안팀장이 감사 중 물었다. \"이 규칙 아직도 쓰고 있나요? 담당자한테 물어보니 그 프로젝트 끝났다던데요.\"",
      "lessons": [
        "기간이 없는 예외 규칙은 사실상 영구 규칙이 된다",
        "'나중에 정리'는 구체적인 만료 시점이 박혀 있지 않으면 거의 실행되지 않는다"
      ]
    },
    {
      "id": "approved_with_expiry",
      "speaker": "dba_lead",
      "listener": "network_manager",
      "terminal": true,
      "result": "resolved",
      "summary": "30일 만료로 설정된 규칙은 기간이 끝나자 자동으로 비활성화됐고, 실제로 더 필요해졌을 때 정식 연장 요청이 들어왔다.",
      "narration": "DBA팀장이 승인하며 덧붙였다. \"이렇게 기간 박아두는 게 맞습니다. 필요하면 또 요청하면 되고요.\"",
      "lessons": [
        "급한 요청일수록 '임시'라는 말을 시스템에 강제로 새겨두는 것(자동 만료)이 안전하다"
      ]
    }
  ]
},
{
  "id": "patch_management",
  "title": "Critical 보안 패치 적용",
  "category": "서버 및 인프라",
  "difficulty": "중",
  "departments": [
    "보안팀",
    "서버팀",
    "DBA팀"
  ],
  "estMinutes": 8,
  "coreChallenge": "72시간 SLA와 서비스 중단 리스크 사이에서 패치 적용 시점을 판단하기",
  "briefing": "보안팀장이 Critical 등급 취약점 패치 공지를 받았다. 정책상 72시간 이내 적용이 원칙인데, 해당 서버는 월말 결산 처리가 한창 돌고 있는 서버다.",
  "participants": [
    "security_lead",
    "server_manager",
    "server_employee"
  ],
  "player": "server_manager",
  "isAssumption": false,
  "stages": [
    {
      "id": "start",
      "speaker": "security_lead",
      "listener": "server_manager",
      "narration": "보안팀장이 연락했다. \"이 취약점, 외부에 이미 공격 코드가 돌고 있다고 합니다. 72시간 이내 적용이 원칙인데, 이 서버 지금 결산 작업 중이라고 들었어요.\"",
      "facts": [
        "취약점 심각도: Critical, 공개된 익스플로잇 존재",
        "대상 서버: 월말 결산 배치 작업 진행 중 (잔여 18시간 예상)",
        "정책상 Critical은 72시간 이내 적용 의무"
      ],
      "choices": [
        {
          "id": "patch_now",
          "label": "결산 작업을 일시 중단하고 지금 바로 패치한다",
          "next": "patched_immediately",
          "consequence": "결산 작업이 지연되고 재무팀의 항의가 들어오지만, 노출 시간은 최소화된다"
        },
        {
          "id": "patch_after_batch",
          "label": "결산 완료(18시간 후)를 기다렸다가 테스트 환경 검증 후 패치한다 — 여전히 72시간 안에 들어온다",
          "next": "patched_after_batch",
          "consequence": "정책 기한은 지키지만, 그 18시간 동안 해당 취약점이 열려 있는 상태로 남는다"
        }
      ]
    },
    {
      "id": "patched_immediately",
      "speaker": "server_employee",
      "listener": "server_manager",
      "terminal": true,
      "result": "resolved",
      "summary": "패치는 즉시 적용됐고, 결산 작업은 6시간 지연 후 재개됐다. 재무팀의 불만은 있었지만 노출 창은 최소화됐다.",
      "narration": "서버사원이 패치 적용을 완료하고 보고했다. \"재부팅까지 끝났고, 결산 배치 재개했습니다. 6시간 정도 밀렸네요.\"",
      "lessons": [
        "Critical 취약점에 공개 익스플로잇이 있으면, 업무 영향보다 노출 시간을 우선순위에 둘 근거가 분명하다"
      ]
    },
    {
      "id": "patched_after_batch",
      "speaker": "server_employee",
      "listener": "server_manager",
      "terminal": true,
      "result": "partial",
      "summary": "패치는 72시간 내에 들어와 정책상 문제는 없었지만, 보안팀장은 \"익스플로잇이 공개된 상태로 18시간을 그냥 둔 판단 근거\"를 사후 보고서에 남겨야 했다.",
      "narration": "서버사원이 결산 종료 후 패치를 적용했다고 보고했다. 보안팀장은 \"정책은 지켰지만, 이 판단은 기록해 둬야겠네요\" 라고 덧붙였다.",
      "lessons": [
        "SLA를 지켰다는 것과 리스크를 최소화했다는 것은 같은 말이 아니다",
        "업무 영향을 이유로 노출 시간을 늘리는 결정은 그 근거를 기록으로 남겨야 한다"
      ]
    }
  ]
},
{
  "id": "backup_drill",
  "title": "월간 백업 복구 드릴",
  "category": "백업 및 재해복구",
  "difficulty": "하",
  "departments": [
    "인프라/DevOps팀",
    "DBA팀"
  ],
  "estMinutes": 7,
  "coreChallenge": "정기 드릴에서 발견된 문제를 '이번만 넘기기'로 덮지 않기",
  "briefing": "매월 첫째 주 화요일 백업 복구 드릴. 인프라관리사원이 무작위로 고른 DB를 테스트 환경에 복구하는데, 복구는 됐지만 데이터가 3일 전 시점이다. 원래는 전날 백업이어야 한다.",
  "participants": [
    "infra_employee_1",
    "dba_lead"
  ],
  "player": "infra_employee_1",
  "isAssumption": false,
  "stages": [
    {
      "id": "start",
      "speaker": "infra_employee_1",
      "listener": "dba_lead",
      "narration": "인프라관리사원1이 복구 결과를 확인했다. \"팀장님, 이번 달 드릴 대상 DB가 3일 전 백업이 복구됐어요. 어제자 백업이 있어야 하는데요.\"",
      "facts": [
        "최근 3일간 해당 DB의 일일 백업 작업이 조용히 실패하고 있었음",
        "실패 알람은 발생했지만 다른 경보에 묻혀 확인되지 않음",
        "RPO(복구 시점 목표) 정책: 24시간 이내"
      ],
      "choices": [
        {
          "id": "note_and_move_on",
          "label": "이번 달 드릴 결과만 기록하고, 백업은 다음 주기에 다시 확인하기로 한다",
          "next": "deferred_fix",
          "consequence": "드릴 자체는 '완료'로 종료되지만 백업 실패 원인은 그대로 남는다"
        },
        {
          "id": "investigate_now",
          "label": "드릴을 완료 처리하기 전에 백업 실패 원인부터 바로 조사한다",
          "next": "root_cause_found",
          "consequence": "드릴 완료 보고가 늦어지지만, 다른 DB에도 같은 문제가 있는지 같이 확인하게 된다"
        }
      ]
    },
    {
      "id": "deferred_fix",
      "speaker": "dba_lead",
      "listener": "infra_employee_1",
      "terminal": true,
      "result": "partial",
      "summary": "다음 달 드릴에서도 같은 DB가 또 걸렸다. 3일 치가 아니라 이번엔 한 달 치 백업이 실패해 있었다.",
      "narration": "DBA팀장이 뒤늦게 물었다. \"이거 지난달에도 비슷한 얘기 들었던 것 같은데, 그때 원인 확인했었나요?\"",
      "lessons": [
        "드릴에서 발견된 이상은 '이번 드릴 통과'가 목적이 아니라 '백업 체계 자체의 이상 신호'로 다뤄야 한다",
        "같은 문제를 매달 기록만 하고 넘기면, 실제 장애가 났을 때 복구 시점이 생각보다 훨씬 더 오래된 걸 발견하게 된다"
      ]
    },
    {
      "id": "root_cause_found",
      "speaker": "dba_lead",
      "listener": "infra_employee_1",
      "terminal": true,
      "result": "resolved",
      "summary": "조사해보니 백업 작업 계정의 인증서가 만료돼 있었다. 같은 인증서를 쓰는 다른 2개 DB도 같은 문제가 있어 함께 조치했다.",
      "narration": "인프라관리사원1이 원인을 찾아 보고했다. \"백업 계정 인증서가 3일 전에 만료됐었네요. 확인해보니 다른 DB 2개도 같은 인증서 쓰고 있어서 같이 걸려 있었습니다.\"",
      "lessons": [
        "드릴에서 하나의 이상이 보이면, 같은 구성을 쓰는 다른 자원도 같이 점검할 가치가 있다",
        "경보가 '발생'했는데 '확인'되지 않은 이유(다른 경보에 묻힘)도 별도로 개선할 지점이다"
      ]
    }
  ]
},
{
  "id": "offboarding",
  "title": "퇴사자 계정 미회수",
  "category": "계정 및 IAM",
  "difficulty": "중",
  "departments": [
    "보안팀",
    "네트워크팀",
    "서버팀"
  ],
  "estMinutes": 9,
  "coreChallenge": "여러 팀에 걸친 체크리스트 누락을 추궁이 아니라 구조 문제로 짚어낼 수 있는지",
  "briefing": "월간 접근권한 감사 중, 3주 전 퇴사한 직원의 VPN 계정이 여전히 활성 상태인 것을 발견했다. 그 직원은 퇴사 전 핵심 프로젝트 담당자였다.",
  "participants": [
    "security_lead",
    "security_employee",
    "network_manager",
    "server_manager"
  ],
  "player": "security_lead",
  "isAssumption": true,
  "stages": [
    {
      "id": "discover",
      "speaker": "security_employee",
      "listener": "security_lead",
      "narration": "보안사원이 다급하게 찾아왔다. \"팀장님, 이거 심각한데요. 3주 전 퇴사한 김OO 씨 VPN 계정이 아직 살아있습니다. 그분 핵심 프로젝트 담당이었잖아요.\"",
      "facts": [
        "AD 계정: 비활성화 완료 (퇴사일 처리됨)",
        "VPN 계정: 활성 상태 (누락, 3주째 방치)",
        "최근 30일 내 해당 VPN 계정 로그인 이력 없음",
        "퇴사자 담당 프로젝트: 사내 핵심 결제 시스템"
      ],
      "choices": [
        {
          "id": "revoke_immediately",
          "label": "일단 바로 차단한다 — \"원인은 나중에, 지금은 막는 게 먼저\"",
          "next": "revoked",
          "consequence": "3분 내 처리. 다만 누가 놓쳤는지는 나중에 밝혀야 한다"
        },
        {
          "id": "investigate_first",
          "label": "왜 누락됐는지 먼저 추적한다 — \"같은 패턴이 더 있을 수도 있다\"",
          "next": "investigated",
          "consequence": "원인은 먼저 잡지만, 그 사이 리스크 노출 시간이 길어진다"
        }
      ]
    },
    {
      "id": "investigated",
      "speaker": "network_manager",
      "listener": "security_lead",
      "narration": "네트워크과장에게 전화하니 조금 방어적인 톤이 돌아온다. \"그때 담당자가 휴가 중이어서 제가 대리로 처리했는데... 체크리스트에 VPN 항목이 있긴 한데 수동으로 체크하는 거라 놓쳤을 수 있어요. 솔직히 그날 퇴사 처리가 3명이나 몰려 있었습니다.\"",
      "facts": [
        "담당자 휴가 중 네트워크과장이 대리 처리",
        "퇴사 체크리스트에 VPN 항목은 있었으나 수동 확인 단계",
        "같은 날 퇴사자 3명 동시 처리 — 업무량 몰림"
      ],
      "choices": [
        {
          "id": "revoke_now",
          "label": "일단 VPN 계정부터 비활성화한다",
          "next": "revoked",
          "consequence": "원인까지 확인한 뒤 조치하지만, 노출 시간은 더 길어졌다"
        }
      ]
    },
    {
      "id": "revoked",
      "speaker": "security_lead",
      "narration": "VPN 계정을 비활성화했다. 로그인 이력이 없어 다행히 실제 악용은 없었던 것으로 확인됐다. 서버과장에게도 확인해보니 \"저희 쪽 서버 접근 권한은 이미 회수했어요, VPN은 네트워크팀 담당 아닌가요?\"라는 답이 돌아온다 — 담당 경계가 애매했던 지점이다.",
      "facts": [
        "VPN 계정 비활성화 완료",
        "악용 이력 없음 (접속 로그 0건)",
        "서버 접근 권한은 서버팀이 이미 회수 완료",
        "VPN 계정 회수 담당이 체크리스트상 명확히 지정돼 있지 않았음"
      ],
      "choices": [
        {
          "id": "root_cause_review",
          "label": "담당 경계를 명확히 하는 재발 방지안을 만든다",
          "next": "resolved",
          "consequence": "누구 책임이냐를 따지지 않고 구조를 고치는 쪽으로 마무리"
        },
        {
          "id": "close_without_review",
          "label": "일단 조치했으니 종결 처리한다",
          "next": "resolved_no_review",
          "consequence": "빠르게 끝나지만 같은 애매함이 다음 퇴사자에게도 남는다"
        }
      ]
    },
    {
      "id": "resolved",
      "terminal": true,
      "result": "resolved",
      "speaker": "security_lead",
      "summary": "회수는 완료됐다. 더 중요한 건, VPN 계정 회수 담당이 체크리스트상 명확하지 않았다는 점이었다. 네트워크과장 개인의 실수로 몰고 가지 않고, 담당자 서명란을 추가해 누락을 구조적으로 막는 개선안을 마련했다.",
      "lessons": [
        "여러 팀에 걸친 체크리스트는 '담당자 서명'이 없으면 경계가 애매해진다",
        "담당자 부재 시 대리 처리 규칙과 책임 범위를 미리 정해둬야 한다",
        "문제가 생겼을 때 개인을 탓하기보다 구조의 틈을 먼저 봐야 다음 사고를 막는다"
      ]
    },
    {
      "id": "resolved_no_review",
      "terminal": true,
      "result": "partial",
      "speaker": "security_lead",
      "summary": "회수는 완료됐지만 담당 경계가 애매했던 원인은 그대로 남았다. 네트워크팀과 서버팀은 각자 \"내 담당은 처리했다\"고 생각하고 있고, 다음 퇴사자 처리 때 똑같은 틈이 또 생길 가능성이 높다.",
      "lessons": [
        "조치와 재발 방지는 분리된 단계다",
        "담당 경계가 애매한 상태로 종결하면, 각 팀은 자기 역할을 다했다고 믿은 채 같은 사고가 반복된다"
      ]
    }
  ]
},
  {
  "id": "db_access",
  "title": "DB 접근권한 요청",
  "category": "데이터베이스",
  "difficulty": "하",
  "departments": [
    "DBA팀",
    "보안팀"
  ],
  "estMinutes": 6,
  "coreChallenge": "급하다는 요청자의 압박과 최소 권한 원칙 사이에서 속도를 얼마나 양보할지 판단하기",
  "briefing": "신규 입사한 백엔드 개발자가 운영 DB의 특정 스키마 조회 권한을 요청했다. 요청서에는 '오늘 중으로 급해요'라는 메모가 붙어 있다.",
  "participants": [
    "dba_lead",
    "db_employee",
    "security_lead"
  ],
  "player": "dba_lead",
  "isAssumption": false,
  "stages": [
    {
      "id": "review",
      "speaker": "dba_lead",
      "narration": "요청서가 도착했다: \"orders 스키마, 전체 테이블, 조회(READ) 권한. 오늘 중으로 급해요 — 팀장님이 오늘 데모 준비하라고 하셨습니다.\" 신규 입사자가 급해 보인다.",
      "facts": [
        "요청자: 입사 1주차 백엔드 개발자",
        "요청 스키마: orders (주문 정보 포함, 결제 테이블도 같은 스키마)",
        "요청 권한: 전체 테이블 READ",
        "요청서 메모: \"오늘 중으로 급해요\""
      ],
      "choices": [
        {
          "id": "grant_as_is",
          "label": "요청대로 바로 부여한다 — 신규 입사자 데모 일정을 맞춰준다",
          "next": "granted_broad",
          "consequence": "5분 내 처리되지만 결제 정보 테이블까지 포함된 과다 권한이 남는다"
        },
        {
          "id": "check_sensitivity",
          "label": "보안팀장에 데이터 민감도 검토부터 요청한다",
          "next": "sensitivity_checked",
          "consequence": "처리가 20분 정도 늦어지지만, 범위가 적절해진다 — 신규 입사자에게는 설명이 필요하다"
        }
      ]
    },
    {
      "id": "sensitivity_checked",
      "speaker": "security_lead",
      "listener": "dba_lead",
      "narration": "보안팀장이 확인한 결과를 알려준다. \"orders 스키마 안에 payments 테이블이 같이 있네요. 결제 정보라서 그건 별도 승인 라인을 타야 합니다. 나머지 주문 테이블은 바로 드려도 돼요.\"",
      "facts": [
        "payments 테이블: 결제 정보 포함, 별도 승인 필요 (정보보호책임자 승인 라인)",
        "나머지 테이블: 일반 주문 정보, 즉시 승인 가능",
        "별도 승인까지 예상 소요: 1~2일"
      ],
      "choices": [
        {
          "id": "grant_excluding_payments",
          "label": "payments 제외하고 나머지만 바로 부여한다",
          "next": "granted_scoped",
          "consequence": "데모 일정은 맞추면서도 민감 데이터는 분리해 처리한다"
        }
      ]
    },
    {
      "id": "granted_broad",
      "speaker": "db_employee",
      "narration": "권한을 부여했다. 개발자가 접속 테스트에 성공해 데모 준비는 문제없이 끝났다. 다만 DB사원이 권한 부여 로그를 정리하다가 \"이거 payments까지 열려있는데, 이분 입사 1주차인데 이렇게까지 필요한가요?\"라고 묻는다.",
      "facts": [
        "전체 테이블 접근 가능 (payments 포함)",
        "데모는 문제없이 완료",
        "DB사원이 권한 범위에 의문 제기"
      ],
      "choices": [
        {
          "id": "confirm_broad",
          "label": "일단 분기 리뷰로 넘긴다",
          "next": "resolved_broad",
          "consequence": "당장 문제는 없지만 과다 권한이 그대로 남는다"
        }
      ]
    },
    {
      "id": "granted_scoped",
      "speaker": "db_employee",
      "narration": "권한을 부여했다. 개발자는 필요한 테이블에 바로 접속해 데모 준비를 마쳤다. payments가 왜 빠졌는지 묻는 메시지가 왔지만, \"결제 정보라 별도 승인이 필요하다\"는 설명에 수긍했다.",
      "facts": [
        "필요 범위만 접근 가능",
        "payments는 별도 요청 트랙으로 분리되어 기록됨",
        "개발자 측 데모는 문제없이 완료"
      ],
      "choices": [
        {
          "id": "confirm_scoped",
          "label": "분기 리뷰로 넘긴다",
          "next": "resolved_scoped",
          "consequence": "최소 권한 원칙을 지키면서도 요청자의 일정은 맞췄다"
        }
      ]
    },
    {
      "id": "resolved_broad",
      "terminal": true,
      "result": "partial",
      "speaker": "dba_lead",
      "summary": "요청은 처리됐고 데모도 문제없이 끝났다. 하지만 입사 1주차 개발자에게 결제 정보까지 열린 권한이 그대로 남았고, 이건 분기 리뷰에서 지적될 가능성이 높다. '급하다'는 말이 권한 범위를 줄이는 이유가 되지는 않았어야 했다.",
      "lessons": [
        "요청받은 범위가 항상 필요한 범위는 아니다",
        "'급하다'는 요청자의 사정과 권한 범위의 적절성은 별개 문제다",
        "민감 테이블은 스키마 단위가 아니라 테이블 단위로 분리 검토해야 한다"
      ]
    },
    {
      "id": "resolved_scoped",
      "terminal": true,
      "result": "resolved",
      "speaker": "dba_lead",
      "summary": "최소 권한 원칙에 따라 필요한 범위만 부여했고, 결제 정보는 별도 트랙으로 분리됐다. 요청자의 일정도 지켰고 민감 데이터도 보호했다 — 속도와 원칙이 꼭 충돌하는 건 아니었다.",
      "lessons": [
        "권한 요청은 스키마 단위보다 테이블/데이터 민감도 단위로 검토해야 정확하다",
        "급한 요청이라도 민감 데이터 분리와 처리 속도는 동시에 챙길 수 있다"
      ]
    }
  ]
},
  {
  "id": "deployment",
  "title": "코드 배포 실패",
  "category": "Kubernetes 및 CI/CD",
  "difficulty": "중",
  "departments": [
    "인프라/DevOps팀",
    "보안팀",
    "DBA팀"
  ],
  "estMinutes": 9,
  "coreChallenge": "빠른 복구 압박 속에서 롤백만 하고 넘어갈지, 원인을 짚고 넘어갈지 판단하기",
  "briefing": "오후 2시, 결제 서비스의 새 버전이 Kubernetes에 롤링 업데이트로 배포된 직후 헬스체크 실패 알람이 울렸다. 결제 서비스라 다운타임이 길어지면 매출에 바로 영향이 간다.",
  "participants": [
    "infra_devops_manager",
    "devops_employee",
    "dba_lead"
  ],
  "player": "infra_devops_manager",
  "isAssumption": false,
  "stages": [
    {
      "id": "detect",
      "speaker": "devops_employee",
      "listener": "infra_devops_manager",
      "narration": "DevOps사원이 다급하게 메신저를 보냈다. \"과장님, 결제 서비스 Ready 0/3입니다. Pod는 떴는데 응답이 없어요. 결제 담당 임원이 벌써 상태 물어보고 있습니다.\"",
      "facts": [
        "신규 Pod 3/3 Running이지만 Ready 0/3",
        "애플리케이션 로그에 DB 연결 타임아웃 에러 반복",
        "결제 서비스 다운타임 누적 4분, 결제 실패 건수 집계 중"
      ],
      "choices": [
        {
          "id": "auto_rollback",
          "label": "일단 바로 자동 롤백한다 — \"원인은 나중에, 지금은 복구가 먼저\"",
          "next": "rolled_back",
          "consequence": "서비스는 2분 내 복구되지만, 원인을 모르는 채로 다음 배포를 또 해야 한다"
        },
        {
          "id": "check_db_first",
          "label": "DBA팀장에 DB 상태 확인을 요청한다 — 원인을 먼저 짚는다",
          "next": "db_checked",
          "consequence": "다운타임이 3~4분 더 길어지지만, 원인을 알고 롤백하게 된다"
        }
      ]
    },
    {
      "id": "db_checked",
      "speaker": "dba_lead",
      "listener": "infra_devops_manager",
      "narration": "DBA팀장이 확인 후 약간 날선 목소리로 전화했다. \"이번 배포에 커넥션 풀 크기를 200으로 올린 설정이 들어갔던데요, 저희 쪽엔 공유 안 됐습니다. 운영 DB 최대 연결이 150인데 이걸로 다른 서비스 연결까지 다 밀려났어요.\"",
      "facts": [
        "신규 설정: 커넥션 풀 크기 200",
        "DB 최대 연결 허용치: 150",
        "기존 서비스 3개의 DB 연결까지 함께 포화",
        "DBA팀: 해당 설정 변경을 사전에 공유받지 못했음"
      ],
      "choices": [
        {
          "id": "rollback_with_cause",
          "label": "원인을 공유하고 롤백한다",
          "next": "rolled_back_informed",
          "consequence": "롤백과 동시에 재배포 조건이 명확해지고, 사전 공유 부재 문제도 드러난다"
        }
      ]
    },
    {
      "id": "rolled_back",
      "speaker": "infra_devops_manager",
      "narration": "롤백으로 서비스는 복구됐다. 다만 원인을 모르니 재배포 시점을 정하기가 애매하다. DBA팀장에게 사후에 물어보니 \"그 설정, 저희한테 미리 말씀해주셨으면 바로 알았을 텐데요\"라는 답이 돌아온다 — 복구는 빨랐지만 같은 문제가 다음 배포에서 또 터질 수 있다.",
      "facts": [
        "서비스 정상화 (롤백 완료)",
        "원인 미파악 상태로 재배포 보류",
        "DBA팀: 사전 공유 부재를 지적"
      ],
      "choices": [
        {
          "id": "investigate_after",
          "label": "지금이라도 DBA팀장과 원인을 짚는다",
          "next": "db_checked",
          "consequence": "늦게라도 원인은 확인하지만, 복구와 원인 파악이 분리되며 총 대응 시간이 늘어났다"
        }
      ]
    },
    {
      "id": "rolled_back_informed",
      "terminal": true,
      "result": "resolved",
      "speaker": "infra_devops_manager",
      "summary": "커넥션 풀 설정값이 원인으로 확인됐다. 복구 속도만 보면 즉시 롤백이 더 빨랐겠지만, 원인을 모르고 넘어갔다면 다음 배포에서 똑같이 터졌을 것이다. 배포 전 DBA팀과 설정값을 공유하는 체크 항목이 추가됐다.",
      "lessons": [
        "애플리케이션 설정 변경이 인프라 용량 한계를 건드릴 수 있다",
        "배포 전 DB 영향도 검토를 체크리스트에 넣지 않으면, 복구는 빨라도 재발은 못 막는다",
        "다른 팀 자원에 영향을 주는 변경은 사전 공유가 복구 속도보다 먼저 와야 한다"
      ]
    }
  ]
},
  {
  "id": "cert_renewal",
  "title": "인증서 만료 임박",
  "category": "암호화 및 인증서",
  "difficulty": "중",
  "departments": [
    "보안팀",
    "인프라/DevOps팀"
  ],
  "estMinutes": 6,
  "coreChallenge": "자동 갱신 실패를 발견했을 때, 만료까지 남은 시간과 작업 영향 범위를 같이 판단하기",
  "briefing": "보안팀장의 월간 인증서 점검에서, 결제 연동 서비스 인증서가 자동 갱신에 실패한 채 만료 36시간 전인 걸 발견했다. 담당 자동화 스크립트가 2주 전부터 조용히 에러를 내고 있었다.",
  "participants": [
    "security_lead",
    "infra_employee_2"
  ],
  "player": "security_lead",
  "isAssumption": false,
  "stages": [
    {
      "id": "start",
      "speaker": "security_lead",
      "listener": "infra_employee_2",
      "narration": "보안팀장이 급하게 인프라관리사원2를 찾았다. \"결제 연동 서비스 인증서, 36시간 뒤 만료인데 자동 갱신이 안 되고 있어요. 당장 처리해야 합니다.\"",
      "facts": [
        "자동 갱신 스크립트가 2주 전부터 인증 오류로 실패 (알람이 낮은 우선도로 분류돼 있었음)",
        "만료 시 결제 연동 서비스 전체 중단",
        "수동 갱신 절차는 있지만 평소 거의 쓰지 않아 담당자가 익숙하지 않음"
      ],
      "choices": [
        {
          "id": "manual_renew_now",
          "label": "지금 바로 수동 갱신 절차를 밟는다 — 익숙하지 않아도 36시간 전에 끝내야 한다",
          "next": "manual_success",
          "consequence": "익숙하지 않은 절차라 평소보다 시간이 걸리지만 만료 전에 끝낼 여유는 있다"
        },
        {
          "id": "fix_automation_first",
          "label": "자동화 스크립트 오류부터 고치고 그걸로 갱신한다 — 다음에 또 이런 일이 없게",
          "next": "automation_risk",
          "consequence": "근본 원인은 해결되지만, 디버깅 시간이 길어지며 만료 시한에 더 가까워진다"
        }
      ]
    },
    {
      "id": "manual_success",
      "speaker": "infra_employee_2",
      "listener": "security_lead",
      "terminal": true,
      "result": "resolved",
      "summary": "수동 갱신은 만료 10시간 전에 완료됐다. 이후 별도로 자동화 스크립트 오류도 확인해 고쳤다.",
      "narration": "인프라관리사원2가 보고했다. \"수동으로 갱신 끝냈습니다. 자동화 스크립트는 따로 시간 내서 고쳐볼게요.\"",
      "lessons": [
        "만료 시한이 가까운 상황에서는 익숙한 수동 절차로 먼저 안전을 확보하고, 근본 원인은 그 다음에 고치는 순서가 안전하다",
        "낮은 우선도로 분류된 알람도 2주 쌓이면 긴급 상황이 된다 — 알람 우선도 분류 기준을 다시 볼 필요가 있다"
      ]
    },
    {
      "id": "automation_risk",
      "speaker": "security_lead",
      "listener": "infra_employee_2",
      "terminal": true,
      "result": "partial",
      "summary": "디버깅에 예상보다 오래 걸려 만료 4시간 전에야 겨우 갱신을 끝냈다. 결과적으로 해결은 됐지만 운영 리스크가 컸던 선택이었다.",
      "narration": "보안팀장이 식은땀을 흘리며 말했다. \"다 됐다니 다행인데, 4시간 전까지 갔던 건 좀 위험했어요.\"",
      "lessons": [
        "만료 시한이 가까울 때는 근본 원인 수정보다 확실한 임시 조치를 먼저 확보하는 게 우선이다"
      ]
    }
  ]
},
{
  "id": "cloud_saas_review",
  "title": "신규 SaaS 도입 검토",
  "category": "클라우드 및 SaaS",
  "difficulty": "중",
  "departments": [
    "인프라/DevOps팀",
    "보안팀",
    "DBA팀"
  ],
  "estMinutes": 8,
  "coreChallenge": "사업부서의 '검증된 서비스' 라는 말과, 데이터가 실제로 어디에 저장되는지를 확인하는 절차 사이에서 속도를 맞추기",
  "briefing": "영업부서가 해외 SaaS 분석 도구를 도입하고 싶다며 계약 직전이라고 알려왔다. \"이미 다른 금융사도 쓰는 검증된 서비스\"라고 강조하는데, 고객 데이터 일부가 그 서비스로 넘어가야 한다.",
  "participants": [
    "infra_employee_1",
    "security_lead",
    "dba_lead"
  ],
  "player": "security_lead",
  "isAssumption": false,
  "stages": [
    {
      "id": "start",
      "speaker": "infra_employee_1",
      "listener": "security_lead",
      "narration": "인프라관리사원1이 요구사항을 정리해 보안팀장에 넘겼다. \"데이터 위치 물어보니 '글로벌 클라우드에 분산 저장'이라고만 하는데, 구체적으로 어느 나라인지는 답을 안 주네요.\"",
      "facts": [
        "전자금융거래법 제21조의2: 금융 데이터의 해외 이전에는 별도 요건 적용",
        "해당 서비스 제공사는 데이터 저장 위치를 구체적으로 공개하지 않음",
        "영업부서는 \"계약 만료가 이번 주\"라며 빠른 승인을 요청"
      ],
      "choices": [
        {
          "id": "approve_with_pressure",
          "label": "영업부서 일정에 맞춰 조건부로 승인하고, 데이터 위치는 추후 서면으로 받기로 한다",
          "next": "conditional_risk",
          "consequence": "계약은 제때 체결되지만, 규제 요건 미확인 상태로 데이터가 넘어가게 된다"
        },
        {
          "id": "block_until_confirmed",
          "label": "데이터 저장 위치가 서면으로 확인되기 전까지는 승인하지 않는다",
          "next": "clarified_approval",
          "consequence": "영업부서는 계약 일정에 불만을 갖지만, 공급사가 결국 구체적인 위치를 공개해온다"
        }
      ]
    },
    {
      "id": "conditional_risk",
      "speaker": "dba_lead",
      "listener": "security_lead",
      "terminal": true,
      "result": "partial",
      "summary": "계약 후 두 달이 지나도 공급사의 서면 확인이 오지 않았고, 분기 규정 준수 감사에서 이 건이 '미확인 해외 이전'으로 지적됐다.",
      "narration": "DBA팀장이 분기 감사 자료를 보며 말했다. \"이 건, 서면으로 받기로 했던 자료가 아직도 없네요. 이러면 감사 때 설명이 곤란해집니다.\"",
      "lessons": [
        "'추후 서면으로 받기로 한다'는 조건은, 실제로 받을 기한과 받지 못했을 때의 조치가 같이 있어야 의미가 있다",
        "계약 일정의 압박이 규제 확인 절차를 건너뛰는 이유가 되면, 그 책임은 나중에 승인한 사람에게 돌아온다"
      ]
    },
    {
      "id": "clarified_approval",
      "speaker": "dba_lead",
      "listener": "security_lead",
      "terminal": true,
      "result": "resolved",
      "summary": "공급사가 데이터센터 위치를 특정 리전으로 명시한 서면을 보내왔고, 법무 검토를 거쳐 정상적으로 승인됐다.",
      "narration": "DBA팀장이 확인했다. \"리전 명시 받았고 법무팀 검토도 끝났습니다. 이제 승인해도 됩니다.\"",
      "lessons": [
        "해외 데이터 이전이 걸린 건은 사업 일정보다 규제 확인이 먼저 끝나야 한다 — 순서를 바꾸면 돌이키기 어렵다"
      ]
    }
  ]
},
{
  "id": "remote_access",
  "title": "협력업체 원격접속 요청",
  "category": "원격접속 및 VPN",
  "difficulty": "하",
  "departments": [
    "네트워크팀",
    "보안팀"
  ],
  "estMinutes": 5,
  "coreChallenge": "외부 협력업체 접속 요청에서, 급한 일정과 접속 범위 제한 사이의 균형을 잡기",
  "briefing": "외주 유지보수 업체가 당일 장애 대응을 위해 VPN 접속을 요청했다. 평소 거래하던 업체지만, 이번 담당자는 처음 보는 사람이고 MFA 등록이 안 돼 있다.",
  "participants": [
    "network_manager",
    "security_lead"
  ],
  "player": "network_manager",
  "isAssumption": false,
  "stages": [
    {
      "id": "start",
      "speaker": "network_manager",
      "listener": "security_lead",
      "narration": "네트워크과장이 요청을 받았다. \"오늘 중 장애 대응 때문에 급하게 들어와야 한다는데, MFA 등록이 안 된 신규 담당자입니다. 어떻게 할까요?\"",
      "facts": [
        "정책상 원격접속은 MFA 필수",
        "MFA 등록에는 통상 반나절 소요",
        "업체 측은 \"지금 당장 아니면 장애 복구가 늦어진다\"고 압박"
      ],
      "choices": [
        {
          "id": "skip_mfa",
          "label": "장애 대응이 급하니 MFA 없이 임시로 접속을 허용한다",
          "next": "mfa_skipped",
          "consequence": "장애 대응은 빠르게 시작되지만, 정책 예외가 기록 없이 발생한다"
        },
        {
          "id": "expedite_mfa",
          "label": "MFA 등록을 긴급 처리로 돌려 1시간 내 끝내고 그 다음 접속을 허용한다",
          "next": "mfa_expedited",
          "consequence": "1시간이 더 걸리지만 정책을 벗어나지 않는다"
        }
      ]
    },
    {
      "id": "mfa_skipped",
      "speaker": "security_lead",
      "listener": "network_manager",
      "terminal": true,
      "result": "partial",
      "summary": "장애는 해결됐지만, MFA 없는 접속 기록이 월간 보안 리포트에 '정책 예외'로 남아 소명이 필요해졌다.",
      "narration": "보안팀장이 리포트를 보며 물었다. \"이 건 MFA 없이 들어온 기록인데, 예외 처리 승인 문서가 없네요.\"",
      "lessons": [
        "급한 상황에서 정책을 건너뛰면, 그 판단의 근거를 남기지 않는 한 나중에 '왜'를 설명하기 어려워진다"
      ]
    },
    {
      "id": "mfa_expedited",
      "speaker": "security_lead",
      "listener": "network_manager",
      "terminal": true,
      "result": "resolved",
      "summary": "1시간 지연은 있었지만 정책을 지키면서 장애 대응이 진행됐고, 이후 접속 기록도 깨끗하게 남았다.",
      "narration": "보안팀장이 확인했다. \"MFA 등록 끝났고 접속 허용했습니다. 기록도 정상적으로 남아요.\"",
      "lessons": [
        "긴급 처리 트랙을 미리 마련해두면, '정책 예외'가 아니라 '정책 안에서 빠르게'가 가능해진다"
      ]
    }
  ]
},
{
  "id": "pam_request",
  "title": "특권계정 임시 발급",
  "category": "특권계정 관리(PAM)",
  "difficulty": "중",
  "departments": [
    "보안팀",
    "서버팀"
  ],
  "estMinutes": 6,
  "coreChallenge": "특권계정 세션 기록이 끊겼을 때, 작업을 계속 진행할지 중단할지 판단하기",
  "briefing": "서버과장이 긴급 패치 작업을 위해 임시 특권계정을 발급받아 작업 중인데, 20분쯤 지나 PAM 세션 녹화가 중단됐다는 알림이 왔다. 작업은 아직 끝나지 않았다.",
  "participants": [
    "server_manager",
    "security_lead"
  ],
  "player": "security_lead",
  "isAssumption": false,
  "stages": [
    {
      "id": "start",
      "speaker": "server_manager",
      "listener": "security_lead",
      "narration": "서버과장이 다급하게 연락했다. \"지금 패치 작업 중인데 세션 녹화가 끊겼다는 알림이 왔어요. 작업은 아직 70% 남았는데 어떻게 할까요?\"",
      "facts": [
        "PAM 정책: 모든 특권계정 세션은 비디오로 기록, 기록 중단 시 세션 재검토 필요",
        "작업을 중단하면 패치가 반쪽만 적용된 불완전한 상태로 남음",
        "녹화 중단 원인은 아직 불명 (저장소 문제로 추정)"
      ],
      "choices": [
        {
          "id": "continue_without_recording",
          "label": "기록 없이 작업을 계속 진행한다 — 반쪽 패치보다는 완료가 낫다",
          "next": "unrecorded_completion",
          "consequence": "작업은 끝나지만, 기록되지 않은 특권계정 작업 구간이 남는다"
        },
        {
          "id": "pause_and_restore",
          "label": "작업을 일시 중단하고 녹화 복구 후 재개한다",
          "next": "recording_restored",
          "consequence": "패치 완료가 늦어지지만 전체 작업이 기록으로 남는다"
        }
      ]
    },
    {
      "id": "unrecorded_completion",
      "speaker": "security_lead",
      "listener": "server_manager",
      "terminal": true,
      "result": "partial",
      "summary": "패치는 완료됐지만, 기록되지 않은 작업 구간에 대해 보안�장이 사후 인터뷰로 어떤 명령이 실행됐는지 재구성해야 했다.",
      "narration": "보안팀장이 말했다. \"일단 완료는 됐는데, 녹화 안 된 구간은 제가 따로 어떤 작업 하셨는지 정리해서 남겨야 합니다.\"",
      "lessons": [
        "PAM 세션 기록이 끊긴 상태의 작업은, 완료됐어도 '기록되지 않은 특권 행위'로 남아 별도 소명이 필요해진다"
      ]
    },
    {
      "id": "recording_restored",
      "speaker": "security_lead",
      "listener": "server_manager",
      "terminal": true,
      "result": "resolved",
      "summary": "15분 뒤 녹화 저장소 문제가 복구됐고, 전체 작업이 끊김 없이 기록으로 남았다. 패치는 예정보다 15분 늦게 끝났다.",
      "narration": "보안팀장이 확인했다. \"녹화 복구됐습니다. 이어서 진행하시면 전체 기록 남습니다.\"",
      "lessons": [
        "특권계정 작업에서 기록이 끊기면, 몇 분의 지연을 감수하고 기록을 복구하는 쪽이 사후 소명 부담을 훨씬 줄인다"
      ]
    }
  ]
},
{
  "id": "dns_change",
  "title": "신규 서버 DNS 등록",
  "category": "DNS 및 IPAM",
  "difficulty": "하",
  "departments": [
    "네트워크팀"
  ],
  "estMinutes": 4,
  "coreChallenge": "변경 전 백업과 확인 테스트를 생략하고 싶은 유혹을 이기기",
  "briefing": "신규 서버 3대가 추가되면서 DNS 레코드 등록과 IP 대역 할당 요청이 들어왔다. 네트워크사원이 \"다 똑같은 작업이라 금방 끝난다\"며 바로 적용하려 한다.",
  "participants": [
    "network_employee",
    "network_manager"
  ],
  "player": "network_manager",
  "isAssumption": false,
  "stages": [
    {
      "id": "start",
      "speaker": "network_employee",
      "listener": "network_manager",
      "narration": "네트워크사원이 보고했다. \"서버 3대 DNS, IP 할당 바로 진행하겠습니다. 다 비슷한 작업이라 백업은 생략해도 될 것 같아요.\"",
      "facts": [
        "표준 절차: 변경 전 백업 → 변경 적용 → 확인 테스트(ping, nslookup) → 최종 승인",
        "최근 비슷한 작업에서 IP 중복 할당 사고가 한 번 있었음",
        "작업 자체는 단순, 소요 시간 15분 내외"
      ],
      "choices": [
        {
          "id": "skip_backup",
          "label": "단순 작업이니 백업 단계는 생략하고 바로 적용한다",
          "next": "skipped_issue",
          "consequence": "작업은 5분 빠르게 끝나지만, 되돌릴 안전망이 없는 상태로 진행된다"
        },
        {
          "id": "follow_procedure",
          "label": "표준 절차대로 백업부터 뜨고 적용 후 확인 테스트까지 거친다",
          "next": "procedure_followed",
          "consequence": "5분 더 걸리지만 절차대로 끝난다"
        }
      ]
    },
    {
      "id": "skipped_issue",
      "speaker": "network_manager",
      "listener": "network_employee",
      "terminal": true,
      "result": "partial",
      "summary": "서버 3대 중 1대가 기존에 쓰던 IP와 겹쳤다. 백업이 없어 원래 설정을 되짚는 데 오히려 30분이 더 걸렸다.",
      "narration": "네트워크과장이 한숨을 쉬며 말했다. \"IP가 겹쳤는데 이전 설정 백업이 없으니 뭐가 원래 값이었는지부터 찾아야 하네요.\"",
      "lessons": [
        "'단순 작업'이라는 판단이 틀렸을 때 되돌릴 방법이 없으면, 아낀 5분보다 훨씬 큰 시간을 잃는다"
      ]
    },
    {
      "id": "procedure_followed",
      "speaker": "network_manager",
      "listener": "network_employee",
      "terminal": true,
      "result": "resolved",
      "summary": "확인 테스트 단계에서 1대의 IP 중복이 바로 발견돼 적용 전에 수정됐다. 전체 작업은 20분 걸렸다.",
      "narration": "네트워크사원이 보고했다. \"확인 테스트에서 중복 하나 잡았습니다. 바로 고치고 재테스트했어요.\"",
      "lessons": [
        "'단순해 보이는 작업'일수록 표준 절차의 확인 단계가 실제로 문제를 잡아낸다"
      ]
    }
  ]
},
{
  "id": "soc_alert",
  "title": "외부 SOC 보안 경보",
  "category": "보안 사고 및 외부 SOC",
  "difficulty": "상",
  "departments": [
    "보안팀"
  ],
  "estMinutes": 10,
  "coreChallenge": "SLA 시간 압박 속에서 과잉대응 비판을 감수하고도 Critical로 분류할 수 있는지",
  "briefing": "외주 SOC로부터 \"비정상 데이터 전송 패턴 탐지\" 경보가 접수됐다. 분류 SLA는 15분. 지난달 과잉대응으로 서버를 격리했다가 단순 오탐으로 끝나 팀 내에서 지적받은 적이 있다.",
  "participants": [
    "security_employee",
    "security_lead",
    "security_support"
  ],
  "player": "security_employee",
  "isAssumption": false,
  "stages": [
    {
      "id": "classify",
      "speaker": "security_employee",
      "narration": "경보를 확인했다: 고객DB 연동 서버에서 새벽 3시, 평소보다 50배 많은 외부 전송량이 발생했다. 지난달 비슷한 경보를 Critical로 올렸다가 단순 설정 오류로 끝나 \"또 오버하냐\"는 말을 들었던 기억이 떠오른다.",
      "facts": [
        "탐지 서버: 고객DB 연동 서버",
        "전송 시각: 새벽 3시 (업무 외 시간)",
        "전송 대상: 알려지지 않은 외부 IP",
        "지난달 유사 경보: Critical 분류 후 오탐으로 판명, 과잉대응 지적받음"
      ],
      "choices": [
        {
          "id": "classify_critical",
          "label": "그래도 Critical로 분류한다 — \"고객DB가 걸려있으면 리스크를 줄여서 보면 안 된다\"",
          "next": "critical_path",
          "consequence": "SLA: 초기대응 15분, 조사시작 30분. 또 오탐이면 두 번째 지적을 받을 수 있다"
        },
        {
          "id": "classify_high",
          "label": "이번엔 High로 낮춰 분류한다 — 지난달 지적이 부담된다",
          "next": "high_path",
          "consequence": "SLA: 초기대응 1시간, 조사시작 2시간. 신중해 보이지만 판단을 늦춘 것이기도 하다"
        }
      ]
    },
    {
      "id": "critical_path",
      "speaker": "security_employee",
      "listener": "security_lead",
      "narration": "Critical 분류로 보안팀장에게 즉시 승인 요청을 올렸다. 팀장도 고객DB 연동 서버라는 점에 동의하며 15분 내 격리를 승인했다. \"지난달 일은 신경 쓰지 마, 고객 데이터 걸린 건 다르게 봐야지.\"",
      "facts": [
        "보안팀장 승인: 즉시 격리 승인",
        "팀장 코멘트: 고객 데이터 관련 건은 과잉대응 리스크보다 보호가 우선"
      ],
      "choices": [
        {
          "id": "isolate_server",
          "label": "해당 서버 네트워크 격리",
          "next": "isolated",
          "consequence": "서버 격리, 업무 영향 발생 가능 — 다시 오탐이면 세 번째 체면 문제"
        }
      ]
    },
    {
      "id": "high_path",
      "speaker": "security_employee",
      "narration": "High로 분류해 1시간 내 대응 중이었는데, 그 사이 유사 패턴이 다른 서버 2대에서도 발견됐다. 보안지원인력이 메시지를 보냈다. \"이거 확산되는 것 같은데요? 분류 다시 보셔야 할 것 같아요.\"",
      "facts": [
        "확산 범위 증가 (추가 서버 2대)",
        "초기 분류가 낮았던 탓에 대응이 늦어짐",
        "보안지원인력이 재분류 필요성 제기"
      ],
      "choices": [
        {
          "id": "reclassify_critical",
          "label": "지금이라도 Critical로 재분류하고 팀장을 긴급 호출한다",
          "next": "critical_path",
          "consequence": "재분류까지 총 50분이 걸렸고, 이 지연은 타임라인에 그대로 남는다"
        }
      ]
    },
    {
      "id": "isolated",
      "speaker": "security_support",
      "listener": "security_employee",
      "narration": "서버를 격리한 뒤 지원인력이 로그를 샅샅이 뒤졌다. \"확인했습니다 — 신규 백업 솔루션 설정 오류였어요. 대상 IP가 백업 벤더 서버였고, 실제 유출은 아닙니다.\" 안도하면서도 \"또 오탐이었네\"라는 말이 나올까 걱정되는 순간이다.",
      "facts": [
        "원인: 신규 백업 솔루션 설정 오류 (대상 IP가 백업 벤더 서버)",
        "실제 데이터 유출 아님",
        "지원인력: 상세 로그 분석으로 원인 확정"
      ],
      "choices": [
        {
          "id": "release_isolation",
          "label": "격리 해제 및 종결 처리, 판단 근거를 명확히 기록한다",
          "next": "resolved_false_positive",
          "consequence": "오탐으로 결론. 하지만 이번엔 판단 과정 자체가 정당했다는 근거를 남긴다"
        }
      ]
    },
    {
      "id": "resolved_false_positive",
      "terminal": true,
      "result": "resolved",
      "speaker": "security_employee",
      "summary": "오탐으로 판명됐지만, 고객 데이터가 걸린 상황에서 Critical로 분류하고 신속히 격리한 판단 자체는 옳았다. 지난달 지적 때문에 분류를 낮췄다면 확산을 더 늦게 알아챘을 것이다. 오탐 여부와 판단의 정당성은 별개라는 걸 이번에는 근거로 남겼다.",
      "lessons": [
        "애매한 상황에서는 과소 대응보다 과대 대응 후 해제가 안전하다",
        "과거에 오탐으로 지적받은 경험이 다음 판단을 과도하게 조심스럽게 만들 수 있다 — 그 영향을 분리해서 봐야 한다",
        "신규 솔루션 도입 시 보안팀에 사전 공유가 필요하다 (오탐 방지)"
      ]
    }
  ]
},
{
  "id": "edr_isolation",
  "title": "EDR 단말 자동 격리",
  "category": "엔드포인트 보안(EDR/UEM)",
  "difficulty": "중",
  "departments": [
    "보안팀",
    "서버팀"
  ],
  "estMinutes": 6,
  "coreChallenge": "자동 격리가 걸린 임원 PC를, 업무 압박과 안전 확인 절차 사이에서 언제 풀어줄지 판단하기",
  "briefing": "EDR이 임원 한 명의 PC에서 의심 프로세스를 탐지해 자동 격리했다. 해당 임원은 지금 중요한 화상회의 직전이라며 당장 격리를 풀어달라고 비서를 통해 요청하고 있다.",
  "participants": [
    "security_employee",
    "security_lead"
  ],
  "player": "security_employee",
  "isAssumption": false,
  "stages": [
    {
      "id": "start",
      "speaker": "security_employee",
      "listener": "security_lead",
      "narration": "보안사원이 상황을 보고했다. \"임원 PC가 격리됐는데, 비서실에서 10분 뒤 화상회의가 있어서 당장 풀어달라고 계속 연락이 와요. 아직 원인 확인은 안 끝났습니다.\"",
      "facts": [
        "탐지된 프로세스: 알려지지 않은 서명 없는 실행 파일",
        "격리 해제 전 원인 분석 완료가 정책상 원칙",
        "화상회의까지 10분, 다른 기기로 참석은 가능"
      ],
      "choices": [
        {
          "id": "unlock_for_meeting",
          "label": "회의가 끝날 때까지만 임시로 격리를 해제한다",
          "next": "unlocked_risk",
          "consequence": "회의는 제시간에 열리지만, 분석이 끝나지 않은 위협이 다시 활동할 시간을 벌어준다"
        },
        {
          "id": "keep_isolated",
          "label": "격리는 유지하고, 다른 기기로 회의에 참석하도록 안내한다",
          "next": "isolation_maintained",
          "consequence": "비서실의 불만이 있지만 분석 중인 위협을 그대로 억제한 상태를 유지한다"
        }
      ]
    },
    {
      "id": "unlocked_risk",
      "speaker": "security_lead",
      "listener": "security_employee",
      "terminal": true,
      "result": "partial",
      "summary": "회의는 무사히 끝났지만, 격리 해제 30분 동안 해당 프로세스가 외부와 통신을 시도한 로그가 추가로 발견됐다.",
      "narration": "보안팀장이 로그를 보며 말했다. \"해제했던 30분 사이에 외부 통신 시도가 찍혀 있네요. 다행히 차단은 됐지만요.\"",
      "lessons": [
        "분석이 끝나지 않은 위협에 대한 격리는, 업무 긴급도와 상관없이 해제 자체가 위험을 다시 여는 행위다",
        "'임시로 잠깐'이라는 예외가 가장 위험한 시간대를 만든다"
      ]
    },
    {
      "id": "isolation_maintained",
      "speaker": "security_lead",
      "listener": "security_employee",
      "terminal": true,
      "result": "resolved",
      "summary": "임원은 다른 기기로 회의에 참석했고, 격리된 PC는 분석 결과 실제 악성코드로 확인돼 재설치 후 반환됐다.",
      "narration": "보안팀장이 분석을 마치고 말했다. \"실제 악성코드였습니다. 격리 유지한 게 맞는 판단이었어요.\"",
      "lessons": [
        "직급이나 긴급도와 무관하게, 분석이 끝나지 않은 격리는 풀지 않는 게 기본 원칙이다"
      ]
    }
  ]
},
{
  "id": "dlp_violation",
  "title": "DLP 유출 시도 차단",
  "category": "DLP(데이터손실방지)",
  "difficulty": "중",
  "departments": [
    "보안팀"
  ],
  "estMinutes": 6,
  "coreChallenge": "직원의 실수와 의도적 유출을 구분하기 전에, 어떤 수준까지 바로 조사할지 판단하기",
  "briefing": "DLP가 한 직원의 개인 이메일로 고객 명단 파일이 첨부된 메일 발송 시도를 차단했다. 해당 직원은 \"업무용 파일을 집에서 보려고 실수로 보낸 것\"이라고 해명한다.",
  "participants": [
    "security_employee",
    "security_lead"
  ],
  "player": "security_employee",
  "isAssumption": false,
  "stages": [
    {
      "id": "start",
      "speaker": "security_employee",
      "listener": "security_lead",
      "narration": "보안사원이 보고했다. \"고객 명단 파일 유출 시도가 차단됐는데, 본인은 실수라고 하네요. 어느 정도까지 조사해야 할까요?\"",
      "facts": [
        "차단된 파일: 고객 3천여 명 정보가 담긴 엑셀 파일",
        "개인정보보호법 제30조: 개인정보 유출 시도는 경위 확인 의무",
        "해당 직원 평소 보안 교육 이수 기록 정상"
      ],
      "choices": [
        {
          "id": "accept_explanation",
          "label": "실수라는 해명을 받아들이고 재교육 안내로 마무리한다",
          "next": "closed_without_check",
          "consequence": "빠르게 종결되지만 해명의 사실 여부를 따로 확인하지 않는다"
        },
        {
          "id": "verify_first",
          "label": "해명과 별개로 최근 접근 로그를 확인해 패턴을 본다",
          "next": "pattern_checked",
          "consequence": "조사에 시간이 더 들지만, 실제 의도와 무관하게 확인 절차 자체가 남는다"
        }
      ]
    },
    {
      "id": "closed_without_check",
      "speaker": "security_lead",
      "listener": "security_employee",
      "terminal": true,
      "result": "partial",
      "summary": "한 달 뒤 같은 직원이 비슷한 시도를 또 해서 차단됐다. 처음에 로그를 확인했다면 반복 패턴을 더 일찍 알았을 것이다.",
      "narration": "보안팀장이 두 번째 차단 기록을 보며 말했다. \"이 분, 지난달에도 비슷한 게 있었네요. 그때 조사를 더 해봤으면 좋았을 텐데요.\"",
      "lessons": [
        "본인 해명이 그럴듯해도, 개인정보 유출 시도는 '경위 확인'이 조사의 최소 기준이다",
        "한 번의 실수로 넘긴 기록이, 반복됐을 때 비로소 패턴으로 보인다"
      ]
    },
    {
      "id": "pattern_checked",
      "speaker": "security_lead",
      "listener": "security_employee",
      "terminal": true,
      "result": "resolved",
      "summary": "로그 확인 결과 실제로 단순 실수였다는 것이 확인됐고, 그 확인 과정 자체가 감사 대응 자료로 남았다.",
      "narration": "보안팀장이 결과를 보고 말했다. \"로그상으로는 정말 한 번뿐이고 패턴이 없네요. 실수로 결론 내도 되겠습니다.\"",
      "lessons": [
        "해명을 받아들이는 결론은 같아도, 확인 절차를 거쳤다는 기록이 있는 것과 없는 것은 감사 대응력에서 차이가 크다"
      ]
    }
  ]
},
{
  "id": "it_service_request",
  "title": "긴급 계정 잠금 해제 요청",
  "category": "ITSM(표준 티켓)",
  "difficulty": "하",
  "departments": [
    "보안팀",
    "DBA팀"
  ],
  "estMinutes": 4,
  "coreChallenge": "'긴급'이라고 적힌 티켓이 실제로 본인 요청인지 확인하는 절차를 생략하지 않기",
  "briefing": "서비스데스크를 거치지 않고 메신저로 직접 \"제 계정이 잠겨서 급한데 좀 풀어주세요\" 라는 요청이 보안팀 단체 채팅방에 올라왔다. SLA상 계정 잠금은 1시간 내 처리 대상이다.",
  "participants": [
    "security_employee",
    "dba_lead"
  ],
  "player": "security_employee",
  "isAssumption": false,
  "stages": [
    {
      "id": "start",
      "speaker": "security_employee",
      "listener": "dba_lead",
      "narration": "보안사원이 채팅방 메시지를 봤다. 직원 이름과 사번이 적혀 있지만, 본인 확인 절차 없이 바로 처리해달라는 요청이다. \"급하다고 하는데 바로 풀어드릴까요?\"",
      "facts": [
        "표준 절차: 본인 확인(사내 인증 또는 직속 상사 확인) 후 잠금 해제",
        "채팅방 요청은 본인 확인 단계를 거치지 않은 상태",
        "SLA: 계정 잠금 1시간 내 처리"
      ],
      "choices": [
        {
          "id": "unlock_immediately",
          "label": "사번이 맞으니 바로 잠금을 해제한다 — SLA 안에 처리하는 게 우선",
          "next": "unlocked_without_verify",
          "consequence": "SLA는 지키지만 본인 확인 없이 계정 접근이 복구된다"
        },
        {
          "id": "verify_identity",
          "label": "직속 상사에게 짧게 확인 메시지를 보내고 나서 처리한다",
          "next": "verified_unlock",
          "consequence": "5분 정도 더 걸리지만 본인 확인 절차를 지킨다"
        }
      ]
    },
    {
      "id": "unlocked_without_verify",
      "speaker": "dba_lead",
      "listener": "security_employee",
      "terminal": true,
      "result": "partial",
      "summary": "실제로는 본인 요청이 맞았지만, 월간 운영 리포트에서 '본인 확인 절차 누락 건'으로 집계돼 소명이 필요했다.",
      "narration": "DBA팀장이 리포트를 보며 말했다. \"이 건 본인 확인 절차가 비어 있네요. 결과는 문제없었지만 절차는 지켜야죠.\"",
      "lessons": [
        "사번이 맞다는 것과 본인 확인이 끝났다는 것은 다른 이야기다",
        "SLA 시간 안에 처리하는 것과 절차를 지키는 것은 둘 다 만족시킬 수 있는 경우가 많다 — 5분 더 쓰는 것으로 충분할 때가 많다"
      ]
    },
    {
      "id": "verified_unlock",
      "speaker": "dba_lead",
      "listener": "security_employee",
      "terminal": true,
      "result": "resolved",
      "summary": "직속 상사 확인을 거쳐 55분 안에 처리를 완료했고, SLA와 본인 확인 절차 둘 다 지켜졌다.",
      "narration": "DBA팀장이 확인했다. \"상사 확인받고 처리하셨네요. 55분이면 SLA도 문제없습니다.\"",
      "lessons": [
        "본인 확인 절차는 SLA를 못 지킬 핑계가 아니라, 대부분 SLA 범위 안에서 같이 지킬 수 있는 절차다"
      ]
    }
  ]
},
{
  "id": "monthly_report",
  "title": "월간 운영 리포트 취합",
  "category": "운영 리포팅 및 규제 대응",
  "difficulty": "하",
  "departments": [
    "DBA팀",
    "보안팀",
    "네트워크팀",
    "서버팀"
  ],
  "estMinutes": 7,
  "coreChallenge": "각 팀의 숫자가 서로 안 맞을 때, 누구 숫자를 기준으로 할지와 왜 안 맞는지를 같이 밝히기",
  "briefing": "월말, DBA팀장이 각 팀의 월간 성과 데이터를 모으고 있다. 보안팀이 보고한 '사건 건수'와 서버팀이 보고한 '장애로 인한 다운타임'이 같은 사건을 가리키는데 서로 다른 시간으로 집계돼 있다.",
  "participants": [
    "dba_lead",
    "security_lead",
    "server_manager"
  ],
  "player": "dba_lead",
  "isAssumption": false,
  "stages": [
    {
      "id": "start",
      "speaker": "dba_lead",
      "listener": "security_lead",
      "narration": "DBA팀장이 숫자를 맞춰보다가 멈췄다. \"이번 달 그 사건, 보안팀은 '2시간 사고'라고 보고했는데 서버팀은 '45분 다운타임'이라고 보고했어요. 같은 사건 맞죠?\"",
      "facts": [
        "보안팀 집계: 탐지부터 최종 종결까지 2시간 (조사·보고 포함)",
        "서버팀 집계: 실제 서비스 중단 시간 45분",
        "경영진 보고서에는 숫자 하나만 들어갈 자리가 있음"
      ],
      "choices": [
        {
          "id": "pick_shorter",
          "label": "경영진 보고엔 더 보기 좋은 45분 쪽을 쓴다 — 어차피 같은 사건이니까",
          "next": "misleading_report",
          "consequence": "보고서는 깔끔해 보이지만, 두 숫자가 왜 다른지는 설명되지 않은 채 묻힌다"
        },
        {
          "id": "report_both_with_context",
          "label": "둘 다 적고 '서비스 중단 45분, 전체 대응 완료까지 2시간'이라고 구분해서 쓴다",
          "next": "clarified_report",
          "consequence": "보고서 한 줄이 늘어나지만 두 팀의 집계 기준 차이가 명확해진다"
        }
      ]
    },
    {
      "id": "misleading_report",
      "speaker": "security_lead",
      "listener": "dba_lead",
      "terminal": true,
      "result": "partial",
      "summary": "다음 분기 감사에서 외부 감사인이 '사건 대응 시간' 지표의 정의가 리포트마다 다르다는 걸 지적했다.",
      "narration": "보안팀장이 감사 피드백을 전하며 말했다. \"감사인이 우리 지표 정의가 들쭉날쭉하다고 짚었어요. 이번 달 보고가 그 예시로 나왔습니다.\"",
      "lessons": [
        "같은 사건을 가리키는 두 숫자가 다르면, 보기 좋은 쪽을 고르는 게 아니라 정의 차이를 밝히는 게 먼저다"
      ]
    },
    {
      "id": "clarified_report",
      "speaker": "security_lead",
      "listener": "dba_lead",
      "terminal": true,
      "result": "resolved",
      "summary": "경영진 보고서에 두 지표가 각각 무엇을 측정하는지 명시됐고, 이후 리포트 양식에도 이 구분이 표준으로 반영됐다.",
      "narration": "보안팀장이 \"이렇게 구분해서 적으니 다음 달부터는 양식에 그냥 넣어도 되겠네요\" 라고 말했다.",
      "lessons": [
        "팀마다 다른 측정 기준을 하나의 숫자로 뭉치면 당장은 편해도, 그 숨겨진 차이는 결국 감사나 다음 보고에서 드러난다"
      ]
    }
  ]
},
{
  "id": "external_audit",
  "title": "외부 정기 감사 대응",
  "category": "외부 감사 및 규제",
  "difficulty": "중",
  "departments": [
    "DBA팀",
    "보안팀",
    "네트워크팀",
    "서버팀"
  ],
  "estMinutes": 8,
  "coreChallenge": "감사 직전 발견된 작은 불일치를, 감사 전에 조용히 고칠지 있는 그대로 보여줄지 판단하기",
  "briefing": "연간 외부 감사 시작 하루 전, DBA팀장이 사전 점검 중 접근권한 목록에 퇴사한 지 두 달 된 직원의 계정이 아직 '비활성화 대기' 상태로 남아 있는 걸 발견했다.",
  "participants": [
    "dba_lead",
    "security_lead"
  ],
  "player": "dba_lead",
  "isAssumption": false,
  "stages": [
    {
      "id": "start",
      "speaker": "dba_lead",
      "listener": "security_lead",
      "narration": "DBA팀장이 사전 점검표를 보다가 멈췄다. \"이 계정, 두 달 전 퇴사자인데 아직 비활성화가 안 끝나 있네요. 내일 감사인데 어떻게 할까요?\"",
      "facts": [
        "계정은 비활성화 '처리 중' 상태로 두 달간 방치, 실제 로그인 시도는 없었음",
        "원인: 퇴사 처리 담당자가 바뀌는 시기에 티켓이 누락됨",
        "감사까지 남은 시간: 18시간"
      ],
      "choices": [
        {
          "id": "quiet_fix",
          "label": "감사 전에 조용히 비활성화 처리만 끝내고 넘어간다",
          "next": "quiet_fix_exposed",
          "consequence": "계정 상태는 정리되지만, 두 달간 방치됐던 사실 자체는 기록에서 드러나지 않는다"
        },
        {
          "id": "disclose_and_fix",
          "label": "비활성화를 처리하면서, 두 달간 누락됐던 경위와 재발 방지안을 감사 자료에 같이 포함한다",
          "next": "disclosed_properly",
          "consequence": "감사 자료 준비에 시간이 더 들지만, 문제와 개선안을 같이 제시하게 된다"
        }
      ]
    },
    {
      "id": "quiet_fix_exposed",
      "speaker": "security_lead",
      "listener": "dba_lead",
      "terminal": true,
      "result": "partial",
      "summary": "감사인이 로그 분석 중 두 달 전 비활성화 처리 지연 흔적을 직접 발견했고, '사전에 인지하고도 보고하지 않은 것 아니냐'는 더 무거운 질문으로 이어졌다.",
      "narration": "보안팀장이 감사 중간 결과를 전했다. \"감사인이 로그에서 그 지연 흔적을 찾아냈어요. 저희가 알고 있었으면서 왜 미리 얘기 안 했냐고 물어보네요.\"",
      "lessons": [
        "감사 전에 문제를 조용히 고치는 것과, 문제를 감추는 것은 감사인 입장에서 구분되지 않는다",
        "스스로 발견한 문제는 감사인이 찾기 전에 먼저 보고하는 쪽이 신뢰를 지킨다"
      ]
    },
    {
      "id": "disclosed_properly",
      "speaker": "security_lead",
      "listener": "dba_lead",
      "terminal": true,
      "result": "resolved",
      "summary": "감사인은 두 달 지연을 지적했지만, 자발적으로 발견해 개선안까지 제시한 점을 긍정적으로 평가했다. 담당자 교체 시 인수인계 체크리스트가 새로 생겼다.",
      "narration": "보안팀장이 감사 결과를 전했다. \"지연 자체는 지적됐지만, 저희가 먼저 찾아서 개선안까지 냈다는 점은 좋게 봐주셨어요.\"",
      "lessons": [
        "작은 문제라도 발견 즉시 투명하게 보고하고 개선안을 같이 내는 태도가, 문제 자체보다 감사 결과에 더 큰 영향을 준다"
      ]
    }
  ]
}
];

  /* 전산실 핵심 서비스 20종 (IT TEAM-design/services.md 기반).
   * dept: 1차 책임 부서. roster의 dept 값과 맞춰 조직도 상태판에 표시한다. */
  var services = [
    { id: 'iam', name: '계정 및 신원 관리(IAM)', dept: '보안팀' },
    { id: 'dbms', name: '데이터베이스 운영', dept: 'DBA팀' },
    { id: 'firewall', name: '방화벽 및 네트워크 분리', dept: '네트워크팀' },
    { id: 'server_infra', name: '서버 및 인프라 운영', dept: '서버팀' },
    { id: 'sec_monitoring', name: '보안 모니터링 및 사건 관리', dept: '보안팀' },
    { id: 'cloud_saas', name: '클라우드 및 SaaS 관리', dept: '인프라/DevOps팀' },
    { id: 'backup_dr', name: '백업 및 재해복구', dept: '인프라/DevOps팀' },
    { id: 'cert_crypto', name: '인증서 및 암호화', dept: '보안팀' },
    { id: 'it_asset', name: 'IT 자산 및 라이선스 관리', dept: '인프라/DevOps팀' },
    { id: 'vpn', name: '원격접속(VPN)', dept: '네트워크팀' },
    { id: 'edr_uem', name: '엔드포인트 보안(EDR/UEM)', dept: '보안팀' },
    { id: 'dns_ipam', name: 'DNS 및 IPAM', dept: '네트워크팀' },
    { id: 'pam', name: '특권계정 관리(PAM)', dept: '보안팀' },
    { id: 'siem', name: '로그 및 SIEM', dept: '보안팀' },
    { id: 'cert_mgmt', name: '인증서 관리 고도화', dept: '보안팀' },
    { id: 'dlp', name: 'DLP(데이터손실방지)', dept: '보안팀' },
    { id: 'itsm', name: 'ITSM(변경·문제·요청 관리)', dept: 'DBA팀' },
    { id: 'cloud_cost', name: '클라우드 비용 최적화', dept: '인프라/DevOps팀' },
    { id: 'vendor_mgmt', name: '외주 솔루션 관리', dept: 'DBA팀' },
    { id: 'ops_report', name: '운영 리포팅 및 규제 대응', dept: 'DBA팀' },
  ];

  return {
    roster: roster,
    scenarios: scenarios,
    services: services,
  };
})();
