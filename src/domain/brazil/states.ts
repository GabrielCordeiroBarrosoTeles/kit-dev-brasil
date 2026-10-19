import type { NonEmpty } from '../shared/random';
import type { PostalRange, State, StateCode } from './types';

const range = (from: number, to: number): PostalRange => ({ from: from * 1000, to: to * 1000 + 999 });

export const STATES: NonEmpty<State> = [
  { code: 'AC', name: 'Acre', electoralCode: 24, areaCodes: ['68'], postalRanges: [range(69900, 69999)] },
  { code: 'AL', name: 'Alagoas', electoralCode: 17, areaCodes: ['82'], postalRanges: [range(57000, 57999)] },
  { code: 'AM', name: 'Amazonas', electoralCode: 22, areaCodes: ['92', '97'], postalRanges: [range(69000, 69299), range(69400, 69899)] },
  { code: 'AP', name: 'Amapá', electoralCode: 25, areaCodes: ['96'], postalRanges: [range(68900, 68999)] },
  { code: 'BA', name: 'Bahia', electoralCode: 5, areaCodes: ['71', '73', '74', '75', '77'], postalRanges: [range(40000, 48999)] },
  { code: 'CE', name: 'Ceará', electoralCode: 7, areaCodes: ['85', '88'], postalRanges: [range(60000, 63999)] },
  { code: 'DF', name: 'Distrito Federal', electoralCode: 20, areaCodes: ['61'], postalRanges: [range(70000, 72799), range(73000, 73699)] },
  { code: 'ES', name: 'Espírito Santo', electoralCode: 14, areaCodes: ['27', '28'], postalRanges: [range(29000, 29999)] },
  { code: 'GO', name: 'Goiás', electoralCode: 10, areaCodes: ['62', '64'], postalRanges: [range(72800, 72999), range(73700, 76799)] },
  { code: 'MA', name: 'Maranhão', electoralCode: 11, areaCodes: ['98', '99'], postalRanges: [range(65000, 65999)] },
  { code: 'MG', name: 'Minas Gerais', electoralCode: 2, areaCodes: ['31', '32', '33', '34', '35', '37', '38'], postalRanges: [range(30000, 39999)] },
  { code: 'MS', name: 'Mato Grosso do Sul', electoralCode: 19, areaCodes: ['67'], postalRanges: [range(79000, 79999)] },
  { code: 'MT', name: 'Mato Grosso', electoralCode: 18, areaCodes: ['65', '66'], postalRanges: [range(78000, 78899)] },
  { code: 'PA', name: 'Pará', electoralCode: 13, areaCodes: ['91', '93', '94'], postalRanges: [range(66000, 68899)] },
  { code: 'PB', name: 'Paraíba', electoralCode: 12, areaCodes: ['83'], postalRanges: [range(58000, 58999)] },
  { code: 'PE', name: 'Pernambuco', electoralCode: 8, areaCodes: ['81', '87'], postalRanges: [range(50000, 56999)] },
  { code: 'PI', name: 'Piauí', electoralCode: 15, areaCodes: ['86', '89'], postalRanges: [range(64000, 64999)] },
  { code: 'PR', name: 'Paraná', electoralCode: 6, areaCodes: ['41', '42', '43', '44', '45', '46'], postalRanges: [range(80000, 87999)] },
  { code: 'RJ', name: 'Rio de Janeiro', electoralCode: 3, areaCodes: ['21', '22', '24'], postalRanges: [range(20000, 28999)] },
  { code: 'RN', name: 'Rio Grande do Norte', electoralCode: 16, areaCodes: ['84'], postalRanges: [range(59000, 59999)] },
  { code: 'RO', name: 'Rondônia', electoralCode: 23, areaCodes: ['69'], postalRanges: [range(76800, 76999)] },
  { code: 'RR', name: 'Roraima', electoralCode: 26, areaCodes: ['95'], postalRanges: [range(69300, 69399)] },
  { code: 'RS', name: 'Rio Grande do Sul', electoralCode: 4, areaCodes: ['51', '53', '54', '55'], postalRanges: [range(90000, 99999)] },
  { code: 'SC', name: 'Santa Catarina', electoralCode: 9, areaCodes: ['47', '48', '49'], postalRanges: [range(88000, 89999)] },
  { code: 'SE', name: 'Sergipe', electoralCode: 21, areaCodes: ['79'], postalRanges: [range(49000, 49999)] },
  { code: 'SP', name: 'São Paulo', electoralCode: 1, areaCodes: ['11', '12', '13', '14', '15', '16', '17', '18', '19'], postalRanges: [range(1000, 19999)] },
  { code: 'TO', name: 'Tocantins', electoralCode: 27, areaCodes: ['63'], postalRanges: [range(77000, 77999)] },
];

const BY_CODE = new Map(STATES.map((state) => [state.code, state]));

export const isStateCode = (value: unknown): value is StateCode => typeof value === 'string' && BY_CODE.has(value as StateCode);

export const stateByCode = (code: StateCode): State => BY_CODE.get(code) as State;

export const inRange = (postalCode: number, { from, to }: PostalRange): boolean => postalCode >= from && postalCode <= to;

export const stateByPostalCode = (postalCode: number): State | undefined => STATES.find((state) => state.postalRanges.some((candidate) => inRange(postalCode, candidate)));
