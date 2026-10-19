# Changelog

Todas as mudanças relevantes deste projeto ficam registradas aqui.

O formato segue o [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/) e o projeto usa [Versionamento Semântico](https://semver.org/lang/pt-BR/).

## [Não lançado]

## [0.2.0] - 2026-10-19

### Adicionado

- Gerador de **pessoa** e de **empresa** fictícias com dados coerentes entre si: CEP dentro da faixa da cidade, DDD da cidade, título de eleitor com o código da UF, e-mail derivado do nome no domínio reservado `example.com` e idade compatível com a data de nascimento. Escolha da UF e exportação como JSON, objeto TypeScript ou texto, no painel e nos comandos **Gerar pessoa fictícia…** e **Gerar empresa fictícia…**.
- CEP como documento: validação pelas faixas oficiais dos Correios das 27 UFs, nome da cidade ou do estado no resultado, geração por UF, hover e grupo **Endereço** no painel. Tudo offline.
- Novos documentos: RG (SP), CNH, título de eleitor, PIS/PASEP/NIT, Cartão do SUS (CNS), placa (antiga e Mercosul, com conversão), RENAVAM e cartão de crédito (Visa, Mastercard, American Express, Elo e Hipercard), com geração e validação.
- Validação de qualquer documento, com detecção automática do tipo e de números que servem para mais de um documento.
- Boleto bancário e de arrecadação: leitura da linha digitável e do código de barras (banco, valor, vencimento com o novo ciclo de 2025), validação campo a campo, cópia e conversão entre os formatos.
- Geração de PIX de teste com QR code no painel.
- Comando **Gerar documento…** com todos os geradores e comando **Converter boleto**.
- Hover para boleto e para os novos documentos escritos com máscara.

- Ícone na barra lateral com o painel **Ferramentas**, feito com as cores do tema: geradores de CPF e CNPJ com o número no painel e botões de copiar e gerar outro, campo para validar CPF ou CNPJ e campo para inspecionar PIX, ambos com resultado ao vivo, e ações para formatar ou remover a máscara da seleção.
- Comandos **Validar CPF ou CNPJ (colar)** e **Inspecionar PIX (colar código)** na paleta, com resultado ao vivo enquanto se digita.
- Pela paleta, gerar sem arquivo aberto copia o número para a área de transferência.
- Hover sobre PIX copia-e-cola com chave e tipo da chave, valor, recebedor, cidade, txid, tipo (estático ou dinâmico) e validação completa, incluindo o CRC, com mensagens em português.
- Comando **Inspecionar PIX copia-e-cola**, que mostra o resultado ao lado do código e copia como JSON.
- Comandos para gerar CPF, CNPJ e CNPJ alfanumérico, com suporte a múltiplos cursores.
- Comandos para validar, formatar e remover a máscara da seleção.
- Hover sobre CPF e CNPJ mostrando se são válidos.
- Configurações `kitDevBrasil.generate.formatted` e `kitDevBrasil.hover.enabled`.
- CI no GitHub Actions (Linux, macOS e Windows) com cobertura de testes de 100%.
- Estrutura inicial do repositório: README, guia de contribuição, código de conduta, política de segurança e modelos de issue e pull request.
