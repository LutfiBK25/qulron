DROP TABLE IF EXISTS t_driver_location;
DROP TABLE IF EXISTS t_task;
DROP TABLE IF EXISTS t_trailer;
DROP TABLE IF EXISTS t_open_load_detail;
DROP TABLE IF EXISTS t_load_detail;
DROP TABLE IF EXISTS t_open_load;
DROP TABLE IF EXISTS t_load_master;
DROP TABLE IF EXISTS t_order;
DROP TABLE IF EXISTS t_yard_location;
DROP TABLE IF EXISTS t_open_order;


-- Open Loads (Broker Queue)
-- 00 Created : YMS Created Data
-- 10 ACTIVATED: BROKER CREATED LOAD
-- 80 CANCELLED: LOAD GOT CANCELLED
-- 90 FINISHED: LOAD WAS SHIPPED
CREATE TABLE t_open_load
(
    ol_id BIGSERIAL PRIMARY KEY,
    load_id VARCHAR(30) NOT NULL,
	status VARCHAR(10) NOT NULL,
    broker_name VARCHAR(100) NOT NULL,
	appointment_datetime TIMESTAMP,
	potential_weight DECIMAL(10,2),
    record_create_id VARCHAR(30) NOT NULL,
    record_create_date TIMESTAMP NOT NULL,
    record_update_id VARCHAR(30),
    record_update_date TIMESTAMP
);

-- indexes for better performance
CREATE INDEX idx_open_load_broker_name ON t_open_load(broker_name);
CREATE INDEX idx_open_load_load_broker ON t_open_load(load_id, broker_name);
CREATE INDEX idx_open_load_status ON t_open_load(status);



-- Open Loads (Broker Queue)
-- 00 Created : YMS Created Data
-- 10 ACTIVATED: BROKER CREATED LOAD
-- 80 CANCELLED: LOAD GOT CANCELLED
-- 90 FINISHED: LOAD WAS SHIPPED
CREATE TABLE t_open_load_detail
(
    old_id BIGSERIAL PRIMARY KEY,
    load_id VARCHAR(30) NOT NULL,
    order_number VARCHAR(30) NOT NULL,
    status VARCHAR(10) NOT NULL,
	is_married_load BOOLEAN DEFAULT FALSE
);

-- indexes for better performance
CREATE INDEX idx_open_load_detail_load_id ON t_open_load_detail(load_id);
CREATE INDEX idx_open_load_detail_order_number ON t_open_load_detail(order_number);
CREATE INDEX idx_open_load_detail_load_order ON t_open_load_detail(load_id, order_number);
CREATE INDEX idx_open_load_detail_status ON t_open_load_detail(status);


