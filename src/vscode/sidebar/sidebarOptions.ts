import { STATES } from '../../domain/brazil/states';
import { SOURCE_LABELS } from '../../presentation/batchColumns';
import { BATCH_FORMAT_LABELS, BATCH_FORMATS } from '../../presentation/batchExporters';
import { PROFILE_LABELS } from '../../presentation/profiles';
import { GENERATOR_GROUPS, GENERATOR_LABELS } from '../../shared/generatorCatalog';

const option = (value: string, label: string): string => `<option value="${value}">${label}</option>`;

const optionGroup = (label: string, options: string): string => `<optgroup label="${label}">${options}</optgroup>`;

export const KIND_OPTIONS = Object.entries(PROFILE_LABELS)
  .map(([value, label]) => option(value, label))
  .join('');

export const STATE_OPTIONS = [option('', 'UF aleatória'), ...STATES.map((state) => option(state.code, `${state.code} · ${state.name}`))].join('');

export const BATCH_SOURCE_OPTIONS = [
  optionGroup('Pessoas e empresas', option('person', SOURCE_LABELS.person) + option('company', SOURCE_LABELS.company)),
  ...GENERATOR_GROUPS.map((group) => optionGroup(group.label, group.ids.map((id) => option(id, GENERATOR_LABELS[id])).join(''))),
].join('');

export const BATCH_FORMAT_OPTIONS = BATCH_FORMATS.map((format) => option(format, BATCH_FORMAT_LABELS[format])).join('');
