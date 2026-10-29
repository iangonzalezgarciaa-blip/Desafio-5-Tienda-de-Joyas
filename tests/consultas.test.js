import test from 'node:test';
import assert from 'node:assert/strict';
import { construirFiltros, construirListado, prepararHateoas } from '../src/consultas.js';

test('genera paginación y ordenamiento', () => {
  assert.deepEqual(construirListado({ limits: '3', page: '2', order_by: 'stock_ASC' }), {
    sql: 'SELECT * FROM inventario ORDER BY stock ASC, id ASC LIMIT $1 OFFSET $2',
    valores: [3, 3]
  });
});

test('rechaza un campo de ordenamiento no permitido', () => {
  assert.throws(() => construirListado({ order_by: 'stock;DROP TABLE inventario_ASC' }), /order_by/);
});

test('combina filtros con parámetros seguros', () => {
  assert.deepEqual(construirFiltros({ precio_min: '25000', precio_max: '30000', categoria: 'aros', metal: 'plata' }), {
    sql: 'SELECT * FROM inventario WHERE precio >= $1 AND precio <= $2 AND categoria = $3 AND metal = $4 ORDER BY id ASC',
    valores: [25000, 30000, 'aros', 'plata']
  });
});

test('no incorpora valores de filtro en el texto SQL', () => {
  const resultado = construirFiltros({ categoria: "aros' OR 1=1 --" });
  assert.ok(!resultado.sql.includes('OR 1=1'));
  assert.equal(resultado.valores[0], "aros' OR 1=1 --");
});

test('crea enlaces HATEOAS y metadatos', () => {
  const resultado = prepararHateoas([{ id: 2, nombre: 'Collar', stock: 5 }], 6, 3, 2);
  assert.deepEqual(resultado.results, [{ name: 'Collar', href: '/joyas/2' }]);
  assert.equal(resultado.totalPages, 2);
});
