import { FEMALE_NAMES, MALE_NAMES, SURNAMES } from '../../domain/brazil/names';
import { stateByCode } from '../../domain/brazil/states';
import type { DocumentType } from '../../domain/documents/types';
import type { VoterTitle } from '../../domain/documents/VoterTitle';
import { pick, pickTwoDistinct } from '../../domain/shared/random';
import type { RandomSource } from '../../domain/shared/types';
import type { AddressGenerator } from './AddressGenerator';
import { landlineNumber, mobileNumber } from './contact';
import { isoDate, slug } from './text';
import type { Person, PersonOptions, Sex } from './types';

export interface PersonDocuments {
  readonly cpf: DocumentType;
  readonly rg: DocumentType;
  readonly cnh: DocumentType;
  readonly pis: DocumentType;
  readonly voterTitle: VoterTitle;
}

const MIN_AGE = 18;
const AGE_SPAN = 58;
const DAYS_IN_YEAR = 365;
const DAY_MS = 86_400_000;
const DRIVER_CHANCE = 10;
const DRIVERS = 7;
const EMAIL_DOMAIN = 'example.com';

const ageAt = (birth: Date, today: Date): number => {
  const years = today.getUTCFullYear() - birth.getUTCFullYear();
  const beforeBirthday = today.getUTCMonth() < birth.getUTCMonth() || (today.getUTCMonth() === birth.getUTCMonth() && today.getUTCDate() < birth.getUTCDate());
  return beforeBirthday ? years - 1 : years;
};

export class PersonGenerator {
  constructor(
    private readonly documents: PersonDocuments,
    private readonly addresses: AddressGenerator,
    private readonly random: RandomSource,
    private readonly today: () => Date,
  ) {}

  generate({ state, sex, formatted }: PersonOptions): Person {
    const chosenSex: Sex = sex ?? (this.random.nextInt(2) === 0 ? 'female' : 'male');
    const firstName = pick(chosenSex === 'female' ? FEMALE_NAMES : MALE_NAMES, this.random);
    const [middleName, lastName] = pickTwoDistinct(SURNAMES, this.random);
    const { address, city } = this.addresses.generate(state, formatted);
    const today = this.today();
    const birth = new Date(today.getTime() - ((MIN_AGE + this.random.nextInt(AGE_SPAN)) * DAYS_IN_YEAR + this.random.nextInt(DAYS_IN_YEAR)) * DAY_MS);
    const age = ageAt(birth, today);
    const document = (type: DocumentType, value: string) => (formatted ? type.format(value) : value);
    const { cpf, rg, cnh, pis, voterTitle } = this.documents;
    return {
      name: `${firstName} ${middleName} ${lastName}`,
      sex: chosenSex,
      birthDate: isoDate(birth),
      age,
      cpf: document(cpf, cpf.generate(this.random)),
      rg: document(rg, rg.generate(this.random)),
      cnh: this.random.nextInt(DRIVER_CHANCE) < DRIVERS ? document(cnh, cnh.generate(this.random)) : undefined,
      voterTitle: document(voterTitle, voterTitle.generateFor(stateByCode(city.state).electoralCode, this.random)),
      pis: document(pis, pis.generate(this.random)),
      email: `${slug(firstName)}.${slug(lastName)}${this.random.nextInt(90) + 10}@${EMAIL_DOMAIN}`,
      mobile: mobileNumber(city.areaCode, this.random, formatted),
      phone: landlineNumber(city.areaCode, this.random, formatted),
      address,
    };
  }
}
