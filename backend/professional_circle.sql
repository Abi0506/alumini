CREATE TABLE IF NOT EXISTS professional_circle (
  user_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  company_name VARCHAR(255),
  website VARCHAR(255),
  name VARCHAR(255) NOT NULL,
  designation VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  address VARCHAR(500),
  PRIMARY KEY (user_id)
) AUTO_INCREMENT=4001;
