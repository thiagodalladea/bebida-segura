async function main() {
  console.log("Iniciando deploy do contrato BebidaSegura...\n");

  // Obtém o ContractFactory
  const BebidaSegura = await ethers.getContractFactory("BebidaSegura");

  // Faz o deploy
  const contract = await BebidaSegura.deploy();

  // Aguarda a confirmação do deploy
  await contract.waitForDeployment();

  const contractAddress = await contract.getAddress();

  console.log("Contrato BebidaSegura implantado em:", contractAddress);
  console.log("\nAdicione este endereço no seu arquivo .env:");
  console.log(`CONTRACT_ADDRESS=${contractAddress}`);
  console.log("\nOwner do contrato:", await contract.owner());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Erro no deploy:", error);
    process.exit(1);
  });
