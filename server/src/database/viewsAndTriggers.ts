import type Database from 'better-sqlite3'

/**
 * View + trigger giữ dữ liệu nhất quán — giảm phụ thuộc sync thủ công.
 */
export function applyViewsAndTriggers(db: Database.Database): void {
  db.exec(`
    CREATE VIEW IF NOT EXISTS v_customer_inverters AS
    SELECT DISTINCT
      c.id AS customer_id,
      i.id AS inverter_id,
      i.serial_number,
      i.model,
      i.status,
      i.customer_id AS inverter_customer_id,
      i.user_id AS inverter_user_id,
      'direct' AS link_source
    FROM customers c
    INNER JOIN inverters i ON i.customer_id = c.id
    UNION
    SELECT DISTINCT
      ct.customer_id AS customer_id,
      i.id AS inverter_id,
      i.serial_number,
      i.model,
      i.status,
      i.customer_id AS inverter_customer_id,
      i.user_id AS inverter_user_id,
      'contract' AS link_source
    FROM contracts ct
    INNER JOIN contract_inverters ci ON ci.contract_id = ct.id
    INNER JOIN inverters i ON i.id = ci.inverter_id
    WHERE ct.customer_id IS NOT NULL;

    CREATE VIEW IF NOT EXISTS v_ticket_context AS
    SELECT
      t.id AS ticket_id,
      t.ticket_number,
      t.status,
      t.customer_id,
      c.name AS customer_name_live,
      c.email AS customer_email_live,
      c.phone AS customer_phone_live,
      t.inverter_id,
      i.serial_number AS inverter_serial_live,
      i.model AS inverter_model_live
    FROM tickets t
    LEFT JOIN customers c ON c.id = t.customer_id
    LEFT JOIN inverters i ON i.id = t.inverter_id;
  `)

  // Ticket snapshot triggers — tự cập nhật khi nguồn đổi
  db.exec(`
    DROP TRIGGER IF EXISTS trg_customers_au_ticket_snapshot;
    CREATE TRIGGER trg_customers_au_ticket_snapshot
    AFTER UPDATE OF name, email, phone, address ON customers
    BEGIN
      UPDATE tickets SET
        customer_name = NEW.name,
        customer_email = NEW.email,
        customer_phone = NEW.phone,
        customer_address = NEW.address,
        updated_at = CURRENT_TIMESTAMP
      WHERE customer_id = NEW.id;
    END;

    DROP TRIGGER IF EXISTS trg_inverters_au_ticket_snapshot;
    CREATE TRIGGER trg_inverters_au_ticket_snapshot
    AFTER UPDATE OF serial_number, model ON inverters
    BEGIN
      UPDATE tickets SET
        inverter_serial = NEW.serial_number,
        inverter_model = NEW.model,
        updated_at = CURRENT_TIMESTAMP
      WHERE inverter_id = NEW.id;
    END;

    DROP TRIGGER IF EXISTS trg_tickets_ai_snapshot;
    CREATE TRIGGER trg_tickets_ai_snapshot
    AFTER INSERT ON tickets
    BEGIN
      UPDATE tickets SET
        customer_name = COALESCE(
          customer_name,
          (SELECT c.name FROM customers c WHERE c.id = NEW.customer_id)
        ),
        customer_email = COALESCE(
          customer_email,
          (SELECT c.email FROM customers c WHERE c.id = NEW.customer_id)
        ),
        customer_phone = COALESCE(
          customer_phone,
          (SELECT c.phone FROM customers c WHERE c.id = NEW.customer_id)
        ),
        customer_address = COALESCE(
          customer_address,
          (SELECT c.address FROM customers c WHERE c.id = NEW.customer_id)
        ),
        inverter_serial = COALESCE(
          inverter_serial,
          (SELECT i.serial_number FROM inverters i WHERE i.id = NEW.inverter_id)
        ),
        inverter_model = COALESCE(
          inverter_model,
          (SELECT i.model FROM inverters i WHERE i.id = NEW.inverter_id)
        )
      WHERE id = NEW.id;
    END;

    DROP TRIGGER IF EXISTS trg_tickets_au_fk_snapshot;
    CREATE TRIGGER trg_tickets_au_fk_snapshot
    AFTER UPDATE OF customer_id, inverter_id ON tickets
    BEGIN
      UPDATE tickets SET
        customer_name = (SELECT c.name FROM customers c WHERE c.id = NEW.customer_id),
        customer_email = (SELECT c.email FROM customers c WHERE c.id = NEW.customer_id),
        customer_phone = (SELECT c.phone FROM customers c WHERE c.id = NEW.customer_id),
        customer_address = (SELECT c.address FROM customers c WHERE c.id = NEW.customer_id),
        inverter_serial = (SELECT i.serial_number FROM inverters i WHERE i.id = NEW.inverter_id),
        inverter_model = (SELECT i.model FROM inverters i WHERE i.id = NEW.inverter_id),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = NEW.id;
    END;

    DROP TRIGGER IF EXISTS trg_customers_au_inverter_user_id;
    CREATE TRIGGER trg_customers_au_inverter_user_id
    AFTER UPDATE OF user_id ON customers
    BEGIN
      UPDATE inverters SET
        user_id = NEW.user_id,
        updated_at = CURRENT_TIMESTAMP
      WHERE customer_id = NEW.id;
    END;

    DROP TRIGGER IF EXISTS trg_inverters_ai_user_id_mirror;
    CREATE TRIGGER trg_inverters_ai_user_id_mirror
    AFTER INSERT ON inverters
    WHEN NEW.customer_id IS NOT NULL
    BEGIN
      UPDATE inverters SET
        user_id = (SELECT c.user_id FROM customers c WHERE c.id = NEW.customer_id),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = NEW.id
        AND (
          user_id IS NULL
          OR user_id != COALESCE(
            (SELECT c.user_id FROM customers c WHERE c.id = NEW.customer_id), -1
          )
        );
    END;

    DROP TRIGGER IF EXISTS trg_inverters_au_user_id_mirror;
    CREATE TRIGGER trg_inverters_au_user_id_mirror
    AFTER UPDATE OF customer_id ON inverters
    BEGIN
      UPDATE inverters SET
        user_id = (SELECT c.user_id FROM customers c WHERE c.id = NEW.customer_id),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = NEW.id;
    END;
  `)
}

export function applyPerformanceIndexes(db: Database.Database): void {
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_inverters_customer_id ON inverters(customer_id);
    CREATE INDEX IF NOT EXISTS idx_inverters_user_id ON inverters(user_id);
    CREATE INDEX IF NOT EXISTS idx_inverters_distributor_id ON inverters(distributor_id);
    CREATE INDEX IF NOT EXISTS idx_inverters_serial ON inverters(serial_number);
    CREATE INDEX IF NOT EXISTS idx_customers_user_id ON customers(user_id);
    CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
    CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
    CREATE INDEX IF NOT EXISTS idx_tickets_customer_id ON tickets(customer_id);
    CREATE INDEX IF NOT EXISTS idx_tickets_inverter_id ON tickets(inverter_id);
    CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
    CREATE INDEX IF NOT EXISTS idx_contracts_customer_id ON contracts(customer_id);
    CREATE INDEX IF NOT EXISTS idx_contract_inverters_inverter ON contract_inverters(inverter_id);
    CREATE INDEX IF NOT EXISTS idx_contract_inverters_contract ON contract_inverters(contract_id);
  `)
}
