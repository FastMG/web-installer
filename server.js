const express = require('express');
const basicAuth = require('basic-auth');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// ─── Configurações ────────────────────────────────────────────────────────────
const machines = require('./config/machines.json');
const packages = require('./config/packages.json');
const PACKAGES_DIR = path.join(__dirname, 'packages');
const LOGS_FILE = path.join(__dirname, 'logs', 'installs.json');

// Credenciais (crie config/credentials.json a partir do .example)
let credentials = { domain: '', username: '', password: '', webUsername: 'admin', webPassword: 'admin' };
try {
  credentials = require('./config/credentials.json');
} catch {
  console.warn('⚠️  credentials.json não encontrado. Usando defaults (admin/admin). Crie o arquivo a partir de credentials.example.json');
}

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.static('views'));

// Autenticação básica no site
app.use((req, res, next) => {
  const user = basicAuth(req);
  if (!user || user.name !== credentials.webUsername || user.pass !== credentials.webPassword) {
    res.set('WWW-Authenticate', 'Basic realm="Web Installer"');
    return res.status(401).send('Acesso negado');
  }
  next();
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
function saveLog(entry) {
  let logs = [];
  try { logs = JSON.parse(fs.readFileSync(LOGS_FILE, 'utf8')); } catch {}
  logs.unshift({ ...entry, date: new Date().toISOString() });
  if (logs.length > 200) logs = logs.slice(0, 200);
  fs.mkdirSync(path.dirname(LOGS_FILE), { recursive: true });
  fs.writeFileSync(LOGS_FILE, JSON.stringify(logs, null, 2));
}

function runRemoteInstall(machine, pkg) {
  return new Promise((resolve, reject) => {
    const installerPath = path.join(PACKAGES_DIR, pkg.installer).replace(/\\/g, '\\\\');
    const args = pkg.args || '';

    const psScript = `
$secPass = ConvertTo-SecureString '${credentials.password}' -AsPlainText -Force
$cred = New-Object System.Management.Automation.PSCredential ('${credentials.domain}\\\\${credentials.username}', $secPass)
Invoke-Command -ComputerName '${machine.ip}' -Credential $cred -ScriptBlock {
  param($installer, $args)
  if (-not (Test-Path $installer)) { throw "Instalador nao encontrado: $installer" }
  $proc = Start-Process -FilePath $installer -ArgumentList $args -Wait -PassThru
  return $proc.ExitCode
} -ArgumentList '${installerPath}', '${args}'
    `.trim();

    const cmd = `powershell -NoProfile -NonInteractive -Command "${psScript.replace(/"/g, '\\"')}"`;

    exec(cmd, { timeout: 120000 }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(stderr || error.message));
      } else {
        const exitCode = parseInt(stdout.trim()) || 0;
        if (exitCode === 0 || exitCode === 3010) {
          resolve(`Instalado com sucesso (exit code ${exitCode})`);
        } else {
          reject(new Error(`Instalação retornou exit code ${exitCode}`));
        }
      }
    });
  });
}

app.get('/api/machines', (req, res) => res.json(machines));
app.get('/api/packages', (req, res) => res.json(packages));

app.get('/api/logs', (req, res) => {
  try {
    const logs = JSON.parse(fs.readFileSync(LOGS_FILE, 'utf8'));
    res.json(logs);
  } catch {
    res.json([]);
  }
});

app.post('/api/install', async (req, res) => {
  const { machineId, packageId } = req.body;

  const machine = machines.find(m => m.id === machineId);
  const pkg = packages.find(p => p.id === packageId);

  if (!machine || !pkg) {
    return res.status(400).json({ success: false, message: 'Máquina ou programa inválido' });
  }

  const installerPath = path.join(PACKAGES_DIR, pkg.installer);
  if (!fs.existsSync(installerPath)) {
    return res.status(400).json({
      success: false,
      message: `Instalador não encontrado: coloque "${pkg.installer}" na pasta packages/`
    });
  }

  console.log(`[${new Date().toLocaleTimeString()}] Instalando ${pkg.name} em ${machine.name} (${machine.ip})...`);

  try {
    const message = await runRemoteInstall(machine, pkg);
    saveLog({ machine: machine.name, ip: machine.ip, package: pkg.name, status: 'sucesso', message });
    res.json({ success: true, message });
  } catch (err) {
    const message = err.message;
    saveLog({ machine: machine.name, ip: machine.ip, package: pkg.name, status: 'erro', message });
    res.status(500).json({ success: false, message });
  }
});

app.listen(PORT, () => {
  console.log(`\n🖥️  Web Installer rodando em http://localhost:${PORT}`);
  console.log(`   Login: ${credentials.webUsername} / ${credentials.webPassword}`);
  console.log(`   Máquinas configuradas: ${machines.length}`);
  console.log(`   Programas disponíveis: ${packages.length}\n`);
});
