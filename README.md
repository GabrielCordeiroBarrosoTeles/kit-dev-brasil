<h1 align="center">Kit Dev Brasil</h1>

<p align="center">
  O 4Devs dentro do VS Code: gere e valide 16 documentos brasileiros, entenda boletos e PIX e gere PIX de teste com QR code, sem sair do editor.
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/github/license/GabrielCordeiroBarrosoTeles/kit-dev-brasil" alt="Licença MIT"></a>
  <a href="https://github.com/GabrielCordeiroBarrosoTeles/kit-dev-brasil/stargazers"><img src="https://img.shields.io/github/stars/GabrielCordeiroBarrosoTeles/kit-dev-brasil" alt="Estrelas no GitHub"></a>
  <a href="https://github.com/users/GabrielCordeiroBarrosoTeles/projects/4"><img src="https://img.shields.io/badge/roadmap-GitHub_Projects-blue" alt="Roadmap"></a>
</p>

> **Em desenvolvimento.** Já funciona localmente (veja abaixo), mas ainda não foi publicado no Marketplace. Acompanhe o [roadmap](https://github.com/users/GabrielCordeiroBarrosoTeles/projects/4) e dê uma ⭐ para ser avisado.

## Por quê

Quem desenvolve para o Brasil vive abrindo sites para gerar um CPF de teste, conferir um CNPJ, descobrir o valor de um PIX copia-e-cola ou o vencimento de um boleto. Isso quebra o foco e, pior, muita gente cola dados reais de pagamento em sites que não conhece.

O Kit Dev Brasil traz tudo isso para o VS Code e roda **100% na sua máquina**.

## O que já funciona

### 16 geradores e validadores de documentos
| Grupo | Documentos |
| --- | --- |
| **Pessoa** | CPF, RG (padrão SP, inclusive com X), CNH, título de eleitor (com a UF), PIS/PASEP/NIT e Cartão do SUS (CNS) |
| **Empresa** | CNPJ e o novo **CNPJ alfanumérico** |
| **Veículo** | placa Mercosul, placa antiga (com a conversão entre elas) e RENAVAM |
| **Cartão de crédito** | Visa, Mastercard, American Express, Elo e Hipercard, com a bandeira reconhecida na validação |

- **Validar qualquer documento:** cole o número e o Kit descobre o que ele é. Se 11 dígitos servem para CPF, CNH, PIS e RENAVAM, ele mostra em qual deles o número é válido (*Válido como PIS/PASEP e RENAVAM*).
- **Os números gerados valem em todas as variantes conhecidas** das regras (CNH e título de eleitor têm mais de uma), e a validação aceita qualquer variante, para não marcar como inválido um documento real.

### Boleto
- Cole a **linha digitável** ou o **código de barras** de um boleto bancário ou de arrecadação (contas de consumo, tributos, multas) e veja banco, valor, vencimento (*vence em 22 dias*) e se ele é válido. Quando não é, o Kit aponta qual campo está errado.
- O vencimento já considera o **novo ciclo do fator de vencimento** que começou em 22/02/2025.
- **Copiar** a linha digitável ou o código de barras, e o comando **Converter boleto** troca um pelo outro no texto selecionado.

### PIX
- **Entender um PIX copia-e-cola:** passe o mouse sobre o código, em qualquer arquivo, ou cole no painel. Você vê chave (com o tipo), valor, recebedor, cidade, txid, se é estático ou dinâmico e se o código é válido, com o motivo em português (*CRC não confere: esperado 4A6B, encontrado 0000*).
- **Gerar PIX de teste com QR code:** informe chave, recebedor, cidade e, se quiser, valor e txid. O Kit monta o código, remove acentos como o Banco Central recomenda e mostra o **QR code** para testar no app do banco.

### Hover no código
Passe o mouse sobre PIX, boleto, CPF, CNPJ, PIS, RG, título, CNS, placa ou cartão escritos com máscara e veja se são válidos, sem sair do arquivo. Números sem máscara só aparecem quando válidos, para não confundir com telefones e outros números.

### Como usar
O Kit Dev Brasil tem um **ícone próprio na barra lateral** (o losango da bandeira), que abre o painel **Ferramentas**:

- **Gerar:** os documentos em grupos recolhíveis. O número aparece no painel e já vai para a área de transferência, **sem mexer no seu código**, com os botões **copiar** e **gerar outro**. A caixa **com máscara** escolhe o formato.
- **Validar documento:** campo com resultado **ao vivo** e o botão **Copiar formatado**.
- **PIX copia-e-cola**, **Gerar PIX de teste** e **Boleto:** campos com resultado ao vivo e botões para copiar.
- **Texto selecionado no editor:** **Formatar** e **Remover máscara**.

Pela paleta (<kbd>Ctrl</kbd>/<kbd>Cmd</kbd>+<kbd>Shift</kbd>+<kbd>P</kbd>, digite **Kit Dev Brasil**) ou pelo botão direito (submenu **Kit Dev Brasil**):

| Comando | O que faz |
| --- | --- |
| **Gerar documento…** | Escolhe qualquer um dos 16 documentos e insere no cursor (sem arquivo aberto, copia) |
| **Gerar CPF / CNPJ / CNPJ alfanumérico** | Atalhos diretos, um número diferente para cada cursor |
| **Validar documento (colar)…** | Caixa com resultado ao vivo |
| **Validar seleção** | Valida o texto selecionado |
| **Formatar seleção / Remover máscara da seleção** | Aplica ou tira a máscara |
| **Converter boleto** | Linha digitável ↔ código de barras na seleção |
| **Inspecionar PIX copia-e-cola** / **(colar código)…** | Relatório completo do PIX, com opção de copiar como JSON |

| Configuração | Padrão | O que faz |
| --- | --- | --- |
| `kitDevBrasil.generate.formatted` | `true` | Inserir os documentos gerados com máscara |
| `kitDevBrasil.hover.enabled` | `true` | Mostrar detalhes ao passar o mouse |

## O que vem por aí

Acompanhe tudo no [roadmap](https://github.com/users/GabrielCordeiroBarrosoTeles/projects/4):

- **Pessoas e empresas fictícias e coerentes:** CEP que bate com a cidade, DDD do mesmo estado, e-mail com o nome.
- **Gerar em lote:** dezenas de registros como JSON, CSV, SQL ou array TypeScript, com **semente fixa** para testes reproduzíveis.
- **Avisos no código** com correção rápida, **snippets** (`cpf` + Tab) e **histórico** no painel.
- **Mais documentos:** inscrição estadual por estado, conta bancária, certidões e chave de NF-e.

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
