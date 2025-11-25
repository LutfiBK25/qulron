USE [AAD]
GO

/****** Object:  StoredProcedure [dbo].[usp_azb_ww_add_to_yard]    Script Date: 11/24/2025 2:01:29 PM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO



ALTER PROCEDURE [dbo].[usp_azb_ww_add_to_yard]
				@in_vchYardId					BIGINT
				, @in_vchYardLocation			NVARCHAR(10)
				, @in_vchWhId					NVARCHAR(10)
				, @in_vchStatus					NVARCHAR(10)
				, @in_vchDriverName				NVARCHAR(30)
				, @in_vchDriverLicenseNumber	NVARCHAR(15)
				, @in_vchDriverLicenseState 	NVARCHAR(10)
				, @in_vchDriverPhone			NVARCHAR(15)
				, @in_vchCustomerName			NVARCHAR(15)
				, @in_vchTruckNumber			NVARCHAR(15)
				, @in_vchCarrier				NVARCHAR(15)
				, @in_vchTrailerType			NVARCHAR(15)
				, @in_vchOrderNumber			NVARCHAR(15)
				, @in_vchAppointmentTime		DATETIME
				, @in_vchAppointmentDuration	INT
				, @in_vchArrivalTime			DATETIME
				, @in_vchComments				NVARCHAR(150)
				, @in_vchDocumentId				NVARCHAR(15)
				, @in_vchDeliveryType			NVARCHAR(15)
				, @in_vchDropShipReference		NVARCHAR(15)
				, @in_vchDestinationWhId		NVARCHAR(15)
				, @in_vchDockDoorManagementId	NVARCHAR(15)
				, @in_vchSealNumber				NVARCHAR(15)
				, @in_vchOpenedBy				NVARCHAR(15)
				, @in_vchQulronCheckin			NVARCHAR(1) = 'N' --[2]
				, @in_vchQurlonMsgId			INT = NULL --[2]
				, @in_vchQulronOrderNumbers		NVARCHAR(100) = NULL --[2]

				, @out_vchOutCode				NVARCHAR(30)	OUTPUT
				, @out_vchOutMessage			NVARCHAR(200)	OUTPUT
				, @ww_result					uddt_output_code     OUTPUT

AS
-- *******************************************************************************
-- Stored Procedure: usp_azb_ww_add_to_yard
-- *******************************************************************************
-- Database Name: AAD
-- Database User Name: dbo
-- *******************************************************************************
--
--  The purpose of this stored procedure is to insert into the yard
--
--  Notes:
--        
--
--  Target:
--        SQL Server 
--
-- ********************************************************************************
-- History
--  [id]	Date		Name	    Note
--	-------	-----------	-----------	----
--	[1]		2024-07-10	Lutfi			Created
--  [2]		2025-11-24	Lutfi			Added Qulron Checkin
-- ********************************************************************************
BEGIN

	

	SET @out_vchOutCode = N'SUCCESS'
	SET @ww_result = N'PASS';

	BEGIN TRY
		---------------
		-- Validation
		---------------
		
		SELECT 1 FROM t_azb_yard
		WHERE document_id = @in_vchDocumentId
		AND status <> 'U'

		IF @@ROWCOUNT > 0
		BEGIN
			UPDATE t_azb_yard
			SET status = 'U'
			WHERE document_id = @in_vchDocumentId
		END



		INSERT INTO t_azb_yard
		VALUES(
				@in_vchYardId					
				, @in_vchYardLocation			
				, @in_vchWhId					
				, @in_vchStatus					
				, @in_vchDriverName				
				, @in_vchDriverLicenseNumber	
				, @in_vchDriverLicenseState 	
				, @in_vchDriverPhone			
				, @in_vchCustomerName			
				, @in_vchTruckNumber			
				, @in_vchCarrier				
				, @in_vchTrailerType			
				, @in_vchOrderNumber			
				, @in_vchAppointmentTime		
				, @in_vchAppointmentDuration	
				, @in_vchArrivalTime			
				, @in_vchComments				
				, @in_vchDocumentId				
				, @in_vchDeliveryType			
				, @in_vchDropShipReference		
				, @in_vchDestinationWhId		
				, @in_vchDockDoorManagementId	
				, @in_vchSealNumber				
				, @in_vchOpenedBy				
		)

		--[2]
		IF @in_vchQulronCheckin = 'Y'
		BEGIN 
			BEGIN TRY
				INSERT INTO OPENQUERY(
					QULRON,
					'SELECT msg_type, sender, receiver, status, err_text, warehouse, warehouse_code, 
               warehouse_address, load_id, order_number, customer_name, dest_addr,
			   dest_city, dest_state, dest_zip, dest_country_code, appointment_datetime,
               potential_weight, broker_name, driver_name, phone_number,
			   dest_area, dest_location, property_1, property_2, property_3,
			   record_create_id, record_create_date FROM t_wms_sst_rcv_tab'
				)
				VALUES (
					'ADD02', 'WMS', 'YMS', '00', NULL, NULL, @in_vchWhId,
					NULL, @in_vchDocumentId, NULL, NULL, NULL,
					NULL, NULL, NULL, NULL, NULL,
					NULL, NULL, NULL, NULL,
					@in_vchWhId, @in_vchYardLocation, NULL, NULL, NULL,
					'WMS', GETDATE()
				);

				DECLARE @sql NVARCHAR(MAX);

				SET @sql = '
				UPDATE OPENQUERY(QULRON,
					''SELECT * FROM t_wms_sst_snd_tab WHERE msg_id = ''''' + REPLACE(@in_vchQurlonMsgId, '''', '''''') + ''''''' )
				SET status = ''90'', 
					err_text = ''OK'', 
					record_update_id = ''WMS'', 
					record_update_date = CURRENT_TIMESTAMP';

				EXEC sp_executesql @sql;

				INSERT INTO OPENQUERY(
					QULRON,
					'SELECT msg_type, sender, receiver, status, err_text, warehouse_code, warehouse, 
               load_id, order_numbers, broker_name, driver_name, phone_number, trailer_number,
			   dest_area, dest_location, property_1, property_2, property_3,
			   record_create_id, record_create_date FROM t_wms_sst_snd_tab'
				)
				VALUES (
					'ADD02', 'WMS', 'YMS', '00', NULL, @in_vchDestinationWhId, NULL,
					@in_vchDocumentId, @in_vchQulronOrderNumbers, NULL, @in_vchDriverName,@in_vchDriverPhone,@in_vchTruckNumber,
					NULL, NULL, NULL, NULL, NULL,
					'WMS', GETDATE()
				);

			END TRY
			BEGIN CATCH
				PRINT 'Step failed but continuing...';
			END CATCH
		END
		--[2] End
		
		SET @out_vchOutMessage = N'Order Added to the Yard'
ERROR_LABEL:

		
	END TRY
	BEGIN CATCH
	
		SET @out_vchOutCode = 'ERROR';
		SET @out_vchOutMessage = ERROR_MESSAGE();

		-- raiserror(@out_vchOutCode ,16,10)
		THROW 60000, @out_vchOutMessage, 1;
	END CATCH
END

GO


