import { ForensicModule, ForensicResult } from './types';
import { logger } from '../../utils/logger';
import { neuralEngine } from './neural-engine';
import { modelInferenceService } from '../../services/model-inference.service';

export class DeepfakeForensicModule implements ForensicModule {
  async analyze(content: { buffer: Buffer, mimeType: string }): Promise<ForensicResult> {
    logger.info({ mimeType: content.mimeType }, 'Starting deepfake forensic analysis');

    try {
      const modality = content.mimeType.startsWith('audio/') ? 'audio' : 'video';
      const remoteResult = await modelInferenceService.analyze(modality, content);
      if (remoteResult) {
        return remoteResult;
      }
      return neuralEngine.analyzeBinary(modality, content);
    } catch (error) {
      logger.error({ err: error }, 'Local Neural Engine error in Deepfake module');
      throw error;
    }
  }
}
