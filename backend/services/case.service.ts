import db from '../db';
import { AppError } from '../utils/errors';

export const caseService = {
  createCase: (title: string, investigatorId: number) => {
    const stmt = db.prepare('INSERT INTO cases (title, investigator_id) VALUES (?, ?)');
    const result = stmt.run(title, investigatorId);
    return result.lastInsertRowid;
  },

  getCase: (id: number) => {
    const caseData = db.prepare('SELECT * FROM cases WHERE id = ?').get(id);
    if (!caseData) throw new AppError('Case not found', 404);
    
    const evidence = db.prepare('SELECT * FROM evidence WHERE case_id = ?').all(id);
    return { ...caseData, evidence };
  },

  listCases: (investigatorId?: number) => {
    if (investigatorId) {
      return db.prepare('SELECT * FROM cases WHERE investigator_id = ? ORDER BY created_at DESC').all(investigatorId);
    }
    return db.prepare('SELECT * FROM cases ORDER BY created_at DESC').all();
  }
};
