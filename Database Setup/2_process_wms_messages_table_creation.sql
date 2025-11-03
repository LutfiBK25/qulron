
-- WMS Message Processing Stored Procedure
-- Processes messages from WMS to YMS based on status and message type

-- Clear if they exsist
DROP TABLE IF EXISTS  t_wms_sst_rcv_tab;
DROP TABLE IF EXISTS  t_wms_sst_snd_tab;
DROP TABLE IF EXISTS  t_al_host_load_master;
DROP TABLE IF EXISTS  t_al_host_load_detail;
DROP TABLE IF EXISTS  t_al_host_order;
DROP TABLE IF EXISTS  t_al_host_task;


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
CREATE TABLE t_wms_sst_rcv_tab (
    msg_id BIGSERIAL PRIMARY KEY,
    msg_type VARCHAR(5)  NOT NULL,
	sender VARCHAR(30) NOT NULL,
	receiver VARCHAR(30) NOT NULL,
    status VARCHAR(10) NOT NULL,
	err_text VARCHAR(200),
	warehouse VARCHAR(30),
    warehouse_code VARCHAR(5),
	warehouse_address VARCHAR(100),
	load_id VARCHAR(30) NOT NULL,
    order_number VARCHAR(30),
	customer_name  VARCHAR(100),
	dest_addr VARCHAR(100),
	dest_city VARCHAR(50),
	dest_state VARCHAR(5),
	dest_zip VARCHAR(20),
	dest_country_code VARCHAR(10),
	appointment_datetime TIMESTAMP,
	potential_weight DECIMAL(10,2),
    broker_name VARCHAR(100),
    driver_name VARCHAR(100),
    phone_number VARCHAR(12),
	dest_area VARCHAR(30),
	dest_location VARCHAR(30),
	property_1 VARCHAR(200),
	property_2 VARCHAR(200),
	property_3 VARCHAR(200),
    record_create_id VARCHAR(30) NOT NULL,
    record_create_date TIMESTAMP NOT NULL,
    record_update_id VARCHAR(30),
    record_update_date TIMESTAMP
);
CREATE INDEX idx_wms_rcv_order_number ON t_wms_sst_rcv_tab(order_number);
CREATE INDEX idx_wms_rcv_status ON t_wms_sst_rcv_tab(status);
CREATE INDEX idx_wms_rcv_msg_type ON t_wms_sst_rcv_tab(msg_type);
CREATE INDEX idx_wms_rcv_date_status ON t_wms_sst_rcv_tab(status, record_create_date);

GRANT ALL PRIVILEGES ON TABLE t_wms_sst_rcv_tab TO qulronhjuser;
GRANT USAGE, SELECT ON SEQUENCE t_wms_sst_RCV_tab_msg_id_seq TO qulronhjuser;
/*
Current SND Tasks
	* ADD01: Add to Yard
*/
-- status type: 
-- Messages From YMS to WMS
CREATE TABLE t_wms_sst_snd_tab (
    msg_id BIGSERIAL PRIMARY KEY,
    msg_type VARCHAR(5)  NOT NULL,
	sender VARCHAR(30) NOT NULL,
	receiver VARCHAR(30) NOT NULL,
    status VARCHAR(10) NOT NULL,
	err_text VARCHAR(200),
    warehouse_code VARCHAR(5),
    warehouse VARCHAR(30),
	load_id VARCHAR(30) NOT NULL,
    order_numbers VARCHAR(100),
    broker_name VARCHAR(100),
    driver_name VARCHAR(100),
    phone_number VARCHAR(12),
    trailer_number VARCHAR(30),
	dest_area VARCHAR(30),
	dest_location VARCHAR(30),
	property_1 VARCHAR(200),
	property_2 VARCHAR(200),
	property_3 VARCHAR(200),
    record_create_id VARCHAR(30) NOT NULL,
    record_create_date TIMESTAMP NOT NULL,
    record_update_id VARCHAR(30),
    record_update_date TIMESTAMP
);


