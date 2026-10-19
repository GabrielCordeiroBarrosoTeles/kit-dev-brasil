<h1 align="center">Kit Dev Brasil</h1>

<p align="center">
  O 4Devs dentro do VS Code: gere e valide CPF, CNPJ e dados de teste, e entenda PIX e boleto sem sair do editor.
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/github/license/GabrielCordeiroBarrosoTeles/kit-dev-brasil" alt="Licença MIT"></a>
  <a href="https://github.com/GabrielCordeiroBarrosoTeles/kit-dev-brasil/stargazers"><img src="https://img.shields.io/github/stars/GabrielCordeiroBarrosoTeles/kit-dev-brasil" alt="Estrelas no GitHub"></a>
  <a href="https://github.com/users/GabrielCordeiroBarrosoTeles/projects/4"><img src="https://img.shields.io/badge/roadmap-GitHub_Projects-blue" alt="Roadmap"></a>
</p>

> **Em desenvolvimento.** A versão 0.1 já funciona localmente (veja abaixo), mas ainda não foi publicada no Marketplace. Acompanhe o [roadmap](https://github.com/users/GabrielCordeiroBarrosoTeles/projects/4) e dê uma ⭐ para ser avisado.

## Por quê

Quem desenvolve para o Brasil vive abrindo sites para gerar um CPF de teste, conferir um CNPJ, descobrir o valor de um PIX copia-e-cola ou o vencimento de um boleto. Isso quebra o foco e, pior, muita gente cola dados reais de pagamento em sites que não conhece.

O Kit Dev Brasil traz tudo isso para o VS Code e roda **100% na sua máquina**.

## O que já funciona (0.1)

### PIX copia-e-cola explicado no hover
Passe o mouse sobre um PIX copia-e-cola em qualquer arquivo e veja chave (com o tipo: CPF, CNPJ, e-mail, telefone ou aleatória), valor, recebedor, cidade, txid, se é estático ou dinâmico e **se o código é válido**. Quando não é, o motivo aparece em português, por exemplo: *CRC não confere: esperado 4A6B, encontrado 0000*.

O comando **Kit Dev Brasil: Inspecionar PIX copia-e-cola** abre o mesmo resultado ao lado do código e deixa copiar tudo como JSON.

### CPF e CNPJ, incluindo o alfanumérico
- **Gerar** CPF, CNPJ ou CNPJ alfanumérico na posição do cursor (com múltiplos cursores, cada um recebe um número diferente).
- **Validar** a seleção, com o motivo do erro (*dígitos verificadores errados: esperado 25, encontrado 26*).
- **Formatar** ou **remover a máscara** da seleção.
- **Hover** sobre CPF e CNPJ com máscara mostra se são válidos. Números sem máscara só aparecem quando válidos, para não confundir com telefones e outros números.

### Como usar
O Kit Dev Brasil tem um **ícone próprio na barra lateral** (o losango da bandeira). Ele abre o painel **Ferramentas**, com tudo no próprio painel:

- **Gerar:** CPF, CNPJ e CNPJ alfanumérico aparecem no painel e já vão para a área de transferência, **sem mexer no seu código**. Ao lado de cada um ficam os botões **copiar** e **gerar outro**, e a caixa **com máscara** escolhe o formato.
- **Validar CPF ou CNPJ:** um campo para colar ou digitar, com o resultado **ao vivo** (*✅ CPF 529.982.247-25 é válido*) e o botão **Copiar formatado**.
- **PIX copia-e-cola:** cole o código e veja na hora se é válido, com chave, valor, recebedor, cidade e txid, os problemas encontrados e os botões **Abrir relatório** e **Copiar JSON**.
- **Texto selecionado no editor:** **Formatar** e **Remover máscara**.

Pela paleta (<kbd>Ctrl</kbd>/<kbd>Cmd</kbd>+<kbd>Shift</kbd>+<kbd>P</kbd>, digite **Kit Dev Brasil**) ou pelo menu do botão direito (submenu **Kit Dev Brasil**), os comandos **Gerar CPF/CNPJ** inserem o número direto no cursor, um diferente para cada cursor.

| Configuração | Padrão | O que faz |
| --- | --- | --- |
| `kitDevBrasil.generate.formatted` | `true` | Inserir CPF e CNPJ gerados com máscara |
| `kitDevBrasil.hover.enabled` | `true` | Mostrar detalhes ao passar o mouse sobre PIX, CPF e CNPJ |

## O que vem por aí

- **PIX de teste:** gerar PIX estático, com ou sem valor, com prévia do QR code.
- **Boleto:** ler linha digitável e código de barras (banco, valor, vencimento), validar e converter um no outro.
- **CEP:** validar, formatar e consultar o endereço, só quando você pedir.
- **Dados de teste:** pessoas e empresas fictícias (nome, CPF, telefone com DDD, endereço, e-mail) em texto, JSON ou objeto.
- **Avisos no código** quando um CPF, CNPJ ou PIX dentro de testes e fixtures for inválido.
- **Outros documentos:** PIS, título de eleitor, CNH, RENAVAM, placa Mercosul e chave de NF-e.

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
