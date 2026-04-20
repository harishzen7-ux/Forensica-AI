import { ForensicModule, ForensicResult } from './types';
import { logger } from '../../utils/logger';
import { neuralEngine } from './neural-engine';
import { modelInferenceService } from '../../services/model-inference.service';

export class DocumentForensicModule implements ForensicModule {
  async analyze(content: { buffer: Buffer, mimeType: string }): Promise<ForensicResult> {
    logger.info({ mimeType: content.mimeType }, 'Starting document forensic analysis');

    try {
      const remoteResult = await modelInferenceService.analyze('document', content);
      if (remoteResult) {
        return remoteResult;
      }
      return neuralEngine.analyzeBinary('document', content);
    } catch (error) {
      logger.error({ err: error }, 'Local Neural Engine error in Document module');
      throw error;
    }
  }
}
