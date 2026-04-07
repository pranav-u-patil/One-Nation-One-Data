-- Table 1: Users (one record per person)
CREATE TABLE users (
  user_id     INT AUTO_INCREMENT PRIMARY KEY,
  full_name   VARCHAR(100),
  dob         DATE,
  email       VARCHAR(100) UNIQUE,
  enroll_no   VARCHAR(50),
  department  VARCHAR(100),
  semester    INT,
  cgpa        DECIMAL(3,2),
  club_name   VARCHAR(100),
  club_role   VARCHAR(50),
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table 2: Templates (each role/form is one template)
CREATE TABLE templates (
  template_id   INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(100),   -- e.g. "Student Profile"
  description   VARCHAR(255),
  version       VARCHAR(10)     -- e.g. "v2.1"
);

-- Table 3: Template fields (which DB column maps to which label in which template)
CREATE TABLE template_fields (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  template_id     INT REFERENCES templates(template_id),
  field_key       VARCHAR(50),   -- e.g. "full_name" (matches users table column)
  display_label   VARCHAR(100),  -- e.g. "5.1.1 — Student Name" for UGC
  display_order   INT,           -- sequence in the template
  format_hint     VARCHAR(50)    -- e.g. "text", "date", "number"
);

-- Table 4: Cross-template field mappings (UGC ↔ NAAC etc.)
CREATE TABLE field_mappings (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  source_template_id  INT,
  target_template_id  INT,
  source_label        VARCHAR(100),
  target_label        VARCHAR(100),
  field_key           VARCHAR(50),
  match_type          ENUM('exact','approximate','reordered')
);
