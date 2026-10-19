# Changelog

Todas as mudanças relevantes deste projeto ficam registradas aqui.

O formato segue o [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/) e o projeto usa [Versionamento Semântico](https://semver.org/lang/pt-BR/).

## [Não lançado]

### Adicionado

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
