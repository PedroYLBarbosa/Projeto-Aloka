import { Router } from 'express';
import { pool } from '../db.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM EQUIPAMENTO ORDER BY id_equipamento');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  const { nomeEquipamento, numeroPatrimonio, marca, observacao } = req.body;
  try {
    const { rows } = await pool.query(
      'INSERT INTO EQUIPAMENTO (NomeEquipamento, NumeroPatrimonio, Marca, Observacao) VALUES ($1, $2, $3, $4) RETURNING *',
      [nomeEquipamento, numeroPatrimonio, marca || null, observacao || null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.detail || err.message });
  }
});

export default router;