import { createDocumentCatalog } from '../../src/application/catalog';
import { AddressGenerator } from '../../src/application/people/AddressGenerator';
import { CompanyGenerator } from '../../src/application/people/CompanyGenerator';
import { PersonGenerator } from '../../src/application/people/PersonGenerator';
import type { RandomSource } from '../../src/domain/shared/types';
import type { ProfileGenerators } from '../../src/presentation/profiles';
import { lcgRandom } from './random';
import { TODAY } from './samples';

export const peopleGenerators = (random: RandomSource = lcgRandom(11)) => {
  const catalog = createDocumentCatalog();
  const addresses = new AddressGenerator(random);
  const today = () => TODAY;
  return {
    catalog,
    person: new PersonGenerator(catalog.person, addresses, random, today),
    company: new CompanyGenerator(catalog.company, addresses, random, today),
  };
};

export const fakeProfiles = (random?: RandomSource): ProfileGenerators => {
  const { person, company } = peopleGenerators(random);
  return { person, company };
};
