import { ForensicModule, ForensicResult } from './types';
import { logger } from '../../utils/logger';
import { neuralEngine } from './neural-engine';
import { modelInferenceService } from '../../services/model-inference.service';

export class TextForensicModule implements ForensicModule {
  async analyze(content: { text: string }): Promise<ForensicResult> {
    logger.info('Starting text forensic analysis');

    try {
      const remoteResult = await modelInferenceService.analyze('text', content);
      if (remoteResult) {
        return remoteResult;
      }
      return neuralEngine.analyzeText(content);
    } catch (error) {
      logger.error({ err: error }, 'Local Neural Engine error in Text module');
      throw error;
    }
  }
}
