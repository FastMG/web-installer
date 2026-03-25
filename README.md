# Web Installer

Sistema web simples para instalação remota de programas via WinRM + PowerShell.

## Como funciona

1. Você acessa `http://servidor:3000` no browser
2. Seleciona a máquina e o programa
3. Clica em **Instalar**
4. O servidor executa o instalador remotamente via PowerShell/WinRM

## Requisitos

- **Node.js** 18+
- Rede Windows com **Active Directory**
- **WinRM habilitado** nas máquinas alvo (via GPO)
- Uma **conta de serviço admin** no domínio

---

## Setup

### 1. Instalar dependências
```bash
npm install
```

### 2. Configurar credenciais
```bash
cp config/credentials.example.json config/credentials.json
```
Edite `config/credentials.json` com a conta de serviço admin do domínio.

### 3. Adicionar instaladores
Coloque os `.exe` na pasta `packages/`:
```
packages/
  AnyDesk.exe
  ChromeSetup.exe
```

### 4. Configurar máquinas
Edite `config/machines.json` com os IPs e nomes dos PCs da empresa.

### 5. Iniciar o servidor
```bash
npm start
```
Acesse: `http://localhost:3000`

---

## Habilitar WinRM via GPO (fazer uma vez no AD)

No **Group Policy Management**, crie uma GPO e habilite:

```
Computer Configuration > Policies > Windows Settings >
Security Settings > Windows Firewall > Inbound Rules
→ Windows Remote Management (HTTP-In) — Enable
```

Ou via PowerShell no Domain Controller:
```powershell
# Rodar no DC como admin
Set-GPRegistryValue -Name "WinRM Policy" -Key "HKLM\SOFTWARE\Policies\Microsoft\Windows\WinRM\Service" -ValueName "AllowAutoConfig" -Type DWord -Value 1
```

Forma mais simples — rodar em cada máquina uma vez:
```powershell
Enable-PSRemoting -Force
```

---

## Conta de serviço admin

1. No AD, crie um usuário: `install-svc`
2. Adicione ao grupo **Administrators** local nas máquinas (via GPO)
3. Coloque as credenciais em `config/credentials.json`

---

## Estrutura do projeto

```
web-installer/
├── server.js              ← servidor Express
├── package.json
├── config/
│   ├── machines.json      ← lista de máquinas
│   ├── packages.json      ← lista de programas
│   └── credentials.json    ← credenciais (NÃO versionar!)
├── packages/              ← coloque os .exe aqui
├── logs/
│   └── installs.json       ← histórico de instalações
└── views/
    └── index.html           ← interface web
```
