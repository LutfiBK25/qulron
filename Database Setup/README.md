# Qulron YMS Database Processing System

## Overview

This document describes the complete data flow from when WMS (Warehouse Management System) enters data into the system until it reaches the operational tables and creates driver tasks.

## System Architecture

```
WMS System → Interface Tables → AL_HOST Tables → Operational Tables → Driver Tasks
     ↓              ↓               ↓               ↓               ↓
t_wms_sst_rcv_tab → Processing → AL_HOST Tables → t_open_* Tables → t_task
```

## Data Flow Process

### Phase 1: WMS Data Entry

**Entry Point:** `t_wms_sst_rcv_tab`

When WMS systems send data to YMS, it gets inserted into the message receive table:

```sql
-- WMS creates messages in this table
INSERT INTO t_wms_sst_rcv_tab (
    msg_type, sender, receiver, status, warehouse, warehouse_code,
    load_id, order_number, customer_name, appointment_datetime,
    broker_name, driver_name, phone_number, dest_area, dest_location, ...
) VALUES (...);
```

**Message Types:**

- `ADD01`: Create new orders/loads (when Bettaway sends appointments)
- `ADD02`: Create driver tasks (when HJ assigns to door/yard)
- `ADD03`: Exit facility tasks (mark orders complete)
- `UPD01`: Appointment updates
- `UPD02`: Load updates
- `DEL01`: Order cancellations

**Status Codes:**

- `00`: Created (ready for processing)
- `90`: Finished (successfully processed)
- `91`: Error (processing failed)

---

### Phase 2: WMS Message Processing

**Processor:** `process_wms_rcv_messages()`

The WMS processor runs every minute and processes messages based on type:

#### ADD01 Message Processing

```sql
-- Creates interface records for broker queue
CALL process_add01_message(
    warehouse, warehouse_code, warehouse_address,
    load_id, order_number, customer_name, customer_address,
    appointment_datetime, broker_name, current_user, potential_weight
);
```

**Creates records in:**

- `t_al_host_load_master` - Load header information
- `t_al_host_load_detail` - Load-to-order relationships
- `t_al_host_order` - Order details

#### ADD02 Message Processing

```sql
-- Creates task assignments
CALL process_add02_message(
    load_id, task_area, task_location, current_user
);
```

**Creates records in:**

- `t_al_host_task` - Driver task assignments

**Processing Logic:**

- Uses database locks (`FOR UPDATE SKIP LOCKED`) to prevent concurrent processing
- Validates required fields before processing
- Handles married loads (multiple orders per load)
- Updates message status to `90` (success) or `91` (error)

---

### Phase 3: AL_HOST Interface Processing

**Processor:** `process_al_host_messages()`

The AL_HOST processor moves data from interface tables to operational tables:

#### Order/Load Processing

```sql
-- Processes AL_HOST data into operational tables
SELECT * FROM process_al_host_orders();
```

**Data Movement:**

1. `t_al_host_load_master` → `t_open_load`
2. `t_al_host_load_detail` → `t_open_load_detail`
3. `t_al_host_order` → `t_open_order`

**Key Transformations:**

- Converts Y/N married load flags to boolean values
- Maintains original timestamps while adding processing timestamps
- Preserves all broker queue information

#### Task Processing

```sql
-- Processes tasks and manages task lifecycle
SELECT * FROM process_al_host_tasks();
```

**Task Management Logic:**

1. Looks up `lm_id` from `t_load_master` using `load_id`
2. **Updates existing active tasks** (status '00'/'20') to finished ('90')
3. Creates new task with status '00' (Created)
4. Links task to load master via foreign key

---

### Phase 4: Driver Operations

**Final Tables:** Operational system ready for driver interaction

#### Broker Dashboard (`t_open_*` tables)

- **`t_open_load`**: Available loads for broker assignment
- **`t_open_load_detail`**: Order-to-load relationships
- **`t_open_order`**: Order details for broker review

#### Driver Assignment Flow

When broker assigns driver to load:

1. **Broker Action**: Assigns driver to load from `t_open_load`
2. **System Creates**: Record in `t_load_master` with driver details
3. **System Moves**: Orders from `t_open_*` to `t_order` and `t_load_detail`

#### Task Assignment

```sql
-- Driver tasks are created/updated in t_task
SELECT task_id, lm_id, status, destination_area, destination_location
FROM t_task
WHERE status IN ('00', '20'); -- Created or Started
```

---

## Processing Schedule

### Sequential Processing (Recommended)

Both processors run in sequence every minute:

```sql
-- Cron job runs every minute
SELECT cron.schedule(
    'sequential-processor-every-minute',
    '* * * * *',
    'SELECT sequential_message_processor();'
);
```

**Execution Order:**

1. WMS message processing (handles WMS → AL_HOST)
2. AL_HOST message processing (handles AL_HOST → Operational)

**Benefits:**

- Guarantees processing order
- Prevents data conflicts
- Comprehensive error handling

---

## Status Codes Throughout System

### Message Processing Status

- `00`: Created/Ready for processing
- `90`: Successfully processed/finished
- `91`: Error during processing

### Load/Order Status

- `00`: Created (broker queue)
- `10`: Activated (driver assigned/arrived)
- `20`: Started (driver has location assignment)
- `80`: Cancelled
- `90`: Finished (shipped)

### Task Status

- `00`: Created (task assigned to driver)
- `20`: Started (driver en route)
- `80`: Cancelled/Skipped
- `90`: Finished (driver arrived)

---

## Key Database Objects

### Core Tables

