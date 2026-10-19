# 조직도

## 11명 조직 + 외주

`mermaid
graph TD
    DBA[DBA팀장 - 최고권한]

    DBA --> DB[DB사원]
    DBA --> SEC[보안팀장 - IAM책임자]
    DBA --> NET[네트워크과장]
    DBA --> SRV[서버과장]
    DBA --> DEVOPS[인프라DevOps과장]

    SEC --> SEC1[보안사원]
    SEC --> SEC2[보안팀 지원인력]
    NET --> NET1[네트워크사원]
    SRV --> SRV1[서버사원]
    SRV --> INF1[인프라관리사원 1]
    SRV --> INF2[인프라관리사원 2]
    DEVOPS --> DEV1[DevOps사원]

    subgraph 외주
        SOC[SOC관제 - 24시간]
        SD[서비스데스크]
        VENDOR[솔루션담당자 - EDR/PAM/SIEM]
    end

    SEC -. 경고수신 .-> SOC
    DBA -. ITSM위탁 .-> SD
    SEC -. 기술지원 .-> VENDOR
`

## 승인 권한 범위

| 역할 | 승인 범위 |
|------|---------|
| DBA팀장 | 전산실 전체 최종 승인 |
| 보안팀장 | IAM, 보안, EDR, PAM, DLP, 인증서 |
| 네트워크과장 | 방화벽, VPN, DNS |
| 서버과장 | 서버, 자산, 클라우드 |
| 인프라/DevOps과장 | Kubernetes, CI/CD |

