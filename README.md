# 🍺 Bebida Segura

Este projeto apresenta um contrato inteligente em Solidity que simula a rastreabilidade de bebidas alcoólicas desde a produção até a distribuição final.
A ideia central é garantir segurança ao consumidor, registrando em blockchain informações sobre fabricação, análise laboratorial e distribuição — tudo de forma transparente, imutável e auditável.

## 💡 Motivação

Recentemente, o Brasil registrou diversos casos de intoxicação por metanol em bebidas alcoólicas adulteradas, resultando em hospitalizações e mortes. Essa situação reacendeu o alerta sobre a fragilidade da cadeia de produção e distribuição de bebidas, especialmente quando não existe transparência entre fabricantes, laboratórios e órgãos de fiscalização.

Diante desse cenário, um sistema baseado em blockchain surge como uma alternativa prática e confiável: cada etapa do ciclo de vida de um lote é registrada de forma imutável, auditável e pública. Isso fortalece a rastreabilidade, dificulta adulterações e aumenta a confiança do consumidor final ao permitir verificar a origem e a qualidade da bebida que está consumindo.

## 🏗️ Arquitetura do Sistema

O contrato `BebidaSegura.sol` implementa uma máquina de estados para rastrear lotes de bebidas:

- **CRIADO**: Lote criado pelo fabricante
- **EM_ANALISE**: Enviado para análise laboratorial
- **APROVADO**: Laudo aprovado, pode ser distribuído
- **DISTRIBUIDO**: Lote já chegou ao varejo
- **BLOQUEADO**: Lote bloqueado (não pode avançar)

### Papéis no Sistema

- **Owner**: Administrador do contrato
- **Fabricante**: Cria lotes de bebidas
- **Laboratório**: Registra laudos de análise
- **Distribuidora**: Registra distribuição
- **Fiscalização**: Pode bloquear lotes

## 📋 Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- [Node.js](https://nodejs.org/) (v18 ou superior)
- [Hyperledger Besu](https://besu.hyperledger.org/) rodando uma rede privada IBFT

## ⚙️ Configuração do Ambiente

### 1. Instalar Dependências

```bash
npm install
```

### 2. Configurar Variáveis de Ambiente

Copie o arquivo de exemplo e configure suas variáveis:

```bash
cp .env.example .env
```

Edite o arquivo `.env` e configure:

- `BESU_RPC_URL`: URL do nó RPC Besu (ex: `http://127.0.0.1:8545`)
- `PRIVATE_KEY`: Chave privada da conta que fará o deploy (encontre em `Node-1/data/key`)
- `CONTRACT_ADDRESS`: Será preenchido após o deploy

### 3. Iniciar a Rede Besu

Certifique-se de que sua rede Besu está rodando. Use o script `commandGenerator.py` para ajudar:

```bash
python commandGenerator.py
```

## 🚀 Deploy e Execução

### 1. Compilar o Contrato

```bash
npm run compile
```

ou

```bash
npx hardhat compile
```

### 2. Deploy do Contrato

```bash
npm run deploy
```

Isso irá:

- Fazer deploy do contrato na rede Besu
- Exibir o endereço do contrato
- Copie o endereço e adicione no arquivo `.env` como `CONTRACT_ADDRESS`

### 3. Configurar Papéis

Após o deploy, configure os papéis no sistema:

```bash
npm run interact:setup
```

Este script cadastra:

- Fabricante
- Laboratório
- Distribuidora
- Fiscalização

## 📝 Scripts de Interação

### Criar um Lote

```bash
npm run interact:lote
```

Cria um novo lote de bebida com:

- Código externo único
- Descrição do produto
- Data de produção

### Registrar Análise Laboratorial

```bash
npm run interact:analise
```

Registra laudo de análise com:

- Teor de metanol (PPM)
- Aprovação/Reprovação
- Hash do laudo

**Edite o script** `scripts/interact-analise.js` para alterar:

- `ID_LOTE`: ID do lote a analisar
- `APROVADO`: true/false
- `TEOR_METANOL`: valor em PPM

### Registrar Distribuição

```bash
npm run interact:distribuir
```

Registra distribuição de um lote aprovado.

**Edite o script** `scripts/interact-distribuir.js` para alterar:

- `ID_LOTE`: ID do lote a distribuir
- `DESTINO`: Destino da distribuição

### Consultar Informações de um Lote

```bash
npm run interact:consultar
```

ou com ID específico:

```bash
npm run interact:consultar -- 1
```

Exibe todas as informações do lote:

- Dados básicos
- Laudo laboratorial
- Estado atual

### Bloquear um Lote (Script Extra)

Além dos scripts no package.json, você pode usar:

```bash
npx hardhat run scripts/interact-bloquear.js --network besu
```

## 🔄 Fluxo Completo de Uso

1. **Deploy e Setup**

   ```bash
   npm run deploy
   # Adicione CONTRACT_ADDRESS no .env
   npm run interact:setup
   ```

2. **Criar Lote**

   ```bash
   npm run interact:lote
   # Anote o ID do lote criado
   ```

3. **Registrar Análise**

   ```bash
   # Edite scripts/interact-analise.js com o ID do lote
   npm run interact:analise
   ```

4. **Distribuir Lote**

   ```bash
   # Edite scripts/interact-distribuir.js com o ID do lote
   npm run interact:distribuir
   ```

5. **Consultar Lote**
   ```bash
   npm run interact:consultar -- 1
   ```

## 📁 Estrutura do Projeto

```
bebida-segura/
├── contracts/
│   └── BebidaSegura.sol      # Contrato inteligente
├── scripts/
│   ├── deploy.js              # Script de deploy
│   ├── interact-setup.js      # Configurar papéis
│   ├── interact-criar-lote.js # Criar lote
│   ├── interact-analise.js    # Registrar laudo
│   ├── interact-distribuir.js # Registrar distribuição
│   ├── interact-consultar.js  # Consultar lote
│   └── interact-bloquear.js   # Bloquear lote
├── hardhat.config.js          # Configuração do Hardhat
├── package.json               # Dependências
├── .env.example               # Template de variáveis
└── README.md                  # Este arquivo
```

## 🛠️ Tecnologias Utilizadas

- **Solidity 0.8.20**: Linguagem do contrato
- **Hardhat**: Framework de desenvolvimento
- **Ethers.js**: Biblioteca para interação com blockchain
- **Hyperledger Besu**: Blockchain privada IBFT
- **Node.js**: Runtime JavaScript

## 📚 Recursos Adicionais

- [Documentação do Hardhat](https://hardhat.org/docs)
- [Documentação do Besu](https://besu.hyperledger.org/)
- [Solidity Docs](https://docs.soliditylang.org/)

## 📄 Licença

MIT
