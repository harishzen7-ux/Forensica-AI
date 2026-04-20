import db from '../db';

export const auditService = {
  log: (userId: number | undefined, action: string, ipAddress: string | undefined) => {
    const stmt = db.prepare('INSERT INTO audit_logs (user_id, action, ip_address) VALUES (?, ?, ?)');
    stmt.run(userId || null, action, ipAddress || null);
  }
};
