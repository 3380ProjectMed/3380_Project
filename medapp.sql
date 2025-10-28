-- MySQL dump 10.13  Distrib 8.0.43, for macos15 (x86_64)
--
-- Host: medconnect-db.mysql.database.azure.com    Database: med-app-db
-- ------------------------------------------------------
-- Server version	8.0.42-azure

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
-- Table structure for table `appointment`
--

DROP TABLE IF EXISTS `appointment`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `appointment` (
  `Appointment_id` int NOT NULL AUTO_INCREMENT,
  `Patient_id` int DEFAULT NULL,
  `Doctor_id` int DEFAULT NULL,
  `Office_id` int DEFAULT NULL,
  `Appointment_date` datetime NOT NULL,
  `Date_created` datetime NOT NULL,
  `Reason_for_visit` varchar(300) DEFAULT NULL,
  `Status` enum('Scheduled','Pending','Waiting','In Progress','Completed','Cancelled','No-Show') DEFAULT NULL,
  PRIMARY KEY (`Appointment_id`),
  KEY `ix_appt_patient` (`Patient_id`),
  KEY `ix_appt_doctor` (`Doctor_id`),
  KEY `ix_appt_office` (`Office_id`),
  CONSTRAINT `fk_appt__doctor` FOREIGN KEY (`Doctor_id`) REFERENCES `doctor` (`doctor_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_appt__office` FOREIGN KEY (`Office_id`) REFERENCES `office` (`office_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_appt__patient` FOREIGN KEY (`Patient_id`) REFERENCES `patient` (`patient_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1014 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `appointment`
--

LOCK TABLES `appointment` WRITE;
/*!40000 ALTER TABLE `appointment` DISABLE KEYS */;
INSERT INTO `appointment` VALUES (1001,1,1,1,'2025-10-30 09:00:00','2025-10-20 14:30:00','Annual physical examination','Scheduled'),(1002,3,1,1,'2025-10-29 14:00:00','2025-10-02 16:45:00','Follow-up consultation','Scheduled'),(1003,5,1,1,'2024-01-15 10:30:00','2023-12-22 09:15:00','Cardiology checkup','Scheduled'),(1004,7,2,4,'2024-01-17 11:00:00','2024-01-08 14:25:00','Heart condition monitoring','Scheduled'),(1005,2,1,2,'2025-10-15 13:30:00','2025-09-28 11:20:00','Pediatric wellness visit','Scheduled'),(1006,8,3,2,'2024-01-18 15:45:00','2024-01-11 12:15:00','Vaccination','Scheduled'),(1007,4,4,3,'2024-01-16 08:45:00','2023-12-28 11:20:00','Orthopedic consultation','Scheduled'),(1008,1,1,1,'2025-10-19 16:00:00','2025-01-09 17:40:00','Knee pain evaluation','Scheduled'),(1009,6,5,4,'2024-01-17 09:30:00','2024-01-05 08:30:00','OB/GYN appointment','Scheduled'),(1010,3,6,2,'2024-01-18 10:00:00','2024-01-12 09:50:00','Internal medicine consultation','Scheduled'),(1011,4,7,4,'2024-01-19 14:30:00','2024-01-15 16:20:00','Dermatology screening','Scheduled'),(1012,4,1,2,'2025-10-27 09:00:00','2025-10-20 09:00:00','Follow-up consultation','In Progress'),(1013,5,1,1,'2025-10-28 13:00:00','2025-10-23 10:00:00','TEST','In Progress');
/*!40000 ALTER TABLE `appointment` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `codes_allergies`
--

DROP TABLE IF EXISTS `codes_allergies`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `codes_allergies` (
  `allergies_code` smallint NOT NULL AUTO_INCREMENT,
  `allergies_text` varchar(50) NOT NULL,
  PRIMARY KEY (`allergies_code`)
) ENGINE=InnoDB AUTO_INCREMENT=27 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `codes_allergies`
--

LOCK TABLES `codes_allergies` WRITE;
/*!40000 ALTER TABLE `codes_allergies` DISABLE KEYS */;
INSERT INTO `codes_allergies` VALUES (1,'Penicillin'),(2,'Pollen'),(3,'Shellfish'),(4,'Peanuts'),(5,'Tree Nuts'),(6,'Milk'),(7,'Eggs'),(8,'Wheat'),(9,'Soy'),(10,'Fish'),(11,'Sulfonamides'),(12,'Aspirin'),(13,'Ibuprofen'),(14,'Latex'),(15,'Dust Mites'),(16,'Mold'),(17,'Pet Dander'),(18,'Sesame'),(19,'Mustard'),(20,'Celery'),(21,'NSAIDs'),(22,'Codeine'),(23,'Sulfa Drugs'),(24,'Cephalosporin'),(25,'No Known Allergies'),(26,'Grass');
/*!40000 ALTER TABLE `codes_allergies` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `codes_assigned_at_birth_gender`
--

DROP TABLE IF EXISTS `codes_assigned_at_birth_gender`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `codes_assigned_at_birth_gender` (
  `gender_code` smallint NOT NULL AUTO_INCREMENT,
  `gender_text` varchar(30) NOT NULL,
  PRIMARY KEY (`gender_code`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `codes_assigned_at_birth_gender`
--

LOCK TABLES `codes_assigned_at_birth_gender` WRITE;
/*!40000 ALTER TABLE `codes_assigned_at_birth_gender` DISABLE KEYS */;
INSERT INTO `codes_assigned_at_birth_gender` VALUES (1,'Male'),(2,'Female'),(3,'Intersex'),(4,'Not Specified'),(5,'Other');
/*!40000 ALTER TABLE `codes_assigned_at_birth_gender` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `codes_ethnicity`
--

DROP TABLE IF EXISTS `codes_ethnicity`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `codes_ethnicity` (
  `ethnicity_code` smallint NOT NULL AUTO_INCREMENT,
  `ethnicity_text` varchar(30) NOT NULL,
  PRIMARY KEY (`ethnicity_code`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `codes_ethnicity`
--

LOCK TABLES `codes_ethnicity` WRITE;
/*!40000 ALTER TABLE `codes_ethnicity` DISABLE KEYS */;
INSERT INTO `codes_ethnicity` VALUES (1,'Hispanic or Latino'),(2,'Non-Hispanic or Latino'),(3,'Not Specified'),(4,'Other');
/*!40000 ALTER TABLE `codes_ethnicity` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `codes_gender`
--

DROP TABLE IF EXISTS `codes_gender`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `codes_gender` (
  `gender_code` smallint NOT NULL AUTO_INCREMENT,
  `gender_text` varchar(30) NOT NULL,
  PRIMARY KEY (`gender_code`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `codes_gender`
--

LOCK TABLES `codes_gender` WRITE;
/*!40000 ALTER TABLE `codes_gender` DISABLE KEYS */;
INSERT INTO `codes_gender` VALUES (1,'Male'),(2,'Female'),(3,'Non-Binary'),(4,'Prefer to Self-Describe'),(5,'Not Specified'),(6,'Other');
/*!40000 ALTER TABLE `codes_gender` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `codes_race`
--

DROP TABLE IF EXISTS `codes_race`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `codes_race` (
  `race_code` smallint NOT NULL AUTO_INCREMENT,
  `race_text` varchar(50) NOT NULL,
  PRIMARY KEY (`race_code`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `codes_race`
--

LOCK TABLES `codes_race` WRITE;
/*!40000 ALTER TABLE `codes_race` DISABLE KEYS */;
INSERT INTO `codes_race` VALUES (1,'White'),(2,'Black or African American'),(3,'American Indian/Alaska Native'),(4,'Asian'),(5,'Native Hawaiian/Pacific Islander'),(6,'Two or More Races'),(7,'Not Specified'),(8,'Other');
/*!40000 ALTER TABLE `codes_race` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `codesallergies`
--

DROP TABLE IF EXISTS `codesallergies`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `codesallergies` (
  `AllergiesCode` smallint NOT NULL AUTO_INCREMENT,
  `Allergies_Text` varchar(50) NOT NULL,
  PRIMARY KEY (`AllergiesCode`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `codesallergies`
--

LOCK TABLES `codesallergies` WRITE;
/*!40000 ALTER TABLE `codesallergies` DISABLE KEYS */;
/*!40000 ALTER TABLE `codesallergies` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `codesassignedatbirth_gender`
--

DROP TABLE IF EXISTS `codesassignedatbirth_gender`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `codesassignedatbirth_gender` (
  `GenderCode` smallint NOT NULL AUTO_INCREMENT,
  `Gender_Text` varchar(30) NOT NULL,
  PRIMARY KEY (`GenderCode`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `codesassignedatbirth_gender`
--

LOCK TABLES `codesassignedatbirth_gender` WRITE;
/*!40000 ALTER TABLE `codesassignedatbirth_gender` DISABLE KEYS */;
/*!40000 ALTER TABLE `codesassignedatbirth_gender` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `codesethnicity`
--

DROP TABLE IF EXISTS `codesethnicity`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `codesethnicity` (
  `EthnicityCode` smallint NOT NULL AUTO_INCREMENT,
  `Ethnicity_Text` varchar(30) NOT NULL,
  PRIMARY KEY (`EthnicityCode`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `codesethnicity`
--

LOCK TABLES `codesethnicity` WRITE;
/*!40000 ALTER TABLE `codesethnicity` DISABLE KEYS */;
/*!40000 ALTER TABLE `codesethnicity` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `codesgender`
--

DROP TABLE IF EXISTS `codesgender`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `codesgender` (
  `GenderCode` smallint NOT NULL AUTO_INCREMENT,
  `Gender_Text` varchar(30) NOT NULL,
  PRIMARY KEY (`GenderCode`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `codesgender`
--

LOCK TABLES `codesgender` WRITE;
/*!40000 ALTER TABLE `codesgender` DISABLE KEYS */;
/*!40000 ALTER TABLE `codesgender` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `codesrace`
--

DROP TABLE IF EXISTS `codesrace`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `codesrace` (
  `RaceCode` smallint NOT NULL AUTO_INCREMENT,
  `Race_Text` varchar(50) NOT NULL,
  PRIMARY KEY (`RaceCode`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `codesrace`
--

LOCK TABLES `codesrace` WRITE;
/*!40000 ALTER TABLE `codesrace` DISABLE KEYS */;
/*!40000 ALTER TABLE `codesrace` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `doctor`
--

DROP TABLE IF EXISTS `doctor`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `doctor` (
  `doctor_id` int NOT NULL AUTO_INCREMENT,
  `first_name` varchar(30) NOT NULL,
  `last_name` varchar(30) NOT NULL,
  `ssn` varchar(11) NOT NULL,
  `gender` smallint DEFAULT NULL,
  `specialty` int NOT NULL,
  `work_schedule` int DEFAULT NULL,
  `work_location` int DEFAULT NULL,
  `email` varchar(30) NOT NULL,
  `phone` varchar(12) DEFAULT NULL,
  `license_number` varchar(30) DEFAULT NULL,
  PRIMARY KEY (`doctor_id`),
  UNIQUE KEY `ssn` (`ssn`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `phone` (`phone`),
  KEY `fk_gender` (`gender`),
  KEY `fk_specialty` (`specialty`),
  KEY `fk_schedule` (`work_schedule`),
  KEY `fk_office` (`work_location`),
  CONSTRAINT `fk_doctor__gender` FOREIGN KEY (`gender`) REFERENCES `codes_gender` (`gender_code`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_doctor__schedule` FOREIGN KEY (`work_schedule`) REFERENCES `work_schedule` (`schedule_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_doctor__specialty` FOREIGN KEY (`specialty`) REFERENCES `specialty` (`specialty_id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `doctor`
--

LOCK TABLES `doctor` WRITE;
/*!40000 ALTER TABLE `doctor` DISABLE KEYS */;
INSERT INTO `doctor` VALUES (1,'Emily','Chen','123-45-6781',2,3,NULL,1,'echen@medconnect.com','737-492-000','TXMD123456'),(2,'James','Rodriguez','123-45-6782',1,14,NULL,1,'jrodriguez@medconnect.com','737-492-8102','TXMD123457'),(3,'Susan','Lee','123-45-6783',2,4,NULL,2,'slee@medconnect.com','737-879-710','TXMD123458'),(4,'Richard','Patel','123-45-6784',1,15,NULL,3,'rpatel@medconnect.com','737-879-7102','TXMD123459'),(5,'Maria','Garcia','123-45-6785',2,5,NULL,4,'mgarcia@medconnect.com','737-492-8103','TXMD123460'),(6,'David','Kim','123-45-6786',1,3,NULL,2,'dkim@medconnect.com','737-879-7103','TXMD123461'),(7,'Lisa','Wong','123-45-6787',2,13,NULL,4,'lwong@medconnect.com','737-492-8104','TXMD123462');
/*!40000 ALTER TABLE `doctor` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `insurance_payer`
--

DROP TABLE IF EXISTS `insurance_payer`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `insurance_payer` (
  `payer_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) DEFAULT NULL,
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
  `plan_id` int unsigned NOT NULL AUTO_INCREMENT,
  `payer_id` int DEFAULT NULL,
  `plan_name` varchar(100) DEFAULT NULL,
  `plan_type` enum('HMO','PPO','EPO','Medicare','Medicaid','Other') DEFAULT NULL,
  `network_rules` json DEFAULT NULL,
  PRIMARY KEY (`plan_id`),
  KEY `fk_plan_payer` (`payer_id`),
  CONSTRAINT `fk_plan_payer` FOREIGN KEY (`payer_id`) REFERENCES `insurance_payer` (`payer_id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=106 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
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
-- Table structure for table `medical_condition`
--

DROP TABLE IF EXISTS `medical_condition`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `medical_condition` (
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `medical_condition`
--

LOCK TABLES `medical_condition` WRITE;
/*!40000 ALTER TABLE `medical_condition` DISABLE KEYS */;
INSERT INTO `medical_condition` VALUES (1,1,'Hypertension','2024-03-10','2025-10-23 04:41:08','Dr. Emily Chen','2025-10-23 04:41:08','Dr. Emily Chen'),(2,1,'Type 2 Diabetes','2022-07-15','2025-10-23 04:41:08','Dr. Emily Chen','2025-10-23 04:41:08','Dr. Emily Chen'),(3,2,'Asthma','2021-05-20','2025-10-23 04:41:08','Dr. Susan Lee','2025-10-23 04:41:08','Dr. Susan Lee'),(4,2,'Migraine','2020-11-03','2025-10-23 04:41:08','Dr. Susan Lee','2025-10-23 04:41:08','Dr. Susan Lee'),(5,3,'Hyperlipidemia','2021-01-12','2025-10-23 04:41:08','Dr. Emily Chen','2025-10-23 04:41:08','Dr. Emily Chen'),(6,4,'Hypothyroidism','2023-09-08','2025-10-23 04:41:08','Dr. Richard Patel','2025-10-23 04:41:08','Dr. Richard Patel'),(7,5,'Osteoarthritis','2024-12-15','2025-10-23 04:41:08','Dr. James Rodriguez','2025-10-23 04:41:08','Dr. James Rodriguez'),(8,5,'GERD','2022-04-22','2025-10-23 04:41:08','Dr. James Rodriguez','2025-10-23 04:41:08','Dr. James Rodriguez'),(9,6,'Anxiety Disorder','2024-08-30','2025-10-23 04:41:08','Dr. Maria Garcia','2025-10-23 04:41:08','Dr. Maria Garcia'),(10,7,'COPD','2022-06-18','2025-10-23 04:41:08','Dr. James Rodriguez','2025-10-23 04:41:08','Dr. James Rodriguez'),(11,8,'PCOS','2021-03-25','2025-10-23 04:41:08','Dr. Susan Lee','2025-10-23 04:41:08','Dr. Susan Lee');
/*!40000 ALTER TABLE `medical_condition` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `medical_history`
--

DROP TABLE IF EXISTS `medical_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `medical_history` (
  `history_id` int NOT NULL AUTO_INCREMENT,
  `patient_id` int NOT NULL,
  `condition_name` varchar(100) NOT NULL,
  `diagnosis_date` date NOT NULL,
  PRIMARY KEY (`history_id`),
  KEY `idx_medhist_patient` (`patient_id`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `medical_history`
--

LOCK TABLES `medical_history` WRITE;
/*!40000 ALTER TABLE `medical_history` DISABLE KEYS */;
INSERT INTO `medical_history` VALUES (1,1,'Hypertension','2021-03-10'),(2,1,'Type 2 Diabetes','2019-07-15'),(3,2,'Asthma','2022-05-20'),(4,2,'Migraine','2021-11-03'),(5,3,'Hyperlipidemia','2020-01-12'),(6,4,'Hypothyroidism','2019-09-08'),(7,5,'Osteoarthritis','2016-12-15'),(8,5,'GERD','2019-04-22'),(9,6,'Anxiety Disorder','2020-08-30'),(10,7,'COPD','2014-06-18'),(11,8,'PCOS','2018-03-25'),(12,1,'Appendectomy','2010-08-12'),(13,3,'Tonsillectomy','2025-03-22'),(14,7,'Knee Replacement','2024-11-05');
/*!40000 ALTER TABLE `medical_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `medicalcondition`
--

DROP TABLE IF EXISTS `medicalcondition`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `medicalcondition` (
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
  CONSTRAINT `fk_mc__patient` FOREIGN KEY (`Patient_id`) REFERENCES `patient` (`Patient_ID`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `medicalcondition`
--

LOCK TABLES `medicalcondition` WRITE;
/*!40000 ALTER TABLE `medicalcondition` DISABLE KEYS */;
/*!40000 ALTER TABLE `medicalcondition` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `medicalhistory`
--

DROP TABLE IF EXISTS `medicalhistory`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `medicalhistory` (
  `History_ID` int NOT NULL AUTO_INCREMENT,
  `Patient_ID` int NOT NULL,
  `Condition_Name` varchar(100) NOT NULL,
  `Diagnosis_Date` date NOT NULL,
  PRIMARY KEY (`History_ID`),
  KEY `ix_medhist_patient` (`Patient_ID`),
  CONSTRAINT `fk_mh__patient` FOREIGN KEY (`Patient_ID`) REFERENCES `patient` (`Patient_ID`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `medicalhistory`
--

LOCK TABLES `medicalhistory` WRITE;
/*!40000 ALTER TABLE `medicalhistory` DISABLE KEYS */;
/*!40000 ALTER TABLE `medicalhistory` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `medication_history`
--

DROP TABLE IF EXISTS `medication_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `medication_history` (
  `drug_id` int NOT NULL AUTO_INCREMENT,
  `patient_id` int NOT NULL,
  `drug_name` varchar(100) NOT NULL,
  `duration_and_frequency_of_drug_use` varchar(150) DEFAULT NULL,
  PRIMARY KEY (`drug_id`),
  KEY `idx_medhist_patient` (`patient_id`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `medication_history`
--

LOCK TABLES `medication_history` WRITE;
/*!40000 ALTER TABLE `medication_history` DISABLE KEYS */;
INSERT INTO `medication_history` VALUES (1,1,'Lisinopril 10mg','Once daily since August 2020'),(2,1,'Metformin 500mg','Twice daily since December 20223'),(3,2,'Albuterol Inhaler','As needed since November 2024'),(4,2,'Sumatriptan 50mg','As needed for migraines since March 2018'),(5,3,'Atorvastatin 20mg','Once daily since June 2021'),(6,4,'Levothyroxine 75mcg','Once daily since May 2017'),(7,5,'Ibuprofen 600mg','Three times daily as needed since June 2012'),(8,5,'Omeprazole 20mg','Once daily since May 2021'),(9,6,'Sertraline 50mg','Once daily since August 2020'),(10,7,'Spiriva HandiHaler','Once daily since September 2024'),(11,7,'Albuterol Nebulizer','Four times daily since Feburary 2021'),(12,8,'Metformin 1000mg','Twice daily since January 2022'),(13,8,'Drospirenone/Ethinyl Estradiol','Once daily since March 2025');
/*!40000 ALTER TABLE `medication_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `medicationhistory`
--

DROP TABLE IF EXISTS `medicationhistory`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `medicationhistory` (
  `Drug_ID` int NOT NULL AUTO_INCREMENT,
  `Patient_ID` int NOT NULL,
  `Drug_name` varchar(100) NOT NULL,
  `DurationAndFrequencyOfDrugUse` varchar(150) DEFAULT NULL,
  PRIMARY KEY (`Drug_ID`),
  KEY `ix_medhist_patient` (`Patient_ID`),
  CONSTRAINT `fk_medhist_patient` FOREIGN KEY (`Patient_ID`) REFERENCES `patient` (`Patient_ID`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `medicationhistory`
--

LOCK TABLES `medicationhistory` WRITE;
/*!40000 ALTER TABLE `medicationhistory` DISABLE KEYS */;
/*!40000 ALTER TABLE `medicationhistory` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `nurse`
--

DROP TABLE IF EXISTS `nurse`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `nurse` (
  `nurse_id` int NOT NULL AUTO_INCREMENT,
  `staff_id` int DEFAULT NULL,
  `department` varchar(30) DEFAULT NULL,
  PRIMARY KEY (`nurse_id`),
  KEY `idx_nurse_staff` (`staff_id`),
  CONSTRAINT `fk_nurse__staff` FOREIGN KEY (`staff_id`) REFERENCES `staff` (`staff_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `nurse`
--

LOCK TABLES `nurse` WRITE;
/*!40000 ALTER TABLE `nurse` DISABLE KEYS */;
INSERT INTO `nurse` VALUES (1,101,'Emergency'),(2,102,'ICU'),(3,103,'Pediatrics'),(4,104,'Orthopedics'),(5,105,'Cardiology');
/*!40000 ALTER TABLE `nurse` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `office`
--

DROP TABLE IF EXISTS `office`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `office` (
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `office`
--

LOCK TABLES `office` WRITE;
/*!40000 ALTER TABLE `office` DISABLE KEYS */;
INSERT INTO `office` VALUES (1,'Downtown Medical Center','Houston','TX','425 Main Street, Suite 100','77002',6,'7374928165'),(2,'Westside Family Clinic','Houston','TX','8920 Katy Freeway, Building B','77024',5,'7378797156'),(3,'Memorial Park Healthcare','Houston','TX','1550 Memorial Drive','77007',4,'713-555-0103'),(4,'Galleria Medical Plaza','Houston','TX','5085 Westheimer Road, Floor 3','77056',5,'713-555-0104');
/*!40000 ALTER TABLE `office` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `patient`
--

DROP TABLE IF EXISTS `patient`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `patient` (
  `patient_id` int NOT NULL AUTO_INCREMENT,
  `first_name` varchar(30) NOT NULL,
  `last_name` varchar(30) NOT NULL,
  `dob` date NOT NULL,
  `ssn` varchar(11) NOT NULL,
  `emergency_contact` varchar(15) DEFAULT NULL,
  `assigned_at_birth_gender` smallint NOT NULL,
  `gender` smallint DEFAULT NULL,
  `ethnicity` smallint DEFAULT NULL,
  `race` smallint DEFAULT NULL,
  `email` varchar(254) DEFAULT NULL,
  `consent_disclose` char(1) NOT NULL,
  `primary_doctor` int DEFAULT NULL,
  `specialty_doctor` int DEFAULT NULL,
  `insurance_id` int unsigned DEFAULT NULL,
  `insurance_provider` int unsigned DEFAULT NULL,
  `prescription` int DEFAULT NULL,
  `allergies` smallint DEFAULT NULL,
  `blood_type` enum('A+','A-','B+','B-','AB+','AB-','O+','O-') DEFAULT NULL,
  `payer_type` varchar(15) NOT NULL,
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
  CONSTRAINT `fk_patient__aab_gender` FOREIGN KEY (`assigned_at_birth_gender`) REFERENCES `codes_assigned_at_birth_gender` (`gender_code`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_patient__allergies` FOREIGN KEY (`allergies`) REFERENCES `codes_allergies` (`allergies_code`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_patient__ethnicity` FOREIGN KEY (`ethnicity`) REFERENCES `codes_ethnicity` (`ethnicity_code`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_patient__gender` FOREIGN KEY (`gender`) REFERENCES `codes_gender` (`gender_code`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_patient__insurance_plan` FOREIGN KEY (`insurance_provider`) REFERENCES `insurance_plan` (`plan_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_patient__insurance_record` FOREIGN KEY (`insurance_id`) REFERENCES `patient_insurance` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_patient__primary_doctor` FOREIGN KEY (`primary_doctor`) REFERENCES `doctor` (`doctor_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_patient__race` FOREIGN KEY (`race`) REFERENCES `codes_race` (`race_code`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_patient__specialty_doctor` FOREIGN KEY (`specialty_doctor`) REFERENCES `doctor` (`doctor_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `chk_consent_disclose` CHECK ((`consent_disclose` in (_utf8mb4'Y',_utf8mb4'N')))
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `patient`
--

LOCK TABLES `patient` WRITE;
/*!40000 ALTER TABLE `patient` DISABLE KEYS */;
INSERT INTO `patient` VALUES (1,'John','Smith','1985-03-15','123-45-6789','555-1001',1,1,2,1,'john.smith@email.com','Y',1,NULL,1,101,NULL,1,'O+','Private'),(2,'Maria','Garcia','1978-07-22','123-45-6790','555-1002',2,2,1,2,'maria.garcia@email.com','Y',3,NULL,2,102,NULL,NULL,'A+','Private'),(3,'David','Johnson','1992-11-30','123-45-6791','555-1003',1,1,2,1,'david.johnson@email.com','Y',1,NULL,3,105,NULL,NULL,'B+','Medicare'),(4,'Sarah','Williams','1980-05-14','123-45-6792','555-1004',2,2,2,1,'sarah.williams@email.com','Y',4,NULL,4,103,NULL,NULL,'AB-','Private'),(5,'Michael','Brown','1975-09-08','123-45-6793','555-1005',1,1,2,2,'michael.brown@email.com','Y',2,NULL,5,104,NULL,NULL,'O-','Private'),(6,'Jennifer','Davis','1988-12-25','123-45-6794','555-1006',2,2,2,1,'jennifer.davis@email.com','Y',5,NULL,6,101,NULL,NULL,'A-','Private'),(7,'Robert','Miller','1965-02-18','123-45-6795','555-1007',1,1,2,1,'robert.miller@email.com','Y',1,NULL,7,105,NULL,NULL,'B-','Medicare'),(8,'Lisa','Wilson','1990-08-11','123-45-6796','555-1008',2,2,1,3,'lisa.wilson@email.com','Y',3,NULL,8,102,NULL,NULL,'AB+','Private');
/*!40000 ALTER TABLE `patient` ENABLE KEYS */;
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
  CONSTRAINT `fk_pi_patient` FOREIGN KEY (`patient_id`) REFERENCES `patient` (`patient_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_pi_plan` FOREIGN KEY (`plan_id`) REFERENCES `insurance_plan` (`plan_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `chk_pi_coins_rate` CHECK (((`coinsurance_rate_pct` is null) or ((`coinsurance_rate_pct` >= 0) and (`coinsurance_rate_pct` <= 100)))),
  CONSTRAINT `chk_pi_copay` CHECK (((`copay` is null) or (`copay` >= 0))),
  CONSTRAINT `chk_pi_dates` CHECK (((`expiration_date` is null) or (`effective_date` <= `expiration_date`))),
  CONSTRAINT `chk_pi_deduct_fam` CHECK (((`deductible_family` is null) or (`deductible_family` >= 0))),
  CONSTRAINT `chk_pi_deduct_ind` CHECK ((`deductible_individ` >= 0))
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `patient_insurance`
--

LOCK TABLES `patient_insurance` WRITE;
/*!40000 ALTER TABLE `patient_insurance` DISABLE KEYS */;
INSERT INTO `patient_insurance` VALUES (1,1,101,'M123456789','G987654','2023-01-01','2024-12-31',1,25.00,1500.00,NULL,20.00),(2,2,102,'M123456790','G987655','2023-03-01','2024-12-31',1,20.00,2000.00,NULL,15.00),(3,3,105,'M123456791',NULL,'2022-06-01',NULL,1,15.00,500.00,NULL,10.00),(4,4,103,'M123456792','G987656','2023-02-15','2024-12-31',1,30.00,1000.00,NULL,25.00),(5,5,104,'M123456793','G987657','2023-01-01','2024-12-31',1,25.00,1500.00,NULL,20.00),(6,6,101,'M123456794',NULL,'2023-01-01',NULL,1,NULL,1500.00,NULL,NULL),(7,7,105,'M123456795',NULL,'2022-06-01',NULL,1,NULL,500.00,NULL,NULL),(8,8,102,'M123456796',NULL,'2023-03-01',NULL,1,NULL,2000.00,NULL,NULL);
/*!40000 ALTER TABLE `patient_insurance` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `patient_visit`
--

DROP TABLE IF EXISTS `patient_visit`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `patient_visit` (
  `visit_id` int NOT NULL AUTO_INCREMENT,
  `appointment_id` int DEFAULT NULL,
  `patient_id` int NOT NULL,
  `office_id` int DEFAULT NULL,
  `date` datetime DEFAULT NULL,
  `blood_pressure` varchar(7) DEFAULT NULL,
  `doctor_id` int DEFAULT NULL,
  `nurse_id` int DEFAULT NULL,
  `status` enum('Scheduled','Completed','Canceled','No-Show') DEFAULT NULL,
  `diagnosis` json DEFAULT NULL,
  `treatment` text,
  `reason_for_visit` varchar(300) DEFAULT NULL,
  `department` varchar(50) DEFAULT NULL,
  `amount_due` decimal(15,2) DEFAULT NULL,
  `payment` decimal(15,2) DEFAULT NULL,
  `total_due` decimal(15,2) DEFAULT NULL,
  `copay_amount_due` decimal(15,2) DEFAULT NULL,
  `treatment_cost_due` decimal(15,2) DEFAULT NULL,
  `consent_to_treatment` tinyint(1) DEFAULT NULL,
  `present_illnesses` json DEFAULT NULL,
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
  CONSTRAINT `chk_pv_amount_due` CHECK (((`amount_due` is null) or (`amount_due` >= 0))),
  CONSTRAINT `chk_pv_copay` CHECK (((`copay_amount_due` is null) or (`copay_amount_due` >= 0))),
  CONSTRAINT `chk_pv_payment` CHECK (((`payment` is null) or (`payment` >= 0))),
  CONSTRAINT `chk_pv_times` CHECK (((`end_at` is null) or (`start_at` is null) or (`start_at` <= `end_at`))),
  CONSTRAINT `chk_pv_total_due` CHECK (((`total_due` is null) or (`total_due` >= -(999999999999.99)))),
  CONSTRAINT `chk_pv_treatment_cost` CHECK (((`treatment_cost_due` is null) or (`treatment_cost_due` >= 0)))
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `patient_visit`
--

LOCK TABLES `patient_visit` WRITE;
/*!40000 ALTER TABLE `patient_visit` DISABLE KEYS */;
INSERT INTO `patient_visit` VALUES (1,1001,1,1,'2025-01-15 09:00:00','120/80',1,1,'Completed','[\"Hypertension\", \"Type 2 Diabetes\"]','Continue current medications, lifestyle modifications','Annual physical examination','Internal Medicine',150.00,25.00,125.00,25.00,125.00,1,'[\"Stable condition\"]',98.6,'2024-01-15 09:00:00','2024-01-15 09:45:00',1,'2025-10-23 04:41:08','Dr. Emily Chen','2025-10-23 04:41:08','Dr. Emily Chen'),(2,1002,3,3,'2025-01-16 14:00:00','118/76',1,2,'Completed','[\"Hyperlipidemia\"]','Start statin therapy, dietary changes','Follow-up consultation','Internal Medicine',120.00,15.00,105.00,15.00,105.00,1,'[\"Elevated cholesterol levels\"]',98.4,'2024-01-16 14:00:00','2024-01-16 14:30:00',3,'2025-10-23 04:41:08','Dr. Emily Chen','2025-10-23 04:41:08','Dr. Emily Chen'),(3,1003,5,1,'2025-01-15 10:30:00','130/85',2,5,'Completed','[\"Osteoarthritis\"]','Pain management, physical therapy referral','Cardiology checkup','Cardiology',200.00,25.00,175.00,25.00,175.00,1,'[\"Joint pain in knees\"]',98.2,'2024-01-15 10:30:00','2024-01-15 11:15:00',5,'2025-10-23 04:41:08','Dr. James Rodriguez','2025-10-23 04:41:08','Dr. James Rodriguez'),(15,1013,5,1,'2025-10-24 10:30:00','120/80',1,2,'Scheduled','[\"Mild Severity\", \"Flu\"]','Prescribed rest and hydration; recommended follow-up in one week.','Fever and cough','Internal Medicine',200.00,50.00,150.00,20.00,180.00,1,'{\"Cough\": true, \"Fever\": true}',99.5,'2025-10-24 10:30:00','2025-10-24 11:00:00',5,'2025-10-25 04:21:57','nurse.jane','2025-10-25 04:49:03',NULL),(16,1013,5,1,'2025-10-25 01:15:00','130/80',1,1,'Scheduled',NULL,NULL,NULL,'Internal Medicine',NULL,NULL,NULL,NULL,NULL,NULL,NULL,99.0,'2025-10-24 01:30:00',NULL,5,'2025-10-24 01:10:00',NULL,'2025-10-25 18:16:49',NULL);
/*!40000 ALTER TABLE `patient_visit` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `patientvisit`
--

DROP TABLE IF EXISTS `patientvisit`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `patientvisit` (
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
  CONSTRAINT `PatientVisit_chk_1` CHECK (((`End_at` is null) or (`Start_at` is null) or (`Start_at` <= `End_at`))),
  CONSTRAINT `PatientVisit_chk_2` CHECK (((`AmountDue` is null) or (`AmountDue` >= 0))),
  CONSTRAINT `PatientVisit_chk_3` CHECK (((`Payment` is null) or (`Payment` >= 0))),
  CONSTRAINT `PatientVisit_chk_4` CHECK (((`TotalDue` is null) or (`TotalDue` >= -(999999999999.99)))),
  CONSTRAINT `PatientVisit_chk_5` CHECK (((`CopayAmount_Due` is null) or (`CopayAmount_Due` >= 0))),
  CONSTRAINT `PatientVisit_chk_6` CHECK (((`TreatmentCost_Due` is null) or (`TreatmentCost_Due` >= 0)))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `patientvisit`
--

LOCK TABLES `patientvisit` WRITE;
/*!40000 ALTER TABLE `patientvisit` DISABLE KEYS */;
/*!40000 ALTER TABLE `patientvisit` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `prescription`
--

DROP TABLE IF EXISTS `prescription`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `prescription` (
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
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `prescription`
--

LOCK TABLES `prescription` WRITE;
/*!40000 ALTER TABLE `prescription` DISABLE KEYS */;
INSERT INTO `prescription` VALUES (1,1,1,1001,'Lisinopril','10mg','Once daily','Oral','2025-01-15',NULL,11,'For hypertension control','2025-10-23 04:41:08'),(2,1,1,1001,'Metformin','500mg','Twice daily','Oral','2024-05-19',NULL,11,'For diabetes management','2025-10-23 04:41:08'),(3,3,1,1002,'Atorvastatin','20mg','Once daily','Oral','2024-01-16',NULL,6,'For cholesterol management','2025-10-23 04:41:08'),(4,5,2,1003,'Ibuprofen','600mg','Three times daily as needed','Oral','2025-06-15','2024-10-15',2,'For osteoarthritis pain','2025-10-23 04:41:08'),(5,6,5,1009,'Sertraline','50mg','Once daily','Oral','2024-11-17',NULL,6,'For anxiety management','2025-10-23 04:41:08');
/*!40000 ALTER TABLE `prescription` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `referral`
--

DROP TABLE IF EXISTS `referral`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `referral` (
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
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `referral`
--

LOCK TABLES `referral` WRITE;
/*!40000 ALTER TABLE `referral` DISABLE KEYS */;
INSERT INTO `referral` VALUES (1,5,NULL,2,4,'Orthopedic consultation for knee pain',1008),(2,1,'2025-10-25',1,7,'Dermatology screening for skin rash',NULL),(3,4,'2025-10-16',4,2,'Cardiology evaluation for chest pain',NULL),(4,1,NULL,1,2,'Heart check ',NULL),(5,3,NULL,1,1,'test',NULL);
/*!40000 ALTER TABLE `referral` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `responsible_party`
--

DROP TABLE IF EXISTS `responsible_party`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `responsible_party` (
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `responsible_party`
--

LOCK TABLES `responsible_party` WRITE;
/*!40000 ALTER TABLE `responsible_party` DISABLE KEYS */;
INSERT INTO `responsible_party` VALUES (1,'Robert','Smith','A','1','TX','77002','Houston','555-2001'),(2,'Carlos','Garcia','B','2','TX','77024','Houston','555-2002'),(3,'Susan','Johnson',NULL,'3','TX','77007','Houston','555-2003');
/*!40000 ALTER TABLE `responsible_party` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `specialty`
--

DROP TABLE IF EXISTS `specialty`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `specialty` (
  `specialty_id` int NOT NULL AUTO_INCREMENT,
  `specialty_name` varchar(100) NOT NULL,
  PRIMARY KEY (`specialty_id`),
  UNIQUE KEY `ux_specialty_name` (`specialty_name`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `specialty`
--

LOCK TABLES `specialty` WRITE;
/*!40000 ALTER TABLE `specialty` DISABLE KEYS */;
INSERT INTO `specialty` VALUES (14,'Cardiology'),(13,'Dermatology'),(1,'Family Medicine'),(6,'General Dentistry'),(2,'General Practice'),(3,'Internal Medicine'),(12,'Mental Health Counseling'),(9,'Nurse Practitioner'),(7,'Nursing'),(17,'Nutrition and Dietetics'),(5,'Obstetrics and Gynecology'),(15,'Orthopedics'),(4,'Pediatrics'),(18,'Pharmacy'),(16,'Physical Therapy'),(8,'Physician Assistant'),(11,'Preventive Medicine'),(10,'Urgent Care');
/*!40000 ALTER TABLE `specialty` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `staff`
--

DROP TABLE IF EXISTS `staff`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `staff` (
  `staff_id` int NOT NULL AUTO_INCREMENT,
  `first_name` varchar(30) NOT NULL,
  `last_name` varchar(30) NOT NULL,
  `ssn` varchar(11) NOT NULL,
  `gender` smallint NOT NULL,
  `staff_email` varchar(50) NOT NULL,
  `work_location` int DEFAULT NULL,
  `staff_role` varchar(20) NOT NULL,
  `work_schedule` int DEFAULT NULL,
  `license_number` varchar(30) DEFAULT NULL,
  PRIMARY KEY (`staff_id`),
  UNIQUE KEY `ssn` (`ssn`),
  UNIQUE KEY `staff_email` (`staff_email`),
  KEY `idx_staff_gender` (`gender`),
  KEY `idx_staff_work_schedule` (`work_schedule`),
  KEY `idx_staff_work_location` (`work_location`),
  CONSTRAINT `fk_staff__gender` FOREIGN KEY (`gender`) REFERENCES `codes_gender` (`gender_code`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_staff__work_location` FOREIGN KEY (`work_location`) REFERENCES `office` (`office_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_staff__work_schedule` FOREIGN KEY (`work_schedule`) REFERENCES `work_schedule` (`schedule_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=205 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `staff`
--

LOCK TABLES `staff` WRITE;
/*!40000 ALTER TABLE `staff` DISABLE KEYS */;
INSERT INTO `staff` VALUES (101,'Jennifer','Taylor','987-65-4326',2,'j.taylor@medconnect.com',1,'Nurse',1,'RN123456'),(102,'Michael','Chen','987-65-4327',1,'m.chen@medconnect.com',1,'Nurse',2,'RN123457'),(103,'Sarah','Rodriguez','987-65-4328',2,'s.rodriguez@medconnect.com',2,'Nurse',1,'RN123458'),(104,'David','Anderson','987-65-4329',1,'d.anderson@medconnect.com',3,'Nurse',3,'RN123459'),(105,'Lisa','Martinez','987-65-4330',2,'l.martinez@medconnect.com',4,'Nurse',2,'RN123460'),(201,'Amanda','Wilson','987-65-4331',2,'a.wilson@medconnect.com',1,'Administrator',1,NULL),(202,'Christopher','Lee','987-65-4332',1,'c.lee@medconnect.com',2,'Receptionist',2,NULL),(204,'Daniel','Thompson','987-65-4334',1,'d.thompson@medconnect.com',4,'Receptionist',4,'RTT123456');
/*!40000 ALTER TABLE `staff` ENABLE KEYS */;
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
  `role` enum('ADMIN','DOCTOR','NURSE','PATIENT','RECEPTIONIST') DEFAULT NULL,
  `mfa_enabled` tinyint(1) NOT NULL DEFAULT '0',
  `last_login_at` datetime DEFAULT NULL,
  `failed_login_count` smallint unsigned NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `ux_user_username` (`username`),
  UNIQUE KEY `ux_user_email` (`email`),
  KEY `idx_user_last_login` (`last_login_at`),
  CONSTRAINT `chk_user_failed_login` CHECK ((`failed_login_count` >= 0))
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_account`
--

LOCK TABLES `user_account` WRITE;
/*!40000 ALTER TABLE `user_account` DISABLE KEYS */;
INSERT INTO `user_account` VALUES (1,'p101','john.smith@email.com','MedApp123!','ADMIN',0,NULL,0,1,'2025-10-22 04:54:59'),(2,'d201','echen@medconnect.com','MedApp123!','DOCTOR',0,NULL,0,1,'2025-10-22 04:54:59'),(3,'n301','tnguyen@medconnect.com','MedApp123!','NURSE',0,NULL,0,1,'2025-10-23 14:54:01'),(4,'a401','a.wilson@medconnect.com','MedApp123!','ADMIN',0,NULL,0,1,'2025-10-25 14:54:01'),(5,'p102','maria.garcia@email.com','MedApp123!','PATIENT',0,NULL,0,1,'2025-10-28 18:50:06');
/*!40000 ALTER TABLE `user_account` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vaccination_history`
--

DROP TABLE IF EXISTS `vaccination_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vaccination_history` (
  `vaccination_id` int NOT NULL AUTO_INCREMENT,
  `patient_id` int NOT NULL,
  `vaccination_name` varchar(100) NOT NULL,
  `date_of_vaccination` date NOT NULL,
  `date_for_booster` date DEFAULT NULL,
  PRIMARY KEY (`vaccination_id`),
  KEY `idx_vaxhist_patient` (`patient_id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vaccination_history`
--

LOCK TABLES `vaccination_history` WRITE;
/*!40000 ALTER TABLE `vaccination_history` DISABLE KEYS */;
INSERT INTO `vaccination_history` VALUES (1,1,'Influenza Vaccine','2023-10-15','2024-10-15'),(2,1,'COVID-19 Bivalent','2023-11-20','2024-11-20'),(3,2,'Influenza Vaccine','2023-10-20','2024-10-20'),(4,3,'Tetanus Booster','2022-05-10','2032-05-10'),(5,4,'Influenza Vaccine','2023-10-25','2024-10-25'),(6,5,'Shingles Vaccine','2023-09-15',NULL),(7,6,'HPV Vaccine','2023-08-10','2024-02-10'),(8,7,'Pneumococcal Vaccine','2023-07-20',NULL),(9,8,'Influenza Vaccine','2023-10-30','2024-10-30');
/*!40000 ALTER TABLE `vaccination_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vaccinationhistory`
--

DROP TABLE IF EXISTS `vaccinationhistory`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vaccinationhistory` (
  `VaccinationID` int NOT NULL AUTO_INCREMENT,
  `patient_id` int NOT NULL,
  `Vaccination_name` varchar(100) NOT NULL,
  `DateOfVaccination` date NOT NULL,
  `DateForBooster` date DEFAULT NULL,
  PRIMARY KEY (`VaccinationID`),
  KEY `ix_vaxhist_patient` (`patient_id`),
  CONSTRAINT `fk_vaxhist_patient` FOREIGN KEY (`patient_id`) REFERENCES `patient` (`Patient_ID`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vaccinationhistory`
--

LOCK TABLES `vaccinationhistory` WRITE;
/*!40000 ALTER TABLE `vaccinationhistory` DISABLE KEYS */;
/*!40000 ALTER TABLE `vaccinationhistory` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `work_schedule`
--

DROP TABLE IF EXISTS `work_schedule`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `work_schedule` (
  `schedule_id` int NOT NULL AUTO_INCREMENT,
  `office_id` int NOT NULL,
  `staff_id` int DEFAULT NULL,
  `doctor_id` int DEFAULT NULL,
  `nurse_id` int DEFAULT NULL,
  `days` date DEFAULT NULL,
  `start_time` time DEFAULT NULL,
  `end_time` time DEFAULT NULL,
  `day_of_week` enum('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday') DEFAULT NULL,
  PRIMARY KEY (`schedule_id`),
  KEY `idx_ws_office` (`office_id`),
  KEY `idx_ws_doctor` (`doctor_id`),
  KEY `idx_ws_nurse` (`nurse_id`),
  KEY `idx_ws_staff` (`staff_id`),
  KEY `idx_ws_daydate` (`day_of_week`,`days`),
  CONSTRAINT `fk_wsin__office` FOREIGN KEY (`office_id`) REFERENCES `office` (`office_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `chk_ws_times` CHECK (((`end_time` is null) or (`start_time` is null) or (`start_time` <= `end_time`)))
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `work_schedule`
--

LOCK TABLES `work_schedule` WRITE;
/*!40000 ALTER TABLE `work_schedule` DISABLE KEYS */;
INSERT INTO `work_schedule` VALUES (1,1,101,NULL,1,'2024-01-15','08:00:00','16:00:00','Monday'),(2,1,102,NULL,2,'2024-01-15','12:00:00','20:00:00','Monday'),(3,1,NULL,1,NULL,'2024-01-15','09:00:00','17:00:00','Monday'),(4,2,NULL,3,NULL,'2024-01-15','08:30:00','16:30:00','Monday'),(5,1,NULL,2,NULL,'2024-01-15','10:00:00','18:00:00','Monday'),(6,1,NULL,1,NULL,NULL,'09:00:00','17:00:00','Monday'),(7,2,NULL,1,NULL,NULL,'09:00:00','17:00:00','Tuesday'),(8,1,NULL,1,NULL,NULL,'09:00:00','17:00:00','Wednesday'),(9,2,NULL,1,NULL,NULL,'09:00:00','17:00:00','Thursday'),(10,1,NULL,1,NULL,NULL,'09:00:00','17:00:00','Friday'),(11,1,NULL,2,NULL,NULL,'08:00:00','16:00:00','Monday'),(12,1,NULL,2,NULL,NULL,'08:00:00','16:00:00','Wednesday'),(13,4,NULL,2,NULL,NULL,'10:00:00','18:00:00','Tuesday'),(14,4,NULL,2,NULL,NULL,'10:00:00','18:00:00','Thursday'),(15,4,NULL,2,NULL,NULL,'09:00:00','13:00:00','Friday');
/*!40000 ALTER TABLE `work_schedule` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-10-28 16:14:04