CREATE INDEX idx_wms_snd_load_id ON t_wms_sst_snd_tab(load_id);
CREATE INDEX idx_wms_snd_status ON t_wms_sst_snd_tab(status);
CREATE INDEX idx_wms_snd_msg_type ON t_wms_sst_snd_tab(msg_type);

GRANT ALL PRIVILEGES ON TABLE t_wms_sst_snd_tab TO qulronwebapp;
GRANT USAGE, SELECT ON SEQUENCE t_wms_sst_snd_tab_msg_id_seq TO qulronwebapp;
GRANT ALL PRIVILEGES ON TABLE t_wms_sst_snd_tab TO qulronhjuser;
GRANT USAGE, SELECT ON SEQUENCE t_wms_sst_snd_tab_msg_id_seq TO qulronhjuser;


-- (Interface Tables)
-- Interface Tables statuses
-- 00 Created : WMS Created The Order
-- 10 ACTIVATED: YMS Creating the Load into t_open_load
-- 90 FINISHED: Load Created
-- 91 ERROR
CREATE TABLE t_al_host_load_master (
    id BIGSERIAL PRIMARY KEY,
    err_text VARCHAR(200),
	load_id		VARCHAR(30) NOT NULL,
	status VARCHAR(10) NOT NULL,
    broker_name VARCHAR(100) NOT NULL,
	appointment_datetime TIMESTAMP NOT NULL,
    potential_weight DECIMAL(10,2),
    record_create_id VARCHAR(30) NOT NULL,
    record_create_date TIMESTAMP NOT NULL,
    record_update_id VARCHAR(30),
    record_update_date TIMESTAMP
);
CREATE INDEX idx_al_host_load_master_status ON t_al_host_load_master(status);

-- (Interface Table)
CREATE TABLE t_al_host_load_detail (
    id BIGSERIAL 		PRIMARY KEY,
	load_id				VARCHAR(30) NOT NULL,
    order_number 		VARCHAR(30) NOT NULL,
	status 				VARCHAR(10) NOT NULL,
	is_married_load		VARCHAR(1) NOT NULL
);
CREATE INDEX idx_al_host_load_detail_status ON t_al_host_load_detail(status);

CREATE TABLE t_al_host_order(
    id BIGSERIAL PRIMARY KEY,
    order_number VARCHAR(30) NOT NULL,
	status VARCHAR(10) NOT NULL,
	warehouse VARCHAR(30) NOT NULL,
    warehouse_code VARCHAR(5) NOT NULL,
	warehouse_address VARCHAR(100) NOT NULL,
	customer_name  VARCHAR(100) NOT NULL,
	dest_addr VARCHAR(100) NOT NULL,
	dest_city VARCHAR(50) NOT NULL,
	dest_state VARCHAR(5) NOT NULL,
	dest_zip VARCHAR(20) NOT NULL,
	dest_country_code VARCHAR(10) NOT NULL,
    record_create_id VARCHAR(30) NOT NULL,
    record_create_date TIMESTAMP NOT NULL,
    record_update_id VARCHAR(30),
    record_update_date TIMESTAMP
);
CREATE INDEX idx_al_host_order_status ON t_al_host_order(status);

CREATE TABLE t_al_host_task(
    id BIGSERIAL PRIMARY KEY,
    err_text VARCHAR(200),
    load_id BIGINT NOT NULL,
    status VARCHAR(10) NOT NULL,
    destination_area VARCHAR(5) NOT NULL,
    destination_location VARCHAR(30) NOT NULL,
    record_create_id VARCHAR(30) NOT NULL,
    record_create_date TIMESTAMP NOT NULL,
    record_update_id VARCHAR(30),
    record_update_date TIMESTAMP
);
CREATE INDEX idx_al_host_task_status ON t_al_host_task(status);


SELECT * FROM t_wms_sst_rcv_tab;
SELECT * FROM t_wms_sst_snd_tab;
SELECT * FROM t_al_host_load_master;
SELECT * FROM t_al_host_load_detail;
SELECT * FROM t_al_host_order;
SELECT * FROM t_al_host_task;

