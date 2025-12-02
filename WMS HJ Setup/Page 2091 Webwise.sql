SELECT color, wh_id, order_numbers, check_in_status,
    send_to_door, send_to_yard, load_id, delivery_type,
    allocation_status, broker_name, carrier, driver_name,
    driver_phone, trailer_number, arrival_date, staging_location,
    expected_arrival, yard_id, trailer_type, document_id,
    dock_door_status, pallet_total, comment, msg_id
FROM (
    SELECT
        CASE 
            WHEN qulron.msg_type = 'ADD01' THEN NULL
            WHEN qulron.msg_type = 'ADD02' THEN '{{BGCOLOR=#6BE005}}'
        END AS color,

        ISNULL(ldm.wh_id,'NA') AS wh_id,
        qulron.order_numbers,

        CASE 
            WHEN qulron.msg_type = 'ADD01' THEN 'WAITING TO BE CHECKED IN'
            WHEN qulron.msg_type = 'ADD02' THEN 'IN YARD WAITING TO BE PUT ON A DOOR'
        END AS check_in_status,

        'Send to Door' AS send_to_door,
        'Send to Yard' AS send_to_yard,

        ISNULL(ldm.load_id,'NA') AS load_id,
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

        qulron.broker_name,
        ISNULL(yard.carrier,ddm.carrier_code) AS carrier,

        ISNULL(qulron.driver_name,ISNULL(yard.driver_name,ddm.driver)) AS driver_name,
        ISNULL(qulron.phone_number,ISNULL(yard.driver_phone,ddm.driver_phone)) AS driver_phone,
        ISNULL(qulron.trailer_number,ISNULL(yard.truck_number,ddm.trailer_number)) AS trailer_number,

        qulron.record_create_date AS arrival_date,

        CASE 
            WHEN ldm.stage_loc IS NULL THEN 'NOT STAGED'
            ELSE ldm.stage_loc 
        END AS staging_location,

        apt.expected_arrival AS expected_arrival,
        yard.yard_id,
        ISNULL(yard.trailer_type,ddm.trailer_type) AS trailer_type,

        ald.load_id AS document_id,
        ISNULL(ddm.status, 'NEW') AS dock_door_status,

        /* Only aggregate inside the subquery */
        (SELECT SUM(ISNULL(orm1.azb_number_of_pallets, 0))
         FROM t_af_load_detail ald1 (NOLOCK)
         JOIN t_order orm1 (NOLOCK)
             ON orm1.wh_id = ald1.wh_id
            AND orm1.order_number = ald1.order_number
         WHERE ald1.wh_id = ldm.wh_id
           AND ald1.load_id = ldm.load_id
        ) AS pallet_total,

        ISNULL(ddm.comment,yard.comments) AS comment,
        qulron.msg_id

    FROM OPENQUERY(QULRON, 
        'SELECT msg_id,msg_type,load_id,order_numbers,broker_name
        ,driver_name,phone_number,trailer_number,record_create_date
        FROM "public"."t_wms_sst_snd_tab"
        WHERE status = ''00''
        AND msg_type IN (''ADD01'',''ADD02'')'
    ) AS qulron

    LEFT JOIN t_load_master ldm
        ON ldm.load_id = qulron.load_id
        AND ldm.status <> 'S'

    LEFT JOIN t_af_load_detail ald (NOLOCK)
        ON ald.wh_id = ldm.wh_id
       AND ald.load_id = ldm.load_id

    LEFT JOIN t_azb_dock_door_management ddm (NOLOCK)
        ON ldm.wh_id = ddm.wh_id 
       AND ldm.load_id = ddm.document_id

    LEFT JOIN t_azb_yard yard (NOLOCK)
        ON ald.load_id = yard.document_id
       AND yard.status IN ('L','D','E')

    LEFT JOIN t_appointment apt (NOLOCK)
        ON apt.load_number = ldm.load_id
       AND apt.type = N'OUTBOUND'
) AS src

GROUP BY 
    color, wh_id, order_numbers, check_in_status,
    send_to_door, send_to_yard, load_id, delivery_type,
    allocation_status, broker_name, carrier, driver_name,
    driver_phone, trailer_number, arrival_date, staging_location,
    expected_arrival, yard_id, trailer_type, document_id,
    dock_door_status, pallet_total, comment, msg_id;