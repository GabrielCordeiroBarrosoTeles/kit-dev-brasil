# Como contribuir

Obrigado por querer ajudar o Kit Dev Brasil! Este guia explica como o projeto funciona e como enviar sua contribuição.

## Sumário

- [Antes de começar](#antes-de-começar)
- [Ambiente local](#ambiente-local)
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

> O código da primeira versão ainda está sendo escrito. Esta seção será completada com os comandos exatos assim que ele existir.

Você vai precisar de:

- **Node.js 20** ou mais novo
- **VS Code 1.106** ou mais novo

O fluxo será o de qualquer extensão do VS Code: `npm ci`, abrir a pasta no VS Code e apertar **F5** para abrir uma janela de teste com a extensão carregada.

## Regras do código

- **TypeScript** em modo estrito.
- **SOLID** e funções pequenas, com nomes que explicam o que fazem. Prefira nomes claros a comentários.
- Dependências entram pelo construtor, e o código depende de interfaces declaradas em `types.ts`.
- Toda a lógica de PIX, boleto e documentos fica em módulos **puros**, sem depender da API do VS Code, para ser fácil de testar e reaproveitar.
- **Nada de rede** sem o usuário pedir. A consulta de CEP é a única exceção planejada, e sempre opcional.
- Código, nomes e mensagens de commit em **inglês**. Textos que o usuário vê na extensão e a documentação, em **português**.

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
