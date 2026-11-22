import { Router } from 'express';
import { pool } from '../db.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const query = `
      SELECT 
        r.id_reserva, r.datareserva, r.horainicio, r.horafim, r.statusreserva,
        c.id_cliente, c.nome AS cliente_nome,
        e.id_espaco, e.nomeespaco AS espaco_nome,
        f.id_fatura, f.datavencimento, f.datapagamento, f.comprovante
      FROM RESERVA r
      JOIN CLIENTE c ON r.id_cliente = c.id_cliente
      JOIN ESPACO e ON r.id_espaco = e.id_espaco
      LEFT JOIN FATURA f ON r.id_reserva = f.id_reserva
      ORDER BY r.id_reserva DESC;
    `;
    const { rows } = await pool.query(query);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  const { id_cliente, id_espaco, horaInicio, horaFim, dataReserva, dataVencimento, comprovante, itens = [] } = req.body;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const resReserva = await client.query(
      `INSERT INTO RESERVA (ID_CLIENTE, ID_ESPACO, HoraInicio, HoraFim, DataReserva) 
       VALUES ($1, $2, $3, $4, $5) RETURNING ID_RESERVA`,
      [id_cliente, id_espaco, horaInicio, horaFim, dataReserva]
    );
    const idReserva = resReserva.rows[0].id_reserva;

    for (const item of itens) {
      await client.query(
        `INSERT INTO ITEMRESERVA (ID_RESERVA, ID_EQUIPAMENTO, QuantidadeAlugada, ValorUnitario) 
         VALUES ($1, $2, $3, $4)`,
        [idReserva, item.id_equipamento, item.quantidade, item.valor_unitario]
      );
    }

    if (dataVencimento) {
      await client.query(
        `INSERT INTO FATURA (ID_RESERVA, Comprovante, DataVencimento) 
         VALUES ($1, $2, $3)`,
        [idReserva, comprovante || `FAT-${idReserva}-${Date.now()}`, dataVencimento]
      );
    }

    await client.query('COMMIT');
    res.status(201).json({ message: 'Reserva criada com sucesso!', id_reserva: idReserva });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(400).json({ error: err.detail || err.message });
  } finally {
    client.release();
  }
});

router.patch('/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const { rows } = await pool.query(
      'UPDATE RESERVA SET StatusReserva = $1 WHERE ID_RESERVA = $2 RETURNING *',
      [status, id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Reserva não encontrada' });
    res.json(rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.detail || err.message });
  }
});

export default router;