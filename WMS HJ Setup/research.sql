/*
t_al_host_sql_import_queue

Orders
proc_AZ_Import_Delivery_Insert
t_al_host_order_master
t_al_host_order_detail
usp_al_import_order 4205
usp_order_consolidation
usp_order_consolidation_cleanup

*/

  SELECT 
    OBJECT_SCHEMA_NAME(o.object_id) AS [schema],
    o.name AS procedure_name
FROM sys.objects o
JOIN sys.sql_modules m ON o.object_id = m.object_id
WHERE o.type = 'P'   -- only stored procedures
  AND m.definition LIKE '%INSERT INTO t_load_master%';

SELECT * FROM t_al_host_order_master
ORDER BY record_create_date desc

SELECT * FROM t_order_manifest