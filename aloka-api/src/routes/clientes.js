import { Router } from 'express';
import { pool } from '../db.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const query = `
      SELECT 
        c.id_cliente, c.nome, c.email, c.endereco,
        pf.cpf, pf.rg,
        pj.cnpj, pj.razaosocial,
        CASE WHEN pf.id_cliente IS NOT NULL THEN 'PF' ELSE 'PJ' END AS tipo_cliente,
        COALESCE(array_agg(tc.numero_cliente) FILTER (WHERE tc.numero_cliente IS NOT NULL), '{}') AS telefones
      FROM CLIENTE c
      LEFT JOIN PESSOA_FISICA pf ON c.id_cliente = pf.id_cliente
      LEFT JOIN PESSOA_JURIDICA pj ON c.id_cliente = pj.id_cliente
      LEFT JOIN TELEFONE_CLIENTE tc ON c.id_cliente = tc.id_cliente
      GROUP BY c.id_cliente, pf.id_cliente, pf.cpf, pf.rg, pj.id_cliente, pj.cnpj, pj.razaosocial
      ORDER BY c.id_cliente DESC;
    `;
    const { rows } = await pool.query(query);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  const { nome, email, endereco, tipo, cpf, rg, cnpj, razaoSocial, telefone } = req.body;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const resCliente = await client.query(
      'INSERT INTO CLIENTE (Nome, Email, Endereco) VALUES ($1, $2, $3) RETURNING ID_CLIENTE',
      [nome, email, endereco]
    );
    const idCliente = resCliente.rows[0].id_cliente;

    if (tipo === 'PF') {
      await client.query(
        'INSERT INTO PESSOA_FISICA (ID_CLIENTE, CPF, RG) VALUES ($1, $2, $3)',
        [idCliente, cpf, rg || null]
      );
    } else if (tipo === 'PJ') {
      await client.query(
        'INSERT INTO PESSOA_JURIDICA (ID_CLIENTE, Cnpj, RazaoSocial) VALUES ($1, $2, $3)',
        [idCliente, cnpj, razaoSocial || null]
      );
    } else {
      throw new Error("Tipo de cliente inválido. Informe 'PF' ou 'PJ'.");
    }

    if (telefone) {
      await client.query(
        'INSERT INTO TELEFONE_CLIENTE (ID_CLIENTE, NUMERO_CLIENTE) VALUES ($1, $2)',
        [idCliente, telefone]
      );
    }

    await client.query('COMMIT');
    res.status(201).json({ message: 'Cliente cadastrado com sucesso!', id_cliente: idCliente });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(400).json({ error: err.detail || err.message });
  } finally {
    client.release();
  }
});

export default router;  