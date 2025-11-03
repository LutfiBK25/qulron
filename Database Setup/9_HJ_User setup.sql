-- CREATE ROLE qulronhjuser WITH LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE PASSWORD '********';


GRANT ALL PRIVILEGES ON TABLE t_wms_sst_snd_tab TO qulronhjuser;
GRANT USAGE, SELECT ON SEQUENCE t_wms_sst_snd_tab_msg_id_seq TO qulronhjuser;
GRANT ALL PRIVILEGES ON TABLE t_wms_sst_rcv_tab TO qulronhjuser;
GRANT USAGE, SELECT ON SEQUENCE t_wms_sst_rcv_tab_msg_id_seq TO qulronhjuser;

select * from t_wms_sst_snd_tab
select * from t_wms_sst_rcv_tab