import type { Address, Company, GenerationOptions, Person, PersonOptions } from '../application/people/types';

export type ProfileKind = 'person' | 'company';

export interface ProfileField {
  readonly key: string;
  readonly label: string;
  readonly value: string | number;
  readonly display: string;
}

export interface Profile {
  readonly kind: ProfileKind;
  readonly fields: readonly ProfileField[];
  readonly address: readonly ProfileField[];
}

export interface ProfileGenerators {
  readonly person: { generate(options: PersonOptions): Person };
  readonly company: { generate(options: GenerationOptions): Company };
}

export const PROFILE_LABELS: Readonly<Record<ProfileKind, string>> = { person: 'Pessoa', company: 'Empresa' };

const SEX_LABELS: Readonly<Record<Person['sex'], string>> = { female: 'Feminino', male: 'Masculino' };

const field = (key: string, label: string, value: string | number, display = String(value)): ProfileField => ({ key, label, value, display });

const optional = (key: string, label: string, value: string | undefined): ProfileField[] => (value === undefined ? [] : [field(key, label, value)]);

const brazilianDate = (iso: string): string => iso.split('-').reverse().join('/');

const addressFields = (address: Address): ProfileField[] => [
  field('logradouro', 'Logradouro', address.street),
  field('numero', 'Número', address.number),
  ...optional('complemento', 'Complemento', address.complement),
  field('bairro', 'Bairro', address.neighborhood),
  field('cidade', 'Cidade', address.city),
  field('uf', 'UF', address.state),
  field('cep', 'CEP', address.postalCode),
];

export const personProfile = (person: Person): Profile => ({
  kind: 'person',
  fields: [
    field('nome', 'Nome', person.name),
    field('sexo', 'Sexo', SEX_LABELS[person.sex]),
    field('dataNascimento', 'Nascimento', person.birthDate, brazilianDate(person.birthDate)),
    field('idade', 'Idade', person.age, `${person.age} anos`),
    field('cpf', 'CPF', person.cpf),
    field('rg', 'RG', person.rg),
    ...optional('cnh', 'CNH', person.cnh),
    field('tituloEleitor', 'Título de eleitor', person.voterTitle),
    field('pis', 'PIS', person.pis),
    field('email', 'E-mail', person.email),
    field('celular', 'Celular', person.mobile),
    field('telefone', 'Telefone', person.phone),
  ],
  address: addressFields(person.address),
});

export const companyProfile = (company: Company): Profile => ({
  kind: 'company',
  fields: [
    field('razaoSocial', 'Razão social', company.legalName),
    field('nomeFantasia', 'Nome fantasia', company.tradeName),
    field('cnpj', 'CNPJ', company.cnpj),
    field('dataAbertura', 'Abertura', company.openingDate, brazilianDate(company.openingDate)),
    field('email', 'E-mail', company.email),
    field('telefone', 'Telefone', company.phone),
    field('site', 'Site', company.website),
  ],
  address: addressFields(company.address),
});

export const generateProfile = (generators: ProfileGenerators, kind: ProfileKind, options: GenerationOptions): Profile =>
  kind === 'person' ? personProfile(generators.person.generate({ ...options, sex: undefined })) : companyProfile(generators.company.generate(options));
