import 'dotenv/config';
import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import pg from 'pg';
import { app } from '../src/app.js';
const db = new pg.Pool();
before(async () => {
  await db.query('CREATE TABLE IF NOT EXISTS inventario (id SERIAL PRIMARY KEY, nombre VARCHAR(50), categoria VARCHAR(50), metal VARCHAR(50), precio INT, stock INT)');
  await db.query('TRUNCATE inventario RESTART IDENTITY');
  for (const [nombre,categoria,metal,precio,stock] of [
    ['Collar Heart','collar','oro',20000,2],['Collar History','collar','plata',15000,5],
    ['Aros Berry','aros','oro',12000,10],['Aros Hook Blue','aros','oro',25000,4],
    ['Anillo Wish','aros','plata',30000,4],['Anillo Cuarzo Greece','anillo','oro',40000,2]
  ]) await db.query('INSERT INTO inventario (nombre,categoria,metal,precio,stock) VALUES ($1,$2,$3,$4,$5)',[nombre,categoria,metal,precio,stock]);
});
after(async () => { await db.end(); });
test('GET /joyas: paginación y enlaces reales', async () => {
  const res=await request(app).get('/joyas?limits=3&page=2&order_by=stock_ASC');
  assert.equal(res.status,200);assert.equal(res.body.totalJoyas,6);
  assert.equal(res.body.results.length,3);
  const detail=await request(app).get(res.body.results[0].href);
  assert.equal(detail.status,200);
});
test('GET /joyas/filtros: rango, categoría, metal',async()=>{
  const res=await request(app).get('/joyas/filtros?precio_min=25000&precio_max=30000&categoria=aros&metal=plata');
  assert.equal(res.status,200);assert.equal(res.body.length,1);assert.equal(res.body[0].nombre,'Anillo Wish');
});
test('GET /joyas/filtros: entrada SQL no altera consulta',async()=>{
  const res=await request(app).get('/joyas/filtros').query({categoria:"aros' OR 1=1 --"});
  assert.equal(res.status,200);assert.equal(res.body.length,0);
});
test('Parámetros inválidos devuelven 400',async()=>{
  const res=await request(app).get('/joyas?order_by=stock_DROP');
  assert.equal(res.status,400);
});
