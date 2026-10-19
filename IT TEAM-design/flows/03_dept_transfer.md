Department Transfer Flow

Trigger: HR notification of employee department change

Steps:
1. HR notifies IT of transfer
2. Security Lead reviews new role requirements
3. Security Lead updates group memberships
4. DB Lead updates database role assignments
5. Network Manager updates network group access
6. Server Manager updates server group access
7. Security Lead confirms access changes
8. Security Lead revokes previous department access
9. Audit log entry created

Approvals:
- HR approval
- Previous and new department approvals
- Security Lead confirmation

Audit Log:
- Old groups removed
- New groups added
- Timestamp
- Change requestor

Failure Handling:
- Conflicting access requests: escalate to management
- System sync failure: manual correction + ticket

