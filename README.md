# Desafío - Tienda de Joyas

## Descripción

En este proyecto desarrollé una API REST para la tienda **My Precious Spa**. Mi objetivo fue consultar el inventario de joyas desde PostgreSQL utilizando Node.js, Express y el paquete `pg`, incorporando paginación, ordenamiento, filtros y respuestas con enlaces HATEOAS.

## Tecnologías que utilicé

- Node.js y Express para el servidor y las rutas HTTP.
- PostgreSQL y `pg` para las consultas a la base de datos.
- `dotenv` para configurar la conexión mediante variables de entorno.
- `node:test` para las pruebas de la lógica de consultas.

## Cómo ejecutar mi proyecto

1. Instalo las dependencias con `npm install`.
2. Creo la base de datos y cargo los registros de ejemplo desde una terminal con PostgreSQL: `psql -U postgres -f db/joyas.sql`.
3. Copio `.env.example` a `.env` y configuro los datos de acceso a mi PostgreSQL.
4. Inicio el servidor con `npm start` (o `npm run dev` en desarrollo).
5. Pruebo las rutas desde Postman, Insomnia o el navegador, usando `http://localhost:3000`.
6. Ejecuto las pruebas unitarias con `npm test`.

> El archivo SQL está preparado para ejecutarse con `psql`, porque incluye el comando `\\connect`.

## Rutas que implementé

| Método | Ruta | Descripción |
| --- | --- | --- |
| GET | `/joyas` | Devuelvo las joyas en formato HATEOAS. |
| GET | `/joyas?limits=3&page=2&order_by=stock_ASC` | Limito, pagino y ordeno los resultados. |
| GET | `/joyas/filtros?precio_min=25000&precio_max=30000&categoria=aros&metal=plata` | Filtro por rango de precios, categoría y metal. |
| GET | `/joyas/5` | Consulto el detalle de una joya mediante el enlace HATEOAS. |

En los filtros interpreté `precio_min` como un límite **mínimo** (`>=`) y `precio_max` como un límite **máximo** (`<=`), de acuerdo con sus nombres y con el ejemplo del enunciado.

## Decisiones que tomé

- Implementé consultas parametrizadas para que los valores de los filtros no se inserten directamente en el SQL.
- Validé los campos permitidos para `order_by` antes de construir la consulta.
- Incluí `try/catch` para responder ante errores de validación y de la base de datos.
- Incorporé un middleware que registra el método, la ruta, el código de respuesta y el tiempo de cada solicitud.
- Agregué la ruta `/joyas/:id` para que los enlaces `href` del listado se puedan utilizar.
- Separé la construcción de las consultas en `src/consultas.js` para mantener el código ordenado y facilitar las pruebas.

**Nota:** El `stockTotal` de la respuesta corresponde a la suma del stock de las joyas devueltas en la página consultada. `totalJoyas` indica el total de registros del inventario.

## Pruebas

Mis pruebas de consultas verifican paginación y ordenamiento, validación del campo de orden, filtros parametrizados, resistencia a inyección SQL en filtros y creación de enlaces HATEOAS.

Ejecuto las pruebas con:

```bash
npm install
npm test
```

**Resultado de GitHub Actions:** ejecución exitosa. [Ver la ejecución de mis pruebas](https://github.com/iangonzalezgarciaa-blip/Desafio-5-Tienda-de-Joyas/actions/runs/40827482761).

Las pruebas automatizadas no constituyen por sí solas una validación de integración con PostgreSQL o con material de apoyo externo.
