require("dotenv").config();

async function main() {
  const contractAddress = process.env.CONTRACT_ADDRESS;

  if (!contractAddress) {
    console.error("CONTRACT_ADDRESS não definido no .env");
    process.exit(1);
  }

  const ID_LOTE = 2;
  const APROVADO = true; // true = aprovado, false = reprovado
  const TEOR_METANOL = 105; // PPM (deve ser <= 100 para ser aprovado)

  console.log("Registrando laudo laboratorial...\n");

  const BebidaSegura = await ethers.getContractFactory("BebidaSegura");
  const contract = BebidaSegura.attach(contractAddress);

  // Obtém a conta do laboratório
  const [laboratorio] = await ethers.getSigners();
  const contractAsLaboratorio = contract.connect(laboratorio);
  console.log("Dados do laudo:");
  console.log("  ID do Lote:", ID_LOTE);
  console.log("  Laboratório:", laboratorio.address);
  console.log("  Teor de Metanol:", TEOR_METANOL, "PPM");
  console.log("  Aprovado:", APROVADO ? "Sim" : "Não");
  console.log(
    "  Limite permitido:",
    (await contract.constanteLimiteMetanolPPM()).toString(),
    "PPM"
  );
  console.log();

  // Verificar estado atual do lote
  const loteAntes = await contract.getLote(ID_LOTE);
  console.log("Estado do lote antes da análise:");
  console.log(
    "  Estado:",
    ["CRIADO", "EM_ANALISE", "APROVADO", "DISTRIBUIDO", "BLOQUEADO"][
      loteAntes.estadoAtual
    ]
  );
  console.log("  Produto:", loteAntes.descricaoProduto);
  console.log();

  // Hash simulado do laudo (em produção, seria hash IPFS ou similar)
  const hashLaudo = `0x${Math.random().toString(36).substring(2)}${Math.random()
    .toString(36)
    .substring(2)}`;

  // Registrar laudo
  console.log("Registrando laudo...");
  const tx = await contractAsLaboratorio.registrarLaudo(
    ID_LOTE,
    TEOR_METANOL,
    APROVADO,
    hashLaudo
  );

  await tx.wait();
  console.log("Laudo registrado com sucesso!");

  // Consultar estado após laudo
  const loteDepois = await contract.getLote(ID_LOTE);
  const laudo = await contract.getLaudo(ID_LOTE);

  console.log("\nEstado do lote após análise:");
  console.log(
    "  Estado:",
    ["CRIADO", "EM_ANALISE", "APROVADO", "DISTRIBUIDO", "BLOQUEADO"][
      loteDepois.estadoAtual
    ]
  );
  console.log("\nDados do laudo:");
  console.log("  Realizado:", laudo.realizado);
  console.log("  Aprovado:", laudo.aprovado);
  console.log("  Teor de Metanol:", laudo.teorMetanolPPM.toString(), "PPM");
  console.log(
    "  Data:",
    new Date(Number(laudo.dataAnalise) * 1000).toLocaleString("pt-BR")
  );
  console.log("  Hash do Laudo:", laudo.hashLaudo);

  if (loteDepois.estadoAtual === 2) {
    console.log("\nLote APROVADO para distribuição!");
    console.log("O teor de metanol está dentro do limite permitido.");
  } else if (loteDepois.estadoAtual === 4) {
    console.log("\nLote BLOQUEADO - teor de metanol acima do permitido!");
    if (laudo.aprovado) {
      console.log(
        "IMPORTANTE: Mesmo com aprovação do laboratório, o smart contract bloqueou automaticamente por segurança (metanol > 100 PPM)."
      );
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Erro:", error);
    process.exit(1);
  });
