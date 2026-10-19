# Como contribuir

Obrigado por querer ajudar o Kit Dev Brasil! Este guia explica como o projeto funciona e como enviar sua contribuição.

## Sumário

- [Antes de começar](#antes-de-começar)
- [Ambiente local](#ambiente-local)
- [Arquitetura](#arquitetura)
- [Regras do código](#regras-do-código)
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
