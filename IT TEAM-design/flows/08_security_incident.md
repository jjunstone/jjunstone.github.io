Security Incident Response Flow

Trigger: Security event detected (breach, unauthorized access, malware)

Steps:
1. Security Lead detects incident via monitoring
2. Security Lead initiates incident response
3. Isolate affected systems (Security Lead)
4. Preserve evidence (Security Lead)
5. Notify management (DBA Lead)
6. Conduct investigation (Security Lead + vendor if needed)
7. Determine root cause (Security Lead)
8. Implement remediation (relevant tech team)
9. Restore services (relevant tech team)
10. Post-incident review (all leads)
11. Document lessons learned

Approvals:
- DBA Lead (escalation decision)
- CTO/Management (external notification decision)

Audit Log:
- Detection timestamp
- Incident classification
- Systems affected
- Investigation steps
- Remediation actions
- Restoration time
- Root cause analysis

Automation Opportunities:
- Auto-isolate on detection
- Auto-alert on incident
- Auto-preserve logs

