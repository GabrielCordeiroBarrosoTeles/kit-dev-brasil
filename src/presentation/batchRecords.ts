import type { DocumentCatalog } from '../application/catalog';
import type { BatchRecord, RecordFactory } from '../application/batch/types';
import { DocumentGenerator } from '../application/generation/DocumentGenerator';
import type { GeneratorId } from '../application/generation/generatorIds';
import { AddressGenerator } from '../application/people/AddressGenerator';
import { CompanyGenerator } from '../application/people/CompanyGenerator';
import { PersonGenerator } from '../application/people/PersonGenerator';
import { isProfileSource } from './batchColumns';
import { generateProfile } from './profiles';
import type { Profile } from './profiles';

export const toRecord = ({ fields, address }: Profile): BatchRecord => Object.fromEntries([...fields, ...address].map(({ key, value }) => [key, value]));

export const createRecordFactory =
  (catalog: DocumentCatalog): RecordFactory =>
  (source, random, today, options) => {
    if (isProfileSource(source)) {
      const addresses = new AddressGenerator(random);
      const clock = () => today;
      const generators = {
        person: new PersonGenerator(catalog.person, addresses, random, clock),
        company: new CompanyGenerator(catalog.company, addresses, random, clock),
      };
      return () => toRecord(generateProfile(generators, source, options));
    }
    const documents = new DocumentGenerator<GeneratorId>(catalog.generators, random);
    return () => ({ [source]: documents.generate(source, options.formatted) });
  };
