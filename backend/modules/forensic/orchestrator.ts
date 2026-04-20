import { ForensicModule, ForensicResult } from './types';
import { ImageForensicModule } from './image.module';
import { DocumentForensicModule } from './document.module';
import { DeepfakeForensicModule } from './deepfake.module';
import { TextForensicModule } from './text.module';
import { AppError } from '../../utils/errors';
import { logger } from '../../utils/logger';
import db from '../../db';

export class ForensicOrchestrator {
  private modules: Record<string, ForensicModule> = {
    image: new ImageForensicModule(),
    photo: new ImageForensicModule(),
    document: new DocumentForensicModule(),
    deepfake: new DeepfakeForensicModule(),
    video: new DeepfakeForensicModule(),
    audio: new DeepfakeForensicModule(),
    text: new TextForensicModule(),
  };

  async process(
    type: string, 
    content: any, 
    caseId: number | null, 
    filename?: string,
    textContent?: string
  ): Promise<any> {
    const module = this.modules[type];
    
    if (!module) {
      throw new AppError(`Forensic module for type ${type} not implemented`, 400);
    }

    let lastError: any;
    const maxRetries = 2;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          logger.info({ type, attempt }, 'Retrying forensic analysis');
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }

        const result = await module.analyze(content);
        
        // Store to DB
        const stmt = db.prepare(`
          INSERT INTO evidence (case_id, type, modality, filename, text_content, authenticity_score, risk_level, result_json)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        const dbResult = stmt.run(
          caseId,
          type,
          type, // using type as modality for now
          filename || null,
          textContent || null,
          result.authenticity_score,
          result.risk_level,
          JSON.stringify(result)
        );

        // Map to frontend DetectionResult
        return {
          id: Number(dbResult.lastInsertRowid),
          type: type,
          generation_source: result.authenticity_score > 50 ? 'HUMAN' : 'AI',
          score: result.authenticity_score,
          justification: result.forensic_summary,
          confidence: result.risk_level === 'Low' ? 0.95 : result.risk_level === 'Medium' ? 0.75 : 0.45,
          breakdown: result.tampering_signs.map(sign => ({ label: sign, value: result.authenticity_score }))
        };
      } catch (error) {
        lastError = error;
        logger.warn({ err: error, type, attempt }, 'Analysis attempt failed');
        
        // If it's a validation error or 4xx, don't retry
        if (error instanceof AppError && error.statusCode < 500) {
          throw error;
        }
      }
    }

    logger.error({ err: lastError, type }, 'All analysis attempts failed');
    throw new AppError(`Forensic analysis failed after ${maxRetries + 1} attempts`, 502);
  }
}

export const orchestrator = new ForensicOrchestrator();
