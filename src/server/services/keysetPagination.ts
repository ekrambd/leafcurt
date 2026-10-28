/**
 * High-Performance Keyset (Cursor-Based / Seek Method) Pagination Service
 *
 * Why Keyset Pagination:
 * - Traditional OFFSET pagination (e.g. LIMIT 20 OFFSET 100000) is O(N) because the DB
 *   storage engine must scan and discard 100,000 index tuples before returning 20 rows.
 * - Keyset pagination uses the composite key (createdAt, id) to perform an O(log N) index seek
 *   directly to the exact record, achieving constant O(1) response time regardless of page depth.
 * - By combining timestamp (createdAt) + unique identifier (id), deterministic ordering
 *   is guaranteed even when multiple records share the exact same millisecond timestamp.
 */

export interface KeysetCursor {
  createdAt: string; // ISO string
  id: string;
}

export interface KeysetPageInfo {
  limit: number;
  hasMore: boolean;
  nextCursor: string | null;
  endCursor: KeysetCursor | null;
  totalCount?: number;
}

export interface KeysetPaginatedResult<T> {
  data: T[];
  pageInfo: KeysetPageInfo;
}

/**
 * Encodes (createdAt, id) into a URL-safe Base64 cursor token.
 */
export function encodeCursor(createdAt: string | Date, id: string): string {
  const dateStr = typeof createdAt === 'string' ? createdAt : createdAt.toISOString();
  const raw = `${dateStr}:::${id}`;
  return Buffer.from(raw, 'utf-8').toString('base64url');
}

/**
 * Decodes a URL-safe Base64 cursor token back into (createdAt, id).
 */
export function decodeCursor(cursorToken?: string): KeysetCursor | null {
  if (!cursorToken || typeof cursorToken !== 'string') return null;
  try {
    const raw = Buffer.from(cursorToken, 'base64url').toString('utf-8');
    const [createdAt, id] = raw.split(':::');
    if (!createdAt || !id) return null;
    const parsedDate = new Date(createdAt);
    if (isNaN(parsedDate.getTime())) return null;
    return { createdAt, id };
  } catch {
    return null;
  }
}

/**
 * Binary search to find the insertion index for (cursorCreatedAt, cursorId)
 * in an array strictly sorted DESCENDING by (createdAt, id).
 *
 * Time Complexity: O(log N)
 */
function binarySearchSeekDesc<T extends { createdAt?: string | Date; id: string }>(
  items: T[],
  cursor: KeysetCursor
): number {
  const targetTime = new Date(cursor.createdAt).getTime();
  const targetId = cursor.id;

  let low = 0;
  let high = items.length - 1;
  let resultIdx = items.length; // Default to end if not found

  while (low <= high) {
    const mid = (low + high) >> 1;
    const item = items[mid];
    const itemTime = new Date(item.createdAt || 0).getTime();
    const itemId = item.id;

    // Compare (itemTime, itemId) vs (targetTime, targetId) in DESCENDING order
    if (itemTime < targetTime || (itemTime === targetTime && itemId < targetId)) {
      // mid is already AFTER the cursor in DESC sequence, look earlier
      resultIdx = mid;
      high = mid - 1;
    } else {
      // mid is BEFORE or EQUAL to the cursor, look later
      low = mid + 1;
    }
  }

  return resultIdx;
}

/**
 * In-Memory Keyset Pagination with O(log N) Binary Search Seek.
 *
 * @param items Array of records sorted descending by createdAt then id
 * @param cursorToken Base64 cursor from previous page
 * @param limit Number of items to return (default 20, max 100)
 */
export function paginateInMemoryKeyset<T extends { createdAt?: string | Date; id: string }>(
  items: T[],
  cursorToken?: string,
  limit = 20
): KeysetPaginatedResult<T> {
  const safeLimit = Math.max(1, Math.min(100, Number(limit) || 20));
  const cursor = decodeCursor(cursorToken);

  let startIndex = 0;
  if (cursor) {
    startIndex = binarySearchSeekDesc(items, cursor);
  }

  // Slice (limit + 1) items to check if a next page exists without extra count query
  const slice = items.slice(startIndex, startIndex + safeLimit + 1);
  const hasMore = slice.length > safeLimit;
  const data = hasMore ? slice.slice(0, safeLimit) : slice;

  let nextCursor: string | null = null;
  let endCursor: KeysetCursor | null = null;

  if (data.length > 0) {
    const lastItem = data[data.length - 1];
    const createdStr = typeof lastItem.createdAt === 'string'
      ? lastItem.createdAt
      : (lastItem.createdAt?.toISOString() || new Date().toISOString());

    endCursor = {
      createdAt: createdStr,
      id: lastItem.id
    };

    if (hasMore) {
      nextCursor = encodeCursor(createdStr, lastItem.id);
    }
  }

  return {
    data,
    pageInfo: {
      limit: safeLimit,
      hasMore,
      nextCursor,
      endCursor,
      totalCount: items.length
    }
  };
}

/**
 * Builds Prisma `where` clause for Keyset Seek pagination.
 *
 * Query logic:
 *   WHERE (createdAt < :cursorCreatedAt)
 *      OR (createdAt = :cursorCreatedAt AND id < :cursorId)
 *
 * This matches a composite index: @@index([createdAt(sort: Desc), id(sort: Desc)])
 */
export function buildPrismaKeysetClause(cursorToken?: string) {
  const cursor = decodeCursor(cursorToken);
  if (!cursor) return undefined;

  const cursorDate = new Date(cursor.createdAt);

  return {
    OR: [
      {
        createdAt: {
          lt: cursorDate
        }
      },
      {
        AND: [
          { createdAt: cursorDate },
          { id: { lt: cursor.id } }
        ]
      }
    ]
  };
}
