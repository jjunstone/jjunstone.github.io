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
    "id": "dba_lead",
    "name": "DBA팀장",
    "dept": "DBA팀",
    "level": "lead",
    "authority": "전산실 최고 권한",
    "color": "#173c78",
    "shortLabel": "DBA팀장",
    "hair": "short-side",
    "avatarImage": "./it-team-sim/avatars/dba_lead.png",
    "seat": { "x": 16.3, "y": 21 },
    "responsibilities": [
      "DB 운영 정책 최종 승인",
      "DB 접근권한 요청 심의",
      "DB 커넥션/용량 설계 검토"
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
      "DB 일상 운영 및 모니터링",
      "쿼리/스키마 점검 지원",
      "DBA팀장 보조"
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
      "IAM/보안 정책 최종 승인",
      "보안 사고 심각도 판단 및 에스컬레이션 수신",
      "타 부서 보안 검토 요청 대응"
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
      "보안 경보 1차 분류",
      "접근권한 감사",
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
      "보안 솔루션(SIEM/DLP 등) 기술 운영",
      "로그 상세 분석",
      "오탐/실제 위협 판별 지원"
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
      "방화벽/VPN/DNS 정책 최종 승인",
      "네트워크 장애 초동 대응 지휘",
      "보안팀과의 교차 조사 판단"
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
      "네트워크 장비/회선 모니터링",
      "1차 알람 확인 및 보고",
      "네트워크과장 보조"
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
      "서버/클라우드 자산 최종 승인",
      "퇴사자 자산 회수 확인",
      "서버팀 체크리스트 관리"
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
      "K8s/CI-CD 배포 최종 승인",
      "배포 장애 대응 지휘",
      "롤백/재배포 의사결정"
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
      "클라우드 자원 운영",
      "백업 작업 관리",
      "자산 현황 관리"
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
      "클라우드 자원 운영",
      "백업 작업 관리",
      "자산 현황 관리"
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
      "CI/CD 파이프라인 운영",
      "배포 후 헬스체크 모니터링",
      "배포 이상 1차 확인"
    ]
  }
];

  var scenarios = [
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
}
];

  return {
    roster: roster,
    scenarios: scenarios,
  };
})();
