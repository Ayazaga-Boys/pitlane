import net from 'node:net';
import tls from 'node:tls';
import { cellToParent, isValidCell } from 'h3-js';

const HEATMAP_SNAPSHOT_KEY = 'heatmap:snapshot';
const VEHICLE_HEATMAP_SNAPSHOT_PREFIX = 'heatmap:snapshot:vehicle';
const LOCATION_KEY_PATTERN = 'loc:*';
const HEATMAP_RESOLUTION = 8;
const DEFAULT_TIMEOUT_MS = 1500;
export type HeatmapVehicleType = 'any' | 'car' | 'motorcycle';

type RespValue = string | number | null | RespValue[];

export interface HeatmapCell {
  h3_cell: string;
  user_count: number;
}

export async function getHeatmapCells(bounds: string[]): Promise<HeatmapCell[]> {
  const counts = await getValkeyHeatmapCounts(HEATMAP_SNAPSHOT_KEY);
  return mapCountsToCells(counts, bounds);
}

export async function getVehicleHeatmapCells(vehicleType: HeatmapVehicleType, bounds: string[]): Promise<HeatmapCell[]> {
  const key = vehicleType === 'any' ? HEATMAP_SNAPSHOT_KEY : `${VEHICLE_HEATMAP_SNAPSHOT_PREFIX}:${vehicleType}`;
  const counts = await getValkeyHeatmapCounts(key);
  return mapCountsToCells(counts, bounds);
}

function mapCountsToCells(counts: Record<string, number>, bounds: string[]): HeatmapCell[] {
  const cells = bounds.length > 0 ? bounds : Object.keys(counts).sort();

  return cells.map((h3Cell) => ({
    h3_cell: h3Cell,
    user_count: counts[h3Cell] ?? 0,
  }));
}

export function normalizeLocationCellsToHeatmapCounts(cells: string[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const cell of cells) {
    if (!isValidCell(cell)) continue;
    const parent = cellToParent(cell, HEATMAP_RESOLUTION);
    counts[parent] = (counts[parent] ?? 0) + 1;
  }
  return counts;
}

async function getValkeyHeatmapCounts(snapshotKey: string): Promise<Record<string, number>> {
  const addr = process.env.VALKEY_ADDR;
  if (!addr) return {};

  const client = await ValkeyClient.connect(addr);
  try {
    const snapshot = await client.command(['GET', snapshotKey]);
    const snapshotCounts = parseHeatmapSnapshot(snapshot);
    if (snapshotCounts) return snapshotCounts;

    if (snapshotKey !== HEATMAP_SNAPSHOT_KEY) return {};

    const cells: string[] = [];
    let cursor = '0';
    do {
      const scan = await client.command(['SCAN', cursor, 'MATCH', LOCATION_KEY_PATTERN, 'COUNT', '100']);
      if (!Array.isArray(scan) || scan.length < 2 || typeof scan[0] !== 'string' || !Array.isArray(scan[1])) {
        break;
      }
      cursor = scan[0];
      const keys = scan[1].filter((key): key is string => typeof key === 'string');
      if (keys.length > 0) {
        const values = await client.command(['MGET', ...keys]);
        if (Array.isArray(values)) {
          cells.push(...values.filter((value): value is string => typeof value === 'string'));
        }
      }
    } while (cursor !== '0');

    return normalizeLocationCellsToHeatmapCounts(cells);
  } finally {
    client.close();
  }
}

function parseHeatmapSnapshot(value: RespValue): Record<string, number> | null {
  if (typeof value !== 'string') return null;

  try {
    const parsed = JSON.parse(value) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;

    const counts: Record<string, number> = {};
    for (const [cell, count] of Object.entries(parsed)) {
      if (!isValidCell(cell) || typeof count !== 'number' || !Number.isFinite(count) || count < 0) continue;
      counts[cell] = Math.floor(count);
    }
    return counts;
  } catch {
    return null;
  }
}

class ValkeyClient {
  private buffer = Buffer.alloc(0);
  private pending: {
    resolve: (value: RespValue) => void;
    reject: (error: Error) => void;
    timer: NodeJS.Timeout;
  } | undefined;

