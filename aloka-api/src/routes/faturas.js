import { Router } from 'express';
import { pool } from '../db.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM FATURA ORDER BY id_fatura DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id/pagar', async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await pool.query(
      'UPDATE FATURA SET DataPagamento = CURRENT_DATE WHERE ID_FATURA = $1 RETURNING *',
      [id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Fatura não encontrada' });
    res.json({ message: 'Pagamento registrado!', fatura: rows[0] });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;