/**
 * 변환 예상 결과 Blob을 LRU 방식으로 관리한다.
 * 큰 이미지가 많아져도 지정한 메모리 한도를 넘지 않도록 오래된 항목을 제거한다.
 */
export function createResultCache(maxBytes) {
  const cache = {
    blobs: new Map(),
    bytes: 0,
    maxBytes: Math.max(1, Number(maxBytes) || 1),
  };

  cache.get = key => {
    const value = cache.blobs.get(key);
    if (!value) return undefined;
    // 접근된 항목을 뒤로 이동해 최근 사용 상태로 갱신한다.
    cache.blobs.delete(key);
    cache.blobs.set(key, value);
    return value;
  };

  cache.set = (key, blob) => {
    if (!(blob instanceof Blob)) return;
    const previous = cache.blobs.get(key);
    if (previous) cache.bytes -= previous.size || 0;
    cache.blobs.delete(key);
    cache.blobs.set(key, blob);
    cache.bytes += blob.size || 0;
    trimResultCache(cache, key);
  };

  cache.delete = key => {
    const previous = cache.blobs.get(key);
    if (!previous) return false;
    cache.bytes -= previous.size || 0;
    return cache.blobs.delete(key);
  };

  cache.deletePrefix = prefix => {
    for (const key of [...cache.blobs.keys()]) {
      if (String(key).startsWith(prefix)) cache.delete(key);
    }
  };

  cache.clear = () => {
    cache.blobs.clear();
    cache.bytes = 0;
  };

  return cache;
}

export function trimResultCache(cache, protectedKey = null) {
  while (cache.bytes > cache.maxBytes && cache.blobs.size > 1) {
    const oldestKey = cache.blobs.keys().next().value;
    if (oldestKey === protectedKey && cache.blobs.size === 1) break;
    cache.delete(oldestKey);
  }
}
