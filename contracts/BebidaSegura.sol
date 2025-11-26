// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract BebidaSegura {
    // ENUMS : representa o estado atual de um lote na cadeia
    enum EstadoLote {
        CRIADO,       // 0 - Lote acabou de ser criado pelo fabricante
        EM_ANALISE,   // 1 - Lote enviado para analise de laboratorio
        APROVADO,     // 2 - Lote aprovado dentro do limite de metanol
        DISTRIBUIDO,  // 3 - Lote ja distribuido ao varejo
        BLOQUEADO     // 4 - Lote bloqueado (nao pode mais avancar)
    }

    // STRUCTS : informacoes principais de um lote de bebida
    struct Lote {
        uint256 id;                // ID interno sequencial do lote
        string codigoExterno;      // Codigo no rotulo (ex: QR code), identificador "fisico"
        address fabricante;        // Endereco do fabricante que criou o lote
        uint256 dataProducao;      // Timestamp de producao (ou data aproximada)
        string descricaoProduto;   // Ex: "Vodka X 1L"
        EstadoLote estadoAtual;    // Estado atual na maquina de estados
        bool existe;               // Flag para garantir que o ID eh valido
    }

    // Informacoes do ultimo laudo de laboratorio associado ao lote.
    struct Laudo {
        bool realizado;            // Se ja houve laudo registrado
        bool aprovado;             // Resultado declarado pelo laboratorio
        uint256 dataAnalise;       // Quando o laudo foi registrado (block.timestamp)
        uint256 teorMetanolPPM;    // Teor de metanol (unidade em PPM, por exemplo)
        string hashLaudo;          // Hash do laudo completo (PDF, imagem, etc) armazenado off-chain
        address laboratorio;       // Endereco do laboratorio que registrou o laudo
    }

    // STORAGE (variaveis de estado)
    // Endereco do dono do contrato (admin).
    address public owner;

    // Proximo ID de lote a ser utilizado (comeca em 1).
    uint256 public proximoIdLote = 1;

    // Limite de metanol considerado seguro (em PPM). Pode ser ajustado pelo owner.
    uint256 public constanteLimiteMetanolPPM = 100;

    // Mapeia ID do lote → dados do lote.
    mapping(uint256 => Lote) public lotes;

    // Mapeia ID do lote → ultimo laudo registrado.
    mapping(uint256 => Laudo) public laudosPorLote;

    // Mapeia codigo externo (ex: codigo do rotulo) → ID do lote.
    mapping(string => uint256) public idLotePorCodigoExterno;

    // Controle de papeis
    mapping(address => bool) public isFabricante;
    mapping(address => bool) public isLaboratorio;
    mapping(address => bool) public isDistribuidora;
    mapping(address => bool) public isFiscalizacao;

    // EVENTS (para auditoria e monitoramento)
    event LoteCriado(uint256 indexed id, address indexed fabricante, string codigoExterno);
    event EstadoAlterado(uint256 indexed id, EstadoLote novoEstado);

    event LaudoRegistrado(
        uint256 indexed id,
        address indexed laboratorio,
        bool aprovado,
        uint256 teorMetanolPPM,
        string hashLaudo
    );

    event LoteDistribuido(uint256 indexed id, address indexed distribuidora, string destino);

    event LoteBloqueado(uint256 indexed id, address indexed fiscal, string motivo);

    // Eventos de gestao de papeis
    event FabricanteCadastrado(address fabricante);
    event LaboratorioCadastrado(address laboratorio);
    event DistribuidoraCadastrada(address distribuidora);
    event FiscalizacaoCadastrada(address fiscal);

    event FabricanteRemovido(address fabricante);
    event LaboratorioRemovido(address laboratorio);
    event DistribuidoraRemovida(address distribuidora);
    event FiscalizacaoRemovida(address fiscal);

    event LimiteMetanolAtualizado(uint256 novoLimite);

    // MODIFIERS (regras reutilizaveis)
    modifier onlyOwner() {
        require(msg.sender == owner, "Apenas o owner pode executar.");
        _;
    }

    modifier onlyFabricante() {
        require(isFabricante[msg.sender], "Apenas fabricante autorizado.");
        _;
    }

    modifier onlyLaboratorio() {
        require(isLaboratorio[msg.sender], "Apenas laboratorio autorizado.");
        _;
    }

    modifier onlyDistribuidora() {
        require(isDistribuidora[msg.sender], "Apenas distribuidora autorizada.");
        _;
    }

    modifier onlyFiscalizacao() {
        require(isFiscalizacao[msg.sender], "Apenas fiscalizacao autorizada.");
        _;
    }

    modifier loteExiste(uint256 id) {
        require(lotes[id].existe, "Lote inexistente.");
        _;
    }

    modifier naoBloqueado(uint256 id) {
        require(lotes[id].estadoAtual != EstadoLote.BLOQUEADO, "Lote bloqueado.");
        _;
    }

    // CONSTRUCTOR
    constructor() {
        owner = msg.sender;
    }

    // GESTAO DE PAPEIS (apenas owner)
    function cadastrarFabricante(address _addr) external onlyOwner {
        require(_addr != address(0), "Endereco invalido.");
        require(!isFabricante[_addr], "Ja eh fabricante.");
        isFabricante[_addr] = true;
        emit FabricanteCadastrado(_addr);
    }

    function cadastrarLaboratorio(address _addr) external onlyOwner {
        require(_addr != address(0), "Endereco invalido.");
        require(!isLaboratorio[_addr], "Ja eh laboratorio.");
        isLaboratorio[_addr] = true;
        emit LaboratorioCadastrado(_addr);
    }

    function cadastrarDistribuidora(address _addr) external onlyOwner {
        require(_addr != address(0), "Endereco invalido.");
        require(!isDistribuidora[_addr], "Ja eh distribuidora.");
        isDistribuidora[_addr] = true;
        emit DistribuidoraCadastrada(_addr);
    }

    function cadastrarFiscalizacao(address _addr) external onlyOwner {
        require(_addr != address(0), "Endereco invalido.");
        require(!isFiscalizacao[_addr], "Ja eh fiscalizacao.");
        isFiscalizacao[_addr] = true;
        emit FiscalizacaoCadastrada(_addr);
    }

    function removerFabricante(address _addr) external onlyOwner {
        require(isFabricante[_addr], "Nao eh fabricante.");
        isFabricante[_addr] = false;
        emit FabricanteRemovido(_addr);
    }

    function removerLaboratorio(address _addr) external onlyOwner {
        require(isLaboratorio[_addr], "Nao eh laboratorio.");
        isLaboratorio[_addr] = false;
        emit LaboratorioRemovido(_addr);
    }

    function removerDistribuidora(address _addr) external onlyOwner {
        require(isDistribuidora[_addr], "Nao eh distribuidora.");
        isDistribuidora[_addr] = false;
        emit DistribuidoraRemovida(_addr);
    }

    function removerFiscalizacao(address _addr) external onlyOwner {
        require(isFiscalizacao[_addr], "Nao eh fiscalizacao.");
        isFiscalizacao[_addr] = false;
        emit FiscalizacaoRemovida(_addr);
    }

    function atualizarLimiteMetanol(uint256 _novoLimite) external onlyOwner {
        require(_novoLimite > 0, "Limite precisa ser maior que zero.");
        constanteLimiteMetanolPPM = _novoLimite;
        emit LimiteMetanolAtualizado(_novoLimite);
    }

    // FUNCOES PRINCIPAIS (fluxo do lote)
    function criarLote(
        string calldata _codigoExterno,
        string calldata _descricaoProduto,
        uint256 _dataProducao
    )
        external
        onlyFabricante
        returns (uint256 idLote)
    {
        require(idLotePorCodigoExterno[_codigoExterno] == 0, "Codigo externo ja utilizado.");

        idLote = proximoIdLote;
        proximoIdLote += 1;

        Lote memory novoLote = Lote({
            id: idLote,
            codigoExterno: _codigoExterno,
            fabricante: msg.sender,
            dataProducao: _dataProducao,
            descricaoProduto: _descricaoProduto,
            estadoAtual: EstadoLote.CRIADO,
            existe: true
        });

        lotes[idLote] = novoLote;
        idLotePorCodigoExterno[_codigoExterno] = idLote;

        emit LoteCriado(idLote, msg.sender, _codigoExterno);
        emit EstadoAlterado(idLote, EstadoLote.CRIADO);
    }

    function enviarParaAnalise(uint256 _idLote)
        external
        onlyFabricante
        loteExiste(_idLote)
        naoBloqueado(_idLote)
    {
        Lote storage lote = lotes[_idLote];

        require(lote.fabricante == msg.sender, "Nao eh o fabricante deste lote.");
        require(lote.estadoAtual == EstadoLote.CRIADO, "Estado invalido para analise.");

        lote.estadoAtual = EstadoLote.EM_ANALISE;
        emit EstadoAlterado(_idLote, EstadoLote.EM_ANALISE);
    }

    function registrarLaudo(
        uint256 _idLote,
        uint256 _teorMetanolPPM,
        bool _aprovado,
        string calldata _hashLaudo
    )
        external
        onlyLaboratorio
        loteExiste(_idLote)
        naoBloqueado(_idLote)
    {
        Lote storage lote = lotes[_idLote];

        require(
            lote.estadoAtual == EstadoLote.CRIADO ||
            lote.estadoAtual == EstadoLote.EM_ANALISE,
            "Estado invalido para laudo."
        );

        Laudo storage laudo = laudosPorLote[_idLote];
        laudo.realizado = true;
        laudo.aprovado = _aprovado;
        laudo.dataAnalise = block.timestamp;
        laudo.teorMetanolPPM = _teorMetanolPPM;
        laudo.hashLaudo = _hashLaudo;
        laudo.laboratorio = msg.sender;

        if (_aprovado && _teorMetanolPPM <= constanteLimiteMetanolPPM) {
            lote.estadoAtual = EstadoLote.APROVADO;
            emit EstadoAlterado(_idLote, EstadoLote.APROVADO);
        } else {
            lote.estadoAtual = EstadoLote.BLOQUEADO;
            emit EstadoAlterado(_idLote, EstadoLote.BLOQUEADO);
        }

        emit LaudoRegistrado(
            _idLote,
            msg.sender,
            _aprovado,
            _teorMetanolPPM,
            _hashLaudo
        );
    }

    function registrarDistribuicao(
        uint256 _idLote,
        string calldata _destino
    )
        external
        onlyDistribuidora
        loteExiste(_idLote)
        naoBloqueado(_idLote)
    {
        Lote storage lote = lotes[_idLote];

        require(
            lote.estadoAtual == EstadoLote.APROVADO,
            "Lote nao esta aprovado para distribuicao."
        );

        lote.estadoAtual = EstadoLote.DISTRIBUIDO;

        emit LoteDistribuido(_idLote, msg.sender, _destino);
        emit EstadoAlterado(_idLote, EstadoLote.DISTRIBUIDO);
    }

    function bloquearLote(
        uint256 _idLote,
        string calldata _motivo
    )
        external
        onlyFiscalizacao
        loteExiste(_idLote)
    {
        Lote storage lote = lotes[_idLote];

        require(
            lote.estadoAtual != EstadoLote.BLOQUEADO,
            "Lote ja esta bloqueado."
        );

        lote.estadoAtual = EstadoLote.BLOQUEADO;

        emit LoteBloqueado(_idLote, msg.sender, _motivo);
        emit EstadoAlterado(_idLote, EstadoLote.BLOQUEADO);
    }

    // FUNCOES DE LEITURA AUXILIARES
    function getEstadoLote(uint256 _idLote)
        external
        view
        loteExiste(_idLote)
        returns (EstadoLote)
    {
        return lotes[_idLote].estadoAtual;
    }

    function getLote(uint256 _idLote)
        external
        view
        loteExiste(_idLote)
        returns (
            uint256 id,
            string memory codigoExterno,
            address fabricante,
            uint256 dataProducao,
            string memory descricaoProduto,
            EstadoLote estadoAtual
        )
    {
        Lote storage lote = lotes[_idLote];
        return (
            lote.id,
            lote.codigoExterno,
            lote.fabricante,
            lote.dataProducao,
            lote.descricaoProduto,
            lote.estadoAtual
        );
    }

    function getLaudo(uint256 _idLote)
        external
        view
        loteExiste(_idLote)
        returns (
            bool realizado,
            bool aprovado,
            uint256 dataAnalise,
            uint256 teorMetanolPPM,
            string memory hashLaudo,
            address laboratorio
        )
    {
        Laudo storage laudo = laudosPorLote[_idLote];
        return (
            laudo.realizado,
            laudo.aprovado,
            laudo.dataAnalise,
            laudo.teorMetanolPPM,
            laudo.hashLaudo,
            laudo.laboratorio
        );
    }

    function getIdPorCodigoExterno(string calldata _codigoExterno)
        external
        view
        returns (uint256)
    {
        return idLotePorCodigoExterno[_codigoExterno];
    }

}
