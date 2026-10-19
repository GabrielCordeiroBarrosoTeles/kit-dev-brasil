import { decodeBoleto } from './decodeBoleto';

const BARCODE_LENGTH = 44;

export const convertBoleto = (text: string, today: Date): string | undefined => {
  const { boleto } = decodeBoleto(text, today);
  if (!boleto) {
    return undefined;
  }
  return text.replace(/\D/g, '').length === BARCODE_LENGTH ? boleto.line : boleto.barcode;
};
