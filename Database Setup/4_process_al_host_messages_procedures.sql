-- AL Host Message Processing Stored Procedures
-- Processes messages from AL_HOST interface tables to operational tables

-- Process AL_HOST order/load data into operational tables
CREATE OR REPLACE FUNCTION process_al_host_orders()
RETURNS TABLE (
    processed_loads INTEGER,
    processed_orders INTEGER,
    error_count INTEGER,
    status_message TEXT
)
LANGUAGE plpgsql
AS $$
DECLARE
    load_record RECORD;
    detail_record RECORD;
    order_record RECORD;
    v_processed_loads INTEGER := 0;
    v_processed_orders INTEGER := 0;
    v_error_count INTEGER := 0;
    v_current_user VARCHAR(30) := 'QulronDB_AL_PROCESSOR';
    v_current_timestamp TIMESTAMP := NOW();
    v_error_message TEXT;
	v_existing_status VARCHAR(2);
	v_orders_in_load_count INTEGER := 0;
    
BEGIN
    -- Process load master records
    FOR load_record IN 
        SELECT id, load_id, status, broker_name, appointment_datetime, 
               potential_weight, record_create_id, record_create_date
        FROM t_al_host_load_master 
        WHERE status = '00'
        ORDER BY record_create_date ASC
    LOOP
        BEGIN
			-- Check if the order is attached to another load
			-- Check if load exists in t_open_load
			SELECT status INTO v_existing_status
            FROM t_open_load
            WHERE load_id = load_record.load_id;
			-- Check if the load exsist in open load, if yes with status 00 then just update
			-- if status is 10 90 then do a raise warning that the order is already being processed or shipped
			-- if status is cancelled 80 or the load is new then insert it
            -- Insert into t_open_load
            IF FOUND THEN
                -- Load exists - check status
                IF v_existing_status = '00' THEN
                    -- Update existing load with status 00
                    UPDATE t_open_load 
                    SET broker_name = load_record.broker_name,
                        appointment_datetime = load_record.appointment_datetime,
                        potential_weight = load_record.potential_weight,
                        record_update_id = v_current_user,
                        record_update_date = v_current_timestamp
                    WHERE load_id = load_record.load_id;
                    
                ELSIF v_existing_status IN ('10', '90') THEN
                    -- Load is being processed or shipped - raise warning
                    RAISE WARNING 'Load % is already being processed (status: %) or shipped', 
                                  load_record.load_id, v_existing_status;
                    
                    UPDATE t_al_host_load_master 
                    SET status = '91',
                        err_text = FORMAT('Load already in status %s', v_existing_status),
                        record_update_id = v_current_user,
                        record_update_date = v_current_timestamp
                    WHERE id = load_record.id;
                    
                    v_error_count := v_error_count + 1;
                    CONTINUE; -- Skip to next load
                    
                ELSIF v_existing_status = '80' THEN
                    -- Cancelled - treat as new and insert
                    INSERT INTO t_open_load (
                        load_id, status, broker_name, appointment_datetime, 
                        potential_weight, record_create_id, record_create_date
                    ) VALUES (
                        load_record.load_id, '00', load_record.broker_name, 
                        load_record.appointment_datetime, load_record.potential_weight,
                        load_record.record_create_id, load_record.record_create_date
                    );
                END IF;
            ELSE
                -- Load is new - insert it
                INSERT INTO t_open_load (
                    load_id, status, broker_name, appointment_datetime, 
                    potential_weight, record_create_id, record_create_date
                ) VALUES (
                    load_record.load_id, '00', load_record.broker_name, 
                    load_record.appointment_datetime, load_record.potential_weight,
                    load_record.record_create_id, load_record.record_create_date
                );
            END IF;
            
 			-- Process corresponding load details
            FOR detail_record IN 
                SELECT load_id, order_number, status, is_married_load
                FROM t_al_host_load_detail 
                WHERE load_id = load_record.load_id AND status = '00'
            LOOP
			    -- Check if the combination already exists
			    IF NOT EXISTS (
			        SELECT 1 
			        FROM t_open_load_detail 
			        WHERE load_id = detail_record.load_id 
			          AND order_number = detail_record.order_number
			    ) THEN
			        INSERT INTO t_open_load_detail (
			            load_id, order_number, status, is_married_load
			        ) VALUES (
			            detail_record.load_id, detail_record.order_number, '00',
			            CASE WHEN detail_record.is_married_load = 'Y' THEN TRUE ELSE FALSE END
			        );
			    END IF;

				SELECT COUNT(*) INTO v_orders_in_load_count
				FROM t_open_load_detail
				WHERE load_id = detail_record.load_id;
				
				IF v_orders_in_load_count > 1 THEN
					UPDATE t_open_load_detail
					SET is_married_load = TRUE
					WHERE load_id = detail_record.load_id;
				END IF;

				
                
                -- Mark detail as processed
                UPDATE t_al_host_load_detail 
                SET status = '90'
                WHERE load_id = detail_record.load_id 
                  AND order_number = detail_record.order_number 
                  AND status = '00';
            END LOOP;
            
            -- Mark load master as processed
            UPDATE t_al_host_load_master 
            SET status = '90',
                record_update_id = v_current_user,
                record_update_date = v_current_timestamp
            WHERE id = load_record.id;
            
            v_processed_loads := v_processed_loads + 1;
            
        EXCEPTION
            WHEN OTHERS THEN
                v_error_message := SQLERRM;
                v_error_count := v_error_count + 1;
                
                UPDATE t_al_host_load_master 
                SET status = '91',
                    err_text = SUBSTRING(v_error_message, 1, 200),
                    record_update_id = v_current_user,
                    record_update_date = v_current_timestamp
                WHERE id = load_record.id;
                
                RAISE WARNING 'Error processing load ID %: %', load_record.load_id, v_error_message;
        END;
    END LOOP;

    -- Process order records
    FOR order_record IN 
        SELECT id, order_number, status, warehouse, warehouse_code, 
               warehouse_address, customer_name, dest_addr, dest_city,
               dest_state, dest_zip, dest_country_code, record_create_id, record_create_date
        FROM t_al_host_order 
        WHERE status = '00'
        ORDER BY record_create_date ASC
    LOOP
        BEGIN
			-- Check if load exists in t_open_load
			SELECT status INTO v_existing_status
            FROM t_open_order
            WHERE order_number = order_record.order_number;

			 IF FOUND THEN
                -- Load exists - check status
                IF v_existing_status = '00' THEN
                    -- Update existing load with status 00
                    UPDATE t_open_order 
                    SET warehouse = order_record.warehouse,
		                warehouse_code = order_record.warehouse_code,
		                warehouse_address = order_record.warehouse_address,
		                customer_name = order_record.customer_name,
		                dest_addr = order_record.dest_addr,
		                dest_city = order_record.dest_city,
		                dest_state = order_record.dest_state,
		                dest_zip = order_record.dest_zip,
		                dest_country_code = order_record.dest_country_code,
						record_update_id = v_current_user,
                        record_update_date = v_current_timestamp
                    WHERE order_number = order_record.order_number;
                    
                ELSIF v_existing_status IN ('10', '90') THEN
                    -- Load is being processed or shipped - raise warning
                    RAISE WARNING 'Load % is already being processed (status: %) or shipped', 
                                  load_record.load_id, v_existing_status;
                    
				UPDATE t_al_host_order 
				    SET status = '91',
				        err_text = CASE 
				            WHEN v_existing_status = '10' THEN FORMAT('Order already in process')
				            WHEN v_existing_status = '90' THEN FORMAT('Order already shipped')
				            END,
				        record_update_id = v_current_user,
				        record_update_date = v_current_timestamp
				    WHERE id = load_record.id;
                    
                    v_error_count := v_error_count + 1;
                    CONTINUE; -- Skip to next load
                    
                ELSIF v_existing_status = '80' THEN
                    -- Cancelled - treat as new and insert
		            INSERT INTO t_open_order (
		                order_number, status, warehouse, warehouse_code, warehouse_address,
		                customer_name, dest_addr, dest_city, dest_state, dest_zip,
		                dest_country_code, record_create_id, record_create_date
		            ) VALUES (
		                order_record.order_number, '00', order_record.warehouse, 
		                order_record.warehouse_code, order_record.warehouse_address,
		                order_record.customer_name, order_record.dest_addr,
		                order_record.dest_city, order_record.dest_state, order_record.dest_zip,
		                order_record.dest_country_code, order_record.record_create_id,
		                order_record.record_create_date
		            );
                END IF;
            ELSE
                -- Order is new - insert it
	            INSERT INTO t_open_order (
	                order_number, status, warehouse, warehouse_code, warehouse_address,
	                customer_name, dest_addr, dest_city, dest_state, dest_zip,
	                dest_country_code, record_create_id, record_create_date
	            ) VALUES (
	                order_record.order_number, '00', order_record.warehouse, 
	                order_record.warehouse_code, order_record.warehouse_address,
	                order_record.customer_name, order_record.dest_addr,
	                order_record.dest_city, order_record.dest_state, order_record.dest_zip,
	                order_record.dest_country_code, order_record.record_create_id,
	                order_record.record_create_date
	            );
            END IF;
            
            -- Mark order as processed
            UPDATE t_al_host_order 
            SET status = '90',
                record_update_id = v_current_user,
                record_update_date = v_current_timestamp
            WHERE id = order_record.id;
            
            v_processed_orders := v_processed_orders + 1;
            
        EXCEPTION
            WHEN OTHERS THEN
                v_error_message := SQLERRM;
                v_error_count := v_error_count + 1;
                
                UPDATE t_al_host_order 
                SET status = '91',
                    record_update_id = v_current_user,
                    record_update_date = v_current_timestamp
                WHERE id = order_record.id;
                
                RAISE WARNING 'Error processing order %: %', order_record.order_number, v_error_message;
        END;
    END LOOP;
    
    RETURN QUERY SELECT v_processed_loads, v_processed_orders, v_error_count, 
                       FORMAT('Processed: %s loads, %s orders, %s errors', 
                             v_processed_loads, v_processed_orders, v_error_count);
