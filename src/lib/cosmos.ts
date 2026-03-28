import { CosmosClient, Database, Container } from "@azure/cosmos";

// ─── Singleton pattern for Cosmos connection ─────────────
let client: CosmosClient | null = null;
let database: Database | null = null;

const CONTAINERS = {
  clients: "clients",
  members: "members",
  claims: "claims",
} as const;

type ContainerName = keyof typeof CONTAINERS;

function getCosmosClient(): CosmosClient {
  if (!client) {
    const endpoint = process.env.COSMOS_ENDPOINT;
    const key = process.env.COSMOS_KEY;

    if (!endpoint || !key) {
      throw new Error(
        "Missing COSMOS_ENDPOINT or COSMOS_KEY environment variables. " +
          "Copy .env.local.example to .env.local and fill in your values."
      );
    }

    client = new CosmosClient({ endpoint, key });
  }
  return client;
}

function getDatabase(): Database {
  if (!database) {
    const dbName = process.env.COSMOS_DATABASE || "polaris";
    database = getCosmosClient().database(dbName);
  }
  return database;
}

export function getContainer(name: ContainerName): Container {
  return getDatabase().container(CONTAINERS[name]);
}

// ─── Database initialization ─────────────────────────────
// Call once on first deploy or via seed script
export async function initializeDatabase(): Promise<void> {
  const cosmosClient = getCosmosClient();
  const dbName = process.env.COSMOS_DATABASE || "polaris";

  // Create database if it doesn't exist
  await cosmosClient.databases.createIfNotExists({ id: dbName });
  const db = cosmosClient.database(dbName);

  // Create containers with partition keys
  const containerConfigs = [
    { id: "clients", partitionKey: "/id" },
    { id: "members", partitionKey: "/clientId" },
    { id: "claims", partitionKey: "/clientId" },
  ];

  for (const config of containerConfigs) {
    await db.containers.createIfNotExists({
      id: config.id,
      partitionKey: { paths: [config.partitionKey] },
    });
  }

  console.log("✓ Database and containers initialized");
}

// ─── Query helper ────────────────────────────────────────
export async function queryItems<T>(
  containerName: ContainerName,
  query: string,
  parameters?: Array<{ name: string; value: unknown }>
): Promise<T[]> {
  const container = getContainer(containerName);
  const { resources } = await container.items
    .query<T>({
      query,
      parameters: parameters || [],
    })
    .fetchAll();
  return resources;
}

// ─── Upsert helper ───────────────────────────────────────
export async function upsertItem<T extends { id: string }>(
  containerName: ContainerName,
  item: T
): Promise<T> {
  const container = getContainer(containerName);
  const { resource } = await container.items.upsert<T>(item);
  return resource as T;
}

export { CONTAINERS };
