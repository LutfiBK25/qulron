
-- WMS Message Processing Stored Procedures
-- Processes messages from WMS to YMS based on status and message type

-- ADD01: Process new order/shipment AND insert into the interface tables
CREATE OR REPLACE FUNCTION process_add01_message(
    p_warehouse VARCHAR(30),
    p_warehouse_code VARCHAR(5),
    p_warehouse_address VARCHAR(100),
    p_load_id VARCHAR(30),
    p_order_number VARCHAR(30),
    p_customer_name VARCHAR(100),
	p_dest_addr VARCHAR(100),
	p_dest_city VARCHAR(50),
	p_dest_state VARCHAR(5),
	p_dest_zip VARCHAR(20),
	p_dest_country_code VARCHAR(10),
    p_appointment_datetime TIMESTAMP,
    p_broker_name VARCHAR(100),
    p_current_user VARCHAR(30),
	p_potential_weight DECIMAL(10,2) DEFAULT 0
) RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
    v_is_married_load VARCHAR(1) := 'N';
    v_existing_count INTEGER := 0;
BEGIN
    -- Validate required fields
    IF p_warehouse IS NULL OR TRIM(p_warehouse) = '' THEN
        RAISE EXCEPTION 'Warehouse name is required';
    END IF;
    IF p_warehouse_code IS NULL OR TRIM(p_warehouse_code) = '' THEN
        RAISE EXCEPTION 'Warehouse code is required';
    END IF;
    IF p_warehouse_address IS NULL OR TRIM(p_warehouse_address) = '' THEN
        RAISE EXCEPTION 'Warehouse address is required';
    END IF;
    IF p_load_id IS NULL OR TRIM(p_load_id) = '' THEN
        RAISE EXCEPTION 'Load ID is required';
    END IF;
    IF p_order_number IS NULL OR TRIM(p_order_number) = '' THEN
        RAISE EXCEPTION 'Order number is required';
    END IF;
    IF p_customer_name IS NULL OR TRIM(p_customer_name) = '' THEN
        RAISE EXCEPTION 'Customer name is required';
    END IF;
    IF p_dest_addr IS NULL OR TRIM(p_dest_addr) = '' THEN
        RAISE EXCEPTION 'Destination address is required';
    END IF;
	IF p_dest_city IS NULL OR TRIM(p_dest_city) = '' THEN
        RAISE EXCEPTION 'Destination city is required';
    END IF;
	IF p_dest_state IS NULL OR TRIM(p_dest_state) = '' THEN
        RAISE EXCEPTION 'Destination state is required';
    END IF;
	IF p_dest_zip IS NULL OR TRIM(p_dest_zip) = '' THEN
        RAISE EXCEPTION 'Destination zip is required';
    END IF;
	IF p_dest_country_code IS NULL OR TRIM(p_dest_country_code) = '' THEN
        RAISE EXCEPTION 'Destination country is required';
    END IF;
    IF p_current_user IS NULL OR TRIM(p_current_user) = '' THEN
        RAISE EXCEPTION 'User is required';
    END IF;

    -- Check if there are existing orders for this load_id with different order_number
    SELECT COUNT(*) INTO v_existing_count
    FROM t_al_host_load_detail 
    WHERE load_id = p_load_id 
      AND order_number != p_order_number 
      AND status = '00';
      
    -- If no existing records, insert new load master record
    IF v_existing_count = 0 THEN
        INSERT INTO t_al_host_load_master (
            load_id, status, broker_name, appointment_datetime, 
            potential_weight, record_create_id, record_create_date
        ) VALUES (
            p_load_id, '00', p_broker_name, p_appointment_datetime, 
            p_potential_weight, p_current_user, NOW()
        );
    ELSE
        -- This is a married load
        v_is_married_load := 'Y';
        
        -- Update existing records to mark them as married loads
        UPDATE t_al_host_load_detail 
        SET is_married_load = 'Y'
        WHERE load_id = p_load_id 
          AND status = '00';
    END IF;

    -- Insert the new load detail record
    INSERT INTO t_al_host_load_detail (
        load_id, order_number, status, is_married_load
    ) VALUES (
        p_load_id, p_order_number, '00', v_is_married_load
    );

	
    -- Insert the order record
    INSERT INTO t_al_host_order (
        order_number, status, warehouse, warehouse_code, warehouse_address,
        customer_name, dest_addr,dest_city,dest_state,dest_zip,dest_country_code,
		record_create_id, record_create_date
    ) VALUES (
        p_order_number, '00', p_warehouse, p_warehouse_code, p_warehouse_address,
        p_customer_name, p_dest_addr,p_dest_city,p_dest_state,p_dest_zip,p_dest_country_code,
		p_current_user, NOW()
    );
        
END;
$$;


-- ADD02: Process new driver task  
CREATE OR REPLACE FUNCTION process_add02_message(
    p_load_id VARCHAR(30),
    p_task_area VARCHAR(5),
    p_task_location VARCHAR(30),
    p_current_user VARCHAR(30)
) RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
    v_existing_count INTEGER := 0;
