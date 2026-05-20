# Criação JSON — Unilog Express

Ferramenta web para geração e conversão de JSONs de documentos (entrada e saída) para envio ao WMS da Unilog Express.

**Acesso:** https://randreatta.github.io/gerar-json-unilog/

---

## O que é

A ferramenta substitui a criação manual de payloads JSON exigidos pela API do WMS. A partir de um formulário simples, ela monta o JSON no formato correto para documentos de **entrada (Inbound)** e **saída (Outbound)**.

---

## Funcionalidades

### Gerar JSON
Preencha os dados do documento e clique em **Gerar JSON**:

| Campo | Descrição |
|---|---|
| Tipo de Movimentação | Entrada (Inbound) ou Saída (Outbound) |
| CNPJ/CPF Empresa | CNPJ ou CPF do depositante (14 ou 11 dígitos, sem formatação) |
| Código Estabelecimento | Código do estabelecimento no WMS (padrão: 8) |
| Tipo Documento | CINV, NFE ou NFS |
| Série / Número Documento | Identificação do documento |
| Natureza Operação | Descrição da operação (padrão: SEM VALOR FISCAL) |
| Informação Adicional | Observações do documento |

**Produtos** podem ser adicionados manualmente ou importados via planilha Excel (ver seção abaixo).

Ao clicar em **Gerar JSON**, o payload é gerado e salvo automaticamente no Histórico.

---

### Payload
Exibe o JSON gerado. Clique em **Converter JSON** para transformar no formato final da API 2.0 e copiar para a área de transferência.

---

### Importar Produtos via Planilha

Importe os produtos de um arquivo `.xlsx` em vez de cadastrá-los um a um.

**Colunas esperadas na planilha (linha 1):**

| Coluna | Campo |
|---|---|
| A | codigoProduto |
| B | quantidadeMovimento |
| C | tipoUc |
| D | fatorTipoUc |
| E | classeProduto |
| F | valorUnitario |
| G | tipoLogistico |
| H | dadoLogistico |

> `tipoLogistico = 3` exige preenchimento do campo `dadoLogistico` (lote).

---

### Depositantes

Cadastro dos depositantes (clientes) utilizados nos documentos de entrada.

**Importação em massa via planilha Excel:**

| Coluna da planilha | Campo |
|---|---|
| Empresa | CNPJ/CPF * |
| Descrição Empresa | Nome * |
| Endereço | Endereço |
| Número | Número |
| Bairro | Bairro |
| CEP | CEP |
| Município | Cidade |
| UF | Estado |
| Tipo Pessoa Empresa | Tipo (J = Jurídica / F = Física) |

**Compartilhar cadastro com outra pessoa:**
1. Clique em **Exportar JSON** — baixa o arquivo `depositantes.json`
2. Envie o arquivo para a outra pessoa
3. A outra pessoa abre a ferramenta, vai em **Depositantes** e clica em **Importar JSON**

> Os dados ficam salvos localmente no navegador (`localStorage`). Cada computador/navegador tem seu próprio armazenamento.

---

### Transportadoras

Cadastro das transportadoras utilizadas nos documentos de saída (Outbound).

Suporta exportação e importação em JSON da mesma forma que os depositantes.

---

### Histórico

Todos os JSONs gerados ficam salvos automaticamente (até 100 registros). É possível expandir, copiar ou excluir entradas individualmente, ou limpar todo o histórico.

---

## Como rodar localmente

**Pré-requisitos:** Node.js 20+

```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev

# Gerar build de produção
npm run build
```

---

## Deploy

O deploy é feito **manualmente** via GitHub Actions.

1. Acesse o repositório: https://github.com/randreatta/gerar-json-unilog
2. Vá em **Actions** → **Deploy to GitHub Pages**
3. Clique em **Run workflow** → **Run workflow**

> O site só é atualizado quando o deploy for disparado manualmente. Commits na branch `main` atualizam apenas o código no repositório.

---

## Tecnologias

- [React 18](https://react.dev/) + [Vite](https://vitejs.dev/)
- [Tailwind CSS v3](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/)
- [xlsx](https://www.npmjs.com/package/xlsx) — leitura de planilhas Excel
- [sonner](https://sonner.emilkowal.ski/) — notificações toast
- GitHub Pages — hospedagem
