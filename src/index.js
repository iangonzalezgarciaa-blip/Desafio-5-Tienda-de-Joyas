import 'dotenv/config';
import express from 'express';
import pg from 'pg';
import { construirFiltros, construirListado, prepararHateoas } from './consultas.js';

const { Pool } = pg;
const pool = new Pool();
const app = express();

app.use((req, res, next) => {
  const inicio = Date.now();
  res.on('finish', () => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - inicio}ms`);
  });
  next();
});

app.get('/joyas/filtros', async (req, res) => {
  try {
    const { sql, valores } = construirFiltros(req.query);
    const { rows } = await pool.query(sql, valores);
    res.json(rows);
  } catch (error) {
    responderError(error, res);
  }
});

app.get('/joyas', async (req, res) => {
  try {
    const { sql, valores } = construirListado(req.query);
    const [listado, conteo] = await Promise.all([
      pool.query(sql, valores),
      pool.query('SELECT COUNT(*)::int AS total FROM inventario')
    ]);
    const limits = valores[0];
    const page = valores[1] / limits + 1;
    res.json(prepararHateoas(listado.rows, conteo.rows[0].total, limits, page));
  } catch (error) {
    responderError(error, res);
  }
});

app.get('/joyas/:id', async (req, res) => {
  try {
    if (!/^\d+$/.test(req.params.id) || Number(req.params.id) < 1) {
      return res.status(400).json({ error: 'ID inválido' });
    }
    const { rows } = await pool.query('SELECT * FROM inventario WHERE id = $1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Joya no encontrada' });
    res.json(rows[0]);
  } catch (error) {
    responderError(error, res);
  }
});

function responderError(error, res) {
  if (error.status === 400) return res.status(400).json({ error: error.message });
  console.error('Error al consultar la base de datos:', error);
  return res.status(500).json({ error: 'Ocurrió un error interno al procesar la solicitud' });
}

const port = Number(process.env.PORT || 3000);
app.listen(port, () => console.log(`Servidor disponible en http://localhost:${port}`));
