import { createClient } from 'redis';

/**
 * Simple mock worker that mirrors the production worker interface.
 * It consumes tasks from the `tasks` stream and writes a success
 * result to `task_results`.  Used only in automated tests.
 */
export async function startWorkerMock(options: {
  redisUrl?: string;
  stream?: string;
  group?: string;
  consumer?: string;
  resultStream?: string;
}) {
  const {
    redisUrl = process.env.REDIS_URL || 'redis://localhost:6379',
    stream = 'tasks',
    group = 'test-group',
    consumer = `consumer-${Date.now()}`,
    resultStream = 'task_results',
  } = options;

  const client = createClient({ url: redisUrl });
  await client.connect();

  // Ensure consumer group exists (ignore BUSYGROUP error)
  try {
    await client.xGroupCreate(stream, group, '0-0', { MKSTREAM: true });
  } catch (err: any) {
    if (!String(err.message).includes('BUSYGROUP')) throw err;
  }

  let running = true;

  async function loop() {
    while (running) {
      const res = await client.xReadGroup(group, consumer, {
        key: stream,
        id: '>',
      }, { COUNT: 1, BLOCK: 1000 }) as any[] | null;

      if (res) {
        for (const streamData of res) {
          for (const msg of streamData.messages) {
            const taskId = msg.message.task_id || msg.id;
            await client.xAdd(resultStream, '*', {
              task_id: taskId,
              status: 'completed',
              payload: JSON.stringify({ ok: true }),
            });
            await client.xAck(stream, group, msg.id);
          }
        }
      }
    }
  }

  loop();

  return () => {
    running = false;
    client.quit();
  };
} 