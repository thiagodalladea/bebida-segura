require("dotenv").config();

async function main() {
  const contractAddress = process.env.CONTRACT_ADDRESS;

  if (!contractAddress) {
    console.error("CONTRACT_ADDRESS não definido no .env");
    console.log("Execute primeiro: npm run deploy");
    process.exit(1);
  }

  console.log("Configurando papéis no contrato BebidaSegura...\n");

  const BebidaSegura = await ethers.getContractFactory("BebidaSegura");
  const contract = BebidaSegura.attach(contractAddress);

  // Obtém o signer (conta que está executando)
  const signers = await ethers.getSigners();
  const owner = signers[0];

  // Em uma rede local Besu, geralmente só temos uma conta
  // Vamos usar a mesma conta para todos os papéis (para demonstração)
  const fabricante = owner;
  const laboratorio = owner;
  const distribuidora = owner;
  const fiscal = owner;

  console.log("Contas disponíveis:");
  console.log("  Total de contas na rede:", signers.length);
  console.log("  Conta principal:", owner.address);
  console.log(
    "  Nota: Usando a mesma conta para todos os papéis (demonstração)"
  );
  console.log();

  // Cadastrar fabricante
  console.log("Cadastrando fabricante...");
  let tx = await contract.cadastrarFabricante(fabricante.address);
  await tx.wait();
  console.log("Fabricante cadastrado");

  // Cadastrar laboratório
  console.log("Cadastrando laboratório...");
  tx = await contract.cadastrarLaboratorio(laboratorio.address);
  await tx.wait();
  console.log("Laboratório cadastrado");

  // Cadastrar distribuidora
  console.log("Cadastrando distribuidora...");
  tx = await contract.cadastrarDistribuidora(distribuidora.address);
  await tx.wait();
  console.log("Distribuidora cadastrada");

  // Cadastrar fiscalização
  console.log("Cadastrando fiscalização...");
  tx = await contract.cadastrarFiscalizacao(fiscal.address);
  await tx.wait();
  console.log("Fiscalização cadastrada");

  console.log("\nSetup completo! Os papéis foram configurados.");
  console.log("\nInformações do contrato:");
  console.log(
    "  Limite de metanol:",
    (await contract.constanteLimiteMetanolPPM()).toString(),
    "PPM"
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Erro:", error);
    process.exit(1);
  });
