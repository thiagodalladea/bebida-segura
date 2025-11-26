require("dotenv").config();

async function main() {
  const contractAddress = process.env.CONTRACT_ADDRESS;

  if (!contractAddress) {
    console.error("CONTRACT_ADDRESS não definido no .env");
    process.exit(1);
  }

  // CONFIGURAÇÃO: Altere o ID do lote ou código externo aqui
  const ID_LOTE = 1;

  console.log("Consultando informações do lote...\n");

  const BebidaSegura = await ethers.getContractFactory("BebidaSegura");
  const contract = BebidaSegura.attach(contractAddress);

  try {
    // Consultar lote
    const lote = await contract.getLote(ID_LOTE);

    console.log("INFORMAÇÕES DO LOTE");
    console.log("════════════════════════════════════════");
    console.log("ID do Lote:", lote.id.toString());
    console.log("Código Externo:", lote.codigoExterno);
    console.log("Produto:", lote.descricaoProduto);
    console.log("Fabricante:", lote.fabricante);
    console.log(
      "Data de Produção:",
      new Date(Number(lote.dataProducao) * 1000).toLocaleString("pt-BR")
    );
    console.log(
      "Estado Atual:",
      ["CRIADO", "EM_ANALISE", "APROVADO", "DISTRIBUIDO", "BLOQUEADO"][
        lote.estadoAtual
      ]
    );
    console.log();

    // Consultar laudo (se houver)
    const laudo = await contract.getLaudo(ID_LOTE);

    if (laudo.realizado) {
      console.log("LAUDO LABORATORIAL");
      console.log("═══════════════════════════════════════=");
      console.log("Realizado:", laudo.realizado ? "Sim" : "Não");
      console.log("Resultado:", laudo.aprovado ? "APROVADO" : "REPROVADO");
      console.log("Teor de Metanol:", laudo.teorMetanolPPM.toString(), "PPM");
      console.log(
        "Limite Permitido:",
        (await contract.constanteLimiteMetanolPPM()).toString(),
        "PPM"
      );
      console.log(
        "Data da Análise:",
        new Date(Number(laudo.dataAnalise) * 1000).toLocaleString("pt-BR")
      );
      console.log("Laboratório:", laudo.laboratorio);
      console.log("Hash do Laudo:", laudo.hashLaudo);
      console.log();
    } else {
      console.log("LAUDO LABORATORIAL");
      console.log("═══════════════════════════════════════=");
      console.log("Laudo ainda não foi registrado");
      console.log();
    }

    // Verificar papéis
    console.log("PAPÉIS NO SISTEMA");
    console.log("════════════════════════════════════════");
    console.log("Owner:", await contract.owner());
    console.log(
      "Limite de Metanol:",
      (await contract.constanteLimiteMetanolPPM()).toString(),
      "PPM"
    );
    console.log(
      "Próximo ID de Lote:",
      (await contract.proximoIdLote()).toString()
    );
  } catch (error) {
    console.error("Erro ao consultar lote:", error.message);
    console.log("\nVerifique se o ID do lote existe.");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Erro:", error);
    process.exit(1);
  });
