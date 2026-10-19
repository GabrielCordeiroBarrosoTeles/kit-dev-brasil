import type { GeneratorId } from '../application/generation/generatorIds';

export interface GeneratorGroup {
  readonly label: string;
  readonly ids: readonly GeneratorId[];
}

export const GENERATOR_LABELS: Readonly<Record<GeneratorId, string>> = {
  cpf: 'CPF',
  rg: 'RG (SP)',
  cnh: 'CNH',
  voterTitle: 'Título de eleitor',
  pis: 'PIS/PASEP',
  cns: 'Cartão do SUS (CNS)',
  cnpj: 'CNPJ',
  alphanumericCnpj: 'CNPJ alfanumérico',
  licensePlate: 'Placa Mercosul',
  oldLicensePlate: 'Placa antiga',
  renavam: 'RENAVAM',
  cardVisa: 'Visa',
  cardMastercard: 'Mastercard',
  cardAmex: 'American Express',
  cardElo: 'Elo',
  cardHipercard: 'Hipercard',
};

export const GENERATOR_GROUPS: readonly GeneratorGroup[] = [
  { label: 'Pessoa', ids: ['cpf', 'rg', 'cnh', 'voterTitle', 'pis', 'cns'] },
  { label: 'Empresa', ids: ['cnpj', 'alphanumericCnpj'] },
  { label: 'Veículo', ids: ['licensePlate', 'oldLicensePlate', 'renavam'] },
  { label: 'Cartão de crédito', ids: ['cardVisa', 'cardMastercard', 'cardAmex', 'cardElo', 'cardHipercard'] },
];
