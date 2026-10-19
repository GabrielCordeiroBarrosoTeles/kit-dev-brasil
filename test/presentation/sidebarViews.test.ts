import { describe, expect, it } from 'vitest';
import { Cpf } from '../../src/domain/documents/Cpf';
import { DocumentRegistry } from '../../src/domain/documents/DocumentRegistry';
import { decodeBrCode } from '../../src/domain/pix/decodeBrCode';
import { TextInspector } from '../../src/application/inspection/TextInspector';
import { InspectionRenderer } from '../../src/presentation/InspectionRenderer';
import { formatAmount } from '../../src/presentation/pixFields';
import { NOT_A_DOCUMENT, toDocumentView, toPixView } from '../../src/presentation/sidebarViews';
import { BCB_PIX } from '../fakes/samples';

const renderer = new InspectionRenderer();
const inspector = new TextInspector(new DocumentRegistry([new Cpf()]), decodeBrCode);

describe('sidebar views', () => {
  it('describes documents for the sidebar', () => {
    expect(toDocumentView(undefined, renderer)).toEqual({ state: 'unknown', message: NOT_A_DOCUMENT, formatted: undefined });
    expect(toDocumentView(inspector.inspectDocument('52998224725'), renderer)).toEqual({ state: 'valid', message: 'CPF 529.982.247-25 é válido', formatted: '529.982.247-25' });
    expect(toDocumentView(inspector.inspectDocument('52998224726'), renderer)).toMatchObject({ state: 'invalid', formatted: '529.982.247-26' });
  });

  it('describes PIX codes with plain fields and issues', () => {
    const valid = toPixView(decodeBrCode(BCB_PIX), renderer);
    expect(valid).toMatchObject({ state: 'valid', issues: [] });
    expect(valid.fields).toContainEqual(['Chave', '123e4567-e12b-12d1-a456-426655440000 (chave aleatória)']);
    expect(toPixView(decodeBrCode('000201XX'), renderer)).toEqual({
      state: 'invalid',
      summary: 'PIX inválido: estrutura inválida a partir da posição 7',
      fields: [],
      issues: ['estrutura inválida a partir da posição 7'],
    });
  });

  it('formats amounts and keeps odd values', () => {
    expect(formatAmount('10.5')).toMatch(/^R\$\s10,50$/);
    expect(formatAmount('x')).toBe('x');
  });
});
