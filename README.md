<h1 align="center">Kit Dev Brasil</h1>

<p align="center">
  O 4Devs dentro do VS Code: gere e valide CPF, CNPJ e dados de teste, e entenda PIX e boleto sem sair do editor.
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/github/license/GabrielCordeiroBarrosoTeles/kit-dev-brasil" alt="Licença MIT"></a>
  <a href="https://github.com/GabrielCordeiroBarrosoTeles/kit-dev-brasil/stargazers"><img src="https://img.shields.io/github/stars/GabrielCordeiroBarrosoTeles/kit-dev-brasil" alt="Estrelas no GitHub"></a>
  <a href="https://github.com/users/GabrielCordeiroBarrosoTeles/projects"><img src="https://img.shields.io/badge/roadmap-GitHub_Projects-blue" alt="Roadmap"></a>
</p>

> **Em desenvolvimento.** A primeira versão ainda não foi publicada. Acompanhe o [roadmap](https://github.com/users/GabrielCordeiroBarrosoTeles/projects) e dê uma ⭐ para ser avisado.

## Por quê

Quem desenvolve para o Brasil vive abrindo sites para gerar um CPF de teste, conferir um CNPJ, descobrir o valor de um PIX copia-e-cola ou o vencimento de um boleto. Isso quebra o foco e, pior, muita gente cola dados reais de pagamento em sites que não conhece.

O Kit Dev Brasil traz tudo isso para o VS Code e roda **100% na sua máquina**.

## O que vem por aí

### PIX
- **Entender um PIX copia-e-cola:** passe o mouse sobre a string no código e veja chave, valor, recebedor, cidade, txid e se o código é válido (CRC), com o motivo quando não for.
- **Gerar PIX de teste** (estático, com ou sem valor) com prévia do QR code.

### Boleto
- **Ler linha digitável e código de barras:** banco, valor e vencimento.
- **Validar** os dígitos verificadores e **converter** um formato no outro.

### Documentos
- **CPF e CNPJ:** gerar, validar e formatar, incluindo o **CNPJ alfanumérico**.
- **CEP:** validar, formatar e consultar o endereço.

### Dados de teste
- Pessoas e empresas brasileiras fictícias (nome, CPF, telefone com DDD, endereço, e-mail) inseridas direto no código, em texto, JSON ou objeto.

### No seu código
- **Avisos** quando um CPF, CNPJ ou PIX dentro de testes e fixtures for inválido.
- **Comandos e atalhos** para gerar, formatar ou limpar a máscara do texto selecionado.

## Privacidade

Nada sai da sua máquina. A única exceção planejada é a consulta de CEP, que só acontece quando você pede e pode ser desligada. Sem telemetria.

## Contribuindo

Contribuições são muito bem-vindas! Leia o [guia de contribuição](CONTRIBUTING.md) e o [código de conduta](CODE_OF_CONDUCT.md). Issues marcadas com **good first issue** são um bom começo.

Encontrou uma falha de segurança? Siga a [política de segurança](SECURITY.md) em vez de abrir uma issue pública.

## ☕ Apoie o projeto

O Kit Dev Brasil é gratuito e open source. Se ele te poupar tempo, você pode apoiar o desenvolvimento:

- [GitHub Sponsors](https://github.com/sponsors/GabrielCordeiroBarrosoTeles)
- 🇧🇷 **PIX**: aponte a câmera do app do seu banco para o QR code abaixo

<img src="assets/pix-card.png" width="260" alt="Cartão com QR code PIX para apoiar o Kit Dev Brasil">

Dar uma ⭐ no repositório e compartilhar com outros devs também ajuda muito.

Do mesmo autor: [Reflect for Android](https://github.com/GabrielCordeiroBarrosoTeles/reflect-android), para espelhar e controlar seu celular Android dentro do VS Code.

## Licença

[MIT](LICENSE)
