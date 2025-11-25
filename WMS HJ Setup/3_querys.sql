
SELECT *
FROM OPENQUERY(QULRON, 
	'SELECT * FROM "public"."t_wms_sst_snd_tab"
	WHERE status = ''00''
	')

SELECT * FROM t_af_load_detail
where load_id = '248900'


SELECT * FROM t_load_master
where load_id = '248900'

SELECT * FROM t_order
WHERE order_number = '8673702'

SELECT * FROM t_carrier

SELECT ca.carrier_name,apt.* FROM t_appointment apt
INNER JOIN t_carrier ca
ON apt.carrier_id = ca.carrier_id
where azb_orders = '249531'

SELECT * FROM t_al_host_azb_appointment


SELECT ca.carrier_name,ald.wh_id,ald.load_id,order_number FROM t_af_load_detail ald
INNER JOIN t_load_master lm
ON lm.wh_id = ald.wh_id
AND lm.load_id = ald.load_id
INNER JOIN t_appointment apt
ON apt.load_number = lm.load_id
INNER JOIN t_carrier ca
ON apt.carrier_id = ca.carrier_id
where lm.status NOT IN ('S','N')
ORDER BY ald.load_id DESC


SELECT * FROM t_appointment