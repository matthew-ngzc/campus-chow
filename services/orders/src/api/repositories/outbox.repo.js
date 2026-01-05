export async function enqueue(tx, { routingKey, payload, properties, exchange }) {
  if (!tx) throw new Error('enqueue requires a transaction client');
  // If you use dedupeKey, include it and the unique index
  const { rows } = await tx.query(
    `insert into outbox (routing_key, payload, properties, exchange)
     values ($1, $2::jsonb, $3::jsonb, $4)
     returning *`,
    [routingKey, payload, properties, exchange]
  );
  return rows[0];
}

export async function claimBatch(pool, { size = 100 } = {}) {
  const client = await pool.connect();
  try {
    await client.query('begin');
    const { rows } = await client.query(
      `select id, routing_Key, payload, properties
         from outbox
        where published_at is null
        order by created_at
        limit $1
        for update skip locked`,
      [size]
    );
    await client.query('commit');
    return rows;
  } catch (e) {
    await client.query('rollback');
    throw e;
  } finally {
    client.release();
  }
}

export async function markProcessed(tx, id) {
  await tx.query(`update outbox set published_at = now() where id = $1`, [id]);
}

// export async function markFailed(tx, id, err) {
//   await tx.query(`update outbox set error = $2 where id = $1`, [id, String(err).slice(0, 2000)]);
// }
