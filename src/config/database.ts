import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import type { PoolConfig } from "mariadb";
import { PrismaClient } from "../prisma/client";
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required");
}

function createSslConfig(sslMode?: string): PoolConfig["ssl"] {
  switch (sslMode?.toLowerCase()) {
    case "required":
      // MySQL ssl-mode=REQUIRED encrypts the connection without verifying CA identity.
      return { rejectUnauthorized: false };
    case "verify_ca":
    case "verify-ca":
    case "verify_identity":
    case "verify-identity":
      return true;
    default:
      return undefined;
  }
}

function createDatabaseConfig(connectionString: string): PoolConfig {
  const url = new URL(connectionString);

  if (url.protocol !== "mysql:" ) {
    throw new Error("DATABASE_URL must use mysql://");
  }

  return {
    host: url.hostname,
    port: url.port ? Number(url.port) : 3306,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.replace(/^\//, "") || undefined,
    ssl: createSslConfig(url.searchParams.get("ssl-mode") ?? undefined),
  };
}

const connectionConfig = createDatabaseConfig(databaseUrl);
const adapter = new PrismaMariaDb(connectionConfig);

export const prisma = new PrismaClient({ adapter });

export async function connectDatabase(): Promise<void> {
  await prisma.$connect();
  console.log("MySQL database connected");
}

export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
}
