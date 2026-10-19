import type { Profile, ProfileField } from './profiles';

export type ExportFormat = 'json' | 'typescript' | 'text';

export const EXPORT_FORMATS: readonly ExportFormat[] = ['json', 'typescript', 'text'];

export const EXPORT_FORMAT_LABELS: Readonly<Record<ExportFormat, string>> = { json: 'JSON', typescript: 'Objeto TypeScript', text: 'Texto' };

const VARIABLE_NAMES: Readonly<Record<Profile['kind'], string>> = { person: 'pessoa', company: 'empresa' };

const ADDRESS_KEY = 'endereco';
const ADDRESS_TITLE = 'Endereço';

const toObject = (fields: readonly ProfileField[]): Record<string, string | number> => Object.fromEntries(fields.map(({ key, value }) => [key, value]));

const literal = (value: string | number): string => (typeof value === 'number' ? String(value) : `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`);

const properties = (fields: readonly ProfileField[], indent: string): string[] => fields.map(({ key, value }) => `${indent}${key}: ${literal(value)},`);

const lines = (fields: readonly ProfileField[]): string[] => fields.map(({ label, display }) => `${label}: ${display}`);

const EXPORTERS: Readonly<Record<ExportFormat, (profile: Profile) => string>> = {
  json: ({ fields, address }) => JSON.stringify({ ...toObject(fields), [ADDRESS_KEY]: toObject(address) }, null, 2),
  typescript: ({ kind, fields, address }) =>
    [`const ${VARIABLE_NAMES[kind]} = {`, ...properties(fields, '  '), `  ${ADDRESS_KEY}: {`, ...properties(address, '    '), '  },', '};'].join('\n'),
  text: ({ fields, address }) => [...lines(fields), '', ADDRESS_TITLE, ...lines(address)].join('\n'),
};

export const exportProfile = (profile: Profile, format: ExportFormat): string => EXPORTERS[format](profile);
