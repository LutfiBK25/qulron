CREATE TABLE t_azb_qulron_orders_msg_q(
	[msg_id] [bigint] IDENTITY(1,1) NOT NULL,
	[msg_type] [nvarchar](5) NOT NULL,
	[status] [nvarchar](3) NOT NULL,
	[error]  [nvarchar](MAX),
	[wh_id] [nvarchar](10) NOT NULL,
	[load_id] [nvarchar](30) NOT NULL,
	[order_number] [nvarchar](30),
	[date_inserted] [datetime] NOT NULL,
	[date_finished] [datetime] NULL,
	
);

CREATE NONCLUSTERED INDEX IX_t_azb_qulron_orders_msg_q_status
ON t_azb_qulron_orders_msg_q (status);

GRANT SELECT, INSERT, UPDATE, DELETE on dbo.t_azb_qulron_orders_msg_q TO AAD_USER, WA_USER, HJS;

SELECT * FROM t_azb_qulron_orders_msg_q
order by date_inserted desc;
-- delete from t_azb_qulron_orders_msg_q


SELECT * FROM t_af_load_detail 
where load_id in 
(
SELECT load_id FROM t_azb_qulron_orders_msg_q
)

SELECT * FROM t_whse 


SELECT *
FROM OPENQUERY(QULRON, 'SELECT * FROM "public"."t_wms_sst_rcv_tab"')


				INSERT INTO OPENQUERY(
					QULRON,
					'SELECT msg_type, sender, receiver, status, err_text, warehouse, warehouse_code, 
               warehouse_address, load_id, order_number, customer_name, dest_addr,
			   dest_city, dest_state, dest_zip, dest_country_code, appointment_datetime,
               potential_weight, broker_name, driver_name, phone_number,
			   dest_area, dest_location, property_1, property_2, property_3,
			   record_create_id, record_create_date FROM t_wms_sst_rcv_tab'
				)
				
				SELECT msg_q.msg_type, 'WMS' AS sender, 'YMS' AS receiver, '00' AS status, NULL AS err_text, whse.name, lm.wh_id, 
				whse.addr1 + ' ' + whse.city + ' ' + whse.state + ' ' + whse.zip AS warehouse_address,lm.load_id, ald.order_number, ord.ship_to_name, ord.ship_to_addr1,
				ord.ship_to_city, ord.ship_to_state, ord.ship_to_zip, ord.ship_to_country_code, apt.expected_arrival,
				(SELECT SUM(ISNULL(orm1.weight, 0)) as pallet_total
				FROM t_af_load_detail (NOLOCK) ald1
				JOIN t_order (NOLOCK) orm1
					ON orm1.wh_id = ald1.wh_id
					AND orm1.order_number = ald1.order_number
				WHERE ald1.wh_id = lm.wh_id
					AND ald1.load_id = lm.load_id )AS potential_weight, car.carrier_name AS broker_name, NULL AS driver_name, NULL AS phone_number,
				NULL AS dest_area, NULL AS dest_location, NULL AS property_1, NULL AS property_2, NULL AS property_3,
				'WMS' AS record_create_id, GETDATE() AS record_create_date
				FROM t_azb_qulron_orders_msg_q msg_q
				INNER JOIN t_load_master (NOLOCK) lm
				ON lm.wh_id = msg_q.wh_id
				AND lm.load_id = msg_q.load_id
				INNER JOIN t_whse (NOLOCK) whse
				ON whse.wh_id = lm.wh_id
				INNER JOIN t_af_load_detail (NOLOCK) ald
				ON ald.wh_id = lm.wh_id
				AND ald.load_id = lm.load_id
				INNER JOIN t_order (NOLOCK) ord
				ON ord.wh_id = ald.wh_id
				AND ord.order_number = ald.order_number
				LEFT JOIN t_appointment (NOLOCK) apt
				ON apt.load_number = lm.load_id
				LEFT JOIN t_carrier (NOLOCK) car
				ON apt.carrier_id = car.carrier_id
				/*
				WHERE status = '00'
				VALUES (
					'ADD02', 'WMS', 'YMS', '00', NULL, NULL, @in_vchWhId,
					NULL, @in_vchDocumentId, NULL, NULL, NULL,
					NULL, NULL, NULL, NULL, NULL,
					NULL, NULL, NULL, NULL,
					@in_vchWhId, @in_vchYardLocation, NULL, NULL, NULL,
					'WMS', GETDATE()
				);
				*/
