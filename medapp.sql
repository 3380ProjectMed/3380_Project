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
) ENGINE=InnoDB AUTO_INCREMENT=1045 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `appointment`
--

LOCK TABLES `appointment` WRITE;
/*!40000 ALTER TABLE `appointment` DISABLE KEYS */;
INSERT INTO `appointment` VALUES (1001,1,1,1,'2025-11-07 11:00:00','2025-10-20 14:30:00','Annual physical examination','Scheduled'),(1002,3,1,1,'2025-11-05 14:00:00','2025-10-02 16:45:00','Follow-up consultation','Scheduled'),(1003,5,1,1,'2025-11-15 10:30:00','2023-12-22 09:15:00','Cardiology checkup','Scheduled'),(1004,7,2,4,'2025-11-17 11:00:00','2024-01-08 14:25:00','Heart condition monitoring','Scheduled'),(1006,8,3,2,'2025-11-18 15:45:00','2024-01-11 12:15:00','Vaccination','Scheduled'),(1007,4,4,3,'2025-11-16 08:45:00','2023-12-28 11:20:00','Orthopedic consultation','Scheduled'),(1008,1,1,1,'2025-11-04 16:00:00','2025-01-09 17:40:00','Knee pain evaluation','Scheduled'),(1009,6,5,4,'2024-11-17 09:30:00','2024-01-05 08:30:00','OB/GYN appointment','Scheduled'),(1010,3,1,4,'2025-11-11 10:00:00','2024-01-12 09:50:00','Internal medicine consultation','Scheduled'),(1011,4,7,4,'2024-01-19 14:30:00','2024-01-15 16:20:00','Dermatology screening','Scheduled'),(1012,4,1,2,'2025-11-06 09:00:00','2025-10-20 09:00:00','Follow-up consultation','In Progress'),(1013,5,1,1,'2025-11-06 13:00:00','2025-10-23 10:00:00','TEST','In Progress'),(1014,1,1,1,'2025-11-07 16:00:00','2025-11-03 22:34:36','test trigger','Scheduled'),(1015,2,6,1,'2025-11-10 11:00:00','2025-11-03 22:34:36','Vaccination','Scheduled'),(1016,2,1,4,'2026-08-24 11:00:00','2025-11-03 22:34:36','Some weird reason idk','Scheduled'),(1017,7,1,1,'2025-11-10 10:00:00','2025-11-11 01:33:01','Health Check-up','Scheduled'),(1018,7,1,1,'2025-11-10 12:00:00','2025-11-11 01:34:02','TEST','Scheduled'),(1019,7,1,1,'2025-11-11 09:00:00','2025-11-11 01:48:37','TEST','Scheduled'),(1020,1,1,1,'2025-10-29 09:00:00','2025-10-15 14:30:00','Annual physical examination','Scheduled'),(1021,2,1,2,'2025-10-29 10:30:00','2025-10-16 09:15:00','Hypertension follow-up','Scheduled'),(1022,3,2,1,'2025-10-29 14:00:00','2025-10-17 16:45:00','Diabetes management','Scheduled'),(1023,4,3,3,'2025-10-30 11:15:00','2025-10-18 10:20:00','Pediatric wellness check','Scheduled'),(1024,5,4,2,'2025-10-30 15:30:00','2025-10-19 08:50:00','Cardiology follow-up','Scheduled'),(1025,6,5,1,'2025-10-31 08:45:00','2025-10-20 13:25:00','Dermatology screening','Scheduled'),(1026,7,6,3,'2025-10-31 13:20:00','2025-10-21 11:10:00','Orthopedic consultation','Scheduled'),(1027,8,1,2,'2025-11-03 10:00:00','2025-10-22 15:40:00','Vaccination','Scheduled'),(1028,9,2,1,'2025-11-03 16:15:00','2025-10-23 12:30:00','Mental health therapy','Scheduled'),(1029,10,3,3,'2025-11-04 09:30:00','2025-10-24 14:15:00','Prenatal checkup','Scheduled'),(1030,11,1,2,'2025-11-04 14:45:00','2025-10-25 10:05:00','Allergy testing','Scheduled'),(1031,12,2,1,'2025-11-05 11:30:00','2025-10-26 16:20:00','Sports physical','Scheduled'),(1032,13,3,3,'2025-11-05 15:00:00','2025-10-27 09:30:00','Eye examination','Scheduled'),(1033,14,4,2,'2025-11-06 10:45:00','2025-10-28 14:50:00','Nutrition counseling','Scheduled'),(1034,15,5,1,'2025-11-10 13:15:00','2025-10-29 11:25:00','Lab results follow-up','Scheduled'),(1035,16,6,3,'2025-11-11 08:30:00','2025-10-30 15:10:00','Medication review','Scheduled'),(1036,17,7,2,'2025-11-12 09:00:00','2025-11-01 10:40:00','Urgent care','Scheduled'),(1037,18,1,1,'2025-11-12 09:15:00','2025-11-02 13:15:00','Blood work','Scheduled'),(1038,19,2,3,'2025-11-13 10:30:00','2025-11-03 08:45:00','Physical therapy','Scheduled'),(1039,20,3,2,'2025-11-14 14:00:00','2025-11-04 12:20:00','Surgical clearance','Scheduled'),(1040,21,4,1,'2025-11-17 16:45:00','2025-11-05 14:35:00','Pain management','Scheduled'),(1041,22,2,3,'2025-11-18 08:00:00','2025-11-06 09:50:00','STD testing','Scheduled'),(1042,23,3,2,'2025-11-19 11:20:00','2025-11-07 16:25:00','Geriatric assessment','Scheduled'),(1043,24,4,1,'2025-11-20 13:40:00','2025-11-08 10:15:00','Weight management','Scheduled'),(1044,25,1,3,'2025-11-21 15:10:00','2025-11-09 08:30:00','Post-operative follow-up','Scheduled');
/*!40000 ALTER TABLE `appointment` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`aad_mysql_medapp`@`%`*/ /*!50003 TRIGGER `trg_appointment_check_referral` BEFORE INSERT ON `appointment` FOR EACH ROW BEGIN
    DECLARE patient_pcp_id INT;
    
    -- Get the patient's Primary Care Physician
    SELECT Primary_Doctor INTO patient_pcp_id
    FROM Patient
    WHERE Patient_ID = NEW.Patient_id;
    
    -- If trying to book with a doctor who is NOT their PCP, block it
    IF patient_pcp_id IS NOT NULL AND NEW.Doctor_id != patient_pcp_id THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'You must have a referral to book an appointment with a specialist. Please contact your primary care physician.';
    END IF;
    
    -- Set status to Confirmed
    SET NEW.Status = 'Scheduled';
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

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
-- Table structure for table `doctor`
--

DROP TABLE IF EXISTS `doctor`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `doctor` (
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `doctor`
--

LOCK TABLES `doctor` WRITE;
/*!40000 ALTER TABLE `doctor` DISABLE KEYS */;
INSERT INTO `doctor` VALUES (1,205,3,'737-492-0001'),(2,206,14,'737-492-8102'),(3,207,4,'737-879-7010'),(4,208,15,'737-879-7102'),(5,209,5,'737-492-8103'),(6,210,3,'737-879-7103'),(7,211,13,'737-492-8104');
/*!40000 ALTER TABLE `doctor` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `emergency_contact`
--

DROP TABLE IF EXISTS `emergency_contact`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `emergency_contact` (
  `emergency_contact_id` int NOT NULL AUTO_INCREMENT,
  `patient_id` int NOT NULL,
  `ec_first_name` varchar(30) NOT NULL,
  `ec_last_name` varchar(30) NOT NULL,
  `ec_phone` varchar(15) NOT NULL,
  `relationship` varchar(30) NOT NULL,
  PRIMARY KEY (`emergency_contact_id`),
  KEY `idx_ec_patient` (`patient_id`),
  CONSTRAINT `fk_ec__patient` FOREIGN KEY (`patient_id`) REFERENCES `patient` (`patient_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `emergency_contact`
--

LOCK TABLES `emergency_contact` WRITE;
/*!40000 ALTER TABLE `emergency_contact` DISABLE KEYS */;
INSERT INTO `emergency_contact` VALUES (1,10,'Ben','Thomas','5551234567','Father'),(2,2,'Elena','Orozco','713555555','Sister');
/*!40000 ALTER TABLE `emergency_contact` ENABLE KEYS */;
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
  `copay` decimal(10,2) DEFAULT NULL,
  `deductible_individual` decimal(10,2) DEFAULT NULL,
  `coinsurance_rate` decimal(5,2) DEFAULT NULL,
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
INSERT INTO `insurance_plan` VALUES (101,1,'BCBS Gold','PPO','{\"requires_referral\": false, \"primary_care_required\": false, \"out_of_network_coverage\": true}',25.00,500.00,15.00),(102,1,'BCBS Silver','HMO','{\"requires_referral\": true, \"primary_care_required\": true, \"out_of_network_coverage\": false}',20.00,1000.00,20.00),(103,2,'Aetna Premier','PPO','{\"requires_referral\": false, \"primary_care_required\": false, \"out_of_network_coverage\": true}',15.00,1500.00,25.00),(104,3,'UHC Choice Plus','PPO','{\"requires_referral\": false, \"primary_care_required\": false, \"out_of_network_coverage\": true}',20.00,2000.00,20.00),(105,4,'Medicare Part B','Medicare','{\"requires_referral\": false, \"primary_care_required\": false, \"out_of_network_coverage\": false}',25.00,240.00,10.00);
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
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `nurse`
--