```sql
-- WMS Interface
t_wms_sst_rcv_tab          -- WMS message input
t_wms_sst_snd_tab          -- WMS message output

-- AL_HOST Interface
t_al_host_load_master      -- Load staging
t_al_host_load_detail      -- Load detail staging
t_al_host_order            -- Order staging
t_al_host_task             -- Task staging

-- Operational Tables
t_open_load                -- Broker queue loads
t_open_load_detail         -- Broker queue load details
t_open_order               -- Broker queue orders
t_load_master              -- Active loads with drivers
t_load_detail              -- Active load details
t_order                    -- Active orders
t_task                     -- Driver tasks
t_yard_location            -- Location coordinates
```

### Key Stored Procedures

```sql
-- WMS Processing
process_wms_rcv_messages()              -- Main WMS processor
process_wms_rcv_messages_batch()        -- Batch WMS processor
process_add01_message()                 -- Handle order creation
process_add02_message()                 -- Handle task creation

-- AL_HOST Processing
process_al_host_messages()              -- Main AL_HOST processor
process_al_host_messages_batch()        -- Batch AL_HOST processor
process_al_host_orders()                -- Move orders to operational
process_al_host_tasks()                 -- Move tasks to operational

-- Scheduling
sequential_message_processor()          -- Sequential processor
scheduled_wms_processor()               -- WMS scheduler
scheduled_al_host_processor()           -- AL_HOST scheduler
```

### Monitoring Functions

```sql
-- Status Monitoring
get_wms_processor_status()              -- WMS processor status
get_al_host_processor_status()          -- AL_HOST processor status
get_sequential_processor_status()       -- Sequential processor status

-- Manual Triggers
trigger_wms_processing()                -- Manual WMS processing
trigger_al_host_processing()            -- Manual AL_HOST processing
trigger_sequential_processing()         -- Manual sequential processing
```

---

## Sample Data Flow Example

### 1. WMS Sends New Order (ADD01)

```sql
INSERT INTO t_wms_sst_rcv_tab (
    msg_type, sender, receiver, status,
    warehouse, warehouse_code, load_id, order_number,
    customer_name, appointment_datetime, broker_name, ...
) VALUES (
    'ADD01', 'WMS_SYSTEM', 'YMS_SYSTEM', '00',
    'Edison Warehouse', 'AB01', 'LOAD123', 'ORDER456',
    'ACME Corp', '2024-01-15 14:30:00', 'FastFreight', ...
);
```

### 2. WMS Processor Creates AL_HOST Records

```sql
-- Creates in AL_HOST tables
t_al_host_load_master: LOAD123, FastFreight, 2024-01-15 14:30:00
t_al_host_load_detail: LOAD123, ORDER456, married=N
t_al_host_order: ORDER456, Edison Warehouse, ACME Corp
```

### 3. AL_HOST Processor Moves to Operational

```sql
-- Creates in operational tables
t_open_load: LOAD123, status=00, broker=FastFreight
t_open_load_detail: LOAD123, ORDER456, married=false
t_open_order: ORDER456, status=00, warehouse=Edison
```

### 4. WMS Sends Task Assignment (ADD02)

```sql
INSERT INTO t_wms_sst_rcv_tab (
    msg_type, load_id, dest_area, dest_location, ...
) VALUES (
    'ADD02', 'LOAD123', 'AB01', 'L0DOCK25', ...
);
```

### 5. Task Created for Driver

```sql
-- After broker assigns driver and creates t_load_master
t_task: lm_id=567, status=00, destination=AB01/L0DOCK25
```

---

## Error Handling

### WMS Processing Errors

- Invalid required fields → Status `91` with error message
- Duplicate processing attempts → Skipped with notice
- Database constraints → Rolled back with error logging

### AL_HOST Processing Errors

- Missing load_master records → Task creation fails with error
- Constraint violations → Individual record marked as error
- Processing continues for other valid records

### Monitoring & Alerts

```sql
-- Check for processing errors
SELECT msg_type, load_id, order_number, err_text
FROM t_wms_sst_rcv_tab
WHERE status = '91'
ORDER BY record_create_date DESC;

-- Check processor status
SELECT * FROM get_sequential_processor_status();
```

---

## Maintenance Operations

### View Current Processing Status

```sql
-- Check all processors
SELECT id, process_name, is_running, last_run_start, last_run_end, status_message
FROM t_scheduler_control;

-- Check pending messages
SELECT COUNT(*) as pending_wms FROM t_wms_sst_rcv_tab WHERE status = '00';
SELECT COUNT(*) as pending_al_host_loads FROM t_al_host_load_master WHERE status = '00';
SELECT COUNT(*) as pending_al_host_tasks FROM t_al_host_task WHERE status = '00';
```

### Manual Processing

```sql
-- Trigger manual processing
SELECT * FROM trigger_sequential_processing();

-- Or process individually
SELECT * FROM trigger_wms_processing();
SELECT * FROM trigger_al_host_processing();
```

### Troubleshooting

```sql
-- Check cron job status
SELECT * FROM cron.job WHERE jobname = 'sequential-processor-every-minute';

-- Check recent job runs
SELECT * FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'sequential-processor-every-minute')
ORDER BY start_time DESC LIMIT 10;
```

---

## Performance Considerations

### Batch Processing

- Both processors use batch operations to handle multiple records efficiently
- Database locks prevent concurrent processing conflicts
- Error isolation ensures individual failures don't stop batch processing

### Indexing

Key indexes for performance:

- `t_wms_sst_rcv_tab`: status, msg_type, date+status
- `t_al_host_*`: status columns for processing queries
- `t_task`: lm_id, status for task management
- `t_yard_location`: destination area/location for lookups

### Monitoring Recommendations

- Monitor processor execution times
- Check for growing error counts
- Watch for stuck processing (is_running=true for extended periods)
- Verify cron job execution frequency
