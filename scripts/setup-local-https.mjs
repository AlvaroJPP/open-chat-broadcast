import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const certDir = path.join(projectRoot, ".cert");
const caCertFile = path.join(certDir, "ca.crt");
const caKeyFile = path.join(certDir, "ca.key");
const certFile = path.join(certDir, "cert.pem");
const keyFile = path.join(certDir, "key.pem");
const domainsFile = path.join(certDir, "domains.txt");
const isWindows = process.platform === "win32";
const rel = (file) => path.relative(projectRoot, file).replace(/\\/g, "/");

fs.mkdirSync(certDir, { recursive: true });

// IPs de LAN da máquina (o certificado precisa conter o IP usado no navegador,
// senão o HTTPS falha — e sem HTTPS não existe captura de tela em outro PC).
function lanIPs() {
  const ips = [];
  for (const list of Object.values(os.networkInterfaces())) {
    for (const item of list ?? []) {
      if (item.family === "IPv4" && !item.internal) ips.push(item.address);
    }
  }
  return ips;
}

const domains = [
  ...new Set(["localhost", "127.0.0.1", "192.168.1.101", ...lanIPs(), ...(process.env["EXTRA_CERT_DOMAINS"]?.split(",").map((d) => d.trim()).filter(Boolean) ?? [])]),
];
const wanted = domains.join(" ");

const run = (args) => {
  const result = isWindows
    ? spawnSync("cmd.exe", ["/c", `npx --yes mkcert ${args.join(" ")}`], { cwd: projectRoot, stdio: "inherit" })
    : spawnSync("npx", ["--yes", "mkcert", ...args], { cwd: projectRoot, stdio: "inherit" });
  return result.status ?? 1;
};

const caExists = fs.existsSync(caCertFile) && fs.existsSync(caKeyFile);
const certExists = fs.existsSync(certFile) && fs.existsSync(keyFile);
const previous = fs.existsSync(domainsFile) ? fs.readFileSync(domainsFile, "utf8").trim() : "";

if (!caExists) {
  if (run(["create-ca", "--cert", rel(caCertFile), "--key", rel(caKeyFile)]) !== 0) {
    console.error("[HTTPS] Falhou ao criar a autoridade certificadora local.");
    process.exit(1);
  }
}

// Regenera o certificado se não existe OU se o conjunto de IPs/domínios mudou
// (ex.: o roteador deu outro IP para a máquina).
if (!certExists || previous !== wanted) {
  console.log(`[HTTPS] Gerando certificado para: ${wanted}`);
  const status = run([
    "create-cert",
    "--ca-cert", rel(caCertFile),
    "--ca-key", rel(caKeyFile),
    "--cert", rel(certFile),
    "--key", rel(keyFile),
    "--domains", ...domains,
  ]);
  if (status !== 0) {
    console.error("[HTTPS] Falhou ao criar o certificado.");
    process.exit(status);
  }
  fs.writeFileSync(domainsFile, wanted);

  if (isWindows && fs.existsSync(caCertFile)) {
    // ATENÇÃO: barras duplicadas — em template string "\C" vira "C" e o caminho quebrava.
    const importCa = spawnSync(
      "powershell.exe",
      [
        "-NoProfile",
        "-ExecutionPolicy",
        "Bypass",
        "-Command",
        `Import-Certificate -FilePath '${caCertFile}' -CertStoreLocation 'Cert:\\CurrentUser\\Root' | Out-Null`,
      ],
      { cwd: projectRoot, stdio: "inherit" },
    );
    if (importCa.status !== 0) {
      console.warn("[HTTPS] CA criada, mas a instalação no Windows falhou.");
    }
  }
}

console.log("[HTTPS] Certificados prontos em:", certDir);
console.log("[HTTPS] Em OUTROS dispositivos, instale/confie em .cert/ca.crt (ou aceite o aviso do navegador).");
