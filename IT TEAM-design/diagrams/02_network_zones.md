# 망분리 구조도 (전자금융감독규정 망분리 요건)

`mermaid
graph LR
    INTERNET[인터넷]

    subgraph DMZ[외부 DMZ]
        WAF[WAF]
        WEB[웹서버]
        VPN_GW[VPN 게이트웨이]
    end

    subgraph INTERNAL[내부 업무망]
        APP[업무 애플리케이션]
        AKS[Kubernetes AKS]
        IAM[IAM 서버]
    end

    subgraph RESTRICTED[제한망 - DB/결제]
        DB_SRV[데이터베이스]
        PAY[결제 처리]
        BACKUP[백업 스토리지]
    end

    subgraph MGMT[관리망]
        BASTION[Bastion Host]
        SIEM[SIEM/로그]
        MON[모니터링]
    end

    INTERNET --> WAF
    WAF --> WEB
    INTERNET --> VPN_GW
    VPN_GW --> INTERNAL

    WEB --> APP
    APP --> DB_SRV
    APP --> PAY

    BASTION --> INTERNAL
    BASTION --> RESTRICTED
    SIEM --> MON

    FW1[방화벽 1] --> DMZ
    FW2[방화벽 2] --> INTERNAL
    FW3[방화벽 3] --> RESTRICTED
`

## 망분리 원칙

| 구간 | 허용 | 차단 |
|------|------|------|
| 인터넷 → DMZ | HTTP/HTTPS, VPN | 직접 내부 접근 |
| DMZ → 내부 | 앱 포트만 | SSH, RDP, DB포트 |
| 내부 → 제한망 | 앱 DB 연결 | 직접 접근 |
| 관리망 | Bastion 경유만 | 직접 접근 |

