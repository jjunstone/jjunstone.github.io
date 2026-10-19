# CI/CD 배포 파이프라인

`mermaid
graph LR
    DEV[개발자 코드 커밋]

    subgraph CI[CI 단계]
        BUILD[자동 빌드]
        TEST[자동 테스트]
        SCAN[보안 스캔 SAST]
        IMAGE[컨테이너 이미지 빌드]
    end

    subgraph CD[CD 단계]
        STAGING[스테이징 배포]
        APPROVE[보안팀장 승인]
        PROD[프로덕션 배포 AKS]
        VERIFY[헬스체크 검증]
    end

    subgraph ROLLBACK[실패 시]
        ALERT[알림 발송]
        AUTO_ROLLBACK[자동 롤백]
    end

    DEV --> BUILD
    BUILD --> TEST
    TEST --> SCAN
    SCAN --> IMAGE
    IMAGE --> STAGING
    STAGING --> APPROVE
    APPROVE --> PROD
    PROD --> VERIFY
    VERIFY -- 실패 --> ALERT
    ALERT --> AUTO_ROLLBACK
`

## 단계별 담당

| 단계 | 담당 | 자동화 |
|------|------|--------|
| 빌드/테스트 | CI/CD 자동 | Azure DevOps |
| 보안 스캔 | 자동 + 보안팀장 검토 | SAST 도구 |
| 이미지 빌드 | DevOps사원 | Docker |
| 스테이징 배포 | DevOps사원 | Helm |
| 프로덕션 승인 | 인프라/DevOps과장 | 수동 승인 |
| 프로덕션 배포 | 자동 (승인 후) | AKS Rolling Update |
| 롤백 | 자동 | AKS Rollback |