END;
$$;


-- Process AL_HOST task data into t_task table while updating old tasks
CREATE OR REPLACE FUNCTION process_al_host_tasks()
RETURNS TABLE (
    processed_tasks INTEGER,
    updated_old_tasks INTEGER,
    error_count INTEGER,
    status_message TEXT
)
LANGUAGE plpgsql
AS $$
DECLARE
    task_record RECORD;
    v_processed_tasks INTEGER := 0;
    v_updated_old_tasks INTEGER := 0;
    v_error_count INTEGER := 0;
    v_current_user VARCHAR(30) := 'QulronDB_AL_PROCESSOR';
    v_current_timestamp TIMESTAMP := NOW();
    v_error_message TEXT;
    v_lm_id BIGINT;
    v_old_task_count INTEGER;
    
BEGIN
    -- Process task records
    FOR task_record IN 
        SELECT id, load_id, status, destination_area, destination_location,
               record_create_id, record_create_date
        FROM t_al_host_task 
        WHERE status = '00'
        ORDER BY record_create_date ASC
    LOOP
        BEGIN
            -- Get the lm_id from t_load_master using load_id
            SELECT lm_id INTO v_lm_id
            FROM t_load_master 
            WHERE load_id = task_record.load_id::VARCHAR;
            
            IF v_lm_id IS NULL THEN
                RAISE EXCEPTION 'Load ID % not found in t_load_master', task_record.load_id;
            END IF;
            
            -- Update any existing active tasks for this load to finished (90)
            UPDATE t_task 
            SET status = '90',
                record_update_id = v_current_user,
                record_update_date = v_current_timestamp
            WHERE lm_id = v_lm_id 
              AND status IN ('00', '20'); -- Created or Started tasks
            
            GET DIAGNOSTICS v_old_task_count = ROW_COUNT;
            v_updated_old_tasks := v_updated_old_tasks + v_old_task_count;
            
            -- Insert new task
            INSERT INTO t_task (
                lm_id, status, destination_area, destination_location,
                record_create_id, record_create_date
            ) VALUES (
                v_lm_id, '00', task_record.destination_area, task_record.destination_location,
                task_record.record_create_id, task_record.record_create_date
            );
            
            -- Mark AL_HOST task as processed
            UPDATE t_al_host_task 
            SET status = '90',
                record_update_id = v_current_user,
                record_update_date = v_current_timestamp
            WHERE id = task_record.id;
            
            v_processed_tasks := v_processed_tasks + 1;
            
        EXCEPTION
            WHEN OTHERS THEN
                v_error_message := SQLERRM;
                v_error_count := v_error_count + 1;
                
                UPDATE t_al_host_task 
                SET status = '91',
                    err_text = SUBSTRING(v_error_message, 1, 200),
                    record_update_id = v_current_user,
                    record_update_date = v_current_timestamp
                WHERE id = task_record.id;
                
                RAISE WARNING 'Error processing task for load ID %: %', task_record.load_id, v_error_message;
        END;
    END LOOP;
    
    RETURN QUERY SELECT v_processed_tasks, v_updated_old_tasks, v_error_count,
                       FORMAT('Processed: %s tasks, updated %s old tasks, %s errors', 
                             v_processed_tasks, v_updated_old_tasks, v_error_count);
