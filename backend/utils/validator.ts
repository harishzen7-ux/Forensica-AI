import { z } from 'zod';
import { ForensicResult } from '../modules/forensic/types';
import { AppError } from './errors';
import { logger } from './logger';

const forensicResultSchema = z.object({
  authenticity_score: z.number().min(0).max(100),
  risk_level: z.enum(['Low', 'Medium', 'High']),
  tampering_signs: z.array(z.string()),
  forensic_summary: z.string(),
});

export const validateForensicResult = (data: any): ForensicResult => {
  let parsedData: any;
  
  try {
    if (!data) {
      throw new Error('Empty response from AI model');
    }

    // Sometimes LLMs wrap JSON in markdown blocks
    if (typeof data === 'string') {
      const jsonMatch = data.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedData = JSON.parse(jsonMatch[0]);
      } else {
        logger.error({ rawData: data }, 'No JSON found in AI response string');
        throw new Error('No JSON found in response');
      }
    } else {
      parsedData = data;
    }
    
    return forensicResultSchema.parse(parsedData);
  } catch (error) {
    logger.error({ err: error, rawData: data, parsedData }, 'Forensic result validation failed');
    throw new AppError('The AI model returned an invalid response format. Please try again.', 502);
  }
};
