import crypto from "node:crypto";
import net from "node:net";
import tls from "node:tls";
import { createDurableCustomerAccountStore, CUSTOMER_ACCOUNT_SCHEMA_VERSION } from "./service.js";

export const POSTGRES_ACCOUNT_STORE_ADAPTER = "postgres-v1";
export const POSTGRES_ACCOUNT_STORE_KEY = "katherines-eye-account-schema-2";
export const POSTGRES_DURABLE_PERSISTENCE = Object.freeze({
  adapter: POSTGRES_ACCOUNT_STORE_ADAPTER,
  kind: "durable_compare_and_swap",
  schemaVersion: CUSTOMER_ACCOUNT_SCHEMA_VERSION,
  atomicOwnershipMutations: true,
  retentionCleanup: true,
  sharedAuthenticationThrottle: true
});

const CONNECTION_TIMEOUT_MILLISECONDS = 8_000;
const QUERY_TIMEOUT_MILLISECONDS = 8_000;
const MAX_DATABASE_URL_BYTES = 4_096;
const MAX_QUERY_BYTES = 64 * 1024;
const MAX_PARAMETER_BYTES = 32 * 1024 * 1024;
const MAX_STATE_BYTES = 24 * 1024 * 1024;
const SCRAM_MINIMUM_ITERATIONS = 4_096;
const SCRAM_MAXIMUM_ITERATIONS = 1_000_000;

const INITIALIZE_SQL = `CREATE TABLE IF NOT EXISTS katherine_eye_customer_account_state (
  store_key text PRIMARY KEY,
  schema_version text NOT NULL,
  revision bigint NOT NULL CHECK (revision >= 0),
  state_json jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
)`;
const READ_SQL = `SELECT schema_version, revision::text AS revision, state_json::text AS state_json
FROM katherine_eye_customer_account_state
WHERE store_key = $1`;
const INSERT_SQL = `INSERT INTO katherine_eye_customer_account_state
  (store_key, schema_version, revision, state_json, updated_at)
VALUES ($1, $2, $3::bigint, $4::jsonb, CURRENT_TIMESTAMP)
ON CONFLICT (store_key) DO NOTHING
RETURNING revision::text AS revision`;
const UPDATE_SQL = `UPDATE katherine_eye_customer_account_state
SET schema_version = $2, revision = $4::bigint, state_json = $5::jsonb, updated_at = CURRENT_TIMESTAMP
WHERE store_key = $1 AND schema_version IN ($2, $6, $7) AND revision = $3::bigint
RETURNING revision::text AS revision`;

const POSTGRES_COMPATIBLE_SCHEMA_VERSIONS = new Set(["1.0", CUSTOMER_ACCOUNT_SCHEMA_VERSION]);

function storageError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function parseDatabaseUrl(value) {
  const text = String(value || "").trim();
  if (!text || Buffer.byteLength(text, "utf8") > MAX_DATABASE_URL_BYTES) {
    throw storageError("customer_account_postgres_configuration_invalid", "PostgreSQL account storage is incompletely configured.");
  }
  let url;
  try {
    url = new URL(text);
  } catch {
    throw storageError("customer_account_postgres_configuration_invalid", "PostgreSQL account storage is incompletely configured.");
  }
  if (!["postgres:", "postgresql:"].includes(url.protocol) || !url.hostname || !url.username || !url.password || !url.pathname || url.pathname === "/" || url.hash) {
    throw storageError("customer_account_postgres_configuration_invalid", "PostgreSQL account storage is incompletely configured.");
  }
  const sslMode = String(url.searchParams.get("sslmode") || "require").toLowerCase();
  if (!["require", "verify-ca", "verify-full"].includes(sslMode)) {
    throw storageError("customer_account_postgres_tls_required", "PostgreSQL account storage requires verified TLS.");
  }
  const port = url.port ? Number(url.port) : 5432;
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw storageError("customer_account_postgres_configuration_invalid", "PostgreSQL account storage is incompletely configured.");
  }
  try {
    const user = decodeURIComponent(url.username);
    const password = decodeURIComponent(url.password);
    const database = decodeURIComponent(url.pathname.slice(1));
    if (!user || !password || !database || Buffer.byteLength(user, "utf8") > 256 || Buffer.byteLength(database, "utf8") > 256) throw new Error("invalid");
    return { host: url.hostname.replace(/^\[|\]$/g, ""), port, user, password, database };
  } catch {
    throw storageError("customer_account_postgres_configuration_invalid", "PostgreSQL account storage is incompletely configured.");
  }
}

