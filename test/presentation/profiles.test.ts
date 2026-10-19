import { describe, expect, it } from 'vitest';
import type { Company, Person } from '../../src/application/people/types';
import { EXPORT_FORMATS, exportProfile } from '../../src/presentation/profileExporters';
import { companyProfile, generateProfile, personProfile } from '../../src/presentation/profiles';
import { toProfileView } from '../../src/presentation/sidebarViews';
import { fakeProfiles } from '../fakes/profiles';

const address = { street: "Rua D'Ávila", number: '42', complement: undefined, neighborhood: 'Centro', city: 'Fortaleza', state: 'CE', postalCode: '60160-230' } as const;

const person: Person = {
  name: 'Ana Souza Lima',
  sex: 'female',
  birthDate: '1990-03-07',
  age: 36,
  cpf: '529.982.247-25',
  rg: '24.678.131-4',
  cnh: undefined,
  voterTitle: '1023 8501 0671',
  pis: '120.42752.71-6',
  email: 'ana.lima42@example.com',
  mobile: '(85) 98765-4321',
  phone: '(85) 3123-4567',
  address,
};

const company: Company = {
  legalName: 'Souza & Lima Tecnologia LTDA',
  tradeName: 'Souza Tecnologia',
  cnpj: '11.222.333/0001-81',
  openingDate: '2010-01-31',
  email: 'contato@souzatecnologia.example.com',
  phone: '(85) 3123-4567',
  website: 'https://www.souzatecnologia.example.com',
  address: { ...address, complement: 'Sala 2' },
};

describe('profiles', () => {
  it('lists person fields in Portuguese and skips missing optional ones', () => {
    const profile = personProfile(person);
    expect(profile.fields.map((field) => field.key)).toEqual(['nome', 'sexo', 'dataNascimento', 'idade', 'cpf', 'rg', 'tituloEleitor', 'pis', 'email', 'celular', 'telefone']);
    expect(profile.fields.find((field) => field.key === 'dataNascimento')).toEqual({ key: 'dataNascimento', label: 'Nascimento', value: '1990-03-07', display: '07/03/1990' });
    expect(profile.fields.find((field) => field.key === 'idade')).toMatchObject({ value: 36, display: '36 anos' });
    expect(profile.address.map((field) => field.key)).toEqual(['logradouro', 'numero', 'bairro', 'cidade', 'uf', 'cep']);
    expect(personProfile({ ...person, sex: 'male', cnh: '02650306461' }).fields.filter((field) => ['sexo', 'cnh'].includes(field.key)).map((field) => field.display)).toEqual(['Masculino', '02650306461']);
  });

  it('lists company fields with the complement', () => {
    const profile = companyProfile(company);
    expect(profile.fields.map((field) => field.label)).toEqual(['Razão social', 'Nome fantasia', 'CNPJ', 'Abertura', 'E-mail', 'Telefone', 'Site']);
    expect(profile.address.find((field) => field.key === 'complemento')?.value).toBe('Sala 2');
  });

  it('generates either kind', () => {
    const generators = fakeProfiles();
    expect(generateProfile(generators, 'person', { state: 'PE', formatted: true }).kind).toBe('person');
    expect(generateProfile(generators, 'company', { state: 'PE', formatted: true }).address.find((field) => field.key === 'uf')?.value).toBe('PE');
  });
});

describe('profile exporters', () => {
  it('exports JSON with a nested address', () => {
    expect(JSON.parse(exportProfile(personProfile(person), 'json'))).toMatchObject({ nome: 'Ana Souza Lima', idade: 36, endereco: { cidade: 'Fortaleza', cep: '60160-230' } });
  });

  it('exports a TypeScript object with escaped strings', () => {
    expect(exportProfile(companyProfile(company), 'typescript')).toBe(
      [
        'const empresa = {',
        "  razaoSocial: 'Souza & Lima Tecnologia LTDA',",
        "  nomeFantasia: 'Souza Tecnologia',",
        "  cnpj: '11.222.333/0001-81',",
        "  dataAbertura: '2010-01-31',",
        "  email: 'contato@souzatecnologia.example.com',",
        "  telefone: '(85) 3123-4567',",
        "  site: 'https://www.souzatecnologia.example.com',",
        '  endereco: {',
        "    logradouro: 'Rua D\\'Ávila',",
        "    numero: '42',",
        "    complemento: 'Sala 2',",
        "    bairro: 'Centro',",
        "    cidade: 'Fortaleza',",
        "    uf: 'CE',",
        "    cep: '60160-230',",
        '  },',
        '};',
      ].join('\n'),
    );
    expect(exportProfile(personProfile({ ...person, name: 'A\\B' }), 'typescript')).toContain("  nome: 'A\\\\B',\n  sexo");
    expect(exportProfile(personProfile(person), 'typescript')).toContain('  idade: 36,');
  });

  it('exports readable text', () => {
    const text = exportProfile(personProfile(person), 'text');
    expect(text.startsWith('Nome: Ana Souza Lima\nSexo: Feminino\nNascimento: 07/03/1990\nIdade: 36 anos')).toBe(true);
    expect(text.endsWith('\n\nEndereço\nLogradouro: Rua D\'Ávila\nNúmero: 42\nBairro: Centro\nCidade: Fortaleza\nUF: CE\nCEP: 60160-230')).toBe(true);
  });

  it('builds the sidebar view with every export under the copy limit', () => {
    const view = toProfileView(personProfile(person));
    expect(view.fields.at(-1)).toEqual(['CEP', '60160-230']);
    expect(Object.keys(view.exports)).toEqual([...EXPORT_FORMATS]);
    const generators = fakeProfiles();
    for (let index = 0; index < 500; index += 1) {
      const lengths = Object.values(toProfileView(generateProfile(generators, index % 2 === 0 ? 'person' : 'company', { state: undefined, formatted: true })).exports).map((text) => text.length);
      expect(Math.max(...lengths)).toBeLessThan(2000);
    }
  });
});
