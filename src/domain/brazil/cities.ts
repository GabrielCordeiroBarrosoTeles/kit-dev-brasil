import type { NonEmpty } from '../shared/random';
import { inRange } from './states';
import type { City, PostalRange, StateCode } from './types';

const range = (from: number, to: number): PostalRange => ({ from: from * 1000, to: to * 1000 + 999 });

const city = (name: string, state: StateCode, areaCode: string, from: number, to: number): City => ({ name, state, areaCode, postalRange: range(from, to) });

export const CITIES_BY_STATE: Readonly<Record<StateCode, NonEmpty<City>>> = {
  AC: [city('Rio Branco', 'AC', '68', 69900, 69923)],
  AL: [city('Maceió', 'AL', '82', 57000, 57099)],
  AM: [city('Manaus', 'AM', '92', 69000, 69099)],
  AP: [city('Macapá', 'AP', '96', 68900, 68911)],
  BA: [city('Salvador', 'BA', '71', 40000, 42499), city('Feira de Santana', 'BA', '75', 44000, 44104)],
  CE: [city('Fortaleza', 'CE', '85', 60000, 61599), city('Juazeiro do Norte', 'CE', '88', 63000, 63099)],
  DF: [city('Brasília', 'DF', '61', 70000, 72799)],
  ES: [city('Vitória', 'ES', '27', 29000, 29099), city('Vila Velha', 'ES', '27', 29100, 29129)],
  GO: [city('Goiânia', 'GO', '62', 74000, 74899), city('Anápolis', 'GO', '62', 75000, 75159)],
  MA: [city('São Luís', 'MA', '98', 65000, 65109)],
  MG: [city('Belo Horizonte', 'MG', '31', 30000, 31999), city('Juiz de Fora', 'MG', '32', 36000, 36099), city('Uberlândia', 'MG', '34', 38400, 38415)],
  MS: [city('Campo Grande', 'MS', '67', 79000, 79124)],
  MT: [city('Cuiabá', 'MT', '65', 78000, 78109)],
  PA: [city('Belém', 'PA', '91', 66000, 66999), city('Santarém', 'PA', '93', 68005, 68109)],
  PB: [city('João Pessoa', 'PB', '83', 58000, 58099), city('Campina Grande', 'PB', '83', 58400, 58449)],
  PE: [city('Recife', 'PE', '81', 50000, 52999), city('Caruaru', 'PE', '81', 55000, 55099)],
  PI: [city('Teresina', 'PI', '86', 64000, 64099)],
  PR: [city('Curitiba', 'PR', '41', 80000, 82999), city('Londrina', 'PR', '43', 86000, 86099), city('Maringá', 'PR', '44', 87000, 87099)],
  RJ: [city('Rio de Janeiro', 'RJ', '21', 20000, 23799), city('Niterói', 'RJ', '21', 24000, 24399), city('Petrópolis', 'RJ', '24', 25600, 25779)],
  RN: [city('Natal', 'RN', '84', 59000, 59139)],
  RO: [city('Porto Velho', 'RO', '69', 76800, 76834)],
  RR: [city('Boa Vista', 'RR', '95', 69300, 69339)],
  RS: [city('Porto Alegre', 'RS', '51', 90000, 91999), city('Caxias do Sul', 'RS', '54', 95000, 95124), city('Pelotas', 'RS', '53', 96000, 96099)],
  SC: [city('Florianópolis', 'SC', '48', 88000, 88099), city('Joinville', 'SC', '47', 89200, 89239), city('Blumenau', 'SC', '47', 89000, 89099)],
  SE: [city('Aracaju', 'SE', '79', 49000, 49099)],
  SP: [city('São Paulo', 'SP', '11', 1000, 5999), city('Campinas', 'SP', '19', 13000, 13139), city('Santos', 'SP', '13', 11000, 11099), city('Ribeirão Preto', 'SP', '16', 14000, 14114)],
  TO: [city('Palmas', 'TO', '63', 77000, 77270)],
};

export const CITIES: readonly City[] = Object.values(CITIES_BY_STATE).flat();

export const cityByPostalCode = (postalCode: number): City | undefined => CITIES.find((candidate) => inRange(postalCode, candidate.postalRange));
