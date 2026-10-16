// Copia el contrato del API (contracts/api-contract.json en la rama main de adetravel-api) a
// src/contracts/api-contract.json. Úsalo cuando el CI diga que la copia está desactualizada:
//
//     npm run contract:sync
//
// Después revisa el diff y ajusta lo que dependa de lo que cambió (estados del flujo, tipos de
// servicio, permisos, campos que lee la interfaz).
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

export const CONTRACT_URL = "https://raw.githubusercontent.com/yordenis91/adetravel-api/main/contracts/api-contract.json";
const TARGET = fileURLToPath(new URL("../src/contracts/api-contract.json", import.meta.url));

const res = await fetch(CONTRACT_URL);
if (!res.ok) {
  console.error(`No se pudo descargar el contrato (${res.status}) desde ${CONTRACT_URL}`);
  process.exit(1);
}
writeFileSync(TARGET, await res.text());
console.log(`Contrato actualizado en ${TARGET}`);
