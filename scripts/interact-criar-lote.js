require("dotenv").config();

async function main() {
  const contractAddress = process.env.CONTRACT_ADDRESS;

  if (!contractAddress) {
    console.error("CONTRACT_ADDRESS não definido no .env");
    process.exit(1);
  }

  console.log("Criando novo lote de bebida...\n");

  const BebidaSegura = await ethers.getContractFactory("BebidaSegura");
  const contract = BebidaSegura.attach(contractAddress);

  // Obtém a conta do fabricante
  const [fabricante] = await ethers.getSigners();
  const contractAsFabricante = contract.connect(fabricante); // Dados do lote
  const codigoExterno = `LOTE-${Date.now()}`;
  const descricao = "Vodka Premium 1L";
  const dataProducao = Math.floor(Date.now() / 1000);

  console.log("Dados do lote:");
  console.log("  Código:", codigoExterno);
  console.log("  Produto:", descricao);
  console.log(
    "  Data de produção:",
    new Date(dataProducao * 1000).toLocaleString("pt-BR")
  );
  console.log("  Fabricante:", fabricante.address);
  console.log();

  // Criar lote
  console.log("Criando lote...");
  const tx = await contractAsFabricante.criarLote(
    codigoExterno,
    descricao,
    dataProducao
  );

  const receipt = await tx.wait();

  // Buscar o evento LoteCriado
  const event = receipt.logs.find((log) => {
    try {
      const parsed = contract.interface.parseLog(log);
      return parsed.name === "LoteCriado";
    } catch {
      return false;
    }
  });

  if (event) {
    const parsed = contract.interface.parseLog(event);
    const idLote = parsed.args.id;

    console.log("Lote criado com sucesso!");
    console.log("  ID do Lote:", idLote.toString());
    console.log("  Código Externo:", codigoExterno);
    console.log("\nUse este ID nos próximos scripts");

    // Consultar o lote
    const lote = await contract.getLote(idLote);
    console.log("\nInformações do lote:");
    console.log(
      "  Estado:",
      ["CRIADO", "EM_ANALISE", "APROVADO", "DISTRIBUIDO", "BLOQUEADO"][
        lote.estadoAtual
      ]
    );
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Erro:", error);
    process.exit(1);
  });
