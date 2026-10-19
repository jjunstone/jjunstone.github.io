Firewall Exception Request Flow

Trigger: Business unit requests exception to firewall rules

Steps:
1. Requestor submits exception request (source, dest, port, duration, reason)
2. Network Manager reviews technical feasibility
3. Security Lead reviews security risk
4. DBA Lead approves (final authority)
5. Network Manager implements rule with automatic expiration
6. Requestor confirms rule working
7. Exception logged with sunset date
8. Weekly review of active exceptions

Approvals:
- Network Manager (technical)
- Security Lead (security risk)
- DBA Lead (final)

Verifications:
- Rule traffic confirmed
- No unintended traffic leakage

Audit Log:
- Request date, requester, justification
- Approval chain
- Implementation timestamp
- Sunset date
- Removal confirmation

Automation Opportunities:
- Auto-expire rules on sunset date
- Auto-alert before expiration
- Auto-generate monthly exception report

Failure Handling:
- Traffic not working: troubleshoot with requestor
- Security concern raised: escalate to Security Lead

