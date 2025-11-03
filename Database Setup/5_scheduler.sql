-- If you want to add more processors, you can add more rows to the t_scheduler_control table
/*
-- Just update the constraint
ALTER TABLE t_scheduler_control 
DROP CONSTRAINT valid_processor_id;

ALTER TABLE t_scheduler_control 
ADD CONSTRAINT valid_processor_id CHECK (id IN (1, 2, 3, 4));

-- Then add new processors
INSERT INTO t_scheduler_control (id, process_name) 
VALUES (3, 'scheduled_report_processor');
*/

-- First, create a control table to manage the scheduler
CREATE TABLE IF NOT EXISTS t_scheduler_control (
    id INTEGER PRIMARY KEY,
	process_name VARCHAR(200) NOT NULL UNIQUE,
    is_running BOOLEAN DEFAULT FALSE,
    last_run_start TIMESTAMP,
    last_run_end TIMESTAMP,
    last_processed_count INTEGER DEFAULT 0,
    last_error_count INTEGER DEFAULT 0,
    process_pid INTEGER,
    status_message TEXT,
    CONSTRAINT valid_processor_id CHECK (id IN (1, 2, 3)),
    CONSTRAINT unique_process_name UNIQUE (process_name)
);

-- Insert the control rows for different processors
-- scheduled_wms processing
INSERT INTO t_scheduler_control (id, process_name) VALUES (1, 'scheduled_wms_processor') ON CONFLICT DO NOTHING;
-- al_host processing
INSERT INTO t_scheduler_control (id, process_name) VALUES (2, 'scheduled_al_host_processor') ON CONFLICT DO NOTHING;
-- sequential processor
INSERT INTO t_scheduler_control (id, process_name) VALUES (3, 'sequential_message_processor') ON CONFLICT DO NOTHING;
    
SELECT * FROM t_scheduler_control;

-- Create the scheduled processor function
CREATE OR REPLACE FUNCTION scheduled_wms_processor()
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
    v_is_running BOOLEAN;
    v_processed_count INTEGER;
    v_error_count INTEGER;
    v_status_msg TEXT;
    v_current_pid INTEGER := pg_backend_pid();
BEGIN
    -- Check if already running (atomic check and set)
    UPDATE t_scheduler_control 
    SET is_running = TRUE,
        last_run_start = NOW(),
        process_pid = v_current_pid
    WHERE id = 1 AND is_running = FALSE;
    
    -- If no rows were updated, another process is running
    IF NOT FOUND THEN
        RAISE NOTICE 'WMS processor already running, skipping this cycle';
        RETURN;
    END IF;
    
    BEGIN
        RAISE NOTICE 'Starting scheduled WMS message processing';
        
        -- Process all pending messages
        CALL process_wms_rcv_messages_batch( v_processed_count, v_error_count, 100);
        
        -- Update control table with results
        UPDATE t_scheduler_control 
        SET is_running = FALSE,
            last_run_end = NOW(),
            last_processed_count = v_processed_count,
            last_error_count = v_error_count,
            status_message = FORMAT('Success: %s processed, %s errors', v_processed_count, v_error_count),
            process_pid = NULL
        WHERE id = 1;
        
        RAISE NOTICE 'Completed: % processed, % errors', v_processed_count, v_error_count;
        
    EXCEPTION
        WHEN OTHERS THEN
            -- Ensure we release the lock even on error
            UPDATE t_scheduler_control 
            SET is_running = FALSE,
                last_run_end = NOW(),
                status_message = FORMAT('ERROR: %s', SQLERRM),
                process_pid = NULL
            WHERE id = 1;
            
            RAISE WARNING 'Error in scheduled WMS processor: %', SQLERRM;
    END;
END;
$$;

-- Create the scheduled AL_HOST processor function
CREATE OR REPLACE FUNCTION scheduled_al_host_processor()
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
    v_is_running BOOLEAN;
    v_total_loads INTEGER;
    v_total_orders INTEGER;
    v_total_tasks INTEGER;
    v_total_old_tasks_updated INTEGER;
    v_total_errors INTEGER;
    v_status_msg TEXT;
    v_current_pid INTEGER := pg_backend_pid();