END;
$$;


-- Main procedure to process all AL_HOST messages
CREATE OR REPLACE PROCEDURE process_al_host_messages(
    OUT p_total_loads INTEGER,
    OUT p_total_orders INTEGER,
    OUT p_total_tasks INTEGER,
    OUT p_total_old_tasks_updated INTEGER,
    OUT p_total_errors INTEGER,
    OUT p_status_message TEXT
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_order_result RECORD;
    v_task_result RECORD;
    v_current_timestamp TIMESTAMP := NOW();
BEGIN
    p_total_loads := 0;
    p_total_orders := 0;
    p_total_tasks := 0;
    p_total_old_tasks_updated := 0;
    p_total_errors := 0;
    
    RAISE NOTICE 'Starting AL_HOST message processing at %', v_current_timestamp;
    
    -- Process orders and loads
    SELECT * INTO v_order_result FROM process_al_host_orders();
    p_total_loads := v_order_result.processed_loads;
    p_total_orders := v_order_result.processed_orders;
    p_total_errors := p_total_errors + v_order_result.error_count;
    
    -- Process tasks
    SELECT * INTO v_task_result FROM process_al_host_tasks();
    p_total_tasks := v_task_result.processed_tasks;
    p_total_old_tasks_updated := v_task_result.updated_old_tasks;
    p_total_errors := p_total_errors + v_task_result.error_count;
    
    p_status_message := FORMAT('AL_HOST Processing Complete - Loads: %s, Orders: %s, Tasks: %s, Old Tasks Updated: %s, Errors: %s', 
                              p_total_loads, p_total_orders, p_total_tasks, p_total_old_tasks_updated, p_total_errors);
    
    RAISE NOTICE 'AL_HOST message processing completed. %', p_status_message;
END;
$$;


-- Batch processing procedure for AL_HOST messages
CREATE OR REPLACE PROCEDURE process_al_host_messages_batch(
    OUT p_total_loads INTEGER,
    OUT p_total_orders INTEGER,
    OUT p_total_tasks INTEGER,
    OUT p_total_old_tasks_updated INTEGER,
    OUT p_total_errors INTEGER
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_batch_loads INTEGER;
    v_batch_orders INTEGER;
    v_batch_tasks INTEGER;
    v_batch_old_tasks INTEGER;
    v_batch_errors INTEGER;
    v_status_msg TEXT;
    v_continue BOOLEAN := TRUE;
    v_iteration_count INTEGER := 0;
    v_max_iterations INTEGER := 10; -- Prevent infinite loops
BEGIN
    p_total_loads := 0;
    p_total_orders := 0;
    p_total_tasks := 0;
    p_total_old_tasks_updated := 0;
    p_total_errors := 0;
    
    WHILE v_continue AND v_iteration_count < v_max_iterations LOOP
        v_iteration_count := v_iteration_count + 1;
        
        -- Process a batch
        CALL process_al_host_messages(
            v_batch_loads, v_batch_orders, v_batch_tasks, 
            v_batch_old_tasks, v_batch_errors, v_status_msg
        );
        
        p_total_loads := p_total_loads + v_batch_loads;
        p_total_orders := p_total_orders + v_batch_orders;
        p_total_tasks := p_total_tasks + v_batch_tasks;
        p_total_old_tasks_updated := p_total_old_tasks_updated + v_batch_old_tasks;
        p_total_errors := p_total_errors + v_batch_errors;
        
        -- Continue if we processed any messages
        v_continue := (v_batch_loads > 0 OR v_batch_orders > 0 OR v_batch_tasks > 0);
        
        -- Optional: Add delay between batches
        -- PERFORM pg_sleep(0.1);
    END LOOP;
    
END;
$$;
