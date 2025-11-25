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
-- Table structure for table `allergies_per_patient`
--

DROP TABLE IF EXISTS `allergies_per_patient`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `allergies_per_patient` (
  `app_id` int NOT NULL AUTO_INCREMENT,
  `patient_id` int NOT NULL,
  `allergy_id` smallint NOT NULL,
  `notes` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`app_id`),
  KEY `fk_app_patient` (`patient_id`),
  KEY `fk_app_allergy` (`allergy_id`),
  CONSTRAINT `fk_app_allergy` FOREIGN KEY (`allergy_id`) REFERENCES `codes_allergies` (`allergies_code`) ON DELETE RESTRICT,
  CONSTRAINT `fk_app_patient` FOREIGN KEY (`patient_id`) REFERENCES `patient` (`patient_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=31 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `allergies_per_patient`
--

LOCK TABLES `allergies_per_patient` WRITE;
/*!40000 ALTER TABLE `allergies_per_patient` DISABLE KEYS */;
INSERT INTO `allergies_per_patient` VALUES (1,1,24,'','2025-11-18 05:20:34','2025-11-18 19:42:48'),(2,1,12,'','2025-11-18 19:39:25','2025-11-18 19:42:48'),(10,212,20,'','2025-11-18 19:44:46','2025-11-18 19:44:46'),(11,2,12,NULL,'2025-11-18 19:50:48','2025-11-18 19:50:48'),(12,2,10,NULL,'2025-11-18 19:50:48','2025-11-18 19:50:48'),(13,8,1,NULL,'2025-11-18 19:50:49','2025-11-18 19:50:49'),(15,8,11,NULL,'2025-11-18 19:50:49','2025-11-18 19:50:49'),(16,11,4,NULL,'2025-11-18 19:50:49','2025-11-18 19:50:49'),(17,18,5,NULL,'2025-11-18 19:50:49','2025-11-18 19:50:49'),(18,18,24,NULL,'2025-11-18 19:50:49','2025-11-18 19:50:49'),(19,25,1,NULL,'2025-11-18 19:50:49','2025-11-18 19:50:49'),(20,25,13,NULL,'2025-11-18 19:50:49','2025-11-18 19:50:49'),(21,25,7,NULL,'2025-11-18 19:50:49','2025-11-18 19:50:49'),(24,1,18,'','2025-11-18 20:15:08','2025-11-18 20:15:08'),(25,2,15,'','2025-11-18 21:06:38','2025-11-18 21:06:38'),(26,8,17,'','2025-11-18 21:22:42','2025-11-18 21:22:42'),(27,2,16,'','2025-11-19 19:40:19','2025-11-19 19:40:19'),(29,1,13,'','2025-11-19 23:09:28','2025-11-19 23:09:28'),(30,1,29,'','2025-11-21 18:13:06','2025-11-21 18:13:06');
/*!40000 ALTER TABLE `allergies_per_patient` ENABLE KEYS */;
UNLOCK TABLES;

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
  `Status` enum('Ready','Scheduled','Waiting','Checked-in','In Progress','Completed','Cancelled','No-Show') DEFAULT NULL,
  `method` enum('Walk-in','Phone','Online') DEFAULT NULL,
  PRIMARY KEY (`Appointment_id`),
  KEY `ix_appt_patient` (`Patient_id`),
  KEY `ix_appt_doctor` (`Doctor_id`),
  KEY `ix_appt_office` (`Office_id`),
  CONSTRAINT `fk_appt__doctor` FOREIGN KEY (`Doctor_id`) REFERENCES `doctor` (`doctor_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_appt__office` FOREIGN KEY (`Office_id`) REFERENCES `office` (`office_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_appt__patient` FOREIGN KEY (`Patient_id`) REFERENCES `patient` (`patient_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1097 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `appointment`
--

LOCK TABLES `appointment` WRITE;
/*!40000 ALTER TABLE `appointment` DISABLE KEYS */;
INSERT INTO `appointment` VALUES (1001,1,1,1,'2025-11-07 11:00:00','2025-10-20 14:30:00','Annual physical examination','No-Show','Phone'),(1002,3,1,1,'2025-11-05 14:00:00','2025-10-02 16:45:00','Follow-up consultation','No-Show','Walk-in'),(1003,5,1,1,'2025-11-10 10:30:00','2023-12-22 09:15:00','Annual checkup','In Progress','Walk-in'),(1004,7,2,4,'2025-11-17 11:00:00','2024-01-08 14:25:00','Heart condition monitoring','No-Show','Phone'),(1006,8,3,2,'2025-11-18 15:45:00','2024-01-11 12:15:00','Vaccination','In Progress','Online'),(1007,4,4,3,'2025-11-16 08:45:00','2023-12-28 11:20:00','Orthopedic consultation','No-Show','Phone'),(1008,1,1,1,'2025-11-04 16:00:00','2025-01-09 17:40:00','Knee pain evaluation','No-Show','Online'),(1009,6,5,4,'2024-11-17 09:30:00','2024-01-05 08:30:00','OB/GYN appointment','Scheduled','Phone'),(1010,3,1,2,'2025-11-11 10:00:00','2024-01-12 09:50:00','Internal medicine consultation','Completed','Phone'),(1011,4,7,4,'2024-01-19 14:30:00','2024-01-15 16:20:00','Dermatology screening','Scheduled','Phone'),(1012,4,1,2,'2025-11-06 09:00:00','2025-10-20 09:00:00','Follow-up consultation','In Progress','Phone'),(1013,5,1,1,'2025-11-06 13:00:00','2025-10-23 10:00:00','Vaccination','In Progress','Phone'),(1014,1,1,1,'2025-11-07 16:00:00','2025-11-03 22:34:36','Annual health check up ','No-Show','Phone'),(1015,2,6,1,'2025-11-10 11:00:00','2025-11-03 22:34:36','Vaccination','No-Show','Walk-in'),(1017,7,1,1,'2025-11-10 10:00:00','2025-11-11 01:33:01','Health Check-up','No-Show','Phone'),(1018,9,1,1,'2025-11-08 12:00:00','2025-11-11 01:34:02','Vaccination','No-Show','Online'),(1019,7,1,1,'2025-11-11 09:00:00','2025-11-11 01:48:37','Knee pain ','Completed','Online'),(1020,1,1,1,'2025-10-29 09:00:00','2025-10-15 14:30:00','Annual physical examination','No-Show','Walk-in'),(1021,2,1,2,'2025-10-29 10:30:00','2025-10-16 09:15:00','Hypertension follow-up','No-Show','Online'),(1022,3,2,1,'2025-10-29 14:00:00','2025-10-17 16:45:00','Diabetes management','No-Show','Online'),(1023,4,3,3,'2025-10-30 11:15:00','2025-10-18 10:20:00','Pediatric wellness check','No-Show','Phone'),(1024,5,4,2,'2025-10-30 15:30:00','2025-10-19 08:50:00','Cardiology follow-up','No-Show','Phone'),(1025,6,5,1,'2025-10-31 08:45:00','2025-10-20 13:25:00','Dermatology screening','No-Show','Online'),(1026,7,6,3,'2025-10-31 13:20:00','2025-10-21 11:10:00','Orthopedic consultation','No-Show','Online'),(1027,8,1,1,'2025-11-03 10:00:00','2025-10-22 15:40:00','Vaccination','No-Show','Walk-in'),(1028,9,2,1,'2025-11-03 16:15:00','2025-10-23 12:30:00','Mental health therapy','No-Show','Online'),(1029,10,3,3,'2025-11-04 09:30:00','2025-10-24 14:15:00','Prenatal checkup','No-Show','Phone'),(1030,11,1,2,'2025-11-04 14:45:00','2025-10-25 10:05:00','Allergy testing','No-Show','Walk-in'),(1031,12,2,1,'2025-11-05 11:30:00','2025-10-26 16:20:00','Sports physical','No-Show','Walk-in'),(1032,13,3,3,'2025-11-05 15:00:00','2025-10-27 09:30:00','Eye examination','No-Show','Online'),(1033,14,4,2,'2025-11-06 10:45:00','2025-10-28 14:50:00','Nutrition counseling','No-Show','Online'),(1034,15,5,1,'2025-11-10 13:15:00','2025-10-29 11:25:00','Lab results follow-up','No-Show','Online'),(1035,16,6,3,'2025-11-11 08:30:00','2025-10-30 15:10:00','Medication review','No-Show','Online'),(1036,17,7,2,'2025-11-12 09:00:00','2025-11-01 10:40:00','Urgent care','No-Show','Phone'),(1037,18,1,1,'2025-11-12 09:15:00','2025-11-02 13:15:00','Blood work','Completed','Walk-in'),(1038,19,2,3,'2025-11-13 10:30:00','2025-11-03 08:45:00','Physical therapy','No-Show','Phone'),(1039,20,3,2,'2025-11-14 14:00:00','2025-11-04 12:20:00','Surgical clearance','No-Show','Phone'),(1040,21,4,4,'2025-11-17 16:45:00','2025-11-05 14:35:00','Pain management','No-Show','Walk-in'),(1041,22,2,3,'2025-11-18 08:00:00','2025-11-06 09:50:00','STD testing','No-Show','Online'),(1042,23,3,2,'2025-11-19 11:20:00','2025-11-07 16:25:00','Geriatric assessment','No-Show','Online'),(1043,24,4,1,'2025-11-20 13:40:00','2025-11-08 10:15:00','Weight management','No-Show','Walk-in'),(1044,25,1,2,'2025-11-21 15:00:00','2025-11-09 08:30:00','Post-operative follow-up','No-Show','Phone'),(1045,2,6,1,'2025-11-12 09:00:00','2025-11-11 07:15:31','Feeling Unwell','No-Show','Online'),(1047,1,2,4,'2025-11-13 10:00:00','2025-11-11 21:04:52','testing trigger for referral','No-Show','Online'),(1049,4,1,1,'2025-11-14 09:00:00','2025-11-12 12:12:46','Blood work','No-Show','Walk-in'),(1051,1,7,1,'2025-11-27 09:00:00','2025-11-13 00:16:48','skin rash','Scheduled','Phone'),(1054,1,1,1,'2025-11-13 15:30:00','2025-11-13 20:33:46','TEST for check-in','No-Show','Walk-in'),(1056,1,1,1,'2025-11-14 12:30:00','2025-11-14 18:25:50','TEST for insurance','No-Show','Walk-in'),(1057,3,2,1,'2025-11-14 15:30:00','2025-11-14 21:19:24','Heart check up','No-Show','Online'),(1058,1,1,1,'2025-11-17 09:00:00','2025-11-15 11:03:22','TEST for check-in','Ready','Phone'),(1059,8,1,1,'2025-11-17 09:30:00','2025-11-15 12:12:32','TEST for check-in 2','Ready','Phone'),(1060,5,1,1,'2025-11-15 12:30:00','2025-11-14 12:30:00','Annual checkup','Completed','Online'),(1061,1,1,1,'2025-11-15 17:30:00','2025-11-15 15:27:00','Test for waiting','No-Show','Online'),(1063,2,1,1,'2025-11-16 10:00:00','2025-11-15 22:15:39','nurse test','Ready','Online'),(1065,212,1,1,'2025-11-16 11:00:00','2025-11-15 23:57:47','Annual Checkup','No-Show','Online'),(1066,212,1,1,'2025-11-16 08:00:00','2025-11-16 00:24:47','Sick','Checked-in','Phone'),(1067,1,8,1,'2025-11-17 08:00:00','2025-11-17 06:15:47','Stomach Sickness','Ready','Online'),(1068,2,1,1,'2025-11-17 08:30:00','2025-11-17 06:20:10','Indecision','Ready','Online'),(1071,2,1,1,'2025-11-17 08:00:00','2025-11-17 13:04:25','reason','Cancelled','Walk-in'),(1076,212,8,4,'2025-11-18 13:30:00','2025-11-18 19:28:13','TEST','No-Show','Walk-in'),(1077,212,8,4,'2025-11-18 14:30:00','2025-11-18 19:35:07','TEST','No-Show','Online'),(1078,212,8,4,'2025-11-18 16:00:00','2025-11-18 19:52:21','Feeling unwell','No-Show','Online'),(1080,225,9,3,'2025-11-19 16:00:00','2025-11-19 08:14:57','testing','No-Show','Online'),(1081,8,1,1,'2025-11-19 15:00:00','2025-11-19 08:14:57','Annual Checkup','No-Show','Walk-in'),(1084,11,1,1,'2025-11-19 17:15:00','2025-11-19 08:14:57','Vaccination','No-Show','Online'),(1085,2,6,2,'2025-11-20 09:00:00','2025-11-19 22:12:12','Sick','No-Show','Online'),(1086,2,6,3,'2025-11-19 17:00:00','2025-11-19 22:14:23','Sick','No-Show','Online'),(1088,226,1,1,'2025-11-19 16:00:00','2025-11-19 22:37:09','Sick','No-Show','Online'),(1090,228,1,1,'2025-11-19 18:00:00','2025-11-19 23:00:03','Pregnant','Cancelled','Online'),(1091,231,1,1,'2025-11-19 17:30:00','2025-11-19 23:37:01','skin rash','No-Show','Online'),(1092,1,1,1,'2025-11-21 11:30:00','2025-11-19 23:41:45','check up','Ready','Phone'),(1093,1,1,1,'2025-11-21 13:30:00','2025-11-21 18:10:31','TEST','No-Show','Online'),(1094,2,1,1,'2025-11-21 13:00:00','2025-11-21 18:47:20','No-show fee','No-Show','Online'),(1095,2,1,1,'2025-11-21 14:00:00','2025-11-21 20:07:54','Not feeling well','No-Show','Online'),(1096,1,1,1,'2025-11-21 14:30:00','2025-11-21 20:35:48','Give me the late fee','No-Show','Online');
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
/*!50003 CREATE*/ /*!50017 DEFINER=`aad_mysql_medapp`@`%`*/ /*!50003 TRIGGER `appointment_NO_SHOW` AFTER UPDATE ON `appointment` FOR EACH ROW BEGIN
  IF NEW.Status = 'No-Show' AND OLD.Status != 'No-Show' THEN
    IF NOT EXISTS (
      SELECT 1 FROM no_show_penalty
      WHERE Appointment_id = NEW.Appointment_id
    ) THEN
      INSERT INTO no_show_penalty (
        appointment_id,
        fee,
        date_applied
      ) VALUES (
        NEW.Appointment_id,
        50.00,
        NOW()
      );
    END IF;
  END IF;
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
) ENGINE=InnoDB AUTO_INCREMENT=30 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `codes_allergies`
--

LOCK TABLES `codes_allergies` WRITE;
/*!40000 ALTER TABLE `codes_allergies` DISABLE KEYS */;
INSERT INTO `codes_allergies` VALUES (1,'Penicillin'),(2,'Pollen'),(3,'Shellfish'),(4,'Peanuts'),(5,'Tree Nuts'),(6,'Milk'),(7,'Eggs'),(8,'Wheat'),(9,'Soy'),(10,'Fish'),(11,'Sulfonamides'),(12,'Aspirin'),(13,'Ibuprofen'),(14,'Latex'),(15,'Dust Mites'),(16,'Mold'),(17,'Pet Dander'),(18,'Sesame'),(19,'Mustard'),(20,'Celery'),(21,'NSAIDs'),(22,'Codeine'),(23,'Sulfa Drugs'),(24,'Cephalosporin'),(25,'No Known Allergies'),(26,'Grass'),(27,'salmom'),(28,'P'),(29,'pop');
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
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `doctor`
--

LOCK TABLES `doctor` WRITE;
/*!40000 ALTER TABLE `doctor` DISABLE KEYS */;
INSERT INTO `doctor` VALUES (1,205,3,'737-492-0001'),(2,206,14,'737-492-8102'),(3,207,4,'737-879-7010'),(4,208,15,'737-879-7102'),(5,209,5,'737-492-8103'),(6,210,3,'737-879-7103'),(7,217,13,'737-492-8104'),(8,214,2,'6161561616'),(9,222,1,'1231231231'),(10,227,13,'1231231231'),(11,230,13,''),(12,232,6,'');
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
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `emergency_contact`
--

LOCK TABLES `emergency_contact` WRITE;
/*!40000 ALTER TABLE `emergency_contact` DISABLE KEYS */;
INSERT INTO `emergency_contact` VALUES (1,10,'Ben','Thomas','5551234567','Father'),(2,2,'Elena','Orozco','713555555','Friend'),(3,1,'Adam','Smith','7134444444','Spouse'),(4,212,'Jose','Sanchez','1237778888','Father');
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
) ENGINE=InnoDB AUTO_INCREMENT=109 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `insurance_plan`
--

