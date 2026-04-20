export interface ForensicResult {
  authenticity_score: number;
  risk_level: 'Low' | 'Medium' | 'High';
  tampering_signs: string[];
  forensic_summary: string;
}

export interface ForensicModule {
  analyze(content: any): Promise<ForensicResult>;
}