LOCK TABLES `nurse` WRITE;
/*!40000 ALTER TABLE `nurse` DISABLE KEYS */;
INSERT INTO `nurse` VALUES (1,101,'Emergency'),(2,102,'ICU'),(3,103,'Pediatrics'),(4,104,'Orthopedics'),(5,105,'Cardiology'),(6,106,'General');
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
) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `patient`
--

LOCK TABLES `patient` WRITE;
/*!40000 ALTER TABLE `patient` DISABLE KEYS */;
INSERT INTO `patient` VALUES (1,'John','Smith','1985-03-15','123-45-6789',1,1,2,1,'john.smith@email.com',NULL,1,NULL,1,101,NULL,1,'O+'),(2,'Maria','Garcia','2020-07-22','123-45-6790',2,2,1,2,'maria.garcia@email.com',2,1,NULL,2,102,NULL,20,'A+'),(3,'David','Johnson','1992-11-30','123-45-6791',1,1,2,1,'david.johnson@email.com',NULL,2,NULL,3,105,NULL,3,'B+'),(4,'Sarah','Williams','1980-05-14','123-45-6792',2,2,2,1,'sarah.williams@email.com',NULL,3,NULL,4,103,NULL,NULL,'AB-'),(5,'Michael','Brown','1975-09-08','123-45-6793',1,1,2,2,'michael.brown@email.com',NULL,4,NULL,5,104,NULL,NULL,'O-'),(6,'Jennifer','Davis','1988-12-25','123-45-6794',2,2,2,1,'jennifer.davis@email.com',NULL,5,NULL,6,101,NULL,NULL,'A-'),(7,'Robert','Miller','1965-02-18','123-45-6795',1,1,2,1,'robert.miller@email.com',NULL,6,NULL,7,105,NULL,NULL,'B-'),(8,'Lisa','Wilson','1990-08-11','123-45-6796',2,2,1,3,'lisa.wilson@email.com',NULL,1,NULL,8,102,NULL,NULL,'AB+'),(9,'Emaad','Rahman','2000-02-01','123-49-6512',1,1,NULL,NULL,'emaad980@gmail.com',NULL,2,NULL,NULL,NULL,NULL,NULL,NULL),(10,'Kathiana','Rodriguez','2003-01-03','TEMP0000010',2,2,1,1,'kathiana119@gmail.com',NULL,3,NULL,NULL,NULL,NULL,NULL,NULL),(11,'Bartholomew','Fitzgerald','1972-04-18','476-78-9012',1,1,1,1,'bart.fitz@email.com',NULL,1,NULL,NULL,NULL,NULL,NULL,'A+'),(12,'Guinevere','Pembroke','1985-11-03','565-89-0123',2,2,1,1,'g.pembroke@email.com',NULL,2,NULL,NULL,NULL,NULL,NULL,'B+'),(13,'Theodore','Montgomery','1968-07-22','670-90-1234',1,1,1,1,'ted.montgomery@email.com',NULL,3,NULL,NULL,NULL,NULL,NULL,'O+'),(14,'Seraphina','Whitaker','1991-02-14','719-01-2345',2,2,1,1,'sera.whitaker@email.com',NULL,4,NULL,NULL,NULL,NULL,NULL,'AB-'),(15,'Percival','Harrington','1979-09-08','870-12-3456',1,1,1,1,'percy.h@email.com',NULL,5,NULL,NULL,NULL,NULL,NULL,'A-'),(16,'Lysandra','Blackwood','1988-12-25','931-23-4567',2,2,1,1,'lysandra.b@email.com',NULL,6,NULL,NULL,NULL,NULL,NULL,'O-'),(17,'Alistair','Kensington','1965-05-30','212-34-5678',1,1,1,1,'alistair.k@email.com',NULL,7,NULL,NULL,NULL,NULL,NULL,'B+'),(18,'Gwendolyn','Ashworth','1993-08-11','128-45-6789',2,2,1,1,'gwen.ashworth@email.com',NULL,1,NULL,NULL,NULL,NULL,NULL,'A+'),(19,'Phineas','Worthington','1977-01-19','234-56-7890',1,1,1,1,'phineas.w@email.com',NULL,2,NULL,NULL,NULL,NULL,NULL,'O+'),(20,'Cordelia','Fairchild','1983-06-07','345-67-8901',2,2,1,1,'cordelia.f@email.com',NULL,3,NULL,NULL,NULL,NULL,NULL,'B-'),(21,'Benedict','Kingsley','1990-03-26','456-88-9012',1,1,1,1,'ben.kingsley@email.com',NULL,4,NULL,NULL,NULL,NULL,NULL,'AB+'),(22,'Octavia','Rutherford','1974-10-13','569-89-0123',2,2,1,1,'octavia.r@email.com',NULL,2,NULL,NULL,NULL,NULL,NULL,'A+'),(23,'Sebastian','Hawthorne','1986-12-09','688-90-1234',1,1,1,1,'seb.hawthorne@email.com',NULL,3,NULL,NULL,NULL,NULL,NULL,'O-'),(24,'Persephone','Vance','1995-07-04','799-01-2345',2,2,1,1,'persephone.v@email.com',NULL,4,NULL,NULL,NULL,NULL,NULL,'B+'),(25,'Atticus','Pemberton','1969-04-21','890-12-7456',1,1,1,1,'atticus.p@email.com',NULL,1,NULL,NULL,NULL,NULL,NULL,'A-');
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
  PRIMARY KEY (`id`),
  UNIQUE KEY `ux_patient_plan_member` (`patient_id`,`plan_id`,`member_id`),
  KEY `idx_pi_patient` (`patient_id`),
  KEY `idx_pi_plan` (`plan_id`),
  KEY `idx_pi_patient_dates` (`patient_id`,`effective_date`,`expiration_date`),
  CONSTRAINT `fk_pi_patient` FOREIGN KEY (`patient_id`) REFERENCES `patient` (`patient_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_pi_plan` FOREIGN KEY (`plan_id`) REFERENCES `insurance_plan` (`plan_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `chk_pi_dates` CHECK (((`expiration_date` is null) or (`effective_date` <= `expiration_date`)))
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `patient_insurance`
--

LOCK TABLES `patient_insurance` WRITE;
/*!40000 ALTER TABLE `patient_insurance` DISABLE KEYS */;
INSERT INTO `patient_insurance` VALUES (1,1,101,'M123456789','G987654','2024-01-01','2025-12-31',1),(2,2,102,'M123456790','G987655','2024-03-01','2025-12-31',1),(3,3,105,'M123456791','G987658','2024-06-01','2025-12-31',1),(4,4,103,'M123456792','G987656','2024-02-15','2025-12-31',1),(5,5,104,'M123456793','G987657','2024-01-01','2025-12-31',1),(6,6,101,'M123456794','G987659','2024-01-01','2025-12-31',1),(7,7,105,'M123456795','G987660','2024-06-01','2025-12-31',1),(8,8,102,'M123456796','G987661','2024-03-01','2025-12-31',1);
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
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `patient_visit`
--

LOCK TABLES `patient_visit` WRITE;
/*!40000 ALTER TABLE `patient_visit` DISABLE KEYS */;
INSERT INTO `patient_visit` VALUES (1,1001,1,1,'2025-01-15 09:00:00','120/80',1,1,'Completed','[\"Hypertension\", \"Type 2 Diabetes\"]','Annual physical examination','Internal Medicine',NULL,NULL,25.00,125.00,1,'[\"Stable condition\"]',98.6,'2024-01-15 09:00:00','2024-01-15 09:45:00',1,'2025-10-23 04:41:08','Dr. Emily Chen','2025-11-10 23:14:28','Dr. Emily Chen'),(2,1002,3,3,'2025-01-16 14:00:00','118/76',1,2,'Completed','[\"Hyperlipidemia\"]','Follow-up consultation','Internal Medicine',15.00,NULL,15.00,105.00,1,'[\"Elevated cholesterol levels\"]',98.4,'2024-01-16 14:00:00','2024-01-16 14:30:00',3,'2025-10-23 04:41:08','Dr. Emily Chen','2025-10-23 04:41:08','Dr. Emily Chen'),(3,1003,5,1,'2025-01-15 10:30:00','130/85',2,3,'Completed','[\"Osteoarthritis\"]','Cardiology checkup','Cardiology',25.00,NULL,25.00,175.00,1,'[\"Joint pain in knees\"]',98.2,'2024-01-15 10:30:00','2024-01-15 11:15:00',5,'2025-10-23 04:41:08','Dr. James Rodriguez','2025-11-06 20:09:25','Dr. James Rodriguez'),(5,1014,1,1,'2025-11-07 12:00:00','120/80',1,1,'Scheduled','flu',NULL,NULL,25.00,'cash',25.00,230.00,NULL,'cough',99.2,'2025-11-07 12:00:00',NULL,1,'2025-11-07 18:06:42',NULL,'2025-11-10 23:12:44','Daniel Thompson'),(15,1013,5,1,'2025-11-03 10:30:00','120/80',1,1,'Scheduled','[\"Mild Severity\", \"Flu\"]','Fever and cough','Internal Medicine',50.00,NULL,25.00,180.00,1,'{\"Cough\": true, \"Fever\": true}',99.5,'2025-10-24 10:30:00','2025-10-24 11:00:00',5,'2025-10-25 04:21:57','nurse.jane','2025-11-08 21:49:45',NULL),(16,1004,5,1,'2025-11-04 01:15:00','130/80',1,2,'Scheduled',NULL,NULL,'Internal Medicine',NULL,NULL,NULL,NULL,NULL,NULL,99.0,'2025-10-24 01:30:00',NULL,5,'2025-10-24 01:10:00',NULL,'2025-11-11 00:43:35',NULL),(17,1016,2,3,'2025-10-25 02:15:00','120/80',3,1,'Completed','[\"Migraine\"]','Migraines','Internal Medicine',0.00,NULL,20.00,50.00,1,NULL,NULL,NULL,NULL,2,'2025-11-06 06:17:07',NULL,'2025-11-10 16:51:04',NULL),(18,1002,3,1,'2025-11-12 14:00:00',NULL,NULL,6,'Scheduled',NULL,NULL,'General',NULL,NULL,25.00,NULL,NULL,NULL,NULL,'2025-11-12 14:00:00',NULL,3,'2025-11-06 20:09:25',NULL,'2025-11-10 16:51:04',NULL),(19,1010,3,2,'2025-11-11 10:00:00',NULL,NULL,6,'Scheduled',NULL,NULL,'General',NULL,NULL,25.00,NULL,NULL,NULL,NULL,'2025-11-11 10:00:00',NULL,3,'2025-11-06 20:09:25',NULL,'2025-11-10 16:51:04',NULL);
/*!40000 ALTER TABLE `patient_visit` ENABLE KEYS */;
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
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `prescription`
--

LOCK TABLES `prescription` WRITE;
/*!40000 ALTER TABLE `prescription` DISABLE KEYS */;
INSERT INTO `prescription` VALUES (1,1,1,1001,'Lisinopril','10mg','Once daily','Oral','2025-01-15','2025-11-01',11,'For hypertension control','2025-10-23 04:41:08'),(2,1,1,1001,'Metformin','500mg','Twice daily','Oral','2024-05-19',NULL,11,'For diabetes management','2025-10-23 04:41:08'),(3,3,1,1002,'Atorvastatin','20mg','Once daily','Oral','2024-01-16',NULL,6,'For cholesterol management','2025-10-23 04:41:08'),(4,5,2,1003,'Ibuprofen','600mg','Three times daily as needed','Oral','2025-06-15','2024-10-15',2,'For osteoarthritis pain','2025-10-23 04:41:08'),(5,6,5,1009,'Sertraline','50mg','Once daily','Oral','2024-11-17',NULL,6,'For anxiety management','2025-10-23 04:41:08'),(6,1,1,1014,'medication test','200','2','Oral','2025-11-08','2025-11-10',1,'none','2025-11-08 01:44:24');
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
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `referral`
--

LOCK TABLES `referral` WRITE;
/*!40000 ALTER TABLE `referral` DISABLE KEYS */;
INSERT INTO `referral` VALUES (1,5,NULL,2,4,'Orthopedic consultation for knee pain',1008),(2,1,'2025-10-25',1,7,'Dermatology screening for skin rash',NULL),(3,4,'2025-10-16',4,2,'Cardiology evaluation for chest pain',NULL),(4,1,NULL,1,2,'Heart check ',NULL),(5,3,NULL,1,1,'test',NULL),(6,3,'2025-11-04',1,2,'heart test',NULL),(7,5,'2025-11-04',2,1,'internal test',NULL),(8,1,'2025-11-04',1,2,'heart',NULL);
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
) ENGINE=InnoDB AUTO_INCREMENT=212 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `staff`
--

LOCK TABLES `staff` WRITE;
/*!40000 ALTER TABLE `staff` DISABLE KEYS */;
INSERT INTO `staff` VALUES (101,'Jennifer','Taylor','987-65-4326',2,'j.taylor@medconnect.com',1,'Nurse',1,'RN123456'),(102,'Michael','Chen','987-65-4327',1,'m.chen@medconnect.com',1,'Nurse',2,'RN123457'),(103,'Sarah','Rodriguez','987-65-4328',2,'s.rodriguez@medconnect.com',2,'Nurse',1,'RN123458'),(104,'David','Anderson','987-65-4329',1,'d.anderson@medconnect.com',3,'Nurse',3,'RN123459'),(105,'Lisa','Martinez','987-65-4330',2,'l.martinez@medconnect.com',4,'Nurse',2,'RN123460'),(106,'Tina','Nguyen','987-65-4335',2,'tnguyen@medconnect.com',1,'Nurse',NULL,'RN123461'),(201,'Amanda','Wilson','987-65-4331',2,'a.wilson@medconnect.com',1,'Administrator',1,NULL),(202,'Christopher','Lee','987-65-4332',1,'c.lee@medconnect.com',2,'Receptionist',2,NULL),(204,'Daniel','Thompson','987-65-4334',1,'d.thompson@medconnect.com',1,'Receptionist',4,'RTT123456'),(205,'Emily','Chen','123-45-6781',2,'echen@medconnect.com',1,'Doctor',NULL,'TXMD123456'),(206,'James','Rodriguez','123-45-6782',1,'jrodriguez@medconnect.com',1,'Doctor',NULL,'TXMD123457'),(207,'Susan','Lee','123-45-6783',2,'slee@medconnect.com',2,'Doctor',NULL,'TXMD123458'),(208,'Richard','Patel','123-45-6784',1,'rpatel@medconnect.com',3,'Doctor',NULL,'TXMD123459'),(209,'Maria','Garcia','123-45-6785',2,'mgarcia@medconnect.com',4,'Doctor',NULL,'TXMD123460'),(210,'David','Kim','123-45-6786',1,'dkim@medconnect.com',2,'Doctor',NULL,'TXMD123461'),(211,'Lisa','Wong','123-45-6787',2,'lwong@medconnect.com',4,'Doctor',NULL,'TXMD123462');
/*!40000 ALTER TABLE `staff` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `treatment_catalog`
--

DROP TABLE IF EXISTS `treatment_catalog`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `treatment_catalog` (
  `treatment_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `cpt_code` varchar(10) DEFAULT NULL,
  `cost` decimal(10,2) DEFAULT NULL,
  `specialty` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`treatment_id`)
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `treatment_catalog`
--

LOCK TABLES `treatment_catalog` WRITE;
/*!40000 ALTER TABLE `treatment_catalog` DISABLE KEYS */;
INSERT INTO `treatment_catalog` VALUES (1,'Office Visit - Established (15 min)','99213',125.00,'Internal Medicine'),(2,'Office Visit - Established (25 min)','99214',175.00,'Internal Medicine'),(3,'Office Visit - Established (40 min)','99215',225.00,'Internal Medicine'),(4,'Office Visit - New Patient (30 min)','99203',200.00,'Internal Medicine'),(5,'Office Visit - New Patient (45 min)','99204',275.00,'Internal Medicine'),(6,'Annual Physical - Under 40','99395',185.00,'Internal Medicine'),(7,'Annual Physical - 40-64 years','99396',215.00,'Internal Medicine'),(8,'Annual Physical - 65+ years','99397',245.00,'Internal Medicine'),(9,'EKG - 12 Lead','93000',85.00,'Internal Medicine'),(10,'Pulmonary Function Test','94010',120.00,'Internal Medicine'),(11,'Ear Wax Removal','69210',75.00,'Internal Medicine'),(12,'Wart Removal - Single','17110',95.00,'Internal Medicine'),(13,'Vitamin B12 Injection','96372',25.00,'Internal Medicine'),(14,'Corticosteroid Injection','96372',35.00,'Internal Medicine'),(15,'Flu Vaccine Administration','90471',25.00,'Internal Medicine'),(16,'Tetanus Shot Administration','90471',25.00,'Internal Medicine'),(17,'Rapid Flu Test','87804',55.00,'Internal Medicine'),(18,'Urinalysis - Dipstick','81002',25.00,'Internal Medicine'),(19,'Blood Glucose Test','82947',15.00,'Internal Medicine'),(20,'Diabetes Education','G0108',85.00,'Internal Medicine'),(21,'Smoking Cessation Counseling','99406',65.00,'Internal Medicine'),(22,'Wound Care - Simple','12001',125.00,'Internal Medicine'),(23,'Ingrown Toenail Removal','11750',90.00,'Internal Medicine');
/*!40000 ALTER TABLE `treatment_catalog` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `treatment_per_visit`
--

DROP TABLE IF EXISTS `treatment_per_visit`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `treatment_per_visit` (
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
) ENGINE=InnoDB AUTO_INCREMENT=33 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `treatment_per_visit`
--

LOCK TABLES `treatment_per_visit` WRITE;
/*!40000 ALTER TABLE `treatment_per_visit` DISABLE KEYS */;
INSERT INTO `treatment_per_visit` (`visit_treatment_id`, `visit_id`, `treatment_id`, `quantity`, `cost_each`, `notes`) VALUES (1,1,6,1,215.00,'Annual physical for established patient'),(2,1,16,1,35.00,'Routine A1c monitoring'),(3,1,17,1,15.00,'Fasting glucose check'),(4,2,1,1,125.00,'Follow-up for cholesterol management'),(5,2,18,1,65.00,'Lipid panel ordered'),(6,3,2,1,175.00,'Cardiology consultation'),(7,3,9,1,85.00,'Routine EKG'),(8,3,13,1,35.00,'Joint injection for pain'),(9,15,1,1,125.00,'Sick visit for flu symptoms'),(10,15,19,1,55.00,'Rapid influenza test'),(11,15,21,1,25.00,'Symptomatic relief'),(12,16,1,1,125.00,'Routine follow-up'),(31,5,7,1,215.00,''),(32,5,19,1,15.00,'');
/*!40000 ALTER TABLE `treatment_per_visit` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`aad_mysql_medapp`@`%`*/ /*!50003 TRIGGER `set_treatment_cost_before_insert` BEFORE INSERT ON `treatment_per_visit` FOR EACH ROW BEGIN
    -- If cost_each is not provided or is 0, fetch it from treatment_catalog
    IF NEW.cost_each IS NULL OR NEW.cost_each = 0 THEN
        SET NEW.cost_each = (
            SELECT cost 
            FROM treatment_catalog 
            WHERE treatment_id = NEW.treatment_id
        );
    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`aad_mysql_medapp`@`%`*/ /*!50003 TRIGGER `update_treatment_cost_after_insert` AFTER INSERT ON `treatment_per_visit` FOR EACH ROW BEGIN
    UPDATE patient_visit
    SET treatment_cost_due = (
        SELECT COALESCE(SUM(total_cost), 0)
        FROM treatment_per_visit
        WHERE visit_id = NEW.visit_id
    )
    WHERE visit_id = NEW.visit_id;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`aad_mysql_medapp`@`%`*/ /*!50003 TRIGGER `update_treatment_cost_due` AFTER INSERT ON `treatment_per_visit` FOR EACH ROW BEGIN
    UPDATE patient_visit 
    SET treatment_cost_due = (
        SELECT COALESCE(SUM(total_cost), 0) 
        FROM treatment_per_visit 
        WHERE visit_id = NEW.visit_id
    ) - COALESCE(copay_amount_due, 0)
    WHERE visit_id = NEW.visit_id;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `user_account`
--

DROP TABLE IF EXISTS `user_account`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_account` (
  `user_id` int NOT NULL,
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_account`
--

LOCK TABLES `user_account` WRITE;
/*!40000 ALTER TABLE `user_account` DISABLE KEYS */;
INSERT INTO `user_account` VALUES (1,'p101','john.smith@email.com','$2y$12$mvBaL8ar53TL1LXEbqK4eeVOa8jPs922vF3dVcWRRR36uP0Dvhqx2','PATIENT',0,'2025-11-11 02:00:09',0,1,'2025-10-22 04:54:59','2025-11-11 02:00:09'),(2,'p102','maria.garcia@email.com','$2y$12$mvBaL8ar53TL1LXEbqK4eeVOa8jPs922vF3dVcWRRR36uP0Dvhqx2','PATIENT',0,'2025-11-11 05:43:39',0,1,'2025-10-28 18:50:06','2025-11-11 05:43:39'),(9,'emaad980','emaad980@gmail.com','$2y$12$Cs7Vap7sWXRfkbcjniOAU.P6I2oKa81asl1qPEYS0Ih8uEiz0o1s2','PATIENT',0,'2025-11-01 20:39:30',0,1,'2025-11-01 20:27:29','2025-11-08 22:34:42'),(10,'kathiana119','kathiana119@gmail.com','$2y$12$g34AFS8Sjji2SLi.EvTltevK991t6CfDs4QNMg0cevjgxWgHMy.cO','PATIENT',0,'2025-11-04 00:25:55',0,1,'2025-11-04 00:25:39','2025-11-08 22:34:42'),(106,'n301','tnguyen@medconnect.com','$2y$12$mvBaL8ar53TL1LXEbqK4eeVOa8jPs922vF3dVcWRRR36uP0Dvhqx2','NURSE',0,'2025-11-11 01:59:33',0,1,'2025-10-23 14:54:01','2025-11-11 01:59:33'),(201,'a401','a.wilson@medconnect.com','$2y$12$mvBaL8ar53TL1LXEbqK4eeVOa8jPs922vF3dVcWRRR36uP0Dvhqx2','ADMIN',0,'2025-11-11 03:56:55',0,1,'2025-10-25 14:54:01','2025-11-11 03:56:55'),(204,'r501','d.thompson@medconnect.com','$2y$12$mvBaL8ar53TL1LXEbqK4eeVOa8jPs922vF3dVcWRRR36uP0Dvhqx2','RECEPTIONIST',0,'2025-11-11 05:33:01',0,1,'2025-11-06 00:39:39','2025-11-11 05:33:01'),(205,'d201','echen@medconnect.com','$2y$12$mvBaL8ar53TL1LXEbqK4eeVOa8jPs922vF3dVcWRRR36uP0Dvhqx2','DOCTOR',0,'2025-11-11 05:29:36',0,1,'2025-10-22 04:54:59','2025-11-11 05:29:36'),(206,'d202','jrodriguez@medconnect.com','$2y$12$mvBaL8ar53TL1LXEbqK4eeVOa8jPs922vF3dVcWRRR36uP0Dvhqx2','DOCTOR',0,'2025-11-04 20:36:49',0,1,'2025-11-04 00:25:39','2025-11-08 22:34:41');
/*!40000 ALTER TABLE `user_account` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`medroot`@`%`*/ /*!50003 TRIGGER `trg_user_account_update` BEFORE UPDATE ON `user_account` FOR EACH ROW BEGIN
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
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `user_account_backup`
--

DROP TABLE IF EXISTS `user_account_backup`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_account_backup` (
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_account_backup`
--

LOCK TABLES `user_account_backup` WRITE;
/*!40000 ALTER TABLE `user_account_backup` DISABLE KEYS */;
INSERT INTO `user_account_backup` (`my_row_id`, `user_id`, `username`, `email`, `password_hash`, `role`, `mfa_enabled`, `last_login_at`, `failed_login_count`, `is_active`, `created_at`, `updated_at`) VALUES (1,1,'p101','john.smith@email.com','$2y$12$mvBaL8ar53TL1LXEbqK4eeVOa8jPs922vF3dVcWRRR36uP0Dvhqx2','PATIENT',0,'2025-11-06 04:27:37',0,1,'2025-10-22 04:54:59','2025-10-22 04:54:59'),(2,2,'d201','echen@medconnect.com','$2y$12$mvBaL8ar53TL1LXEbqK4eeVOa8jPs922vF3dVcWRRR36uP0Dvhqx2','DOCTOR',0,'2025-11-06 20:51:27',0,1,'2025-10-22 04:54:59','2025-10-22 04:54:59'),(3,3,'n301','tnguyen@medconnect.com','$2y$12$mvBaL8ar53TL1LXEbqK4eeVOa8jPs922vF3dVcWRRR36uP0Dvhqx2','NURSE',0,'2025-11-06 20:39:42',0,1,'2025-10-23 14:54:01','2025-10-23 14:54:01'),(4,4,'a401','a.wilson@medconnect.com','$2y$12$mvBaL8ar53TL1LXEbqK4eeVOa8jPs922vF3dVcWRRR36uP0Dvhqx2','ADMIN',0,'2025-11-06 20:42:18',0,1,'2025-10-25 14:54:01','2025-10-25 14:54:01'),(5,5,'p102','maria.garcia@email.com','$2y$12$mvBaL8ar53TL1LXEbqK4eeVOa8jPs922vF3dVcWRRR36uP0Dvhqx2','PATIENT',0,'2025-11-06 20:58:42',0,1,'2025-10-28 18:50:06','2025-10-28 18:50:06'),(6,6,'d202','jrodriguez@medconnect.com','$2y$12$mvBaL8ar53TL1LXEbqK4eeVOa8jPs922vF3dVcWRRR36uP0Dvhqx2','DOCTOR',0,'2025-11-04 20:36:49',0,1,'2025-11-04 00:25:39','2025-11-04 00:25:39'),(7,9,'emaad980','emaad980@gmail.com','$2y$12$Cs7Vap7sWXRfkbcjniOAU.P6I2oKa81asl1qPEYS0Ih8uEiz0o1s2','PATIENT',0,'2025-11-01 20:39:30',0,1,'2025-11-01 20:27:29','2025-11-08 21:50:14'),(8,10,'kathiana119','kathiana119@gmail.com','$2y$12$g34AFS8Sjji2SLi.EvTltevK991t6CfDs4QNMg0cevjgxWgHMy.cO','PATIENT',0,'2025-11-04 00:25:55',0,1,'2025-11-04 00:25:39','2025-11-04 00:25:39'),(9,11,'r501','d.thompson@medconnect.com','$2y$12$mvBaL8ar53TL1LXEbqK4eeVOa8jPs922vF3dVcWRRR36uP0Dvhqx2','RECEPTIONIST',0,'2025-11-06 21:24:50',0,1,'2025-11-06 00:39:39','2025-11-06 00:39:39');
/*!40000 ALTER TABLE `user_account_backup` ENABLE KEYS */;
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
) ENGINE=InnoDB AUTO_INCREMENT=33 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `work_schedule`
--

