
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
	* ADD01: Create data for new orders so broker can set up thier order -----  usp_azb_import_order_auto_load_plan
	* ADD02: Create a task based on HJ assigning to A door or yard (Will Auto Complete the past task) ----- usp_azb_ww_ddm_dc_action_open, usp_azb_ww_add_to_yard
	* ADD03: Create a task to exit the facility and Mark order as Complete When Order is shipped (Will Auto Complete the past task)
	* ADD04: Appointment Got Inserted/Updated ----- usp_al_azb_import_appointment
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
