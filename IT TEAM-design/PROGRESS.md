Datacenter Design Project - Phase 4 Progress

## Current Status: Phase 4 - 시뮬레이터 구현 완료, 문서 정합성 정리 중

### 중요 정정 (2026-11-07)
이 문서는 한동안 "11명" 조직 기준으로 멈춰 있었으나, DECISIONS.md D-010과 실제 시뮬레이터 구현(it-team-sim/data/sim-data.js roster)은 모두
**12명**(인프라/DevOps과장 산하에 인프라관리사원 2명 + DevOps사원 1명 신규 반영)으로 확정되어 있었습니다.
아래 내용을 12명 기준으로 정정합니다. ops-calendar.md의 업무량 계산도 11명 기준으로 작성되어 있어 재검증이 필요합니다(review/gap-analysis.md 참고).

### Completed (Phase 1-3)
- Organization: 12명 (DBA팀장 1 + 팀장급 4 + 사원급 6 + 지원인력 1) - D-010 확정
- Basic Services: 9개 confirmed
- Basic Flows: 13개 confirmed
- Operating Philosophy: RACI model defined
- Decisions: D-010 through D-015 finalized

### In Progress (Phase 4)
- Services: 9 → 20 (11개 신규 추가) 완료
- Flows: 13 → 24 (11개 추가, 24_monthly_operations_report.md 포함) 완료
- ops-calendar.md (업무량 검증) - 11명 기준으로 작성됨, 12명 기준 재검증 필요
- Org Chart & Diagrams - PENDING
- 시뮬레이터 구현 (it-team-sim.html): 12명 조직 전원 반영, 24개 흐름 중 5개를 플레이 가능한 장애/요청 시나리오로 구현 완료
  (VPN 장애, 퇴사자 계정 미회수, DB 접근권한 요청, 코드 배포 실패, 외부 SOC 보안 경보)

### Final Organization (12명 + Outsourcing)

Internal Team (12명):
- DBA팀장 (1) - 전산실 최고 권한
- DB사원 (1)
- 보안팀 (3): 보안팀장 + 보안사원 + 보안팀 지원인력
- 네트워크팀 (2): 네트워크과장 + 네트워크사원
- 서버팀 (1): 서버과장
- 인프라/DevOps팀 (4): 인프라/DevOps과장 + 인프라관리사원 2명 + DevOps사원

Outsourcing:
- Solution Vendors: EDR, PAM, SIEM Technical Support
- Service Desk: IT Requests (PC Setup, Account Reset)
- Infrastructure Operations: Cloud Monitoring, Partial Backup

### Services (20개 Total)

Basic 9: IAM, Database, Firewall, Servers, Monitoring, Cloud, Backup, Encryption, Assets

New 11 (Phase 4):
10. VPN (Remote Access)
11. EDR/UEM (Endpoint Security)
12. DNS/IPAM
13. PAM (Privileged Account Management)
14. SIEM/SOC Integration
15. Advanced Certificate Management
16. DLP (Data Loss Prevention)
17. ITSM (Change/Problem/Request Management)
18. Cloud Cost Optimization
19. Outsourcing Solution Management
20. Operations Reporting & Compliance

### Key Warnings

?? HIGH: Security Team Lead (8 Services)
- Mitigation: Support Personnel + Outsourcing Distribution

?? MEDIUM: Infrastructure Staff ×2 (4 Services)
- Cloud + Backup + Costs + Assets Concurrent
- Mitigation: Priority Adjustment or Outsourcing Expansion

### Next Immediate Tasks

1. Add Flows F14-F23 (10개 흐름)
2. Create ops-calendar.md (verify 12명 workload) - 재검증 필요 (현재 11명 기준)
3. Redefine mapping/raci.md
4. Create organizational diagrams

### Decisions Made

D-010: Organization → 12명 (confirmed)
D-011: SOC Model → Monitoring-only Outsourcing (confirmed)
D-012: Scope → Full Services (confirmed)
D-013: Service Range → All 20 Services (confirmed)
D-014: Flow Range → All 23 Flows (confirmed)
D-015: Resource Response → Outsourcing + Priority Mix (confirmed)

### Timeline

Week 1: Services Expansion (DONE) + Flows Expansion (DOING)
Week 2-3: Workload Verification + RACI Redefinition
Week 3-4: Diagrams Creation + Final Review

### Files Updated

? services.md (20개 서비스)
? PROGRESS.md (this file)
- flows/ (pending)
- ops-calendar.md (pending)
- mapping/raci.md (pending)
- Org Charts (pending)

Last Update: 2026-10-19
Next Update: Phase 4 Flows Expansion Complete