-- Open Loads (Broker Queue)
-- 00 Created : YMS Created Data
-- 10 ACTIVATED: BROKER CREATED ORDER
-- 80 CANCELLED: ORDER GOT CANCELLED
-- 90 FINISHED: ORDER WAS SHIPPED
CREATE TABLE t_open_order (
    oo_id BIGSERIAL PRIMARY KEY,
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
-- indexes for better performance
CREATE INDEX idx_open_order_order_number ON t_open_order(order_number);
CREATE INDEX idx_open_order_status ON t_open_order(status);
CREATE INDEX idx_open_order_order_order_state_status ON t_open_order(order_number, dest_state,status);

-- Load Status
-- 00 Created : BROKER CREATED THE ENTRY FOR LOAD
-- 10 ACTIVATED : DRIVER ARRIVED TO FACILITY
-- 20 STARTED: DRIVER IS ASSIGNED A LOCATION TO GO TO
-- 80 CANCELLED: LOAD GOT CANCELLED
-- 90 FINISHED: LOAD WAS SHIPPED
-- Create YMS Order table
CREATE TABLE t_load_master
(
    lm_id BIGSERIAL PRIMARY KEY,
    load_id VARCHAR(30) NOT NULL,
    status VARCHAR(10) NOT NULL,
    broker_name VARCHAR(100) NOT NULL,
    driver_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(12) NOT NULL,
    last_driver_latitude DECIMAL(16,13),
    last_driver_longitude DECIMAL(16,13),
	appointment_datetime TIMESTAMP,
	potential_weight DECIMAL(10,2),
    record_create_id VARCHAR(30) NOT NULL,
    record_create_date TIMESTAMP NOT NULL,
    record_update_id VARCHAR(30),
    record_update_date TIMESTAMP
);

-- indexes for better performance
CREATE INDEX idx_load_master_load_id ON t_load_master(load_id);
CREATE INDEX idx_load_master_broker_name ON t_load_master(broker_name);
CREATE INDEX idx_load_master_status ON t_load_master(status);


-- Load Status
-- 00 Created : BROKER CREATED THE ENTRY FOR LOAD
-- 10 ACTIVATED: DRIVER ARRIVED AT FACILITY
-- 20 STARTED: DRIVER IS ASSIGNED A LOCATION TO GO TO
-- 80 CANCELLED: ORDER GOT CANCELLED
-- 90 FINISHED: ORDER WAS SHIPPED
-- Create YMS Order table
CREATE TABLE t_load_detail
(
    ld_id BIGSERIAL PRIMARY KEY,
    load_id VARCHAR(30) NOT NULL,
    order_number VARCHAR(30) NOT NULL,
    status VARCHAR(10) NOT NULL,
	is_married_load BOOLEAN DEFAULT FALSE
);

-- indexes for better performance
CREATE INDEX idx_load_detail_load_id ON t_load_detail(load_id);
CREATE INDEX idx_load_detail_order_number ON t_load_detail(order_number);
CREATE INDEX idx_load_detail_load_order ON t_load_detail(load_id, order_number);
CREATE INDEX idx_load_detail_status ON t_load_detail(status);


-- Orders Status
-- 00 Created : BROKER CREATED THE ORDER
-- 10 ACTIVATED: DRIVER ARRIVED AT FACILITY
-- 20 STARTED: DRIVER IS ASSIGNED A LOCATION TO GO TO
-- 80 CANCELLED: ORDER GOT CANCELLED
-- 90 FINISHED: ORDER WAS SHIPPED
-- Create YMS Order table
CREATE TABLE t_order (
    order_id BIGSERIAL PRIMARY KEY,
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
-- indexes for better performance
CREATE INDEX idx_order_order_number ON t_order(order_number);
CREATE INDEX idx_order_status ON t_order(status);
CREATE INDEX idx_order_order_order_state ON t_order(order_number, dest_state);


-- CREATE Trailer Table
CREATE TABLE t_trailer(
    trailer_id BIGSERIAL PRIMARY KEY,
    trailer_number VARCHAR(30),
    lm_id BIGINT NOT NULL,
    record_create_id VARCHAR(30) NOT NULL,
    record_create_date TIMESTAMP NOT NULL,
    record_update_id VARCHAR(30),
    record_update_date TIMESTAMP,
    CONSTRAINT fk_trailer_load_master
        FOREIGN KEY(lm_id) REFERENCES t_load_master(lm_id)
);

CREATE INDEX idx_trailer_lm_id ON t_trailer(lm_id);


-- Tasks Status
-- 00 Created : TASK WAS CREATED FOR THE DRIVER
-- 20 STARTED: DRIVER IS DRIVING TO LOCATION
-- 80 CANCELLED: TASK GOT CANCELLED OR SKIPPED
-- 90 FINISHED: DRIVER ARRIVED TO THE LOCATION
-- CREATE Driver Task Table
CREATE TABLE t_task (
    task_id BIGSERIAL PRIMARY KEY,
    lm_id BIGINT NOT NULL,
    status VARCHAR(10) NOT NULL,
    destination_area VARCHAR(5) NOT NULL,
    destination_location VARCHAR(30) NOT NULL,
    record_create_id VARCHAR(30) NOT NULL,
    record_create_date TIMESTAMP NOT NULL,
    record_update_id VARCHAR(30),
    record_update_date TIMESTAMP
);

-- indexes for better performance
CREATE INDEX idx_task_lm_id ON t_task(lm_id);
CREATE INDEX idx_task_status ON t_task(status);
CREATE INDEX idx_task_destination_area ON t_task(destination_area);

CREATE TABLE t_yard_location (
    yl_id BIGSERIAL PRIMARY KEY,
    task_destination_area VARCHAR(5),
    task_destination_location VARCHAR(30),
    area VARCHAR(100),
    location VARCHAR(100),
    latitude DECIMAL(16,13),
    longitude DECIMAL(16,13),
    record_create_id VARCHAR(30) NOT NULL,
    record_create_date TIMESTAMP NOT NULL,
    record_update_id VARCHAR(30),
    record_update_date TIMESTAMP
);

-- indexes for better performance
CREATE INDEX idx_yard_location_warehouse_code ON t_yard_location(task_destination_area);
CREATE INDEX idx_yard_location_task_location ON t_yard_location(task_destination_location);

-- Driver Location Tracking Table
CREATE TABLE t_driver_location (
    dl_id BIGSERIAL PRIMARY KEY,
    lm_id BIGINT NOT NULL,
    latitude DECIMAL(16,13) NOT NULL,
    longitude DECIMAL(16,13) NOT NULL,
    accuracy DECIMAL(8,2), -- GPS accuracy in meters
    speed DECIMAL(8,2), -- Speed in m/s
    heading DECIMAL(5,2), -- Direction in degrees
    altitude DECIMAL(8,2), -- Altitude in meters
    is_moving BOOLEAN DEFAULT false,
    battery_level INTEGER, -- Battery percentage (0-100)
    estimated_arrival INTEGER, -- ETA in seconds
	destination_warehouse VARCHAR(30) NOT NULL,
    location_timestamp TIMESTAMP NOT NULL,
    record_create_id VARCHAR(30) NOT NULL,
    record_create_date TIMESTAMP NOT NULL,
    
    -- Foreign key to link with load master
    CONSTRAINT fk_driver_location_load_master
        FOREIGN KEY(lm_id) REFERENCES t_load_master(lm_id),
    
    -- Unique constraint for performance
    CONSTRAINT uk_driver_location_load_timestamp
        UNIQUE(lm_id, location_timestamp)
);

-- indexes for better performance
CREATE INDEX idx_driver_location_lm_id ON t_driver_location(lm_id);


-- Grants for all tables qulronwebapp
GRANT ALL PRIVILEGES ON TABLE t_open_load TO qulronwebapp;
GRANT ALL PRIVILEGES ON TABLE t_open_load_detail TO qulronwebapp;
GRANT ALL PRIVILEGES ON TABLE t_open_order TO qulronwebapp;
GRANT ALL PRIVILEGES ON TABLE t_load_master TO qulronwebapp;
GRANT ALL PRIVILEGES ON TABLE t_load_detail TO qulronwebapp;
GRANT ALL PRIVILEGES ON TABLE t_order TO qulronwebapp;
GRANT ALL PRIVILEGES ON TABLE t_trailer TO qulronwebapp;
GRANT ALL PRIVILEGES ON TABLE t_task TO qulronwebapp;
GRANT SELECT ON TABLE t_yard_location TO qulronwebapp;
GRANT ALL PRIVILEGES ON TABLE t_driver_location TO qulronwebapp;

-- Grants for sequences (auto-generated by BIGSERIAL)
GRANT USAGE, SELECT ON SEQUENCE t_open_load_ol_id_seq TO qulronwebapp;
GRANT USAGE, SELECT ON SEQUENCE t_open_load_detail_old_id_seq TO qulronwebapp;
GRANT USAGE, SELECT ON SEQUENCE t_open_order_oo_id_seq TO qulronwebapp;
GRANT USAGE, SELECT ON SEQUENCE t_load_master_lm_id_seq TO qulronwebapp;
GRANT USAGE, SELECT ON SEQUENCE t_load_detail_ld_id_seq TO qulronwebapp;
GRANT USAGE, SELECT ON SEQUENCE t_order_order_id_seq TO qulronwebapp;
GRANT USAGE, SELECT ON SEQUENCE t_trailer_trailer_id_seq TO qulronwebapp;
GRANT USAGE, SELECT ON SEQUENCE t_task_task_id_seq TO qulronwebapp;
GRANT USAGE, SELECT ON SEQUENCE t_yard_location_yl_id_seq TO qulronwebapp;
GRANT USAGE, SELECT ON SEQUENCE t_driver_location_dl_id_seq TO qulronwebapp;


INSERT INTO t_yard_location(task_destination_area,task_destination_location,area,location,latitude,longitude,record_create_id, record_create_date) VALUES
('EXIT','EXIT','EXIT','EXIT',40.52092168218135, -74.33031143249039,'DUMMY',NOW()),
('AB01','L0DOCK08','Edison Warehouse','Dock Door 08',0,0,'DUMMY',NOW()),
('AB01','L0DOCK09','Edison Warehouse','Dock Door 09',0,0,'DUMMY',NOW()),
('AB01','L0DOCK10','Edison Warehouse','Dock Door 10',0,0,'DUMMY',NOW()),
('AB01','L0DOCK100','Edison Warehouse','Dock Door 100',40.5198477719006,-74.3271137721751,'DUMMY',NOW()),
('AB01','L0DOCK102','Edison Warehouse','Dock Door 102',40.519896351041,-74.3271152757816,'DUMMY',NOW()),
('AB01','L0DOCK104','Edison Warehouse','Dock Door 104',40.5199449301814,-74.3271167793881,'DUMMY',NOW()),
('AB01','L0DOCK106','Edison Warehouse','Dock Door 106',40.5199935091416,-74.3271182830948,'DUMMY',NOW()),
('AB01','L0DOCK11','Edison Warehouse','Dock Door 11',40.52000624,-74.32962553,'DUMMY',NOW()),
('AB01','L0DOCK12','Edison Warehouse','Dock Door 12',40.52004481,-74.32961979,'DUMMY',NOW()),
('AB01','L0DOCK13','Edison Warehouse','Dock Door 13',40.52008338,-74.32961405,'DUMMY',NOW()),
('AB01','L0DOCK14','Edison Warehouse','Dock Door 14',40.52012195,-74.32960831,'DUMMY',NOW()),
('AB01','L0DOCK15','Edison Warehouse','Dock Door 15',40.52016052,-74.32960257,'DUMMY',NOW()),
('AB01','L0DOCK16','Edison Warehouse','Dock Door 16',40.52019909,-74.32959683,'DUMMY',NOW()),
('AB01','L0DOCK17','Edison Warehouse','Dock Door 17',40.52023766,-74.32959109,'DUMMY',NOW()),
('AB01','L0DOCK18','Edison Warehouse','Dock Door 18',40.52027623,-74.32958535,'DUMMY',NOW()),
('AB01','L0DOCK19','Edison Warehouse','Dock Door 19',40.5203148,-74.32957961,'DUMMY',NOW()),
('AB01','L0DOCK20','Edison Warehouse','Dock Door 20',40.52035337,-74.32957387,'DUMMY',NOW()),
('AB01','L0DOCK21','Edison Warehouse','Dock Door 21',40.52039194,-74.32956813,'DUMMY',NOW()),
('AB01','L0DOCK22','Edison Warehouse','Dock Door 22',40.52043145,-74.32956237,'DUMMY',NOW()),
('AB01','L0DOCK24','Edison Warehouse','Dock Door 24',40.5208229213485,-74.3294759279507,'DUMMY',NOW()),
('AB01','L0DOCK25','Edison Warehouse','Dock Door 25',40.520855531477,-74.3294709276539,'DUMMY',NOW()),
('AB01','L0DOCK26','Edison Warehouse','Dock Door 26',40.5208881416055,-74.329465927357,'DUMMY',NOW()),
('AB01','L0DOCK27','Edison Warehouse','Dock Door 27',40.520920751734,-74.3294609270602,'DUMMY',NOW()),
('AB01','L0DOCK28','Edison Warehouse','Dock Door 28',40.5209533618625,-74.3294559267634,'DUMMY',NOW()),
('AB01','L0DOCK29','Edison Warehouse','Dock Door 29',40.520985971991,-74.3294509264666,'DUMMY',NOW()),
('AB01','L0DOCK30','Edison Warehouse','Dock Door 30',40.5210185821195,-74.3294459261697,'DUMMY',NOW()),
('AB01','L0DOCK31','Edison Warehouse','Dock Door 31',40.521051192248,-74.3294409258729,'DUMMY',NOW()),
('AB01','L0DOCK32','Edison Warehouse','Dock Door 32',40.5210838023765,-74.3294359255761,'DUMMY',NOW()),
('AB01','L0DOCK33','Edison Warehouse','Dock Door 33',40.521116412505,-74.3294309252792,'DUMMY',NOW()),
('AB01','L0DOCK34','Edison Warehouse','Dock Door 34',40.5211490226335,-74.3294259249824,'DUMMY',NOW()),
('AB01','L0DOCK35','Edison Warehouse','Dock Door 35',40.521181632762,-74.3294209246856,'DUMMY',NOW()),
('AB01','L0DOCK36','Edison Warehouse','Dock Door 36',40.5212142428905,-74.3294159243888,'DUMMY',NOW()),
('AB01','L0DOCK37','Edison Warehouse','Dock Door 37',40.521246853019,-74.3294109240919,'DUMMY',NOW()),
('AB01','L0DOCK38','Edison Warehouse','Dock Door 38',40.5212794631474,-74.3294059237951,'DUMMY',NOW()),
('AB01','L0DOCK39','Edison Warehouse','Dock Door 39',40.5213120732759,-74.3294009234983,'DUMMY',NOW()),
('AB01','L0DOCK40','Edison Warehouse','Dock Door 40',40.5213446834044,-74.3293959232014,'DUMMY',NOW()),
('AB01','L0DOCK41','Edison Warehouse','Dock Door 41',40.5213772935329,-74.3293909229046,'DUMMY',NOW()),
('AB01','L0DOCK42','Edison Warehouse','Dock Door 42',40.5214099036614,-74.3293859226078,'DUMMY',NOW()),
('AB01','L0DOCK43','Edison Warehouse','Dock Door 43',40.5214425137899,-74.329380922311,'DUMMY',NOW()),
('AB01','L0DOCK44','Edison Warehouse','Dock Door 44',40.5214751239184,-74.3293759220141,'DUMMY',NOW()),
('AB01','L0DOCK45','Edison Warehouse','Dock Door 45',40.5215077340469,-74.3293709217173,'DUMMY',NOW()),
('AB01','L0DOCK46','Edison Warehouse','Dock Door 46',40.5215403441754,-74.3293659214205,'DUMMY',NOW()),
('AB01','L0DOCK47','Edison Warehouse','Dock Door 47',40.5215729543039,-74.3293609211236,'DUMMY',NOW()),
('AB01','L0DOCK48','Edison Warehouse','Dock Door 48',40.5216055644324,-74.3293559208268,'DUMMY',NOW()),
('AB01','L0DOCK49','Edison Warehouse','Dock Door 49',40.5216381745609,-74.32935092053,'DUMMY',NOW()),
('AB01','L0DOCK50','Edison Warehouse','Dock Door 50',40.5216707846894,-74.3293459202332,'DUMMY',NOW()),
('AB01','L0DOCK51','Edison Warehouse','Dock Door 51',40.5217033948179,-74.3293409199363,'DUMMY',NOW()),
('AB01','L0DOCK52','Edison Warehouse','Dock Door 52',40.5217365786336,-74.3293360551291,'DUMMY',NOW()),
('AB01','L0DOCK53','Edison Warehouse','Dock Door 53',40.5217753735399,-74.3291638112273,'DUMMY',NOW()),
('AB01','L0DOCK95','Edison Warehouse','Dock Door 95',0,0,'DUMMY',NOW()),
('AB01','L0DOCK96','Edison Warehouse','Dock Door 96',0,0,'DUMMY',NOW()),
('AB01','L0DOCK97','Edison Warehouse','Dock Door 97',0,0,'DUMMY',NOW()),
('AB31','L4DOCK01','Keasby Warehouse','Dock Door 1',40.5193735326335,-74.3247185779681,'DUMMY',NOW()),
('AB31','L4DOCK02','Keasby Warehouse','Dock Door 2',40.5194102767063,-74.3247112331159,'DUMMY',NOW()),
('AB31','L4DOCK03','Keasby Warehouse','Dock Door 3',40.5194470207791,-74.3247038882637,'DUMMY',NOW()),
('AB31','L4DOCK04','Keasby Warehouse','Dock Door 4',40.5194837648519,-74.3246965434115,'DUMMY',NOW()),
('AB31','L4DOCK05','Keasby Warehouse','Dock Door 5',40.5195205089247,-74.3246891985593,'DUMMY',NOW()),
('AB31','L4DOCK06','Keasby Warehouse','Dock Door 6',40.5195572529975,-74.3246818537071,'DUMMY',NOW()),
('AB31','L4DOCK07','Keasby Warehouse','Dock Door 7',40.5195939970703,-74.324674508855,'DUMMY',NOW()),
('AB31','L4DOCK08','Keasby Warehouse','Dock Door 8',40.5196307411431,-74.3246671640028,'DUMMY',NOW()),
('AB31','L4DOCK09','Keasby Warehouse','Dock Door 9',40.519667485216,-74.3246598191506,'DUMMY',NOW()),
('AB31','L4DOCK10','Keasby Warehouse','Dock Door 10',40.5197042292888,-74.3246524742984,'DUMMY',NOW()),
('AB31','L4DOCK11','Keasby Warehouse','Dock Door 11',40.5197409733616,-74.3246451294462,'DUMMY',NOW()),
('AB31','L4DOCK12','Keasby Warehouse','Dock Door 12',40.5197777174344,-74.324637784594,'DUMMY',NOW()),
('AB31','L4DOCK13','Keasby Warehouse','Dock Door 13',40.5198144615072,-74.3246304397418,'DUMMY',NOW()),
('AB31','L4DOCK14','Keasby Warehouse','Dock Door 14',40.51985120558,-74.3246230948896,'DUMMY',NOW()),
('AB31','L4DOCK15','Keasby Warehouse','Dock Door 15',40.5198879496528,-74.3246157500374,'DUMMY',NOW()),
('AB31','L4DOCK16','Keasby Warehouse','Dock Door 16',40.5199246937256,-74.3246084051853,'DUMMY',NOW()),
('AB31','L4DOCK17','Keasby Warehouse','Dock Door 17',40.5199614377985,-74.3246010603331,'DUMMY',NOW()),
('AB31','L4DOCK18','Keasby Warehouse','Dock Door 18',40.5199981818713,-74.3245937154809,'DUMMY',NOW()),
('AB31','L4DOCK19','Keasby Warehouse','Dock Door 19',40.5200349259441,-74.3245863706287,'DUMMY',NOW()),
('AB31','L4DOCK20','Keasby Warehouse','Dock Door 20',40.5200716700169,-74.3245790257765,'DUMMY',NOW()),
('AB31','L4DOCK21','Keasby Warehouse','Dock Door 21',40.5201084140897,-74.3245716809243,'DUMMY',NOW()),
('AB31','L4DOCK22','Keasby Warehouse','Dock Door 22',40.5201451581625,-74.3245643360721,'DUMMY',NOW()),
('AB31','L4DOCK23','Keasby Warehouse','Dock Door 23',40.5201819022353,-74.3245569912199,'DUMMY',NOW()),
('AB31','L4DOCK24','Keasby Warehouse','Dock Door 24',40.5202186463081,-74.3245496463677,'DUMMY',NOW()),
('AB31','L4DOCK25','Keasby Warehouse','Dock Door 25',40.520255390381,-74.3245423015156,'DUMMY',NOW()),
('AB31','L4DOCK26','Keasby Warehouse','Dock Door 26',40.5202921344538,-74.3245349566634,'DUMMY',NOW()),
('AB31','L4DOCK27','Keasby Warehouse','Dock Door 27',40.5203288785266,-74.3245276118112,'DUMMY',NOW()),
('AB31','L4DOCK28','Keasby Warehouse','Dock Door 28',40.5203656225994,-74.324520266959,'DUMMY',NOW()),
('AB31','L4DOCK29','Keasby Warehouse','Dock Door 29',40.5204023666722,-74.3245129221068,'DUMMY',NOW()),
('AB31','L4DOCK30','Keasby Warehouse','Dock Door 30',40.520439110745,-74.3245055772546,'DUMMY',NOW()),
('AB31','L4DOCK31','Keasby Warehouse','Dock Door 31',40.5204758548178,-74.3244982324024,'DUMMY',NOW()),
('AB31','L4DOCK32','Keasby Warehouse','Dock Door 32',40.5205125988906,-74.3244908875502,'DUMMY',NOW()),
('AB31','L4DOCK33','Keasby Warehouse','Dock Door 33',40.5205493429635,-74.324483542698,'DUMMY',NOW()),
('AB31','L4DOCK34','Keasby Warehouse','Dock Door 34',40.5205860870363,-74.3244761978459,'DUMMY',NOW()),
('AB31','L4DOCK35','Keasby Warehouse','Dock Door 35',40.5206228311091,-74.3244688529937,'DUMMY',NOW()),
('AB31','L4DOCK36','Keasby Warehouse','Dock Door 36',40.5206595751819,-74.3244615081415,'DUMMY',NOW()),
('AB31','L4DOCK37','Keasby Warehouse','Dock Door 37',40.5206963192547,-74.3244541632893,'DUMMY',NOW()),
('AB31','L4DOCK38','Keasby Warehouse','Dock Door 38',40.5207330633275,-74.3244468184371,'DUMMY',NOW()),
('AB31','L4DOCK39','Keasby Warehouse','Dock Door 39',40.5207698074003,-74.3244394735849,'DUMMY',NOW()),
('AB31','L4DOCK40','Keasby Warehouse','Dock Door 40',40.5208065514731,-74.3244321287327,'DUMMY',NOW()),
('AB31','L4DOCK41','Keasby Warehouse','Dock Door 41',40.5208432955459,-74.3244247838805,'DUMMY',NOW()),
('AB31','L4DOCK42','Keasby Warehouse','Dock Door 42',40.5208800396188,-74.3244174390284,'DUMMY',NOW()),
('AB31','L4DOCK43','Keasby Warehouse','Dock Door 43',40.5209782404368,-74.3243472655869,'DUMMY',NOW()),
('AB31','L4DOCK44','Keasby Warehouse','Dock Door 44',40.5210216724886,-74.324339331203,'DUMMY',NOW()),
('AB31','L4DOCK45','Keasby Warehouse','Dock Door 45',40.5210651045405,-74.3243313968192,'DUMMY',NOW()),
('AB31','L4DOCK46','Keasby Warehouse','Dock Door 46',40.5211085365924,-74.3243234624353,'DUMMY',NOW()),
('AB31','L4DOCK47','Keasby Warehouse','Dock Door 47',40.5211519686442,-74.3243155280515,'DUMMY',NOW()),
('AB31','L4DOCK48','Keasby Warehouse','Dock Door 48',40.5211954006961,-74.3243075936677,'DUMMY',NOW()),
('AB31','L4DOCK49','Keasby Warehouse','Dock Door 49',40.5212388327479,-74.3242996592838,'DUMMY',NOW()),
('AB31','L4DOCK50','Keasby Warehouse','Dock Door 50',40.5212822647998,-74.3242917249,'DUMMY',NOW()),
('AB31','L4DOCK51','Keasby Warehouse','Dock Door 51',40.5213256968517,-74.3242837905161,'DUMMY',NOW()),
('AB31','L4DOCK52','Keasby Warehouse','Dock Door 52',40.5213691289035,-74.3242758561323,'DUMMY',NOW()),
('AB31','L4DOCK53','Keasby Warehouse','Dock Door 53',40.5214125609554,-74.3242679217484,'DUMMY',NOW()),
('AB31','L4DOCK54','Keasby Warehouse','Dock Door 54',40.5214559930073,-74.3242599873646,'DUMMY',NOW()),
('AB31','L4DOCK55','Keasby Warehouse','Dock Door 55',40.5214994250591,-74.3242520529808,'DUMMY',NOW()),
('AB31','L4DOCK56','Keasby Warehouse','Dock Door 56',40.521542857111,-74.3242441185969,'DUMMY',NOW()),
('AB31','L4DOCK57','Keasby Warehouse','Dock Door 57',40.5215862891629,-74.3242361842131,'DUMMY',NOW()),
('AB31','L4DOCK58','Keasby Warehouse','Dock Door 58',40.5216297212147,-74.3242282498292,'DUMMY',NOW()),
('AB31','L4DOCK59','Keasby Warehouse','Dock Door 59',40.5216731532666,-74.3242203154454,'DUMMY',NOW()),
('AB31','L4DOCK60','Keasby Warehouse','Dock Door 60',40.5217165853185,-74.3242123810615,'DUMMY',NOW()),
('AB31','L4DOCK61','Keasby Warehouse','Dock Door 61',40.5217600173703,-74.3242044466777,'DUMMY',NOW()),
('AB31','L4DOCK62','Keasby Warehouse','Dock Door 62',40.5218034494222,-74.3241965122938,'DUMMY',NOW()),
('AB31','L4DOCK63','Keasby Warehouse','Dock Door 63',40.5218468814741,-74.32418857791,'DUMMY',NOW()),
('AB31','L4DOCK64','Keasby Warehouse','Dock Door 64',40.5218903135259,-74.3241806435262,'DUMMY',NOW()),
('AB31','L4DOCK65','Keasby Warehouse','Dock Door 65',40.5219337455778,-74.3241727091423,'DUMMY',NOW()),
('AB31','L4DOCK66','Keasby Warehouse','Dock Door 66',40.5219771776296,-74.3241647747585,'DUMMY',NOW()),
('AB31','L4DOCK67','Keasby Warehouse','Dock Door 67',40.5220206096815,-74.3241568403746,'DUMMY',NOW()),
('AB31','L4DOCK68','Keasby Warehouse','Dock Door 68',40.5220640417334,-74.3241489059908,'DUMMY',NOW()),
('AB31','L4DOCK69','Keasby Warehouse','Dock Door 69',40.5221074737852,-74.3241409716069,'DUMMY',NOW()),
('AB31','L4DOCK70','Keasby Warehouse','Dock Door 70',40.5221509058371,-74.3241330372231,'DUMMY',NOW()),
('AB31','L4DOCK71','Keasby Warehouse','Dock Door 71',40.522194337889,-74.3241251028392,'DUMMY',NOW()),
('AB31','L4DOCK72','Keasby Warehouse','Dock Door 72',40.5222377699408,-74.3241171684554,'DUMMY',NOW()),
('AB31','L4DOCK73','Keasby Warehouse','Dock Door 73',40.5222812019927,-74.3241092340716,'DUMMY',NOW()),
('AB31','L4DOCK74','Keasby Warehouse','Dock Door 74',40.5223246340446,-74.3241012996877,'DUMMY',NOW()),
('AB31','L4DOCK75','Keasby Warehouse','Dock Door 75',40.5223680660964,-74.3240933653039,'DUMMY',NOW()),
('AB31','L4DOCK76','Keasby Warehouse','Dock Door 76',40.5224114981483,-74.32408543092,'DUMMY',NOW()),
('AB31','L4DOCK77','Keasby Warehouse','Dock Door 77',40.5224549302002,-74.3240774965362,'DUMMY',NOW()),
('AB31','L4DOCK78','Keasby Warehouse','Dock Door 78',40.522498362252,-74.3240695621523,'DUMMY',NOW()),
('AB31','L4DOCK79','Keasby Warehouse','Dock Door 79',40.5225417943039,-74.3240616277685,'DUMMY',NOW()),
('AB31','L4DOCK80','Keasby Warehouse','Dock Door 80',40.5225852263557,-74.3240536933847,'DUMMY',NOW()),
('AB31','L4DOCK81','Keasby Warehouse','Dock Door 81',40.5226286584076,-74.3240457590008,'DUMMY',NOW()),
('AB31','L4DOCK82','Keasby Warehouse','Dock Door 82',40.5226720904595,-74.324037824617,'DUMMY',NOW()),
('AB31','L4DOCK83','Keasby Warehouse','Dock Door 83',40.5227155225113,-74.3240298902331,'DUMMY',NOW()),
('HB01','L0DOCK08','Edison Warehouse','Dock Door 08',0,0,'DUMMY',NOW()),
('HB01','L0DOCK09','Edison Warehouse','Dock Door 09',0,0,'DUMMY',NOW()),
('HB01','L0DOCK10','Edison Warehouse','Dock Door 10',0,0,'DUMMY',NOW()),
('HB01','L0DOCK100','Edison Warehouse','Dock Door 100',40.5198477719006,-74.3271137721751,'DUMMY',NOW()),
('HB01','L0DOCK102','Edison Warehouse','Dock Door 102',40.519896351041,-74.3271152757816,'DUMMY',NOW()),
('HB01','L0DOCK104','Edison Warehouse','Dock Door 104',40.5199449301814,-74.3271167793881,'DUMMY',NOW()),
('HB01','L0DOCK106','Edison Warehouse','Dock Door 106',40.5199935091416,-74.3271182830948,'DUMMY',NOW()),
('HB01','L0DOCK11','Edison Warehouse','Dock Door 11',40.52000624,-74.32962553,'DUMMY',NOW()),
('HB01','L0DOCK12','Edison Warehouse','Dock Door 12',40.52004481,-74.32961979,'DUMMY',NOW()),
('HB01','L0DOCK13','Edison Warehouse','Dock Door 13',40.52008338,-74.32961405,'DUMMY',NOW()),
('HB01','L0DOCK14','Edison Warehouse','Dock Door 14',40.52012195,-74.32960831,'DUMMY',NOW()),
('HB01','L0DOCK15','Edison Warehouse','Dock Door 15',40.52016052,-74.32960257,'DUMMY',NOW()),
('HB01','L0DOCK16','Edison Warehouse','Dock Door 16',40.52019909,-74.32959683,'DUMMY',NOW()),
('HB01','L0DOCK17','Edison Warehouse','Dock Door 17',40.52023766,-74.32959109,'DUMMY',NOW()),
('HB01','L0DOCK18','Edison Warehouse','Dock Door 18',40.52027623,-74.32958535,'DUMMY',NOW()),
('HB01','L0DOCK19','Edison Warehouse','Dock Door 19',40.5203148,-74.32957961,'DUMMY',NOW()),
('HB01','L0DOCK20','Edison Warehouse','Dock Door 20',40.52035337,-74.32957387,'DUMMY',NOW()),
('HB01','L0DOCK21','Edison Warehouse','Dock Door 21',40.52039194,-74.32956813,'DUMMY',NOW()),
('HB01','L0DOCK22','Edison Warehouse','Dock Door 22',40.52043145,-74.32956237,'DUMMY',NOW()),
('HB01','L0DOCK24','Edison Warehouse','Dock Door 24',40.5208229213485,-74.3294759279507,'DUMMY',NOW()),
('HB01','L0DOCK25','Edison Warehouse','Dock Door 25',40.520855531477,-74.3294709276539,'DUMMY',NOW()),
('HB01','L0DOCK26','Edison Warehouse','Dock Door 26',40.5208881416055,-74.329465927357,'DUMMY',NOW()),
('HB01','L0DOCK27','Edison Warehouse','Dock Door 27',40.520920751734,-74.3294609270602,'DUMMY',NOW()),
('HB01','L0DOCK28','Edison Warehouse','Dock Door 28',40.5209533618625,-74.3294559267634,'DUMMY',NOW()),
('HB01','L0DOCK29','Edison Warehouse','Dock Door 29',40.520985971991,-74.3294509264666,'DUMMY',NOW()),
('HB01','L0DOCK30','Edison Warehouse','Dock Door 30',40.5210185821195,-74.3294459261697,'DUMMY',NOW()),
('HB01','L0DOCK31','Edison Warehouse','Dock Door 31',40.521051192248,-74.3294409258729,'DUMMY',NOW()),
('HB01','L0DOCK32','Edison Warehouse','Dock Door 32',40.5210838023765,-74.3294359255761,'DUMMY',NOW()),
('HB01','L0DOCK33','Edison Warehouse','Dock Door 33',40.521116412505,-74.3294309252792,'DUMMY',NOW()),
('HB01','L0DOCK34','Edison Warehouse','Dock Door 34',40.5211490226335,-74.3294259249824,'DUMMY',NOW()),
('HB01','L0DOCK35','Edison Warehouse','Dock Door 35',40.521181632762,-74.3294209246856,'DUMMY',NOW()),
('HB01','L0DOCK36','Edison Warehouse','Dock Door 36',40.5212142428905,-74.3294159243888,'DUMMY',NOW()),
('HB01','L0DOCK37','Edison Warehouse','Dock Door 37',40.521246853019,-74.3294109240919,'DUMMY',NOW()),
('HB01','L0DOCK38','Edison Warehouse','Dock Door 38',40.5212794631474,-74.3294059237951,'DUMMY',NOW()),
('HB01','L0DOCK39','Edison Warehouse','Dock Door 39',40.5213120732759,-74.3294009234983,'DUMMY',NOW()),
('HB01','L0DOCK40','Edison Warehouse','Dock Door 40',40.5213446834044,-74.3293959232014,'DUMMY',NOW()),
('HB01','L0DOCK41','Edison Warehouse','Dock Door 41',40.5213772935329,-74.3293909229046,'DUMMY',NOW()),
('HB01','L0DOCK42','Edison Warehouse','Dock Door 42',40.5214099036614,-74.3293859226078,'DUMMY',NOW()),
('HB01','L0DOCK43','Edison Warehouse','Dock Door 43',40.5214425137899,-74.329380922311,'DUMMY',NOW()),
('HB01','L0DOCK44','Edison Warehouse','Dock Door 44',40.5214751239184,-74.3293759220141,'DUMMY',NOW()),
('HB01','L0DOCK45','Edison Warehouse','Dock Door 45',40.5215077340469,-74.3293709217173,'DUMMY',NOW()),
('HB01','L0DOCK46','Edison Warehouse','Dock Door 46',40.5215403441754,-74.3293659214205,'DUMMY',NOW()),
('HB01','L0DOCK47','Edison Warehouse','Dock Door 47',40.5215729543039,-74.3293609211236,'DUMMY',NOW()),
('HB01','L0DOCK48','Edison Warehouse','Dock Door 48',40.5216055644324,-74.3293559208268,'DUMMY',NOW()),
('HB01','L0DOCK49','Edison Warehouse','Dock Door 49',40.5216381745609,-74.32935092053,'DUMMY',NOW()),
('HB01','L0DOCK50','Edison Warehouse','Dock Door 50',40.5216707846894,-74.3293459202332,'DUMMY',NOW()),
('HB01','L0DOCK51','Edison Warehouse','Dock Door 51',40.5217033948179,-74.3293409199363,'DUMMY',NOW()),
('HB01','L0DOCK52','Edison Warehouse','Dock Door 52',40.5217365786336,-74.3293360551291,'DUMMY',NOW()),
('HB01','L0DOCK53','Edison Warehouse','Dock Door 53',40.5217753735399,-74.3291638112273,'DUMMY',NOW()),
('HB01','L0DOCK95','Edison Warehouse','Dock Door 95',0,0,'DUMMY',NOW()),
('HB01','L0DOCK96','Edison Warehouse','Dock Door 96',0,0,'DUMMY',NOW()),
('HB01','L0DOCK97','Edison Warehouse','Dock Door 97',0,0,'DUMMY',NOW()),
('HB01','L4DOCK01','Edison Warehouse','Dock Door 01',0,0,'DUMMY',NOW()),
('HB01','L4DOCK02','Edison Warehouse','Dock Door 02',0,0,'DUMMY',NOW()),
('HB01','L4DOCK03','Edison Warehouse','Dock Door 03',0,0,'DUMMY',NOW()),
('HB31','L4DOCK01','Keasby Warehouse','Dock Door 1',40.5193735326335,-74.3247185779681,'DUMMY',NOW()),
('HB31','L4DOCK02','Keasby Warehouse','Dock Door 2',40.5194102767063,-74.3247112331159,'DUMMY',NOW()),
('HB31','L4DOCK03','Keasby Warehouse','Dock Door 3',40.5194470207791,-74.3247038882637,'DUMMY',NOW()),
('HB31','L4DOCK04','Keasby Warehouse','Dock Door 4',40.5194837648519,-74.3246965434115,'DUMMY',NOW()),
('HB31','L4DOCK05','Keasby Warehouse','Dock Door 5',40.5195205089247,-74.3246891985593,'DUMMY',NOW()),
('HB31','L4DOCK06','Keasby Warehouse','Dock Door 6',40.5195572529975,-74.3246818537071,'DUMMY',NOW()),
('HB31','L4DOCK07','Keasby Warehouse','Dock Door 7',40.5195939970703,-74.324674508855,'DUMMY',NOW()),
('HB31','L4DOCK08','Keasby Warehouse','Dock Door 8',40.5196307411431,-74.3246671640028,'DUMMY',NOW()),
('HB31','L4DOCK09','Keasby Warehouse','Dock Door 9',40.519667485216,-74.3246598191506,'DUMMY',NOW()),
('HB31','L4DOCK10','Keasby Warehouse','Dock Door 10',40.5197042292888,-74.3246524742984,'DUMMY',NOW()),
('HB31','L4DOCK11','Keasby Warehouse','Dock Door 11',40.5197409733616,-74.3246451294462,'DUMMY',NOW()),
('HB31','L4DOCK12','Keasby Warehouse','Dock Door 12',40.5197777174344,-74.324637784594,'DUMMY',NOW()),
('HB31','L4DOCK13','Keasby Warehouse','Dock Door 13',40.5198144615072,-74.3246304397418,'DUMMY',NOW()),
('HB31','L4DOCK14','Keasby Warehouse','Dock Door 14',40.51985120558,-74.3246230948896,'DUMMY',NOW()),
('HB31','L4DOCK15','Keasby Warehouse','Dock Door 15',40.5198879496528,-74.3246157500374,'DUMMY',NOW()),
('HB31','L4DOCK16','Keasby Warehouse','Dock Door 16',40.5199246937256,-74.3246084051853,'DUMMY',NOW()),
('HB31','L4DOCK17','Keasby Warehouse','Dock Door 17',40.5199614377985,-74.3246010603331,'DUMMY',NOW()),
('HB31','L4DOCK18','Keasby Warehouse','Dock Door 18',40.5199981818713,-74.3245937154809,'DUMMY',NOW()),
('HB31','L4DOCK19','Keasby Warehouse','Dock Door 19',40.5200349259441,-74.3245863706287,'DUMMY',NOW()),
('HB31','L4DOCK20','Keasby Warehouse','Dock Door 20',40.5200716700169,-74.3245790257765,'DUMMY',NOW()),
('HB31','L4DOCK21','Keasby Warehouse','Dock Door 21',40.5201084140897,-74.3245716809243,'DUMMY',NOW()),
('HB31','L4DOCK22','Keasby Warehouse','Dock Door 22',40.5201451581625,-74.3245643360721,'DUMMY',NOW()),
('HB31','L4DOCK23','Keasby Warehouse','Dock Door 23',40.5201819022353,-74.3245569912199,'DUMMY',NOW()),
('HB31','L4DOCK24','Keasby Warehouse','Dock Door 24',40.5202186463081,-74.3245496463677,'DUMMY',NOW()),
('HB31','L4DOCK25','Keasby Warehouse','Dock Door 25',40.520255390381,-74.3245423015156,'DUMMY',NOW()),
('HB31','L4DOCK26','Keasby Warehouse','Dock Door 26',40.5202921344538,-74.3245349566634,'DUMMY',NOW()),
('HB31','L4DOCK27','Keasby Warehouse','Dock Door 27',40.5203288785266,-74.3245276118112,'DUMMY',NOW()),
('HB31','L4DOCK28','Keasby Warehouse','Dock Door 28',40.5203656225994,-74.324520266959,'DUMMY',NOW()),
('HB31','L4DOCK29','Keasby Warehouse','Dock Door 29',40.5204023666722,-74.3245129221068,'DUMMY',NOW()),
('HB31','L4DOCK30','Keasby Warehouse','Dock Door 30',40.520439110745,-74.3245055772546,'DUMMY',NOW()),
('HB31','L4DOCK31','Keasby Warehouse','Dock Door 31',40.5204758548178,-74.3244982324024,'DUMMY',NOW()),
('HB31','L4DOCK32','Keasby Warehouse','Dock Door 32',40.5205125988906,-74.3244908875502,'DUMMY',NOW()),
('HB31','L4DOCK33','Keasby Warehouse','Dock Door 33',40.5205493429635,-74.324483542698,'DUMMY',NOW()),
('HB31','L4DOCK34','Keasby Warehouse','Dock Door 34',40.5205860870363,-74.3244761978459,'DUMMY',NOW()),
('HB31','L4DOCK35','Keasby Warehouse','Dock Door 35',40.5206228311091,-74.3244688529937,'DUMMY',NOW()),
('HB31','L4DOCK36','Keasby Warehouse','Dock Door 36',40.5206595751819,-74.3244615081415,'DUMMY',NOW()),
('HB31','L4DOCK37','Keasby Warehouse','Dock Door 37',40.5206963192547,-74.3244541632893,'DUMMY',NOW()),
('HB31','L4DOCK38','Keasby Warehouse','Dock Door 38',40.5207330633275,-74.3244468184371,'DUMMY',NOW()),
('HB31','L4DOCK39','Keasby Warehouse','Dock Door 39',40.5207698074003,-74.3244394735849,'DUMMY',NOW()),
('HB31','L4DOCK40','Keasby Warehouse','Dock Door 40',40.5208065514731,-74.3244321287327,'DUMMY',NOW()),
('HB31','L4DOCK41','Keasby Warehouse','Dock Door 41',40.5208432955459,-74.3244247838805,'DUMMY',NOW()),
('HB31','L4DOCK42','Keasby Warehouse','Dock Door 42',40.5208800396188,-74.3244174390284,'DUMMY',NOW()),
('HB31','L4DOCK43','Keasby Warehouse','Dock Door 43',40.5209782404368,-74.3243472655869,'DUMMY',NOW()),
('HB31','L4DOCK44','Keasby Warehouse','Dock Door 44',40.5210216724886,-74.324339331203,'DUMMY',NOW()),
('HB31','L4DOCK45','Keasby Warehouse','Dock Door 45',40.5210651045405,-74.3243313968192,'DUMMY',NOW()),
('HB31','L4DOCK46','Keasby Warehouse','Dock Door 46',40.5211085365924,-74.3243234624353,'DUMMY',NOW()),
('HB31','L4DOCK47','Keasby Warehouse','Dock Door 47',40.5211519686442,-74.3243155280515,'DUMMY',NOW()),
('HB31','L4DOCK48','Keasby Warehouse','Dock Door 48',40.5211954006961,-74.3243075936677,'DUMMY',NOW()),
('HB31','L4DOCK49','Keasby Warehouse','Dock Door 49',40.5212388327479,-74.3242996592838,'DUMMY',NOW()),
('HB31','L4DOCK50','Keasby Warehouse','Dock Door 50',40.5212822647998,-74.3242917249,'DUMMY',NOW()),
('HB31','L4DOCK51','Keasby Warehouse','Dock Door 51',40.5213256968517,-74.3242837905161,'DUMMY',NOW()),
('HB31','L4DOCK52','Keasby Warehouse','Dock Door 52',40.5213691289035,-74.3242758561323,'DUMMY',NOW()),
('HB31','L4DOCK53','Keasby Warehouse','Dock Door 53',40.5214125609554,-74.3242679217484,'DUMMY',NOW()),
('HB31','L4DOCK54','Keasby Warehouse','Dock Door 54',40.5214559930073,-74.3242599873646,'DUMMY',NOW()),
('HB31','L4DOCK55','Keasby Warehouse','Dock Door 55',40.5214994250591,-74.3242520529808,'DUMMY',NOW()),
('HB31','L4DOCK56','Keasby Warehouse','Dock Door 56',40.521542857111,-74.3242441185969,'DUMMY',NOW()),
('HB31','L4DOCK57','Keasby Warehouse','Dock Door 57',40.5215862891629,-74.3242361842131,'DUMMY',NOW()),
('HB31','L4DOCK58','Keasby Warehouse','Dock Door 58',40.5216297212147,-74.3242282498292,'DUMMY',NOW()),
('HB31','L4DOCK59','Keasby Warehouse','Dock Door 59',40.5216731532666,-74.3242203154454,'DUMMY',NOW()),
('HB31','L4DOCK60','Keasby Warehouse','Dock Door 60',40.5217165853185,-74.3242123810615,'DUMMY',NOW()),
('HB31','L4DOCK61','Keasby Warehouse','Dock Door 61',40.5217600173703,-74.3242044466777,'DUMMY',NOW()),
('HB31','L4DOCK62','Keasby Warehouse','Dock Door 62',40.5218034494222,-74.3241965122938,'DUMMY',NOW()),
('HB31','L4DOCK63','Keasby Warehouse','Dock Door 63',40.5218468814741,-74.32418857791,'DUMMY',NOW()),
('HB31','L4DOCK64','Keasby Warehouse','Dock Door 64',40.5218903135259,-74.3241806435262,'DUMMY',NOW()),
('HB31','L4DOCK65','Keasby Warehouse','Dock Door 65',40.5219337455778,-74.3241727091423,'DUMMY',NOW()),
('HB31','L4DOCK66','Keasby Warehouse','Dock Door 66',40.5219771776296,-74.3241647747585,'DUMMY',NOW()),
('HB31','L4DOCK67','Keasby Warehouse','Dock Door 67',40.5220206096815,-74.3241568403746,'DUMMY',NOW()),
('HB31','L4DOCK68','Keasby Warehouse','Dock Door 68',40.5220640417334,-74.3241489059908,'DUMMY',NOW()),
('HB31','L4DOCK69','Keasby Warehouse','Dock Door 69',40.5221074737852,-74.3241409716069,'DUMMY',NOW()),
('HB31','L4DOCK70','Keasby Warehouse','Dock Door 70',40.5221509058371,-74.3241330372231,'DUMMY',NOW()),
('HB31','L4DOCK71','Keasby Warehouse','Dock Door 71',40.522194337889,-74.3241251028392,'DUMMY',NOW()),
('HB31','L4DOCK72','Keasby Warehouse','Dock Door 72',40.5222377699408,-74.3241171684554,'DUMMY',NOW()),
('HB31','L4DOCK73','Keasby Warehouse','Dock Door 73',40.5222812019927,-74.3241092340716,'DUMMY',NOW()),
('HB31','L4DOCK74','Keasby Warehouse','Dock Door 74',40.5223246340446,-74.3241012996877,'DUMMY',NOW()),
('HB31','L4DOCK75','Keasby Warehouse','Dock Door 75',40.5223680660964,-74.3240933653039,'DUMMY',NOW()),
('HB31','L4DOCK76','Keasby Warehouse','Dock Door 76',40.5224114981483,-74.32408543092,'DUMMY',NOW()),
('HB31','L4DOCK77','Keasby Warehouse','Dock Door 77',40.5224549302002,-74.3240774965362,'DUMMY',NOW()),
('HB31','L4DOCK78','Keasby Warehouse','Dock Door 78',40.522498362252,-74.3240695621523,'DUMMY',NOW()),
('HB31','L4DOCK79','Keasby Warehouse','Dock Door 79',40.5225417943039,-74.3240616277685,'DUMMY',NOW()),
('HB31','L4DOCK80','Keasby Warehouse','Dock Door 80',40.5225852263557,-74.3240536933847,'DUMMY',NOW()),
('HB31','L4DOCK81','Keasby Warehouse','Dock Door 81',40.5226286584076,-74.3240457590008,'DUMMY',NOW()),
('HB31','L4DOCK82','Keasby Warehouse','Dock Door 82',40.5226720904595,-74.324037824617,'DUMMY',NOW()),
('HB31','L4DOCK83','Keasby Warehouse','Dock Door 83',40.5227155225113,-74.3240298902331,'DUMMY',NOW()),
('AB01','N01','Yard','N01',40.5221996913731,-74.3297666648474,'DUMMY',NOW()),
('AB01','N02','Yard','N02',40.5221967156428,-74.3297305632216,'DUMMY',NOW()),
('AB01','N03','Yard','N03',40.5221937399125,-74.3296944615957,'DUMMY',NOW()),
('AB01','N04','Yard','N04',40.5221907641822,-74.3296583599698,'DUMMY',NOW()),
('AB01','N05','Yard','N05',40.5221877884519,-74.3296222583439,'DUMMY',NOW()),
('AB01','N06','Yard','N06',40.5221848127216,-74.329586156718,'DUMMY',NOW()),
('AB01','N07','Yard','N07',40.5221818369912,-74.3295500550921,'DUMMY',NOW()),
('AB01','N08','Yard','N08',40.5221788612609,-74.3295139534662,'DUMMY',NOW()),
('AB01','N09','Yard','N09',40.5221758855306,-74.3294778518404,'DUMMY',NOW()),
('AB01','N10','Yard','N10',40.5221729098003,-74.3294417502145,'DUMMY',NOW()),
('AB01','N10A','Yard','N10A',40.52216993407,-74.3294056485886,'DUMMY',NOW()),
('AB01','N11','Yard','N11',40.5221669583396,-74.3293695469627,'DUMMY',NOW()),
('AB01','N12','Yard','N12',40.5221639826093,-74.3293334453368,'DUMMY',NOW()),
('AB01','N13','Yard','N13',40.522161006879,-74.3292973437109,'DUMMY',NOW()),
('AB01','N14','Yard','N14',40.5221580311487,-74.3292612420851,'DUMMY',NOW()),
('AB01','N15','Yard','N15',40.5221550554184,-74.3292251404592,'DUMMY',NOW()),
('AB01','N16','Yard','N16',40.522152079688,-74.3291890388333,'DUMMY',NOW()),
('AB01','N17','Yard','N17',40.5221491039577,-74.3291529372074,'DUMMY',NOW()),
('AB01','N18','Yard','N18',40.5221461282274,-74.3291168355815,'DUMMY',NOW()),
('AB01','N19','Yard','N19',40.5221431524971,-74.3290807339556,'DUMMY',NOW()),
('AB01','N20','Yard','N20',40.5221401767668,-74.3290446323297,'DUMMY',NOW()),
('AB01','N21','Yard','N21',40.5221372010364,-74.3290085307039,'DUMMY',NOW()),
('AB01','N22','Yard','N22',40.5221342253061,-74.328972429078,'DUMMY',NOW()),
('AB01','N23','Yard','N23',40.5221312495758,-74.3289363274521,'DUMMY',NOW()),
('AB01','N24','Yard','N24',40.5221282738455,-74.3289002258262,'DUMMY',NOW()),
('AB01','N25','Yard','N25',40.5221252981152,-74.3288641242003,'DUMMY',NOW()),
('AB01','N26','Yard','N26',40.5221223223848,-74.3288280225744,'DUMMY',NOW()),
('AB01','N27','Yard','N27',40.5221193466545,-74.3287919209485,'DUMMY',NOW()),
('AB01','N28','Yard','N28',40.5221163709242,-74.3287558193227,'DUMMY',NOW()),
('AB01','N29','Yard','N29',40.5221133951939,-74.3287197176968,'DUMMY',NOW()),
('AB01','N30','Yard','N30',40.5221104194636,-74.3286836160709,'DUMMY',NOW()),
('AB01','N31','Yard','N31',40.5221074437332,-74.328647514445,'DUMMY',NOW()),
('AB01','N32','Yard','N32',40.5221044680029,-74.3286114128191,'DUMMY',NOW()),
('AB01','N33','Yard','N33',40.5221014922726,-74.3285753111932,'DUMMY',NOW()),
('AB01','N34','Yard','N34',40.5220985165423,-74.3285392095674,'DUMMY',NOW()),
('AB01','N35','Yard','N35',40.522095540812,-74.3285031079415,'DUMMY',NOW()),
('AB01','N36','Yard','N36',40.5220925650816,-74.3284670063156,'DUMMY',NOW()),
('AB01','N37','Yard','N37',40.5220895893513,-74.3284309046897,'DUMMY',NOW()),
('AB01','N38','Yard','N38',40.522086613621,-74.3283948030638,'DUMMY',NOW()),
('AB01','N39','Yard','N39',40.5220836378907,-74.3283587014379,'DUMMY',NOW()),
('AB01','N40','Yard','N40',40.5220806621604,-74.328322599812,'DUMMY',NOW()),
('AB01','N41','Yard','N41',40.52207768643,-74.3282864981862,'DUMMY',NOW()),
('AB01','N42','Yard','N42',40.5220747106997,-74.3282503965603,'DUMMY',NOW()),
('AB01','N43','Yard','N43',40.5220717349694,-74.3282142949344,'DUMMY',NOW()),
('AB01','N44','Yard','N44',40.5220687592391,-74.3281781933085,'DUMMY',NOW()),
('AB01','N45','Yard','N45',40.5220657835088,-74.3281420916826,'DUMMY',NOW()),
('AB01','N46','Yard','N46',40.5220628077784,-74.3281059900567,'DUMMY',NOW()),
('AB01','N47','Yard','N47',40.5220598320481,-74.3280698884308,'DUMMY',NOW()),
('AB01','N48','Yard','N48',40.5220568563178,-74.328033786805,'DUMMY',NOW()),
('AB01','N49','Yard','N49',40.5220538805875,-74.3279976851791,'DUMMY',NOW()),
('AB01','N50','Yard','N50',40.5220509048572,-74.3279615835532,'DUMMY',NOW()),
('AB01','N51','Yard','N51',40.5220479291268,-74.3279254819273,'DUMMY',NOW()),
('AB01','N52','Yard','N52',40.5220449533965,-74.3278893803014,'DUMMY',NOW()),
('AB01','N53','Yard','N53',40.5220419776662,-74.3278532786755,'DUMMY',NOW()),
('AB01','N54','Yard','N54',40.5220390019359,-74.3278171770497,'DUMMY',NOW()),
('AB01','N55','Yard','N55',40.5220360262056,-74.3277810754238,'DUMMY',NOW()),
('AB01','N56','Yard','N56',40.5220330504752,-74.3277449737979,'DUMMY',NOW()),
('AB01','N57','Yard','N57',40.5220300747449,-74.327708872172,'DUMMY',NOW()),
('AB01','N58','Yard','N58',40.5220270990146,-74.3276727705461,'DUMMY',NOW()),
('AB01','N59','Yard','N59',40.5220241232843,-74.3276366689202,'DUMMY',NOW()),
('AB01','N60','Yard','N60',40.522021147554,-74.3276005672944,'DUMMY',NOW()),
('AB01','N61','Yard','N61',40.5220181718236,-74.3275644656685,'DUMMY',NOW()),
('AB01','N62','Yard','N62',40.5220151960933,-74.3275283640426,'DUMMY',NOW()),
('AB01','N63','Yard','N63',40.522012220363,-74.3274922624167,'DUMMY',NOW()),
('AB01','N64','Yard','N64',40.5220092446327,-74.3274561607908,'DUMMY',NOW()),
('AB01','N65','Yard','N65',40.5220062689024,-74.3274200591649,'DUMMY',NOW()),
('AB01','N66','Yard','N66',40.522003293172,-74.327383957539,'DUMMY',NOW());

SELECT * FROM t_open_load;
SELECT * FROM t_open_load_detail;
SELECT * FROM t_open_order;

SELECT * FROM t_load_master;
SELECT * FROM t_load_detail;
SELECT * FROM t_order;

SELECT * FROM t_driver_location;
SELECT * FROM t_task;
SELECT * FROM t_trailer;


SELECT COUNT(1) FROM t_yard_location;



