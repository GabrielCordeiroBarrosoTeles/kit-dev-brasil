import { describe, expect, it } from 'vitest';
import type { Boleto } from '../../src/domain/boleto/types';
import { decodeBoleto } from '../../src/domain/boleto/decodeBoleto';
import { describeBank, describeBoletoAmount, describeBoletoFields, describeDueDate, formatBoletoLine } from '../../src/presentation/boletoFields';
import { InspectionRenderer } from '../../src/presentation/InspectionRenderer';
import { describeBoletoIssue, describePixFormIssue } from '../../src/presentation/messages';
import { toBoletoView } from '../../src/presentation/sidebarViews';
import { OFFICIAL_BANK_LINE, TELECOM_COLLECTION_LINE, TODAY } from '../fakes/samples';

const renderer = new InspectionRenderer(() => TODAY);
const bank = decodeBoleto(OFFICIAL_BANK_LINE, TODAY);
const collection = decodeBoleto(TELECOM_COLLECTION_LINE, TODAY);

const boleto = (overrides: Partial<Boleto>): Boleto => ({ ...(bank.boleto as Boleto), ...overrides });

describe('boleto fields', () => {
  it('formats lines of both kinds', () => {
    expect(formatBoletoLine(bank.boleto as Boleto)).toBe(OFFICIAL_BANK_LINE);
    expect(formatBoletoLine(collection.boleto as Boleto)).toBe('84670000001-7 43590024020-9 02405000243-5 84221010811-9');
  });

  it('describes due dates relative to today', () => {
    expect(describeDueDate('2026-10-19', TODAY)).toBe('19/10/2026 (vence hoje)');
    expect(describeDueDate('2026-10-20', TODAY)).toBe('20/10/2026 (vence em 1 dia)');
    expect(describeDueDate('2026-10-30', TODAY)).toBe('30/10/2026 (vence em 11 dias)');
    expect(describeDueDate('2026-10-18', TODAY)).toBe('18/10/2026 (vencido há 1 dia)');
    expect(describeDueDate('2024-02-24', TODAY)).toMatch(/vencido há \d+ dias/);
  });

  it('describes banks, amounts and every row', () => {
    expect(describeBank('341')).toBe('341 · Itaú');
    expect(describeBank('999')).toBe('999');
    expect(describeBoletoAmount(boleto({ amount: undefined }))).toBe('livre (quem paga digita)');
    expect(describeBoletoAmount(boleto({ amount: '12.34', amountIsReference: true }))).toBe('12.34 (valor de referência)');
    expect(describeBoletoFields(bank.boleto as Boleto, TODAY).map(([label]) => label)).toEqual(['Tipo', 'Banco', 'Valor', 'Vencimento', 'Linha digitável', 'Código de barras']);
    expect(describeBoletoFields(boleto({ dueDate: undefined }), TODAY)).toContainEqual(['Vencimento', 'sem vencimento']);
    expect(describeBoletoFields(collection.boleto as Boleto, TODAY)).toContainEqual(['Tipo', 'arrecadação · telecomunicações']);
    expect(describeBoletoFields(boleto({ kind: 'collection', segment: '0', bankCode: undefined }), TODAY)).toContainEqual(['Tipo', 'arrecadação']);
    expect(describeBoletoFields(boleto({ kind: 'collection', segment: undefined, bankCode: undefined }), TODAY)).toContainEqual(['Tipo', 'arrecadação']);
  });
});

describe('boleto messages and rendering', () => {
  it.each([
    [{ code: 'invalid-characters' } as const, 'tem caracteres que não pertencem a um boleto'],
    [{ code: 'invalid-length', actual: 3 } as const, 'tem 3 dígitos; boleto tem 44 (código de barras), 47 (linha bancária) ou 48 (linha de arrecadação)'],
    [{ code: 'invalid-field-check-digit', field: 2, expected: '7', actual: '0' } as const, 'dígito do campo 2 errado: esperado 7, encontrado 0'],
    [{ code: 'invalid-check-digit', expected: '1', actual: '5' } as const, 'dígito verificador geral errado: esperado 1, encontrado 5'],
    [{ code: 'invalid-currency', actual: '8' } as const, 'código de moeda 8 desconhecido (o real é 9)'],
    [{ code: 'invalid-value-type', actual: '5' } as const, 'identificador de valor 5 desconhecido (esperado 6, 7, 8 ou 9)'],
  ])('describes %j', (issue, text) => {
    expect(describeBoletoIssue(issue)).toBe(text);
  });

  it.each([
    [{ field: 'key', code: 'required' } as const, 'Chave: obrigatório'],
    [{ field: 'merchantCity', code: 'too-long', max: 15 } as const, 'Cidade: no máximo 15 caracteres'],
    [{ field: 'amount', code: 'invalid-amount' } as const, 'Valor: use números, como 10,50'],
    [{ field: 'txid', code: 'invalid-txid' } as const, 'Identificador (txid): só letras e números, até 25'],
  ])('describes PIX form issue %j', (issue, text) => {
    expect(describePixFormIssue(issue)).toBe(text);
  });

  it('summarizes and renders boletos', () => {
    expect(renderer.summarizeBoleto(bank)).toMatch(/^Boleto válido · R\$\s1\.234,00 · 001 · Banco do Brasil · vencimento 24\/02\/2024 \(vencido há \d+ dias\)$/);
    expect(renderer.summarizeBoleto(collection)).toMatch(/^Boleto válido · R\$\s143,59$/);
    expect(renderer.summarizeBoleto({ boleto: undefined, issues: [] })).toBe('Boleto válido');
    expect(renderer.summarizeBoleto({ boleto: undefined, issues: [{ code: 'invalid-characters' }, { code: 'invalid-currency', actual: '1' }] })).toBe(
      'Boleto inválido: tem caracteres que não pertencem a um boleto (+1 problema)',
    );
    expect(renderer.render({ kind: 'boleto', decoding: bank })).toContain('**Boleto** · ✅ válido');
    const broken = renderer.render({ kind: 'boleto', decoding: { boleto: undefined, issues: [{ code: 'invalid-length', actual: 3 }] } });
    expect(broken).toContain('❌ inválido');
    expect(broken).not.toContain('| Campo |');
    expect(new InspectionRenderer().describeBoleto(bank.boleto as Boleto).length).toBeGreaterThan(3);
  });

  it('builds sidebar views', () => {
    expect(toBoletoView(bank, renderer)).toMatchObject({ state: 'valid', issues: [] });
    expect(toBoletoView({ boleto: undefined, issues: [{ code: 'invalid-characters' }] }, renderer)).toEqual({
      state: 'invalid',
      summary: 'Boleto inválido: tem caracteres que não pertencem a um boleto',
      fields: [],
      issues: ['tem caracteres que não pertencem a um boleto'],
    });
  });
});