  private constructor(private readonly socket: net.Socket | tls.TLSSocket) {}

  static async connect(addr: string): Promise<ValkeyClient> {
    const url = new URL(addr);
    const isTls = url.protocol === 'rediss:';
    if (!isTls && url.protocol !== 'redis:') {
      throw new Error('VALKEY_ADDR must use redis:// or rediss://');
    }

    const port = Number(url.port || (isTls ? 6380 : 6379));
    const host = url.hostname;
    const socket = isTls
      ? tls.connect({ host, port, servername: host })
      : net.connect({ host, port });
    const client = new ValkeyClient(socket);

    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Valkey connect timeout')), DEFAULT_TIMEOUT_MS);
      socket.once('connect', () => {
        clearTimeout(timer);
        resolve();
      });
      socket.once('error', (error) => {
        clearTimeout(timer);
        reject(error);
      });
    });

    socket.on('data', (chunk) => client.onData(chunk));
    socket.on('error', (error) => client.rejectPending(error));

    if (url.password) {
      const username = decodeURIComponent(url.username || 'default');
      const password = decodeURIComponent(url.password);
      await client.command(['AUTH', username, password]);
    }

    const database = url.pathname.replace('/', '');
    if (database) await client.command(['SELECT', database]);

    return client;
  }

  command(parts: string[]): Promise<RespValue> {
    if (this.pending) throw new Error('Valkey command already pending');

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending = undefined;
        reject(new Error('Valkey command timeout'));
      }, DEFAULT_TIMEOUT_MS);
      this.pending = { resolve, reject, timer };
      this.socket.write(encodeCommand(parts));
    });
  }

  close(): void {
    this.socket.end();
  }

  private onData(chunk: Buffer): void {
    this.buffer = Buffer.concat([this.buffer, chunk]);
    if (!this.pending) return;

    try {
      const parsed = parseResp(this.buffer, 0);
      if (!parsed) return;
      this.buffer = this.buffer.subarray(parsed.offset);
      const pending = this.pending;
      this.pending = undefined;
      clearTimeout(pending.timer);
      pending.resolve(parsed.value);
    } catch (error) {
      this.rejectPending(error instanceof Error ? error : new Error('Valkey parse failed'));
    }
  }

  private rejectPending(error: Error): void {
    if (!this.pending) return;
    const pending = this.pending;
    this.pending = undefined;
    clearTimeout(pending.timer);
    pending.reject(error);
  }
}

function encodeCommand(parts: string[]): string {
  return `*${parts.length}\r\n${parts.map((part) => `$${Buffer.byteLength(part)}\r\n${part}\r\n`).join('')}`;
}

function parseResp(buffer: Buffer, offset: number): { value: RespValue; offset: number } | null {
  if (offset >= buffer.length) return null;

  const byte = buffer[offset];
  if (byte === undefined) return null;
  const type = String.fromCharCode(byte);
  const lineEnd = buffer.indexOf('\r\n', offset);
  if (lineEnd === -1) return null;
  const line = buffer.toString('utf8', offset + 1, lineEnd);
  const nextOffset = lineEnd + 2;

  if (type === '+') return { value: line, offset: nextOffset };
  if (type === '-') throw new Error(line);
  if (type === ':') return { value: Number(line), offset: nextOffset };

  if (type === '$') {
    const length = Number(line);
    if (length === -1) return { value: null, offset: nextOffset };
    const end = nextOffset + length;
    if (buffer.length < end + 2) return null;
    return { value: buffer.toString('utf8', nextOffset, end), offset: end + 2 };
  }

  if (type === '*') {
    const length = Number(line);
    if (length === -1) return { value: null, offset: nextOffset };

    const values: RespValue[] = [];
    let cursor = nextOffset;
    for (let index = 0; index < length; index += 1) {
      const parsed = parseResp(buffer, cursor);
      if (!parsed) return null;
      values.push(parsed.value);
      cursor = parsed.offset;
    }
    return { value: values, offset: cursor };
  }

  throw new Error(`Unsupported Valkey response type: ${type}`);
}