function int16(value) {
  const buffer = Buffer.allocUnsafe(2);
  buffer.writeInt16BE(value, 0);
  return buffer;
}

function int32(value) {
  const buffer = Buffer.allocUnsafe(4);
  buffer.writeInt32BE(value, 0);
  return buffer;
}

function cstring(value) {
  const bytes = Buffer.from(String(value), "utf8");
  if (bytes.includes(0)) throw storageError("customer_account_postgres_protocol_error", "PostgreSQL account storage received an invalid protocol value.");
  return Buffer.concat([bytes, Buffer.from([0])]);
}

function typedMessage(type, payload = Buffer.alloc(0)) {
  return Buffer.concat([Buffer.from(type, "ascii"), int32(payload.length + 4), payload]);
}

function readCString(buffer, start) {
  const end = buffer.indexOf(0, start);
  if (end < 0) throw storageError("customer_account_postgres_protocol_error", "PostgreSQL account storage received an invalid protocol response.");
  return { value: buffer.subarray(start, end).toString("utf8"), offset: end + 1 };
}

class MessageReader {
  constructor(stream) {
    this.stream = stream;
    this.buffer = Buffer.alloc(0);
    this.pending = [];
    this.failure = null;
    this.onData = (chunk) => {
      this.buffer = Buffer.concat([this.buffer, Buffer.from(chunk)]);
      this.flush();
    };
    this.onError = () => {
      this.failure = storageError("customer_account_postgres_unavailable", "PostgreSQL account storage is unavailable.");
      this.flush();
    };
    this.onEnd = this.onError;
    stream.on("data", this.onData);
    stream.on("error", this.onError);
    stream.on("end", this.onEnd);
    stream.on("close", this.onEnd);
  }

  detach() {
    this.stream.off("data", this.onData);
    this.stream.off("error", this.onError);
    this.stream.off("end", this.onEnd);
    this.stream.off("close", this.onEnd);
  }

  flush() {
    while (this.pending.length) {
      const pending = this.pending[0];
      if (this.failure) {
        this.pending.shift();
        pending.reject(this.failure);
      } else if (this.buffer.length >= pending.length) {
        this.pending.shift();
        const value = this.buffer.subarray(0, pending.length);
        this.buffer = this.buffer.subarray(pending.length);
        pending.resolve(value);
      } else {
        break;
      }
    }
  }

  read(length) {
    if (this.failure) return Promise.reject(this.failure);
    if (this.buffer.length >= length) {
      const value = this.buffer.subarray(0, length);
      this.buffer = this.buffer.subarray(length);
      return Promise.resolve(value);
    }
    return new Promise((resolve, reject) => {
      this.pending.push({ length, resolve, reject });
    });
  }

  async message() {
    const header = await this.read(5);
    const length = header.readInt32BE(1);
    if (length < 4 || length > MAX_PARAMETER_BYTES + 1024) {
      throw storageError("customer_account_postgres_protocol_error", "PostgreSQL account storage received an invalid protocol response.");
    }
    return { type: header.subarray(0, 1).toString("ascii"), payload: await this.read(length - 4) };
  }
}

function write(stream, bytes) {
  return new Promise((resolve, reject) => {
    stream.write(bytes, (error) => error ? reject(storageError("customer_account_postgres_unavailable", "PostgreSQL account storage is unavailable.")) : resolve());
  });
}

