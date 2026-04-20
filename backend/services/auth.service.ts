import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../db';
import { env } from '../config/env';
import { AppError } from '../utils/errors';

export const authService = {
  register: async (name: string, email: string, password: string, role: string) => {
    const passwordHash = await bcrypt.hash(password, 12);
    
    try {
      const stmt = db.prepare('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)');
      const result = stmt.run(name, email, passwordHash, role);
      return result.lastInsertRowid;
    } catch (error: any) {
      if (error.message.includes('UNIQUE constraint failed')) {
        throw new AppError('Email already exists', 400);
      }
      throw error;
    }
  },

  login: async (email: string, password: string) => {
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
    
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      throw new AppError('Invalid email or password', 401);
    }

    const token = jwt.sign({ id: user.id }, env.JWT_SECRET, { expiresIn: '1d' });
    
    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    };
  }
};
