import type { PixFormField, PixFormIssue } from '../application/pix/generateStaticPix';
import type { BoletoIssue } from '../domain/boleto/types';
import type { DocumentIssue } from '../domain/documents/types';
import type { BrCodeField, BrCodeIssue, PixInitiation, PixKeyType } from '../domain/pix/types';

export const FIELD_LABELS: Readonly<Record<BrCodeField, string>> = {
  'payload-format': 'versão do payload (00)',
  'merchant-account': 'conta do recebedor (26)',
  gui: 'identificador do PIX (26.00)',
  'key-or-url': 'chave ou URL do PIX (26.01 ou 26.25)',
  mcc: 'categoria do recebedor (52)',
  currency: 'moeda (53)',
  amount: 'valor (54)',
  country: 'país (58)',
  'merchant-name': 'nome do recebedor (59)',
  'merchant-city': 'cidade do recebedor (60)',
  crc: 'CRC (63)',
};

export const KEY_TYPE_LABELS: Readonly<Record<PixKeyType, string>> = {
  cpf: 'CPF',
  cnpj: 'CNPJ',
  email: 'e-mail',
  phone: 'telefone',
  random: 'chave aleatória',
};

export const INITIATION_LABELS: Readonly<Record<PixInitiation, string>> = {
  static: 'estático (pode ser pago várias vezes)',
  dynamic: 'dinâmico (uso único, dados vêm da URL)',
};

export const describeDocumentIssue = (issue: DocumentIssue): string => {
  switch (issue.code) {
    case 'invalid-characters':
      return 'tem caracteres que não pertencem ao documento';
    case 'wrong-length':
      return `deveria ter ${issue.expected} caracteres, mas tem ${issue.actual}`;
    case 'repeated-characters':
      return 'todos os caracteres são iguais';
    case 'invalid-format':
      return `não segue o formato esperado: ${issue.expected}`;
    case 'invalid-prefix':
      return 'começa com um dígito que não existe nesse documento';
    case 'invalid-checksum':
      return 'a conta de verificação não fecha';
    case 'invalid-check-digits':
      return `dígitos verificadores errados: esperado ${issue.expected}, encontrado ${issue.actual}`;
  }
};

export const describeBrCodeIssue = (issue: BrCodeIssue): string => {
  switch (issue.code) {
    case 'malformed':
      return `estrutura inválida a partir da posição ${issue.position + 1}`;
    case 'missing-field':
      return `falta o campo ${FIELD_LABELS[issue.field]}`;
    case 'unexpected-value':
      return `${FIELD_LABELS[issue.field]} deveria ser "${issue.expected}", mas é "${issue.actual}"`;
    case 'too-long':
      return `${FIELD_LABELS[issue.field]} tem ${issue.actual} caracteres, o máximo é ${issue.max}`;
    case 'invalid-amount':
      return `valor "${issue.actual}" fora do formato esperado (ex.: 10.50)`;
    case 'invalid-crc':
      return `CRC não confere: esperado ${issue.expected}, encontrado ${issue.actual}`;
  }
};

export const describeBoletoIssue = (issue: BoletoIssue): string => {
  switch (issue.code) {
    case 'invalid-characters':
      return 'tem caracteres que não pertencem a um boleto';
    case 'invalid-length':
      return `tem ${issue.actual} dígitos; boleto tem 44 (código de barras), 47 (linha bancária) ou 48 (linha de arrecadação)`;
    case 'invalid-field-check-digit':
      return `dígito do campo ${issue.field} errado: esperado ${issue.expected}, encontrado ${issue.actual}`;
    case 'invalid-check-digit':
      return `dígito verificador geral errado: esperado ${issue.expected}, encontrado ${issue.actual}`;
    case 'invalid-currency':
      return `código de moeda ${issue.actual} desconhecido (o real é 9)`;
    case 'invalid-value-type':
      return `identificador de valor ${issue.actual} desconhecido (esperado 6, 7, 8 ou 9)`;
  }
};

export const PIX_FORM_LABELS: Readonly<Record<PixFormField, string>> = {
  key: 'Chave',
  merchantName: 'Nome do recebedor',
  merchantCity: 'Cidade',
  amount: 'Valor',
  txid: 'Identificador (txid)',
};

export const describePixFormIssue = (issue: PixFormIssue): string => {
  const label = PIX_FORM_LABELS[issue.field];
  switch (issue.code) {
    case 'required':
      return `${label}: obrigatório`;
    case 'too-long':
      return `${label}: no máximo ${issue.max} caracteres`;
    case 'invalid-amount':
      return `${label}: use números, como 10,50`;
    case 'invalid-txid':
      return `${label}: só letras e números, até 25`;
  }
};
