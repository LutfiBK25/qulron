SELECT * FROM t_wms_sst_snd_tab 
SELECT * FROM t_wms_sst_rcv_tab 
SELECT * FROM t_al_host_load_master
SELECT * FROM t_al_host_load_detail
SELECT * FROM t_al_host_order
SELECT * FROM t_al_host_task
SELECT * FROM t_driver_location 
SELECT * FROM t_open_load_detail 
SELECT * FROM t_open_load
SELECT * FROM t_open_order
SELECT * FROM t_load_master
SELECT * FROM t_load_detail
SELECT * FROM t_order
SELECT * FROM t_trailer
SELECT * FROM t_task

-- Insert an order
INSERT INTO public.t_wms_sst_rcv_tab(
	msg_type, sender, receiver, status, warehouse, warehouse_code, warehouse_address,
	load_id, order_number, customer_name, dest_addr, dest_city, dest_state, dest_zip,
	dest_country_code, appointment_datetime,potential_weight, broker_name, record_create_id,
	record_create_date)
	VALUES ( 'ADD01', 'WMS', 'YMS', '00', 'Keasby Warehouse', 'AB31',
	'One Arizona Way KEASBEY NJ 08832', '283935', '8716822',
	'Costco Co.','400 Washington Ave','Hackensack', 'NJ','07601','USA',
	NULL, NULL, 'abc broker', 'WMS', NOW());

-- Insert an order
INSERT INTO public.t_wms_sst_rcv_tab(
	msg_type, sender, receiver, status, warehouse, warehouse_code, warehouse_address,
	load_id, order_number, customer_name, dest_addr, dest_city, dest_state, dest_zip,
	dest_country_code, appointment_datetime,potential_weight, broker_name, record_create_id,
	record_create_date)
	VALUES ( 'ADD01', 'WMS', 'YMS', '00', 'Keasby Warehouse', 'AB31',
	'One Arizona Way KEASBEY NJ 08832', 'TEST300002', 'TEST9383500',
	'Costco Co.','400 Washington Ave','Hackensack', 'NJ','07601','USA',
	NOW(), 55400.47, 'abc broker', 'WMS', NOW());

-- Insert a task


TRUNCATE TABLE t_wms_sst_snd_tab;
TRUNCATE TABLE t_wms_sst_rcv_tab;
TRUNCATE TABLE t_al_host_load_master;
TRUNCATE TABLE t_al_host_load_detail;
TRUNCATE TABLE t_al_host_order;
TRUNCATE TABLE t_al_host_task;
TRUNCATE TABLE t_driver_location;
TRUNCATE TABLE t_open_load_detail;
TRUNCATE TABLE t_open_load;
TRUNCATE TABLE t_open_order;
TRUNCATE TABLE t_load_detail;
TRUNCATE TABLE t_trailer;
DELETE FROM t_load_master;
TRUNCATE TABLE t_task;
TRUNCATE TABLE t_order;
