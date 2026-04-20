import { ForensicModule, ForensicResult } from './types';
import { logger } from '../../utils/logger';
import { neuralEngine } from './neural-engine';
import { modelInferenceService } from '../../services/model-inference.service';

export class ImageForensicModule implements ForensicModule {
  async analyze(content: { buffer: Buffer, mimeType: string }): Promise<ForensicResult> {
    logger.info({ mimeType: content.mimeType }, 'Starting image forensic analysis');

    try {
      const remoteResult = await modelInferenceService.analyze('photo', content);
      if (remoteResult) {
        return remoteResult;
      }
      return neuralEngine.analyzeBinary('image', content);
    } catch (error) {
      logger.error({ err: error }, 'Local Neural Engine error in Image module');
      throw error;
    }
  }
}