BEGIN
    -- Validate required fields
    IF p_load_id IS NULL OR TRIM(p_load_id) = '' THEN
        RAISE EXCEPTION 'Load Id is required';
    END IF;
    IF p_task_area IS NULL OR TRIM(p_task_area) = '' THEN
        RAISE EXCEPTION 'Task area is required';
    END IF;
    IF p_task_location IS NULL OR TRIM(p_task_location) = '' THEN
        RAISE EXCEPTION 'Task location is required';
    END IF;
    IF p_current_user IS NULL OR TRIM(p_current_user) = '' THEN
        RAISE EXCEPTION 'User is required';
    END IF;

    -- Check if there's already a task being processed for this load
    SELECT COUNT(*) INTO v_existing_count 
    FROM t_al_host_task
    WHERE load_id = p_load_id AND status = '00';

    -- Prevent concurrent processing by checking for existing active tasks
    IF v_existing_count > 0 THEN
        RAISE EXCEPTION 'There is a task already being processed for this order';
    END IF;

    -- Insert new task record
    INSERT INTO t_al_host_task(
        load_id, status, destination_area, destination_location, 
        record_create_id, record_create_date
    )
    VALUES(
        p_load_id, '00', p_task_area, p_task_location, 
        p_current_user, NOW()
    );
    
END;
$$;


-- ADD03: Process new driver task  
CREATE OR REPLACE FUNCTION process_add03_message(
    p_load_id VARCHAR(30),
    p_current_user VARCHAR(30)
) RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
    v_existing_count INTEGER := 0;
BEGIN
    -- Validate required fields
    IF p_load_id IS NULL OR TRIM(p_load_id) = '' THEN
        RAISE EXCEPTION 'Load Id is required';
    END IF;
    IF p_current_user IS NULL OR TRIM(p_current_user) = '' THEN
        RAISE EXCEPTION 'User is required';
    END IF;

    -- Check if there's already a task being processed for this load
    SELECT COUNT(*) INTO v_existing_count 
    FROM t_open_load
    WHERE load_id = p_load_id AND status NOT IN ('80'.'90');

    -- Prevent concurrent processing by checking for existing active tasks
    IF v_existing_count = 0 THEN
        RAISE EXCEPTION 'There is no order to ship in the system';
    END IF;

    -- Update Order to shipped for both open_load and load_master
	-- Updating Open Tables
	UPDATE t_open_order
	SET status = '90', record_update_id = p_current_user , record_update_date = NOW()
	WHERE order_number IN
	(
		SELECT order_number FROM t_open_load_detail
		WHERE load_id = p_load_id
	)

	UPDATE t_open_load_detail
	SET status = '90'
	WHERE load_id = p_load_id
	
    UPDATE t_open_load
	SET status = '90', record_update_id = p_current_user , record_update_date = NOW()
	WHERE load_id = p_load_id

	-- Updating Main Tables
    UPDATE t_order
	SET status = '90', record_update_id = p_current_user , record_update_date = NOW()
	WHERE order_number IN
	(
		SELECT order_number FROM t_load_detail
		WHERE load_id = p_load_id
	)

	UPDATE t_load_detail
	SET status = '90'
	WHERE load_id = p_load_id
	
    UPDATE t_load_master
	SET status = '90', record_update_id = p_current_user , record_update_date = NOW()
	WHERE load_id = p_load_id
END;
$$;

-- ADD04: Process new driver task  
CREATE OR REPLACE FUNCTION process_add04_message(
    p_load_id VARCHAR(30),
	p_appointment_datetime TIMESTAMP,
    p_current_user VARCHAR(30)
) RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
    v_existing_count INTEGER := 0;
BEGIN
    -- Validate required fields
    IF p_load_id IS NULL OR TRIM(p_load_id) = '' THEN
        RAISE EXCEPTION 'Load Id is required';
    END IF;
    IF p_task_area IS NULL OR TRIM(p_appointment_datetime) = '' THEN
        RAISE EXCEPTION 'Task area is required';
    END IF;
    IF p_current_user IS NULL OR TRIM(p_current_user) = '' THEN
        RAISE EXCEPTION 'User is required';
    END IF;

    -- Check if there's already a task being processed for this load
    SELECT COUNT(*) INTO v_existing_count 
    FROM t_open_load
    WHERE load_id = p_load_id;

    -- Prevent concurrent processing by checking for existing active tasks
    IF v_existing_count = 0 THEN
        RAISE EXCEPTION 'There is no load to assign the appointment to';
    END IF;

    -- Update Appointment Record
    UPDATE t_open_load
	SET appointment_datetime = p_appointment_datetime
	WHERE load_id = p_load_id
	AND status = '00';

	UPDATE t_load_master
	SET appointment_datetime = p_appointment_datetime
	WHERE load_id = p_load_id;
    
