# Web Installer — Checklist de Implementação

Sistema web para instalação remota de programas via WinRM + PowerShell.

---

## ✅ Concluído

- [x] Estrutura de pastas criada (`views/`, `config/`, `packages/`, `logs/`)
- [x] `CHECKLIST.md` criado e versionado no GitHub

---

## 🔲 A Implementar

### 1. Base do Projeto
- [ ] `package.json` com dependências (express, node-powershell, basic-auth)
- [ ] `server.js` — servidor Express na porta 3000
- [ ] `.gitignore` — ignorar `node_modules/`, `logs/`, `packages/`

### 2. Configuração
- [ ] `config/machines.json` — lista de máquinas com IP, nome e setor
- [ ] `config/packages.json` — lista de programas com nome e comando de instalação
- [ ] `config/credentials.json` — conta de serviço admin (NÃO versionar, só exemplo)

### 3. Frontend (views/index.html)
- [ ] Seletor de máquina (dropdown com nome + IP)
- [ ] Seletor de programa (dropdown com nome + descrição)
- [ ] Botão "Instalar"
- [ ] Área de status em tempo real (loading → sucesso/erro)
- [ ] Tabela de histórico de instalações recentes

### 4. Backend — Rotas Express
- [ ] `GET /` → serve a interface web
- [ ] `GET /api/machines` → retorna lista de máquinas
- [ ] `GET /api/packages` → retorna lista de programas
- [ ] `POST /api/install` → executa instalação remota
- [ ] `GET /api/logs` → retorna histórico de instalações

### 5. Execução Remota (PowerShell/WinRM)
- [ ] Testar conectividade com a máquina alvo (ping)
- [ ] Executar instalador via `Invoke-Command` com credenciais
- [ ] Capturar output e código de saída
- [ ] Tratar erros (máquina offline, sem permissão, instalador não encontrado)

### 6. Logging
- [ ] Salvar cada instalação em `logs/installs.json`
- [ ] Campos: data, máquina, programa, usuário, status, mensagem

### 7. Segurança Básica
- [ ] Autenticação HTTP Basic no servidor (proteger o sistema)
- [ ] Validar inputs antes de passar pro PowerShell (evitar injection)

### 8. Documentação
- [ ] `README.md` com instruções de setup
- [ ] Como habilitar WinRM via GPO
- [ ] Como configurar a conta de serviço admin
- [ ] Como adicionar novas máquinas e programas

---

## 📁 Estrutura Final Esperada

```
web-installer/
├── CHECKLIST.md
├── README.md
├── package.json
├── server.js
├── .gitignore
├── config/
│   ├── machines.json
│   ├── packages.json
│   └── credentials.example.json   ← NÃO versionar credentials.json real
├── packages/
│   └── (coloque os .exe aqui — não versionados)
├── logs/
│   └── installs.json
└── views/
    └── index.html
```
