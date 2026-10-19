# Como contribuir

Obrigado por querer ajudar o Kit Dev Brasil! Este guia explica como o projeto funciona e como enviar sua contribuição.

## Sumário

- [Antes de começar](#antes-de-começar)
- [Ambiente local](#ambiente-local)
- [Arquitetura](#arquitetura)
- [Regras do código](#regras-do-código)
- [Regras dos documentos](#regras-dos-documentos)
- [Testes e cobertura](#testes-e-cobertura)
- [Commits](#commits)
- [Pull requests](#pull-requests)

## Antes de começar

- **Bug ou sugestão?** Procure nas [issues](https://github.com/GabrielCordeiroBarrosoTeles/kit-dev-brasil/issues) se já existe algo parecido antes de abrir uma nova.
- **Dúvida?** Use as [Discussions](https://github.com/GabrielCordeiroBarrosoTeles/kit-dev-brasil/discussions).
- **Ideia grande?** Abra uma discussão primeiro, para alinhar o caminho antes de escrever código.
- Issues com **good first issue** são pensadas para quem está chegando agora.

## Ambiente local

Você vai precisar do **Node.js 20** ou mais novo e do **VS Code 1.95** ou mais novo.

```bash
git clone https://github.com/GabrielCordeiroBarrosoTeles/kit-dev-brasil.git
cd kit-dev-brasil
npm ci
```

| Comando | O que faz |
| --- | --- |
| `npm run typecheck` | Verifica os tipos |
| `npm test` | Roda os testes |
| `npm run coverage` | Roda os testes com cobertura (precisa ficar em 100%) |
| `npm run build` | Typecheck + bundle em `dist/` |
| `npm run watch` | Rebuild automático enquanto você edita |
| `npm run package` | Gera o `.vsix` |

Para testar no editor, abra a pasta no VS Code e aperte **F5**. Abre uma janela com a extensão carregada e a pasta `examples/`, que tem PIX, CPFs e CNPJs fictícios para testar o hover e os comandos.

## Arquitetura

O código segue camadas, com as dependências sempre apontando para dentro:

```
src/
  extension.ts      Composition root: o único lugar que instancia classes concretas
  domain/           Regras puras, sem VS Code nem Node
    shared/         Dígito verificador mod 11, Result, geração aleatória
    documents/      CPF, CNPJ (inclusive alfanumérico) e o registro de documentos
    pix/            CRC16, TLV, decodificação e codificação do BR Code, regras de validação
  application/      Casos de uso: achar tokens na linha, inspecionar, transformar e gerar
  presentation/     Textos em português e renderização em Markdown
  infrastructure/   Implementações que dependem do Node (aleatoriedade segura)
  shared/           Protocolo tipado entre a extensão e o painel da barra lateral
  vscode/           Adaptadores finos: hover, editor, configurações, notificações, comandos e o provider do painel
  webview/          O painel da barra lateral (roda no navegador do VS Code): só desenha e envia pedidos
```

Padrões usados:

- **Strategy + Registry:** cada documento implementa `DocumentType`; para suportar um documento novo, crie a classe e registre no `extension.ts`, sem mexer no resto.
- **Specification:** cada regra do PIX é uma função em `brCodeRules.ts` que devolve os problemas encontrados.
- **Template Method:** os comandos estendem `EditorCommand`, que já trata o caso de não haver editor aberto.
- **Adapter:** o resto do código fala com interfaces (`IEditor`, `ISettings`, `INotifier`); só `src/vscode/` importa a API do VS Code.
- **Result tipado** em vez de exceções para validação, e `RandomSource` injetado para testes determinísticos.
- **Painel como view:** a página da barra lateral não tem regra de negócio. Ela manda mensagens tipadas (`shared/sidebarProtocol.ts`) e a extensão responde com view models prontos (`presentation/sidebarViews.ts`). O HTML usa CSP com nonce e só `textContent`, nunca `innerHTML`.

## Regras dos documentos

| Documento | Regra |
| --- | --- |
| CPF | 9 dígitos + 2 DVs mod 11 (pesos 10→2 e 11→2) |
| CNPJ | 12 posições `[0-9A-Z]` + 2 DVs; valor do caractere = ASCII − 48; pesos 2→9 cíclicos da direita |
| PIS/PASEP | 10 dígitos + DV mod 11 (pesos 3,2,9,8,7,6,5,4,3,2) |
| RENAVAM | 10 dígitos + DV `(soma × 10) mod 11` (mesmos pesos do PIS) |
| CNH | 9 dígitos + 2 DVs; aceita a regra atual e a variante DENATRAN (com o ajuste "dsc") |
| Título de eleitor | 8 sequenciais + UF (01–28) + 2 DVs; aceita também a regra do TSE para SP e MG (resto 0 vira 1) |
| RG (SP) | 8 dígitos + DV (pesos 2→9; 10 vira X, 11 vira 0) |
| CNS | 15 dígitos com soma ponderada (15→1) múltipla de 11; definitivos começam com 1 ou 2, provisórios com 7, 8 ou 9 |
| Placa | `ABC1234` (antiga) ou `ABC1D23` (Mercosul); o 5º caractere converte 0–9 ↔ A–J |
| Cartão | Luhn + bandeira pelo prefixo |
| Boleto bancário | linha de 47 (3 campos mod 10) e barras de 44 (DV geral mod 11, 0/10/11 viram 1); fator de vencimento desde 07/10/1997 e novo ciclo desde 22/02/2025 |
| Boleto de arrecadação | começa com 8; linha de 48 (4 blocos); identificador de valor 6/7 usa mod 10 e 8/9 usa mod 11 |
| PIX | BR Code EMV com CRC16-CCITT-FALSE |

Quando há mais de uma variante conhecida de uma regra, a validação aceita qualquer uma e a geração só produz números válidos em todas.

## Testes e cobertura

- Testes com **Vitest**.
- A cobertura é **100%** em linhas, ramos, funções e statements, e o CI falha se cair.
- Para PIX, boleto e documentos, inclua casos reais de formato (sem dados reais de pessoas) e casos inválidos.

## Commits

Usamos [Conventional Commits](https://www.conventionalcommits.org/pt-br/v1.0.0/), em inglês:

```
feat: decode PIX copy-and-paste codes on hover
fix: accept lowercase letters in alphanumeric CNPJ
docs: explain how to generate test boletos
```

Tipos mais usados: `feat`, `fix`, `docs`, `test`, `refactor`, `ci`, `chore`.

## Pull requests

1. Faça um fork e crie uma branch a partir da `main` (`feat/pix-hover`, `fix/cnpj-alfanumerico`).
2. Escreva o código **com os testes**.
3. Rode a verificação de tipos, os testes e a cobertura.
4. Atualize o `CHANGELOG.md` na seção **Não lançado**.
5. Abra o PR preenchendo o modelo e ligando a issue (`Closes #12`).

Todo PR precisa passar no CI e ser revisado antes do merge.
