import type { BatchSource, ProfileSource } from '../application/batch/types';
import { GENERATOR_LABELS } from '../shared/generatorCatalog';

export interface ColumnDefinition {
  readonly key: string;
  readonly label: string;
}

const ADDRESS_COLUMNS: readonly ColumnDefinition[] = [
  { key: 'logradouro', label: 'Logradouro' },
  { key: 'numero', label: 'Número' },
  { key: 'complemento', label: 'Complemento' },
  { key: 'bairro', label: 'Bairro' },
  { key: 'cidade', label: 'Cidade' },
  { key: 'uf', label: 'UF' },
  { key: 'cep', label: 'CEP' },
];

export const PROFILE_COLUMNS: Readonly<Record<ProfileSource, readonly ColumnDefinition[]>> = {
  person: [
    { key: 'nome', label: 'Nome' },
    { key: 'sexo', label: 'Sexo' },
    { key: 'dataNascimento', label: 'Nascimento' },
    { key: 'idade', label: 'Idade' },
    { key: 'cpf', label: 'CPF' },
    { key: 'rg', label: 'RG' },
    { key: 'cnh', label: 'CNH' },
    { key: 'tituloEleitor', label: 'Título de eleitor' },
    { key: 'pis', label: 'PIS' },
    { key: 'email', label: 'E-mail' },
    { key: 'celular', label: 'Celular' },
    { key: 'telefone', label: 'Telefone' },
    ...ADDRESS_COLUMNS,
  ],
  company: [
    { key: 'razaoSocial', label: 'Razão social' },
    { key: 'nomeFantasia', label: 'Nome fantasia' },
    { key: 'cnpj', label: 'CNPJ' },
    { key: 'dataAbertura', label: 'Abertura' },
    { key: 'email', label: 'E-mail' },
    { key: 'telefone', label: 'Telefone' },
    { key: 'site', label: 'Site' },
    ...ADDRESS_COLUMNS,
  ],
};

export const SOURCE_LABELS: Readonly<Record<ProfileSource, string>> = { person: 'Pessoas', company: 'Empresas' };

export const DEFAULT_NAMES: Readonly<Record<ProfileSource, string>> = { person: 'pessoas', company: 'empresas' };

export const isProfileSource = (source: BatchSource): source is ProfileSource => source === 'person' || source === 'company';

export const batchColumns = (source: BatchSource): readonly ColumnDefinition[] =>
  isProfileSource(source) ? PROFILE_COLUMNS[source] : [{ key: source, label: GENERATOR_LABELS[source] }];

export const defaultBatchName = (source: BatchSource): string => (isProfileSource(source) ? DEFAULT_NAMES[source] : source);
