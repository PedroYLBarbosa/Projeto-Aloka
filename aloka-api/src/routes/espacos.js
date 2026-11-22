import { Router } from 'express';
import { pool } from '../db.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM ESPACO ORDER BY id_espaco');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  const { nomeEspaco, capacidade, endereco, descricao } = req.body;
  try {
    const { rows } = await pool.query(
      'INSERT INTO ESPACO (NomeEspaco, Capacidade, Endereco, Descricao) VALUES ($1, $2, $3, $4) RETURNING *',
      [nomeEspaco, capacidade, endereco, descricao || null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.detail || err.message });
  }
});

export default router;