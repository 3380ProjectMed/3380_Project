-- MySQL dump 10.13  Distrib 8.0.43, for macos15 (arm64)
--
-- Host: 127.0.0.1    Database: med-app-db
-- ------------------------------------------------------
-- Server version	8.4.6

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `Appointment`
--

DROP TABLE IF EXISTS `Appointment`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Appointment` (
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
  CONSTRAINT `fk_appt__patient` FOREIGN KEY (`Patient_id`) REFERENCES `Patient` (`Patient_ID`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `chk_appointment_dates` CHECK ((`Date_created` <= `Appointment_date`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Appointment`
--

LOCK TABLES `Appointment` WRITE;
/*!40000 ALTER TABLE `Appointment` DISABLE KEYS */;
INSERT INTO `Appointment` VALUES (1001,101,201,1,'2025-11-05 09:00:00','2025-11-04 09:00:00','Annual physical examination'),(1002,103,201,3,'2025-10-27 14:00:00','2025-10-26 14:00:00','Follow-up consultation'),(1003,105,202,1,'2025-10-21 10:30:00','2025-10-20 10:30:00','Cardiology checkup'),(1004,107,202,4,'2025-10-29 11:00:00','2025-10-28 11:00:00','Heart condition monitoring'),(1005,102,203,2,'2025-10-30 13:30:00','2025-10-29 13:30:00','Pediatric wellness visit'),(1006,108,203,2,'2025-10-29 15:45:00','2025-10-28 15:45:00','Vaccination'),(1007,104,204,3,'2025-10-27 08:45:00','2025-10-26 08:45:00','Orthopedic consultation'),(1008,101,204,1,'2025-11-01 16:00:00','2025-10-31 16:00:00','Knee pain evaluation'),(1009,106,205,4,'2025-10-28 09:30:00','2025-10-21 08:30:00','OB/GYN appointment'),(1010,103,206,2,'2025-10-21 08:30:00','2025-10-20 08:30:00','Internal medicine consultation'),(1011,104,207,4,'2025-10-22 14:30:00','2025-10-21 14:30:00','Dermatology screening');
/*!40000 ALTER TABLE `Appointment` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `CodesAllergies`
--

DROP TABLE IF EXISTS `CodesAllergies`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `CodesAllergies` (
  `AllergiesCode` smallint NOT NULL,
  `Allergies_Text` varchar(50) NOT NULL,
  PRIMARY KEY (`AllergiesCode`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `CodesAllergies`
--

LOCK TABLES `CodesAllergies` WRITE;
/*!40000 ALTER TABLE `CodesAllergies` DISABLE KEYS */;
INSERT INTO `CodesAllergies` VALUES (1,'Penicillin'),(2,'Pollen'),(3,'Shellfish'),(4,'Peanuts'),(5,'Tree Nuts'),(6,'Milk'),(7,'Eggs'),(8,'Wheat'),(9,'Soy'),(10,'Fish'),(11,'Sulfonamides'),(12,'Aspirin'),(13,'Ibuprofen'),(14,'Latex'),(15,'Dust Mites'),(16,'Mold'),(17,'Pet Dander'),(18,'Sesame'),(19,'Mustard'),(20,'Celery'),(21,'NSAIDs'),(22,'Codeine'),(23,'Sulfa Drugs'),(24,'Cephalosporin'),(25,'No Known Allergies'),(26,'Grass');
/*!40000 ALTER TABLE `CodesAllergies` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `CodesAssignedAtBirth_Gender`
--

DROP TABLE IF EXISTS `CodesAssignedAtBirth_Gender`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `CodesAssignedAtBirth_Gender` (
  `GenderCode` smallint NOT NULL,
  `Gender_Text` varchar(30) NOT NULL,
  PRIMARY KEY (`GenderCode`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

-- Dumping data for table med-app-db.CodesAssignedAtBirth_Gender: ~5 rows (approximately)
INSERT INTO `CodesAssignedAtBirth_Gender` (`GenderCode`, `Gender_Text`) VALUES
	(1, 'Male'),
	(2, 'Female'),
	(3, 'Intersex'),
	(4, 'Not Specified'),
	(5, 'Other');

DROP TABLE IF EXISTS `CodesEthnicity`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `CodesEthnicity` (
  `EthnicityCode` smallint NOT NULL,
  `Ethnicity_Text` varchar(30) NOT NULL,
  PRIMARY KEY (`EthnicityCode`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `CodesEthnicity`
--

-- Dumping data for table med-app-db.CodesEthnicity: ~4 rows (approximately)
INSERT INTO `CodesEthnicity` (`EthnicityCode`, `Ethnicity_Text`) VALUES
	(1, 'Hispanic or Latino'),
	(2, 'Non-Hispanic or Latino'),
	(3, 'Not Specified'),
	(4, 'Other');

DROP TABLE IF EXISTS `CodesGender`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `CodesGender` (
  `GenderCode` smallint NOT NULL,
  `Gender_Text` varchar(30) NOT NULL,
  PRIMARY KEY (`GenderCode`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `CodesGender`
--

LOCK TABLES `CodesGender` WRITE;
/*!40000 ALTER TABLE `CodesGender` DISABLE KEYS */;
INSERT INTO `CodesGender` VALUES (1,'Male'),(2,'Female'),(3,'Non-Binary'),(4,'Prefer to Self-Describe'),(5,'Not Specified'),(6,'Other');
/*!40000 ALTER TABLE `CodesGender` ENABLE KEYS */;
UNLOCK TABLES;

