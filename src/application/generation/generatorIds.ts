export const GENERATOR_IDS = ['cpf', 'cnpj', 'alphanumericCnpj'] as const;

export type GeneratorId = (typeof GENERATOR_IDS)[number];

export const isGeneratorId = (value: unknown): value is GeneratorId => (GENERATOR_IDS as readonly unknown[]).includes(value);
