-- Create allergies_per_patient table to link patients with their allergies
-- This table will store the many-to-many relationship between patients and allergies

USE `med-app-db`;

CREATE TABLE IF NOT EXISTS `allergies_per_patient` (
  `app_id` INT AUTO_INCREMENT PRIMARY KEY,
  `patient_id` INT NOT NULL,
  `allergy_id` SMALLINT NOT NULL,
  `notes` VARCHAR(255) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_app_patient FOREIGN KEY (patient_id) REFERENCES patient(patient_id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_app_allergy FOREIGN KEY (allergy_id) REFERENCES codes_allergies(allergies_code) ON DELETE CASCADE ON UPDATE CASCADE,
  UNIQUE KEY unique_patient_allergy (patient_id, allergy_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;