function parseServerError(payload) {
  const fields = {};
  let offset = 0;
  while (offset < payload.length && payload[offset] !== 0) {
    const code = String.fromCharCode(payload[offset]);
    const field = readCString(payload, offset + 1);
    fields[code] = field.value;
    offset = field.offset;
  }
  return storageError(
    fields.C === "23505" ? "customer_account_postgres_conflict" : "customer_account_postgres_query_failed",
    "PostgreSQL account storage could not complete the operation."
  );
}

function parseScramFields(value) {
  const fields = {};
  for (const part of String(value).split(",")) {
    const separator = part.indexOf("=");
    if (separator !== 1 || fields[part[0]] !== undefined) {
      throw storageError("customer_account_postgres_authentication_failed", "PostgreSQL account storage authentication failed.");
    }
    fields[part[0]] = part.slice(2);
  }
  return fields;
}

function hmac(key, value) {
  return crypto.createHmac("sha256", key).update(value).digest();
}

async function authenticate(stream, reader, configuration) {
  let scram = null;
  let authenticated = false;
  while (true) {
    const message = await reader.message();
    if (message.type === "E") throw parseServerError(message.payload);
    if (message.type === "R") {
      if (message.payload.length < 4) throw storageError("customer_account_postgres_protocol_error", "PostgreSQL account storage received an invalid authentication response.");
      const code = message.payload.readInt32BE(0);
      if (code === 0) {
        authenticated = true;
        continue;
      }
      if (code === 5) {
        if (message.payload.length !== 8) throw storageError("customer_account_postgres_protocol_error", "PostgreSQL account storage received an invalid authentication response.");
        const inner = crypto.createHash("md5").update(`${configuration.password}${configuration.user}`).digest("hex");
        const response = `md5${crypto.createHash("md5").update(Buffer.concat([Buffer.from(inner), message.payload.subarray(4)])).digest("hex")}`;
        await write(stream, typedMessage("p", cstring(response)));
        continue;
      }
      if (code === 10) {
        const mechanisms = message.payload.subarray(4).toString("utf8").split("\0").filter(Boolean);
        if (!mechanisms.includes("SCRAM-SHA-256")) throw storageError("customer_account_postgres_authentication_failed", "PostgreSQL account storage authentication failed.");
        const clientNonce = crypto.randomBytes(24).toString("base64url");
        const escapedUser = configuration.user.replace(/=/g, "=3D").replace(/,/g, "=2C");
        const clientFirstBare = `n=${escapedUser},r=${clientNonce}`;
        const clientFirst = `n,,${clientFirstBare}`;
        scram = { clientNonce, clientFirstBare };
        await write(stream, typedMessage("p", Buffer.concat([cstring("SCRAM-SHA-256"), int32(Buffer.byteLength(clientFirst)), Buffer.from(clientFirst)])));
        continue;
      }
      if (code === 11 && scram) {
        const serverFirst = message.payload.subarray(4).toString("utf8");
        const fields = parseScramFields(serverFirst);
        const iterations = Number(fields.i);
        let salt;
        const saltText = String(fields.s || "");
        try {
          salt = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(saltText)
            ? Buffer.from(saltText, "base64")
            : Buffer.alloc(0);
        } catch {
          salt = Buffer.alloc(0);
        }
        if (!fields.r?.startsWith(scram.clientNonce) || fields.r.length <= scram.clientNonce.length || !Number.isInteger(iterations)
          || iterations < SCRAM_MINIMUM_ITERATIONS || iterations > SCRAM_MAXIMUM_ITERATIONS || salt.length < 8 || salt.length > 1024) {
          throw storageError("customer_account_postgres_authentication_failed", "PostgreSQL account storage authentication failed.");
        }
        const clientFinalWithoutProof = `c=biws,r=${fields.r}`;
        const authMessage = `${scram.clientFirstBare},${serverFirst},${clientFinalWithoutProof}`;
        const saltedPassword = crypto.pbkdf2Sync(configuration.password, salt, iterations, 32, "sha256");
        const clientKey = hmac(saltedPassword, "Client Key");
        const storedKey = crypto.createHash("sha256").update(clientKey).digest();
        const clientSignature = hmac(storedKey, authMessage);
        const proof = Buffer.allocUnsafe(clientKey.length);
        for (let index = 0; index < proof.length; index += 1) proof[index] = clientKey[index] ^ clientSignature[index];
        scram.serverSignature = hmac(hmac(saltedPassword, "Server Key"), authMessage).toString("base64");
        const response = `${clientFinalWithoutProof},p=${proof.toString("base64")}`;
        await write(stream, typedMessage("p", Buffer.from(response)));
        continue;
      }
      if (code === 12 && scram?.serverSignature) {
        const fields = parseScramFields(message.payload.subarray(4).toString("utf8"));
        const expected = Buffer.from(scram.serverSignature, "utf8");
        const supplied = Buffer.from(String(fields.v || ""), "utf8");
        if (fields.e || supplied.length !== expected.length || !crypto.timingSafeEqual(supplied, expected)) {
          throw storageError("customer_account_postgres_authentication_failed", "PostgreSQL account storage authentication failed.");
        }
        continue;
      }
      throw storageError("customer_account_postgres_authentication_failed", "PostgreSQL account storage authentication failed.");
    }
    if (message.type === "Z") {
      if (!authenticated || message.payload.length !== 1 || message.payload[0] !== 73) {
        throw storageError("customer_account_postgres_protocol_error", "PostgreSQL account storage did not enter an idle state.");
      }
      return;
    }
  }
}

