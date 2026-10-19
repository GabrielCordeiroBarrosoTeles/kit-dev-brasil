# Changelog

Todas as mudanças relevantes deste projeto ficam registradas aqui.

O formato segue o [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/) e o projeto usa [Versionamento Semântico](https://semver.org/lang/pt-BR/).

## [Não lançado]

### Adicionado

- Hover sobre PIX copia-e-cola com chave e tipo da chave, valor, recebedor, cidade, txid, tipo (estático ou dinâmico) e validação completa, incluindo o CRC, com mensagens em português.
- Comando **Inspecionar PIX copia-e-cola**, que mostra o resultado ao lado do código e copia como JSON.
- Comandos para gerar CPF, CNPJ e CNPJ alfanumérico, com suporte a múltiplos cursores.
- Comandos para validar, formatar e remover a máscara da seleção.
- Hover sobre CPF e CNPJ mostrando se são válidos.
- Configurações `kitDevBrasil.generate.formatted` e `kitDevBrasil.hover.enabled`.
- CI no GitHub Actions (Linux, macOS e Windows) com cobertura de testes de 100%.
- Estrutura inicial do repositório: README, guia de contribuição, código de conduta, política de segurança e modelos de issue e pull request.