BEGIN
    -- Check if already running (atomic check and set)
    UPDATE t_scheduler_control 
    SET is_running = TRUE,
        last_run_start = NOW(),
        process_pid = v_current_pid
    WHERE id = 2 AND is_running = FALSE;
    
    -- If no rows were updated, another process is running
    IF NOT FOUND THEN
        RAISE NOTICE 'AL_HOST processor already running, skipping this cycle';
        RETURN;
    END IF;
    
    BEGIN
        RAISE NOTICE 'Starting scheduled AL_HOST message processing';
        
        -- Process all pending AL_HOST messages
        CALL process_al_host_messages_batch(
            v_total_loads, 
            v_total_orders, 
            v_total_tasks, 
            v_total_old_tasks_updated, 
            v_total_errors
        );
        
        -- Calculate total processed items
        v_status_msg := FORMAT('Success: %s loads, %s orders, %s tasks, %s old tasks updated, %s errors', 
                              v_total_loads, v_total_orders, v_total_tasks, v_total_old_tasks_updated, v_total_errors);
        
        -- Update control table with results
        UPDATE t_scheduler_control 
        SET is_running = FALSE,
            last_run_end = NOW(),
            last_processed_count = v_total_loads + v_total_orders + v_total_tasks,
            last_error_count = v_total_errors,
            status_message = v_status_msg,
            process_pid = NULL
        WHERE id = 2;
        
        RAISE NOTICE 'Completed AL_HOST processing: %', v_status_msg;
        
    EXCEPTION
        WHEN OTHERS THEN
            -- Ensure we release the lock even on error
            UPDATE t_scheduler_control 
            SET is_running = FALSE,
                last_run_end = NOW(),
                status_message = FORMAT('ERROR: %s', SQLERRM),
                process_pid = NULL
            WHERE id = 2;
            
            RAISE WARNING 'Error in scheduled AL_HOST processor: %', SQLERRM;
    END;
END;
$$;

-- Create a sequential processor that runs WMS first, then AL_HOST
CREATE OR REPLACE FUNCTION sequential_message_processor()
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
    v_is_running BOOLEAN;
    v_current_pid INTEGER := pg_backend_pid();
    v_wms_processed INTEGER;
    v_wms_errors INTEGER;
    v_al_loads INTEGER;
    v_al_orders INTEGER;
    v_al_tasks INTEGER;
    v_al_old_tasks INTEGER;
    v_al_errors INTEGER;
    v_total_processed INTEGER;
    v_total_errors INTEGER;
    v_status_msg TEXT;
BEGIN

    UPDATE t_scheduler_control 
    SET is_running = TRUE,
        last_run_start = NOW(),
        process_pid = v_current_pid
    WHERE id = 3 AND is_running = FALSE;
    
    -- If no rows were updated, another process is running
    IF NOT FOUND THEN
        RAISE NOTICE 'Sequential processor already running, skipping this cycle';
        RETURN;
    END IF;
    
    BEGIN
        RAISE NOTICE 'Starting sequential message processing (WMS → AL_HOST)';
        
        -- Step 1: Process WMS messages first
        CALL process_wms_rcv_messages_batch(v_wms_processed, v_wms_errors);
        RAISE NOTICE 'WMS processing completed: % processed, % errors', v_wms_processed, v_wms_errors;
        
        -- Step 2: Process AL_HOST messages after WMS is done
        CALL process_al_host_messages_batch(
            v_al_loads, v_al_orders, v_al_tasks, v_al_old_tasks, v_al_errors
        );
        RAISE NOTICE 'AL_HOST processing completed: % loads, % orders, % tasks, % old tasks updated, % errors', 
                     v_al_loads, v_al_orders, v_al_tasks, v_al_old_tasks, v_al_errors;
        
        -- Calculate totals
        v_total_processed := v_wms_processed + v_al_loads + v_al_orders + v_al_tasks;
        v_total_errors := v_wms_errors + v_al_errors;
        
        v_status_msg := FORMAT('Sequential Success: WMS(%s proc, %s err) → AL_HOST(%s loads, %s orders, %s tasks, %s old tasks, %s err)', 
                              v_wms_processed, v_wms_errors, v_al_loads, v_al_orders, v_al_tasks, v_al_old_tasks, v_al_errors);
        
        -- Update control table with results
        UPDATE t_scheduler_control 
        SET is_running = FALSE,
            last_run_end = NOW(),
            last_processed_count = v_total_processed,
            last_error_count = v_total_errors,
            status_message = v_status_msg,
            process_pid = NULL
        WHERE id = 3;
        
        RAISE NOTICE 'Sequential processing completed: %', v_status_msg;
        
    EXCEPTION
        WHEN OTHERS THEN
            -- Ensure we release the lock even on error
            UPDATE t_scheduler_control 
            SET is_running = FALSE,
                last_run_end = NOW(),
                status_message = FORMAT('ERROR: %s', SQLERRM),
                process_pid = NULL
            WHERE id = 3;
            
            RAISE WARNING 'Error in sequential processor: %', SQLERRM;
    END;
END;
$$;

SELECT id, process_name, is_running, last_run_start, last_run_end, status_message
FROM t_scheduler_control
WHERE id IN (1, 2, 3);

