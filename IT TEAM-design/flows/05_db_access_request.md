Database Access Request Flow

Trigger: Employee needs database access for job

Steps:
1. Employee/Manager submits access request (database, schema, tables, permission level)
2. DBA Lead reviews application requirements
3. Security Lead reviews data sensitivity
4. Department Manager approves
5. DBA Lead implements grant statements
6. Requestor confirms access working
7. Quarterly review of access rights

Approvals:
- DBA Lead (technical)
- Security Lead (sensitivity review)
- Department Manager

Verifications:
- Access confirmed with test query
- No excessive permissions granted

Audit Log:
- Request date, requester, database
- Permission level
- Approval chain
- Grant timestamp
- Quarterly review dates

Automation Opportunities:
- Template-based access profiles
- Auto-revoke on department transfer
- Auto-alert on unused access (quarterly)

