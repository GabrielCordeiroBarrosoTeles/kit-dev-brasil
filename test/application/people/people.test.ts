import { describe, expect, it } from 'vitest';
import { cityByPostalCode } from '../../../src/domain/brazil/cities';
import { stateByCode } from '../../../src/domain/brazil/states';
import { STATES } from '../../../src/domain/brazil/states';
import { slug } from '../../../src/application/people/text';
import { landlineNumber, mobileNumber } from '../../../src/application/people/contact';
import { peopleGenerators } from '../../fakes/profiles';
import { sequenceRandom } from '../../fakes/random';
import { TODAY } from '../../fakes/samples';

const RESERVED_EMAIL = /^[a-z0-9.]+@([a-z0-9]+\.)?example\.com$/;

const yearsBetween = (birth: string): number => {
  const [year, month, day] = birth.split('-').map(Number) as [number, number, number];
  const passed = TODAY.getUTCMonth() + 1 > month || (TODAY.getUTCMonth() + 1 === month && TODAY.getUTCDate() >= day);
  return TODAY.getUTCFullYear() - year - (passed ? 0 : 1);
};

describe('PersonGenerator', () => {
  it('keeps 10 thousand people valid and coherent', () => {
    const { catalog, person } = peopleGenerators();
    const { cpf, rg, cnh, pis, voterTitle } = catalog.person;
    for (let index = 0; index < 10_000; index += 1) {
      const generated = person.generate({ state: undefined, sex: undefined, formatted: index % 2 === 0 });
      const state = stateByCode(generated.address.state);
      const city = cityByPostalCode(Number(generated.address.postalCode.replace('-', '')));
      expect(cpf.validate(generated.cpf).valid).toBe(true);
      expect(rg.validate(generated.rg).valid).toBe(true);
      expect(generated.cnh === undefined || cnh.validate(generated.cnh).valid).toBe(true);
      expect(pis.validate(generated.pis).valid).toBe(true);
      expect(voterTitle.validate(generated.voterTitle).valid).toBe(true);
      expect(Number(voterTitle.normalize(generated.voterTitle).slice(8, 10))).toBe(state.electoralCode);
      expect(city?.name).toBe(generated.address.city);
      expect(city?.state).toBe(state.code);
      expect(generated.mobile.replace(/\D/g, '').slice(0, 2)).toBe(city?.areaCode);
      expect(generated.phone.replace(/\D/g, '').slice(0, 2)).toBe(city?.areaCode);
      expect(generated.age).toBe(yearsBetween(generated.birthDate));
      expect(generated.age).toBeGreaterThanOrEqual(18);
      expect(generated.email).toMatch(RESERVED_EMAIL);
      const [, middle, last] = generated.name.split(' ');
      expect(middle).not.toBe(last);
    }
  });

  it('respects the requested state, sex and mask', () => {
    const { person } = peopleGenerators();
    const masked = person.generate({ state: 'CE', sex: 'female', formatted: true });
    expect(masked).toMatchObject({ sex: 'female', address: { state: 'CE' } });
    expect(masked.cpf).toMatch(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/);
    expect(masked.mobile).toMatch(/^\((85|88)\) 9[6-9]\d{3}-\d{4}$/);
    expect(masked.address.postalCode).toMatch(/^\d{5}-\d{3}$/);
    const plain = person.generate({ state: 'RS', sex: 'male', formatted: false });
    expect(plain).toMatchObject({ sex: 'male', address: { state: 'RS' } });
    expect(plain.cpf).toMatch(/^\d{11}$/);
    expect(plain.mobile).toMatch(/^5\d9\d{8}$/);
    expect(plain.address.postalCode).toMatch(/^\d{8}$/);
  });

  it('draws sex, complement and driver license from the random source', () => {
    const { person } = peopleGenerators();
    const people = Array.from({ length: 300 }, () => person.generate({ state: 'SP', sex: undefined, formatted: true }));
    expect(new Set(people.map((generated) => generated.sex))).toEqual(new Set(['female', 'male']));
    expect(new Set(people.map((generated) => generated.cnh === undefined))).toEqual(new Set([true, false]));
    expect(new Set(people.map((generated) => generated.address.complement === undefined))).toEqual(new Set([true, false]));
    expect(people.filter((generated) => generated.address.complement !== undefined).every((generated) => /^Apto \d{3,4}$/.test(generated.address.complement ?? ''))).toBe(true);
  });
});

describe('CompanyGenerator', () => {
  it('keeps companies valid and coherent', () => {
    const { catalog, company } = peopleGenerators();
    for (const state of STATES) {
      const generated = company.generate({ state: state.code, formatted: true });
      const city = cityByPostalCode(Number(generated.address.postalCode.replace('-', '')));
      expect(catalog.company.validate(generated.cnpj).valid).toBe(true);
      expect(generated.cnpj).toMatch(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/);
      expect(city?.state).toBe(state.code);
      expect(generated.phone.slice(1, 3)).toBe(city?.areaCode);
      expect(generated.email).toMatch(RESERVED_EMAIL);
      expect(generated.website).toBe(`https://www.${generated.email.split('@')[1]}`);
      expect(generated.legalName).toContain(generated.tradeName.split(' ')[0]);
      expect(generated.openingDate < '2025-10-20').toBe(true);
    }
    expect(company.generate({ state: undefined, formatted: false }).cnpj).toMatch(/^\d{14}$/);
  });
});

describe('contact and text helpers', () => {
  it('builds phone numbers and slugs', () => {
    expect(mobileNumber('11', sequenceRandom([0]), true)).toBe('(11) 96000-0000');
    expect(mobileNumber('11', sequenceRandom([0]), false)).toBe('11960000000');
    expect(landlineNumber('85', sequenceRandom([1]), true)).toBe('(85) 3111-1111');
    expect(landlineNumber('85', sequenceRandom([1]), false)).toBe('8531111111');
    expect(slug('João Conceição & Cia')).toBe('joaoconceicaocia');
  });
});
