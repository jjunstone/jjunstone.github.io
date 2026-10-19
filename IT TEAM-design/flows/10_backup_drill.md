Backup Recovery Drill Flow

Trigger: Monthly schedule (1st Tuesday of month)

Steps:
1. Infra Staff selects random database to restore
2. Infra Staff restores to test environment
3. DBA Lead verifies data integrity
4. DBA Lead confirms RTO/RPO compliance
5. Document recovery time and issues
6. Test cleanup and disposal

Approvals:
- DBA Lead (data integrity confirmation)

Audit Log:
- Drill date
- Database selected
- Recovery time (RTO)
- Data age (RPO)
- Issues encountered
- Pass/fail status

Automation Opportunities:
- Auto-select database
- Auto-restore to test env
- Auto-generate report

