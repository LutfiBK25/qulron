--CREATE USER qulronymsadmin WITH PASSWORD 'admin@YMS';

DROP TABLE IF EXISTS t_user;

CREATE TABLE t_user (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    phone VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255),
    role VARCHAR(50) NOT NULL,
    password_reset_required BOOLEAN NOT NULL DEFAULT FALSE
);

-- Indexes for frequently queried fields
CREATE INDEX idx_user_username ON t_user(username);
CREATE INDEX idx_user_email ON t_user(email);
CREATE INDEX idx_user_role ON t_user(role);

-- Grants for all tables
GRANT ALL PRIVILEGES ON TABLE t_user TO qulronadminwebapp;
GRANT USAGE, SELECT ON SEQUENCE t_user_id_seq TO qulronadminwebapp;
GRANT ALL PRIVILEGES ON TABLE t_open_load TO qulronadminwebapp;
GRANT ALL PRIVILEGES ON TABLE t_open_load_detail TO qulronadminwebapp;
GRANT ALL PRIVILEGES ON TABLE t_open_order TO qulronadminwebapp;
GRANT ALL PRIVILEGES ON TABLE t_load_master TO qulronadminwebapp;
GRANT ALL PRIVILEGES ON TABLE t_load_detail TO qulronadminwebapp;
GRANT ALL PRIVILEGES ON TABLE t_order TO qulronadminwebapp;
GRANT ALL PRIVILEGES ON TABLE t_trailer TO qulronadminwebapp;
GRANT ALL PRIVILEGES ON TABLE t_task TO qulronadminwebapp;
GRANT SELECT ON TABLE t_yard_location TO qulronadminwebapp;
GRANT ALL PRIVILEGES ON TABLE t_driver_location TO qulronadminwebapp;