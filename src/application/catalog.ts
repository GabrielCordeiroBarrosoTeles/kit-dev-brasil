import { Cep } from '../domain/documents/Cep';
import { Cnh } from '../domain/documents/Cnh';
import { Cnpj } from '../domain/documents/Cnpj';
import { Cns } from '../domain/documents/Cns';
import { Cpf } from '../domain/documents/Cpf';
import { CreditCard } from '../domain/documents/CreditCard';
import { LicensePlate } from '../domain/documents/LicensePlate';
import { Pis } from '../domain/documents/Pis';
import { Renavam } from '../domain/documents/Renavam';
import { Rg } from '../domain/documents/Rg';
import type { DocumentType } from '../domain/documents/types';
import { VoterTitle } from '../domain/documents/VoterTitle';
import { GENERATOR_LABELS } from '../shared/generatorCatalog';
import type { GeneratorSpec } from './generation/DocumentGenerator';
import type { GeneratorId } from './generation/generatorIds';
import type { PersonDocuments } from './people/PersonGenerator';

export interface DocumentCatalog {
  readonly types: readonly DocumentType[];
  readonly generators: Readonly<Record<GeneratorId, GeneratorSpec>>;
  readonly person: PersonDocuments;
  readonly company: DocumentType;
}

export const createDocumentCatalog = (): DocumentCatalog => {
  const cpf = new Cpf();
  const cnpj = new Cnpj();
  const cnh = new Cnh();
  const pis = new Pis();
  const voterTitle = new VoterTitle();
  const renavam = new Renavam();
  const rg = new Rg();
  const cns = new Cns();
  const plate = new LicensePlate();
  const card = new CreditCard();
  const cep = new Cep();
  const spec = (id: GeneratorId, type: DocumentType, generate: GeneratorSpec['generate'] = (random) => type.generate(random)): GeneratorSpec => ({
    label: GENERATOR_LABELS[id],
    type,
    generate,
  });
  return {
    person: { cpf, rg, cnh, pis, voterTitle },
    company: cnpj,
    types: [cpf, cnpj, cnh, pis, voterTitle, renavam, rg, cns, plate, card, cep],
    generators: {
      cpf: spec('cpf', cpf),
      rg: spec('rg', rg),
      cnh: spec('cnh', cnh),
      voterTitle: spec('voterTitle', voterTitle),
      pis: spec('pis', pis),
      cns: spec('cns', cns),
      cnpj: spec('cnpj', cnpj),
      alphanumericCnpj: spec('alphanumericCnpj', cnpj, (random) => cnpj.generateAlphanumeric(random)),
      licensePlate: spec('licensePlate', plate),
      oldLicensePlate: spec('oldLicensePlate', plate, (random) => plate.generateOld(random)),
      renavam: spec('renavam', renavam),
      cardVisa: spec('cardVisa', card, (random) => card.generateFor('visa', random)),
      cardMastercard: spec('cardMastercard', card, (random) => card.generateFor('mastercard', random)),
      cardAmex: spec('cardAmex', card, (random) => card.generateFor('amex', random)),
      cardElo: spec('cardElo', card, (random) => card.generateFor('elo', random)),
      cardHipercard: spec('cardHipercard', card, (random) => card.generateFor('hipercard', random)),
      cep: spec('cep', cep),
    },
  };
};
