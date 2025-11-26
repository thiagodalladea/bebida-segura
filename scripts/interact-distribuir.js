require("dotenv").config();

async function main() {
  const contractAddress = process.env.CONTRACT_ADDRESS;

  if (!contractAddress) {
    console.error("CONTRACT_ADDRESS não definido no .env");
    process.exit(1);
  }

  // CONFIGURAÇÃO: Altere o ID do lote aqui
  const ID_LOTE = 1;
  const DESTINO = "Supermercado São Paulo - SP";

  console.log("Registrando distribuição de lote...\n");

  const BebidaSegura = await ethers.getContractFactory("BebidaSegura");
  const contract = BebidaSegura.attach(contractAddress);

  // Obtém a conta da distribuidora
  const [distribuidora] = await ethers.getSigners();
  const contractAsDistribuidora = contract.connect(distribuidora);

  // Verificar estado atual do lote
  const lote = await contract.getLote(ID_LOTE);
  console.log("Informações do lote:");
  console.log("  ID:", ID_LOTE);
  console.log("  Produto:", lote.descricaoProduto);
  console.log("  Código:", lote.codigoExterno);
  console.log(
    "  Estado atual:",
    ["CRIADO", "EM_ANALISE", "APROVADO", "DISTRIBUIDO", "BLOQUEADO"][
      lote.estadoAtual
    ]
  );
  console.log();

  if (Number(lote.estadoAtual) !== 2) {
    console.error("Lote não está aprovado para distribuição!");
    console.log("O lote precisa estar no estado APROVADO (2)");
    console.log("Estado atual do lote:", Number(lote.estadoAtual));
    process.exit(1);
  }

  console.log("Dados da distribuição:");
  console.log("  Distribuidora:", distribuidora.address);
  console.log("  Destino:", DESTINO);
  console.log();

  // Registrar distribuição
  console.log("Registrando distribuição...");
  const tx = await contractAsDistribuidora.registrarDistribuicao(
    ID_LOTE,
    DESTINO
  );

  await tx.wait();
  console.log("Distribuição registrada com sucesso!");

  // Consultar estado após distribuição
  const loteDepois = await contract.getLote(ID_LOTE);

  console.log("\nEstado do lote após distribuição:");
  console.log(
    "  Estado:",
    ["CRIADO", "EM_ANALISE", "APROVADO", "DISTRIBUIDO", "BLOQUEADO"][
      loteDepois.estadoAtual
    ]
  );
  console.log("\nLote distribuído com sucesso para:", DESTINO);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Erro:", error);
    process.exit(1);
  });
