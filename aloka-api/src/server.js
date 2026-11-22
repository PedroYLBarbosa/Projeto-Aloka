import express from 'express';
import cors from 'cors';
import { pool } from './db.js';

import clientesRoutes from './routes/clientes.js';
import espacosRoutes from './routes/espacos.js';
import equipamentosRoutes from './routes/equipamentos.js';
import reservasRoutes from './routes/reservas.js';
import faturasRoutes from './routes/faturas.js';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ status: 'API ALOKA online!' });
});

// Rotas modularizadas
app.use('/clientes', clientesRoutes);
app.use('/espacos', espacosRoutes);
app.use('/equipamentos', equipamentosRoutes);
app.use('/reservas', reservasRoutes);
app.use('/faturas', faturasRoutes);

// Rotas auxiliares (Funcionários e Entregas)
app.get('/funcionarios', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM FUNCIONARIO ORDER BY id_funcionario');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/entregas', async (req, res) => {
  try {
    const query = `
      SELECT 
        ent.id_reserva, ent.data, ent.horario,
        c.nome AS cliente_nome, c.endereco AS cliente_endereco,
        eq.nomeequipamento AS equipamento_nome,
        f.nome AS funcionario_nome
      FROM ENTREGA ent
      JOIN RESERVA r ON ent.id_reserva = r.id_reserva
      JOIN CLIENTE c ON r.id_cliente = c.id_cliente
      JOIN EQUIPAMENTO eq ON ent.id_equipamento = eq.id_equipamento
      JOIN FUNCIONARIO f ON ent.id_funcionario = f.id_funcionario
      ORDER BY ent.data DESC, ent.horario DESC;
    `;
    const { rows } = await pool.query(query);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/entregas', async (req, res) => {
  const { id_reserva, id_funcionario, id_equipamento, data, horario } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO ENTREGA (ID_RESERVA, ID_FUNCIONARIO, ID_EQUIPAMENTO, Data, Horario) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [id_reserva, id_funcionario, id_equipamento, data, horario]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.detail || err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor ALOKA rodando em http://localhost:${PORT}`);
});