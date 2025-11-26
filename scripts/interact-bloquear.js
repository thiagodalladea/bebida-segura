require("dotenv").config();

async function main() {
  const contractAddress = process.env.CONTRACT_ADDRESS;

  if (!contractAddress) {
    console.error("CONTRACT_ADDRESS não definido no .env");
    process.exit(1);
  }

  const ID_LOTE = 1;
  const MOTIVO =
    "Irregularidade detectada na fiscalização - possível adulteração";

  console.log("Bloqueando lote...\n");

  const BebidaSegura = await ethers.getContractFactory("BebidaSegura");
  const contract = BebidaSegura.attach(contractAddress);

  // Obtém a conta de fiscalização
  const [fiscal] = await ethers.getSigners();
  const contractAsFiscal = contract.connect(fiscal); // Verificar estado atual do lote
  const lote = await contract.getLote(ID_LOTE);
  console.log("  Informações do lote:");
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

  if (lote.estadoAtual === 4) {
    console.log("  Lote já está bloqueado!");
    process.exit(0);
  }

  console.log("  Dados do bloqueio:");
  console.log("  Fiscal:", fiscal.address);
  console.log("  Motivo:", MOTIVO);
  console.log();

  // Bloquear lote
  console.log("  Bloqueando lote...");
  const tx = await contractAsFiscal.bloquearLote(ID_LOTE, MOTIVO);

  await tx.wait();
  console.log("Lote bloqueado com sucesso!");

  // Consultar estado após bloqueio
  const loteDepois = await contract.getLote(ID_LOTE);

  console.log("\nEstado do lote após bloqueio:");
  console.log(
    "  Estado:",
    ["CRIADO", "EM_ANALISE", "APROVADO", "DISTRIBUIDO", "BLOQUEADO"][
      loteDepois.estadoAtual
    ]
  );
  console.log("\nLote bloqueado e não pode mais avançar na cadeia!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Erro:", error);
    process.exit(1);
  });
