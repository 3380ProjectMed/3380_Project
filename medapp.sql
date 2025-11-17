-- --------------------------------------------------------
-- Host:                         medconnect-db.mysql.database.azure.com
-- Server version:               8.0.42-azure - Source distribution
-- Server OS:                    Linux
-- HeidiSQL Version:             12.12.0.7122
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


-- Dumping database structure for med-app-db
CREATE DATABASE IF NOT EXISTS `med-app-db` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `med-app-db`;

-- Dumping structure for table med-app-db.appointment
CREATE TABLE IF NOT EXISTS `appointment` (
  `Appointment_id` int NOT NULL AUTO_INCREMENT,
  `Patient_id` int DEFAULT NULL,
  `Doctor_id` int DEFAULT NULL,
  `Office_id` int DEFAULT NULL,
  `Appointment_date` datetime NOT NULL,
  `Date_created` datetime NOT NULL,
  `Reason_for_visit` varchar(300) DEFAULT NULL,
  `Status` enum('Scheduled','Pending','Waiting','Checked-in','In Progress','Completed','Cancelled','No-Show') DEFAULT NULL,
  PRIMARY KEY (`Appointment_id`),
  KEY `ix_appt_patient` (`Patient_id`),
  KEY `ix_appt_doctor` (`Doctor_id`),
  KEY `ix_appt_office` (`Office_id`),
  CONSTRAINT `fk_appt__doctor` FOREIGN KEY (`Doctor_id`) REFERENCES `doctor` (`doctor_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_appt__office` FOREIGN KEY (`Office_id`) REFERENCES `office` (`office_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_appt__patient` FOREIGN KEY (`Patient_id`) REFERENCES `patient` (`patient_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1067 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table med-app-db.appointment: ~58 rows (approximately)
DELETE FROM `appointment`;
INSERT INTO `appointment` (`Appointment_id`, `Patient_id`, `Doctor_id`, `Office_id`, `Appointment_date`, `Date_created`, `Reason_for_visit`, `Status`) VALUES
	(1001, 1, 1, 1, '2025-11-07 11:00:00', '2025-10-20 14:30:00', 'Annual physical examination', 'Scheduled'),
	(1002, 3, 1, 1, '2025-11-05 14:00:00', '2025-10-02 16:45:00', 'Follow-up consultation', 'Scheduled'),
	(1003, 5, 1, 1, '2025-11-10 10:30:00', '2023-12-22 09:15:00', 'Annual checkup', 'In Progress'),
	(1004, 7, 2, 4, '2025-11-17 11:00:00', '2024-01-08 14:25:00', 'Heart condition monitoring', 'Scheduled'),
	(1006, 8, 3, 2, '2025-11-18 15:45:00', '2024-01-11 12:15:00', 'Vaccination', 'Scheduled'),
	(1007, 4, 4, 3, '2025-11-16 08:45:00', '2023-12-28 11:20:00', 'Orthopedic consultation', 'No-Show'),
	(1008, 1, 1, 1, '2025-11-04 16:00:00', '2025-01-09 17:40:00', 'Knee pain evaluation', 'Scheduled'),
	(1009, 6, 5, 4, '2024-11-17 09:30:00', '2024-01-05 08:30:00', 'OB/GYN appointment', 'Scheduled'),
	(1010, 3, 1, 2, '2025-11-11 10:00:00', '2024-01-12 09:50:00', 'Internal medicine consultation', 'Completed'),
	(1011, 4, 7, 4, '2024-01-19 14:30:00', '2024-01-15 16:20:00', 'Dermatology screening', 'Scheduled'),
	(1012, 4, 1, 2, '2025-11-06 09:00:00', '2025-10-20 09:00:00', 'Follow-up consultation', 'In Progress'),
	(1013, 5, 1, 1, '2025-11-06 13:00:00', '2025-10-23 10:00:00', 'Vaccination', 'In Progress'),
	(1014, 1, 1, 1, '2025-11-07 16:00:00', '2025-11-03 22:34:36', 'Annual health check up ', 'Scheduled'),
	(1015, 2, 6, 1, '2025-11-10 11:00:00', '2025-11-03 22:34:36', 'Vaccination', 'Scheduled'),
	(1017, 7, 1, 1, '2025-11-10 10:00:00', '2025-11-11 01:33:01', 'Health Check-up', 'Scheduled'),
	(1018, 9, 1, 1, '2025-11-08 12:00:00', '2025-11-11 01:34:02', 'Vaccination', 'Scheduled'),
	(1019, 7, 1, 1, '2025-11-11 09:00:00', '2025-11-11 01:48:37', 'Knee pain ', 'Completed'),
	(1020, 1, 1, 1, '2025-10-29 09:00:00', '2025-10-15 14:30:00', 'Annual physical examination', 'Scheduled'),
	(1021, 2, 1, 2, '2025-10-29 10:30:00', '2025-10-16 09:15:00', 'Hypertension follow-up', 'Scheduled'),
	(1022, 3, 2, 1, '2025-10-29 14:00:00', '2025-10-17 16:45:00', 'Diabetes management', 'Scheduled'),
	(1023, 4, 3, 3, '2025-10-30 11:15:00', '2025-10-18 10:20:00', 'Pediatric wellness check', 'Scheduled'),
	(1024, 5, 4, 2, '2025-10-30 15:30:00', '2025-10-19 08:50:00', 'Cardiology follow-up', 'Scheduled'),
	(1025, 6, 5, 1, '2025-10-31 08:45:00', '2025-10-20 13:25:00', 'Dermatology screening', 'Scheduled'),
	(1026, 7, 6, 3, '2025-10-31 13:20:00', '2025-10-21 11:10:00', 'Orthopedic consultation', 'Scheduled'),
	(1027, 8, 1, 2, '2025-11-03 10:00:00', '2025-10-22 15:40:00', 'Vaccination', 'Scheduled'),
	(1028, 9, 2, 1, '2025-11-03 16:15:00', '2025-10-23 12:30:00', 'Mental health therapy', 'Scheduled'),
	(1029, 10, 3, 3, '2025-11-04 09:30:00', '2025-10-24 14:15:00', 'Prenatal checkup', 'Scheduled'),
	(1030, 11, 1, 2, '2025-11-04 14:45:00', '2025-10-25 10:05:00', 'Allergy testing', 'Scheduled'),
	(1031, 12, 2, 1, '2025-11-05 11:30:00', '2025-10-26 16:20:00', 'Sports physical', 'Scheduled'),
	(1032, 13, 3, 3, '2025-11-05 15:00:00', '2025-10-27 09:30:00', 'Eye examination', 'Scheduled'),
	(1033, 14, 4, 2, '2025-11-06 10:45:00', '2025-10-28 14:50:00', 'Nutrition counseling', 'Scheduled'),
	(1034, 15, 5, 1, '2025-11-10 13:15:00', '2025-10-29 11:25:00', 'Lab results follow-up', 'Scheduled'),
	(1035, 16, 6, 3, '2025-11-11 08:30:00', '2025-10-30 15:10:00', 'Medication review', 'Scheduled'),
	(1036, 17, 7, 2, '2025-11-12 09:00:00', '2025-11-01 10:40:00', 'Urgent care', 'Scheduled'),
	(1037, 18, 1, 1, '2025-11-12 09:15:00', '2025-11-02 13:15:00', 'Blood work', 'Completed'),
	(1038, 19, 2, 3, '2025-11-13 10:30:00', '2025-11-03 08:45:00', 'Physical therapy', 'Scheduled'),
	(1039, 20, 3, 2, '2025-11-14 14:00:00', '2025-11-04 12:20:00', 'Surgical clearance', 'Scheduled'),
	(1040, 21, 4, 4, '2025-11-17 16:45:00', '2025-11-05 14:35:00', 'Pain management', 'Scheduled'),
	(1041, 22, 2, 3, '2025-11-18 08:00:00', '2025-11-06 09:50:00', 'STD testing', 'Scheduled'),
	(1042, 23, 3, 2, '2025-11-19 11:20:00', '2025-11-07 16:25:00', 'Geriatric assessment', 'Scheduled'),
	(1043, 24, 4, 1, '2025-11-20 13:40:00', '2025-11-08 10:15:00', 'Weight management', 'Scheduled'),
	(1044, 25, 1, 2, '2025-11-21 15:00:00', '2025-11-09 08:30:00', 'Post-operative follow-up', 'Scheduled'),
	(1045, 2, 6, 1, '2025-11-12 09:00:00', '2025-11-11 07:15:31', 'Feeling Unwell', 'Scheduled'),
	(1047, 1, 2, 4, '2025-11-13 10:00:00', '2025-11-11 21:04:52', 'testing trigger for referral', 'Scheduled'),
	(1049, 4, 1, 1, '2025-11-14 09:00:00', '2025-11-12 12:12:46', 'Blood work', 'Scheduled'),
	(1050, 1, 1, 1, '2025-11-12 10:45:00', '2025-11-12 14:07:37', 'Follow-up consultation', 'In Progress'),
	(1051, 1, 7, 1, '2025-11-27 09:00:00', '2025-11-13 00:16:48', 'skin rash', 'Scheduled'),
	(1054, 1, 1, 1, '2025-11-13 15:30:00', '2025-11-13 20:33:46', 'TEST for check-in', 'Scheduled'),
	(1055, 2, 6, 1, '2026-01-27 10:00:00', '2025-11-13 22:24:16', 'Annual Checkup', 'Scheduled'),
	(1056, 1, 1, 1, '2025-11-14 12:30:00', '2025-11-14 18:25:50', 'TEST for insurance', 'Scheduled'),
	(1057, 3, 2, 1, '2025-11-14 15:30:00', '2025-11-14 21:19:24', 'Heart check up', 'Scheduled'),
	(1058, 1, 1, 1, '2025-11-17 09:00:00', '2025-11-15 11:03:22', 'TEST for check-in', 'Checked-in'),
	(1059, 8, 1, 1, '2025-11-17 09:30:00', '2025-11-15 12:12:32', 'TEST for check-in 2', 'Checked-in'),
	(1060, 5, 1, 1, '2025-11-15 12:30:00', '2025-11-14 12:30:00', 'Annual checkup', 'Completed'),
	(1061, 1, 1, 1, '2025-11-15 17:30:00', '2025-11-15 15:27:00', 'Test for waiting', 'No-Show'),
	(1063, 2, 1, 1, '2025-11-17 10:00:00', '2025-11-15 22:15:39', 'nurse test', 'Checked-in'),
	(1065, 27, 1, 1, '2025-11-17 11:00:00', '2025-11-15 23:57:47', 'Annual Checkup', 'Checked-in'),
	(1066, 27, 1, 1, '2025-11-17 08:00:00', '2025-11-16 00:24:47', 'Sick', 'Checked-in');

-- Dumping structure for table med-app-db.codes_allergies
CREATE TABLE IF NOT EXISTS `codes_allergies` (
  `allergies_code` smallint NOT NULL AUTO_INCREMENT,
  `allergies_text` varchar(50) NOT NULL,
  PRIMARY KEY (`allergies_code`)
) ENGINE=InnoDB AUTO_INCREMENT=27 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table med-app-db.codes_allergies: ~26 rows (approximately)
DELETE FROM `codes_allergies`;
INSERT INTO `codes_allergies` (`allergies_code`, `allergies_text`) VALUES
	(1, 'Penicillin'),
	(2, 'Pollen'),
	(3, 'Shellfish'),
	(4, 'Peanuts'),
	(5, 'Tree Nuts'),
	(6, 'Milk'),
	(7, 'Eggs'),
	(8, 'Wheat'),
	(9, 'Soy'),
	(10, 'Fish'),
	(11, 'Sulfonamides'),
	(12, 'Aspirin'),
	(13, 'Ibuprofen'),
	(14, 'Latex'),
	(15, 'Dust Mites'),
	(16, 'Mold'),
	(17, 'Pet Dander'),
	(18, 'Sesame'),
	(19, 'Mustard'),
	(20, 'Celery'),
	(21, 'NSAIDs'),
	(22, 'Codeine'),
	(23, 'Sulfa Drugs'),
	(24, 'Cephalosporin'),
	(25, 'No Known Allergies'),
	(26, 'Grass');

-- Dumping structure for table med-app-db.codes_assigned_at_birth_gender
CREATE TABLE IF NOT EXISTS `codes_assigned_at_birth_gender` (
  `gender_code` smallint NOT NULL AUTO_INCREMENT,
  `gender_text` varchar(30) NOT NULL,
  PRIMARY KEY (`gender_code`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table med-app-db.codes_assigned_at_birth_gender: ~5 rows (approximately)
DELETE FROM `codes_assigned_at_birth_gender`;
INSERT INTO `codes_assigned_at_birth_gender` (`gender_code`, `gender_text`) VALUES
	(1, 'Male'),
	(2, 'Female'),
	(3, 'Intersex'),
	(4, 'Not Specified'),
	(5, 'Other');

-- Dumping structure for table med-app-db.codes_ethnicity
CREATE TABLE IF NOT EXISTS `codes_ethnicity` (
  `ethnicity_code` smallint NOT NULL AUTO_INCREMENT,
  `ethnicity_text` varchar(30) NOT NULL,
  PRIMARY KEY (`ethnicity_code`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table med-app-db.codes_ethnicity: ~4 rows (approximately)
DELETE FROM `codes_ethnicity`;
INSERT INTO `codes_ethnicity` (`ethnicity_code`, `ethnicity_text`) VALUES
	(1, 'Hispanic or Latino'),
	(2, 'Non-Hispanic or Latino'),
	(3, 'Not Specified'),
	(4, 'Other');

-- Dumping structure for table med-app-db.codes_gender
CREATE TABLE IF NOT EXISTS `codes_gender` (
  `gender_code` smallint NOT NULL AUTO_INCREMENT,
  `gender_text` varchar(30) NOT NULL,
  PRIMARY KEY (`gender_code`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table med-app-db.codes_gender: ~6 rows (approximately)
DELETE FROM `codes_gender`;
INSERT INTO `codes_gender` (`gender_code`, `gender_text`) VALUES
	(1, 'Male'),
	(2, 'Female'),
	(3, 'Non-Binary'),
	(4, 'Prefer to Self-Describe'),
	(5, 'Not Specified'),
	(6, 'Other');

-- Dumping structure for table med-app-db.codes_race
CREATE TABLE IF NOT EXISTS `codes_race` (
  `race_code` smallint NOT NULL AUTO_INCREMENT,
  `race_text` varchar(50) NOT NULL,
  PRIMARY KEY (`race_code`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table med-app-db.codes_race: ~8 rows (approximately)
DELETE FROM `codes_race`;
INSERT INTO `codes_race` (`race_code`, `race_text`) VALUES
	(1, 'White'),
	(2, 'Black or African American'),
	(3, 'American Indian/Alaska Native'),
	(4, 'Asian'),
	(5, 'Native Hawaiian/Pacific Islander'),
	(6, 'Two or More Races'),
	(7, 'Not Specified'),
	(8, 'Other');

-- Dumping structure for table med-app-db.doctor
CREATE TABLE IF NOT EXISTS `doctor` (
  `doctor_id` int NOT NULL AUTO_INCREMENT,
  `staff_id` int NOT NULL,
  `specialty` int NOT NULL,
  `phone` varchar(12) DEFAULT NULL,
  PRIMARY KEY (`doctor_id`),
  UNIQUE KEY `ux_doctor_staff` (`staff_id`),
  KEY `fk_specialty` (`specialty`),
  KEY `idx_doctor_staff` (`staff_id`),
  CONSTRAINT `fk_doctor__specialty` FOREIGN KEY (`specialty`) REFERENCES `specialty` (`specialty_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_doctor__staff` FOREIGN KEY (`staff_id`) REFERENCES `staff` (`staff_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table med-app-db.doctor: ~7 rows (approximately)
DELETE FROM `doctor`;
INSERT INTO `doctor` (`doctor_id`, `staff_id`, `specialty`, `phone`) VALUES
	(1, 205, 3, '737-492-0001'),
	(2, 206, 14, '737-492-8102'),
	(3, 207, 4, '737-879-7010'),
	(4, 208, 15, '737-879-7102'),
	(5, 209, 5, '737-492-8103'),
	(6, 210, 3, '737-879-7103'),
	(7, 211, 13, '737-492-8104');

-- Dumping structure for table med-app-db.emergency_contact
CREATE TABLE IF NOT EXISTS `emergency_contact` (
  `emergency_contact_id` int NOT NULL AUTO_INCREMENT,
  `patient_id` int NOT NULL,
  `ec_first_name` varchar(30) NOT NULL,
  `ec_last_name` varchar(30) NOT NULL,
  `ec_phone` varchar(15) NOT NULL,
  `relationship` varchar(30) NOT NULL,
  PRIMARY KEY (`emergency_contact_id`),
  KEY `idx_ec_patient` (`patient_id`),
  CONSTRAINT `fk_ec__patient` FOREIGN KEY (`patient_id`) REFERENCES `patient` (`patient_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table med-app-db.emergency_contact: ~4 rows (approximately)
DELETE FROM `emergency_contact`;
INSERT INTO `emergency_contact` (`emergency_contact_id`, `patient_id`, `ec_first_name`, `ec_last_name`, `ec_phone`, `relationship`) VALUES
	(1, 10, 'Ben', 'Thomas', '5551234567', 'Father'),
	(2, 2, 'Elena', 'Orozco', '713555555', 'Friend'),
	(3, 1, 'Adam', 'Smith', '7134444444', 'Spouse'),
	(4, 27, 'Jose', 'Sanchez', '1237778888', 'Father');

-- Dumping structure for table med-app-db.insurance_payer
CREATE TABLE IF NOT EXISTS `insurance_payer` (
  `payer_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) DEFAULT NULL,
  `payer_type` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`payer_id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table med-app-db.insurance_payer: ~5 rows (approximately)
DELETE FROM `insurance_payer`;
INSERT INTO `insurance_payer` (`payer_id`, `name`, `payer_type`) VALUES
	(1, 'Blue Cross Blue Shield', 'Commercial'),
	(2, 'Aetna', 'Commercial'),
	(3, 'UnitedHealthcare', 'Commercial'),
	(4, 'Medicare', 'Government'),
	(5, 'Medicaid', 'Government');

-- Dumping structure for table med-app-db.insurance_plan
CREATE TABLE IF NOT EXISTS `insurance_plan` (
  `plan_id` int unsigned NOT NULL AUTO_INCREMENT,
  `payer_id` int DEFAULT NULL,
  `plan_name` varchar(100) DEFAULT NULL,
  `plan_type` enum('HMO','PPO','EPO','Medicare','Medicaid','Other') DEFAULT NULL,
  `network_rules` json DEFAULT NULL,
  `copay` decimal(10,2) DEFAULT NULL,
  `deductible_individual` decimal(10,2) DEFAULT NULL,
  `coinsurance_rate` decimal(5,2) DEFAULT NULL,
  PRIMARY KEY (`plan_id`),
  KEY `fk_plan_payer` (`payer_id`),
  CONSTRAINT `fk_plan_payer` FOREIGN KEY (`payer_id`) REFERENCES `insurance_payer` (`payer_id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=108 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table med-app-db.insurance_plan: ~7 rows (approximately)
DELETE FROM `insurance_plan`;
INSERT INTO `insurance_plan` (`plan_id`, `payer_id`, `plan_name`, `plan_type`, `network_rules`, `copay`, `deductible_individual`, `coinsurance_rate`) VALUES
	(101, 1, 'BCBS Gold', 'PPO', '{"requires_referral": false, "primary_care_required": false, "out_of_network_coverage": true}', 25.00, 500.00, 15.00),
	(102, 1, 'BCBS Silver', 'HMO', '{"requires_referral": true, "primary_care_required": true, "out_of_network_coverage": false}', 20.00, 1000.00, 20.00),
	(103, 2, 'Aetna Premier', 'PPO', '{"requires_referral": false, "primary_care_required": false, "out_of_network_coverage": true}', 15.00, 1500.00, 25.00),
	(104, 3, 'UHC Choice Plus', 'PPO', '{"requires_referral": false, "primary_care_required": false, "out_of_network_coverage": true}', 20.00, 2000.00, 20.00),
	(105, 4, 'Medicare Part B', 'Medicare', '{"requires_referral": false, "primary_care_required": false, "out_of_network_coverage": false}', 25.00, 240.00, 10.00),
	(106, 5, 'BCBS Silver', 'HMO', NULL, NULL, NULL, NULL),
	(107, 2, 'BCBS Gold', 'PPO', NULL, NULL, NULL, NULL);

-- Dumping structure for table med-app-db.medical_condition
CREATE TABLE IF NOT EXISTS `medical_condition` (
  `condition_id` int NOT NULL AUTO_INCREMENT,
  `patient_id` int DEFAULT NULL,
  `condition_name` varchar(100) DEFAULT NULL,
  `diagnosis_date` date DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` varchar(30) DEFAULT NULL,
  `last_updated` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `updated_by` varchar(30) DEFAULT NULL,
  PRIMARY KEY (`condition_id`),
  KEY `idx_mc_patient` (`patient_id`),
  KEY `idx_mc_condition_name` (`condition_name`),
  KEY `idx_mc_diagnosis_date` (`diagnosis_date`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table med-app-db.medical_condition: ~11 rows (approximately)
DELETE FROM `medical_condition`;
INSERT INTO `medical_condition` (`condition_id`, `patient_id`, `condition_name`, `diagnosis_date`, `created_at`, `created_by`, `last_updated`, `updated_by`) VALUES
	(1, 1, 'Hypertension', '2024-03-10', '2025-10-23 04:41:08', 'Dr. Emily Chen', '2025-10-23 04:41:08', 'Dr. Emily Chen'),
	(2, 1, 'Type 2 Diabetes', '2022-07-15', '2025-10-23 04:41:08', 'Dr. Emily Chen', '2025-10-23 04:41:08', 'Dr. Emily Chen'),
	(3, 2, 'Asthma', '2021-05-20', '2025-10-23 04:41:08', 'Dr. Susan Lee', '2025-10-23 04:41:08', 'Dr. Susan Lee'),
	(4, 2, 'Migraine', '2020-11-03', '2025-10-23 04:41:08', 'Dr. Susan Lee', '2025-10-23 04:41:08', 'Dr. Susan Lee'),
	(5, 3, 'Hyperlipidemia', '2021-01-12', '2025-10-23 04:41:08', 'Dr. Emily Chen', '2025-10-23 04:41:08', 'Dr. Emily Chen'),
	(6, 4, 'Hypothyroidism', '2023-09-08', '2025-10-23 04:41:08', 'Dr. Richard Patel', '2025-10-23 04:41:08', 'Dr. Richard Patel'),
	(7, 5, 'Osteoarthritis', '2024-12-15', '2025-10-23 04:41:08', 'Dr. James Rodriguez', '2025-10-23 04:41:08', 'Dr. James Rodriguez'),
	(8, 5, 'GERD', '2022-04-22', '2025-10-23 04:41:08', 'Dr. James Rodriguez', '2025-10-23 04:41:08', 'Dr. James Rodriguez'),
	(9, 6, 'Anxiety Disorder', '2024-08-30', '2025-10-23 04:41:08', 'Dr. Maria Garcia', '2025-10-23 04:41:08', 'Dr. Maria Garcia'),
	(10, 7, 'COPD', '2022-06-18', '2025-10-23 04:41:08', 'Dr. James Rodriguez', '2025-10-23 04:41:08', 'Dr. James Rodriguez'),
	(11, 8, 'PCOS', '2021-03-25', '2025-10-23 04:41:08', 'Dr. Susan Lee', '2025-10-23 04:41:08', 'Dr. Susan Lee');

-- Dumping structure for table med-app-db.medical_history
CREATE TABLE IF NOT EXISTS `medical_history` (
  `history_id` int NOT NULL AUTO_INCREMENT,
  `patient_id` int NOT NULL,
  `condition_name` varchar(100) NOT NULL,
  `diagnosis_date` date NOT NULL,
  PRIMARY KEY (`history_id`),
  KEY `idx_medhist_patient` (`patient_id`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table med-app-db.medical_history: ~14 rows (approximately)
DELETE FROM `medical_history`;
INSERT INTO `medical_history` (`history_id`, `patient_id`, `condition_name`, `diagnosis_date`) VALUES
	(1, 1, 'Hypertension', '2021-03-10'),
	(2, 1, 'Type 2 Diabetes', '2019-07-15'),
	(3, 2, 'Asthma', '2022-05-20'),
	(4, 2, 'Migraine', '2021-11-03'),
	(5, 3, 'Hyperlipidemia', '2020-01-12'),
	(6, 4, 'Hypothyroidism', '2019-09-08'),
	(7, 5, 'Osteoarthritis', '2016-12-15'),
	(8, 5, 'GERD', '2019-04-22'),
	(9, 6, 'Anxiety Disorder', '2020-08-30'),
	(10, 7, 'COPD', '2014-06-18'),
	(11, 8, 'PCOS', '2018-03-25'),
	(12, 1, 'Appendectomy', '2020-08-12'),
	(13, 3, 'Tonsillectomy', '2025-03-22'),
	(14, 7, 'Knee Replacement', '2024-11-05');

-- Dumping structure for table med-app-db.medication_history
CREATE TABLE IF NOT EXISTS `medication_history` (
  `drug_id` int NOT NULL AUTO_INCREMENT,
  `patient_id` int NOT NULL,
  `drug_name` varchar(100) NOT NULL,
  `duration_and_frequency_of_drug_use` varchar(150) DEFAULT NULL,
  PRIMARY KEY (`drug_id`),
  KEY `idx_medhist_patient` (`patient_id`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table med-app-db.medication_history: ~13 rows (approximately)
DELETE FROM `medication_history`;
INSERT INTO `medication_history` (`drug_id`, `patient_id`, `drug_name`, `duration_and_frequency_of_drug_use`) VALUES
	(1, 1, 'Lisinopril 10mg', 'Once daily since August 2020'),
	(2, 1, 'Metformin 500mg', 'Twice daily since December 2023'),
	(3, 2, 'Albuterol Inhaler', 'As needed since November 2024'),
	(4, 2, 'Sumatriptan 50mg', 'As needed for migraines since March 2018'),
	(5, 3, 'Atorvastatin 20mg', 'Once daily since June 2021'),
	(6, 4, 'Levothyroxine 75mcg', 'Once daily since May 2017'),
	(7, 5, 'Ibuprofen 600mg', 'Three times daily as needed since June 2012'),
	(8, 5, 'Omeprazole 20mg', 'Once daily since May 2021'),
	(9, 6, 'Sertraline 50mg', 'Once daily since August 2020'),
	(10, 7, 'Spiriva HandiHaler', 'Once daily since September 2024'),
	(11, 7, 'Albuterol Nebulizer', 'Four times daily since Feburary 2021'),
	(12, 8, 'Metformin 1000mg', 'Twice daily since January 2022'),
	(13, 8, 'Drospirenone/Ethinyl Estradiol', 'Once daily since March 2025');

-- Dumping structure for table med-app-db.nurse
CREATE TABLE IF NOT EXISTS `nurse` (
  `nurse_id` int NOT NULL AUTO_INCREMENT,
  `staff_id` int DEFAULT NULL,
  `department` varchar(30) DEFAULT NULL,
  PRIMARY KEY (`nurse_id`),
  KEY `idx_nurse_staff` (`staff_id`),
  CONSTRAINT `fk_nurse__staff` FOREIGN KEY (`staff_id`) REFERENCES `staff` (`staff_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table med-app-db.nurse: ~5 rows (approximately)
DELETE FROM `nurse`;
INSERT INTO `nurse` (`nurse_id`, `staff_id`, `department`) VALUES
	(1, 101, 'Emergency'),
	(2, 102, 'ICU'),
	(3, 103, 'Pediatrics'),
	(4, 104, 'Orthopedics'),
	(5, 105, 'Cardiology'),
	(6, 106, 'General');

-- Dumping structure for table med-app-db.office
CREATE TABLE IF NOT EXISTS `office` (
  `office_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(30) NOT NULL,
  `city` varchar(30) NOT NULL,
  `state` varchar(20) NOT NULL,
  `address` varchar(50) NOT NULL,
  `zipcode` varchar(10) NOT NULL,
  `dept_count` int DEFAULT NULL,
  `phone` varchar(15) NOT NULL,
  PRIMARY KEY (`office_id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table med-app-db.office: ~4 rows (approximately)
DELETE FROM `office`;
INSERT INTO `office` (`office_id`, `name`, `city`, `state`, `address`, `zipcode`, `dept_count`, `phone`) VALUES
	(1, 'Downtown Medical Center', 'Houston', 'TX', '425 Main Street, Suite 100', '77002', 6, '7374928165'),
	(2, 'Westside Family Clinic', 'Houston', 'TX', '8920 Katy Freeway, Building B', '77024', 5, '7378797156'),
	(3, 'Memorial Park Healthcare', 'Houston', 'TX', '1550 Memorial Drive', '77007', 4, '713-555-0103'),
	(4, 'Galleria Medical Plaza', 'Houston', 'TX', '5085 Westheimer Road, Floor 3', '77056', 5, '713-555-0104');

-- Dumping structure for table med-app-db.patient
CREATE TABLE IF NOT EXISTS `patient` (
  `patient_id` int NOT NULL AUTO_INCREMENT,
  `first_name` varchar(30) NOT NULL,
  `last_name` varchar(30) NOT NULL,
  `dob` date NOT NULL,
  `ssn` varchar(11) NOT NULL,
  `assigned_at_birth_gender` smallint NOT NULL,
  `gender` smallint DEFAULT NULL,
  `ethnicity` smallint DEFAULT NULL,
  `race` smallint DEFAULT NULL,
  `email` varchar(254) DEFAULT NULL,
  `emergency_contact_id` int DEFAULT NULL,
  `primary_doctor` int DEFAULT NULL,
  `specialty_doctor` int DEFAULT NULL,
  `insurance_id` int unsigned DEFAULT NULL,
  `insurance_provider` int unsigned DEFAULT NULL,
  `prescription` int DEFAULT NULL,
  `allergies` smallint DEFAULT NULL,
  `blood_type` enum('A+','A-','B+','B-','AB+','AB-','O+','O-') DEFAULT NULL,
  PRIMARY KEY (`patient_id`),
  UNIQUE KEY `uq_patient_ssn` (`ssn`),
  KEY `idx_patient_name` (`last_name`,`first_name`),
  KEY `fk_patient__aab_gender` (`assigned_at_birth_gender`),
  KEY `fk_patient__gender` (`gender`),
  KEY `fk_patient__ethnicity` (`ethnicity`),
  KEY `fk_patient__race` (`race`),
  KEY `fk_patient__allergies` (`allergies`),
  KEY `fk_patient__primary_doctor` (`primary_doctor`),
  KEY `fk_patient__specialty_doctor` (`specialty_doctor`),
  KEY `fk_patient__insurance_plan` (`insurance_provider`),
  KEY `fk_patient__insurance_record` (`insurance_id`),
  KEY `fk_patient__emergency_contact` (`emergency_contact_id`),
  CONSTRAINT `fk_patient__aab_gender` FOREIGN KEY (`assigned_at_birth_gender`) REFERENCES `codes_assigned_at_birth_gender` (`gender_code`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_patient__allergies` FOREIGN KEY (`allergies`) REFERENCES `codes_allergies` (`allergies_code`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_patient__emergency_contact` FOREIGN KEY (`emergency_contact_id`) REFERENCES `emergency_contact` (`emergency_contact_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_patient__ethnicity` FOREIGN KEY (`ethnicity`) REFERENCES `codes_ethnicity` (`ethnicity_code`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_patient__gender` FOREIGN KEY (`gender`) REFERENCES `codes_gender` (`gender_code`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_patient__insurance_plan` FOREIGN KEY (`insurance_provider`) REFERENCES `insurance_plan` (`plan_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_patient__insurance_record` FOREIGN KEY (`insurance_id`) REFERENCES `patient_insurance` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_patient__primary_doctor` FOREIGN KEY (`primary_doctor`) REFERENCES `doctor` (`doctor_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_patient__race` FOREIGN KEY (`race`) REFERENCES `codes_race` (`race_code`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_patient__specialty_doctor` FOREIGN KEY (`specialty_doctor`) REFERENCES `doctor` (`doctor_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=28 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table med-app-db.patient: ~27 rows (approximately)
DELETE FROM `patient`;
INSERT INTO `patient` (`patient_id`, `first_name`, `last_name`, `dob`, `ssn`, `assigned_at_birth_gender`, `gender`, `ethnicity`, `race`, `email`, `emergency_contact_id`, `primary_doctor`, `specialty_doctor`, `insurance_id`, `insurance_provider`, `prescription`, `allergies`, `blood_type`) VALUES
	(1, 'John', 'Smith', '1985-03-15', '123-45-6789', 1, 1, 2, 1, 'john.smith@email.com', 3, 1, NULL, 1, 101, NULL, 1, 'O+'),
	(2, 'Maria', 'Garcia', '2020-07-22', '123-45-6790', 2, 2, 1, 2, 'maria.garcia@email.com', 2, 1, NULL, 2, 102, NULL, 20, 'A+'),
	(3, 'David', 'Johnson', '1992-11-30', '123-45-6791', 1, 1, 2, 1, 'david.johnson@email.com', NULL, 2, NULL, 3, 105, NULL, 3, 'B+'),
	(4, 'Sarah', 'Williams', '1980-05-14', '123-45-6792', 2, 2, 2, 1, 'sarah.williams@email.com', NULL, 3, NULL, 4, 103, NULL, 2, 'AB-'),
	(5, 'Michael', 'Brown', '1975-09-08', '123-45-6793', 1, 1, 2, 2, 'michael.brown@email.com', NULL, 4, NULL, 5, 104, NULL, 7, 'O-'),
	(6, 'Jennifer', 'Davis', '1988-12-25', '123-45-6794', 2, 2, 2, 1, 'jennifer.davis@email.com', NULL, 5, NULL, 6, 101, NULL, 18, 'A-'),
	(7, 'Robert', 'Miller', '1965-02-18', '123-45-6795', 1, 1, 2, 1, 'robert.miller@email.com', NULL, 6, NULL, 7, 105, NULL, 2, 'B-'),
	(8, 'Lisa', 'Wilson', '1990-08-11', '123-45-6796', 2, 2, 1, 3, 'lisa.wilson@email.com', NULL, 1, NULL, 8, 102, NULL, 5, 'AB+'),
	(9, 'Emaad', 'Rahman', '2000-02-01', '123-49-6512', 1, 1, NULL, NULL, 'emaad980@gmail.com', NULL, 2, NULL, 9, NULL, NULL, 11, NULL),
	(10, 'Kathiana', 'Rodriguez', '2003-01-03', 'TEMP0000010', 2, 2, 1, 1, 'kathiana119@gmail.com', NULL, 3, NULL, 10, NULL, NULL, 22, NULL),
	(11, 'Bartholomew', 'Fitzgerald', '1972-04-18', '476-78-9012', 1, 1, 1, 1, 'bart.fitz@email.com', NULL, 1, NULL, 11, NULL, NULL, 12, 'A+'),
	(12, 'Guinevere', 'Pembroke', '1985-11-03', '565-89-0123', 2, 2, 1, 1, 'g.pembroke@email.com', NULL, 2, NULL, 12, NULL, NULL, 11, 'B+'),
	(13, 'Theodore', 'Montgomery', '1968-07-22', '670-90-1234', 1, 1, 1, 1, 'ted.montgomery@email.com', NULL, 3, NULL, 13, NULL, NULL, 14, 'O+'),
	(14, 'Seraphina', 'Whitaker', '1991-02-14', '719-01-2345', 2, 2, 1, 1, 'sera.whitaker@email.com', NULL, 4, NULL, 14, NULL, NULL, 22, 'AB-'),
	(15, 'Percival', 'Harrington', '1979-09-08', '870-12-3456', 1, 1, 1, 1, 'percy.h@email.com', NULL, 5, NULL, 15, NULL, NULL, 21, 'A-'),
	(16, 'Lysandra', 'Blackwood', '1988-12-25', '931-23-4567', 2, 2, 1, 1, 'lysandra.b@email.com', NULL, 6, NULL, 16, NULL, NULL, 24, 'O-'),
	(17, 'Alistair', 'Kensington', '1965-05-30', '212-34-5678', 1, 1, 1, 1, 'alistair.k@email.com', NULL, 7, NULL, 17, NULL, NULL, 19, 'B+'),
	(18, 'Gwendolyn', 'Ashworth', '1993-08-11', '128-45-6789', 2, 2, 1, 1, 'gwen.ashworth@email.com', NULL, 1, NULL, 18, NULL, NULL, 12, 'A+'),
	(19, 'Phineas', 'Worthington', '1977-01-19', '234-56-7890', 1, 1, 1, 1, 'phineas.w@email.com', NULL, 2, NULL, 19, NULL, NULL, 10, 'O+'),
	(20, 'Cordelia', 'Fairchild', '1983-06-07', '345-67-8901', 2, 2, 1, 1, 'cordelia.f@email.com', NULL, 3, NULL, 20, NULL, NULL, 15, 'B-'),
	(21, 'Benedict', 'Kingsley', '1990-03-26', '456-88-9012', 1, 1, 1, 1, 'ben.kingsley@email.com', NULL, 4, NULL, 21, NULL, NULL, 6, 'AB+'),
	(22, 'Octavia', 'Rutherford', '1974-10-13', '569-89-0123', 2, 2, 1, 1, 'octavia.r@email.com', NULL, 2, NULL, 22, NULL, NULL, 9, 'A+'),
	(23, 'Sebastian', 'Hawthorne', '1986-12-09', '688-90-1234', 1, 1, 1, 1, 'seb.hawthorne@email.com', NULL, 3, NULL, 23, NULL, NULL, 14, 'O-'),
	(24, 'Persephone', 'Vance', '1995-07-04', '799-01-2345', 2, 2, 1, 1, 'persephone.v@email.com', NULL, 4, NULL, 24, NULL, NULL, 13, 'B+'),
	(25, 'Atticus', 'Pemberton', '1969-04-21', '890-12-7456', 1, 1, 1, 1, 'atticus.p@email.com', NULL, 1, NULL, 25, NULL, NULL, 1, 'A-'),
	(26, 'Nin', 'Li', '2002-06-05', '123-45-8123', 4, 4, NULL, NULL, 'niuli@gmail.com', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
	(27, 'Jennifer', 'Sanchez', '1995-08-05', 'TEMP0000212', 2, 2, NULL, NULL, 'jennifer.sanchez@email.com', NULL, 1, NULL, 45, NULL, NULL, NULL, NULL);

-- Dumping structure for table med-app-db.patient_insurance
CREATE TABLE IF NOT EXISTS `patient_insurance` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `patient_id` int NOT NULL,
  `plan_id` int unsigned NOT NULL,
  `member_id` varchar(64) DEFAULT NULL,
  `group_id` varchar(64) DEFAULT NULL,
  `effective_date` date NOT NULL,
  `expiration_date` date DEFAULT NULL,
  `is_primary` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `ux_patient_plan_member` (`patient_id`,`plan_id`,`member_id`),
  KEY `idx_pi_patient` (`patient_id`),
  KEY `idx_pi_plan` (`plan_id`),
  KEY `idx_pi_patient_dates` (`patient_id`,`effective_date`,`expiration_date`),
  CONSTRAINT `fk_pi_patient` FOREIGN KEY (`patient_id`) REFERENCES `patient` (`patient_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_pi_plan` FOREIGN KEY (`plan_id`) REFERENCES `insurance_plan` (`plan_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `chk_pi_dates` CHECK (((`expiration_date` is null) or (`effective_date` <= `expiration_date`)))
) ENGINE=InnoDB AUTO_INCREMENT=46 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table med-app-db.patient_insurance: ~26 rows (approximately)
DELETE FROM `patient_insurance`;
INSERT INTO `patient_insurance` (`id`, `patient_id`, `plan_id`, `member_id`, `group_id`, `effective_date`, `expiration_date`, `is_primary`) VALUES
	(1, 1, 101, 'M123456789', 'G987654', '2024-01-01', '2025-12-31', 1),
	(2, 2, 102, 'M123456790', 'G987655', '2024-03-01', '2025-11-20', 1),
	(3, 3, 105, 'M123456791', 'G987658', '2024-06-01', '2025-12-31', 1),
	(4, 4, 103, 'M123456792', 'G987656', '2024-02-15', '2025-12-31', 1),
	(5, 5, 104, 'M123456793', 'G987657', '2024-01-01', '2025-12-31', 1),
	(6, 6, 101, 'M123456794', 'G987659', '2024-01-01', '2025-12-31', 1),
	(7, 7, 105, 'M123456795', 'G987660', '2024-06-01', '2025-12-31', 1),
	(8, 8, 102, 'M123456796', 'G987661', '2024-03-01', '2025-12-31', 1),
	(9, 9, 101, 'BCBSG00112345A', 'GRP800123', '2024-01-01', '2025-12-31', 1),
	(10, 10, 101, 'BCBSG00112346B', 'GRP800123', '2024-01-01', '2025-12-31', 1),
	(11, 11, 101, 'BCBSG00112347C', 'GRP800124', '2024-01-01', '2025-12-31', 1),
	(12, 12, 101, 'BCBSG00112348D', 'GRP800125', '2024-01-01', '2025-12-31', 1),
	(13, 13, 102, 'BCBSS00212345A', 'GRP900123', '2024-01-01', '2025-12-31', 1),
	(14, 14, 102, 'BCBSS00212346B', 'GRP900123', '2024-01-01', '2025-12-31', 1),
	(15, 15, 102, 'BCBSS00212347C', 'GRP900124', '2024-01-01', '2025-12-31', 1),
	(16, 16, 102, 'BCBSS00212348D', 'GRP900125', '2024-01-01', '2025-12-31', 1),
	(17, 17, 103, 'AETNA00312345A', 'GRP700123', '2024-01-01', '2025-12-31', 1),
	(18, 18, 103, 'AETNA00312346B', 'GRP700123', '2024-01-01', '2025-12-31', 1),
	(19, 19, 103, 'AETNA00312347C', 'GRP700124', '2024-01-01', '2025-12-31', 1),
	(20, 20, 103, 'AETNA00312348D', 'GRP700125', '2024-01-01', '2025-12-31', 1),
	(21, 21, 104, 'UHC00412345A', 'GRP600123', '2024-01-01', '2025-12-31', 1),
	(22, 22, 104, 'UHC00412346B', 'GRP600123', '2024-01-01', '2025-12-31', 1),
	(23, 23, 104, 'UHC00412347C', 'GRP600124', '2024-01-01', '2025-12-31', 1),
	(24, 24, 104, 'UHC00412348D', 'GRP600125', '2024-01-01', '2025-12-31', 1),
	(25, 25, 105, 'MCR00512345A', 'GRP600123', '2024-01-01', '2025-12-31', 1),
	(45, 27, 101, 'M123456790', 'G987654', '2023-08-25', '2025-11-30', 1);

-- Dumping structure for table med-app-db.patient_visit
CREATE TABLE IF NOT EXISTS `patient_visit` (
  `visit_id` int NOT NULL AUTO_INCREMENT,
  `appointment_id` int DEFAULT NULL,
  `patient_id` int NOT NULL,
  `office_id` int DEFAULT NULL,
  `date` datetime DEFAULT NULL,
  `blood_pressure` varchar(7) DEFAULT NULL,
  `doctor_id` int DEFAULT NULL,
  `nurse_id` int DEFAULT NULL,
  `status` enum('Scheduled','Completed','Canceled','No-Show') DEFAULT 'Scheduled',
  `diagnosis` varchar(500) DEFAULT NULL,
  `reason_for_visit` varchar(300) DEFAULT NULL,
  `department` varchar(50) DEFAULT NULL,
  `payment` decimal(15,2) DEFAULT NULL,
  `payment_method` enum('cash','card','check') DEFAULT NULL,
  `copay_amount_due` decimal(15,2) DEFAULT NULL,
  `treatment_cost_due` decimal(15,2) DEFAULT NULL,
  `consent_to_treatment` tinyint(1) DEFAULT NULL,
  `present_illnesses` varchar(500) DEFAULT NULL,
  `temperature` decimal(4,1) DEFAULT NULL,
  `start_at` datetime DEFAULT NULL,
  `end_at` datetime DEFAULT NULL,
  `insurance_policy_id_used` int unsigned DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` varchar(30) DEFAULT NULL,
  `last_updated` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `updated_by` varchar(30) DEFAULT NULL,
  PRIMARY KEY (`visit_id`),
  KEY `idx_pv_patient` (`patient_id`),
  KEY `idx_pv_doctor` (`doctor_id`),
  KEY `idx_pv_nurse` (`nurse_id`),
  KEY `idx_pv_office` (`office_id`),
  KEY `idx_pv_appt` (`appointment_id`),
  KEY `idx_pv_date` (`date`),
  KEY `idx_pv_start_end` (`start_at`,`end_at`),
  KEY `fk_pv__insurance_used` (`insurance_policy_id_used`),
  CONSTRAINT `fk_pv__appt` FOREIGN KEY (`appointment_id`) REFERENCES `appointment` (`appointment_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_pv__doctor` FOREIGN KEY (`doctor_id`) REFERENCES `doctor` (`doctor_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_pv__insurance_used` FOREIGN KEY (`insurance_policy_id_used`) REFERENCES `patient_insurance` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_pv__nurse` FOREIGN KEY (`nurse_id`) REFERENCES `nurse` (`nurse_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_pv__office` FOREIGN KEY (`office_id`) REFERENCES `office` (`office_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_pv__patient` FOREIGN KEY (`patient_id`) REFERENCES `patient` (`patient_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `chk_pv_copay` CHECK (((`copay_amount_due` is null) or (`copay_amount_due` >= 0))),
  CONSTRAINT `chk_pv_payment` CHECK (((`payment` is null) or (`payment` >= 0))),
  CONSTRAINT `chk_pv_times` CHECK (((`end_at` is null) or (`start_at` is null) or (`start_at` <= `end_at`))),
  CONSTRAINT `chk_pv_treatment_cost` CHECK (((`treatment_cost_due` is null) or (`treatment_cost_due` >= 0)))
) ENGINE=InnoDB AUTO_INCREMENT=49 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table med-app-db.patient_visit: ~34 rows (approximately)
DELETE FROM `patient_visit`;
INSERT INTO `patient_visit` (`visit_id`, `appointment_id`, `patient_id`, `office_id`, `date`, `blood_pressure`, `doctor_id`, `nurse_id`, `status`, `diagnosis`, `reason_for_visit`, `department`, `payment`, `payment_method`, `copay_amount_due`, `treatment_cost_due`, `consent_to_treatment`, `present_illnesses`, `temperature`, `start_at`, `end_at`, `insurance_policy_id_used`, `created_at`, `created_by`, `last_updated`, `updated_by`) VALUES
	(1, 1001, 1, 1, '2025-11-15 09:00:00', '120/80', 1, 1, 'Completed', '["Hypertension", "Type 2 Diabetes"]', 'Annual physical examination', 'Internal Medicine', NULL, NULL, 25.00, 125.00, 1, 'Stable condition', 98.6, '2024-01-15 09:00:00', '2024-01-15 09:45:00', 1, '2025-10-23 04:41:08', 'Dr. Emily Chen', '2025-11-15 22:26:39', 'Dr. Emily Chen'),
	(2, 1002, 3, 3, '2025-11-16 14:00:00', '118/76', 1, 2, 'Completed', '["Hyperlipidemia"]', 'Follow-up consultation', 'Internal Medicine', 15.00, NULL, 15.00, 105.00, 1, 'Elevated cholesterol levels', 98.4, '2024-01-16 14:00:00', '2024-01-16 14:30:00', 3, '2025-10-23 04:41:08', 'Dr. Emily Chen', '2025-11-15 22:26:39', 'Dr. Emily Chen'),
	(5, 1014, 1, 1, '2025-11-07 12:00:00', '120/80', 1, 1, 'Scheduled', 'flu', NULL, NULL, 25.00, 'cash', 25.00, 230.00, NULL, 'cough', 99.2, '2025-11-07 12:00:00', NULL, 1, '2025-11-07 18:06:42', NULL, '2025-11-10 23:12:44', 'Daniel Thompson'),
	(6, 1049, 1, 1, NULL, '100/90', 1, 6, 'Scheduled', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Elevated cholesterol levels', 100.0, NULL, NULL, 4, '2025-11-14 09:00:00', NULL, '2025-11-15 22:26:39', 'tnguyen@medconnect.com'),
	(15, 1013, 5, 1, '2025-11-03 10:30:00', '120/80', 1, 1, 'Scheduled', '["Mild Severity", "Flu"]', 'Fever and cough', 'Internal Medicine', 50.00, NULL, 25.00, 180.00, 1, 'Cough, fever', 99.5, '2025-10-24 10:30:00', '2025-10-24 11:00:00', 5, '2025-10-25 04:21:57', 'nurse.jane', '2025-11-15 22:26:39', NULL),
	(16, 1004, 5, 1, '2025-11-04 01:15:00', '130/80', 1, 2, 'Scheduled', NULL, NULL, 'Internal Medicine', NULL, NULL, NULL, NULL, NULL, 'None', 99.0, '2025-10-24 01:30:00', NULL, 5, '2025-10-24 01:10:00', NULL, '2025-11-15 22:26:39', NULL),
	(17, NULL, 2, 3, '2025-11-25 02:15:00', '120/80', 3, 1, 'Scheduled', '["Migraine"]', 'Migraines', 'Internal Medicine', 20.00, NULL, 20.00, 50.00, 1, 'Stable condition', NULL, NULL, NULL, 2, '2025-11-06 06:17:07', NULL, '2025-11-15 22:26:39', NULL),
	(18, 1002, 3, 1, '2025-11-12 14:00:00', NULL, NULL, 6, 'Scheduled', NULL, NULL, 'General', NULL, NULL, 25.00, NULL, NULL, 'None', NULL, '2025-11-12 14:00:00', NULL, 3, '2025-11-06 20:09:25', NULL, '2025-11-15 22:26:39', NULL),
	(19, 1010, 3, 2, '2025-11-11 10:00:00', NULL, NULL, 6, 'Scheduled', NULL, NULL, 'General', NULL, NULL, 25.00, NULL, NULL, 'Stable condition', NULL, '2025-11-11 10:00:00', NULL, 3, '2025-11-06 20:09:25', NULL, '2025-11-15 22:26:39', NULL),
	(20, 1020, 1, 1, '2025-10-29 09:00:00', '118/76', 1, 1, 'Completed', 'Hypertension controlled, overall health good', 'Annual physical examination', 'Internal Medicine', 25.00, 'card', 25.00, 150.00, 1, 'Routine checkup, no current complaints', 98.6, '2025-10-29 09:00:00', '2025-10-29 09:45:00', 1, '2025-11-12 17:15:35', 'Nurse Sarah', '2025-11-12 17:15:35', 'Dr. Smith'),
	(21, 1021, 2, 2, '2025-10-29 10:30:00', '132/84', 1, 2, 'Completed', 'Hypertension stage 1, medication adjustment needed', 'Hypertension follow-up', 'Internal Medicine', 20.00, 'card', 20.00, 120.00, 1, 'Occasional headaches, fatigue', 98.4, '2025-10-29 10:30:00', '2025-10-29 11:15:00', 2, '2025-11-12 17:15:35', 'Nurse Jane', '2025-11-12 17:15:35', 'Dr. Smith'),
	(22, 1022, 3, 1, '2025-10-29 14:00:00', '122/78', 2, 1, 'Completed', 'Type 2 Diabetes, glucose levels stable', 'Diabetes management', 'Endocrinology', 15.00, 'card', 15.00, 95.00, 1, 'Increased thirst, stable weight', 98.2, '2025-10-29 14:00:00', '2025-10-29 14:40:00', 3, '2025-11-12 17:15:35', 'Nurse Sarah', '2025-11-12 17:15:35', 'Dr. Johnson'),
	(23, 1023, 4, 3, '2025-10-30 11:15:00', '110/70', 3, 3, 'Completed', 'Healthy pediatric development', 'Pediatric wellness check', 'Pediatrics', 25.00, 'card', 25.00, 180.00, 1, 'Routine wellness check, vaccinations up to date', 99.1, '2025-10-30 11:15:00', '2025-10-30 12:00:00', 4, '2025-11-12 17:15:35', 'Nurse Mike', '2025-11-12 17:15:35', 'Dr. Williams'),
	(24, 1024, 5, 2, '2025-10-30 15:30:00', '128/82', 4, 2, 'Completed', 'Stable cardiac function, continue current medication', 'Cardiology follow-up', 'Cardiology', 25.00, 'card', 25.00, 200.00, 1, 'Mild chest discomfort with exertion', 98.6, '2025-10-30 15:30:00', '2025-10-30 16:20:00', 5, '2025-11-12 17:15:35', 'Nurse Jane', '2025-11-12 17:15:35', 'Dr. Brown'),
	(25, 1025, 6, 1, '2025-10-31 08:45:00', '116/74', 5, 1, 'Completed', 'Benign skin lesion, no treatment required', 'Dermatology screening', 'Dermatology', 20.00, 'card', 20.00, 160.00, 1, 'Mole check, no changes noted', 98.4, '2025-10-31 08:45:00', '2025-10-31 09:30:00', 6, '2025-11-12 17:15:35', 'Nurse Sarah', '2025-11-12 17:15:35', 'Dr. Davis'),
	(26, 1026, 7, 3, '2025-10-31 13:20:00', '124/80', 6, 3, 'Completed', 'Mild osteoarthritis, recommend physical therapy', 'Orthopedic consultation', 'Orthopedics', 25.00, 'card', 25.00, 220.00, 1, 'Knee pain with stairs and prolonged walking', 98.8, '2025-10-31 13:20:00', '2025-10-31 14:15:00', 7, '2025-11-12 17:15:35', 'Nurse Mike', '2025-11-12 17:15:35', 'Dr. Miller'),
	(27, 1027, 8, 2, '2025-11-03 10:00:00', '118/76', 1, 2, 'Completed', 'Influenza vaccination administered', 'Vaccination', 'Primary Care', 0.00, NULL, 0.00, 85.00, 1, 'Seasonal flu prevention', 98.6, '2025-11-03 10:00:00', '2025-11-03 10:25:00', 8, '2025-11-12 17:15:35', 'Nurse Jane', '2025-11-12 17:15:35', 'Dr. Smith'),
	(28, 1028, 9, 1, '2025-11-03 16:15:00', '130/82', 2, 1, 'Completed', 'Generalized anxiety disorder, therapy session completed', 'Mental health therapy', 'Psychiatry', 20.00, 'card', 20.00, 150.00, 1, 'Anxiety symptoms improved with current treatment', 98.4, '2025-11-03 16:15:00', '2025-11-03 17:00:00', 9, '2025-11-12 17:15:35', 'Nurse Sarah', '2025-11-12 17:15:35', 'Dr. Wilson'),
	(29, 1029, 10, 3, '2025-11-04 09:30:00', '112/68', 3, 3, 'Completed', 'Normal fetal development, 28 weeks gestation', 'Prenatal checkup', 'Obstetrics', 25.00, 'card', 25.00, 195.00, 1, 'Normal pregnancy, mild back pain', 98.9, '2025-11-04 09:30:00', '2025-11-04 10:20:00', 10, '2025-11-12 17:15:35', 'Nurse Mike', '2025-11-12 17:15:35', 'Dr. Garcia'),
	(30, 1030, 11, 2, '2025-11-04 14:45:00', '120/78', 1, 2, 'Completed', 'Seasonal allergies confirmed, prescription provided', 'Allergy testing', 'Allergy/Immunology', 15.00, 'card', 15.00, 125.00, 1, 'Sneezing, itchy eyes during spring season', 98.6, '2025-11-04 14:45:00', '2025-11-04 15:30:00', 11, '2025-11-12 17:15:35', 'Nurse Jane', '2025-11-12 17:15:35', 'Dr. Smith'),
	(31, 1031, 12, 1, '2025-11-05 11:30:00', '126/80', 2, 1, 'Completed', 'Cleared for sports participation', 'Sports physical', 'Primary Care', 20.00, 'cash', 20.00, 110.00, 1, 'Healthy adolescent, no limitations', 98.7, '2025-11-05 11:30:00', '2025-11-05 12:00:00', 12, '2025-11-12 17:15:35', 'Nurse Sarah', '2025-11-12 17:15:35', 'Dr. Wilson'),
	(32, 1032, 13, 3, '2025-11-05 15:00:00', '118/74', 3, 3, 'Completed', 'Mild myopia, prescription updated', 'Eye examination', 'Ophthalmology', 25.00, 'card', 25.00, 185.00, 1, 'Blurry distance vision', 98.4, '2025-11-05 15:00:00', '2025-11-05 15:50:00', 13, '2025-11-12 17:15:35', 'Nurse Mike', '2025-11-12 17:15:35', 'Dr. Martinez'),
	(33, 1033, 14, 2, '2025-11-06 10:45:00', '122/78', 4, 2, 'Completed', 'Nutritional assessment completed, diet plan provided', 'Nutrition counseling', 'Nutrition', 20.00, 'card', 20.00, 140.00, 1, 'Weight management goals', 98.6, '2025-11-06 10:45:00', '2025-11-06 11:30:00', 14, '2025-11-12 17:15:35', 'Nurse Jane', '2025-11-12 17:15:35', 'Dr. Taylor'),
	(34, 1012, 4, 2, '2025-11-06 09:00:00', '128/82', 1, 1, 'Completed', 'Upper respiratory infection, antibiotics prescribed', 'Follow-up consultation', 'Internal Medicine', 20.00, 'card', 20.00, 120.00, 1, 'Cough, congestion, low-grade fever', 99.2, '2025-11-06 09:00:00', '2025-11-06 09:45:00', 4, '2025-11-12 17:15:35', 'Nurse Sarah', '2025-11-12 17:15:35', 'Dr. Smith'),
	(35, 1013, 5, 1, '2025-11-06 13:00:00', '118/76', 1, 2, 'Completed', 'Tetanus booster administered', 'Vaccination', 'Primary Care', 0.00, NULL, 0.00, 75.00, 1, 'Routine immunization update', 98.8, '2025-11-06 13:00:00', '2025-11-06 13:20:00', 5, '2025-11-12 17:15:35', 'Nurse Jane', '2025-11-12 17:15:35', 'Dr. Smith'),
	(36, 1036, 17, 2, '2025-11-12 09:00:00', '138/88', 7, 3, 'Completed', 'Acute sinusitis, antibiotic treatment started', 'Urgent care', 'Urgent Care', 25.00, 'card', 25.00, 180.00, 1, 'Facial pain, nasal congestion, headache', 100.2, '2025-11-12 09:00:00', '2025-11-12 09:50:00', 17, '2025-11-12 17:15:35', 'Nurse Mike', '2025-11-12 17:15:35', 'Dr. Anderson'),
	(37, 1037, 18, 1, '2025-11-12 09:15:00', '120/78', 1, 1, 'Completed', 'Blood work completed, results pending', 'Blood work', 'Laboratory', 15.00, 'card', 15.00, 95.00, 1, 'Routine blood panel ordered', 98.6, '2025-11-12 09:15:00', '2025-11-12 09:45:00', 18, '2025-11-12 17:15:35', 'Nurse Sarah', '2025-11-12 17:15:35', 'Dr. Smith'),
	(38, 1050, 1, 1, '2025-11-12 10:45:00', '124/80', 1, 2, 'Completed', 'Hypertension well-controlled with current medication', 'Follow-up consultation', 'Internal Medicine', 25.00, 'card', 25.00, 130.00, 1, 'Stable blood pressure readings at home', 98.4, '2025-11-12 10:45:00', '2025-11-12 11:20:00', 1, '2025-11-12 17:15:35', 'Nurse Jane', '2025-11-12 17:15:35', 'Dr. Smith'),
	(39, 1059, 8, 1, NULL, NULL, 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-11-15 12:12:46', NULL, 8, '2025-11-15 12:12:46', NULL, '2025-11-15 12:12:46', NULL),
	(41, 1060, 5, 1, '2025-11-15 16:45:00', '81/100', 1, 6, 'Scheduled', 'alcohol poisoning', NULL, NULL, NULL, NULL, NULL, 215.00, NULL, 'dizziness', 98.6, NULL, NULL, 5, '2025-11-15 20:43:19', NULL, '2025-11-15 22:26:39', 'Emily Chen'),
	(45, 1063, 2, 1, NULL, NULL, 1, 6, 'Scheduled', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-11-15 22:26:54', NULL, 2, '2025-11-15 22:26:54', NULL, '2025-11-15 23:19:55', NULL),
	(46, 1065, 27, 1, NULL, '75/40', 1, 6, 'Scheduled', 'Sick', NULL, NULL, NULL, NULL, NULL, 215.00, NULL, 'Checkup', 95.0, '2025-11-15 23:58:12', NULL, 45, '2025-11-15 23:58:12', NULL, '2025-11-16 00:02:52', 'Emily Chen'),
	(47, 1066, 27, 1, NULL, NULL, 1, 6, 'Scheduled', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-11-16 01:11:58', NULL, 45, '2025-11-16 01:11:58', NULL, '2025-11-16 01:11:58', NULL),
	(48, 1058, 1, 1, NULL, NULL, 1, 6, 'Scheduled', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-11-16 21:54:05', NULL, 1, '2025-11-16 21:54:05', NULL, '2025-11-16 21:54:05', NULL);

-- Dumping structure for table med-app-db.prescription
CREATE TABLE IF NOT EXISTS `prescription` (
  `prescription_id` int NOT NULL AUTO_INCREMENT,
  `patient_id` int NOT NULL,
  `doctor_id` int NOT NULL,
  `appointment_id` int DEFAULT NULL,
  `medication_name` varchar(100) NOT NULL,
  `dosage` varchar(50) DEFAULT NULL,
  `frequency` varchar(50) DEFAULT NULL,
  `route` varchar(50) DEFAULT NULL,
  `start_date` date NOT NULL,
  `end_date` date DEFAULT NULL,
  `refills_allowed` tinyint DEFAULT NULL,
  `notes` varchar(255) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`prescription_id`),
  KEY `idx_rx_patient` (`patient_id`),
  KEY `idx_rx_doctor` (`doctor_id`),
  KEY `idx_rx_appt` (`appointment_id`),
  CONSTRAINT `fk_rx__appointment` FOREIGN KEY (`appointment_id`) REFERENCES `appointment` (`appointment_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_rx__doctor` FOREIGN KEY (`doctor_id`) REFERENCES `doctor` (`doctor_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_rx__patient` FOREIGN KEY (`patient_id`) REFERENCES `patient` (`patient_id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table med-app-db.prescription: ~5 rows (approximately)
DELETE FROM `prescription`;
INSERT INTO `prescription` (`prescription_id`, `patient_id`, `doctor_id`, `appointment_id`, `medication_name`, `dosage`, `frequency`, `route`, `start_date`, `end_date`, `refills_allowed`, `notes`, `created_at`) VALUES
	(1, 1, 1, 1001, 'Lisinopril', '10mg', 'Once daily', 'Oral', '2025-01-15', '2025-11-01', 11, 'For hypertension control', '2025-10-23 04:41:08'),
	(2, 1, 1, 1001, 'Metformin', '500mg', 'Twice daily', 'Oral', '2024-05-19', NULL, 11, 'For diabetes management', '2025-10-23 04:41:08'),
	(3, 3, 1, 1002, 'Atorvastatin', '20mg', 'Once daily', 'Oral', '2024-01-16', NULL, 6, 'For cholesterol management', '2025-10-23 04:41:08'),
	(4, 5, 2, 1003, 'Ibuprofen', '600mg', 'Three times daily as needed', 'Oral', '2025-06-15', '2024-10-15', 2, 'For osteoarthritis pain', '2025-10-23 04:41:08'),
	(5, 6, 5, 1009, 'Sertraline', '50mg', 'Once daily', 'Oral', '2024-11-17', NULL, 6, 'For anxiety management', '2025-10-23 04:41:08'),
	(6, 1, 1, 1014, 'medication test', '200', '2', 'Oral', '2025-11-08', '2025-11-10', 1, 'none', '2025-11-08 01:44:24');

-- Dumping structure for procedure med-app-db.RecalculateAllVisitCosts
DELIMITER //
CREATE PROCEDURE `RecalculateAllVisitCosts`()
BEGIN
    UPDATE patient_visit pv
    SET treatment_cost_due = (
        SELECT COALESCE(SUM(tpv.total_cost), 0) 
        FROM treatment_per_visit tpv 
        WHERE tpv.visit_id = pv.visit_id
    ) - COALESCE(pv.copay_amount_due, 0)
    WHERE pv.status = 'Completed';
END//
DELIMITER ;

-- Dumping structure for table med-app-db.referral
CREATE TABLE IF NOT EXISTS `referral` (
  `referral_id` int NOT NULL AUTO_INCREMENT,
  `patient_id` int NOT NULL,
  `date_of_approval` date DEFAULT NULL,
  `referring_doctor_staff_id` int DEFAULT NULL,
  `specialist_doctor_staff_id` int DEFAULT NULL,
  `reason` varchar(300) DEFAULT NULL,
  `appointment_id` int DEFAULT NULL,
  PRIMARY KEY (`referral_id`),
  KEY `idx_ref_patient` (`patient_id`),
  KEY `idx_ref_refdoc` (`referring_doctor_staff_id`),
  KEY `idx_ref_specdoc` (`specialist_doctor_staff_id`),
  KEY `idx_ref_appt` (`appointment_id`),
  CONSTRAINT `fk_ref__appointment` FOREIGN KEY (`appointment_id`) REFERENCES `appointment` (`appointment_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_ref__patient` FOREIGN KEY (`patient_id`) REFERENCES `patient` (`patient_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_ref__referring_doctor` FOREIGN KEY (`referring_doctor_staff_id`) REFERENCES `doctor` (`doctor_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_ref__specialist_doctor` FOREIGN KEY (`specialist_doctor_staff_id`) REFERENCES `doctor` (`doctor_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table med-app-db.referral: ~9 rows (approximately)
DELETE FROM `referral`;
INSERT INTO `referral` (`referral_id`, `patient_id`, `date_of_approval`, `referring_doctor_staff_id`, `specialist_doctor_staff_id`, `reason`, `appointment_id`) VALUES
	(1, 5, NULL, 2, 4, 'Orthopedic consultation for knee pain', 1008),
	(2, 1, '2025-10-25', 1, 7, 'Dermatology screening for skin rash', NULL),
	(3, 4, '2025-10-16', 4, 2, 'Cardiology evaluation for chest pain', NULL),
	(4, 1, NULL, 1, 2, 'Heart check ', NULL),
	(5, 3, NULL, 1, 1, 'test', NULL),
	(6, 3, '2025-11-04', 1, 2, 'heart test', NULL),
	(7, 5, '2025-11-04', 2, 1, 'internal test', NULL),
	(8, 1, '2025-11-04', 1, 2, 'heart', NULL),
	(9, 2, '2025-11-13', 6, 2, 'heart check', NULL);

-- Dumping structure for table med-app-db.responsible_party
CREATE TABLE IF NOT EXISTS `responsible_party` (
  `responsible_party_id` int NOT NULL AUTO_INCREMENT,
  `first_name` varchar(30) NOT NULL,
  `last_name` varchar(30) NOT NULL,
  `apartment_no` varchar(10) DEFAULT NULL,
  `building_no` varchar(10) DEFAULT NULL,
  `state` varchar(20) NOT NULL,
  `zipcode` varchar(10) NOT NULL,
  `city` varchar(30) NOT NULL,
  `responsible_party_pn` varchar(20) NOT NULL,
  PRIMARY KEY (`responsible_party_id`),
  KEY `idx_resp_party_name` (`last_name`,`first_name`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table med-app-db.responsible_party: ~3 rows (approximately)
DELETE FROM `responsible_party`;
INSERT INTO `responsible_party` (`responsible_party_id`, `first_name`, `last_name`, `apartment_no`, `building_no`, `state`, `zipcode`, `city`, `responsible_party_pn`) VALUES
	(1, 'Robert', 'Smith', 'A', '1', 'TX', '77002', 'Houston', '555-2001'),
	(2, 'Carlos', 'Garcia', 'B', '2', 'TX', '77024', 'Houston', '555-2002'),
	(3, 'Susan', 'Johnson', NULL, '3', 'TX', '77007', 'Houston', '555-2003');

-- Dumping structure for table med-app-db.sessions
CREATE TABLE IF NOT EXISTS `sessions` (
  `session_id` varchar(128) NOT NULL,
  `session_data` text,
  `last_access` int unsigned NOT NULL,
  PRIMARY KEY (`session_id`),
  KEY `idx_last_access` (`last_access`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table med-app-db.sessions: ~7 rows (approximately)
DELETE FROM `sessions`;
INSERT INTO `sessions` (`session_id`, `session_data`, `last_access`) VALUES
	('04a72c2e07990815e683ef9631631a04', 'uid|i:1;email|s:20:"john.smith@email.com";role|s:7:"PATIENT";username|s:9:"johnsmith";first_name|s:4:"John";last_name|s:5:"Smith";patient_id|i:1;', 1763323231),
	('09f5808d8703f8abe22e980e81aa08d4', 'uid|i:204;email|s:25:"d.thompson@medconnect.com";role|s:12:"RECEPTIONIST";username|s:4:"r501";first_name|s:6:"Daniel";last_name|s:8:"Thompson";', 1763340204),
	('270d7858e0fde8a5a6780559ae89d88b', '', 1763340222),
	('31fca110f2511f33d03cff92683fa165', 'uid|i:1;email|s:20:"john.smith@email.com";role|s:7:"PATIENT";username|s:9:"johnsmith";first_name|s:4:"John";last_name|s:5:"Smith";patient_id|i:1;', 1763332013),
	('529da3c9af7222d0eab4db62a38ab985', '', 1763319787),
	('5b649839eaae581d00dd653f27796411', '', 1763260231),
	('aa4da5787a4891660d68a1560901f29c', '', 1763319786),
	('ee3a01974647af2068a76fb57fc54d19', 'uid|i:201;email|s:23:"a.wilson@medconnect.com";role|s:5:"ADMIN";username|s:4:"a401";first_name|s:6:"Amanda";last_name|s:6:"Wilson";', 1763339910);

-- Dumping structure for table med-app-db.specialty
CREATE TABLE IF NOT EXISTS `specialty` (
  `specialty_id` int NOT NULL AUTO_INCREMENT,
  `specialty_name` varchar(100) NOT NULL,
  PRIMARY KEY (`specialty_id`),
  UNIQUE KEY `ux_specialty_name` (`specialty_name`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table med-app-db.specialty: ~18 rows (approximately)
DELETE FROM `specialty`;
INSERT INTO `specialty` (`specialty_id`, `specialty_name`) VALUES
	(1, 'Family Medicine'),
	(2, 'General Practice'),
	(3, 'Internal Medicine'),
	(4, 'Pediatrics'),
	(5, 'Obstetrics and Gynecology'),
	(6, 'General Dentistry'),
	(7, 'Nursing'),
	(8, 'Physician Assistant'),
	(9, 'Nurse Practitioner'),
	(10, 'Urgent Care'),
	(11, 'Preventive Medicine'),
	(12, 'Mental Health Counseling'),
	(13, 'Dermatology'),
	(14, 'Cardiology'),
	(15, 'Orthopedics'),
	(16, 'Physical Therapy'),
	(17, 'Nutrition and Dietetics'),
	(18, 'Pharmacy');

-- Dumping structure for table med-app-db.staff
CREATE TABLE IF NOT EXISTS `staff` (
  `staff_id` int NOT NULL AUTO_INCREMENT,
  `first_name` varchar(30) NOT NULL,
  `last_name` varchar(30) NOT NULL,
  `ssn` varchar(11) NOT NULL,
  `gender` smallint NOT NULL,
  `staff_email` varchar(50) NOT NULL,
  `staff_role` varchar(20) NOT NULL,
  `license_number` varchar(30) DEFAULT NULL,
  PRIMARY KEY (`staff_id`),
  UNIQUE KEY `ssn` (`ssn`),
  UNIQUE KEY `staff_email` (`staff_email`),
  KEY `idx_staff_gender` (`gender`),
  CONSTRAINT `fk_staff__gender` FOREIGN KEY (`gender`) REFERENCES `codes_gender` (`gender_code`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=212 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table med-app-db.staff: ~16 rows (approximately)
DELETE FROM `staff`;
INSERT INTO `staff` (`staff_id`, `first_name`, `last_name`, `ssn`, `gender`, `staff_email`, `staff_role`, `license_number`) VALUES
	(101, 'Jennifer', 'Taylor', '987-65-4326', 2, 'j.taylor@medconnect.com', 'Nurse', 'RN123456'),
	(102, 'Michael', 'Chen', '987-65-4327', 1, 'm.chen@medconnect.com', 'Nurse', 'RN123457'),
	(103, 'Sarah', 'Rodriguez', '987-65-4328', 2, 's.rodriguez@medconnect.com', 'Nurse', 'RN123458'),
	(104, 'David', 'Anderson', '987-65-4329', 1, 'd.anderson@medconnect.com', 'Nurse', 'RN123459'),
	(105, 'Lisa', 'Martinez', '987-65-4330', 2, 'l.martinez@medconnect.com', 'Nurse', 'RN123460'),
	(106, 'Tina', 'Nguyen', '987-65-4335', 2, 'tnguyen@medconnect.com', 'Nurse', 'RN123461'),
	(201, 'Amanda', 'Wilson', '987-65-4331', 2, 'a.wilson@medconnect.com', 'Administrator', NULL),
	(202, 'Christopher', 'Lee', '987-65-4332', 1, 'c.lee@medconnect.com', 'Receptionist', NULL),
	(204, 'Daniel', 'Thompson', '987-65-4334', 1, 'd.thompson@medconnect.com', 'Receptionist', 'RTT123456'),
	(205, 'Emily', 'Chen', '123-45-6781', 2, 'echen@medconnect.com', 'Doctor', 'TXMD123456'),
	(206, 'James', 'Rodriguez', '123-45-6782', 1, 'jrodriguez@medconnect.com', 'Doctor', 'TXMD123457'),
	(207, 'Susan', 'Lee', '123-45-6783', 2, 'slee@medconnect.com', 'Doctor', 'TXMD123458'),
	(208, 'Richard', 'Patel', '123-45-6784', 1, 'rpatel@medconnect.com', 'Doctor', 'TXMD123459'),
	(209, 'Maria', 'Garcia', '123-45-6785', 2, 'mgarcia@medconnect.com', 'Doctor', 'TXMD123460'),
	(210, 'David', 'Kim', '123-45-6786', 1, 'dkim@medconnect.com', 'Doctor', 'TXMD123461'),
	(211, 'Lisa', 'Wong', '123-45-6787', 2, 'lwong@medconnect.com', 'Doctor', 'TXMD123462');

-- Dumping structure for table med-app-db.treatment_catalog
CREATE TABLE IF NOT EXISTS `treatment_catalog` (
  `treatment_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `cpt_code` varchar(10) DEFAULT NULL,
  `cost` decimal(10,2) DEFAULT NULL,
  `specialty` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`treatment_id`)
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table med-app-db.treatment_catalog: ~23 rows (approximately)
DELETE FROM `treatment_catalog`;
INSERT INTO `treatment_catalog` (`treatment_id`, `name`, `cpt_code`, `cost`, `specialty`) VALUES
	(1, 'Office Visit - Established (15 min)', '99213', 125.00, 'Internal Medicine'),
	(2, 'Office Visit - Established (25 min)', '99214', 175.00, 'Internal Medicine'),
	(3, 'Office Visit - Established (40 min)', '99215', 225.00, 'Internal Medicine'),
	(4, 'Office Visit - New Patient (30 min)', '99203', 200.00, 'Internal Medicine'),
	(5, 'Office Visit - New Patient (45 min)', '99204', 275.00, 'Internal Medicine'),
	(6, 'Annual Physical - Under 40', '99395', 185.00, 'Internal Medicine'),
	(7, 'Annual Physical - 40-64 years', '99396', 215.00, 'Internal Medicine'),
	(8, 'Annual Physical - 65+ years', '99397', 245.00, 'Internal Medicine'),
	(9, 'EKG - 12 Lead', '93000', 85.00, 'Internal Medicine'),
	(10, 'Pulmonary Function Test', '94010', 120.00, 'Internal Medicine'),
	(11, 'Ear Wax Removal', '69210', 75.00, 'Internal Medicine'),
	(12, 'Wart Removal - Single', '17110', 95.00, 'Internal Medicine'),
	(13, 'Vitamin B12 Injection', '96372', 25.00, 'Internal Medicine'),
	(14, 'Corticosteroid Injection', '96372', 35.00, 'Internal Medicine'),
	(15, 'Flu Vaccine Administration', '90471', 25.00, 'Internal Medicine'),
	(16, 'Tetanus Shot Administration', '90471', 25.00, 'Internal Medicine'),
	(17, 'Rapid Flu Test', '87804', 55.00, 'Internal Medicine'),
	(18, 'Urinalysis - Dipstick', '81002', 25.00, 'Internal Medicine'),
	(19, 'Blood Glucose Test', '82947', 15.00, 'Internal Medicine'),
	(20, 'Diabetes Education', 'G0108', 85.00, 'Internal Medicine'),
	(21, 'Smoking Cessation Counseling', '99406', 65.00, 'Internal Medicine'),
	(22, 'Wound Care - Simple', '12001', 125.00, 'Internal Medicine'),
	(23, 'Ingrown Toenail Removal', '11750', 90.00, 'Internal Medicine');

-- Dumping structure for table med-app-db.treatment_per_visit
CREATE TABLE IF NOT EXISTS `treatment_per_visit` (
  `visit_treatment_id` int NOT NULL AUTO_INCREMENT,
  `visit_id` int NOT NULL,
  `treatment_id` int NOT NULL,
  `quantity` int DEFAULT '1',
  `cost_each` decimal(10,2) DEFAULT NULL,
  `total_cost` decimal(10,2) GENERATED ALWAYS AS ((`quantity` * `cost_each`)) STORED,
  `notes` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`visit_treatment_id`),
  KEY `fk_vt_visit` (`visit_id`),
  KEY `fk_vt_treatment` (`treatment_id`),
  CONSTRAINT `fk_vt_treatment` FOREIGN KEY (`treatment_id`) REFERENCES `treatment_catalog` (`treatment_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_vt_visit` FOREIGN KEY (`visit_id`) REFERENCES `patient_visit` (`visit_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=36 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table med-app-db.treatment_per_visit: ~13 rows (approximately)
DELETE FROM `treatment_per_visit`;
INSERT INTO `treatment_per_visit` (`visit_treatment_id`, `visit_id`, `treatment_id`, `quantity`, `cost_each`, `notes`) VALUES
	(1, 1, 6, 1, 215.00, 'Annual physical for established patient'),
	(2, 1, 16, 1, 35.00, 'Routine A1c monitoring'),
	(3, 1, 17, 1, 15.00, 'Fasting glucose check'),
	(4, 2, 1, 1, 125.00, 'Follow-up for cholesterol management'),
	(5, 2, 18, 1, 65.00, 'Lipid panel ordered'),
	(9, 15, 1, 1, 125.00, 'Sick visit for flu symptoms'),
	(10, 15, 19, 1, 55.00, 'Rapid influenza test'),
	(11, 15, 21, 1, 25.00, 'Symptomatic relief'),
	(12, 16, 1, 1, 125.00, 'Routine follow-up'),
	(31, 5, 7, 1, 215.00, ''),
	(32, 5, 19, 1, 15.00, ''),
	(33, 6, 19, 1, 15.00, ''),
	(34, 41, 7, 1, 215.00, ''),
	(35, 46, 7, 1, 215.00, '');

-- Dumping structure for table med-app-db.user_account
CREATE TABLE IF NOT EXISTS `user_account` (
  `user_id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `email` varchar(254) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('ADMIN','DOCTOR','NURSE','PATIENT','RECEPTIONIST') DEFAULT NULL,
  `mfa_enabled` tinyint(1) NOT NULL DEFAULT '0',
  `last_login_at` datetime DEFAULT NULL,
  `failed_login_count` smallint unsigned NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`) USING BTREE,
  UNIQUE KEY `ux_user_username` (`username`),
  UNIQUE KEY `ux_user_email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=213 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table med-app-db.user_account: ~12 rows (approximately)
DELETE FROM `user_account`;
INSERT INTO `user_account` (`user_id`, `username`, `email`, `password_hash`, `role`, `mfa_enabled`, `last_login_at`, `failed_login_count`, `is_active`, `created_at`, `updated_at`) VALUES
	(1, 'p101', 'john.smith@email.com', '$2y$12$mvBaL8ar53TL1LXEbqK4eeVOa8jPs922vF3dVcWRRR36uP0Dvhqx2', 'PATIENT', 0, '2025-11-16 22:26:14', 0, 1, '2025-10-22 04:54:59', '2025-11-16 22:26:14'),
	(2, 'p102', 'maria.garcia@email.com', '$2y$12$mvBaL8ar53TL1LXEbqK4eeVOa8jPs922vF3dVcWRRR36uP0Dvhqx2', 'PATIENT', 0, '2025-11-16 00:19:50', 0, 1, '2025-10-28 18:50:06', '2025-11-16 00:19:50'),
	(9, 'emaad980', 'emaad980@gmail.com', '$2y$12$Cs7Vap7sWXRfkbcjniOAU.P6I2oKa81asl1qPEYS0Ih8uEiz0o1s2', 'PATIENT', 0, '2025-11-01 20:39:30', 0, 1, '2025-11-01 20:27:29', '2025-11-08 22:34:42'),
	(10, 'kathiana119', 'kathiana119@gmail.com', '$2y$12$g34AFS8Sjji2SLi.EvTltevK991t6CfDs4QNMg0cevjgxWgHMy.cO', 'PATIENT', 0, '2025-11-04 00:25:55', 0, 1, '2025-11-04 00:25:39', '2025-11-08 22:34:42'),
	(106, 'n301', 'tnguyen@medconnect.com', '$2y$12$mvBaL8ar53TL1LXEbqK4eeVOa8jPs922vF3dVcWRRR36uP0Dvhqx2', 'NURSE', 0, '2025-11-16 21:31:14', 0, 1, '2025-10-23 14:54:01', '2025-11-16 21:31:14'),
	(201, 'a401', 'a.wilson@medconnect.com', '$2y$12$mvBaL8ar53TL1LXEbqK4eeVOa8jPs922vF3dVcWRRR36uP0Dvhqx2', 'ADMIN', 0, '2025-11-17 00:38:22', 0, 1, '2025-10-25 14:54:01', '2025-11-17 00:38:22'),
	(204, 'r501', 'd.thompson@medconnect.com', '$2y$12$mvBaL8ar53TL1LXEbqK4eeVOa8jPs922vF3dVcWRRR36uP0Dvhqx2', 'RECEPTIONIST', 0, '2025-11-17 00:13:12', 0, 1, '2025-11-06 00:39:39', '2025-11-17 00:13:12'),
	(205, 'd201', 'echen@medconnect.com', '$2y$12$mvBaL8ar53TL1LXEbqK4eeVOa8jPs922vF3dVcWRRR36uP0Dvhqx2', 'DOCTOR', 0, '2025-11-16 22:24:49', 0, 1, '2025-10-22 04:54:59', '2025-11-16 22:24:49'),
	(206, 'd202', 'jrodriguez@medconnect.com', '$2y$12$mvBaL8ar53TL1LXEbqK4eeVOa8jPs922vF3dVcWRRR36uP0Dvhqx2', 'DOCTOR', 0, '2025-11-04 20:36:49', 0, 1, '2025-11-04 00:25:39', '2025-11-08 22:34:41'),
	(210, 'd203', 'dkim@medconnect.com', '$2y$12$mvBaL8ar53TL1LXEbqK4eeVOa8jPs922vF3dVcWRRR36uP0Dvhqx2', 'DOCTOR', 0, '2025-11-13 01:16:11', 0, 1, '2025-11-04 00:25:39', '2025-11-13 01:16:11'),
	(211, 'niuli', 'niuli@gmail.com', '$2y$12$AnvqG02Ud6Jk33wyrXqlLe2VHHAXrA8WcOImdkIxN6F.4K.Nppwx.', 'PATIENT', 0, '2025-11-15 21:20:23', 0, 1, '2025-11-15 21:17:43', '2025-11-15 21:20:23'),
	(212, 'jennifer.sanchez', 'jennifer.sanchez@email.com', '$2y$12$xkkRT2Jnip7FKQ2HuT4hY.VTN2i/89QhPDwgHb3X7f4AlfNkAAK/q', 'PATIENT', 0, '2025-11-16 00:22:35', 0, 1, '2025-11-15 22:37:20', '2025-11-16 00:22:35');

-- Dumping structure for table med-app-db.user_account_backup
CREATE TABLE IF NOT EXISTS `user_account_backup` (
  `my_row_id` bigint unsigned NOT NULL AUTO_INCREMENT /*!80023 INVISIBLE */,
  `user_id` int unsigned NOT NULL DEFAULT '0',
  `username` varchar(50) NOT NULL,
  `email` varchar(254) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('ADMIN','DOCTOR','NURSE','PATIENT','RECEPTIONIST') DEFAULT NULL,
  `mfa_enabled` tinyint(1) NOT NULL DEFAULT '0',
  `last_login_at` datetime DEFAULT NULL,
  `failed_login_count` smallint unsigned NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`my_row_id`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table med-app-db.user_account_backup: ~9 rows (approximately)
DELETE FROM `user_account_backup`;
INSERT INTO `user_account_backup` (`user_id`, `username`, `email`, `password_hash`, `role`, `mfa_enabled`, `last_login_at`, `failed_login_count`, `is_active`, `created_at`, `updated_at`) VALUES
	(1, 'p101', 'john.smith@email.com', '$2y$12$mvBaL8ar53TL1LXEbqK4eeVOa8jPs922vF3dVcWRRR36uP0Dvhqx2', 'PATIENT', 0, '2025-11-06 04:27:37', 0, 1, '2025-10-22 04:54:59', '2025-10-22 04:54:59'),
	(2, 'd201', 'echen@medconnect.com', '$2y$12$mvBaL8ar53TL1LXEbqK4eeVOa8jPs922vF3dVcWRRR36uP0Dvhqx2', 'DOCTOR', 0, '2025-11-06 20:51:27', 0, 1, '2025-10-22 04:54:59', '2025-10-22 04:54:59'),
	(3, 'n301', 'tnguyen@medconnect.com', '$2y$12$mvBaL8ar53TL1LXEbqK4eeVOa8jPs922vF3dVcWRRR36uP0Dvhqx2', 'NURSE', 0, '2025-11-06 20:39:42', 0, 1, '2025-10-23 14:54:01', '2025-10-23 14:54:01'),
	(4, 'a401', 'a.wilson@medconnect.com', '$2y$12$mvBaL8ar53TL1LXEbqK4eeVOa8jPs922vF3dVcWRRR36uP0Dvhqx2', 'ADMIN', 0, '2025-11-06 20:42:18', 0, 1, '2025-10-25 14:54:01', '2025-10-25 14:54:01'),
	(5, 'p102', 'maria.garcia@email.com', '$2y$12$mvBaL8ar53TL1LXEbqK4eeVOa8jPs922vF3dVcWRRR36uP0Dvhqx2', 'PATIENT', 0, '2025-11-06 20:58:42', 0, 1, '2025-10-28 18:50:06', '2025-10-28 18:50:06'),
	(6, 'd202', 'jrodriguez@medconnect.com', '$2y$12$mvBaL8ar53TL1LXEbqK4eeVOa8jPs922vF3dVcWRRR36uP0Dvhqx2', 'DOCTOR', 0, '2025-11-04 20:36:49', 0, 1, '2025-11-04 00:25:39', '2025-11-04 00:25:39'),
	(9, 'emaad980', 'emaad980@gmail.com', '$2y$12$Cs7Vap7sWXRfkbcjniOAU.P6I2oKa81asl1qPEYS0Ih8uEiz0o1s2', 'PATIENT', 0, '2025-11-01 20:39:30', 0, 1, '2025-11-01 20:27:29', '2025-11-08 21:50:14'),
	(10, 'kathiana119', 'kathiana119@gmail.com', '$2y$12$g34AFS8Sjji2SLi.EvTltevK991t6CfDs4QNMg0cevjgxWgHMy.cO', 'PATIENT', 0, '2025-11-04 00:25:55', 0, 1, '2025-11-04 00:25:39', '2025-11-04 00:25:39'),
	(11, 'r501', 'd.thompson@medconnect.com', '$2y$12$mvBaL8ar53TL1LXEbqK4eeVOa8jPs922vF3dVcWRRR36uP0Dvhqx2', 'RECEPTIONIST', 0, '2025-11-06 21:24:50', 0, 1, '2025-11-06 00:39:39', '2025-11-06 00:39:39');

-- Dumping structure for table med-app-db.vaccination_history
CREATE TABLE IF NOT EXISTS `vaccination_history` (
  `vaccination_id` int NOT NULL AUTO_INCREMENT,
  `patient_id` int NOT NULL,
  `vaccination_name` varchar(100) NOT NULL,
  `date_of_vaccination` date NOT NULL,
  `date_for_booster` date DEFAULT NULL,
  PRIMARY KEY (`vaccination_id`),
  KEY `idx_vaxhist_patient` (`patient_id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table med-app-db.vaccination_history: ~9 rows (approximately)
DELETE FROM `vaccination_history`;
INSERT INTO `vaccination_history` (`vaccination_id`, `patient_id`, `vaccination_name`, `date_of_vaccination`, `date_for_booster`) VALUES
	(1, 1, 'Influenza Vaccine', '2023-10-15', '2024-10-15'),
	(2, 1, 'COVID-19 Bivalent', '2023-11-20', '2024-11-20'),
	(3, 2, 'Influenza Vaccine', '2023-10-20', '2024-10-20'),
	(4, 3, 'Tetanus Booster', '2022-05-10', '2032-05-10'),
	(5, 4, 'Influenza Vaccine', '2023-10-25', '2024-10-25'),
	(6, 5, 'Shingles Vaccine', '2023-09-15', NULL),
	(7, 6, 'HPV Vaccine', '2023-08-10', '2024-02-10'),
	(8, 7, 'Pneumococcal Vaccine', '2023-07-20', NULL),
	(9, 8, 'Influenza Vaccine', '2023-10-30', '2024-10-30');

-- Dumping structure for table med-app-db.work_schedule
CREATE TABLE IF NOT EXISTS `work_schedule` (
  `schedule_id` int NOT NULL AUTO_INCREMENT,
  `office_id` int NOT NULL,
  `staff_id` int DEFAULT NULL,
  `days` date DEFAULT NULL,
  `start_time` time DEFAULT NULL,
  `end_time` time DEFAULT NULL,
  `day_of_week` enum('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday') DEFAULT NULL,
  PRIMARY KEY (`schedule_id`),
  KEY `idx_ws_office` (`office_id`),
  KEY `idx_ws_staff` (`staff_id`),
  KEY `idx_ws_daydate` (`day_of_week`,`days`),
  CONSTRAINT `fk_wsin__office` FOREIGN KEY (`office_id`) REFERENCES `office` (`office_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `chk_ws_times` CHECK (((`end_time` is null) or (`start_time` is null) or (`start_time` <= `end_time`)))
) ENGINE=InnoDB AUTO_INCREMENT=288 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table med-app-db.work_schedule: ~88 rows (approximately)
DELETE FROM `work_schedule`;
INSERT INTO `work_schedule` (`schedule_id`, `office_id`, `staff_id`, `days`, `start_time`, `end_time`, `day_of_week`) VALUES
	(1, 1, 205, NULL, '08:00:00', '16:00:00', 'Monday'),
	(2, 1, 205, NULL, '08:00:00', '16:00:00', 'Wednesday'),
	(3, 1, 205, NULL, '08:00:00', '16:00:00', 'Friday'),
	(4, 2, 205, NULL, '09:00:00', '17:00:00', 'Tuesday'),
	(5, 2, 205, NULL, '09:00:00', '17:00:00', 'Thursday'),
	(6, 1, 206, NULL, '09:00:00', '17:00:00', 'Tuesday'),
	(7, 1, 206, NULL, '09:00:00', '17:00:00', 'Thursday'),
	(8, 3, 206, NULL, '08:00:00', '16:00:00', 'Monday'),
	(9, 3, 206, NULL, '08:00:00', '16:00:00', 'Wednesday'),
	(10, 3, 206, NULL, '08:00:00', '16:00:00', 'Friday'),
	(11, 2, 207, NULL, '10:00:00', '18:00:00', 'Monday'),
	(12, 2, 207, NULL, '10:00:00', '18:00:00', 'Wednesday'),
	(13, 2, 207, NULL, '10:00:00', '18:00:00', 'Friday'),
	(14, 4, 207, NULL, '08:00:00', '16:00:00', 'Tuesday'),
	(15, 4, 207, NULL, '08:00:00', '16:00:00', 'Thursday'),
	(16, 3, 208, NULL, '07:00:00', '15:00:00', 'Tuesday'),
	(17, 3, 208, NULL, '07:00:00', '15:00:00', 'Thursday'),
	(18, 4, 208, NULL, '09:00:00', '17:00:00', 'Monday'),
	(19, 4, 208, NULL, '09:00:00', '17:00:00', 'Wednesday'),
	(20, 4, 208, NULL, '09:00:00', '17:00:00', 'Friday'),
	(21, 1, 209, NULL, '07:00:00', '15:00:00', 'Monday'),
	(22, 1, 209, NULL, '07:00:00', '15:00:00', 'Wednesday'),
	(23, 4, 209, NULL, '08:00:00', '16:00:00', 'Tuesday'),
	(24, 4, 209, NULL, '08:00:00', '16:00:00', 'Thursday'),
	(25, 4, 209, NULL, '08:00:00', '12:00:00', 'Friday'),
	(26, 2, 210, NULL, '07:00:00', '15:00:00', 'Tuesday'),
	(27, 2, 210, NULL, '07:00:00', '15:00:00', 'Thursday'),
	(28, 3, 210, NULL, '10:00:00', '18:00:00', 'Monday'),
	(29, 3, 210, NULL, '10:00:00', '18:00:00', 'Wednesday'),
	(30, 3, 210, NULL, '10:00:00', '18:00:00', 'Friday'),
	(31, 1, 211, NULL, '09:00:00', '17:00:00', 'Thursday'),
	(32, 2, 211, NULL, '09:00:00', '17:00:00', 'Monday'),
	(33, 2, 211, NULL, '09:00:00', '17:00:00', 'Wednesday'),
	(34, 3, 211, NULL, '09:00:00', '17:00:00', 'Tuesday'),
	(35, 3, 211, NULL, '09:00:00', '17:00:00', 'Friday'),
	(36, 1, 201, NULL, '08:00:00', '16:00:00', 'Monday'),
	(37, 1, 201, NULL, '08:00:00', '16:00:00', 'Tuesday'),
	(38, 1, 201, NULL, '08:00:00', '16:00:00', 'Wednesday'),
	(39, 1, 201, NULL, '08:00:00', '16:00:00', 'Thursday'),
	(40, 1, 201, NULL, '08:00:00', '16:00:00', 'Friday'),
	(41, 2, 202, NULL, '09:00:00', '17:00:00', 'Monday'),
	(42, 1, 202, NULL, '09:00:00', '17:00:00', 'Tuesday'),
	(43, 2, 202, NULL, '09:00:00', '17:00:00', 'Wednesday'),
	(44, 2, 202, NULL, '09:00:00', '17:00:00', 'Thursday'),
	(45, 2, 202, NULL, '09:00:00', '17:00:00', 'Friday'),
	(46, 1, 204, NULL, '08:30:00', '16:30:00', 'Monday'),
	(47, 1, 204, NULL, '08:30:00', '16:30:00', 'Tuesday'),
	(48, 1, 204, NULL, '08:30:00', '16:30:00', 'Wednesday'),
	(49, 1, 204, NULL, '08:30:00', '16:30:00', 'Thursday'),
	(50, 1, 204, NULL, '08:30:00', '16:30:00', 'Friday'),
	(248, 1, 106, NULL, '08:00:00', '16:00:00', 'Monday'),
	(249, 1, 106, NULL, '08:00:00', '16:00:00', 'Tuesday'),
	(250, 1, 106, NULL, '08:00:00', '16:00:00', 'Wednesday'),
	(251, 1, 106, NULL, '08:00:00', '16:00:00', 'Thursday'),
	(252, 1, 106, NULL, '08:00:00', '16:00:00', 'Friday'),
	(253, 4, 101, NULL, '08:30:00', '16:30:00', 'Monday'),
	(254, 4, 101, NULL, '08:30:00', '16:30:00', 'Tuesday'),
	(255, 4, 101, NULL, '08:30:00', '16:30:00', 'Wednesday'),
	(256, 4, 101, NULL, '08:30:00', '16:30:00', 'Thursday'),
	(257, 3, 101, NULL, '08:30:00', '16:30:00', 'Friday'),
	(258, 3, 102, NULL, '08:30:00', '16:30:00', 'Monday'),
	(259, 3, 102, NULL, '08:30:00', '16:30:00', 'Tuesday'),
	(260, 3, 102, NULL, '08:30:00', '16:30:00', 'Wednesday'),
	(261, 3, 102, NULL, '08:30:00', '16:30:00', 'Thursday'),
	(262, 3, 102, NULL, '08:30:00', '16:30:00', 'Friday'),
	(263, 2, 103, NULL, '08:30:00', '16:30:00', 'Monday'),
	(264, 2, 103, NULL, '08:30:00', '16:30:00', 'Tuesday'),
	(265, 2, 103, NULL, '08:30:00', '16:30:00', 'Wednesday'),
	(266, 2, 103, NULL, '08:30:00', '16:30:00', 'Thursday'),
	(267, 2, 103, NULL, '08:30:00', '16:30:00', 'Friday'),
	(268, 1, 104, NULL, '08:30:00', '16:30:00', 'Monday'),
	(269, 1, 104, NULL, '08:30:00', '16:30:00', 'Tuesday'),
	(270, 1, 104, NULL, '08:30:00', '16:30:00', 'Wednesday'),
	(271, 1, 104, NULL, '08:30:00', '16:30:00', 'Thursday'),
	(272, 1, 104, NULL, '08:30:00', '16:30:00', 'Friday'),
	(273, 4, 105, NULL, '08:30:00', '16:30:00', 'Monday'),
	(274, 4, 105, NULL, '08:30:00', '16:30:00', 'Tuesday'),
	(275, 4, 105, NULL, '08:30:00', '16:30:00', 'Wednesday'),
	(276, 4, 105, NULL, '08:30:00', '16:30:00', 'Thursday'),
	(277, 4, 105, NULL, '08:30:00', '16:30:00', 'Friday'),
	(278, 1, 106, NULL, '08:30:00', '16:30:00', 'Monday'),
	(279, 1, 106, NULL, '08:30:00', '16:30:00', 'Tuesday'),
	(280, 1, 106, NULL, '08:30:00', '16:30:00', 'Wednesday'),
	(281, 1, 106, NULL, '08:30:00', '16:30:00', 'Thursday'),
	(282, 1, 106, NULL, '08:30:00', '16:30:00', 'Friday'),
	(285, 1, 106, NULL, '08:30:00', '16:30:00', 'Saturday'),
	(286, 1, 106, NULL, '08:30:00', '16:30:00', 'Sunday'),
	(287, 1, 204, NULL, '08:30:00', '18:30:00', NULL);

-- Dumping structure for table med-app-db.work_schedule_templates
CREATE TABLE IF NOT EXISTS `work_schedule_templates` (
  `office_id` int NOT NULL,
  `day_of_week` enum('Monday','Tuesday','Wednesday','Thursday','Friday') NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  PRIMARY KEY (`office_id`,`day_of_week`),
  CONSTRAINT `fk_wst_office` FOREIGN KEY (`office_id`) REFERENCES `office` (`office_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `work_schedule_templates_chk_1` CHECK ((`start_time` < `end_time`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table med-app-db.work_schedule_templates: ~0 rows (approximately)
DELETE FROM `work_schedule_templates`;
INSERT INTO `work_schedule_templates` (`office_id`, `day_of_week`, `start_time`, `end_time`) VALUES
	(1, 'Monday', '08:00:00', '17:00:00'),
	(1, 'Tuesday', '08:00:00', '17:00:00'),
	(1, 'Wednesday', '08:00:00', '17:00:00'),
	(1, 'Thursday', '08:00:00', '17:00:00'),
	(1, 'Friday', '08:00:00', '17:00:00'),
	(2, 'Monday', '08:00:00', '17:00:00'),
	(2, 'Tuesday', '08:00:00', '17:00:00'),
	(2, 'Wednesday', '08:00:00', '17:00:00'),
	(2, 'Thursday', '08:00:00', '17:00:00'),
	(2, 'Friday', '08:00:00', '17:00:00'),
	(3, 'Monday', '08:00:00', '17:00:00'),
	(3, 'Tuesday', '08:00:00', '17:00:00'),
	(3, 'Wednesday', '08:00:00', '17:00:00'),
	(3, 'Thursday', '08:00:00', '17:00:00'),
	(3, 'Friday', '08:00:00', '17:00:00'),
	(4, 'Monday', '08:00:00', '17:00:00'),
	(4, 'Tuesday', '08:00:00', '17:00:00'),
	(4, 'Wednesday', '08:00:00', '17:00:00'),
	(4, 'Thursday', '08:00:00', '17:00:00'),
	(4, 'Friday', '08:00:00', '17:00:00');

-- Dumping structure for trigger med-app-db.set_treatment_cost_before_insert
SET @OLDTMP_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO';
DELIMITER //
CREATE TRIGGER `set_treatment_cost_before_insert` BEFORE INSERT ON `treatment_per_visit` FOR EACH ROW BEGIN
    -- If cost_each is not provided or is 0, fetch it from treatment_catalog
    IF NEW.cost_each IS NULL OR NEW.cost_each = 0 THEN
        SET NEW.cost_each = (
            SELECT cost 
            FROM treatment_catalog 
            WHERE treatment_id = NEW.treatment_id
        );
    END IF;
END//
DELIMITER ;
SET SQL_MODE=@OLDTMP_SQL_MODE;

-- Dumping structure for trigger med-app-db.trg_appointment_check_referral
SET @OLDTMP_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO';
DELIMITER //
CREATE TRIGGER `trg_appointment_check_referral` BEFORE INSERT ON `appointment` FOR EACH ROW BEGIN
    DECLARE patient_pcp_id INT;
    DECLARE has_approved_referral INT;
    
    -- Get the patient's Primary Care Physician
    SELECT Primary_Doctor INTO patient_pcp_id
    FROM Patient
    WHERE Patient_ID = NEW.Patient_id;
    
    -- Check if booking with PCP
    IF NEW.Doctor_id = patient_pcp_id THEN
        SET NEW.Status = 'Scheduled';
    ELSE
        -- Not PCP, check if they have an approved referral for this specialist
        SELECT COUNT(*) INTO has_approved_referral
        FROM referral
        WHERE patient_id = NEW.Patient_id
        AND specialist_doctor_staff_id = NEW.Doctor_id
        AND date_of_approval IS NOT NULL
        AND appointment_id IS NULL;
        
        IF has_approved_referral > 0 THEN
            SET NEW.Status = 'Scheduled';
        ELSE
            -- No referral found
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'You must have a referral to book an appointment with a specialist. Please contact your primary care physician.';
        END IF;
    END IF;
END//
DELIMITER ;
SET SQL_MODE=@OLDTMP_SQL_MODE;

-- Dumping structure for trigger med-app-db.trg_check_insurance_expiration_on_checkin
SET @OLDTMP_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO';
DELIMITER //
CREATE TRIGGER `trg_check_insurance_expiration_on_checkin` BEFORE INSERT ON `patient_visit` FOR EACH ROW BEGIN
    DECLARE insurance_status VARCHAR(20);
    DECLARE insurance_expiry_date DATE;
    DECLARE primary_insurance_id INT;
    DECLARE insurance_plan_name VARCHAR(100);
    DECLARE payer_name VARCHAR(100);
    DECLARE days_until_expiry INT;
    
    -- Get the patient's primary insurance information
    SELECT 
        pi.id,
        pi.expiration_date,
        CASE
            WHEN pi.expiration_date IS NULL THEN 'ACTIVE'
            WHEN pi.expiration_date < CURDATE() THEN 'EXPIRED'
            WHEN pi.expiration_date <= DATE_ADD(CURDATE(), INTERVAL 30 DAY) THEN 'EXPIRING_SOON'
            ELSE 'ACTIVE'
        END AS status,
        ip.plan_name,
        ipy.name,
        DATEDIFF(pi.expiration_date, CURDATE()) AS days_remaining
    INTO 
        primary_insurance_id,
        insurance_expiry_date,
        insurance_status,
        insurance_plan_name,
        payer_name,
        days_until_expiry
    FROM patient_insurance pi
    LEFT JOIN insurance_plan ip ON pi.plan_id = ip.plan_id
    LEFT JOIN insurance_payer ipy ON ip.payer_id = ipy.payer_id
    WHERE pi.patient_id = NEW.patient_id
      AND pi.is_primary = 1
      AND pi.effective_date <= CURDATE()
    ORDER BY pi.effective_date DESC
    LIMIT 1;
    
    -- Case 1: No insurance found at all
    IF primary_insurance_id IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'INSURANCE_WARNING: Patient has no active insurance on file. Please verify insurance information before proceeding with check-in.',
            MYSQL_ERRNO = 9001;
    END IF;
    
    -- Case 2: Insurance is expired
    IF insurance_status = 'EXPIRED' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'INSURANCE_EXPIRED: Patient insurance has expired. Please update insurance information before check-in. ', 
            MYSQL_ERRNO = 9002;
    END IF;
    
    -- Case 3: Insurance expiring within 30 days (warning, but allow check-in)
	IF insurance_status = 'EXPIRING_SOON' THEN
        SET @insurance_warning = CONCAT('INSURANCE_EXPIRING: Patient insurance will expire in ', 
                                       days_until_expiry, 
                                       ' days on ', 
                                       DATE_FORMAT(insurance_expiry_date, '%m/%d/%Y'),
                                       '. Plan: ', COALESCE(insurance_plan_name, 'Unknown'),
                                       ' (', COALESCE(payer_name, 'Unknown Payer'), ')',
                                       '. Please remind patient to renew.');
    ELSE
        -- Clear the warning variable if insurance is fine
        SET @insurance_warning = NULL;
    END IF;
    
    -- Store the insurance ID being used for this visit
    IF NEW.insurance_policy_id_used IS NULL THEN
        SET NEW.insurance_policy_id_used = primary_insurance_id;
    END IF;
    
END//
DELIMITER ;
SET SQL_MODE=@OLDTMP_SQL_MODE;

-- Dumping structure for trigger med-app-db.trg_user_account_update
SET @OLDTMP_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO';
DELIMITER //
CREATE TRIGGER `trg_user_account_update` BEFORE UPDATE ON `user_account` FOR EACH ROW BEGIN
IF NEW.user_id != OLD.user_id OR NEW.role != OLD.role THEN
        IF NEW.role = 'PATIENT' THEN
            IF NOT EXISTS (SELECT 1 FROM patient WHERE patient_id = NEW.user_id) THEN
                SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid patient_id for role PATIENT';
            END IF;
        ELSEIF NEW.role IN ('DOCTOR', 'NURSE', 'RECEPTIONIST', 'ADMIN') THEN
            IF NOT EXISTS (SELECT 1 FROM staff WHERE staff_id = NEW.user_id) THEN
                SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid staff_id for role';
            END IF;
        END IF;
    END IF;
END//
DELIMITER ;
SET SQL_MODE=@OLDTMP_SQL_MODE;

-- Dumping structure for trigger med-app-db.update_treatment_cost_after_insert
SET @OLDTMP_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO';
DELIMITER //
CREATE TRIGGER `update_treatment_cost_after_insert` AFTER INSERT ON `treatment_per_visit` FOR EACH ROW BEGIN
    UPDATE patient_visit
    SET treatment_cost_due = (
        SELECT COALESCE(SUM(total_cost), 0)
        FROM treatment_per_visit
        WHERE visit_id = NEW.visit_id
    )
    WHERE visit_id = NEW.visit_id;
END//
DELIMITER ;
SET SQL_MODE=@OLDTMP_SQL_MODE;

-- Dumping structure for trigger med-app-db.update_treatment_cost_due
SET @OLDTMP_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO';
DELIMITER //
CREATE TRIGGER `update_treatment_cost_due` AFTER INSERT ON `treatment_per_visit` FOR EACH ROW BEGIN
    UPDATE patient_visit 
    SET treatment_cost_due = (
        SELECT COALESCE(SUM(total_cost), 0) 
        FROM treatment_per_visit 
        WHERE visit_id = NEW.visit_id
    ) - COALESCE(copay_amount_due, 0)
    WHERE visit_id = NEW.visit_id;
END//
DELIMITER ;
SET SQL_MODE=@OLDTMP_SQL_MODE;

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
