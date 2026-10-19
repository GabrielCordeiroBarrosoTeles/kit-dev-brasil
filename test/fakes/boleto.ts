import { decodeBoleto } from '../../src/domain/boleto/decodeBoleto';
import type { BoletoDecoding } from '../../src/domain/boleto/types';
import { TODAY } from './samples';

export const decodeTestBoleto = (text: string): BoletoDecoding => decodeBoleto(text, TODAY);
