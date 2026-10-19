const SPECIAL_CHARACTERS = /[\\`*_{}[\]()#+\-.!|<>]/g;

export const escapeMarkdown = (text: string): string => text.replace(SPECIAL_CHARACTERS, (character) => `\\${character}`);

export const table = (rows: readonly (readonly [string, string])[]): string =>
  ['| Campo | Valor |', '| --- | --- |', ...rows.map(([label, value]) => `| ${label} | ${value} |`)].join('\n');

export const bulletList = (items: readonly string[]): string => items.map((item) => `- ${item}`).join('\n');