LOCK TABLES `work_schedule` WRITE;
/*!40000 ALTER TABLE `work_schedule` DISABLE KEYS */;
INSERT INTO `work_schedule` VALUES (1,1,101,NULL,1,'2024-01-15','08:00:00','16:00:00','Monday'),(2,1,102,NULL,2,'2024-01-15','12:00:00','20:00:00','Monday'),(3,1,NULL,1,NULL,'2024-01-15','09:00:00','17:00:00','Monday'),(4,2,NULL,3,NULL,'2024-01-15','08:30:00','16:30:00','Monday'),(5,1,NULL,2,NULL,'2024-01-15','10:00:00','18:00:00','Monday'),(6,1,NULL,1,NULL,NULL,'09:00:00','17:00:00','Monday'),(7,2,NULL,1,NULL,NULL,'09:00:00','17:00:00','Tuesday'),(8,1,NULL,1,NULL,NULL,'09:00:00','17:00:00','Wednesday'),(9,2,NULL,1,NULL,NULL,'09:00:00','17:00:00','Thursday'),(10,1,NULL,1,NULL,NULL,'09:00:00','17:00:00','Friday'),(11,1,NULL,2,NULL,NULL,'08:00:00','16:00:00','Monday'),(12,1,NULL,2,NULL,NULL,'08:00:00','16:00:00','Wednesday'),(13,4,NULL,2,NULL,NULL,'10:00:00','18:00:00','Tuesday'),(14,4,NULL,2,NULL,NULL,'10:00:00','18:00:00','Thursday'),(15,4,NULL,2,NULL,NULL,'09:00:00','13:00:00','Friday'),(16,1,101,NULL,1,NULL,'07:00:00','15:00:00','Monday'),(17,1,101,NULL,1,NULL,'07:00:00','15:00:00','Wednesday'),(18,1,101,NULL,1,NULL,'07:00:00','15:00:00','Friday'),(19,1,102,NULL,2,NULL,'15:00:00','23:00:00','Tuesday'),(20,1,102,NULL,2,NULL,'15:00:00','23:00:00','Thursday'),(21,2,103,NULL,3,NULL,'08:00:00','16:00:00','Monday'),(22,2,103,NULL,3,NULL,'08:00:00','16:00:00','Tuesday'),(23,2,103,NULL,3,NULL,'08:00:00','16:00:00','Wednesday'),(24,2,103,NULL,3,NULL,'08:00:00','16:00:00','Thursday'),(25,2,103,NULL,3,NULL,'08:00:00','16:00:00','Friday'),(26,3,104,NULL,4,NULL,'09:00:00','17:00:00','Monday'),(27,3,104,NULL,4,NULL,'09:00:00','17:00:00','Wednesday'),(28,4,105,NULL,5,NULL,'10:00:00','18:00:00','Tuesday'),(29,4,105,NULL,5,NULL,'10:00:00','18:00:00','Thursday'),(30,1,106,NULL,6,NULL,'08:00:00','16:00:00','Monday'),(31,1,106,NULL,6,NULL,'08:00:00','16:00:00','Wednesday'),(32,1,106,NULL,6,NULL,'08:00:00','16:00:00','Friday');
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

-- Dump completed on 2025-11-10 23:58:44