LOCK TABLES `insurance_plan` WRITE;
/*!40000 ALTER TABLE `insurance_plan` DISABLE KEYS */;
INSERT INTO `insurance_plan` VALUES (101,1,'BCBS Gold','PPO','{\"requires_referral\": false, \"primary_care_required\": false, \"out_of_network_coverage\": true}',25.00,500.00,15.00),(102,1,'BCBS Silver','HMO','{\"requires_referral\": true, \"primary_care_required\": true, \"out_of_network_coverage\": false}',20.00,1000.00,20.00),(103,2,'Aetna Premier','PPO','{\"requires_referral\": false, \"primary_care_required\": false, \"out_of_network_coverage\": true}',15.00,1500.00,25.00),(104,3,'UHC Choice Plus','PPO','{\"requires_referral\": false, \"primary_care_required\": false, \"out_of_network_coverage\": true}',20.00,2000.00,20.00),(105,4,'Medicare Part B','Medicare','{\"requires_referral\": false, \"primary_care_required\": false, \"out_of_network_coverage\": false}',25.00,240.00,10.00),(106,5,'BCBS Silver','HMO',NULL,25.00,NULL,15.00),(107,2,'BCBS Gold','PPO',NULL,20.00,NULL,20.00),(108,3,'BCBS Gold','PPO',NULL,15.00,NULL,25.00);
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
  KEY `idx_mc_diagnosis_date` (`diagnosis_date`),
  CONSTRAINT `fk_patient_id` FOREIGN KEY (`patient_id`) REFERENCES `patient` (`patient_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `medical_condition`
--

LOCK TABLES `medical_condition` WRITE;
/*!40000 ALTER TABLE `medical_condition` DISABLE KEYS */;
INSERT INTO `medical_condition` VALUES (1,1,'Hypertension','2024-03-10','2025-10-23 04:41:08','Dr. Emily Chen','2025-10-23 04:41:08','Dr. Emily Chen'),(2,1,'Type 2 Diabetes','2022-07-15','2025-10-23 04:41:08','Dr. Emily Chen','2025-10-23 04:41:08','Dr. Emily Chen'),(3,2,'Asthma','2021-05-20','2025-10-23 04:41:08','Dr. Susan Lee','2025-10-23 04:41:08','Dr. Susan Lee'),(4,2,'Migraine','2020-11-03','2025-10-23 04:41:08','Dr. Susan Lee','2025-10-23 04:41:08','Dr. Susan Lee'),(5,3,'Hyperlipidemia','2021-01-12','2025-10-23 04:41:08','Dr. Emily Chen','2025-10-23 04:41:08','Dr. Emily Chen'),(6,4,'Hypothyroidism','2023-09-08','2025-10-23 04:41:08','Dr. Richard Patel','2025-10-23 04:41:08','Dr. Richard Patel'),(7,5,'Osteoarthritis','2024-12-15','2025-10-23 04:41:08','Dr. James Rodriguez','2025-10-23 04:41:08','Dr. James Rodriguez'),(8,5,'GERD','2022-04-22','2025-10-23 04:41:08','Dr. James Rodriguez','2025-10-23 04:41:08','Dr. James Rodriguez'),(9,6,'Anxiety Disorder','2024-08-30','2025-10-23 04:41:08','Dr. Maria Garcia','2025-10-23 04:41:08','Dr. Maria Garcia'),(10,7,'COPD','2022-06-18','2025-10-23 04:41:08','Dr. James Rodriguez','2025-10-23 04:41:08','Dr. James Rodriguez'),(11,8,'PCOS','2021-03-25','2025-10-23 04:41:08','Dr. Susan Lee','2025-10-23 04:41:08','Dr. Susan Lee'),(12,1,'arthritis','2025-11-23','2025-11-23 04:47:51','d201','2025-11-23 04:47:51','d201');
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
  KEY `idx_medhist_patient` (`patient_id`),
  CONSTRAINT `fk_med_hist_patient_id` FOREIGN KEY (`patient_id`) REFERENCES `patient` (`patient_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `medical_history`
--

LOCK TABLES `medical_history` WRITE;
/*!40000 ALTER TABLE `medical_history` DISABLE KEYS */;
INSERT INTO `medical_history` VALUES (1,1,'Hypertension','2021-03-10'),(2,1,'Type 2 Diabetes','2019-07-15'),(3,2,'Asthma','2022-05-20'),(4,2,'Migraine','2021-11-03'),(5,3,'Hyperlipidemia','2020-01-12'),(6,4,'Hypothyroidism','2019-09-08'),(7,5,'Osteoarthritis','2016-12-15'),(8,5,'GERD','2019-04-22'),(9,6,'Anxiety Disorder','2020-08-30'),(10,7,'COPD','2014-06-18'),(11,8,'PCOS','2018-03-25'),(12,1,'Appendectomy','2020-08-12'),(13,3,'Tonsillectomy','2025-03-22'),(14,7,'Knee Replacement','2024-11-05');
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
  KEY `idx_medhist_patient` (`patient_id`),
  CONSTRAINT `fk_drugs_hist_patient_id` FOREIGN KEY (`patient_id`) REFERENCES `patient` (`patient_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=30 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `medication_history`
--

LOCK TABLES `medication_history` WRITE;
/*!40000 ALTER TABLE `medication_history` DISABLE KEYS */;
INSERT INTO `medication_history` VALUES (2,1,'Metformin 500mg','Twice daily since December 2023'),(3,2,'Albuterol Inhaler','As needed since November 2024'),(4,2,'Sumatriptan 50mg','As needed for migraines since March 2018'),(5,3,'Atorvastatin 20mg','Once daily since June 2021'),(6,4,'Levothyroxine 75mcg','Once daily since May 2017'),(7,5,'Ibuprofen 600mg','Three times daily as needed since June 2012'),(8,5,'Omeprazole 20mg','Once daily since May 2021'),(9,6,'Sertraline 50mg','Once daily since August 2020'),(10,7,'Spiriva HandiHaler','Once daily since September 2024'),(11,7,'Albuterol Nebulizer','Four times daily since Feburary 2021'),(12,8,'Metformin 1000mg','Twice daily since January 2022'),(13,8,'Drospirenone/Ethinyl Estradiol','Once daily since March 2025'),(25,1,'pop','500 mg - twice daily (Started: Jun 2019 | Stopped: Nov 2025)'),(26,1,'popo','500mg - twice daily (Started: Nov 2025)'),(29,1,'opopop','400mg - twice daily (Started: Nov 2025 | Stopped: Nov 2025)');
/*!40000 ALTER TABLE `medication_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `no_show_penalty`
--

DROP TABLE IF EXISTS `no_show_penalty`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `no_show_penalty` (
  `id` int NOT NULL AUTO_INCREMENT,
  `appointment_id` int DEFAULT NULL,
  `fee` decimal(15,2) NOT NULL,
  `date_applied` datetime NOT NULL,
  `payment_method` varchar(50) DEFAULT NULL,
  `date_paid` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `appointment_id_idx` (`appointment_id`),
  CONSTRAINT `appointment_id` FOREIGN KEY (`appointment_id`) REFERENCES `appointment` (`Appointment_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `no_show_penalty`
--

LOCK TABLES `no_show_penalty` WRITE;
/*!40000 ALTER TABLE `no_show_penalty` DISABLE KEYS */;
INSERT INTO `no_show_penalty` VALUES (1,1094,50.00,'2025-11-21 19:21:11',NULL,NULL),(2,1093,50.00,'2025-11-21 19:52:54','Credit Card','2025-11-21 20:01:13'),(3,1095,50.00,'2025-11-21 20:15:07',NULL,NULL),(4,1096,50.00,'2025-11-21 20:45:15',NULL,NULL),(5,1044,50.00,'2025-11-21 22:09:47',NULL,NULL);
/*!40000 ALTER TABLE `no_show_penalty` ENABLE KEYS */;
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
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `nurse`
--

LOCK TABLES `nurse` WRITE;
/*!40000 ALTER TABLE `nurse` DISABLE KEYS */;
INSERT INTO `nurse` VALUES (1,101,'Emergency'),(2,102,'ICU'),(3,103,'Pediatrics'),(4,104,'Orthopedics'),(5,105,'Cardiology'),(6,106,'General'),(7,216,'Pediatrics');
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
  `insurance_id` int unsigned DEFAULT NULL,
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
  KEY `fk_patient__insurance_record` (`insurance_id`),
  KEY `fk_patient__emergency_contact` (`emergency_contact_id`),
  CONSTRAINT `fk_patient__aab_gender` FOREIGN KEY (`assigned_at_birth_gender`) REFERENCES `codes_assigned_at_birth_gender` (`gender_code`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_patient__allergies` FOREIGN KEY (`allergies`) REFERENCES `codes_allergies` (`allergies_code`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_patient__emergency_contact` FOREIGN KEY (`emergency_contact_id`) REFERENCES `emergency_contact` (`emergency_contact_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_patient__ethnicity` FOREIGN KEY (`ethnicity`) REFERENCES `codes_ethnicity` (`ethnicity_code`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_patient__gender` FOREIGN KEY (`gender`) REFERENCES `codes_gender` (`gender_code`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_patient__insurance_record` FOREIGN KEY (`insurance_id`) REFERENCES `patient_insurance` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_patient__primary_doctor` FOREIGN KEY (`primary_doctor`) REFERENCES `doctor` (`doctor_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_patient__race` FOREIGN KEY (`race`) REFERENCES `codes_race` (`race_code`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_user_id` FOREIGN KEY (`patient_id`) REFERENCES `user_account` (`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=234 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `patient`
--

LOCK TABLES `patient` WRITE;
/*!40000 ALTER TABLE `patient` DISABLE KEYS */;
INSERT INTO `patient` VALUES (1,'John','Smith','1985-03-15','123-45-6789',1,3,2,1,'john.smith@email.com',3,1,1,NULL,NULL,'AB-'),(2,'Maria','Garcia','2020-07-22','123-45-6790',2,2,1,2,'maria.garcia@email.com',2,1,2,NULL,NULL,'A+'),(3,'David','Johnson','1992-11-30','123-45-6791',1,1,2,1,'david.johnson@email.com',NULL,2,3,NULL,3,'B+'),(4,'Sarah','Williams','1980-05-14','123-45-6792',2,2,2,1,'sarah.williams@email.com',NULL,3,4,NULL,2,'AB-'),(5,'Michael','Brown','1975-09-08','123-45-6793',1,1,2,2,'michael.brown@email.com',NULL,4,5,NULL,7,'O-'),(6,'Jennifer','Davis','1988-12-25','123-45-6794',2,2,2,1,'jennifer.davis@email.com',NULL,5,6,NULL,18,'A-'),(7,'Robert','Miller','1965-02-18','123-45-6795',1,1,2,1,'robert.miller@email.com',NULL,6,7,NULL,2,'B-'),(8,'Lisa','Wilson','1990-08-11','123-45-6796',2,2,1,3,'lisa.wilson@email.com',NULL,1,8,NULL,NULL,'AB+'),(9,'Emaad','Rahman','2000-02-01','123-49-6512',1,1,NULL,NULL,'emaad980@gmail.com',NULL,2,9,NULL,11,NULL),(10,'Kathiana','Rodriguez','2003-01-03','TEMP0000010',2,2,1,1,'kathiana119@gmail.com',NULL,3,10,NULL,22,NULL),(11,'Bartholomew','Fitzgerald','1972-04-18','476-78-9012',1,1,1,1,'bart.fitz@email.com',NULL,1,11,NULL,12,'A+'),(12,'Guinevere','Pembroke','1985-11-03','565-89-0123',2,2,1,1,'g.pembroke@email.com',NULL,2,12,NULL,11,'B+'),(13,'Theodore','Montgomery','1968-07-22','670-90-1234',1,1,1,1,'ted.montgomery@email.com',NULL,3,13,NULL,14,'O+'),(14,'Seraphina','Whitaker','1991-02-14','719-01-2345',2,2,1,1,'sera.whitaker@email.com',NULL,4,14,NULL,22,'AB-'),(15,'Percival','Harrington','1979-09-08','870-12-3456',1,1,1,1,'percy.h@email.com',NULL,5,15,NULL,21,'A-'),(16,'Lysandra','Blackwood','1988-12-25','931-23-4567',2,2,1,1,'lysandra.b@email.com',NULL,6,16,NULL,24,'O-'),(17,'Alistair','Kensington','1965-05-30','212-34-5678',1,1,1,1,'alistair.k@email.com',NULL,7,17,NULL,19,'B+'),(18,'Gwendolyn','Ashworth','1993-08-11','128-45-6789',2,2,1,1,'gwen.ashworth@email.com',NULL,1,18,NULL,12,'A+'),(19,'Phineas','Worthington','1977-01-19','234-56-7890',1,1,1,1,'phineas.w@email.com',NULL,2,19,NULL,10,'O+'),(20,'Cordelia','Fairchild','1983-06-07','345-67-8901',2,2,1,1,'cordelia.f@email.com',NULL,3,20,NULL,15,'B-'),(21,'Benedict','Kingsley','1990-03-26','456-88-9012',1,1,1,1,'ben.kingsley@email.com',NULL,4,21,NULL,6,'AB+'),(22,'Octavia','Rutherford','1974-10-13','569-89-0123',2,2,1,1,'octavia.r@email.com',NULL,2,22,NULL,9,'A+'),(23,'Sebastian','Hawthorne','1986-12-09','688-90-1234',1,1,1,1,'seb.hawthorne@email.com',NULL,3,23,NULL,14,'O-'),(24,'Persephone','Vance','1995-07-04','799-01-2345',2,2,1,1,'persephone.v@email.com',NULL,4,24,NULL,13,'B+'),(25,'Atticus','Pemberton','1969-04-21','890-12-7456',1,1,1,1,'atticus.p@email.com',NULL,1,25,NULL,1,'A-'),(211,'Nin','Li','2002-06-05','123-45-8123',4,4,NULL,NULL,'niuli@gmail.com',NULL,NULL,NULL,NULL,NULL,NULL),(212,'Jennifer','Sanchez','1995-08-05','TEMP0000212',2,2,1,1,'jennifer.sanchez@email.com',4,1,45,NULL,22,NULL),(218,'Queen','Lincoln','1999-05-20','TEMP0000218',2,2,NULL,NULL,'queen.linc@email.com',NULL,NULL,NULL,NULL,NULL,NULL),(221,'jim','ash','2000-02-11','TEMP0000221',1,1,NULL,NULL,'jim.ash@email.com',NULL,NULL,NULL,NULL,NULL,NULL),(223,'Justin','Bieber','2001-08-24','TEMP0000223',1,1,NULL,NULL,'justin.bieber@email.com',NULL,NULL,NULL,NULL,NULL,NULL),(224,'Phat Thanh','Do','2004-10-13','TEMP0000224',1,1,NULL,NULL,'t.do@gmail.com',NULL,NULL,NULL,NULL,NULL,NULL),(225,'Jason','Stathem','1993-01-15','TEMP0000225',3,3,NULL,NULL,'jason.stathem@email.com',NULL,9,NULL,NULL,NULL,NULL),(226,'Elena','Orozco','2001-08-24','TEMP0000226',3,3,NULL,NULL,'elena.orozco@email.com',NULL,1,NULL,NULL,NULL,'A+'),(228,'Emaad','bozo','1999-08-11','TEMP0000228',3,3,NULL,NULL,'emaad980@email.com',NULL,1,NULL,NULL,NULL,NULL),(231,'Emaad','bozo','2000-08-24','TEMP0000231',3,3,NULL,NULL,'emaa@email.com',NULL,1,NULL,NULL,NULL,NULL),(233,'paul','bunion','1945-12-22','TEMP0000233',3,3,NULL,NULL,'paul.b@email.com',NULL,NULL,NULL,NULL,NULL,NULL);
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
) ENGINE=InnoDB AUTO_INCREMENT=46 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `patient_insurance`
--

LOCK TABLES `patient_insurance` WRITE;
/*!40000 ALTER TABLE `patient_insurance` DISABLE KEYS */;
INSERT INTO `patient_insurance` VALUES (1,1,107,'M123456789','G987654','2024-01-01','2025-12-31',1),(2,2,102,'M123456790','G987655','2024-03-01','2025-11-19',1),(3,3,105,'M123456791','G987658','2024-06-01','2025-12-31',1),(4,4,103,'M123456792','G987656','2024-02-15','2025-12-31',1),(5,5,104,'M123456793','G987657','2024-01-01','2025-12-31',1),(6,6,101,'M123456794','G987659','2024-01-01','2025-12-31',1),(7,7,105,'M123456795','G987660','2024-06-01','2025-12-31',1),(8,8,102,'M123456796','G987661','2024-03-01','2025-12-31',1),(9,9,101,'BCBSG00112345A','GRP800123','2024-01-01','2025-12-31',1),(10,10,101,'BCBSG00112346B','GRP800123','2024-01-01','2025-12-31',1),(11,11,101,'BCBSG00112347C','GRP800124','2024-01-01','2025-12-31',1),(12,12,101,'BCBSG00112348D','GRP800125','2024-01-01','2025-12-31',1),(13,13,102,'BCBSS00212345A','GRP900123','2024-01-01','2025-12-31',1),(14,14,102,'BCBSS00212346B','GRP900123','2024-01-01','2025-12-31',1),(15,15,102,'BCBSS00212347C','GRP900124','2024-01-01','2025-12-31',1),(16,16,102,'BCBSS00212348D','GRP900125','2024-01-01','2025-12-31',1),(17,17,103,'AETNA00312345A','GRP700123','2024-01-01','2025-12-31',1),(18,18,103,'AETNA00312346B','GRP700123','2024-01-01','2025-12-31',1),(19,19,103,'AETNA00312347C','GRP700124','2024-01-01','2025-12-31',1),(20,20,103,'AETNA00312348D','GRP700125','2024-01-01','2025-12-31',1),(21,21,104,'UHC00412345A','GRP600123','2024-01-01','2025-12-31',1),(22,22,104,'UHC00412346B','GRP600123','2024-01-01','2025-12-31',1),(23,23,104,'UHC00412347C','GRP600124','2024-01-01','2025-12-31',1),(24,24,104,'UHC00412348D','GRP600125','2024-01-01','2025-12-31',1),(25,25,105,'MCR00512345A','GRP600123','2024-01-01','2025-12-31',1),(45,212,101,'M123456790','G987654','2023-08-25','2025-11-30',1);
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
) ENGINE=InnoDB AUTO_INCREMENT=68 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `patient_visit`
--

LOCK TABLES `patient_visit` WRITE;
/*!40000 ALTER TABLE `patient_visit` DISABLE KEYS */;
INSERT INTO `patient_visit` VALUES (1,1001,1,1,'2025-11-15 09:00:00','120/80',1,1,'Completed','Hypertension, Type 2 Diabetes','Annual physical examination','Internal Medicine',NULL,NULL,25.00,125.00,1,'Stable condition',98.6,'2024-01-15 09:00:00','2024-01-15 09:45:00',1,'2025-10-23 04:41:08','Dr. Emily Chen','2025-11-17 02:46:12','Dr. Emily Chen'),(2,1002,3,3,'2025-11-16 14:00:00','118/76',1,2,'Completed','Hyperlipidemia','Follow-up consultation','Internal Medicine',15.00,NULL,15.00,105.00,1,'Elevated cholesterol levels',98.4,'2024-01-16 14:00:00','2024-01-16 14:30:00',3,'2025-10-23 04:41:08','Dr. Emily Chen','2025-11-17 02:46:12','Dr. Emily Chen'),(5,1014,1,1,'2025-11-07 12:00:00','120/80',1,1,'Scheduled','flu',NULL,NULL,25.00,'cash',25.00,230.00,NULL,'cough',99.2,'2025-11-07 12:00:00',NULL,1,'2025-11-07 18:06:42',NULL,'2025-11-10 23:12:44','Daniel Thompson'),(6,1049,1,1,NULL,'100/90',1,6,'Scheduled',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'Elevated cholesterol levels',100.0,NULL,NULL,4,'2025-11-14 09:00:00',NULL,'2025-11-15 22:26:39','tnguyen@medconnect.com'),(15,1013,5,1,'2025-11-03 10:30:00','120/80',1,1,'Scheduled','Mild Severity, Flu','Fever and cough','Internal Medicine',50.00,NULL,25.00,180.00,1,'Cough, fever',99.5,'2025-10-24 10:30:00','2025-10-24 11:00:00',5,'2025-10-25 04:21:57','nurse.jane','2025-11-17 02:46:12',NULL),(16,1004,5,1,'2025-11-04 01:15:00','130/80',1,2,'Scheduled',NULL,NULL,'Internal Medicine',NULL,NULL,NULL,NULL,NULL,'None',99.0,'2025-10-24 01:30:00',NULL,5,'2025-10-24 01:10:00',NULL,'2025-11-15 22:26:39',NULL),(17,NULL,2,3,'2025-11-25 02:15:00','120/80',3,1,'Scheduled','Migraine','Migraines','Internal Medicine',20.00,NULL,20.00,50.00,1,'Stable condition',NULL,NULL,NULL,2,'2025-11-06 06:17:07',NULL,'2025-11-17 02:50:28',NULL),(18,1002,3,1,'2025-11-12 14:00:00',NULL,NULL,6,'Scheduled',NULL,NULL,'General',NULL,NULL,25.00,NULL,NULL,'None',NULL,'2025-11-12 14:00:00',NULL,3,'2025-11-06 20:09:25',NULL,'2025-11-15 22:26:39',NULL),(19,1010,3,2,'2025-11-11 10:00:00',NULL,NULL,6,'Scheduled',NULL,NULL,'General',NULL,NULL,25.00,NULL,NULL,'Stable condition',NULL,'2025-11-11 10:00:00',NULL,3,'2025-11-06 20:09:25',NULL,'2025-11-15 22:26:39',NULL),(20,1020,1,1,'2025-10-29 09:00:00','118/76',1,1,'Completed','Hypertension controlled, overall health good','Annual physical examination','Internal Medicine',25.00,'card',25.00,150.00,1,'Routine checkup, no current complaints',98.6,'2025-10-29 09:00:00','2025-10-29 09:45:00',1,'2025-11-12 17:15:35','Nurse Sarah','2025-11-12 17:15:35','Dr. Smith'),(21,1021,2,2,'2025-10-29 10:30:00','132/84',1,2,'Completed','Hypertension stage 1, medication adjustment needed','Hypertension follow-up','Internal Medicine',20.00,'card',20.00,120.00,1,'Occasional headaches, fatigue',98.4,'2025-10-29 10:30:00','2025-10-29 11:15:00',2,'2025-11-12 17:15:35','Nurse Jane','2025-11-12 17:15:35','Dr. Smith'),(22,1022,3,1,'2025-10-29 14:00:00','122/78',2,6,'Completed','Type 2 Diabetes, glucose levels stable','Diabetes management','Endocrinology',15.00,'card',15.00,95.00,1,'Increased thirst, stable weight',98.2,'2025-10-29 14:00:00','2025-10-29 14:40:00',3,'2025-11-12 17:15:35','Nurse Sarah','2025-11-17 06:38:53','Dr. Johnson'),(23,1023,4,3,'2025-10-30 11:15:00','110/70',3,3,'Completed','Healthy pediatric development','Pediatric wellness check','Pediatrics',25.00,'card',25.00,180.00,1,'Routine wellness check, vaccinations up to date',99.1,'2025-10-30 11:15:00','2025-10-30 12:00:00',4,'2025-11-12 17:15:35','Nurse Mike','2025-11-12 17:15:35','Dr. Williams'),(24,1024,5,2,'2025-10-30 15:30:00','128/82',4,2,'Completed','Stable cardiac function, continue current medication','Cardiology follow-up','Cardiology',25.00,'card',25.00,200.00,1,'Mild chest discomfort with exertion',98.6,'2025-10-30 15:30:00','2025-10-30 16:20:00',5,'2025-11-12 17:15:35','Nurse Jane','2025-11-12 17:15:35','Dr. Brown'),(25,1025,6,1,'2025-10-31 08:45:00','116/74',5,1,'Completed','Benign skin lesion, no treatment required','Dermatology screening','Dermatology',20.00,'card',20.00,160.00,1,'Mole check, no changes noted',98.4,'2025-10-31 08:45:00','2025-10-31 09:30:00',6,'2025-11-12 17:15:35','Nurse Sarah','2025-11-12 17:15:35','Dr. Davis'),(26,1026,7,3,'2025-10-31 13:20:00','124/80',6,3,'Completed','Mild osteoarthritis, recommend physical therapy','Orthopedic consultation','Orthopedics',25.00,'card',25.00,220.00,1,'Knee pain with stairs and prolonged walking',98.8,'2025-10-31 13:20:00','2025-10-31 14:15:00',7,'2025-11-12 17:15:35','Nurse Mike','2025-11-12 17:15:35','Dr. Miller'),(27,1027,8,2,'2025-11-03 10:00:00','118/76',1,2,'Completed','Influenza vaccination administered','Vaccination','Primary Care',0.00,NULL,0.00,85.00,1,'Seasonal flu prevention',98.6,'2025-11-03 10:00:00','2025-11-03 10:25:00',8,'2025-11-12 17:15:35','Nurse Jane','2025-11-12 17:15:35','Dr. Smith'),(28,1028,9,1,'2025-11-03 16:15:00','130/82',2,1,'Completed','Generalized anxiety disorder, therapy session completed','Mental health therapy','Psychiatry',20.00,'card',20.00,150.00,1,'Anxiety symptoms improved with current treatment',98.4,'2025-11-03 16:15:00','2025-11-03 17:00:00',9,'2025-11-12 17:15:35','Nurse Sarah','2025-11-12 17:15:35','Dr. Wilson'),(29,1029,10,3,'2025-11-04 09:30:00','112/68',3,3,'Completed','Normal fetal development, 28 weeks gestation','Prenatal checkup','Obstetrics',25.00,'card',25.00,195.00,1,'Normal pregnancy, mild back pain',98.9,'2025-11-04 09:30:00','2025-11-04 10:20:00',10,'2025-11-12 17:15:35','Nurse Mike','2025-11-12 17:15:35','Dr. Garcia'),(30,1030,11,2,'2025-11-04 14:45:00','120/78',1,2,'Completed','Seasonal allergies confirmed, prescription provided','Allergy testing','Allergy/Immunology',15.00,'card',15.00,125.00,1,'Sneezing, itchy eyes during spring season',98.6,'2025-11-04 14:45:00','2025-11-04 15:30:00',11,'2025-11-12 17:15:35','Nurse Jane','2025-11-12 17:15:35','Dr. Smith'),(31,1031,12,1,'2025-11-05 11:30:00','126/80',2,1,'Completed','Cleared for sports participation','Sports physical','Primary Care',20.00,'cash',20.00,110.00,1,'Healthy adolescent, no limitations',98.7,'2025-11-05 11:30:00','2025-11-05 12:00:00',12,'2025-11-12 17:15:35','Nurse Sarah','2025-11-12 17:15:35','Dr. Wilson'),(32,1032,13,3,'2025-11-05 15:00:00','118/74',3,3,'Completed','Mild myopia, prescription updated','Eye examination','Ophthalmology',25.00,'card',25.00,185.00,1,'Blurry distance vision',98.4,'2025-11-05 15:00:00','2025-11-05 15:50:00',13,'2025-11-12 17:15:35','Nurse Mike','2025-11-12 17:15:35','Dr. Martinez'),(33,1033,14,2,'2025-11-06 10:45:00','122/78',4,2,'Completed','Nutritional assessment completed, diet plan provided','Nutrition counseling','Nutrition',20.00,'card',20.00,140.00,1,'Weight management goals',98.6,'2025-11-06 10:45:00','2025-11-06 11:30:00',14,'2025-11-12 17:15:35','Nurse Jane','2025-11-12 17:15:35','Dr. Taylor'),(34,1012,4,2,'2025-11-06 09:00:00','128/82',1,1,'Completed','Upper respiratory infection, antibiotics prescribed','Follow-up consultation','Internal Medicine',20.00,'card',20.00,120.00,1,'Cough, congestion, low-grade fever',99.2,'2025-11-06 09:00:00','2025-11-06 09:45:00',4,'2025-11-12 17:15:35','Nurse Sarah','2025-11-12 17:15:35','Dr. Smith'),(35,1013,5,1,'2025-11-06 13:00:00','118/76',1,2,'Completed','Tetanus booster administered','Vaccination','Primary Care',0.00,NULL,0.00,75.00,1,'Routine immunization update',98.8,'2025-11-06 13:00:00','2025-11-06 13:20:00',5,'2025-11-12 17:15:35','Nurse Jane','2025-11-12 17:15:35','Dr. Smith'),(36,1036,17,2,'2025-11-12 09:00:00','138/88',7,3,'Completed','Acute sinusitis, antibiotic treatment started','Urgent care','Urgent Care',25.00,'card',25.00,180.00,1,'Facial pain, nasal congestion, headache',100.2,'2025-11-12 09:00:00','2025-11-12 09:50:00',17,'2025-11-12 17:15:35','Nurse Mike','2025-11-12 17:15:35','Dr. Anderson'),(37,1037,18,1,'2025-11-12 09:15:00','120/78',1,1,'Completed','Blood work completed, results pending','Blood work','Laboratory',15.00,'card',15.00,95.00,1,'Routine blood panel ordered',98.6,'2025-11-12 09:15:00','2025-11-12 09:45:00',18,'2025-11-12 17:15:35','Nurse Sarah','2025-11-12 17:15:35','Dr. Smith'),(39,1059,8,1,NULL,'124/80',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,245.00,NULL,'hurt',98.4,'2025-11-15 12:12:46',NULL,8,'2025-11-15 12:12:46',NULL,'2025-11-18 06:06:39',NULL),(41,1060,5,1,'2025-11-15 16:45:00','81/100',1,6,'Scheduled','alcohol poisoning',NULL,NULL,NULL,NULL,NULL,215.00,NULL,'dizziness',98.6,NULL,NULL,5,'2025-11-15 20:43:19',NULL,'2025-11-15 22:26:39','Emily Chen'),(45,1063,2,1,NULL,'81/100',1,6,'Scheduled',NULL,NULL,NULL,20.00,'card',20.00,NULL,NULL,NULL,98.6,'2025-11-17 02:49:32',NULL,2,'2025-11-15 22:26:54',NULL,'2025-11-21 20:19:02','d.thompson@medconnect.com'),(46,1065,212,1,NULL,'75/40',1,6,'Scheduled','Sick',NULL,NULL,20.00,NULL,NULL,215.00,NULL,'Checkup',95.0,'2025-11-15 23:58:12',NULL,45,'2025-11-15 23:58:12',NULL,'2025-11-17 22:29:40','Emily Chen'),(47,1066,212,1,NULL,NULL,1,6,'Scheduled',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2025-11-17 02:48:57',NULL,45,'2025-11-16 01:11:58',NULL,'2025-11-17 02:48:57',NULL),(48,1058,1,1,'2025-11-17 01:01:29','84/55',1,6,'Scheduled','flu',NULL,NULL,NULL,NULL,NULL,215.00,NULL,'Headache.',98.6,'2025-11-16 21:54:05',NULL,1,'2025-11-16 21:54:05',NULL,'2025-11-21 20:19:02',''),(49,1067,1,1,NULL,'100',8,6,'Canceled',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'nausea',100.0,'2025-11-17 06:17:33',NULL,1,'2025-11-17 06:17:33',NULL,'2025-11-18 00:44:11','tnguyen@medconnect.com'),(50,1068,2,1,NULL,'119/90',1,6,'Scheduled',NULL,NULL,NULL,20.00,'card',20.00,215.00,NULL,'nausea',100.6,'2025-11-17 13:29:33',NULL,2,'2025-11-17 13:29:33',NULL,'2025-11-19 19:44:03','tnguyen@medconnect.com'),(52,1006,8,2,NULL,'80/45',3,3,'Scheduled','sick',NULL,NULL,20.00,'card',20.00,215.00,NULL,'dizziness',96.1,'2025-11-18 21:18:08',NULL,8,'2025-11-18 21:18:08',NULL,'2025-11-18 22:16:36','s.rodriguez@medconnect.com'),(61,NULL,2,1,NULL,NULL,1,6,'Scheduled',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2025-11-18 23:16:15',NULL,2,'2025-11-18 23:16:15',NULL,'2025-11-18 23:16:15',NULL),(63,NULL,2,1,NULL,NULL,1,6,'Scheduled',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2025-11-19 02:03:34',NULL,2,'2025-11-19 02:03:34',NULL,'2025-11-19 02:03:34',NULL),(65,NULL,1,1,NULL,'120/89',1,6,'Scheduled','sick having flu',NULL,NULL,NULL,NULL,NULL,55.00,NULL,'nausea',100.0,'2025-11-19 22:42:32',NULL,1,'2025-11-19 22:42:32',NULL,'2025-11-19 23:08:54','tnguyen@medconnect.com'),(67,1092,1,1,NULL,'120/80',1,6,'Scheduled','flu',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'headache',100.0,'2025-11-19 23:42:41',NULL,1,'2025-11-19 23:42:41',NULL,'2025-11-21 19:59:54','Emily Chen');
/*!40000 ALTER TABLE `patient_visit` ENABLE KEYS */;
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
/*!50003 CREATE*/ /*!50017 DEFINER=`aad_mysql_medapp`@`%`*/ /*!50003 TRIGGER `trg_check_insurance_expiration_on_checkin` BEFORE INSERT ON `patient_visit` FOR EACH ROW BEGIN
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
    
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

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
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
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
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `referral`
--

LOCK TABLES `referral` WRITE;
/*!40000 ALTER TABLE `referral` DISABLE KEYS */;
INSERT INTO `referral` VALUES (1,5,NULL,2,4,'Orthopedic consultation for knee pain',1008),(2,1,'2025-10-25',1,7,'Dermatology screening for skin rash',NULL),(3,4,'2025-10-16',4,2,'Cardiology evaluation for chest pain',NULL),(4,1,NULL,1,2,'Heart check ',NULL),(5,3,NULL,1,1,'test',NULL),(6,3,'2025-11-04',1,2,'heart test',NULL),(7,5,'2025-11-04',2,1,'internal test',NULL),(8,1,'2025-11-04',1,2,'heart',NULL),(9,2,'2025-11-13',6,2,'heart check',NULL),(10,2,'2025-11-17',1,2,'broken heart ',NULL),(11,4,'2025-11-18',3,2,'Heart ',NULL),(12,228,'2025-11-19',1,10,'my skinn',NULL),(13,1,'2025-11-19',1,2,'heart broken ',NULL);
/*!40000 ALTER TABLE `referral` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sessions`
--

DROP TABLE IF EXISTS `sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sessions` (
  `session_id` varchar(128) NOT NULL,
  `session_data` text,
  `last_access` int unsigned NOT NULL,
  PRIMARY KEY (`session_id`),
  KEY `idx_last_access` (`last_access`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sessions`
--

LOCK TABLES `sessions` WRITE;
/*!40000 ALTER TABLE `sessions` DISABLE KEYS */;
INSERT INTO `sessions` VALUES ('4057508b1d8f7bfa9f69d45ff654428f','uid|i:205;email|s:20:\"echen@medconnect.com\";role|s:6:\"DOCTOR\";username|s:4:\"d201\";first_name|s:5:\"Emily\";last_name|s:4:\"Chen\";',1763957886),('8abeeb5e03f5d97a988149af421381de','',1764015765),('8c3132983107d17157d0a3cb4d138a8e','uid|i:233;email|s:16:\"paul.b@email.com\";role|s:7:\"PATIENT\";username|s:10:\"paulbunion\";first_name|s:4:\"paul\";last_name|s:6:\"bunion\";patient_id|i:233;',1764031768),('8e2bf1b0b61a733740ff4c1a82dfc29b','uid|i:204;email|s:25:\"d.thompson@medconnect.com\";role|s:12:\"RECEPTIONIST\";username|s:4:\"r501\";first_name|s:6:\"Daniel\";last_name|s:8:\"Thompson\";',1764031776),('928e2289ac85f57d72810bfacec9c112','uid|i:106;email|s:22:\"tnguyen@medconnect.com\";role|s:5:\"NURSE\";username|s:4:\"n301\";first_name|s:4:\"Tina\";last_name|s:6:\"Nguyen\";',1764031749),('c75ab0907de664353cc87fc84245108b','',1764024756);
/*!40000 ALTER TABLE `sessions` ENABLE KEYS */;
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
/*!50003 CREATE*/ /*!50017 DEFINER=`aad_mysql_medapp`@`%`*/ /*!50003 TRIGGER `sessions_AFTER_INSERT` AFTER INSERT ON `sessions` FOR EACH ROW BEGIN
    UPDATE appointment SET Status = 'Waiting'
    WHERE Status = 'Scheduled' 
      AND Appointment_date <= (NOW() - INTERVAL 6 HOUR)
      AND Appointment_date >= (NOW() - INTERVAL 6 HOUR) - INTERVAL 30 DAY;
    
    -- Update Waiting -> No-Show if more than 15 minutes late (in local time)
    UPDATE appointment SET Status = 'No-Show'
    WHERE Status = 'Waiting' 
      AND Appointment_date <= (NOW() - INTERVAL 6 HOUR) - INTERVAL 15 MINUTE
      AND Appointment_date >= (NOW() - INTERVAL 6 HOUR) - INTERVAL 30 DAY;
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
/*!50003 CREATE*/ /*!50017 DEFINER=`aad_mysql_medapp`@`%`*/ /*!50003 TRIGGER `trg_session_update_update_appointments` AFTER UPDATE ON `sessions` FOR EACH ROW BEGIN
    UPDATE appointment SET Status = 'Waiting'
    WHERE Status = 'Scheduled' 
      AND Appointment_date <= (NOW() - INTERVAL 6 HOUR)
      AND Appointment_date >= (NOW() - INTERVAL 6 HOUR) - INTERVAL 30 DAY;
    
    -- Update Waiting -> No-Show if more than 15 minutes late (in local time)
    UPDATE appointment SET Status = 'No-Show'
    WHERE Status = 'Waiting' 
      AND Appointment_date <= (NOW() - INTERVAL 6 HOUR) - INTERVAL 15 MINUTE
      AND Appointment_date >= (NOW() - INTERVAL 6 HOUR) - INTERVAL 30 DAY;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

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
  `staff_role` varchar(20) NOT NULL,
  `license_number` varchar(30) DEFAULT NULL,
  PRIMARY KEY (`staff_id`),
  UNIQUE KEY `ssn` (`ssn`),
  UNIQUE KEY `staff_email` (`staff_email`),
  KEY `idx_staff_gender` (`gender`),
  CONSTRAINT `fk_staff__gender` FOREIGN KEY (`gender`) REFERENCES `codes_gender` (`gender_code`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_staff_id` FOREIGN KEY (`staff_id`) REFERENCES `user_account` (`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=233 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `staff`
--

LOCK TABLES `staff` WRITE;
/*!40000 ALTER TABLE `staff` DISABLE KEYS */;
INSERT INTO `staff` VALUES (101,'Jennifer','Taylor','987-65-4326',2,'j.taylor@medconnect.com','Nurse','RN123456'),(102,'Michael','Chen','987-65-4327',1,'m.chen@medconnect.com','Nurse','RN123457'),(103,'Sarah','Rodriguez','987-65-4328',2,'s.rodriguez@medconnect.com','Nurse','RN123458'),(104,'David','Anderson','987-65-4329',1,'d.anderson@medconnect.com','Nurse','RN123459'),(105,'Lisa','Martinez','987-65-4330',2,'l.martinez@medconnect.com','Nurse','RN123460'),(106,'Tina','Nguyen','987-65-4335',2,'tnguyen@medconnect.com','Nurse','RN123461'),(201,'Amanda','Wilson','987-65-4331',2,'a.wilson@medconnect.com','Administrator',NULL),(202,'Christopher','Lee','987-65-4332',1,'c.lee@medconnect.com','Receptionist',NULL),(204,'Daniel','Thompson','987-65-4334',1,'d.thompson@medconnect.com','Receptionist','RTT123456'),(205,'Emily','Chen','123-45-6781',2,'echen@medconnect.com','Doctor','TXMD123456'),(206,'James','Rodriguez','123-45-6782',1,'jrodriguez@medconnect.com','Doctor','TXMD123457'),(207,'Susan','Lee','123-45-6783',2,'slee@medconnect.com','Doctor','TXMD123458'),(208,'Richard','Patel','123-45-6784',1,'rpatel@medconnect.com','Doctor','TXMD123459'),(209,'Maria','Garcia','123-45-6785',2,'mgarcia@medconnect.com','Doctor','TXMD123460'),(210,'David','Kim','123-45-6786',1,'dkim@medconnect.com','Doctor','TXMD123461'),(214,'Abe','Lincoln','645616156',1,'abe.linc@medconnect.com','Doctor','TXMD196169'),(216,'Teddy','Roosevelt','212615698',1,'ted.roos@medconnect.com','Nurse','RN615616'),(217,'Lisa','Wong','123-45-6787',2,'lwong@medconnect.com','Doctor','TXMD123462'),(219,'Kelvin','bozo','818919191',1,'kelvin.bozo@medconnect.com','Receptionist',''),(220,'Tyler','Knox','901230971',1,'ty.knox@medconnect.com','Receptionist',''),(222,'ty','me','123123123',1,'ty.me@medconnect.com','Doctor','TXMD124124'),(227,'Atia ','Ibrahim','102938012',2,'epluna@gmail.com','Doctor','TXMD021309'),(230,'Em','Ibrahim','283740327',3,'emaad.i@medconnect.com','Doctor','TXMD123123'),(232,'Kelv','uin','123987953',2,'kel@medconnect.com','Doctor','TXMD263536');
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
) ENGINE=InnoDB AUTO_INCREMENT=53 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `treatment_per_visit`
--

LOCK TABLES `treatment_per_visit` WRITE;
/*!40000 ALTER TABLE `treatment_per_visit` DISABLE KEYS */;
INSERT INTO `treatment_per_visit` (`visit_treatment_id`, `visit_id`, `treatment_id`, `quantity`, `cost_each`, `notes`) VALUES (1,1,6,1,215.00,'Annual physical for established patient'),(2,1,16,1,35.00,'Routine A1c monitoring'),(3,1,17,1,15.00,'Fasting glucose check'),(4,2,1,1,125.00,'Follow-up for cholesterol management'),(5,2,18,1,65.00,'Lipid panel ordered'),(9,15,1,1,125.00,'Sick visit for flu symptoms'),(10,15,19,1,55.00,'Rapid influenza test'),(11,15,21,1,25.00,'Symptomatic relief'),(12,16,1,1,125.00,'Routine follow-up'),(31,5,7,1,215.00,''),(32,5,19,1,15.00,''),(33,6,19,1,15.00,''),(34,41,7,1,215.00,''),(35,46,7,1,215.00,''),(45,39,8,1,245.00,''),(48,48,7,1,215.00,''),(50,50,7,1,215.00,''),(52,65,17,1,55.00,'');
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
) ENGINE=InnoDB AUTO_INCREMENT=234 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_account`
--

LOCK TABLES `user_account` WRITE;
/*!40000 ALTER TABLE `user_account` DISABLE KEYS */;
INSERT INTO `user_account` VALUES (1,'p101','john.smith@email.com','$2y$12$mvBaL8ar53TL1LXEbqK4eeVOa8jPs922vF3dVcWRRR36uP0Dvhqx2','PATIENT',0,'2025-11-24 22:52:03',0,1,'2025-10-22 04:54:59','2025-11-24 22:52:03'),(2,'p102','maria.garcia@email.com','$2y$12$mvBaL8ar53TL1LXEbqK4eeVOa8jPs922vF3dVcWRRR36uP0Dvhqx2','PATIENT',0,'2025-11-24 23:14:56',0,1,'2025-10-28 18:50:06','2025-11-24 23:14:56'),(3,'p3','david.johnson@email.com','$2y$10$PLACEHOLDER_HASH_FOR_FORCED_RESET','PATIENT',0,NULL,0,0,'2025-11-17 03:30:36','2025-11-17 03:30:36'),(4,'p4','sarah.williams@email.com','$2y$10$PLACEHOLDER_HASH_FOR_FORCED_RESET','PATIENT',0,NULL,0,0,'2025-11-17 03:30:36','2025-11-17 03:30:36'),(5,'p5','michael.brown@email.com','$2y$10$PLACEHOLDER_HASH_FOR_FORCED_RESET','PATIENT',0,NULL,0,0,'2025-11-17 03:30:36','2025-11-17 03:30:36'),(6,'p6','jennifer.davis@email.com','$2y$10$PLACEHOLDER_HASH_FOR_FORCED_RESET','PATIENT',0,NULL,0,0,'2025-11-17 03:30:36','2025-11-17 03:30:36'),(7,'p7','robert.miller@email.com','$2y$10$PLACEHOLDER_HASH_FOR_FORCED_RESET','PATIENT',0,NULL,0,0,'2025-11-17 03:30:36','2025-11-17 03:30:36'),(8,'p8','lisa.wilson@email.com','$2y$10$PLACEHOLDER_HASH_FOR_FORCED_RESET','PATIENT',0,NULL,0,0,'2025-11-17 03:30:36','2025-11-17 03:30:36'),(9,'emaad980','emaad980@gmail.com','$2y$12$Cs7Vap7sWXRfkbcjniOAU.P6I2oKa81asl1qPEYS0Ih8uEiz0o1s2','PATIENT',0,'2025-11-01 20:39:30',0,1,'2025-11-01 20:27:29','2025-11-08 22:34:42'),(10,'kathiana119','kathiana119@gmail.com','$2y$12$g34AFS8Sjji2SLi.EvTltevK991t6CfDs4QNMg0cevjgxWgHMy.cO','PATIENT',0,'2025-11-04 00:25:55',0,1,'2025-11-04 00:25:39','2025-11-08 22:34:42'),(11,'p11','bart.fitz@email.com','$2y$10$PLACEHOLDER_HASH_FOR_FORCED_RESET','PATIENT',0,NULL,0,0,'2025-11-17 03:30:36','2025-11-17 03:30:36'),(12,'p12','g.pembroke@email.com','$2y$10$PLACEHOLDER_HASH_FOR_FORCED_RESET','PATIENT',0,NULL,0,0,'2025-11-17 03:30:36','2025-11-17 03:30:36'),(13,'p13','ted.montgomery@email.com','$2y$10$PLACEHOLDER_HASH_FOR_FORCED_RESET','PATIENT',0,NULL,0,0,'2025-11-17 03:30:36','2025-11-17 03:30:36'),(14,'p14','sera.whitaker@email.com','$2y$10$PLACEHOLDER_HASH_FOR_FORCED_RESET','PATIENT',0,NULL,0,0,'2025-11-17 03:30:36','2025-11-17 03:30:36'),(15,'p15','percy.h@email.com','$2y$10$PLACEHOLDER_HASH_FOR_FORCED_RESET','PATIENT',0,NULL,0,0,'2025-11-17 03:30:36','2025-11-17 03:30:36'),(16,'p16','lysandra.b@email.com','$2y$10$PLACEHOLDER_HASH_FOR_FORCED_RESET','PATIENT',0,NULL,0,0,'2025-11-17 03:30:36','2025-11-17 03:30:36'),(17,'p17','alistair.k@email.com','$2y$10$PLACEHOLDER_HASH_FOR_FORCED_RESET','PATIENT',0,NULL,0,0,'2025-11-17 03:30:36','2025-11-17 03:30:36'),(18,'p18','gwen.ashworth@email.com','$2y$10$PLACEHOLDER_HASH_FOR_FORCED_RESET','PATIENT',0,NULL,0,0,'2025-11-17 03:30:36','2025-11-17 03:30:36'),(19,'p19','phineas.w@email.com','$2y$10$PLACEHOLDER_HASH_FOR_FORCED_RESET','PATIENT',0,NULL,0,0,'2025-11-17 03:30:36','2025-11-17 03:30:36'),(20,'p20','cordelia.f@email.com','$2y$10$PLACEHOLDER_HASH_FOR_FORCED_RESET','PATIENT',0,NULL,0,0,'2025-11-17 03:30:36','2025-11-17 03:30:36'),(21,'p21','ben.kingsley@email.com','$2y$10$PLACEHOLDER_HASH_FOR_FORCED_RESET','PATIENT',0,NULL,0,0,'2025-11-17 03:30:36','2025-11-17 03:30:36'),(22,'p22','octavia.r@email.com','$2y$10$PLACEHOLDER_HASH_FOR_FORCED_RESET','PATIENT',0,NULL,0,0,'2025-11-17 03:30:36','2025-11-17 03:30:36'),(23,'p23','seb.hawthorne@email.com','$2y$10$PLACEHOLDER_HASH_FOR_FORCED_RESET','PATIENT',0,NULL,0,0,'2025-11-17 03:30:36','2025-11-17 03:30:36'),(24,'p24','persephone.v@email.com','$2y$10$PLACEHOLDER_HASH_FOR_FORCED_RESET','PATIENT',0,NULL,0,0,'2025-11-17 03:30:36','2025-11-17 03:30:36'),(25,'p25','atticus.p@email.com','$2y$10$PLACEHOLDER_HASH_FOR_FORCED_RESET','PATIENT',0,NULL,0,0,'2025-11-17 03:30:36','2025-11-17 03:30:36'),(101,'n101','j.taylor@medconnect.com','$2y$10$PLACEHOLDER_HASH_FOR_FORCED_RESET','NURSE',0,NULL,0,0,'2025-11-17 03:28:05','2025-11-17 03:28:05'),(102,'n102','m.chen@medconnect.com','$2y$10$PLACEHOLDER_HASH_FOR_FORCED_RESET','NURSE',0,NULL,0,0,'2025-11-17 03:28:05','2025-11-17 03:28:05'),(103,'n103','s.rodriguez@medconnect.com','$2y$12$mvBaL8ar53TL1LXEbqK4eeVOa8jPs922vF3dVcWRRR36uP0Dvhqx2','NURSE',0,'2025-11-19 22:36:15',0,1,'2025-11-17 03:28:05','2025-11-19 22:36:15'),(104,'n104','d.anderson@medconnect.com','$2y$10$PLACEHOLDER_HASH_FOR_FORCED_RESET','NURSE',0,NULL,0,0,'2025-11-17 03:28:05','2025-11-17 03:28:05'),(105,'n105','l.martinez@medconnect.com','$2y$10$PLACEHOLDER_HASH_FOR_FORCED_RESET','NURSE',0,NULL,0,0,'2025-11-17 03:28:05','2025-11-17 03:28:05'),(106,'n301','tnguyen@medconnect.com','$2y$12$mvBaL8ar53TL1LXEbqK4eeVOa8jPs922vF3dVcWRRR36uP0Dvhqx2','NURSE',0,'2025-11-24 23:39:13',0,1,'2025-10-23 14:54:01','2025-11-24 23:39:13'),(201,'a305','a.wilson@medconnect.com','$2y$12$mvBaL8ar53TL1LXEbqK4eeVOa8jPs922vF3dVcWRRR36uP0Dvhqx2','ADMIN',0,'2025-11-22 15:32:36',0,1,'2025-10-25 14:54:01','2025-11-22 15:32:36'),(202,'r202','c.lee@medconnect.com','$2y$12$mvBaL8ar53TL1LXEbqK4eeVOa8jPs922vF3dVcWRRR36uP0Dvhqx2','RECEPTIONIST',0,'2025-11-18 22:03:09',0,1,'2025-11-17 03:28:05','2025-11-18 22:03:09'),(204,'r501','d.thompson@medconnect.com','$2y$12$mvBaL8ar53TL1LXEbqK4eeVOa8jPs922vF3dVcWRRR36uP0Dvhqx2','RECEPTIONIST',0,'2025-11-25 00:49:03',0,1,'2025-11-06 00:39:39','2025-11-25 00:49:03'),(205,'d201','echen@medconnect.com','$2y$12$mvBaL8ar53TL1LXEbqK4eeVOa8jPs922vF3dVcWRRR36uP0Dvhqx2','DOCTOR',0,'2025-11-23 04:45:42',0,1,'2025-10-22 04:54:59','2025-11-23 04:45:42'),(206,'d202','jrodriguez@medconnect.com','$2y$12$mvBaL8ar53TL1LXEbqK4eeVOa8jPs922vF3dVcWRRR36uP0Dvhqx2','DOCTOR',0,'2025-11-17 07:07:26',0,1,'2025-11-04 00:25:39','2025-11-17 07:07:26'),(207,'d207','slee@medconnect.com','$2y$12$mvBaL8ar53TL1LXEbqK4eeVOa8jPs922vF3dVcWRRR36uP0Dvhqx2','DOCTOR',0,'2025-11-18 21:51:54',0,1,'2025-11-17 03:28:05','2025-11-18 21:51:54'),(208,'d208','rpatel@medconnect.com','$2y$10$PLACEHOLDER_HASH_FOR_FORCED_RESET','DOCTOR',0,NULL,0,0,'2025-11-17 03:28:05','2025-11-17 03:28:05'),(209,'d209','mgarcia@medconnect.com','$2y$10$PLACEHOLDER_HASH_FOR_FORCED_RESET','DOCTOR',0,NULL,0,0,'2025-11-17 03:28:05','2025-11-17 03:28:05'),(210,'d203','dkim@medconnect.com','$2y$12$mvBaL8ar53TL1LXEbqK4eeVOa8jPs922vF3dVcWRRR36uP0Dvhqx2','DOCTOR',0,'2025-11-13 01:16:11',0,1,'2025-11-04 00:25:39','2025-11-13 01:16:11'),(211,'niuli','niuli@gmail.com','$2y$12$AnvqG02Ud6Jk33wyrXqlLe2VHHAXrA8WcOImdkIxN6F.4K.Nppwx.','PATIENT',0,'2025-11-15 21:20:23',0,1,'2025-11-15 21:17:43','2025-11-15 21:20:23'),(212,'jennifer.sanchez','jennifer.sanchez@email.com','$2y$12$xkkRT2Jnip7FKQ2HuT4hY.VTN2i/89QhPDwgHb3X7f4AlfNkAAK/q','PATIENT',0,'2025-11-21 20:02:43',0,1,'2025-11-15 22:37:20','2025-11-21 20:02:43'),(214,'d214','abe.linc@medconnect.com','$2y$12$mvBaL8ar53TL1LXEbqK4eeVOa8jPs922vF3dVcWRRR36uP0Dvhqx2','DOCTOR',0,'2025-11-17 06:51:53',0,1,'2025-11-17 02:17:04','2025-11-19 17:41:37'),(216,'n216','ted.roos@medconnect.com','$2y$12$W6Xeyrd3gchNrF21ERzE0uOiBFdn3XYL.haTswuFIqULE2cYMOab.','NURSE',0,'2025-11-17 02:28:20',0,1,'2025-11-17 02:25:01','2025-11-17 02:28:20'),(217,'d217','lwong@medconnect.com','$2y$12$W6Xeyrd3gchNrF21ERzE0uOiBFdn3XYL.haTswuFIqULE2cYMOab.','DOCTOR',0,NULL,0,1,'2025-11-16 22:47:42','2025-11-16 22:47:50'),(218,'queen.linc','queen.linc@email.com','$2y$12$dddpaZaHvGTR81Axwy58SugVckc3suJDVVr88Q2i.chPb6Cf/C042','PATIENT',0,'2025-11-17 05:27:41',0,1,'2025-11-17 05:27:01','2025-11-17 05:27:41'),(219,'r219','kelvin.bozo@medconnect.com','$2y$12$mvBaL8ar53TL1LXEbqK4eeVOa8jPs922vF3dVcWRRR36uP0Dvhqx2','RECEPTIONIST',0,'2025-11-18 19:24:30',0,1,'2025-11-17 05:29:11','2025-11-18 19:24:30'),(220,'r220','ty.knox@medconnect.com','$2y$12$zF70lWRwVyQpywQZ71MVsenR5QknuWW6PWniQ4XLf5TrLNtUb4vCa','RECEPTIONIST',0,'2025-11-18 19:55:36',0,1,'2025-11-18 19:22:57','2025-11-18 19:55:36'),(221,'jim.ash','jim.ash@email.com','$2y$12$qrpX0qOIINBGIDvkFJnPWuiziD6LacMGreCjillSV1AtL67XGqi1u','PATIENT',0,'2025-11-18 20:51:15',0,1,'2025-11-18 20:51:02','2025-11-18 20:51:15'),(222,'d222','ty.me@medconnect.com','$2y$12$h.Y2rNSDAb4P8JLlWzP25ueZUXsACsLb95G4jtoXtU1NCGGjmR.Re','DOCTOR',0,'2025-11-18 21:08:31',0,1,'2025-11-18 20:53:04','2025-11-18 21:08:31'),(223,'justin.bieber','justin.bieber@email.com','$2y$12$SZAEnOqGUTVru90qY4aMQe...UpXXM8wjDSUpAciCyyIdNUO14RbC','PATIENT',0,'2025-11-19 06:08:08',0,1,'2025-11-19 06:07:19','2025-11-19 06:08:08'),(224,'t.do','t.do@gmail.com','$2y$12$2kWSzOUAPYHRIU.1XOGboO2PW0dJv7qcVBT7uJrVZbK41lh/3KnJK','PATIENT',0,'2025-11-19 18:48:28',0,1,'2025-11-19 06:08:41','2025-11-19 18:48:28'),(225,'jason.stathem','jason.stathem@email.com','$2y$12$gM.MO6nUJZbPS8FOQDYV1ulYnK5MYq9jP9qhLBNZFJHZJDbhdB/iO','PATIENT',0,'2025-11-19 08:14:31',0,1,'2025-11-19 08:11:24','2025-11-19 08:14:31'),(226,'elena.orozco','elena.orozco@email.com','$2y$12$XrC5jMiWyZfzyb4nIBqzEOLTqX0nbwm/fgbxYIp9zjo3B1Ow.tqza','PATIENT',0,'2025-11-24 20:07:11',0,1,'2025-11-19 22:32:44','2025-11-24 20:07:11'),(227,'d227','epluna@gmail.com','$2y$12$XFiVdrbWAclbqkaq.sQjPObjuFpsI5sxpadZt58YZXpAoiI6aZUza','DOCTOR',0,NULL,0,1,'2025-11-19 22:53:12','2025-11-19 22:53:12'),(228,'emaad9801','emaad980@email.com','$2y$12$Dy/ZMGOU0i.OA9Fi5PRO5OxM5crahDIhEnf1JbHJZ0KS3ZZT78hUW','PATIENT',0,'2025-11-19 22:57:44',0,1,'2025-11-19 22:57:24','2025-11-19 22:57:44'),(230,'d230','emaad.i@medconnect.com','$2y$12$fF8rezLu5Qg7t6yV3UDs5OTNUFkMeyN5gIf2QzV5vExTJpj5ygItG','DOCTOR',0,NULL,0,1,'2025-11-19 23:29:52','2025-11-19 23:29:52'),(231,'emaa','emaa@email.com','$2y$12$vofQf2TqwdduLGdak1K5HOM97tRDZtRaWLs4NeEdU6kLAS6z0T/ym','PATIENT',0,'2025-11-19 23:35:13',0,1,'2025-11-19 23:34:42','2025-11-19 23:35:13'),(232,'d232','kel@medconnect.com','$2y$12$BjviNCMOtuOCrxGoCICzm.IzR1ja2OjDbsI1hhbdAsPpfXjQDATzK','DOCTOR',0,NULL,0,1,'2025-11-21 18:19:30','2025-11-21 18:19:30'),(233,'paul.b','paul.b@email.com','$2y$12$Qq8zBJqo8CnAyFrlLbdGveo9Ig773odpJYpZjHDg3mZi10GNVuUyG','PATIENT',0,'2025-11-25 00:49:27',0,1,'2025-11-25 00:49:18','2025-11-25 00:49:27');
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
  `days` date DEFAULT NULL,
  `start_time` time DEFAULT NULL,
  `end_time` time DEFAULT NULL,
  `day_of_week` enum('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday') DEFAULT NULL,
  PRIMARY KEY (`schedule_id`),
  KEY `idx_ws_office` (`office_id`),
  KEY `idx_ws_staff` (`staff_id`),
  KEY `idx_ws_daydate` (`day_of_week`,`days`),
  CONSTRAINT `fk_ws_staff` FOREIGN KEY (`staff_id`) REFERENCES `staff` (`staff_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_wsin__office` FOREIGN KEY (`office_id`) REFERENCES `office` (`office_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `chk_ws_times` CHECK (((`end_time` is null) or (`start_time` is null) or (`start_time` <= `end_time`)))
) ENGINE=InnoDB AUTO_INCREMENT=333 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `work_schedule`
--

LOCK TABLES `work_schedule` WRITE;
/*!40000 ALTER TABLE `work_schedule` DISABLE KEYS */;
INSERT INTO `work_schedule` VALUES (1,1,205,NULL,'08:00:00','16:00:00','Monday'),(3,1,205,NULL,'08:00:00','16:00:00','Friday'),(4,2,205,NULL,'09:00:00','17:00:00','Tuesday'),(5,2,205,NULL,'09:00:00','17:00:00','Thursday'),(6,1,206,NULL,'09:00:00','17:00:00','Tuesday'),(7,1,206,NULL,'09:00:00','17:00:00','Thursday'),(8,3,206,NULL,'08:00:00','16:00:00','Monday'),(9,3,206,NULL,'08:00:00','18:00:00','Wednesday'),(10,3,206,NULL,'08:00:00','16:00:00','Friday'),(11,2,207,NULL,'10:00:00','18:00:00','Monday'),(12,2,207,NULL,'10:00:00','18:00:00','Wednesday'),(13,2,207,NULL,'10:00:00','18:00:00','Friday'),(14,4,207,NULL,'08:00:00','16:00:00','Tuesday'),(15,4,207,NULL,'08:00:00','16:00:00','Thursday'),(16,3,208,NULL,'07:00:00','15:00:00','Tuesday'),(17,3,208,NULL,'07:00:00','15:00:00','Thursday'),(18,4,208,NULL,'09:00:00','17:00:00','Monday'),(19,4,208,NULL,'09:00:00','17:00:00','Wednesday'),(20,4,208,NULL,'09:00:00','17:00:00','Friday'),(22,1,209,NULL,'07:00:00','15:00:00','Wednesday'),(23,4,209,NULL,'08:00:00','16:00:00','Tuesday'),(24,4,209,NULL,'08:00:00','16:00:00','Thursday'),(25,4,209,NULL,'08:00:00','12:00:00','Friday'),(26,2,210,NULL,'07:00:00','15:00:00','Tuesday'),(27,2,210,NULL,'07:00:00','15:00:00','Thursday'),(28,3,210,NULL,'10:00:00','18:00:00','Monday'),(29,3,210,NULL,'10:00:00','18:00:00','Wednesday'),(30,3,210,NULL,'10:00:00','18:00:00','Friday'),(31,1,217,NULL,'09:00:00','17:00:00','Thursday'),(32,2,217,NULL,'09:00:00','17:00:00','Monday'),(33,2,217,NULL,'09:00:00','17:00:00','Wednesday'),(34,3,217,NULL,'09:00:00','17:00:00','Tuesday'),(35,3,217,NULL,'09:00:00','17:00:00','Friday'),(36,1,201,NULL,'08:00:00','16:00:00','Monday'),(37,1,201,NULL,'08:00:00','16:00:00','Tuesday'),(38,1,201,NULL,'08:00:00','16:00:00','Wednesday'),(39,1,201,NULL,'08:00:00','16:00:00','Thursday'),(40,1,201,NULL,'08:00:00','16:00:00','Friday'),(41,2,202,NULL,'09:00:00','17:00:00','Monday'),(43,2,202,NULL,'09:00:00','17:00:00','Wednesday'),(44,2,202,NULL,'09:00:00','17:00:00','Thursday'),(45,2,202,NULL,'09:00:00','17:00:00','Friday'),(46,1,204,NULL,'08:30:00','16:30:00','Monday'),(47,1,204,NULL,'08:30:00','16:30:00','Tuesday'),(48,1,204,NULL,'08:30:00','16:30:00','Wednesday'),(49,1,204,NULL,'08:30:00','16:30:00','Thursday'),(50,1,204,NULL,'08:30:00','16:30:00','Friday'),(253,4,101,NULL,'08:30:00','16:30:00','Monday'),(254,4,101,NULL,'08:30:00','16:30:00','Tuesday'),(255,4,101,NULL,'08:30:00','16:30:00','Wednesday'),(256,4,101,NULL,'08:30:00','16:30:00','Thursday'),(258,3,102,NULL,'08:30:00','16:30:00','Monday'),(259,3,102,NULL,'08:30:00','16:30:00','Tuesday'),(260,3,102,NULL,'08:30:00','16:30:00','Wednesday'),(261,3,102,NULL,'08:30:00','16:30:00','Thursday'),(262,3,102,NULL,'08:30:00','16:30:00','Friday'),(263,2,103,NULL,'08:30:00','16:30:00','Monday'),(264,2,103,NULL,'08:30:00','16:30:00','Tuesday'),(265,2,103,NULL,'08:30:00','16:30:00','Wednesday'),(266,2,103,NULL,'08:30:00','16:30:00','Thursday'),(267,2,103,NULL,'08:30:00','16:30:00','Friday'),(273,4,105,NULL,'08:30:00','16:30:00','Monday'),(274,4,105,NULL,'08:30:00','16:30:00','Tuesday'),(275,4,105,NULL,'08:30:00','16:30:00','Wednesday'),(276,4,105,NULL,'08:30:00','16:30:00','Thursday'),(277,4,105,NULL,'08:30:00','16:30:00','Friday'),(285,1,106,NULL,'08:30:00','16:30:00','Saturday'),(286,1,106,NULL,'08:30:00','16:30:00','Sunday'),(287,1,204,NULL,'08:30:00','18:30:00',NULL),(288,3,216,NULL,'08:00:00','17:00:00','Monday'),(289,3,216,NULL,'08:00:00','17:00:00','Tuesday'),(290,3,216,NULL,'08:00:00','17:00:00','Wednesday'),(291,3,216,NULL,'08:00:00','17:00:00','Thursday'),(292,3,216,NULL,'08:00:00','17:00:00','Friday'),(293,1,214,NULL,'08:00:00','17:00:00','Monday'),(294,4,214,NULL,'08:00:00','17:00:00','Tuesday'),(295,3,214,NULL,'08:00:00','17:00:00','Wednesday'),(298,3,219,NULL,'08:00:00','17:00:00','Monday'),(299,3,219,NULL,'08:00:00','17:00:00','Tuesday'),(300,3,219,NULL,'08:00:00','17:00:00','Wednesday'),(301,3,219,NULL,'08:00:00','17:00:00','Thursday'),(302,3,219,NULL,'08:00:00','17:00:00','Friday'),(305,2,209,NULL,'08:00:00','17:00:00','Monday'),(306,2,214,NULL,'08:00:00','17:00:00','Friday'),(307,2,214,NULL,'08:00:00','17:00:00','Thursday'),(308,2,202,NULL,'08:00:00','17:00:00','Tuesday'),(309,4,220,NULL,'08:00:00','17:00:00','Monday'),(310,4,220,NULL,'08:00:00','17:00:00','Tuesday'),(311,4,220,NULL,'08:00:00','17:00:00','Wednesday'),(312,4,220,NULL,'08:00:00','17:00:00','Thursday'),(313,4,220,NULL,'08:00:00','17:00:00','Friday'),(314,2,222,NULL,'08:00:00','17:00:00','Monday'),(315,1,104,NULL,'08:00:00','18:00:00','Monday'),(316,1,104,NULL,'08:00:00','18:00:00','Tuesday'),(317,1,104,NULL,'08:00:00','18:00:00','Wednesday'),(318,1,104,NULL,'08:00:00','18:00:00','Thursday'),(319,1,104,NULL,'08:00:00','18:00:00','Friday'),(320,1,106,NULL,'08:00:00','18:00:00','Monday'),(321,1,106,NULL,'08:00:00','18:00:00','Tuesday'),(322,1,106,NULL,'08:00:00','18:00:00','Wednesday'),(323,1,106,NULL,'08:00:00','18:00:00','Thursday'),(324,1,106,NULL,'08:00:00','18:00:00','Friday'),(325,4,101,NULL,'08:00:00','18:00:00','Friday'),(326,3,222,NULL,'08:00:00','18:00:00','Wednesday'),(327,4,222,NULL,'08:00:00','18:00:00','Tuesday'),(328,2,222,NULL,'08:00:00','18:00:00','Thursday'),(329,3,222,NULL,'08:00:00','18:00:00','Friday'),(330,1,205,NULL,'08:00:00','18:00:00','Wednesday'),(331,1,227,NULL,'08:00:00','18:00:00','Wednesday'),(332,1,230,NULL,'08:00:00','18:00:00','Wednesday');
/*!40000 ALTER TABLE `work_schedule` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `work_schedule_templates`
--

DROP TABLE IF EXISTS `work_schedule_templates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `work_schedule_templates` (
  `office_id` int NOT NULL,
  `day_of_week` enum('Monday','Tuesday','Wednesday','Thursday','Friday') NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  PRIMARY KEY (`office_id`,`day_of_week`),
  CONSTRAINT `fk_wst_office` FOREIGN KEY (`office_id`) REFERENCES `office` (`office_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `work_schedule_templates_chk_1` CHECK ((`start_time` < `end_time`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `work_schedule_templates`
--

LOCK TABLES `work_schedule_templates` WRITE;
/*!40000 ALTER TABLE `work_schedule_templates` DISABLE KEYS */;
INSERT INTO `work_schedule_templates` VALUES (1,'Monday','08:00:00','18:00:00'),(1,'Tuesday','08:00:00','18:00:00'),(1,'Wednesday','08:00:00','18:00:00'),(1,'Thursday','08:00:00','18:00:00'),(1,'Friday','08:00:00','18:00:00'),(2,'Monday','08:00:00','18:00:00'),(2,'Tuesday','08:00:00','18:00:00'),(2,'Wednesday','08:00:00','18:00:00'),(2,'Thursday','08:00:00','18:00:00'),(2,'Friday','08:00:00','18:00:00'),(3,'Monday','08:00:00','18:00:00'),(3,'Tuesday','08:00:00','18:00:00'),(3,'Wednesday','08:00:00','18:00:00'),(3,'Thursday','08:00:00','18:00:00'),(3,'Friday','08:00:00','18:00:00'),(4,'Monday','08:00:00','18:00:00'),(4,'Tuesday','08:00:00','18:00:00'),(4,'Wednesday','08:00:00','18:00:00'),(4,'Thursday','08:00:00','18:00:00'),(4,'Friday','08:00:00','18:00:00');
/*!40000 ALTER TABLE `work_schedule_templates` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-11-24 18:50:15
