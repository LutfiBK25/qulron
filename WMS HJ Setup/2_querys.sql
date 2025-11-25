DECLARE 
    @const_startdate DATETIME,
    @const_enddate DATETIME,
	@const_wh_id NVARCHAR(10) = N'~wh_id~', 
	@const_load_id NVARCHAR(10) = N'~load_id~' 

SELECT @const_startdate = dbo.usf_format_date_to_glb_locale(N'~WW_USERLCID~', N'~appointment_start_date~' + N' 00:00:00');
SELECT @const_enddate = dbo.usf_format_date_to_glb_locale(N'~WW_USERLCID~', N'~appointment_end_date~' + N' 23:59:59');


SELECT * FROM
(
    SELECT
	CASE WHEN ddm.status = 'CLOSED' THEN '{{BGCOLOR=#99D9EA}}'
	WHEN  ddm.status IN ('ACTIVE','OPENED') THEN '{{BGCOLOR=#6BE005}}' 
	WHEN yard.order_number IS NOT NULL THEN '{{BGCOLOR=#FFF200}}' END AS color,
        ord.order_number AS order_number,
		CASE WHEN ddm.status IN ('CLOSED') THEN 'WAITING TO BE SHIPPED'
		WHEN ddm.status IN ('ACTIVE','OPENED') THEN 'CHECKED TO A DOOR'
		WHEN yard.order_number IS NOT NULL THEN 'IN THE YARD' 
		ELSE 'NOT CHECKED IN' END AS check_in_status,
		ddm.dock_door as active_dock_door,
        CASE WHEN ddm.status IN ('ACTIVE','OPENED','CLOSED') THEN NULL ELSE 'OPEN' END AS open_dock_door,
        CASE WHEN yard.order_number IS NOT NULL 
		OR ddm.status IN ('ACTIVE','OPENED','CLOSED')
		THEN NULL ELSE 'Add to Yard' END AS yard,
        ord.wh_id as wh_id,
        ldm.load_id as load_id,
        ISNULL(ddm.delivery_type, 'OUTBOUND') AS delivery_type, 
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
        END AS staging_location,
        apt.expected_arrival as expected_arrival,
		yard.yard_id,
		ISNULL(yard.truck_number,ddm.trailer_number) AS truck_number,
		ISNULL(yard.trailer_type,ddm.trailer_type) AS trailer_type,
		ISNULL(yard.carrier,ddm.carrier_code) as carrier,
		ald.load_id AS document_id,
		ISNULL(yard.driver_name,ddm.driver) as driver_name,
		ISNULL(yard.driver_phone,ddm.driver_phone) as driver_phone,
		ISNULL(ddm.status, 'NEW') as dock_door_status,
		CASE WHEN ddm.status IN ('ACTIVE','OPENED') THEN CAST((SELECT count(DISTINCT sto1.hu_id)		
				FROM t_pick_detail (NOLOCK) pkd1
				JOIN t_stored_item (NOLOCK) sto1
						ON pkd1.pick_id = sto1.type
					WHERE pkd1.wh_id = ldm.wh_id
						AND pkd1.load_id = ldm.load_id
						AND (sto1.location_id = ddm.dock_door 
							OR sto1.location_id 
									IN (SELECT zlc1.location_id 
										FROM t_zone (NOLOCK) zon1 
										JOIN t_zone_loca (NOLOCK) zlc1
											ON zlc1.wh_id = zon1.wh_id
											AND zlc1.zone = zon1.zone
										WHERE zon1.wh_id = ldm.wh_id
											AND zon1.zone_type = N'YARD'
										)
							)
				) AS nvarchar(20)) 
		WHEN ddm.status IN ('CLOSED') THEN 'FINISHED'
		ELSE 'N/A' END AS pallet_loaded_unloaded,
		(SELECT SUM(ISNULL(orm1.azb_number_of_pallets, 0)) as pallet_total
				FROM t_af_load_detail (NOLOCK) ald1
				JOIN t_order (NOLOCK) orm1
					ON orm1.wh_id = ald1.wh_id
					AND orm1.order_number = ald1.order_number
				WHERE ald1.wh_id = ldm.wh_id
					AND ald1.load_id = ldm.load_id
		) as pallet_total,
		ISNULL(ddm.comment,yard.comments) as comment

    FROM 
    t_load_master (NOLOCK) ldm    --t_order ord (NOLOCK) 
    LEFT JOIN t_af_load_detail ald (NOLOCK)
		ON ald.wh_id = ldm.wh_id
		AND ald.load_id = ldm.load_id
	LEFT JOIN t_azb_dock_door_management (NOLOCK) ddm
				ON ldm.wh_id = ddm.wh_id 
				AND ldm.load_id = ddm.document_id
	LEFT JOIN t_appointment (NOLOCK) apt
				ON apt.load_number = ldm.load_id
				AND apt.type = N'OUTBOUND'
	LEFT JOIN t_order (NOLOCK) ord
		ON ald.wh_id = ord.wh_id
		AND ald.order_number = ord.order_number
	LEFT JOIN t_azb_yard (NOLOCK) yard
		ON ald.wh_id = yard.wh_id
		AND ald.order_number = yard.order_number
		AND yard.status IN ('L','D','E')
	WHERE ldm.status <> 'S'
	AND ldm.wh_id LIKE @const_wh_id
	AND ldm.load_id LIKE @const_load_id


    UNION 

    SELECT
		CASE 
		WHEN ddm.status IN ('ACTIVE','OPENED') THEN '{{BGCOLOR=#6BE005}}' 
		WHEN yard.order_number IS NOT NULL THEN '{{BGCOLOR=#FFF200}}' 
		END AS color,
        pom.po_number AS order_number,
		CASE WHEN ddm.status IN ('ACTIVE','OPENED') THEN 'CHECKED TO A DOOR'
		WHEN yard.order_number IS NOT NULL THEN 'IN THE YARD' 
		ELSE 'NOT CHECKED IN' END AS check_in_status,
		ddm.dock_door as active_dock_door,
        CASE WHEN ddm.status IN ('ACTIVE','OPENED') THEN NULL ELSE 'OPEN' END AS open_dock_door,
        CASE WHEN yard.order_number IS NOT NULL 
		OR ddm.status IN ('ACTIVE','OPENED')
		THEN NULL ELSE 'Add to Yard' END AS yard,
        ddm.wh_id as wh_id, 
        ddm.document_id as load_id,
        ISNULL(ddm.delivery_type, 'INBOUND') AS delivery_type, 
        'N/A' AS allocation_status,
        'N/A' AS staging_location,
        ISNULL(apt.expected_arrival,GETDATE()) as expected_arrival,
		yard.yard_id,
		ISNULL(yard.truck_number,ddm.trailer_number) AS truck_number,
		ISNULL(yard.trailer_type,ddm.trailer_type) AS trailer_type,
		ISNULL(yard.carrier,ddm.carrier_code) as carrier,
		pom.po_number as document_id,
		ISNULL(yard.driver_name,ddm.driver) as driver_name,
		ISNULL(yard.driver_phone,ddm.driver_phone) as driver_phone,
		ISNULL(ddm.status, 'NEW') as dock_door_status,
		CASE WHEN ddm.status IN ('ACTIVE','OPENED') THEN CAST((SELECT COUNT (DISTINCT hu_id) from t_receipt (NOLOCK) rec1 WHERE rec1.wh_id = pom.wh_id AND rec1.po_number = pom.po_number) AS nvarchar(20))
		ELSE 'N/A' END AS pallet_loaded_unloaded,
		(SELECT COUNT (DISTINCT hu_id) FROM t_asn_detail (NOLOCK) asnd1 WHERE asnd1.wh_id =  pom.wh_id AND asnd1.po_number = pom.po_number) AS pallet_total,
		ISNULL(ddm.comment,yard.comments) as comment
	FROM 
		t_po_master pom (NOLOCK)
	LEFT JOIN t_azb_dock_door_management (NOLOCK) ddm
		ON pom.wh_id = ddm.wh_id
		AND pom.po_number = ddm.document_id
	LEFT JOIN t_appointment (NOLOCK) apt
		ON apt.load_number = pom.po_number
		AND apt.type = N'INBOUND'
	LEFT JOIN t_azb_yard yard (NOLOCK)
		ON pom.wh_id = yard.wh_id
		AND pom.po_number = yard.order_number
		AND yard.status IN ('L','D','E')
    WHERE 
       ISNULL(ddm.status, 'NEW') <> N'CLOSED'
	   AND ddm.wh_id LIKE @const_wh_id
		AND ddm.load_id LIKE @const_load_id
) AS a
ORDER BY active_dock_door desc,expected_arrival