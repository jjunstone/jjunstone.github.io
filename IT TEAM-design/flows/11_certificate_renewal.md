Certificate Renewal Flow

Trigger: Monthly review (60 days before expiration)

Steps:
1. Security Lead reviews certificate inventory
2. For expiring certificates: submit renewal request
3. CA processes and issues new certificate
4. Security Lead validates certificate chain
5. Infra Staff deploys new certificate
6. Infra Staff verifies service using new cert
7. Old certificate retired
8. Update certificate inventory

Approvals:
- Security Lead (cert validity)
- Server Manager (deployment)

Audit Log:
- Old cert expiration date
- New cert issue date
- Deployment timestamp
- Services updated

