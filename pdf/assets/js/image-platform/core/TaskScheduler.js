/**
 * 제한된 동시성으로 비동기 작업을 처리한다.
 * 작업 순서를 보존하며, 대량 파일 처리 시 메인 스레드 점유를 줄인다.
 */
export async function mapPool(items, limit, worker) {
  const list = Array.from(items || []);
  if (!list.length) return [];

  const concurrency = Math.max(1, Math.min(Number(limit) || 1, list.length));
  const output = new Array(list.length);
  let cursor = 0;

  const runners = Array.from({ length: concurrency }, async () => {
    while (true) {
      const index = cursor++;
      if (index >= list.length) return;
      output[index] = await worker(list[index], index);
    }
  });

  await Promise.all(runners);
  return output;
}

/** 브라우저가 렌더링·입력 이벤트를 처리할 틈을 준다. */
export function yieldToMainThread(delay = 0) {
  return new Promise(resolve => setTimeout(resolve, Math.max(0, delay)));
}
