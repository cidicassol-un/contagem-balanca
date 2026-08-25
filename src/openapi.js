import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';

const caminhoSpec = fileURLToPath(new URL('../docs/openapi.yaml', import.meta.url));

/** Texto original do contrato OpenAPI (YAML). */
export const specYaml = readFileSync(caminhoSpec, 'utf8');

/** Contrato OpenAPI ja convertido para objeto, usado pelo Swagger UI. */
export const spec = parse(specYaml);
