import { env } from '../config/env';
import { logger } from '../utils/logger';
import { ForensicResult } from '../modules/forensic/types';

type BinaryPayload = {
  buffer: Buffer;
  mimeType: string;
};

type TextPayload = {
  text: string;
};

type AnalyzePayload = BinaryPayload | TextPayload;

type RemoteAnalyzeRequest =
  | {
      modality: string;
      text: string;
    }
  | {
      modality: string;
      mimeType: string;
      contentBase64: string;
    };

export class ModelInferenceService {
  private readonly baseUrl = env.MODEL_SERVICE_URL;
  private readonly timeoutMs = env.MODEL_SERVICE_TIMEOUT_MS;

  isEnabled() {
    return Boolean(this.baseUrl);
  }

  async analyze(modality: string, payload: AnalyzePayload): Promise<ForensicResult | null> {
    if (!this.baseUrl) {
      return null;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    const requestBody: RemoteAnalyzeRequest =
      'text' in payload
        ? {
            modality,
            text: payload.text,
          }
        : {
            modality,
            mimeType: payload.mimeType,
            contentBase64: payload.buffer.toString('base64'),
          };

    try {
      const response = await fetch(`${this.baseUrl}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      if (!response.ok) {
        const message = await response.text().catch(() => '');
        logger.warn({ modality, status: response.status, message }, 'Model service returned a non-OK response');
        return null;
      }

      const result = (await response.json()) as ForensicResult;
      return result;
    } catch (error) {
      logger.warn({ err: error, modality, baseUrl: this.baseUrl }, 'Local model service unavailable, falling back');
      return null;
    } finally {
      clearTimeout(timeout);
    }
  }
}

export const modelInferenceService = new ModelInferenceService();
