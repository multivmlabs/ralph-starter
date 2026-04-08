# LinkedIn: Spec Driven Development com ralph-starter

## Formato
- Artigo longo no LinkedIn
- Idioma: Portugues brasileiro
- Tom: Profissional, direto, com exemplos praticos
- Publico: Devs brasileiros, tech leads, CTOs

---

## Titulo

Spec Driven Development: por que voce deveria parar de mandar "faz um CRUD" pro agente de IA

---

## Corpo

Nos ultimos meses eu vi uma mudanca silenciosa na forma como devs usam agentes de IA pra codar.

No comeco, todo mundo fazia a mesma coisa: abria o chat, escrevia "cria uma API de autenticacao", rezava, e torcia pro resultado fazer sentido. As vezes dava certo. Na maioria das vezes, nao.

O problema nunca foi o agente. O problema era a especificacao -- ou melhor, a falta dela.

Isso tem nome agora: Spec Driven Development (SDD).

A ideia e simples: antes de codar, voce escreve uma spec clara. Nao um documento de 50 paginas. Uma spec de 10-20 linhas que diz exatamente o que precisa ser feito, como validar, e quais sao os criterios de aceite.

Tem tres ferramentas ganhando tracao nesse espaco:

- **OpenSpec** (Fission AI) -- framework leve e tool-agnostic. Voce cria uma pasta openspec/ com proposal.md, design.md, tasks.md, e specs com keywords RFC 2119 (SHALL, MUST, SHOULD).

- **Spec-Kit** (GitHub) -- mais pesado, com 5 fases (constituicao, especificacao, planejamento, tarefas, implementacao). Bom pra projetos grandes.

- **Kiro** (AWS) -- IDE completa com agentes integrados. Poderoso, mas locked no ecossistema AWS.

Eu construi o ralph-starter justamente pra resolver esse gap. Ele puxa specs de qualquer lugar -- GitHub Issues, Linear, Notion, Figma, OpenSpec -- e roda loops autonomos de codificacao ate a tarefa estar completa.

O fluxo e assim:

```
Spec -> Plano de implementacao -> Agente codifica -> Lint/Build/Testes -> Se falhou, alimenta o erro de volta -> Repete -> Commit + PR
```

Na v0.5.0 a gente adicionou suporte nativo a OpenSpec:

```bash
# Ler specs de um diretorio OpenSpec
ralph-starter run --from openspec:minha-feature

# Validar completude da spec antes de rodar
ralph-starter run --from openspec:minha-feature --spec-validate

# Listar specs disponiveis
ralph-starter spec list

# Validar todas as specs do projeto
ralph-starter spec validate
```

O `--spec-validate` checa se sua spec tem:
- Uma secao de proposta/racional (por que?)
- Keywords RFC 2119 (SHALL, MUST)
- Criterios de aceite (Given/When/Then)
- Design e tasks

E retorna um score de 0 a 100. Se a spec estiver incompleta, o ralph-starter avisa antes de gastar tokens.

O resultado pratico: specs claras = menos iteracoes = menos custo = PRs melhores.

Eu costumava gastar 5 loops e $3+ pra resolver uma tarefa mal especificada. Agora gasto 3 minutos escrevendo uma spec boa e 2 loops resolvem. O custo cai pra ~$0.50.

Se voce esta usando qualquer agente de IA pra codar -- Claude Code, Cursor, Copilot, o que for -- comeca a escrever specs. Serio. E a maior alavanca de produtividade que voce vai encontrar esse ano.

ralph-starter e open source, MIT licensed:
https://github.com/multivmlabs/ralph-starter

---

## Hashtags
#SpecDrivenDevelopment #AICoding #OpenSource #DevTools #ralph-starter #OpenSpec #SDD
