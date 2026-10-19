import { COMPANY_ACTIVITIES, COMPANY_SUFFIXES, SURNAMES } from '../../domain/brazil/names';
import type { DocumentType } from '../../domain/documents/types';
import { pick, pickTwoDistinct } from '../../domain/shared/random';
import type { RandomSource } from '../../domain/shared/types';
import type { AddressGenerator } from './AddressGenerator';
import { landlineNumber } from './contact';
import { isoDate, slug } from './text';
import type { Company, GenerationOptions } from './types';

const MIN_YEARS = 1;
const YEAR_SPAN = 30;
const DAYS_IN_YEAR = 365;
const DAY_MS = 86_400_000;
const DOMAIN = 'example.com';

export class CompanyGenerator {
  constructor(
    private readonly cnpj: DocumentType,
    private readonly addresses: AddressGenerator,
    private readonly random: RandomSource,
    private readonly today: () => Date,
  ) {}

  generate({ state, formatted }: GenerationOptions): Company {
    const [founder, partner] = pickTwoDistinct(SURNAMES, this.random);
    const activity = pick(COMPANY_ACTIVITIES, this.random);
    const tradeName = `${founder} ${activity}`;
    const host = `${slug(tradeName)}.${DOMAIN}`;
    const { address, city } = this.addresses.generate(state, formatted);
    const daysAgo = (MIN_YEARS + this.random.nextInt(YEAR_SPAN)) * DAYS_IN_YEAR + this.random.nextInt(DAYS_IN_YEAR);
    const cnpj = this.cnpj.generate(this.random);
    return {
      legalName: `${founder} & ${partner} ${activity} ${pick(COMPANY_SUFFIXES, this.random)}`,
      tradeName,
      cnpj: formatted ? this.cnpj.format(cnpj) : cnpj,
      openingDate: isoDate(new Date(this.today().getTime() - daysAgo * DAY_MS)),
      email: `contato@${host}`,
      phone: landlineNumber(city.areaCode, this.random, formatted),
      website: `https://www.${host}`,
      address,
    };
  }
}