function parseRowDescription(payload) {
  if (payload.length < 2) throw storageError("customer_account_postgres_protocol_error", "PostgreSQL account storage returned an invalid row description.");
  const count = payload.readInt16BE(0);
  const names = [];
  let offset = 2;
  for (let index = 0; index < count; index += 1) {
    const name = readCString(payload, offset);
    offset = name.offset + 18;
    if (offset > payload.length) throw storageError("customer_account_postgres_protocol_error", "PostgreSQL account storage returned an invalid row description.");
    names.push(name.value);
  }
  if (offset !== payload.length) throw storageError("customer_account_postgres_protocol_error", "PostgreSQL account storage returned an invalid row description.");
  return names;
}

function parseDataRow(payload, names) {
  if (payload.length < 2) throw storageError("customer_account_postgres_protocol_error", "PostgreSQL account storage returned an invalid data row.");
  const count = payload.readInt16BE(0);
  if (count !== names.length) throw storageError("customer_account_postgres_protocol_error", "PostgreSQL account storage returned an invalid data row.");
  const row = {};
  let offset = 2;
  for (let index = 0; index < count; index += 1) {
    if (offset + 4 > payload.length) throw storageError("customer_account_postgres_protocol_error", "PostgreSQL account storage returned an invalid data row.");
    const length = payload.readInt32BE(offset);
    offset += 4;
    if (length === -1) {
      row[names[index]] = null;
    } else {
      if (length < 0 || offset + length > payload.length) throw storageError("customer_account_postgres_protocol_error", "PostgreSQL account storage returned an invalid data row.");
      row[names[index]] = payload.subarray(offset, offset + length).toString("utf8");
      offset += length;
    }
  }
  if (offset !== payload.length) throw storageError("customer_account_postgres_protocol_error", "PostgreSQL account storage returned an invalid data row.");
  return row;
}

