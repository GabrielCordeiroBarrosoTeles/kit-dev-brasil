export const COMMAND_MESSAGES = {
  noEditor: 'Abra um arquivo para usar o Kit Dev Brasil.',
  noSelection: 'Selecione o texto primeiro.',
  nothingToFormat: 'Nenhum CPF ou CNPJ reconhecido na seleção.',
  nothingToUnformat: 'A seleção não tem máscara para remover.',
  notADocument: (text: string) => `"${text}" não parece um CPF ou CNPJ.`,
  noPix: 'Selecione um PIX copia-e-cola ou coloque o cursor sobre ele.',
  pixInspected: 'PIX inspecionado.',
  copyJson: 'Copiar JSON',
  jsonCopied: 'JSON do PIX copiado.',
} as const;
