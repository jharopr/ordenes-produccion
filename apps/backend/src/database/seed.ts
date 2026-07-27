import dataSource from './data-source';

async function seed() {
  await dataSource.initialize();
  await dataSource.transaction(async (manager) => {
    await manager.query(`
      INSERT INTO production_orders
        (order_number, customer_id, location_id, title, start_date, status, requested_by, notes, subtotal, discount, total)
      SELECT 'OP-SEED-000001', c.id, l.id, 'Mantenimiento de carrocería', CURRENT_DATE, 'ORDERED',
             'Jefe de operaciones', 'Orden de demostración.', 2400, 100, 2300
      FROM customers c CROSS JOIN locations l
      WHERE c.is_default = true AND l.name = 'Sede Trujillo'
      ON CONFLICT (order_number) DO NOTHING
    `);
    await manager.query(`
      INSERT INTO production_orders
        (order_number, customer_id, location_id, title, start_date, completion_date, status, requested_by, subtotal, discount, total)
      SELECT 'OP-SEED-000002', c.id, l.id, 'Instalación de accesorios', CURRENT_DATE - 7, CURRENT_DATE,
             'ORDERED', 'Administración', 1525, 0, 1525
      FROM customers c CROSS JOIN locations l
      WHERE c.is_default = true AND l.name = 'Sede Lima'
      ON CONFLICT (order_number) DO NOTHING
    `);
    await manager.query(`
      INSERT INTO production_order_items
        (production_order_id, description, quantity, unit_price, subtotal, display_order)
      SELECT o.id, x.description, x.quantity, x.unit_price, x.subtotal, x.display_order
      FROM production_orders o
      CROSS JOIN (VALUES
        ('Reparación y pintura de estructura', 1::numeric, 1800::numeric, 1800::numeric, 0),
        ('Cambio de componentes metálicos', 2::numeric, 300::numeric, 600::numeric, 1)
      ) AS x(description, quantity, unit_price, subtotal, display_order)
      WHERE o.order_number = 'OP-SEED-000001'
        AND NOT EXISTS (SELECT 1 FROM production_order_items i WHERE i.production_order_id = o.id)
    `);
    await manager.query(`
      INSERT INTO production_order_items
        (production_order_id, description, quantity, unit_price, subtotal, display_order)
      SELECT o.id, x.description, x.quantity, x.unit_price, x.subtotal, x.display_order
      FROM production_orders o
      CROSS JOIN (VALUES
        ('Instalación de motor Froster', 1::numeric, 1200::numeric, 1200::numeric, 0),
        ('Alargue de caja de dirección', 1::numeric, 325::numeric, 325::numeric, 1)
      ) AS x(description, quantity, unit_price, subtotal, display_order)
      WHERE o.order_number = 'OP-SEED-000002'
        AND NOT EXISTS (SELECT 1 FROM production_order_items i WHERE i.production_order_id = o.id)
    `);
  });
  await dataSource.destroy();
  console.log('Datos de prueba creados correctamente.');
}

seed().catch(async (error: unknown) => {
  console.error('No se pudo ejecutar el seed:', error);
  if (dataSource.isInitialized) await dataSource.destroy();
  process.exitCode = 1;
});