async function executeQuery(stream, reader, sql, parameters = []) {
  if (Buffer.byteLength(sql, "utf8") > MAX_QUERY_BYTES || !Array.isArray(parameters)) {
    throw storageError("customer_account_postgres_query_invalid", "PostgreSQL account storage received an invalid query.");
  }
  const encodedParameters = parameters.map((value) => value == null ? null : Buffer.from(String(value), "utf8"));
  if (encodedParameters.reduce((total, value) => total + (value?.length || 0), 0) > MAX_PARAMETER_BYTES) {
    throw storageError("customer_account_postgres_state_too_large", "PostgreSQL account storage state exceeds its safe limit.");
  }
  const bindParts = [Buffer.from([0, 0]), int16(0), int16(encodedParameters.length)];
  for (const parameter of encodedParameters) bindParts.push(parameter == null ? int32(-1) : Buffer.concat([int32(parameter.length), parameter]));
  bindParts.push(int16(0));
  await write(stream, Buffer.concat([
    typedMessage("P", Buffer.concat([Buffer.from([0]), cstring(sql), int16(0)])),
    typedMessage("B", Buffer.concat(bindParts)),
    typedMessage("D", Buffer.from([80, 0])),
    typedMessage("E", Buffer.alloc(5)),
    typedMessage("S")
  ]));
  let names = [];
  const rows = [];
  let command = "";
  let failure = null;
  while (true) {
    const message = await reader.message();
    if (message.type === "T") names = parseRowDescription(message.payload);
    else if (message.type === "D") rows.push(parseDataRow(message.payload, names));
    else if (message.type === "C") command = readCString(message.payload, 0).value;
    else if (message.type === "E") failure = parseServerError(message.payload);
    else if (message.type === "Z") {
      if (failure) throw failure;
      const match = command.match(/(?:^|\s)(\d+)$/);
      return { rows, rowCount: match ? Number(match[1]) : 0, command };
    }
  }
}

async function connectPostgres(configuration) {
  const plain = net.createConnection({ host: configuration.host, port: configuration.port });
  plain.setTimeout(CONNECTION_TIMEOUT_MILLISECONDS);
  await new Promise((resolve, reject) => {
    plain.once("connect", resolve);
    plain.once("error", reject);
    plain.once("timeout", () => reject(new Error("timeout")));
  }).catch(() => {
    plain.destroy();
    throw storageError("customer_account_postgres_unavailable", "PostgreSQL account storage is unavailable.");
  });
  const sslReader = new MessageReader(plain);
  await write(plain, Buffer.concat([int32(8), int32(80877103)]));
  const sslResponse = await sslReader.read(1);
  sslReader.detach();
  if (sslResponse[0] !== 83) {
    plain.destroy();
    throw storageError("customer_account_postgres_tls_required", "PostgreSQL account storage requires verified TLS.");
  }
  const secure = tls.connect({
    socket: plain,
    servername: net.isIP(configuration.host) ? undefined : configuration.host,
    rejectUnauthorized: true,
    minVersion: "TLSv1.2"
  });
  await new Promise((resolve, reject) => {
    secure.once("secureConnect", resolve);
    secure.once("error", reject);
    secure.once("timeout", () => reject(new Error("timeout")));
  }).catch(() => {
    secure.destroy();
    throw storageError("customer_account_postgres_tls_failed", "PostgreSQL account storage TLS verification failed.");
  });
  secure.setTimeout(QUERY_TIMEOUT_MILLISECONDS, () => secure.destroy(new Error("PostgreSQL query timeout.")));
  const reader = new MessageReader(secure);
  const startupParameters = Buffer.concat([
    cstring("user"), cstring(configuration.user),
    cstring("database"), cstring(configuration.database),
    cstring("client_encoding"), cstring("UTF8"),
    cstring("application_name"), cstring("katherines-eye-preview"),
    Buffer.from([0])
  ]);
  await write(secure, Buffer.concat([int32(startupParameters.length + 8), int32(196608), startupParameters]));
  await authenticate(secure, reader, configuration);
  return {
    query: (sql, parameters) => executeQuery(secure, reader, sql, parameters),
    async close() {
      await write(secure, typedMessage("X")).catch(() => {});
      reader.detach();
      secure.end();
    }
  };
}

export function createPostgresQuery(databaseUrl) {
  const configuration = parseDatabaseUrl(databaseUrl);
  return async function query(sql, parameters = []) {
    let connection;
    try {
      connection = await connectPostgres(configuration);
      return await connection.query(sql, parameters);
    } catch (error) {
      if (String(error?.code || "").startsWith("customer_account_postgres_")) throw error;
      throw storageError("customer_account_postgres_unavailable", "PostgreSQL account storage is unavailable.");
    } finally {
      await connection?.close().catch(() => {});
    }
  };
}

