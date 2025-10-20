-- --------------------------------------------------------
-- Host:                         127.0.0.1
-- Server version:               8.4.6 - MySQL Community Server - GPL
-- Server OS:                    Linux
-- HeidiSQL Version:             12.11.0.7065
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
DROP DATABASE IF EXISTS `med-app-db`;
CREATE DATABASE IF NOT EXISTS `med-app-db` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `med-app-db`;

-- Dumping structure for table med-app-db.Appointment
DROP TABLE IF EXISTS `Appointment`;
CREATE TABLE IF NOT EXISTS `Appointment` (
  `Appointment_id` int NOT NULL,
  `Patient_id` int DEFAULT NULL,
  `Doctor_id` int DEFAULT NULL,
  `Office_id` int DEFAULT NULL,
  `Appointment_date` datetime NOT NULL,
  `Date_created` datetime NOT NULL,
  `Reason_for_visit` varchar(300) DEFAULT NULL,
  PRIMARY KEY (`Appointment_id`),
  KEY `ix_appt_patient` (`Patient_id`),
  KEY `ix_appt_doctor` (`Doctor_id`),
  KEY `ix_appt_office` (`Office_id`),
  CONSTRAINT `fk_appt__doctor` FOREIGN KEY (`Doctor_id`) REFERENCES `Doctor` (`Doctor_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_appt__office` FOREIGN KEY (`Office_id`) REFERENCES `Office` (`Office_ID`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_appt__patient` FOREIGN KEY (`Patient_id`) REFERENCES `Patient` (`Patient_ID`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table med-app-db.Appointment: ~0 rows (approximately)

-- Dumping structure for table med-app-db.CodesAllergies
DROP TABLE IF EXISTS `CodesAllergies`;
CREATE TABLE IF NOT EXISTS `CodesAllergies` (
  `AllergiesCode` smallint NOT NULL,
  `Allergies_Text` varchar(50) NOT NULL,
  PRIMARY KEY (`AllergiesCode`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table med-app-db.CodesAllergies: ~26 rows (approximately)
REPLACE INTO `CodesAllergies` (`AllergiesCode`, `Allergies_Text`) VALUES
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

-- Dumping structure for table med-app-db.CodesAssignedAtBirth_Gender
DROP TABLE IF EXISTS `CodesAssignedAtBirth_Gender`;
CREATE TABLE IF NOT EXISTS `CodesAssignedAtBirth_Gender` (
  `GenderCode` smallint NOT NULL,
  `Gender_Text` varchar(30) NOT NULL,
  PRIMARY KEY (`GenderCode`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table med-app-db.CodesAssignedAtBirth_Gender: ~5 rows (approximately)
REPLACE INTO `CodesAssignedAtBirth_Gender` (`GenderCode`, `Gender_Text`) VALUES
	(1, 'Male'),
	(2, 'Female'),
	(3, 'Intersex'),
	(4, 'Not Specified'),
	(5, 'Other');

-- Dumping structure for table med-app-db.CodesEthnicity
DROP TABLE IF EXISTS `CodesEthnicity`;
CREATE TABLE IF NOT EXISTS `CodesEthnicity` (
  `EthnicityCode` smallint NOT NULL,
  `Ethnicity_Text` varchar(30) NOT NULL,
  PRIMARY KEY (`EthnicityCode`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table med-app-db.CodesEthnicity: ~4 rows (approximately)
REPLACE INTO `CodesEthnicity` (`EthnicityCode`, `Ethnicity_Text`) VALUES
	(1, 'Hispanic or Latino'),
	(2, 'Non-Hispanic or Latino'),
	(3, 'Not Specified'),
	(4, 'Other');

-- Dumping structure for table med-app-db.CodesGender
DROP TABLE IF EXISTS `CodesGender`;
CREATE TABLE IF NOT EXISTS `CodesGender` (
  `GenderCode` smallint NOT NULL,
  `Gender_Text` varchar(30) NOT NULL,
  PRIMARY KEY (`GenderCode`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table med-app-db.CodesGender: ~6 rows (approximately)
REPLACE INTO `CodesGender` (`GenderCode`, `Gender_Text`) VALUES
	(1, 'Male'),
	(2, 'Female'),
	(3, 'Non-Binary'),
	(4, 'Prefer to Self-Describe'),
	(5, 'Not Specified'),
	(6, 'Other');

-- Dumping structure for table med-app-db.CodesRace
DROP TABLE IF EXISTS `CodesRace`;
CREATE TABLE IF NOT EXISTS `CodesRace` (
  `RaceCode` smallint NOT NULL,
  `Race_Text` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  PRIMARY KEY (`RaceCode`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table med-app-db.CodesRace: ~8 rows (approximately)
REPLACE INTO `CodesRace` (`RaceCode`, `Race_Text`) VALUES
	(1, 'White'),
	(2, 'Black or African American'),
	(3, 'American Indian/Alaska Native'),
	(4, 'Asian'),
	(5, 'Native Hawaiian/Pacific Islander'),
	(6, 'Two or More Races'),
	(7, 'Not Specified'),
	(8, 'Other'),
	(9, 'Aliens');

-- Dumping structure for table med-app-db.Doctor
DROP TABLE IF EXISTS `Doctor`;
CREATE TABLE IF NOT EXISTS `Doctor` (
  `Doctor_id` int NOT NULL,
  `First_Name` varchar(30) NOT NULL,
  `Last_Name` varchar(30) NOT NULL,
  `SSN` varchar(11) NOT NULL,
  `Gender` smallint DEFAULT NULL,
  `Specialty` int NOT NULL,
  `Work_Schedule` int DEFAULT NULL,
  `Work_Location` int DEFAULT NULL,
  `Email` varchar(30) NOT NULL,
  `Phone` varchar(11) NOT NULL,
  `License_Number` varchar(30) DEFAULT NULL,
  PRIMARY KEY (`Doctor_id`),
  UNIQUE KEY `SSN` (`SSN`),
  UNIQUE KEY `Email` (`Email`),
  UNIQUE KEY `Phone` (`Phone`),
  KEY `fk_gender` (`Gender`),
  KEY `fk_specialty` (`Specialty`),
  KEY `fk_schedule` (`Work_Schedule`),
  KEY `fk_office` (`Work_Location`),
  CONSTRAINT `fk_gender` FOREIGN KEY (`Gender`) REFERENCES `CodesGender` (`GenderCode`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_office` FOREIGN KEY (`Work_Location`) REFERENCES `Office` (`Office_ID`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_schedule` FOREIGN KEY (`Work_Schedule`) REFERENCES `WorkSchedule` (`Schedule_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_specialty` FOREIGN KEY (`Specialty`) REFERENCES `Specialty` (`specialty_id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table med-app-db.Doctor: ~0 rows (approximately)

-- Dumping structure for table med-app-db.insurance_payer
DROP TABLE IF EXISTS `insurance_payer`;
CREATE TABLE IF NOT EXISTS `insurance_payer` (
  `payer_id` int NOT NULL AUTO_INCREMENT,
  `NAME` varchar(100) DEFAULT NULL,
  `payer_type` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`payer_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table med-app-db.insurance_payer: ~0 rows (approximately)

-- Dumping structure for table med-app-db.insurance_plan
DROP TABLE IF EXISTS `insurance_plan`;
CREATE TABLE IF NOT EXISTS `insurance_plan` (
  `plan_id` int unsigned NOT NULL,
  `payer_id` int DEFAULT NULL,
  `plan_name` varchar(100) DEFAULT NULL,
  `plan_type` enum('HMO','PPO','EPO','Medicare','Medicaid','Other') DEFAULT NULL,
  `network_rules` json DEFAULT NULL,
  PRIMARY KEY (`plan_id`),
  KEY `fk_plan_payer` (`payer_id`),
  CONSTRAINT `fk_plan_payer` FOREIGN KEY (`payer_id`) REFERENCES `insurance_payer` (`payer_id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table med-app-db.insurance_plan: ~0 rows (approximately)

-- Dumping structure for table med-app-db.MedicalCondition
DROP TABLE IF EXISTS `MedicalCondition`;
CREATE TABLE IF NOT EXISTS `MedicalCondition` (
  `Condition_id` int NOT NULL AUTO_INCREMENT,
  `Patient_id` int DEFAULT NULL,
  `Condition_name` varchar(100) DEFAULT NULL,
  `Diagnosis_date` date DEFAULT NULL,
  `CreatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `CreatedBy` varchar(30) DEFAULT NULL,
  `LastUpdated` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `UpdatedBy` varchar(30) DEFAULT NULL,
  PRIMARY KEY (`Condition_id`),
  KEY `idx_mc_patient` (`Patient_id`),
  KEY `idx_mc_condition_name` (`Condition_name`),
  KEY `idx_mc_diagnosis_date` (`Diagnosis_date`),
  CONSTRAINT `fk_mc__patient` FOREIGN KEY (`Patient_id`) REFERENCES `Patient` (`Patient_ID`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table med-app-db.MedicalCondition: ~0 rows (approximately)

-- Dumping structure for table med-app-db.MedicalHistory
DROP TABLE IF EXISTS `MedicalHistory`;
CREATE TABLE IF NOT EXISTS `MedicalHistory` (
  `History_ID` int NOT NULL AUTO_INCREMENT,
  `Patient_ID` int NOT NULL,
  `Condition_Name` varchar(100) NOT NULL,
  `Diagnosis_Date` date NOT NULL,
  PRIMARY KEY (`History_ID`),
  KEY `ix_medhist_patient` (`Patient_ID`),
  CONSTRAINT `fk_mh__patient` FOREIGN KEY (`Patient_ID`) REFERENCES `Patient` (`Patient_ID`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table med-app-db.MedicalHistory: ~0 rows (approximately)

-- Dumping structure for table med-app-db.MedicationHistory
DROP TABLE IF EXISTS `MedicationHistory`;
CREATE TABLE IF NOT EXISTS `MedicationHistory` (
  `Drug_ID` int NOT NULL AUTO_INCREMENT,
  `Patient_ID` int NOT NULL,
  `Drug_name` varchar(100) NOT NULL,
  `DurationAndFrequencyOfDrugUse` varchar(150) DEFAULT NULL,
  PRIMARY KEY (`Drug_ID`),
  KEY `ix_medhist_patient` (`Patient_ID`),
  CONSTRAINT `fk_medhist_patient` FOREIGN KEY (`Patient_ID`) REFERENCES `Patient` (`Patient_ID`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table med-app-db.MedicationHistory: ~0 rows (approximately)

-- Dumping structure for table med-app-db.Nurse
DROP TABLE IF EXISTS `Nurse`;
CREATE TABLE IF NOT EXISTS `Nurse` (
  `Nurse_id` int NOT NULL,
  `Staff_id` int DEFAULT NULL,
  `Department` varchar(30) DEFAULT NULL,
  PRIMARY KEY (`Nurse_id`),
  KEY `ix_nurse_staff` (`Staff_id`),
  CONSTRAINT `fk_nurse__staff` FOREIGN KEY (`Staff_id`) REFERENCES `Staff` (`Staff_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table med-app-db.Nurse: ~0 rows (approximately)

-- Dumping structure for table med-app-db.Office
DROP TABLE IF EXISTS `Office`;
CREATE TABLE IF NOT EXISTS `Office` (
  `Office_ID` int NOT NULL AUTO_INCREMENT,
  `Name` varchar(30) NOT NULL,
  `City` varchar(30) NOT NULL,
  `State` varchar(20) NOT NULL,
  `address` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `ZipCode` varchar(10) NOT NULL,
  `DeptCount` int DEFAULT NULL,
  `Phone` varchar(15) NOT NULL,
  PRIMARY KEY (`Office_ID`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table med-app-db.Office: ~2 rows (approximately)
REPLACE INTO `Office` (`Office_ID`, `Name`, `City`, `State`, `address`, `ZipCode`, `DeptCount`, `Phone`) VALUES
	(1, 'Downtown Medical Center', 'Houston', 'TX', '425 Main Street, Suite 100', '77002', 6, '7374928165'),
	(2, 'Westside Family Clinic', 'Houston', 'TX', '8920 Katy Freeway, Building B', '77024', 5, '7378797156');

-- Dumping structure for table med-app-db.Patient
DROP TABLE IF EXISTS `Patient`;
CREATE TABLE IF NOT EXISTS `Patient` (
  `Patient_ID` int NOT NULL AUTO_INCREMENT,
  `First_Name` varchar(30) NOT NULL,
  `Last_Name` varchar(30) NOT NULL,
  `dob` date NOT NULL,
  `SSN` varchar(11) NOT NULL,
  `EmergencyContact` varchar(15) DEFAULT NULL,
  `AssignedAtBirth_Gender` smallint NOT NULL,
  `Gender` smallint DEFAULT NULL,
  `Ethnicity` smallint DEFAULT NULL,
  `Race` smallint DEFAULT NULL,
  `Email` varchar(254) DEFAULT NULL,
  `Consent_Disclose` char(1) NOT NULL,
  `Primary_Doctor` int DEFAULT NULL,
  `Specialty_Doctor` int DEFAULT NULL,
  `InsuranceID` int unsigned DEFAULT NULL,
  `InsuranceProvider` int unsigned DEFAULT NULL,
  `Prescription` int DEFAULT NULL,
  `Allergies` smallint DEFAULT NULL,
  `BloodType` enum('A+','A-','B+','B-','AB+','AB-','O+','O-') DEFAULT NULL,
  `PayerType` varchar(15) NOT NULL,
  PRIMARY KEY (`Patient_ID`),
  UNIQUE KEY `uq_patient_ssn` (`SSN`),
  KEY `ix_patient_name` (`Last_Name`,`First_Name`),
  KEY `fk_patient__aab_gender` (`AssignedAtBirth_Gender`),
  KEY `fk_patient__gender` (`Gender`),
  KEY `fk_patient__ethnicity` (`Ethnicity`),
  KEY `fk_patient__race` (`Race`),
  KEY `fk_patient__allergies` (`Allergies`),
  KEY `fk_patient__primary_doctor` (`Primary_Doctor`),
  KEY `fk_patient__specialty_doctor` (`Specialty_Doctor`),
  KEY `fk_patient__insurance_plan` (`InsuranceProvider`),
  KEY `fk_patient__insurance_record` (`InsuranceID`),
  CONSTRAINT `fk_patient__aab_gender` FOREIGN KEY (`AssignedAtBirth_Gender`) REFERENCES `CodesAssignedAtBirth_Gender` (`GenderCode`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_patient__allergies` FOREIGN KEY (`Allergies`) REFERENCES `CodesAllergies` (`AllergiesCode`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_patient__ethnicity` FOREIGN KEY (`Ethnicity`) REFERENCES `CodesEthnicity` (`EthnicityCode`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_patient__gender` FOREIGN KEY (`Gender`) REFERENCES `CodesGender` (`GenderCode`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_patient__insurance_plan` FOREIGN KEY (`InsuranceProvider`) REFERENCES `insurance_plan` (`plan_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_patient__insurance_record` FOREIGN KEY (`InsuranceID`) REFERENCES `patient_insurance` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_patient__primary_doctor` FOREIGN KEY (`Primary_Doctor`) REFERENCES `Doctor` (`Doctor_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_patient__race` FOREIGN KEY (`Race`) REFERENCES `CodesRace` (`RaceCode`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_patient__specialty_doctor` FOREIGN KEY (`Specialty_Doctor`) REFERENCES `Doctor` (`Doctor_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `chk_consent_disclose` CHECK ((`Consent_Disclose` in (_utf8mb4'Y',_utf8mb4'N')))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table med-app-db.Patient: ~0 rows (approximately)

-- Dumping structure for table med-app-db.PatientVisit
DROP TABLE IF EXISTS `PatientVisit`;
CREATE TABLE IF NOT EXISTS `PatientVisit` (
  `Visit_id` int NOT NULL AUTO_INCREMENT,
  `Appointment_id` int DEFAULT NULL,
  `Patient_id` int NOT NULL,
  `Office_id` int DEFAULT NULL,
  `Date` datetime DEFAULT NULL,
  `Blood_pressure` varchar(7) DEFAULT NULL,
  `Doctor_id` int DEFAULT NULL,
  `Nurse_id` int DEFAULT NULL,
  `Status` enum('Scheduled','Completed','Canceled','No-Show') DEFAULT NULL,
  `Diagnosis` json DEFAULT NULL,
  `Treatment` text,
  `Reason_for_Visit` varchar(300) DEFAULT NULL,
  `Department` varchar(50) DEFAULT NULL,
  `AmountDue` decimal(15,2) DEFAULT NULL,
  `Payment` decimal(15,2) DEFAULT NULL,
  `TotalDue` decimal(15,2) DEFAULT NULL,
  `CopayAmount_Due` decimal(15,2) DEFAULT NULL,
  `TreatmentCost_Due` decimal(15,2) DEFAULT NULL,
  `Consent_to_treatment` tinyint(1) DEFAULT NULL,
  `Present_illnesses` json DEFAULT NULL,
  `Temperature` decimal(4,1) DEFAULT NULL,
  `Start_at` datetime DEFAULT NULL,
  `End_at` datetime DEFAULT NULL,
  `Insurance_policy_id_used` int unsigned DEFAULT NULL,
  `CreatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `CreatedBy` varchar(30) DEFAULT NULL,
  `LastUpdated` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `UpdatedBy` varchar(30) DEFAULT NULL,
  PRIMARY KEY (`Visit_id`),
  KEY `idx_pv_patient` (`Patient_id`),
  KEY `idx_pv_doctor` (`Doctor_id`),
  KEY `idx_pv_nurse` (`Nurse_id`),
  KEY `idx_pv_office` (`Office_id`),
  KEY `idx_pv_appt` (`Appointment_id`),
  KEY `idx_pv_date` (`Date`),
  KEY `idx_pv_start_end` (`Start_at`,`End_at`),
  KEY `fk_pv__insurance_used` (`Insurance_policy_id_used`),
  CONSTRAINT `fk_pv__appt` FOREIGN KEY (`Appointment_id`) REFERENCES `Appointment` (`Appointment_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_pv__doctor` FOREIGN KEY (`Doctor_id`) REFERENCES `Doctor` (`Doctor_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_pv__insurance_used` FOREIGN KEY (`Insurance_policy_id_used`) REFERENCES `patient_insurance` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_pv__nurse` FOREIGN KEY (`Nurse_id`) REFERENCES `Nurse` (`Nurse_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_pv__office` FOREIGN KEY (`Office_id`) REFERENCES `Office` (`Office_ID`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_pv__patient` FOREIGN KEY (`Patient_id`) REFERENCES `Patient` (`Patient_ID`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `PatientVisit_chk_1` CHECK (((`End_at` is null) or (`Start_at` is null) or (`Start_at` <= `End_at`))),
  CONSTRAINT `PatientVisit_chk_2` CHECK (((`AmountDue` is null) or (`AmountDue` >= 0))),
  CONSTRAINT `PatientVisit_chk_3` CHECK (((`Payment` is null) or (`Payment` >= 0))),
  CONSTRAINT `PatientVisit_chk_4` CHECK (((`TotalDue` is null) or (`TotalDue` >= -(999999999999.99)))),
  CONSTRAINT `PatientVisit_chk_5` CHECK (((`CopayAmount_Due` is null) or (`CopayAmount_Due` >= 0))),
  CONSTRAINT `PatientVisit_chk_6` CHECK (((`TreatmentCost_Due` is null) or (`TreatmentCost_Due` >= 0)))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table med-app-db.PatientVisit: ~0 rows (approximately)

-- Dumping structure for table med-app-db.patient_insurance
DROP TABLE IF EXISTS `patient_insurance`;
CREATE TABLE IF NOT EXISTS `patient_insurance` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `patient_id` int NOT NULL,
  `plan_id` int unsigned NOT NULL,
  `member_id` varchar(64) DEFAULT NULL,
  `group_id` varchar(64) DEFAULT NULL,
  `effective_date` date NOT NULL,
  `expiration_date` date DEFAULT NULL,
  `is_primary` tinyint(1) NOT NULL DEFAULT '0',
  `copay` decimal(10,2) DEFAULT NULL,
  `deductible_individ` decimal(10,2) NOT NULL,
  `deductible_family` decimal(10,2) DEFAULT NULL,
  `coinsurance_rate_pct` decimal(5,2) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ux_patient_plan_member` (`patient_id`,`plan_id`,`member_id`),
  KEY `idx_pi_patient` (`patient_id`),
  KEY `idx_pi_plan` (`plan_id`),
  KEY `idx_pi_patient_dates` (`patient_id`,`effective_date`,`expiration_date`),
  CONSTRAINT `fk_pi_patient` FOREIGN KEY (`patient_id`) REFERENCES `Patient` (`Patient_ID`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_pi_plan` FOREIGN KEY (`plan_id`) REFERENCES `insurance_plan` (`plan_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `patient_insurance_chk_1` CHECK (((`expiration_date` is null) or (`effective_date` <= `expiration_date`))),
  CONSTRAINT `patient_insurance_chk_2` CHECK (((`copay` is null) or (`copay` >= 0))),
  CONSTRAINT `patient_insurance_chk_3` CHECK ((`deductible_individ` >= 0)),
  CONSTRAINT `patient_insurance_chk_4` CHECK (((`deductible_family` is null) or (`deductible_family` >= 0))),
  CONSTRAINT `patient_insurance_chk_5` CHECK (((`coinsurance_rate_pct` is null) or ((`coinsurance_rate_pct` >= 0) and (`coinsurance_rate_pct` <= 100))))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table med-app-db.patient_insurance: ~0 rows (approximately)

-- Dumping structure for table med-app-db.Prescription
DROP TABLE IF EXISTS `Prescription`;
CREATE TABLE IF NOT EXISTS `Prescription` (
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
  KEY `ix_rx_patient` (`patient_id`),
  KEY `ix_rx_doctor` (`doctor_id`),
  KEY `ix_rx_appt` (`appointment_id`),
  CONSTRAINT `fk_rx__appointment` FOREIGN KEY (`appointment_id`) REFERENCES `Appointment` (`Appointment_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_rx__doctor` FOREIGN KEY (`doctor_id`) REFERENCES `Doctor` (`Doctor_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_rx__patient` FOREIGN KEY (`patient_id`) REFERENCES `Patient` (`Patient_ID`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table med-app-db.Prescription: ~0 rows (approximately)

-- Dumping structure for table med-app-db.Referral
DROP TABLE IF EXISTS `Referral`;
CREATE TABLE IF NOT EXISTS `Referral` (
  `Referral_ID` int NOT NULL AUTO_INCREMENT,
  `Patient_ID` int NOT NULL,
  `Date_of_approval` date DEFAULT NULL,
  `referring_doctor_staff_id` int DEFAULT NULL,
  `specialist_doctor_staff_id` int DEFAULT NULL,
  `Reason` varchar(300) DEFAULT NULL,
  `appointment_id` int DEFAULT NULL,
  `Status` enum('Pending','Approved','Denied') DEFAULT 'Pending',
  PRIMARY KEY (`Referral_ID`),
  KEY `ix_ref_patient` (`Patient_ID`),
  KEY `ix_ref_refdoc` (`referring_doctor_staff_id`),
  KEY `ix_ref_specdoc` (`specialist_doctor_staff_id`),
  KEY `ix_ref_appt` (`appointment_id`),
  CONSTRAINT `fk_ref__appointment` FOREIGN KEY (`appointment_id`) REFERENCES `Appointment` (`Appointment_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_ref__patient` FOREIGN KEY (`Patient_ID`) REFERENCES `Patient` (`Patient_ID`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_ref__referring_doctor` FOREIGN KEY (`referring_doctor_staff_id`) REFERENCES `Doctor` (`Doctor_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_ref__specialist_doctor` FOREIGN KEY (`specialist_doctor_staff_id`) REFERENCES `Doctor` (`Doctor_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table med-app-db.Referral: ~0 rows (approximately)

-- Dumping structure for table med-app-db.ResponsibleParty
DROP TABLE IF EXISTS `ResponsibleParty`;
CREATE TABLE IF NOT EXISTS `ResponsibleParty` (
  `ResponsiblePartyID` int NOT NULL AUTO_INCREMENT,
  `First_Name` varchar(30) NOT NULL,
  `Last_Name` varchar(30) NOT NULL,
  `ApartmentNo` varchar(10) DEFAULT NULL,
  `BuildingNo` varchar(10) DEFAULT NULL,
  `State` varchar(20) NOT NULL,
  `Zipcode` varchar(10) NOT NULL,
  `City` varchar(30) NOT NULL,
  `ResponsiblePartyPN` varchar(20) NOT NULL,
  PRIMARY KEY (`ResponsiblePartyID`),
  KEY `ix_resp_party_name` (`Last_Name`,`First_Name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table med-app-db.ResponsibleParty: ~0 rows (approximately)

-- Dumping structure for table med-app-db.Specialty
DROP TABLE IF EXISTS `Specialty`;
CREATE TABLE IF NOT EXISTS `Specialty` (
  `specialty_id` int NOT NULL AUTO_INCREMENT,
  `specialty_name` varchar(100) NOT NULL,
  PRIMARY KEY (`specialty_id`) USING BTREE,
  UNIQUE KEY `ux_specialty_name` (`specialty_name`)
) ENGINE=InnoDB AUTO_INCREMENT=37 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table med-app-db.Specialty: ~18 rows (approximately)
REPLACE INTO `Specialty` (`specialty_id`, `specialty_name`) VALUES
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

-- Dumping structure for table med-app-db.Staff
DROP TABLE IF EXISTS `Staff`;
CREATE TABLE IF NOT EXISTS `Staff` (
  `Staff_id` int NOT NULL,
  `First_Name` varchar(30) NOT NULL,
  `Last_Name` varchar(30) NOT NULL,
  `SSN` varchar(11) NOT NULL,
  `Gender` smallint NOT NULL,
  `Staff_Email` varchar(50) NOT NULL,
  `Work_Location` int DEFAULT NULL,
  `Staff_Role` varchar(20) NOT NULL,
  `Work_Schedule` int DEFAULT NULL,
  `License_Number` varchar(30) DEFAULT NULL,
  PRIMARY KEY (`Staff_id`),
  UNIQUE KEY `SSN` (`SSN`),
  UNIQUE KEY `Staff_Email` (`Staff_Email`),
  KEY `ix_staff_gender` (`Gender`),
  KEY `ix_staff_work_schedule` (`Work_Schedule`),
  KEY `ix_staff_work_location` (`Work_Location`),
  CONSTRAINT `fk_staff__gender` FOREIGN KEY (`Gender`) REFERENCES `CodesGender` (`GenderCode`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_staff__work_location` FOREIGN KEY (`Work_Location`) REFERENCES `Office` (`Office_ID`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_staff__work_schedule` FOREIGN KEY (`Work_Schedule`) REFERENCES `WorkSchedule` (`Schedule_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table med-app-db.Staff: ~0 rows (approximately)

-- Dumping structure for table med-app-db.user_account
DROP TABLE IF EXISTS `user_account`;
CREATE TABLE IF NOT EXISTS `user_account` (
  `user_id` int unsigned NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `email` varchar(254) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('PATIENT','DOCTOR','ADMIN') NOT NULL DEFAULT 'PATIENT',
  `mfa_enabled` tinyint(1) NOT NULL DEFAULT '0',
  `last_login_at` datetime DEFAULT NULL,
  `failed_login_count` smallint unsigned NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `ux_user_username` (`username`),
  UNIQUE KEY `ux_user_email` (`email`),
  KEY `idx_user_last_login` (`last_login_at`),
  CONSTRAINT `user_account_chk_1` CHECK ((`failed_login_count` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table med-app-db.user_account: ~0 rows (approximately)

-- Dumping structure for table med-app-db.VaccinationHistory
DROP TABLE IF EXISTS `VaccinationHistory`;
CREATE TABLE IF NOT EXISTS `VaccinationHistory` (
  `VaccinationID` int NOT NULL AUTO_INCREMENT,
  `patient_id` int NOT NULL,
  `Vaccination_name` varchar(100) NOT NULL,
  `DateOfVaccination` date NOT NULL,
  `DateForBooster` date DEFAULT NULL,
  PRIMARY KEY (`VaccinationID`),
  KEY `ix_vaxhist_patient` (`patient_id`),
  CONSTRAINT `fk_vaxhist_patient` FOREIGN KEY (`patient_id`) REFERENCES `Patient` (`Patient_ID`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table med-app-db.VaccinationHistory: ~0 rows (approximately)

-- Dumping structure for table med-app-db.WorkSchedule
DROP TABLE IF EXISTS `WorkSchedule`;
CREATE TABLE IF NOT EXISTS `WorkSchedule` (
  `Schedule_id` int NOT NULL AUTO_INCREMENT,
  `Office_id` int NOT NULL,
  `Staff_id` int DEFAULT NULL,
  `Doctor_id` int DEFAULT NULL,
  `Nurse_id` int DEFAULT NULL,
  `Days` date DEFAULT NULL,
  `Start_time` time DEFAULT NULL,
  `End_time` time DEFAULT NULL,
  `Day_of_week` enum('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday') DEFAULT NULL,
  PRIMARY KEY (`Schedule_id`),
  KEY `idx_ws_office` (`Office_id`),
  KEY `idx_ws_doctor` (`Doctor_id`),
  KEY `idx_ws_nurse` (`Nurse_id`),
  KEY `idx_ws_staff` (`Staff_id`),
  KEY `idx_ws_daydate` (`Day_of_week`,`Days`),
  CONSTRAINT `fk_ws__doctor` FOREIGN KEY (`Doctor_id`) REFERENCES `Doctor` (`Doctor_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_ws__nurse` FOREIGN KEY (`Nurse_id`) REFERENCES `Nurse` (`Nurse_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_ws__office` FOREIGN KEY (`Office_id`) REFERENCES `Office` (`Office_ID`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_ws__staff` FOREIGN KEY (`Staff_id`) REFERENCES `Staff` (`Staff_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `WorkSchedule_chk_1` CHECK (((`End_time` is null) or (`Start_time` is null) or (`Start_time` <= `End_time`)))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table med-app-db.WorkSchedule: ~0 rows (approximately)

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
