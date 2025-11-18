-- Migration to create allergies_per_patient table
-- This table allows patients to have multiple specific allergies with notes

CREATE TABLE IF NOT EXISTS allergies_per_patient (
    app_id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT NOT NULL,
    allergies_code SMALLINT NOT NULL,
    notes VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_app_patient
        FOREIGN KEY (patient_id)
        REFERENCES patient(patient_id)
        ON DELETE CASCADE,
        
    CONSTRAINT fk_app_allergy
        FOREIGN KEY (allergies_code)
        REFERENCES codes_allergies(allergies_code)
        ON DELETE RESTRICT,
        
    -- Prevent duplicate allergies for the same patient
    UNIQUE KEY unique_patient_allergy (patient_id, allergies_code)
);

-- Optional: Migrate existing patient allergies to the new table
-- This will copy existing allergies from the patient table to allergies_per_patient
INSERT IGNORE INTO allergies_per_patient (patient_id, allergies_code, notes)
SELECT patient_id, allergies, 'Migrated from patient record'
FROM patient 
WHERE allergies IS NOT NULL;