-- Dumping data for table med-app-db.CodesGender: ~6 rows (approximately)

DROP TABLE IF EXISTS `CodesRace`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `CodesRace` (
  `RaceCode` smallint NOT NULL,
  `Race_Text` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  PRIMARY KEY (`RaceCode`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `CodesRace`
--

LOCK TABLES `CodesRace` WRITE;
/*!40000 ALTER TABLE `CodesRace` DISABLE KEYS */;
INSERT INTO `CodesRace` VALUES (1,'White'),(2,'Black or African American'),(3,'American Indian/Alaska Native'),(4,'Asian'),(5,'Native Hawaiian/Pacific Islander'),(6,'Two or More Races'),(7,'Not Specified'),(8,'Other');
/*!40000 ALTER TABLE `CodesRace` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Doctor`
--

DROP TABLE IF EXISTS `Doctor`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Doctor` (
  `Doctor_id` int NOT NULL,
  `First_Name` varchar(30) NOT NULL,
  `Last_Name` varchar(30) NOT NULL,
  `SSN` varchar(11) NOT NULL,
  `Gender` smallint DEFAULT NULL,
  `Specialty` int NOT NULL,
  `Work_Schedule` int DEFAULT NULL,
  `Work_Location` int DEFAULT NULL,
  `Email` varchar(30) NOT NULL,
  `Phone` varchar(12) DEFAULT NULL,
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Doctor`
--

LOCK TABLES `Doctor` WRITE;
/*!40000 ALTER TABLE `Doctor` DISABLE KEYS */;
INSERT INTO `Doctor` VALUES (201,'Amy','Chen','123-45-6781',2,3,NULL,1,'echen@medconnect.com','737-492-8101','TXMD123456'),(202,'James','Rodriguez','123-45-6782',1,14,NULL,1,'jrodriguez@medconnect.com','737-492-8102','TXMD123457'),(203,'Susan','Lee','123-45-6783',2,4,NULL,2,'slee@medconnect.com','737-879-710','TXMD123458'),(204,'Richard','Patel','123-45-6784',1,15,NULL,3,'rpatel@medconnect.com','737-879-7102','TXMD123459'),(205,'Maria','Garcia','123-45-6785',2,5,NULL,4,'mgarcia@medconnect.com','737-492-8103','TXMD123460'),(206,'David','Kim','123-45-6786',1,3,NULL,2,'dkim@medconnect.com','737-879-7103','TXMD123461'),(207,'Lisa','Wong','123-45-6787',2,13,NULL,4,'lwong@medconnect.com','737-492-8104','TXMD123462');
/*!40000 ALTER TABLE `Doctor` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `MedicalCondition`
--

DROP TABLE IF EXISTS `MedicalCondition`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `MedicalCondition` (
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `MedicalCondition`
--

LOCK TABLES `MedicalCondition` WRITE;
/*!40000 ALTER TABLE `MedicalCondition` DISABLE KEYS */;
/*!40000 ALTER TABLE `MedicalCondition` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `MedicalHistory`
--

DROP TABLE IF EXISTS `MedicalHistory`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `MedicalHistory` (
  `History_ID` int NOT NULL AUTO_INCREMENT,
  `Patient_ID` int NOT NULL,
  `Condition_Name` varchar(100) NOT NULL,
  `Diagnosis_Date` date NOT NULL,
  PRIMARY KEY (`History_ID`),
  KEY `ix_medhist_patient` (`Patient_ID`),
  CONSTRAINT `fk_mh__patient` FOREIGN KEY (`Patient_ID`) REFERENCES `Patient` (`Patient_ID`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `MedicalHistory`
--

LOCK TABLES `MedicalHistory` WRITE;
/*!40000 ALTER TABLE `MedicalHistory` DISABLE KEYS */;
/*!40000 ALTER TABLE `MedicalHistory` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `MedicationHistory`
--

DROP TABLE IF EXISTS `MedicationHistory`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `MedicationHistory` (
  `Drug_ID` int NOT NULL AUTO_INCREMENT,
  `Patient_ID` int NOT NULL,
  `Drug_name` varchar(100) NOT NULL,
  `DurationAndFrequencyOfDrugUse` varchar(150) DEFAULT NULL,
  PRIMARY KEY (`Drug_ID`),
  KEY `ix_medhist_patient` (`Patient_ID`),
  CONSTRAINT `fk_medhist_patient` FOREIGN KEY (`Patient_ID`) REFERENCES `Patient` (`Patient_ID`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `MedicationHistory`
--

LOCK TABLES `MedicationHistory` WRITE;
/*!40000 ALTER TABLE `MedicationHistory` DISABLE KEYS */;
/*!40000 ALTER TABLE `MedicationHistory` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Nurse`
--

DROP TABLE IF EXISTS `Nurse`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Nurse` (
  `Nurse_id` int NOT NULL,
  `Staff_id` int DEFAULT NULL,
  `Department` varchar(30) DEFAULT NULL,
  PRIMARY KEY (`Nurse_id`),
  KEY `ix_nurse_staff` (`Staff_id`),
  CONSTRAINT `fk_nurse__staff` FOREIGN KEY (`Staff_id`) REFERENCES `Staff` (`Staff_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Nurse`
--

LOCK TABLES `Nurse` WRITE;
/*!40000 ALTER TABLE `Nurse` DISABLE KEYS */;
/*!40000 ALTER TABLE `Nurse` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Office`
--

DROP TABLE IF EXISTS `Office`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Office` (
  `Office_ID` int NOT NULL AUTO_INCREMENT,
  `Name` varchar(30) NOT NULL,
  `City` varchar(30) NOT NULL,
  `State` varchar(20) NOT NULL,
  `address` varchar(50) NOT NULL,
  `ZipCode` varchar(10) NOT NULL,
  `DeptCount` int DEFAULT NULL,
  `Phone` varchar(15) NOT NULL,
  PRIMARY KEY (`Office_ID`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Office`
--

LOCK TABLES `Office` WRITE;
/*!40000 ALTER TABLE `Office` DISABLE KEYS */;
INSERT INTO `Office` VALUES (1,'Downtown Medical Center','Houston','TX','425 Main Street, Suite 100','77002',6,'7374928165'),(2,'Westside Family Clinic','Houston','TX','8920 Katy Freeway, Building B','77024',5,'7378797156'),(3,'Memorial Park Healthcare','Houston','TX','1550 Memorial Drive','77007',4,'713-555-0103'),(4,'Galleria Medical Plaza','Houston','TX','5085 Westheimer Road, Floor 3','77056',5,'713-555-0104');
/*!40000 ALTER TABLE `Office` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Patient`
--

DROP TABLE IF EXISTS `Patient`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Patient` (
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
) ENGINE=InnoDB AUTO_INCREMENT=109 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Patient`
--

LOCK TABLES `Patient` WRITE;
/*!40000 ALTER TABLE `Patient` DISABLE KEYS */;
INSERT INTO `Patient` VALUES (101,'John','Smith','1985-03-15','123-45-6789','555-1001',1,1,2,1,'john.smith@email.com','Y',201,NULL,1,101,NULL,NULL,'O+','Private'),(102,'Maria','Garcia','1978-07-22','123-45-6790','555-1002',2,2,1,2,'maria.garcia@email.com','Y',203,NULL,2,102,NULL,NULL,'A+','Private'),(103,'David','Johnson','1992-11-30','123-45-6791','555-1003',1,1,2,1,'david.johnson@email.com','Y',201,NULL,3,105,NULL,NULL,'B+','Medicare'),(104,'Sarah','Williams','1980-05-14','123-45-6792','555-1004',2,2,2,1,'sarah.williams@email.com','Y',204,NULL,4,103,NULL,NULL,'AB-','Private'),(105,'Michael','Brown','1975-09-08','123-45-6793','555-1005',1,1,2,2,'michael.brown@email.com','Y',202,NULL,5,104,NULL,NULL,'O-','Private'),(106,'Jennifer','Davis','1988-12-25','123-45-6794','555-1006',2,2,2,1,'jennifer.davis@email.com','Y',205,NULL,6,101,NULL,NULL,'A-','Private'),(107,'Robert','Miller','1965-02-18','123-45-6795','555-1007',1,1,2,1,'robert.miller@email.com','Y',202,NULL,7,105,NULL,NULL,'B-','Medicare'),(108,'Lisa','Wilson','1990-08-11','123-45-6796','555-1008',2,2,1,3,'lisa.wilson@email.com','Y',203,NULL,8,102,NULL,NULL,'AB+','Private');
/*!40000 ALTER TABLE `Patient` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `PatientVisit`
--

DROP TABLE IF EXISTS `PatientVisit`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `PatientVisit` (
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `PatientVisit`
--

LOCK TABLES `PatientVisit` WRITE;
/*!40000 ALTER TABLE `PatientVisit` DISABLE KEYS */;
/*!40000 ALTER TABLE `PatientVisit` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Prescription`
--

DROP TABLE IF EXISTS `Prescription`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Prescription` (
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Prescription`
--

LOCK TABLES `Prescription` WRITE;
/*!40000 ALTER TABLE `Prescription` DISABLE KEYS */;
/*!40000 ALTER TABLE `Prescription` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Referral`
--

DROP TABLE IF EXISTS `Referral`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Referral` (
  `Referral_ID` int NOT NULL AUTO_INCREMENT,
  `Patient_ID` int NOT NULL,
  `Date_of_approval` date DEFAULT NULL,
  `referring_doctor_staff_id` int DEFAULT NULL,
  `specialist_doctor_staff_id` int DEFAULT NULL,
  `Reason` varchar(300) DEFAULT NULL,
  `appointment_id` int DEFAULT NULL,
  `Status` enum('Pending','Approved','Denied') DEFAULT 'Pending',
  `notes` text,
  PRIMARY KEY (`Referral_ID`),
  KEY `ix_ref_patient` (`Patient_ID`),
  KEY `ix_ref_refdoc` (`referring_doctor_staff_id`),
  KEY `ix_ref_specdoc` (`specialist_doctor_staff_id`),
  KEY `ix_ref_appt` (`appointment_id`),
  CONSTRAINT `fk_ref__appointment` FOREIGN KEY (`appointment_id`) REFERENCES `Appointment` (`Appointment_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_ref__patient` FOREIGN KEY (`Patient_ID`) REFERENCES `Patient` (`Patient_ID`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_ref__referring_doctor` FOREIGN KEY (`referring_doctor_staff_id`) REFERENCES `Doctor` (`Doctor_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_ref__specialist_doctor` FOREIGN KEY (`specialist_doctor_staff_id`) REFERENCES `Doctor` (`Doctor_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Referral`
--

LOCK TABLES `Referral` WRITE;
/*!40000 ALTER TABLE `Referral` DISABLE KEYS */;
INSERT INTO `Referral` VALUES (9,101,NULL,201,202,'Test referral from curl',NULL,'Pending',NULL),(12,101,'2025-10-21',201,202,'Chest pain, possible cardiac issue',NULL,'Approved','Family history of heart disease'),(13,101,NULL,201,203,'crying',NULL,'Pending',''),(14,101,NULL,202,206,'test',NULL,'Pending',NULL);
/*!40000 ALTER TABLE `Referral` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ResponsibleParty`
--

DROP TABLE IF EXISTS `ResponsibleParty`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ResponsibleParty` (
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ResponsibleParty`
--

LOCK TABLES `ResponsibleParty` WRITE;
/*!40000 ALTER TABLE `ResponsibleParty` DISABLE KEYS */;
/*!40000 ALTER TABLE `ResponsibleParty` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Specialty`
--

DROP TABLE IF EXISTS `Specialty`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Specialty` (
  `specialty_id` int NOT NULL AUTO_INCREMENT,
  `specialty_name` varchar(100) NOT NULL,
  PRIMARY KEY (`specialty_id`) USING BTREE,
  UNIQUE KEY `ux_specialty_name` (`specialty_name`)
) ENGINE=InnoDB AUTO_INCREMENT=37 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Specialty`
--

LOCK TABLES `Specialty` WRITE;
/*!40000 ALTER TABLE `Specialty` DISABLE KEYS */;
INSERT INTO `Specialty` VALUES (14,'Cardiology'),(13,'Dermatology'),(1,'Family Medicine'),(6,'General Dentistry'),(2,'General Practice'),(3,'Internal Medicine'),(12,'Mental Health Counseling'),(9,'Nurse Practitioner'),(7,'Nursing'),(17,'Nutrition and Dietetics'),(5,'Obstetrics and Gynecology'),(15,'Orthopedics'),(4,'Pediatrics'),(18,'Pharmacy'),(16,'Physical Therapy'),(8,'Physician Assistant'),(11,'Preventive Medicine'),(10,'Urgent Care');
/*!40000 ALTER TABLE `Specialty` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Staff`
--

DROP TABLE IF EXISTS `Staff`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Staff` (
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Staff`
--

LOCK TABLES `Staff` WRITE;
/*!40000 ALTER TABLE `Staff` DISABLE KEYS */;
/*!40000 ALTER TABLE `Staff` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `VaccinationHistory`
--

DROP TABLE IF EXISTS `VaccinationHistory`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `VaccinationHistory` (
  `VaccinationID` int NOT NULL AUTO_INCREMENT,
  `patient_id` int NOT NULL,
  `Vaccination_name` varchar(100) NOT NULL,
  `DateOfVaccination` date NOT NULL,
  `DateForBooster` date DEFAULT NULL,
  PRIMARY KEY (`VaccinationID`),
  KEY `ix_vaxhist_patient` (`patient_id`),
  CONSTRAINT `fk_vaxhist_patient` FOREIGN KEY (`patient_id`) REFERENCES `Patient` (`Patient_ID`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `VaccinationHistory`
--

LOCK TABLES `VaccinationHistory` WRITE;
/*!40000 ALTER TABLE `VaccinationHistory` DISABLE KEYS */;
/*!40000 ALTER TABLE `VaccinationHistory` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `WorkSchedule`
--

DROP TABLE IF EXISTS `WorkSchedule`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `WorkSchedule` (
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `WorkSchedule`
--

LOCK TABLES `WorkSchedule` WRITE;
/*!40000 ALTER TABLE `WorkSchedule` DISABLE KEYS */;
/*!40000 ALTER TABLE `WorkSchedule` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `insurance_payer`
--

DROP TABLE IF EXISTS `insurance_payer`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `insurance_payer` (
  `payer_id` int NOT NULL AUTO_INCREMENT,
  `NAME` varchar(100) DEFAULT NULL,
  `payer_type` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`payer_id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `insurance_payer`
--

LOCK TABLES `insurance_payer` WRITE;
/*!40000 ALTER TABLE `insurance_payer` DISABLE KEYS */;
INSERT INTO `insurance_payer` VALUES (1,'Blue Cross Blue Shield','Commercial'),(2,'Aetna','Commercial'),(3,'UnitedHealthcare','Commercial'),(4,'Medicare','Government'),(5,'Medicaid','Government');
/*!40000 ALTER TABLE `insurance_payer` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `insurance_plan`
--

DROP TABLE IF EXISTS `insurance_plan`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `insurance_plan` (
  `plan_id` int unsigned NOT NULL,
  `payer_id` int DEFAULT NULL,
  `plan_name` varchar(100) DEFAULT NULL,
  `plan_type` enum('HMO','PPO','EPO','Medicare','Medicaid','Other') DEFAULT NULL,
  `network_rules` json DEFAULT NULL,
  PRIMARY KEY (`plan_id`),
  KEY `fk_plan_payer` (`payer_id`),
  CONSTRAINT `fk_plan_payer` FOREIGN KEY (`payer_id`) REFERENCES `insurance_payer` (`payer_id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `insurance_plan`
--

LOCK TABLES `insurance_plan` WRITE;
/*!40000 ALTER TABLE `insurance_plan` DISABLE KEYS */;
INSERT INTO `insurance_plan` VALUES (101,1,'BCBS Gold','PPO',NULL),(102,1,'BCBS Silver','HMO',NULL),(103,2,'Aetna Premier','PPO',NULL),(104,3,'UHC Choice Plus','PPO',NULL),(105,4,'Medicare Part B','Medicare',NULL);
/*!40000 ALTER TABLE `insurance_plan` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `patient_insurance`
--

DROP TABLE IF EXISTS `patient_insurance`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `patient_insurance` (
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
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `patient_insurance`
--

LOCK TABLES `patient_insurance` WRITE;
/*!40000 ALTER TABLE `patient_insurance` DISABLE KEYS */;
INSERT INTO `patient_insurance` VALUES (1,101,101,'M123456789','G987654','2023-01-01','2024-12-31',1,25.00,1500.00,NULL,20.00),(2,102,102,'M123456790','G987655','2023-03-01','2024-12-31',1,20.00,2000.00,NULL,15.00),(3,103,105,'M123456791',NULL,'2022-06-01',NULL,1,15.00,500.00,NULL,10.00),(4,104,103,'M123456792','G987656','2023-02-15','2024-12-31',1,30.00,1000.00,NULL,25.00),(5,105,104,'M123456793','G987657','2023-01-01','2024-12-31',1,25.00,1500.00,NULL,20.00),(6,106,101,'M123456794',NULL,'2023-01-01',NULL,1,NULL,1500.00,NULL,NULL),(7,107,105,'M123456795',NULL,'2022-06-01',NULL,1,NULL,500.00,NULL,NULL),(8,108,102,'M123456796',NULL,'2023-03-01',NULL,1,NULL,2000.00,NULL,NULL);
/*!40000 ALTER TABLE `patient_insurance` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_account`
--

DROP TABLE IF EXISTS `user_account`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_account` (
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_account`
--

LOCK TABLES `user_account` WRITE;
/*!40000 ALTER TABLE `user_account` DISABLE KEYS */;
/*!40000 ALTER TABLE `user_account` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-10-21 21:52:39