function parseSnapshotRow(row) {
  if (!row || !POSTGRES_COMPATIBLE_SCHEMA_VERSIONS.has(row.schema_version)) {
    throw storageError("customer_account_postgres_schema_mismatch", "PostgreSQL account storage schema is incompatible.");
  }
  const revision = Number(row.revision);
  if (!Number.isSafeInteger(revision) || revision < 0) {
    throw storageError("customer_account_postgres_corrupt", "PostgreSQL account storage state is corrupt.");
  }
  let snapshot;
  try {
    snapshot = JSON.parse(String(row.state_json || ""));
  } catch {
    throw storageError("customer_account_postgres_corrupt", "PostgreSQL account storage state is corrupt.");
  }
  if (!snapshot || typeof snapshot !== "object" || Array.isArray(snapshot)
    || snapshot.schemaVersion !== row.schema_version || snapshot.revision !== revision) {
    throw storageError("customer_account_postgres_corrupt", "PostgreSQL account storage state is corrupt.");
  }
  return snapshot;
}

export function createPostgresCustomerAccountStore({ databaseUrl, query, maximumAttempts = 5 } = {}) {
  const execute = query || createPostgresQuery(databaseUrl);
  if (typeof execute !== "function") throw storageError("customer_account_postgres_configuration_invalid", "PostgreSQL account storage is incompletely configured.");
  let initialization = null;
  async function initialize() {
    if (!initialization) initialization = Promise.resolve().then(() => execute(INITIALIZE_SQL, []));
    await initialization;
  }
  async function readSnapshot() {
    await initialize();
    const result = await execute(READ_SQL, [POSTGRES_ACCOUNT_STORE_KEY]);
    if (!result || !Array.isArray(result.rows) || result.rows.length > 1) {
      throw storageError("customer_account_postgres_protocol_error", "PostgreSQL account storage returned an invalid snapshot result.");
    }
    return result.rows.length ? parseSnapshotRow(result.rows[0]) : null;
  }
  async function compareAndSwap({ expectedRevision, nextState }) {
    await initialize();
    if (!Number.isSafeInteger(expectedRevision) || expectedRevision < 0 || !nextState || typeof nextState !== "object"
      || nextState.schemaVersion !== CUSTOMER_ACCOUNT_SCHEMA_VERSION || nextState.revision !== expectedRevision + 1) {
      throw storageError("customer_account_postgres_commit_invalid", "PostgreSQL account storage rejected an invalid commit.");
    }
    const serialized = JSON.stringify(nextState);
    if (Buffer.byteLength(serialized, "utf8") > MAX_STATE_BYTES) {
      throw storageError("customer_account_postgres_state_too_large", "PostgreSQL account storage state exceeds its safe limit.");
    }
    const result = expectedRevision === 0
      ? await execute(INSERT_SQL, [POSTGRES_ACCOUNT_STORE_KEY, CUSTOMER_ACCOUNT_SCHEMA_VERSION, "1", serialized])
      : await execute(UPDATE_SQL, [
        POSTGRES_ACCOUNT_STORE_KEY,
        CUSTOMER_ACCOUNT_SCHEMA_VERSION,
        String(expectedRevision),
        String(expectedRevision + 1),
        serialized,
        "1.0",
        "2.0"
      ]);
    if (!result || !Array.isArray(result.rows) || result.rows.length > 1) {
      throw storageError("customer_account_postgres_protocol_error", "PostgreSQL account storage returned an invalid commit result.");
    }
    return result.rows.length === 1 && Number(result.rows[0].revision) === expectedRevision + 1;
  }
  const store = createDurableCustomerAccountStore({ readSnapshot, compareAndSwap, maximumAttempts });
  return Object.assign(store, {
    adapter: POSTGRES_ACCOUNT_STORE_ADAPTER,
    readiness: POSTGRES_DURABLE_PERSISTENCE,
    initialize,
    readSnapshot,
    compareAndSwap
  });
}

export const POSTGRES_ACCOUNT_STORE_SQL = Object.freeze({
  initialize: INITIALIZE_SQL,
  read: READ_SQL,
  insert: INSERT_SQL,
  update: UPDATE_SQL
});
