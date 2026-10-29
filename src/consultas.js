const CAMPOS_ORDEN = new Set(['id', 'nombre', 'categoria', 'metal', 'precio', 'stock']);

export class ParametroInvalido extends Error {
  constructor(mensaje) {
    super(mensaje);
    this.status = 400;
  }
}

function enteroNoNegativo(valor, nombre, minimo = 0) {
  const numero = Number(valor);
  if (!/^\d+$/.test(String(valor)) || !Number.isSafeInteger(numero) || numero < minimo) {
    throw new ParametroInvalido(`${nombre} debe ser un entero mayor o igual a ${minimo}`);
  }
  return numero;
}

export function construirListado(query) {
  const limits = query.limits === undefined ? 10 : enteroNoNegativo(query.limits, 'limits', 1);
  const page = query.page === undefined ? 1 : enteroNoNegativo(query.page, 'page', 1);
  const order_by = query.order_by ?? 'id_ASC';
  const coincidencia = /^([a-z_]+)_(ASC|DESC)$/i.exec(order_by);
  if (!coincidencia || !CAMPOS_ORDEN.has(coincidencia[1].toLowerCase())) {
    throw new ParametroInvalido('order_by debe contener un campo válido y ASC o DESC');
  }
  const campo = coincidencia[1].toLowerCase();
  const direccion = coincidencia[2].toUpperCase();
  const offset = (page - 1) * limits;
  if (!Number.isSafeInteger(offset)) throw new ParametroInvalido('Página fuera de rango');
  const sql = `SELECT * FROM inventario ORDER BY ${campo} ${direccion}, id ASC LIMIT $1 OFFSET $2`;
  return { sql, valores: [limits, offset] };
}

export function construirFiltros(query) {
  const condiciones = [];
  const valores = [];
  for (const [parametro, operador] of [['precio_min', '>='], ['precio_max', '<=']]) {
    if (query[parametro] !== undefined) {
      valores.push(enteroNoNegativo(query[parametro], parametro));
      condiciones.push(`precio ${operador} $${valores.length}`);
    }
  }
  for (const campo of ['categoria', 'metal']) {
    if (query[campo] !== undefined) {
      if (typeof query[campo] !== 'string' || !query[campo].trim()) {
        throw new ParametroInvalido(`${campo} debe ser un texto no vacío`);
      }
      valores.push(query[campo]);
      condiciones.push(`${campo} = $${valores.length}`);
    }
  }
  const where = condiciones.length ? ` WHERE ${condiciones.join(' AND ')}` : '';
  return { sql: `SELECT * FROM inventario${where} ORDER BY id ASC`, valores };
}

export function prepararHateoas(joyas, total, limits, page) {
  return {
    totalJoyas: total,
    stockTotal: joyas.reduce((acumulado, joya) => acumulado + joya.stock, 0),
    results: joyas.map(({ id, nombre }) => ({ name: nombre, href: `/joyas/${id}` })),
    page,
    totalPages: Math.ceil(total / limits)
  };
}
