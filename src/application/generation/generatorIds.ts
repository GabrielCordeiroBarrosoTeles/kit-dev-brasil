export const GENERATOR_IDS = [
  'cpf',
  'rg',
  'cnh',
  'voterTitle',
  'pis',
  'cns',
  'cnpj',
  'alphanumericCnpj',
  'licensePlate',
  'oldLicensePlate',
  'renavam',
  'cardVisa',
  'cardMastercard',
  'cardAmex',
  'cardElo',
  'cardHipercard',
  'cep',
] as const;

export type GeneratorId = (typeof GENERATOR_IDS)[number];

export const isGeneratorId = (value: unknown): value is GeneratorId => (GENERATOR_IDS as readonly unknown[]).includes(value);
