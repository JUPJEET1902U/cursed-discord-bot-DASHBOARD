export interface PrefixExamples {
  ban: string;
  kick: string;
  warn: string;
  timeout: string;
  purge: string;
  help: string;
}

export interface PrefixData {
  prefix: string;
  defaultPrefix: string;
  legacyPrefix: string;
  maxLength: number;
  aliases: string[];
  examples: PrefixExamples;
}

export interface PrefixSavePayload {
  prefix: string;
}
