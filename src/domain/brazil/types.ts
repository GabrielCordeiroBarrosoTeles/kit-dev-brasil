import type { NonEmpty } from '../shared/random';

export type StateCode =
  | 'AC' | 'AL' | 'AM' | 'AP' | 'BA' | 'CE' | 'DF' | 'ES' | 'GO' | 'MA' | 'MG' | 'MS' | 'MT' | 'PA'
  | 'PB' | 'PE' | 'PI' | 'PR' | 'RJ' | 'RN' | 'RO' | 'RR' | 'RS' | 'SC' | 'SE' | 'SP' | 'TO';

export interface PostalRange {
  readonly from: number;
  readonly to: number;
}

export interface State {
  readonly code: StateCode;
  readonly name: string;
  readonly electoralCode: number;
  readonly areaCodes: NonEmpty<string>;
  readonly postalRanges: NonEmpty<PostalRange>;
}

export interface City {
  readonly name: string;
  readonly state: StateCode;
  readonly areaCode: string;
  readonly postalRange: PostalRange;
}