END;
$$;



-- Main message processor (no transaction control)
CREATE OR REPLACE PROCEDURE process_wms_rcv_messages(
    OUT p_processed_count INTEGER,
    OUT p_error_count INTEGER,
    OUT p_status_message TEXT
)
LANGUAGE plpgsql
AS $$
DECLARE
    msg_record RECORD;
    v_processed_count INTEGER := 0;
    v_error_count INTEGER := 0;
    v_current_user VARCHAR(30) := 'QulronDB_PROCESSOR';
    v_current_timestamp TIMESTAMP := NOW();
    v_error_message TEXT;

    msg_cursor CURSOR FOR 
        SELECT msg_id, msg_type, sender, receiver, warehouse, warehouse_code, 
               warehouse_address, load_id, order_number, customer_name, dest_addr,
			   dest_city, dest_state, dest_zip, dest_country_code, appointment_datetime,
               potential_weight, broker_name, driver_name, phone_number, dest_area,
               dest_location, property_1, property_2, property_3
        FROM t_wms_sst_rcv_tab 
        WHERE status = '00' 
        ORDER BY record_create_date ASC
        FOR UPDATE SKIP LOCKED;
        
BEGIN
    p_processed_count := 0;
    p_error_count := 0;
    
    RAISE NOTICE 'Starting WMS message processing at %', v_current_timestamp;
    
    FOR msg_record IN msg_cursor LOOP
        BEGIN
            v_error_message := NULL;
            
            CASE msg_record.msg_type
                WHEN 'ADD01' THEN
                    PERFORM process_add01_message(
                        msg_record.warehouse,
                        msg_record.warehouse_code,
                        msg_record.warehouse_address,
                        msg_record.load_id,
                        msg_record.order_number,
                        msg_record.customer_name,
						msg_record.dest_addr,
						msg_record.dest_city,
						msg_record.dest_state,
						msg_record.dest_zip,
						msg_record.dest_country_code,
                        msg_record.appointment_datetime,
                        msg_record.broker_name,
                        v_current_user,
                        msg_record.potential_weight
                    ); 
                WHEN 'ADD02' THEN
                    PERFORM process_add02_message(
                        msg_record.load_id,
                        msg_record.dest_area,
                        msg_record.dest_location,
                        v_current_user
                    );
                WHEN 'ADD03' THEN
                    PERFORM process_add03_message(
                        msg_record.load_id,
                        v_current_user
                    );
				WHEN 'ADD04' THEN
                    PERFORM process_add04_message(
                        msg_record.load_id,
                        msg_record.appointment_datetime,
                        v_current_user
                    );        
                ELSE
                    RAISE EXCEPTION 'Unknown message type: %', msg_record.msg_type;
            END CASE;
            
            -- Mark as successfully processed
            UPDATE t_wms_sst_rcv_tab 
            SET status = '90',
                err_text = 'OK',
                record_update_id = v_current_user,
                record_update_date = v_current_timestamp
            WHERE msg_id = msg_record.msg_id;
            
            v_processed_count := v_processed_count + 1;
            
        EXCEPTION
            WHEN OTHERS THEN
                v_error_message := SQLERRM;
                v_error_count := v_error_count + 1;
                
                UPDATE t_wms_sst_rcv_tab 
                SET status = '91',
                    err_text = SUBSTRING(v_error_message, 1, 200),
                    record_update_id = v_current_user,
                    record_update_date = v_current_timestamp
                WHERE msg_id = msg_record.msg_id;
                
                RAISE WARNING 'Error processing message ID %, Type %: %', 
                             msg_record.msg_id, msg_record.msg_type, v_error_message;
        END;
    END LOOP;
    
    p_processed_count := v_processed_count;
    p_error_count := v_error_count;
    p_status_message := FORMAT('Processed: %s successful, %s errors', 
                              v_processed_count, v_error_count);
    
    RAISE NOTICE 'WMS message processing completed. %', p_status_message;
END;
$$;

-- Utility procedure to process messages in batches
CREATE OR REPLACE PROCEDURE process_wms_rcv_messages_batch(
    OUT p_total_processed INTEGER,
    OUT p_total_errors INTEGER,
    IN p_batch_size INTEGER DEFAULT 100
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_batch_processed INTEGER;
    v_batch_errors INTEGER;
    v_status_msg TEXT;
    v_continue BOOLEAN := TRUE;
BEGIN
    p_total_processed := 0;
    p_total_errors := 0;
    
    WHILE v_continue LOOP
        -- Process a batch
        CALL process_wms_rcv_messages(v_batch_processed, v_batch_errors, v_status_msg);
        
        p_total_processed := p_total_processed + v_batch_processed;
        p_total_errors := p_total_errors + v_batch_errors;
        
        -- Continue if we processed any messages
        v_continue := (v_batch_processed > 0);
        
        -- Optional: Add delay between batches
        -- PERFORM pg_sleep(0.1);
    END LOOP;
    
END;
$$;