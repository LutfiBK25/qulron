
SELECT *
FROM OPENQUERY(QULRON, 'SELECT * FROM "public"."t_wms_sst_snd_tab"')



SELECT *
FROM OPENQUERY(QULRON, 'SELECT * FROM "public"."t_wms_sst_rcv_tab"')


-- SND/RCV Tables Status
-- 00 Created : WMS Created The Message
-- 90 FINISHED: Message Processed
-- 91 ERROR: Error during Message Processing
-- Messages From WMS to YMS
/*
Current RCV Tasks
	* ADD01: Create data for new orders so broker can set up thier order (When Bettaway Sends the appointment)
	* ADD02: Create a task based on HJ assigning to A door or yard (Will Auto Complete the past task)
	* ADD03: Create a task to exit the facility and Mark order as Complete (Will Auto Complete the past task)
	* UPD01: Appointment Got Updated
	* UPD02: Load Got Updated
	* DEL01: Order removed from WMS, remove it from the system by marking it as cancelled
*/

--INSERT INTO OPENQUERY(
--    QULRON,
--    'SELECT msg_type, sender, receiver, status, err_text, warehouse, warehouse_code, warehouse_address, load_id, order_number, customer_name, customer_address, appointment_datetime, potential_weight, broker_name, driver_name, phone_number, dest_area, dest_location, property_1, property_2, property_3, record_create_id, record_create_date FROM t_wms_sst_rcv_tab'
--)
--VALUES (
--    'APPT', 'WMS_SYS', 'SST_SYS', 'COMPLTD', NULL, 'Main Warehouse Facility', 'MWF01',
--    '123 Shipping Lane, Anytown', 'LOAD12345', 'ORD98765', 'Global Logistics Inc.', '456 Delivery Ave, Othercity',
--    '2025-10-02 10:00:00', 1500.50, 'Fast Brokers LLC', 'John Doe', '5551234567',
--    'NORTH', 'DOCK_A', NULL, NULL, NULL,
--    'TEST_USER', '2025-10-01 16:16:33' -- Use a specific timestamp instead of CURRENT_TIMESTAMP
--);

/*
Current SND Tasks
	* ADD01: Data to open dock door or assign to yard
*/


SELECT
    ISNULL(ldm.wh_id,'NA') AS wh_id,
    ISNULL(ldm.load_id,'NA') AS load_id,
    CASE WHEN ddm.status IN ('ACTIVE','OPENED','CLOSED') OR ldm.load_id IS NULL
    THEN NULL ELSE 'Send to Door' 
    END AS open_dock_door,
    CASE WHEN yard.order_number IS NOT NULL OR ddm.status IN ('ACTIVE','OPENED','CLOSED') OR ldm.load_id IS NULL
	THEN NULL ELSE 'Send to Yard'
    END AS send_to_yard,
    qulron.order_numbers,
    qulron.broker_name,
    qulron.driver_name,
    qulron.phone_number,
    qulron.trailer_number,
    qulron.record_create_date as arrival_date,
    CASE 
            WHEN ldm.status = 'R' THEN 'Released'
            WHEN ldm.status = 'F' THEN 'Allocated'
            WHEN ldm.status = 'A' THEN 'Allocating'
            WHEN ldm.status = 'N' THEN 'New'
            WHEN ldm.status = 'H' THEN 'Hold'
            WHEN ldm.status = 'E' THEN 'Error'
            ELSE 'N/A' 
    END AS allocation_status,
    CASE 
            WHEN ldm.stage_loc IS NULL THEN 'NOT STAGED'
            ELSE ldm.stage_loc 
    END AS staging_location
FROM OPENQUERY(QULRON, 
	'SELECT load_id,order_numbers,broker_name
    ,driver_name,phone_number,trailer_number,record_create_date
	FROM "public"."t_wms_sst_snd_tab"
	WHERE status = ''00''
	AND msg_type = ''ADD01''
	') as qulron
LEFT JOIN t_load_master ldm
ON ldm.load_id = qulron.load_id
LEFT JOIN t_af_load_detail ald (NOLOCK)
	ON ald.wh_id = ldm.wh_id
	AND ald.load_id = ldm.load_id
LEFT JOIN t_azb_dock_door_management (NOLOCK) ddm
	ON ldm.wh_id = ddm.wh_id 
	AND ldm.load_id = ddm.document_id
LEFT JOIN t_azb_yard (NOLOCK) yard
	ON ald.wh_id = yard.wh_id
	AND ald.order_number = yard.order_number
	AND yard.status IN ('L','D','E')