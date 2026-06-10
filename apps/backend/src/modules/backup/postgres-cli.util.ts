import { execSync } from "node:child_process";
import * as fs from "node:fs";

export type PgConnection = {
  user: string;
  password: string;
  host: string;
  port: number;
  database: string;
};

const MAX_BUFFER = 512 * 1024 * 1024;

export function parseDatabaseUrl(databaseUrl: string): PgConnection {
  const url = new URL(databaseUrl);
  const database = url.pathname.replace(/^\//, "");
  if (!database) {
    throw new Error("DATABASE_URL tidak memuat nama database");
  }

  return {
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    host: url.hostname,
    port: url.port ? Number(url.port) : 5432,
    database
  };
}

export function pgDumpConnectionUrl(databaseUrl: string): string {
  const conn = parseDatabaseUrl(databaseUrl);
  return `postgresql://${encodeURIComponent(conn.user)}:${encodeURIComponent(conn.password)}@${conn.host}:${conn.port}/${conn.database}`;
}

export function isCommandAvailable(command: string): boolean {
  try {
    execSync(`command -v ${command}`, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

export function isDockerContainerRunning(containerName: string): boolean {
  try {
    const status = execSync(`docker inspect -f "{{.State.Running}}" ${containerName}`, {
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "ignore"]
    }).trim();
    return status === "true";
  } catch {
    return false;
  }
}

export function runPgDumpToFile(
  databaseUrl: string,
  outputPath: string,
  containerName: string
): "local" | "docker" {
  const conn = parseDatabaseUrl(databaseUrl);
  const dumpArgs = `-U ${shellQuote(conn.user)} -d ${shellQuote(conn.database)} --no-owner --no-acl`;

  if (isCommandAvailable("pg_dump")) {
    const cleanUrl = pgDumpConnectionUrl(databaseUrl);
    const output = execSync(`pg_dump ${shellQuote(cleanUrl)} --no-owner --no-acl`, {
      encoding: "buffer",
      maxBuffer: MAX_BUFFER,
      stdio: ["ignore", "pipe", "pipe"]
    });
    fs.writeFileSync(outputPath, output);
    return "local";
  }

  if (isDockerContainerRunning(containerName)) {
    const output = execSync(
      `docker exec -e PGPASSWORD=${shellQuote(conn.password)} ${containerName} pg_dump ${dumpArgs}`,
      {
        encoding: "buffer",
        maxBuffer: MAX_BUFFER,
        stdio: ["ignore", "pipe", "pipe"]
      }
    );
    fs.writeFileSync(outputPath, output);
    return "docker";
  }

  throw new Error("pg_dump tidak tersedia dan container Docker postgres tidak berjalan");
}

export function runPsqlRestoreFromFile(
  databaseUrl: string,
  inputPath: string,
  containerName: string
): "local" | "docker" {
  const conn = parseDatabaseUrl(databaseUrl);
  const sql = fs.readFileSync(inputPath);

  if (isCommandAvailable("psql")) {
    const cleanUrl = pgDumpConnectionUrl(databaseUrl);
    execSync(`psql ${shellQuote(cleanUrl)}`, {
      input: sql,
      stdio: ["pipe", "pipe", "pipe"],
      maxBuffer: MAX_BUFFER
    });
    return "local";
  }

  if (isDockerContainerRunning(containerName)) {
    execSync(
      `docker exec -i -e PGPASSWORD=${shellQuote(conn.password)} ${containerName} psql -U ${shellQuote(conn.user)} -d ${shellQuote(conn.database)}`,
      {
        input: sql,
        stdio: ["pipe", "pipe", "pipe"],
        maxBuffer: MAX_BUFFER
      }
    );
    return "docker";
  }

  throw new Error("psql tidak tersedia dan container Docker postgres tidak berjalan");
}

export function isJsonBackupFile(filePath: string): boolean {
  const sample = fs.readFileSync(filePath, { encoding: "utf-8", flag: "r" }).trimStart();
  return sample.startsWith("{");
}

function shellQuote(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}
