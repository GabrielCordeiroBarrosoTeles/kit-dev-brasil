import type { StateCode } from '../../domain/brazil/types';

export type Sex = 'female' | 'male';

export interface Address {
  readonly street: string;
  readonly number: string;
  readonly complement: string | undefined;
  readonly neighborhood: string;
  readonly city: string;
  readonly state: StateCode;
  readonly postalCode: string;
}

export interface Person {
  readonly name: string;
  readonly sex: Sex;
  readonly birthDate: string;
  readonly age: number;
  readonly cpf: string;
  readonly rg: string;
  readonly cnh: string | undefined;
  readonly voterTitle: string;
  readonly pis: string;
  readonly email: string;
  readonly mobile: string;
  readonly phone: string;
  readonly address: Address;
}

export interface Company {
  readonly legalName: string;
  readonly tradeName: string;
  readonly cnpj: string;
  readonly openingDate: string;
  readonly email: string;
  readonly phone: string;
  readonly website: string;
  readonly address: Address;
}

export interface GenerationOptions {
  readonly state: StateCode | undefined;
  readonly formatted: boolean;
}

export interface PersonOptions extends GenerationOptions {
  readonly sex: Sex | undefined;
}
