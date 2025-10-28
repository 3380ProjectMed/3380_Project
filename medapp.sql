-- MySQL dump 10.13  Distrib 8.0.43, for macos15 (x86_64)
--
-- Host: localhost    Database: med-app-db
-- ------------------------------------------------------
-- Server version	8.4.6

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */
;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */
;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */
;
/*!50503 SET NAMES utf8 */
;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */
;
/*!40103 SET TIME_ZONE='+00:00' */
;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */
;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */
;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */
;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */
;

--
-- Table structure for table `Appointment`
--

DROP TABLE IF EXISTS `Appointment`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!50503 SET character_set_client = utf8mb4 */
;
CREATE TABLE `Appointment` (
    `Appointment_id` int NOT NULL AUTO_INCREMENT,
    `Patient_id` int DEFAULT NULL,
    `Doctor_id` int DEFAULT NULL,
    `Office_id` int DEFAULT NULL,
    `Appointment_date` datetime NOT NULL,
    `Date_created` datetime NOT NULL,
    `Reason_for_visit` varchar(300) DEFAULT NULL,
    `Status` enum(
        'Scheduled',
        'Pending',
        'Waiting',
        'In Progress',
        'Completed',
        'Cancelled',
        'No-Show'
    ) DEFAULT NULL,
    PRIMARY KEY (`Appointment_id`),
    KEY `ix_appt_patient` (`Patient_id`),
    KEY `ix_appt_doctor` (`Doctor_id`),
    KEY `ix_appt_office` (`Office_id`),
    CONSTRAINT `fk_appt__doctor` FOREIGN KEY (`Doctor_id`) REFERENCES `Doctor` (`Doctor_id`) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT `fk_appt__office` FOREIGN KEY (`Office_id`) REFERENCES `Office` (`Office_ID`) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT `fk_appt__patient` FOREIGN KEY (`Patient_id`) REFERENCES `Patient` (`Patient_ID`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;

--
-- Dumping data for table `Appointment`
--

LOCK TABLES `Appointment` WRITE;
/*!40000 ALTER TABLE `Appointment` DISABLE KEYS */
;
INSERT INTO
    `Appointment`
VALUES (
        1001,
        1,
        1,
        1,
        '2025-10-23 09:00:00',
        '2025-10-20 14:30:00',
        'Annual physical examination',
        'Scheduled'
    ),
    (
        1002,
        3,
        1,
        1,
        '2025-10-23 14:00:00',
        '2025-10-02 16:45:00',
        'Follow-up consultation',
        'Scheduled'
    ),
    (
        1003,
        5,
        1,
        1,
        '2024-01-15 10:30:00',
        '2023-12-22 09:15:00',
        'Cardiology checkup',
        'Scheduled'
    ),
    (
        1004,
        7,
        2,
        4,
        '2024-01-17 11:00:00',
        '2024-01-08 14:25:00',
        'Heart condition monitoring',
        'Scheduled'
    ),
    (
        1005,
        2,
        3,
        2,
        '2024-01-15 13:30:00',
        '2023-12-28 11:20:00',
        'Pediatric wellness visit',
        'Scheduled'
    ),
    (
        1006,
        8,
        3,
        2,
        '2024-01-18 15:45:00',
        '2024-01-11 12:15:00',
        'Vaccination',
        'Scheduled'
    ),
    (
        1007,
        4,
        4,
        3,
        '2024-01-16 08:45:00',
        '2023-12-28 11:20:00',
        'Orthopedic consultation',
        'Scheduled'
    ),
    (
        1008,
        1,
        4,
        1,
        '2024-01-19 16:00:00',
        '2024-01-09 17:40:00',
        'Knee pain evaluation',
        'Scheduled'
    ),
    (
        1009,
        6,
        5,
        4,
        '2024-01-17 09:30:00',
        '2024-01-05 08:30:00',
        'OB/GYN appointment',
        'Scheduled'
    ),
    (
        1010,
        3,
        6,
        2,
        '2024-01-18 10:00:00',
        '2024-01-12 09:50:00',
        'Internal medicine consultation',
        'Scheduled'
    ),
    (
        1011,
        4,
        7,
        4,
        '2024-01-19 14:30:00',
        '2024-01-15 16:20:00',
        'Dermatology screening',
        'Scheduled'
    ),
    (
        1012,
        4,
        1,
        2,
        '2025-10-25 09:00:00',
        '2025-10-20 09:00:00',
        'Follow-up consultation',
        'In Progress'
    ),
    (
        1013,
        5,
        1,
        1,
        '2025-10-25 13:00:00',
        '2025-10-23 10:00:00',
        'TEST',
        'In Progress'
    );
/*!40000 ALTER TABLE `Appointment` ENABLE KEYS */
;
UNLOCK TABLES;

/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */
;
DELIMITER; ;
/*!50003 CREATE*/
/*!50017 DEFINER=`root`@`%`*/
/*!50003 TRIGGER `trg_appointment_check_referral` BEFORE INSERT ON `Appointment` FOR EACH ROW BEGIN
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

-- If booking with their PCP, set status to Scheduled
IF patient_pcp_id IS NOT NULL AND NEW.Doctor_id = patient_pcp_id THEN
SET NEW.Status = 'Scheduled';
ELSE
SET NEW.Status = 'Scheduled';  -- Default for patients without PCP
END IF;
END */
; ;
DELIMITER;

/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */
;
DELIMITER; ;
/*!50003 CREATE*/
/*!50017 DEFINER=`root`@`%`*/
/*!50003 TRIGGER `trg_appointment_validate_date` BEFORE INSERT ON `Appointment` FOR EACH ROW BEGIN
DECLARE conflicting_appointments INT;

-- Check if appointment is in the past
IF NEW.Appointment_date < NOW() THEN
SIGNAL SQLSTATE '45000'
SET MESSAGE_TEXT = 'Cannot create appointment in the past';
END IF;

-- Check if appointment is too far in the future (e.g., max 1 year out)
IF NEW.Appointment_date > DATE_ADD(NOW(), INTERVAL 1 YEAR) THEN
SIGNAL SQLSTATE '45000'
SET MESSAGE_TEXT = 'Cannot schedule appointment more than 1 year in advance';
END IF;

-- Check if appointment is during business hours (8 AM - 6 PM)
IF HOUR(NEW.Appointment_date) < 8 OR HOUR(NEW.Appointment_date) >= 18 THEN
SIGNAL SQLSTATE '45000'
SET MESSAGE_TEXT = 'Appointments must be scheduled between 8 AM and 6 PM';
END IF;

-- Check if appointment is on a weekend
IF DAYOFWEEK(NEW.Appointment_date) IN (1, 7) THEN -- 1=Sunday, 7=Saturday
SIGNAL SQLSTATE '45000'
SET MESSAGE_TEXT = 'Appointments cannot be scheduled on weekends';
END IF;

-- Check for double-booking: same doctor, same time
SELECT COUNT(*) INTO conflicting_appointments
FROM Appointment
WHERE Doctor_id = NEW.Doctor_id
AND Appointment_date = NEW.Appointment_date
AND Status != 'Cancelled';

IF conflicting_appointments > 0 THEN
SIGNAL SQLSTATE '45000'
SET MESSAGE_TEXT = 'This time slot is already booked. Please select a different time.';
END IF;
END */
; ;
DELIMITER;
/*!50003 SET sql_mode              = @saved_sql_mode */
;
/*!50003 SET character_set_client  = @saved_cs_client */
;
/*!50003 SET character_set_results = @saved_cs_results */
;
/*!50003 SET collation_connection  = @saved_col_connection */
;

--
-- Table structure for table `CodesAllergies`
--

DROP TABLE IF EXISTS `CodesAllergies`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!50503 SET character_set_client = utf8mb4 */
;
CREATE TABLE `CodesAllergies` (
    `AllergiesCode` smallint NOT NULL AUTO_INCREMENT,
    `Allergies_Text` varchar(50) NOT NULL,
    PRIMARY KEY (`AllergiesCode`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;

--
-- Dumping data for table `CodesAllergies`
--

LOCK TABLES `CodesAllergies` WRITE;
/*!40000 ALTER TABLE `CodesAllergies` DISABLE KEYS */
;
INSERT INTO
    `CodesAllergies`
VALUES (1, 'Penicillin'),
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
/*!40000 ALTER TABLE `CodesAllergies` ENABLE KEYS */
;
UNLOCK TABLES;

--
-- Table structure for table `CodesAssignedAtBirth_Gender`
--

DROP TABLE IF EXISTS `CodesAssignedAtBirth_Gender`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!50503 SET character_set_client = utf8mb4 */
;
CREATE TABLE `CodesAssignedAtBirth_Gender` (
    `GenderCode` smallint NOT NULL AUTO_INCREMENT,
    `Gender_Text` varchar(30) NOT NULL,
    PRIMARY KEY (`GenderCode`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;

--
-- Dumping data for table `CodesAssignedAtBirth_Gender`
--

LOCK TABLES `CodesAssignedAtBirth_Gender` WRITE;
/*!40000 ALTER TABLE `CodesAssignedAtBirth_Gender` DISABLE KEYS */
;
INSERT INTO
    `CodesAssignedAtBirth_Gender`
VALUES (1, 'Male'),
    (2, 'Female'),
    (3, 'Intersex'),
    (4, 'Not Specified'),
    (5, 'Other');
/*!40000 ALTER TABLE `CodesAssignedAtBirth_Gender` ENABLE KEYS */
;
UNLOCK TABLES;

--
-- Table structure for table `CodesEthnicity`
--

DROP TABLE IF EXISTS `CodesEthnicity`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!50503 SET character_set_client = utf8mb4 */
;
CREATE TABLE `CodesEthnicity` (
    `EthnicityCode` smallint NOT NULL AUTO_INCREMENT,
    `Ethnicity_Text` varchar(30) NOT NULL,
    PRIMARY KEY (`EthnicityCode`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;

--
-- Dumping data for table `CodesEthnicity`
--

LOCK TABLES `CodesEthnicity` WRITE;
/*!40000 ALTER TABLE `CodesEthnicity` DISABLE KEYS */
;
INSERT INTO
    `CodesEthnicity`
VALUES (1, 'Hispanic or Latino'),
    (2, 'Non-Hispanic or Latino'),
    (3, 'Not Specified'),
    (4, 'Other');
/*!40000 ALTER TABLE `CodesEthnicity` ENABLE KEYS */
;
UNLOCK TABLES;

--
-- Table structure for table `CodesGender`
--

DROP TABLE IF EXISTS `CodesGender`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!50503 SET character_set_client = utf8mb4 */
;
CREATE TABLE `CodesGender` (
    `GenderCode` smallint NOT NULL AUTO_INCREMENT,
    `Gender_Text` varchar(30) NOT NULL,
    PRIMARY KEY (`GenderCode`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;

--
-- Dumping data for table `CodesGender`
--

LOCK TABLES `CodesGender` WRITE;
/*!40000 ALTER TABLE `CodesGender` DISABLE KEYS */
;
INSERT INTO
    `CodesGender`
VALUES (1, 'Male'),
    (2, 'Female'),
    (3, 'Non-Binary'),
    (4, 'Prefer to Self-Describe'),
    (5, 'Not Specified'),
    (6, 'Other');
/*!40000 ALTER TABLE `CodesGender` ENABLE KEYS */
;
UNLOCK TABLES;

--
-- Table structure for table `CodesRace`
--

DROP TABLE IF EXISTS `CodesRace`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!50503 SET character_set_client = utf8mb4 */
;
CREATE TABLE `CodesRace` (
    `RaceCode` smallint NOT NULL AUTO_INCREMENT,
    `Race_Text` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
    PRIMARY KEY (`RaceCode`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;

--
-- Dumping data for table `CodesRace`
--

LOCK TABLES `CodesRace` WRITE;
/*!40000 ALTER TABLE `CodesRace` DISABLE KEYS */
;
INSERT INTO
    `CodesRace`
VALUES (1, 'White'),
    (
        2,
        'Black or African American'
    ),
    (
        3,
        'American Indian/Alaska Native'
    ),
    (4, 'Asian'),
    (
        5,
        'Native Hawaiian/Pacific Islander'
    ),
    (6, 'Two or More Races'),
    (7, 'Not Specified'),
    (8, 'Other');
/*!40000 ALTER TABLE `CodesRace` ENABLE KEYS */
;
UNLOCK TABLES;

--
-- Table structure for table `Doctor`
--

DROP TABLE IF EXISTS `Doctor`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!50503 SET character_set_client = utf8mb4 */
;
CREATE TABLE `Doctor` (
    `Doctor_id` int NOT NULL AUTO_INCREMENT,
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
) ENGINE = InnoDB AUTO_INCREMENT = 8 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;

--
-- Dumping data for table `Doctor`
--

LOCK TABLES `Doctor` WRITE;
/*!40000 ALTER TABLE `Doctor` DISABLE KEYS */
;
INSERT INTO
    `Doctor`
VALUES (
        1,
        'Emily',
        'Chen',
        '123-45-6781',
        2,
        3,
        NULL,
        1,
        'echen@medconnect.com',
        '737-492-000',
        'TXMD123456'
    ),
    (
        2,
        'James',
        'Rodriguez',
        '123-45-6782',
        1,
        14,
        NULL,
        1,
        'jrodriguez@medconnect.com',
        '737-492-8102',
        'TXMD123457'
    ),
    (
        3,
        'Susan',
        'Lee',
        '123-45-6783',
        2,
        4,
        NULL,
        2,
        'slee@medconnect.com',
        '737-879-710',
        'TXMD123458'
    ),
    (
        4,
        'Richard',
        'Patel',
        '123-45-6784',
        1,
        15,
        NULL,
        3,
        'rpatel@medconnect.com',
        '737-879-7102',
        'TXMD123459'
    ),
    (
        5,
        'Maria',
        'Garcia',
        '123-45-6785',
        2,
        5,
        NULL,
        4,
        'mgarcia@medconnect.com',
        '737-492-8103',
        'TXMD123460'
    ),
    (
        6,
        'David',
        'Kim',
        '123-45-6786',
        1,
        3,
        NULL,
        2,
        'dkim@medconnect.com',
        '737-879-7103',
        'TXMD123461'
    ),
    (
        7,
        'Lisa',
        'Wong',
        '123-45-6787',
        2,
        13,
        NULL,
        4,
        'lwong@medconnect.com',
        '737-492-8104',
        'TXMD123462'
    );
/*!40000 ALTER TABLE `Doctor` ENABLE KEYS */
;
UNLOCK TABLES;

--
-- Table structure for table `MedicalCondition`
--

DROP TABLE IF EXISTS `MedicalCondition`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!50503 SET character_set_client = utf8mb4 */
;
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
) ENGINE = InnoDB AUTO_INCREMENT = 12 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;

--
-- Dumping data for table `MedicalCondition`
--

LOCK TABLES `MedicalCondition` WRITE;
/*!40000 ALTER TABLE `MedicalCondition` DISABLE KEYS */
;
INSERT INTO
    `MedicalCondition`
VALUES (
        1,
        1,
        'Hypertension',
        '2024-03-10',
        '2025-10-23 04:41:08',
        'Dr. Emily Chen',
        '2025-10-23 04:41:08',
        'Dr. Emily Chen'
    ),
    (
        2,
        1,
        'Type 2 Diabetes',
        '2022-07-15',
        '2025-10-23 04:41:08',
        'Dr. Emily Chen',
        '2025-10-23 04:41:08',
        'Dr. Emily Chen'
    ),
    (
        3,
        2,
        'Asthma',
        '2021-05-20',
        '2025-10-23 04:41:08',
        'Dr. Susan Lee',
        '2025-10-23 04:41:08',
        'Dr. Susan Lee'
    ),
    (
        4,
        2,
        'Migraine',
        '2020-11-03',
        '2025-10-23 04:41:08',
        'Dr. Susan Lee',
        '2025-10-23 04:41:08',
        'Dr. Susan Lee'
    ),
    (
        5,
        3,
        'Hyperlipidemia',
        '2021-01-12',
        '2025-10-23 04:41:08',
        'Dr. Emily Chen',
        '2025-10-23 04:41:08',
        'Dr. Emily Chen'
    ),
    (
        6,
        4,
        'Hypothyroidism',
        '2023-09-08',
        '2025-10-23 04:41:08',
        'Dr. Richard Patel',
        '2025-10-23 04:41:08',
        'Dr. Richard Patel'
    ),
    (
        7,
        5,
        'Osteoarthritis',
        '2024-12-15',
        '2025-10-23 04:41:08',
        'Dr. James Rodriguez',
        '2025-10-23 04:41:08',
        'Dr. James Rodriguez'
    ),
    (
        8,
        5,
        'GERD',
        '2022-04-22',
        '2025-10-23 04:41:08',
        'Dr. James Rodriguez',
        '2025-10-23 04:41:08',
        'Dr. James Rodriguez'
    ),
    (
        9,
        6,
        'Anxiety Disorder',
        '2024-08-30',
        '2025-10-23 04:41:08',
        'Dr. Maria Garcia',
        '2025-10-23 04:41:08',
        'Dr. Maria Garcia'
    ),
    (
        10,
        7,
        'COPD',
        '2022-06-18',
        '2025-10-23 04:41:08',
        'Dr. James Rodriguez',
        '2025-10-23 04:41:08',
        'Dr. James Rodriguez'
    ),
    (
        11,
        8,
        'PCOS',
        '2021-03-25',
        '2025-10-23 04:41:08',
        'Dr. Susan Lee',
        '2025-10-23 04:41:08',
        'Dr. Susan Lee'
    );
/*!40000 ALTER TABLE `MedicalCondition` ENABLE KEYS */
;
UNLOCK TABLES;

--
-- Table structure for table `MedicalHistory`
--

DROP TABLE IF EXISTS `MedicalHistory`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!50503 SET character_set_client = utf8mb4 */
;
CREATE TABLE `MedicalHistory` (
    `History_ID` int NOT NULL AUTO_INCREMENT,
    `Patient_ID` int NOT NULL,
    `Condition_Name` varchar(100) NOT NULL,
    `Diagnosis_Date` date NOT NULL,
    PRIMARY KEY (`History_ID`),
    KEY `ix_medhist_patient` (`Patient_ID`),
    CONSTRAINT `fk_mh__patient` FOREIGN KEY (`Patient_ID`) REFERENCES `Patient` (`Patient_ID`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 15 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;

--
-- Dumping data for table `MedicalHistory`
--

LOCK TABLES `MedicalHistory` WRITE;
/*!40000 ALTER TABLE `MedicalHistory` DISABLE KEYS */
;
INSERT INTO
    `MedicalHistory`
VALUES (
        1,
        1,
        'Hypertension',
        '2021-03-10'
    ),
    (
        2,
        1,
        'Type 2 Diabetes',
        '2019-07-15'
    ),
    (3, 2, 'Asthma', '2022-05-20'),
    (
        4,
        2,
        'Migraine',
        '2021-11-03'
    ),
    (
        5,
        3,
        'Hyperlipidemia',
        '2020-01-12'
    ),
    (
        6,
        4,
        'Hypothyroidism',
        '2019-09-08'
    ),
    (
        7,
        5,
        'Osteoarthritis',
        '2016-12-15'
    ),
    (8, 5, 'GERD', '2019-04-22'),
    (
        9,
        6,
        'Anxiety Disorder',
        '2020-08-30'
    ),
    (10, 7, 'COPD', '2014-06-18'),
    (11, 8, 'PCOS', '2018-03-25'),
    (
        12,
        1,
        'Appendectomy',
        '2010-08-12'
    ),
    (
        13,
        3,
        'Tonsillectomy',
        '2025-03-22'
    ),
    (
        14,
        7,
        'Knee Replacement',
        '2024-11-05'
    );
/*!40000 ALTER TABLE `MedicalHistory` ENABLE KEYS */
;
UNLOCK TABLES;

--
-- Table structure for table `MedicationHistory`
--

DROP TABLE IF EXISTS `MedicationHistory`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!50503 SET character_set_client = utf8mb4 */
;
CREATE TABLE `MedicationHistory` (
    `Drug_ID` int NOT NULL AUTO_INCREMENT,
    `Patient_ID` int NOT NULL,
    `Drug_name` varchar(100) NOT NULL,
    `DurationAndFrequencyOfDrugUse` varchar(150) DEFAULT NULL,
    PRIMARY KEY (`Drug_ID`),
    KEY `ix_medhist_patient` (`Patient_ID`),
    CONSTRAINT `fk_medhist_patient` FOREIGN KEY (`Patient_ID`) REFERENCES `Patient` (`Patient_ID`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 14 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;

--
-- Dumping data for table `MedicationHistory`
--

LOCK TABLES `MedicationHistory` WRITE;
/*!40000 ALTER TABLE `MedicationHistory` DISABLE KEYS */
;
INSERT INTO
    `MedicationHistory`
VALUES (
        1,
        1,
        'Lisinopril 10mg',
        'Once daily since August 2020'
    ),
    (
        2,
        1,
        'Metformin 500mg',
        'Twice daily since December 20223'
    ),
    (
        3,
        2,
        'Albuterol Inhaler',
        'As needed since November 2024'
    ),
    (
        4,
        2,
        'Sumatriptan 50mg',
        'As needed for migraines since March 2018'
    ),
    (
        5,
        3,
        'Atorvastatin 20mg',
        'Once daily since June 2021'
    ),
    (
        6,
        4,
        'Levothyroxine 75mcg',
        'Once daily since May 2017'
    ),
    (
        7,
        5,
        'Ibuprofen 600mg',
        'Three times daily as needed since June 2012'
    ),
    (
        8,
        5,
        'Omeprazole 20mg',
        'Once daily since May 2021'
    ),
    (
        9,
        6,
        'Sertraline 50mg',
        'Once daily since August 2020'
    ),
    (
        10,
        7,
        'Spiriva HandiHaler',
        'Once daily since September 2024'
    ),
    (
        11,
        7,
        'Albuterol Nebulizer',
        'Four times daily since Feburary 2021'
    ),
    (
        12,
        8,
        'Metformin 1000mg',
        'Twice daily since January 2022'
    ),
    (
        13,
        8,
        'Drospirenone/Ethinyl Estradiol',
        'Once daily since March 2025'
    );
/*!40000 ALTER TABLE `MedicationHistory` ENABLE KEYS */
;
UNLOCK TABLES;

--
-- Table structure for table `Nurse`
--

DROP TABLE IF EXISTS `Nurse`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!50503 SET character_set_client = utf8mb4 */
;
CREATE TABLE `Nurse` (
    `Nurse_id` int NOT NULL AUTO_INCREMENT,
    `Staff_id` int DEFAULT NULL,
    `Department` varchar(30) DEFAULT NULL,
    PRIMARY KEY (`Nurse_id`),
    KEY `ix_nurse_staff` (`Staff_id`),
    CONSTRAINT `fk_nurse__staff` FOREIGN KEY (`Staff_id`) REFERENCES `Staff` (`Staff_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;

--
-- Dumping data for table `Nurse`
--

LOCK TABLES `Nurse` WRITE;
/*!40000 ALTER TABLE `Nurse` DISABLE KEYS */
;
INSERT INTO
    `Nurse`
VALUES (1, 101, 'Emergency'),
    (2, 102, 'ICU'),
    (3, 103, 'Pediatrics'),
    (4, 104, 'Orthopedics'),
    (5, 105, 'Cardiology');
/*!40000 ALTER TABLE `Nurse` ENABLE KEYS */
;
UNLOCK TABLES;

--
-- Table structure for table `Office`
--

DROP TABLE IF EXISTS `Office`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!50503 SET character_set_client = utf8mb4 */
;
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
) ENGINE = InnoDB AUTO_INCREMENT = 5 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;

--
-- Dumping data for table `Office`
--

LOCK TABLES `Office` WRITE;
/*!40000 ALTER TABLE `Office` DISABLE KEYS */
;
INSERT INTO
    `Office`
VALUES (
        1,
        'Downtown Medical Center',
        'Houston',
        'TX',
        '425 Main Street, Suite 100',
        '77002',
        6,
        '7374928165'
    ),
    (
        2,
        'Westside Family Clinic',
        'Houston',
        'TX',
        '8920 Katy Freeway, Building B',
        '77024',
        5,
        '7378797156'
    ),
    (
        3,
        'Memorial Park Healthcare',
        'Houston',
        'TX',
        '1550 Memorial Drive',
        '77007',
        4,
        '713-555-0103'
    ),
    (
        4,
        'Galleria Medical Plaza',
        'Houston',
        'TX',
        '5085 Westheimer Road, Floor 3',
        '77056',
        5,
        '713-555-0104'
    );
/*!40000 ALTER TABLE `Office` ENABLE KEYS */
;
UNLOCK TABLES;

--
-- Table structure for table `Patient`
--

DROP TABLE IF EXISTS `Patient`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!50503 SET character_set_client = utf8mb4 */
;
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
    `BloodType` enum(
        'A+',
        'A-',
        'B+',
        'B-',
        'AB+',
        'AB-',
        'O+',
        'O-'
    ) DEFAULT NULL,
    `PayerType` varchar(15) NOT NULL,
    PRIMARY KEY (`Patient_ID`),
    UNIQUE KEY `uq_patient_ssn` (`SSN`),
    KEY `ix_patient_name` (`Last_Name`, `First_Name`),
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
    CONSTRAINT `chk_consent_disclose` CHECK (
        (
            `Consent_Disclose` in (_utf8mb4 'Y', _utf8mb4 'N')
        )
    )
) ENGINE = InnoDB AUTO_INCREMENT = 109 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;

--
-- Dumping data for table `Patient`
--

LOCK TABLES `Patient` WRITE;
/*!40000 ALTER TABLE `Patient` DISABLE KEYS */
;
INSERT INTO
    `Patient`
VALUES (
        1,
        'John',
        'Smith',
        '2020-03-12',
        '123-45-6789',
        '555-1001',
        1,
        1,
        2,
        1,
        'john.smith@email.com',
        'Y',
        1,
        NULL,
        1,
        101,
        NULL,
        1,
        'O+',
        'Private'
    ),
    (
        2,
        'Maria',
        'Garcia',
        '1978-07-22',
        '123-45-6790',
        '555-1002',
        2,
        2,
        1,
        2,
        'maria.garcia@email.com',
        'Y',
        3,
        NULL,
        2,
        102,
        NULL,
        NULL,
        'A+',
        'Private'
    ),
    (
        3,
        'David',
        'Johnson',
        '1992-11-30',
        '123-45-6791',
        '555-1003',
        1,
        1,
        2,
        1,
        'david.johnson@email.com',
        'Y',
        1,
        NULL,
        3,
        105,
        NULL,
        NULL,
        'B+',
        'Medicare'
    ),
    (
        4,
        'Sarah',
        'Williams',
        '1980-05-14',
        '123-45-6792',
        '555-1004',
        2,
        2,
        2,
        1,
        'sarah.williams@email.com',
        'Y',
        4,
        NULL,
        4,
        103,
        NULL,
        NULL,
        'AB-',
        'Private'
    ),
    (
        5,
        'Michael',
        'Brown',
        '1975-09-08',
        '123-45-6793',
        '555-1005',
        1,
        1,
        2,
        2,
        'michael.brown@email.com',
        'Y',
        2,
        NULL,
        5,
        104,
        NULL,
        NULL,
        'O-',
        'Private'
    ),
    (
        6,
        'Jennifer',
        'Davis',
        '1988-12-25',
        '123-45-6794',
        '555-1006',
        2,
        2,
        2,
        1,
        'jennifer.davis@email.com',
        'Y',
        5,
        NULL,
        6,
        101,
        NULL,
        NULL,
        'A-',
        'Private'
    ),
    (
        7,
        'Robert',
        'Miller',
        '1965-02-18',
        '123-45-6795',
        '555-1007',
        1,
        1,
        2,
        1,
        'robert.miller@email.com',
        'Y',
        1,
        NULL,
        7,
        105,
        NULL,
        NULL,
        'B-',
        'Medicare'
    ),
    (
        8,
        'Lisa',
        'Wilson',
        '1990-08-11',
        '123-45-6796',
        '555-1008',
        2,
        2,
        1,
        3,
        'lisa.wilson@email.com',
        'Y',
        3,
        NULL,
        8,
        102,
        NULL,
        NULL,
        'AB+',
        'Private'
    );
/*!40000 ALTER TABLE `Patient` ENABLE KEYS */
;
UNLOCK TABLES;

--
-- Table structure for table `PatientVisit`
--

DROP TABLE IF EXISTS `PatientVisit`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!50503 SET character_set_client = utf8mb4 */
;
CREATE TABLE `PatientVisit` (
    `Visit_id` int NOT NULL AUTO_INCREMENT,
    `Appointment_id` int DEFAULT NULL,
    `Patient_id` int NOT NULL,
    `Office_id` int DEFAULT NULL,
    `Date` datetime DEFAULT NULL,
    `Blood_pressure` varchar(7) DEFAULT NULL,
    `Doctor_id` int DEFAULT NULL,
    `Nurse_id` int DEFAULT NULL,
    `Status` enum(
        'Scheduled',
        'Completed',
        'Canceled',
        'No-Show'
    ) DEFAULT NULL,
    `Diagnosis` json DEFAULT NULL,
    `Treatment` text,
    `Reason_for_Visit` varchar(300) DEFAULT NULL,
    `Department` varchar(50) DEFAULT NULL,
    `AmountDue` decimal(15, 2) DEFAULT NULL,
    `Payment` decimal(15, 2) DEFAULT NULL,
    `TotalDue` decimal(15, 2) DEFAULT NULL,
    `CopayAmount_Due` decimal(15, 2) DEFAULT NULL,
    `TreatmentCost_Due` decimal(15, 2) DEFAULT NULL,
    `Consent_to_treatment` tinyint(1) DEFAULT NULL,
    `Present_illnesses` json DEFAULT NULL,
    `Temperature` decimal(4, 1) DEFAULT NULL,
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
    KEY `idx_pv_start_end` (`Start_at`, `End_at`),
    KEY `fk_pv__insurance_used` (`Insurance_policy_id_used`),
    CONSTRAINT `fk_pv__appt` FOREIGN KEY (`Appointment_id`) REFERENCES `Appointment` (`Appointment_id`) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT `fk_pv__doctor` FOREIGN KEY (`Doctor_id`) REFERENCES `Doctor` (`Doctor_id`) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT `fk_pv__insurance_used` FOREIGN KEY (`Insurance_policy_id_used`) REFERENCES `patient_insurance` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT `fk_pv__nurse` FOREIGN KEY (`Nurse_id`) REFERENCES `Nurse` (`Nurse_id`) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT `fk_pv__office` FOREIGN KEY (`Office_id`) REFERENCES `Office` (`Office_ID`) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT `fk_pv__patient` FOREIGN KEY (`Patient_id`) REFERENCES `Patient` (`Patient_ID`) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `PatientVisit_chk_1` CHECK (
        (
            (`End_at` is null)
            or (`Start_at` is null)
            or (`Start_at` <= `End_at`)
        )
    ),
    CONSTRAINT `PatientVisit_chk_2` CHECK (
        (
            (`AmountDue` is null)
            or (`AmountDue` >= 0)
        )
    ),
    CONSTRAINT `PatientVisit_chk_3` CHECK (
        (
            (`Payment` is null)
            or (`Payment` >= 0)
        )
    ),
    CONSTRAINT `PatientVisit_chk_4` CHECK (
        (
            (`TotalDue` is null)
            or (
                `TotalDue` >= - (999999999999.99)
            )
        )
    ),
    CONSTRAINT `PatientVisit_chk_5` CHECK (
        (
            (`CopayAmount_Due` is null)
            or (`CopayAmount_Due` >= 0)
        )
    ),
    CONSTRAINT `PatientVisit_chk_6` CHECK (
        (
            (`TreatmentCost_Due` is null)
            or (`TreatmentCost_Due` >= 0)
        )
    )
) ENGINE = InnoDB AUTO_INCREMENT = 17 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;

--
-- Dumping data for table `PatientVisit`
--

LOCK TABLES `PatientVisit` WRITE;
/*!40000 ALTER TABLE `PatientVisit` DISABLE KEYS */
;
INSERT INTO
    `PatientVisit`
VALUES (
        1,
        1001,
        1,
        1,
        '2025-01-15 09:00:00',
        '120/80',
        1,
        1,
        'Completed',
        '[\"Hypertension\", \"Type 2 Diabetes\"]',
        'Continue current medications, lifestyle modifications',
        'Annual physical examination',
        'Internal Medicine',
        150.00,
        25.00,
        125.00,
        25.00,
        125.00,
        1,
        '[\"Stable condition\"]',
        98.6,
        '2024-01-15 09:00:00',
        '2024-01-15 09:45:00',
        1,
        '2025-10-23 04:41:08',
        'Dr. Emily Chen',
        '2025-10-23 04:41:08',
        'Dr. Emily Chen'
    ),
    (
        2,
        1002,
        3,
        3,
        '2025-01-16 14:00:00',
        '118/76',
        1,
        2,
        'Completed',
        '[\"Hyperlipidemia\"]',
        'Start statin therapy, dietary changes',
        'Follow-up consultation',
        'Internal Medicine',
        120.00,
        15.00,
        105.00,
        15.00,
        105.00,
        1,
        '[\"Elevated cholesterol levels\"]',
        98.4,
        '2024-01-16 14:00:00',
        '2024-01-16 14:30:00',
        3,
        '2025-10-23 04:41:08',
        'Dr. Emily Chen',
        '2025-10-23 04:41:08',
        'Dr. Emily Chen'
    ),
    (
        3,
        1003,
        5,
        1,
        '2025-01-15 10:30:00',
        '130/85',
        2,
        5,
        'Completed',
        '[\"Osteoarthritis\"]',
        'Pain management, physical therapy referral',
        'Cardiology checkup',
        'Cardiology',
        200.00,
        25.00,
        175.00,
        25.00,
        175.00,
        1,
        '[\"Joint pain in knees\"]',
        98.2,
        '2024-01-15 10:30:00',
        '2024-01-15 11:15:00',
        5,
        '2025-10-23 04:41:08',
        'Dr. James Rodriguez',
        '2025-10-23 04:41:08',
        'Dr. James Rodriguez'
    ),
    (
        4,
        NULL,
        1,
        1,
        '2023-07-25 09:00:00',
        '128/82',
        1,
        1,
        'Completed',
        '[\"Type 2 Diabetes - Well Controlled\", \"Hypertension - Well Controlled\"]',
        'Annual physical examination. HbA1c 6.5% - at goal. Blood pressure 128/82 - well controlled. Complete metabolic panel normal. Cholesterol improved (LDL 110 mg/dL). Patient has lost 15 lbs through diet and exercise. Excellent compliance with medications. Continue current regimen.',
        'Annual physical examination',
        'Internal Medicine',
        175.00,
        25.00,
        150.00,
        25.00,
        150.00,
        1,
        '[\"Chronic conditions well managed\", \"Weight loss achieved\", \"Labs normal\"]',
        98.6,
        '2023-07-25 09:00:00',
        '2023-07-25 10:00:00',
        1,
        '2023-07-25 10:00:00',
        'Dr. Emily Chen',
        '2023-07-25 10:00:00',
        'Dr. Emily Chen'
    ),
    (
        5,
        NULL,
        1,
        1,
        '2023-10-20 10:30:00',
        '125/80',
        1,
        1,
        'Completed',
        '[\"Type 2 Diabetes\", \"Hypertension\"]',
        'Routine follow-up. Patient doing well. HbA1c 6.6%, BP 125/80 - both at goal. No new concerns. Renewed prescriptions for Metformin and Lisinopril. Encouraged to maintain current lifestyle modifications.',
        'Quarterly check-up',
        'Internal Medicine',
        125.00,
        25.00,
        100.00,
        25.00,
        100.00,
        1,
        '[\"Stable condition\", \"Medication adherence good\"]',
        98.5,
        '2023-10-20 10:30:00',
        '2023-10-20 11:00:00',
        1,
        '2023-10-20 11:00:00',
        'Dr. Emily Chen',
        '2023-10-20 11:00:00',
        'Dr. Emily Chen'
    ),
    (
        6,
        NULL,
        1,
        1,
        '2024-02-14 15:30:00',
        '130/84',
        1,
        1,
        'Completed',
        '[\"Hypoglycemia - Medication Related\"]',
        'Patient experienced hypoglycemic episode (blood glucose 58 mg/dL). Reports skipping lunch, took full Metformin dose. Educated on importance of regular meals with medication. Provided glucose tablets. Reviewed warning signs of hypoglycemia. Consider slight medication adjustment if episodes recur.',
        'Low blood sugar episode',
        'Internal Medicine',
        150.00,
        25.00,
        125.00,
        25.00,
        125.00,
        1,
        '[\"Hypoglycemia\", \"Medication timing issue\"]',
        98.7,
        '2024-02-14 15:30:00',
        '2024-02-14 16:15:00',
        1,
        '2024-02-14 16:15:00',
        'Dr. Emily Chen',
        '2024-02-14 16:15:00',
        'Dr. Emily Chen'
    ),
    (
        7,
        NULL,
        1,
        1,
        '2024-03-10 13:00:00',
        '148/94',
        1,
        1,
        'Completed',
        '[\"Hypertension - Worsening\"]',
        'Blood pressure elevated on multiple readings (148/94, 145/92). Patient reports increased work stress. HbA1c remains stable at 6.7%. Increased Lisinopril to 20mg daily. Discussed stress management techniques. Follow-up in 4 weeks to reassess BP.',
        'Blood pressure check',
        'Internal Medicine',
        125.00,
        25.00,
        100.00,
        25.00,
        100.00,
        1,
        '[\"Elevated blood pressure\", \"Work-related stress\", \"Diabetes stable\"]',
        98.6,
        '2024-03-10 13:00:00',
        '2024-03-10 13:45:00',
        1,
        '2024-03-10 13:45:00',
        'Dr. Emily Chen',
        '2024-03-10 13:45:00',
        'Dr. Emily Chen'
    ),
    (
        8,
        NULL,
        1,
        1,
        '2024-04-12 11:00:00',
        '132/86',
        1,
        1,
        'Completed',
        '[\"Hypertension\", \"Type 2 Diabetes\"]',
        'Follow-up for blood pressure. Improved to 132/86 with increased Lisinopril dose. Patient reports implementing stress reduction techniques. Continue current medications. Next routine visit in 3 months.',
        'Blood pressure follow-up',
        'Internal Medicine',
        100.00,
        25.00,
        75.00,
        25.00,
        75.00,
        1,
        '[\"Blood pressure improved\", \"Medication effective\"]',
        98.4,
        '2024-04-12 11:00:00',
        '2024-04-12 11:30:00',
        1,
        '2024-04-12 11:30:00',
        'Dr. Emily Chen',
        '2024-04-12 11:30:00',
        'Dr. Emily Chen'
    ),
    (
        9,
        NULL,
        1,
        1,
        '2024-07-22 09:00:00',
        '128/82',
        1,
        1,
        'Completed',
        '[\"Type 2 Diabetes\", \"Hypertension\"]',
        'Annual physical. Overall excellent health status. HbA1c 6.4%, BP 128/82 - both at goal. Complete blood count normal. Kidney function normal (important for diabetics). Cholesterol panel excellent (LDL 95 mg/dL). Patient has maintained 20 lb weight loss. Continue all medications.',
        'Annual physical examination',
        'Internal Medicine',
        175.00,
        25.00,
        150.00,
        25.00,
        150.00,
        1,
        '[\"Excellent disease management\", \"All labs normal\", \"Lifestyle modifications maintained\"]',
        98.6,
        '2024-07-22 09:00:00',
        '2024-07-22 10:15:00',
        1,
        '2024-07-22 10:15:00',
        'Dr. Emily Chen',
        '2024-07-22 10:15:00',
        'Dr. Emily Chen'
    ),
    (
        10,
        NULL,
        1,
        1,
        '2024-10-18 14:00:00',
        '126/80',
        1,
        1,
        'Completed',
        '[\"Type 2 Diabetes\", \"Hypertension\"]',
        'Quarterly check-up. Patient continues to do well. HbA1c 6.5%, BP 126/80. No new complaints. Renewed all prescriptions. Discussed flu vaccine - administered today. Next visit in 3 months.',
        'Quarterly diabetes and hypertension check',
        'Internal Medicine',
        125.00,
        25.00,
        100.00,
        25.00,
        100.00,
        1,
        '[\"Stable chronic conditions\", \"Flu vaccine given\"]',
        98.5,
        '2024-10-18 14:00:00',
        '2024-10-18 14:40:00',
        1,
        '2024-10-18 14:40:00',
        'Dr. Emily Chen',
        '2024-10-18 14:40:00',
        'Dr. Emily Chen'
    ),
    (
        15,
        1013,
        5,
        1,
        '2025-10-24 10:30:00',
        '120/80',
        1,
        2,
        'Scheduled',
        '[\"Mild Severity\", \"Flu\"]',
        'Prescribed rest and hydration; recommended follow-up in one week.',
        'Fever and cough',
        'Internal Medicine',
        200.00,
        50.00,
        150.00,
        20.00,
        180.00,
        1,
        '{\"Cough\": true, \"Fever\": true}',
        99.5,
        '2025-10-24 10:30:00',
        '2025-10-24 11:00:00',
        5,
        '2025-10-25 04:21:57',
        'nurse.jane',
        '2025-10-25 04:49:03',
        NULL
    ),
    (
        16,
        1013,
        5,
        1,
        '2025-10-25 01:15:00',
        '130/80',
        1,
        1,
        'Scheduled',
        NULL,
        NULL,
        NULL,
        'Internal Medicine',
        NULL,
        NULL,
        NULL,
        NULL,
        NULL,
        NULL,
        NULL,
        99.0,
        '2025-10-24 01:30:00',
        NULL,
        5,
        '2025-10-24 01:10:00',
        NULL,
        '2025-10-25 18:16:49',
        NULL
    );
/*!40000 ALTER TABLE `PatientVisit` ENABLE KEYS */
;
UNLOCK TABLES;

--
-- Table structure for table `Prescription`
--

DROP TABLE IF EXISTS `Prescription`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!50503 SET character_set_client = utf8mb4 */
;
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
) ENGINE = InnoDB AUTO_INCREMENT = 6 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;

--
-- Dumping data for table `Prescription`
--

LOCK TABLES `Prescription` WRITE;
/*!40000 ALTER TABLE `Prescription` DISABLE KEYS */
;
INSERT INTO
    `Prescription`
VALUES (
        1,
        1,
        1,
        1001,
        'Lisinopril',
        '10mg',
        'Once daily',
        'Oral',
        '2025-01-15',
        NULL,
        11,
        'For hypertension control',
        '2025-10-23 04:41:08'
    ),
    (
        2,
        1,
        1,
        1001,
        'Metformin',
        '500mg',
        'Twice daily',
        'Oral',
        '2024-05-19',
        NULL,
        11,
        'For diabetes management',
        '2025-10-23 04:41:08'
    ),
    (
        3,
        3,
        1,
        1002,
        'Atorvastatin',
        '20mg',
        'Once daily',
        'Oral',
        '2024-01-16',
        NULL,
        6,
        'For cholesterol management',
        '2025-10-23 04:41:08'
    ),
    (
        4,
        5,
        2,
        1003,
        'Ibuprofen',
        '600mg',
        'Three times daily as needed',
        'Oral',
        '2025-06-15',
        '2024-10-15',
        2,
        'For osteoarthritis pain',
        '2025-10-23 04:41:08'
    ),
    (
        5,
        6,
        5,
        1009,
        'Sertraline',
        '50mg',
        'Once daily',
        'Oral',
        '2024-11-17',
        NULL,
        6,
        'For anxiety management',
        '2025-10-23 04:41:08'
    );
/*!40000 ALTER TABLE `Prescription` ENABLE KEYS */
;
UNLOCK TABLES;

--
-- Table structure for table `Referral`
--

DROP TABLE IF EXISTS `Referral`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!50503 SET character_set_client = utf8mb4 */
;
CREATE TABLE `Referral` (
    `Referral_ID` int NOT NULL AUTO_INCREMENT,
    `Patient_ID` int NOT NULL,
    `Date_of_approval` date DEFAULT NULL,
    `referring_doctor_staff_id` int DEFAULT NULL,
    `specialist_doctor_staff_id` int DEFAULT NULL,
    `Reason` varchar(300) DEFAULT NULL,
    `appointment_id` int DEFAULT NULL,
    `Status` enum(
        'Pending',
        'Approved',
        'Denied'
    ) DEFAULT 'Pending',
    PRIMARY KEY (`Referral_ID`),
    KEY `ix_ref_patient` (`Patient_ID`),
    KEY `ix_ref_refdoc` (`referring_doctor_staff_id`),
    KEY `ix_ref_specdoc` (`specialist_doctor_staff_id`),
    KEY `ix_ref_appt` (`appointment_id`),
    CONSTRAINT `fk_ref__appointment` FOREIGN KEY (`appointment_id`) REFERENCES `Appointment` (`Appointment_id`) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT `fk_ref__patient` FOREIGN KEY (`Patient_ID`) REFERENCES `Patient` (`Patient_ID`) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `fk_ref__referring_doctor` FOREIGN KEY (`referring_doctor_staff_id`) REFERENCES `Doctor` (`Doctor_id`) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT `fk_ref__specialist_doctor` FOREIGN KEY (`specialist_doctor_staff_id`) REFERENCES `Doctor` (`Doctor_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 13 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;

--
-- Dumping data for table `Referral`
--

LOCK TABLES `Referral` WRITE;
/*!40000 ALTER TABLE `Referral` DISABLE KEYS */
;
INSERT INTO
    `Referral`
VALUES (
        1,
        5,
        NULL,
        2,
        4,
        'Orthopedic consultation for knee pain',
        1008,
        'Approved'
    ),
    (
        2,
        1,
        '2025-10-25',
        1,
        7,
        'Dermatology screening for skin rash',
        NULL,
        'Pending'
    ),
    (
        3,
        4,
        '2025-10-16',
        4,
        2,
        'Cardiology evaluation for chest pain',
        NULL,
        'Approved'
    ),
    (
        4,
        1,
        NULL,
        1,
        2,
        'Heart check ',
        NULL,
        'Pending'
    ),
    (
        5,
        3,
        NULL,
        1,
        1,
        'test',
        NULL,
        'Pending'
    ),
    (
        6,
        1,
        NULL,
        1,
        5,
        'Sick',
        NULL,
        'Pending'
    ),
    (
        7,
        1,
        NULL,
        1,
        6,
        'Sick',
        NULL,
        'Pending'
    ),
    (
        8,
        1,
        NULL,
        1,
        5,
        'sick',
        NULL,
        'Pending'
    ),
    (
        9,
        1,
        NULL,
        1,
        7,
        'Too much acne',
        NULL,
        'Pending'
    ),
    (
        10,
        1,
        NULL,
        1,
        7,
        'Too much acne',
        NULL,
        'Pending'
    ),
    (
        11,
        1,
        NULL,
        1,
        5,
        'Pap exam',
        NULL,
        'Pending'
    ),
    (
        12,
        1,
        NULL,
        1,
        3,
        'Sick kid',
        NULL,
        'Pending'
    );
/*!40000 ALTER TABLE `Referral` ENABLE KEYS */
;
UNLOCK TABLES;

--
-- Table structure for table `ResponsibleParty`
--

DROP TABLE IF EXISTS `ResponsibleParty`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!50503 SET character_set_client = utf8mb4 */
;
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
    KEY `ix_resp_party_name` (`Last_Name`, `First_Name`)
) ENGINE = InnoDB AUTO_INCREMENT = 4 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;

--
-- Dumping data for table `ResponsibleParty`
--

LOCK TABLES `ResponsibleParty` WRITE;
/*!40000 ALTER TABLE `ResponsibleParty` DISABLE KEYS */
;
INSERT INTO
    `ResponsibleParty`
VALUES (
        1,
        'Robert',
        'Smith',
        'A',
        '1',
        'TX',
        '77002',
        'Houston',
        '555-2001'
    ),
    (
        2,
        'Carlos',
        'Garcia',
        'B',
        '2',
        'TX',
        '77024',
        'Houston',
        '555-2002'
    ),
    (
        3,
        'Susan',
        'Johnson',
        NULL,
        '3',
        'TX',
        '77007',
        'Houston',
        '555-2003'
    );
/*!40000 ALTER TABLE `ResponsibleParty` ENABLE KEYS */
;
UNLOCK TABLES;

--
-- Table structure for table `Specialty`
--

DROP TABLE IF EXISTS `Specialty`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!50503 SET character_set_client = utf8mb4 */
;
CREATE TABLE `Specialty` (
    `specialty_id` int NOT NULL AUTO_INCREMENT,
    `specialty_name` varchar(100) NOT NULL,
    PRIMARY KEY (`specialty_id`) USING BTREE,
    UNIQUE KEY `ux_specialty_name` (`specialty_name`)
) ENGINE = InnoDB AUTO_INCREMENT = 37 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;

--
-- Dumping data for table `Specialty`
--

LOCK TABLES `Specialty` WRITE;
/*!40000 ALTER TABLE `Specialty` DISABLE KEYS */
;
INSERT INTO
    `Specialty`
VALUES (14, 'Cardiology'),
    (13, 'Dermatology'),
    (1, 'Family Medicine'),
    (6, 'General Dentistry'),
    (2, 'General Practice'),
    (3, 'Internal Medicine'),
    (
        12,
        'Mental Health Counseling'
    ),
    (9, 'Nurse Practitioner'),
    (7, 'Nursing'),
    (17, 'Nutrition and Dietetics'),
    (
        5,
        'Obstetrics and Gynecology'
    ),
    (15, 'Orthopedics'),
    (4, 'Pediatrics'),
    (18, 'Pharmacy'),
    (16, 'Physical Therapy'),
    (8, 'Physician Assistant'),
    (11, 'Preventive Medicine'),
    (10, 'Urgent Care');
/*!40000 ALTER TABLE `Specialty` ENABLE KEYS */
;
UNLOCK TABLES;

--
-- Table structure for table `Staff`
--

DROP TABLE IF EXISTS `Staff`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!50503 SET character_set_client = utf8mb4 */
;
CREATE TABLE `Staff` (
    `Staff_id` int NOT NULL AUTO_INCREMENT,
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
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;

--
-- Dumping data for table `Staff`
--

LOCK TABLES `Staff` WRITE;
/*!40000 ALTER TABLE `Staff` DISABLE KEYS */
;
INSERT INTO
    `Staff`
VALUES (
        101,
        'Jennifer',
        'Taylor',
        '987-65-4326',
        2,
        'j.taylor@medconnect.com',
        1,
        'Nurse',
        1,
        'RN123456'
    ),
    (
        102,
        'Michael',
        'Chen',
        '987-65-4327',
        1,
        'm.chen@medconnect.com',
        1,
        'Nurse',
        2,
        'RN123457'
    ),
    (
        103,
        'Sarah',
        'Rodriguez',
        '987-65-4328',
        2,
        's.rodriguez@medconnect.com',
        2,
        'Nurse',
        1,
        'RN123458'
    ),
    (
        104,
        'David',
        'Anderson',
        '987-65-4329',
        1,
        'd.anderson@medconnect.com',
        3,
        'Nurse',
        3,
        'RN123459'
    ),
    (
        105,
        'Lisa',
        'Martinez',
        '987-65-4330',
        2,
        'l.martinez@medconnect.com',
        4,
        'Nurse',
        2,
        'RN123460'
    ),
    (
        201,
        'Amanda',
        'Wilson',
        '987-65-4331',
        2,
        'a.wilson@medconnect.com',
        1,
        'Administrator',
        1,
        NULL
    ),
    (
        202,
        'Christopher',
        'Lee',
        '987-65-4332',
        1,
        'c.lee@medconnect.com',
        2,
        'Receptionist',
        2,
        NULL
    ),
    (
        204,
        'Daniel',
        'Thompson',
        '987-65-4334',
        1,
        'd.thompson@medconnect.com',
        4,
        'Receptionist',
        4,
        'RTT123456'
    );
/*!40000 ALTER TABLE `Staff` ENABLE KEYS */
;
UNLOCK TABLES;

--
-- Table structure for table `VaccinationHistory`
--

DROP TABLE IF EXISTS `VaccinationHistory`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!50503 SET character_set_client = utf8mb4 */
;
CREATE TABLE `VaccinationHistory` (
    `VaccinationID` int NOT NULL AUTO_INCREMENT,
    `patient_id` int NOT NULL,
    `Vaccination_name` varchar(100) NOT NULL,
    `DateOfVaccination` date NOT NULL,
    `DateForBooster` date DEFAULT NULL,
    PRIMARY KEY (`VaccinationID`),
    KEY `ix_vaxhist_patient` (`patient_id`),
    CONSTRAINT `fk_vaxhist_patient` FOREIGN KEY (`patient_id`) REFERENCES `Patient` (`Patient_ID`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 10 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;

--
-- Dumping data for table `VaccinationHistory`
--

LOCK TABLES `VaccinationHistory` WRITE;
/*!40000 ALTER TABLE `VaccinationHistory` DISABLE KEYS */
;
INSERT INTO
    `VaccinationHistory`
VALUES (
        1,
        1,
        'Influenza Vaccine',
        '2023-10-15',
        '2024-10-15'
    ),
    (
        2,
        1,
        'COVID-19 Bivalent',
        '2023-11-20',
        '2024-11-20'
    ),
    (
        3,
        2,
        'Influenza Vaccine',
        '2023-10-20',
        '2024-10-20'
    ),
    (
        4,
        3,
        'Tetanus Booster',
        '2022-05-10',
        '2032-05-10'
    ),
    (
        5,
        4,
        'Influenza Vaccine',
        '2023-10-25',
        '2024-10-25'
    ),
    (
        6,
        5,
        'Shingles Vaccine',
        '2023-09-15',
        NULL
    ),
    (
        7,
        6,
        'HPV Vaccine',
        '2023-08-10',
        '2024-02-10'
    ),
    (
        8,
        7,
        'Pneumococcal Vaccine',
        '2023-07-20',
        NULL
    ),
    (
        9,
        8,
        'Influenza Vaccine',
        '2023-10-30',
        '2024-10-30'
    );
/*!40000 ALTER TABLE `VaccinationHistory` ENABLE KEYS */
;
UNLOCK TABLES;

--
-- Table structure for table `WorkSchedule`
--

DROP TABLE IF EXISTS `WorkSchedule`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!50503 SET character_set_client = utf8mb4 */
;
CREATE TABLE `WorkSchedule` (
    `Schedule_id` int NOT NULL AUTO_INCREMENT,
    `Office_id` int NOT NULL,
    `Staff_id` int DEFAULT NULL,
    `Doctor_id` int DEFAULT NULL,
    `Nurse_id` int DEFAULT NULL,
    `Days` date DEFAULT NULL,
    `Start_time` time DEFAULT NULL,
    `End_time` time DEFAULT NULL,
    `Day_of_week` enum(
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
        'Sunday'
    ) DEFAULT NULL,
    PRIMARY KEY (`Schedule_id`),
    KEY `idx_ws_office` (`Office_id`),
    KEY `idx_ws_doctor` (`Doctor_id`),
    KEY `idx_ws_nurse` (`Nurse_id`),
    KEY `idx_ws_staff` (`Staff_id`),
    KEY `idx_ws_daydate` (`Day_of_week`, `Days`),
    CONSTRAINT `fk_ws__doctor` FOREIGN KEY (`Doctor_id`) REFERENCES `Doctor` (`Doctor_id`) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT `fk_ws__nurse` FOREIGN KEY (`Nurse_id`) REFERENCES `Nurse` (`Nurse_id`) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT `fk_ws__office` FOREIGN KEY (`Office_id`) REFERENCES `Office` (`Office_ID`) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `fk_ws__staff` FOREIGN KEY (`Staff_id`) REFERENCES `Staff` (`Staff_id`) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT `WorkSchedule_chk_1` CHECK (
        (
            (`End_time` is null)
            or (`Start_time` is null)
            or (`Start_time` <= `End_time`)
        )
    )
) ENGINE = InnoDB AUTO_INCREMENT = 16 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;

--
-- Dumping data for table `WorkSchedule`
--

LOCK TABLES `WorkSchedule` WRITE;
/*!40000 ALTER TABLE `WorkSchedule` DISABLE KEYS */
;
INSERT INTO
    `WorkSchedule`
VALUES (
        1,
        1,
        101,
        NULL,
        1,
        '2024-01-15',
        '08:00:00',
        '16:00:00',
        'Monday'
    ),
    (
        2,
        1,
        102,
        NULL,
        2,
        '2024-01-15',
        '12:00:00',
        '20:00:00',
        'Monday'
    ),
    (
        3,
        1,
        NULL,
        1,
        NULL,
        '2024-01-15',
        '09:00:00',
        '17:00:00',
        'Monday'
    ),
    (
        4,
        2,
        NULL,
        3,
        NULL,
        '2024-01-15',
        '08:30:00',
        '16:30:00',
        'Monday'
    ),
    (
        5,
        1,
        NULL,
        2,
        NULL,
        '2024-01-15',
        '10:00:00',
        '18:00:00',
        'Monday'
    ),
    (
        6,
        1,
        NULL,
        1,
        NULL,
        NULL,
        '09:00:00',
        '17:00:00',
        'Monday'
    ),
    (
        7,
        2,
        NULL,
        1,
        NULL,
        NULL,
        '09:00:00',
        '17:00:00',
        'Tuesday'
    ),
    (
        8,
        1,
        NULL,
        1,
        NULL,
        NULL,
        '09:00:00',
        '17:00:00',
        'Wednesday'
    ),
    (
        9,
        2,
        NULL,
        1,
        NULL,
        NULL,
        '09:00:00',
        '17:00:00',
        'Thursday'
    ),
    (
        10,
        1,
        NULL,
        1,
        NULL,
        NULL,
        '09:00:00',
        '17:00:00',
        'Friday'
    ),
    (
        11,
        1,
        NULL,
        2,
        NULL,
        NULL,
        '08:00:00',
        '16:00:00',
        'Monday'
    ),
    (
        12,
        1,
        NULL,
        2,
        NULL,
        NULL,
        '08:00:00',
        '16:00:00',
        'Wednesday'
    ),
    (
        13,
        4,
        NULL,
        2,
        NULL,
        NULL,
        '10:00:00',
        '18:00:00',
        'Tuesday'
    ),
    (
        14,
        4,
        NULL,
        2,
        NULL,
        NULL,
        '10:00:00',
        '18:00:00',
        'Thursday'
    ),
    (
        15,
        4,
        NULL,
        2,
        NULL,
        NULL,
        '09:00:00',
        '13:00:00',
        'Friday'
    );
/*!40000 ALTER TABLE `WorkSchedule` ENABLE KEYS */
;
UNLOCK TABLES;

--
-- Table structure for table `insurance_payer`
--

-- Trigger: Check if referral is needed based on PCP
DROP TRIGGER IF EXISTS `trg_appointment_check_referral` $

CREATE TRIGGER `trg_appointment_check_referral`
BEFORE INSERT ON `appointment`
FOR EACH ROW
BEGIN
    DECLARE patient_pcp_id INT;
    
    -- Get patient's primary care physician
    SELECT primary_doctor INTO patient_pcp_id
    FROM patient
    WHERE patient_id = NEW.patient_id;
    
    -- If seeing a doctor other than PCP, set status to Pending (needs referral)
    IF patient_pcp_id IS NULL OR NEW.doctor_id != patient_pcp_id THEN
        SET NEW.status = 'Pending';
    ELSE 
        SET NEW.status = 'Scheduled';
    END IF;
END$

DELIMITER;

-- Table: referral
DROP TABLE IF EXISTS `referral`;

CREATE TABLE `referral` (
    `referral_id` INT NOT NULL AUTO_INCREMENT,
    `patient_id` INT NOT NULL,
    `date_of_approval` DATE DEFAULT NULL,
    `referring_doctor_staff_id` INT DEFAULT NULL,
    `specialist_doctor_staff_id` INT DEFAULT NULL,
    `reason` VARCHAR(300) DEFAULT NULL,
    `appointment_id` INT DEFAULT NULL,
    `status` ENUM(
        'Pending',
        'Approved',
        'Denied'
    ) DEFAULT 'Pending',
    PRIMARY KEY (`referral_id`),
    KEY `idx_ref_patient` (`patient_id`),
    KEY `idx_ref_refdoc` (`referring_doctor_staff_id`),
    KEY `idx_ref_specdoc` (`specialist_doctor_staff_id`),
    KEY `idx_ref_appt` (`appointment_id`),
    CONSTRAINT `fk_ref__appointment` FOREIGN KEY (`appointment_id`) REFERENCES `appointment` (`appointment_id`) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT `fk_ref__patient` FOREIGN KEY (`patient_id`) REFERENCES `patient` (`patient_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `fk_ref__referring_doctor` FOREIGN KEY (`referring_doctor_staff_id`) REFERENCES `doctor` (`doctor_id`) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT `fk_ref__specialist_doctor` FOREIGN KEY (`specialist_doctor_staff_id`) REFERENCES `doctor` (`doctor_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 6 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

INSERT INTO
    `referral`
VALUES (
        1,
        5,
        NULL,
        2,
        4,
        'Orthopedic consultation for knee pain',
        1008,
        'Approved'
    ),
    (
        2,
        1,
        '2025-10-25',
        1,
        7,
        'Dermatology screening for skin rash',
        NULL,
        'Pending'
    ),
    (
        3,
        4,
        '2025-10-16',
        4,
        2,
        'Cardiology evaluation for chest pain',
        NULL,
        'Approved'
    ),
    (
        4,
        1,
        NULL,
        1,
        2,
        'Heart check ',
        NULL,
        'Pending'
    ),
    (
        5,
        3,
        NULL,
        1,
        1,
        'test',
        NULL,
        'Pending'
    );

-- Table: prescription
DROP TABLE IF EXISTS `prescription`;

CREATE TABLE `prescription` (
    `prescription_id` INT NOT NULL AUTO_INCREMENT,
    `patient_id` INT NOT NULL,
    `doctor_id` INT NOT NULL,
    `appointment_id` INT DEFAULT NULL,
    `medication_name` VARCHAR(100) NOT NULL,
    `dosage` VARCHAR(50) DEFAULT NULL,
    `frequency` VARCHAR(50) DEFAULT NULL,
    `route` VARCHAR(50) DEFAULT NULL,
    `start_date` DATE NOT NULL,
    `end_date` DATE DEFAULT NULL,
    `refills_allowed` TINYINT DEFAULT NULL,
    `notes` VARCHAR(255) DEFAULT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`prescription_id`),
    KEY `idx_rx_patient` (`patient_id`),
    KEY `idx_rx_doctor` (`doctor_id`),
    KEY `idx_rx_appt` (`appointment_id`),
    CONSTRAINT `fk_rx__appointment` FOREIGN KEY (`appointment_id`) REFERENCES `appointment` (`appointment_id`) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT `fk_rx__doctor` FOREIGN KEY (`doctor_id`) REFERENCES `doctor` (`doctor_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `fk_rx__patient` FOREIGN KEY (`patient_id`) REFERENCES `patient` (`patient_id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 6 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

INSERT INTO
    `prescription`
VALUES (
        1,
        1,
        1,
        1001,
        'Lisinopril',
        '10mg',
        'Once daily',
        'Oral',
        '2025-01-15',
        NULL,
        11,
        'For hypertension control',
        '2025-10-23 04:41:08'
    ),
    (
        2,
        1,
        1,
        1001,
        'Metformin',
        '500mg',
        'Twice daily',
        'Oral',
        '2024-05-19',
        NULL,
        11,
        'For diabetes management',
        '2025-10-23 04:41:08'
    ),
    (
        3,
        3,
        1,
        1002,
        'Atorvastatin',
        '20mg',
        'Once daily',
        'Oral',
        '2024-01-16',
        NULL,
        6,
        'For cholesterol management',
        '2025-10-23 04:41:08'
    ),
    (
        4,
        5,
        2,
        1003,
        'Ibuprofen',
        '600mg',
        'Three times daily as needed',
        'Oral',
        '2025-06-15',
        '2024-10-15',
        2,
        'For osteoarthritis pain',
        '2025-10-23 04:41:08'
    ),
    (
        5,
        6,
        5,
        1009,
        'Sertraline',
        '50mg',
        'Once daily',
        'Oral',
        '2024-11-17',
        NULL,
        6,
        'For anxiety management',
        '2025-10-23 04:41:08'
    );

-- Table: patient_visit
DROP TABLE IF EXISTS `patient_visit`;

CREATE TABLE `patient_visit` (
    `visit_id` INT NOT NULL AUTO_INCREMENT,
    `appointment_id` INT DEFAULT NULL,
    `patient_id` INT NOT NULL,
    `office_id` INT DEFAULT NULL,
    `date` DATETIME DEFAULT NULL,
    `blood_pressure` VARCHAR(7) DEFAULT NULL,
    `doctor_id` INT DEFAULT NULL,
    `nurse_id` INT DEFAULT NULL,
    `status` ENUM(
        'Scheduled',
        'Completed',
        'Canceled',
        'No-Show'
    ) DEFAULT NULL,
    `diagnosis` JSON DEFAULT NULL,
    `treatment` TEXT,
    `reason_for_visit` VARCHAR(300) DEFAULT NULL,
    `department` VARCHAR(50) DEFAULT NULL,
    `amount_due` DECIMAL(15, 2) DEFAULT NULL,
    `payment` DECIMAL(15, 2) DEFAULT NULL,
    `total_due` DECIMAL(15, 2) DEFAULT NULL,
    `copay_amount_due` DECIMAL(15, 2) DEFAULT NULL,
    `treatment_cost_due` DECIMAL(15, 2) DEFAULT NULL,
    `consent_to_treatment` TINYINT(1) DEFAULT NULL,
    `present_illnesses` JSON DEFAULT NULL,
    `temperature` DECIMAL(4, 1) DEFAULT NULL,
    `start_at` DATETIME DEFAULT NULL,
    `end_at` DATETIME DEFAULT NULL,
    `insurance_policy_id_used` INT UNSIGNED DEFAULT NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `created_by` VARCHAR(30) DEFAULT NULL,
    `last_updated` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `updated_by` VARCHAR(30) DEFAULT NULL,
    PRIMARY KEY (`visit_id`),
    KEY `idx_pv_patient` (`patient_id`),
    KEY `idx_pv_doctor` (`doctor_id`),
    KEY `idx_pv_nurse` (`nurse_id`),
    KEY `idx_pv_office` (`office_id`),
    KEY `idx_pv_appt` (`appointment_id`),
    KEY `idx_pv_date` (`date`),
    KEY `idx_pv_start_end` (`start_at`, `end_at`),
    KEY `fk_pv__insurance_used` (`insurance_policy_id_used`),
    CONSTRAINT `fk_pv__appt` FOREIGN KEY (`appointment_id`) REFERENCES `appointment` (`appointment_id`) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT `fk_pv__doctor` FOREIGN KEY (`doctor_id`) REFERENCES `doctor` (`doctor_id`) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT `fk_pv__insurance_used` FOREIGN KEY (`insurance_policy_id_used`) REFERENCES `patient_insurance` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT `fk_pv__nurse` FOREIGN KEY (`nurse_id`) REFERENCES `nurse` (`nurse_id`) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT `fk_pv__office` FOREIGN KEY (`office_id`) REFERENCES `office` (`office_id`) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT `fk_pv__patient` FOREIGN KEY (`patient_id`) REFERENCES `patient` (`patient_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `chk_pv_times` CHECK (
        (`end_at` IS NULL)
        OR (`start_at` IS NULL)
        OR (`start_at` <= `end_at`)
    ),
    CONSTRAINT `chk_pv_amount_due` CHECK (
        (`amount_due` IS NULL)
        OR (`amount_due` >= 0)
    ),
    CONSTRAINT `chk_pv_payment` CHECK (
        (`payment` IS NULL)
        OR (`payment` >= 0)
    ),
    CONSTRAINT `chk_pv_total_due` CHECK (
        (`total_due` IS NULL)
        OR (
            `total_due` >= -999999999999.99
        )
    ),
    CONSTRAINT `chk_pv_copay` CHECK (
        (`copay_amount_due` IS NULL)
        OR (`copay_amount_due` >= 0)
    ),
    CONSTRAINT `chk_pv_treatment_cost` CHECK (
        (`treatment_cost_due` IS NULL)
        OR (`treatment_cost_due` >= 0)
    )
) ENGINE = InnoDB AUTO_INCREMENT = 17 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

INSERT INTO
    `patient_visit`
VALUES (
        1,
        1001,
        1,
        1,
        '2025-01-15 09:00:00',
        '120/80',
        1,
        1,
        'Completed',
        '[\"Hypertension\", \"Type 2 Diabetes\"]',
        'Continue current medications, lifestyle modifications',
        'Annual physical examination',
        'Internal Medicine',
        150.00,
        25.00,
        125.00,
        25.00,
        125.00,
        1,
        '[\"Stable condition\"]',
        98.6,
        '2024-01-15 09:00:00',
        '2024-01-15 09:45:00',
        1,
        '2025-10-23 04:41:08',
        'Dr. Emily Chen',
        '2025-10-23 04:41:08',
        'Dr. Emily Chen'
    ),
    (
        2,
        1002,
        3,
        3,
        '2025-01-16 14:00:00',
        '118/76',
        1,
        2,
        'Completed',
        '[\"Hyperlipidemia\"]',
        'Start statin therapy, dietary changes',
        'Follow-up consultation',
        'Internal Medicine',
        120.00,
        15.00,
        105.00,
        15.00,
        105.00,
        1,
        '[\"Elevated cholesterol levels\"]',
        98.4,
        '2024-01-16 14:00:00',
        '2024-01-16 14:30:00',
        3,
        '2025-10-23 04:41:08',
        'Dr. Emily Chen',
        '2025-10-23 04:41:08',
        'Dr. Emily Chen'
    ),
    (
        3,
        1003,
        5,
        1,
        '2025-01-15 10:30:00',
        '130/85',
        2,
        5,
        'Completed',
        '[\"Osteoarthritis\"]',
        'Pain management, physical therapy referral',
        'Cardiology checkup',
        'Cardiology',
        200.00,
        25.00,
        175.00,
        25.00,
        175.00,
        1,
        '[\"Joint pain in knees\"]',
        98.2,
        '2024-01-15 10:30:00',
        '2024-01-15 11:15:00',
        5,
        '2025-10-23 04:41:08',
        'Dr. James Rodriguez',
        '2025-10-23 04:41:08',
        'Dr. James Rodriguez'
    ),
    (
        15,
        1013,
        5,
        1,
        '2025-10-24 10:30:00',
        '120/80',
        1,
        2,
        'Scheduled',
        '[\"Mild Severity\", \"Flu\"]',
        'Prescribed rest and hydration; recommended follow-up in one week.',
        'Fever and cough',
        'Internal Medicine',
        200.00,
        50.00,
        150.00,
        20.00,
        180.00,
        1,
        '{\"Cough\": true, \"Fever\": true}',
        99.5,
        '2025-10-24 10:30:00',
        '2025-10-24 11:00:00',
        5,
        '2025-10-25 04:21:57',
        'nurse.jane',
        '2025-10-25 04:49:03',
        NULL
    ),
    (
        16,
        1013,
        5,
        1,
        '2025-10-25 01:15:00',
        '130/80',
        1,
        1,
        'Scheduled',
        NULL,
        NULL,
        NULL,
        'Internal Medicine',
        NULL,
        NULL,
        NULL,
        NULL,
        NULL,
        NULL,
        NULL,
        99.0,
        '2025-10-24 01:30:00',
        NULL,
        5,
        '2025-10-24 01:10:00',
        NULL,
        '2025-10-25 18:16:49',
        NULL
    );

-- Table: medical_condition
DROP TABLE IF EXISTS `medical_condition`;

CREATE TABLE `medical_condition` (
    `condition_id` INT NOT NULL AUTO_INCREMENT,
    `patient_id` INT DEFAULT NULL,
    `condition_name` VARCHAR(100) DEFAULT NULL,
    `diagnosis_date` DATE DEFAULT NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `created_by` VARCHAR(30) DEFAULT NULL,
    `last_updated` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `updated_by` VARCHAR(30) DEFAULT NULL,
    PRIMARY KEY (`condition_id`),
    KEY `idx_mc_patient` (`patient_id`),
    KEY `idx_mc_condition_name` (`condition_name`),
    KEY `idx_mc_diagnosis_date` (`diagnosis_date`),
    CONSTRAINT `fk_mc__patient` FOREIGN KEY (`patient_id`) REFERENCES `patient` (`patient_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 12 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

INSERT INTO
    `medical_condition`
VALUES (
        1,
        1,
        'Hypertension',
        '2024-03-10',
        '2025-10-23 04:41:08',
        'Dr. Emily Chen',
        '2025-10-23 04:41:08',
        'Dr. Emily Chen'
    ),
    (
        2,
        1,
        'Type 2 Diabetes',
        '2022-07-15',
        '2025-10-23 04:41:08',
        'Dr. Emily Chen',
        '2025-10-23 04:41:08',
        'Dr. Emily Chen'
    ),
    (
        3,
        2,
        'Asthma',
        '2021-05-20',
        '2025-10-23 04:41:08',
        'Dr. Susan Lee',
        '2025-10-23 04:41:08',
        'Dr. Susan Lee'
    ),
    (
        4,
        2,
        'Migraine',
        '2020-11-03',
        '2025-10-23 04:41:08',
        'Dr. Susan Lee',
        '2025-10-23 04:41:08',
        'Dr. Susan Lee'
    ),
    (
        5,
        3,
        'Hyperlipidemia',
        '2021-01-12',
        '2025-10-23 04:41:08',
        'Dr. Emily Chen',
        '2025-10-23 04:41:08',
        'Dr. Emily Chen'
    ),
    (
        6,
        4,
        'Hypothyroidism',
        '2023-09-08',
        '2025-10-23 04:41:08',
        'Dr. Richard Patel',
        '2025-10-23 04:41:08',
        'Dr. Richard Patel'
    ),
    (
        7,
        5,
        'Osteoarthritis',
        '2024-12-15',
        '2025-10-23 04:41:08',
        'Dr. James Rodriguez',
        '2025-10-23 04:41:08',
        'Dr. James Rodriguez'
    ),
    (
        8,
        5,
        'GERD',
        '2022-04-22',
        '2025-10-23 04:41:08',
        'Dr. James Rodriguez',
        '2025-10-23 04:41:08',
        'Dr. James Rodriguez'
    ),
    (
        9,
        6,
        'Anxiety Disorder',
        '2024-08-30',
        '2025-10-23 04:41:08',
        'Dr. Maria Garcia',
        '2025-10-23 04:41:08',
        'Dr. Maria Garcia'
    ),
    (
        10,
        7,
        'COPD',
        '2022-06-18',
        '2025-10-23 04:41:08',
        'Dr. James Rodriguez',
        '2025-10-23 04:41:08',
        'Dr. James Rodriguez'
    ),
    (
        11,
        8,
        'PCOS',
        '2021-03-25',
        '2025-10-23 04:41:08',
        'Dr. Susan Lee',
        '2025-10-23 04:41:08',
        'Dr. Susan Lee'
    );

-- Table: medical_history
DROP TABLE IF EXISTS `medical_history`;

CREATE TABLE `medical_history` (
    `history_id` INT NOT NULL AUTO_INCREMENT,
    `patient_id` INT NOT NULL,
    `condition_name` VARCHAR(100) NOT NULL,
    `diagnosis_date` DATE NOT NULL,
    PRIMARY KEY (`history_id`),
    KEY `idx_medhist_patient` (`patient_id`),
    CONSTRAINT `fk_mh__patient` FOREIGN KEY (`patient_id`) REFERENCES `patient` (`patient_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 15 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

INSERT INTO
    `medical_history`
VALUES (
        1,
        1,
        'Hypertension',
        '2021-03-10'
    ),
    (
        2,
        1,
        'Type 2 Diabetes',
        '2019-07-15'
    ),
    (3, 2, 'Asthma', '2022-05-20'),
    (
        4,
        2,
        'Migraine',
        '2021-11-03'
    ),
    (
        5,
        3,
        'Hyperlipidemia',
        '2020-01-12'
    ),
    (
        6,
        4,
        'Hypothyroidism',
        '2019-09-08'
    ),
    (
        7,
        5,
        'Osteoarthritis',
        '2016-12-15'
    ),
    (8, 5, 'GERD', '2019-04-22'),
    (
        9,
        6,
        'Anxiety Disorder',
        '2020-08-30'
    ),
    (10, 7, 'COPD', '2014-06-18'),
    (11, 8, 'PCOS', '2018-03-25'),
    (
        12,
        1,
        'Appendectomy',
        '2010-08-12'
    ),
    (
        13,
        3,
        'Tonsillectomy',
        '2025-03-22'
    ),
    (
        14,
        7,
        'Knee Replacement',
        '2024-11-05'
    );

-- Table: medication_history
DROP TABLE IF EXISTS `medication_history`;

CREATE TABLE `medication_history` (
    `drug_id` INT NOT NULL AUTO_INCREMENT,
    `patient_id` INT NOT NULL,
    `drug_name` VARCHAR(100) NOT NULL,
    `duration_and_frequency_of_drug_use` VARCHAR(150) DEFAULT NULL,
    PRIMARY KEY (`drug_id`),
    KEY `idx_medhist_patient` (`patient_id`),
    CONSTRAINT `fk_medhist_patient` FOREIGN KEY (`patient_id`) REFERENCES `patient` (`patient_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 14 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

INSERT INTO
    `medication_history`
VALUES (
        1,
        1,
        'Lisinopril 10mg',
        'Once daily since August 2020'
    ),
    (
        2,
        1,
        'Metformin 500mg',
        'Twice daily since December 20223'
    ),
    (
        3,
        2,
        'Albuterol Inhaler',
        'As needed since November 2024'
    ),
    (
        4,
        2,
        'Sumatriptan 50mg',
        'As needed for migraines since March 2018'
    ),
    (
        5,
        3,
        'Atorvastatin 20mg',
        'Once daily since June 2021'
    ),
    (
        6,
        4,
        'Levothyroxine 75mcg',
        'Once daily since May 2017'
    ),
    (
        7,
        5,
        'Ibuprofen 600mg',
        'Three times daily as needed since June 2012'
    ),
    (
        8,
        5,
        'Omeprazole 20mg',
        'Once daily since May 2021'
    ),
    (
        9,
        6,
        'Sertraline 50mg',
        'Once daily since August 2020'
    ),
    (
        10,
        7,
        'Spiriva HandiHaler',
        'Once daily since September 2024'
    ),
    (
        11,
        7,
        'Albuterol Nebulizer',
        'Four times daily since Feburary 2021'
    ),
    (
        12,
        8,
        'Metformin 1000mg',
        'Twice daily since January 2022'
    ),
    (
        13,
        8,
        'Drospirenone/Ethinyl Estradiol',
        'Once daily since March 2025'
    );

-- Table: vaccination_history
DROP TABLE IF EXISTS `vaccination_history`;

CREATE TABLE `vaccination_history` (
    `vaccination_id` INT NOT NULL AUTO_INCREMENT,
    `patient_id` INT NOT NULL,
    `vaccination_name` VARCHAR(100) NOT NULL,
    `date_of_vaccination` DATE NOT NULL,
    `date_for_booster` DATE DEFAULT NULL,
    PRIMARY KEY (`vaccination_id`),
    KEY `idx_vaxhist_patient` (`patient_id`),
    CONSTRAINT `fk_vaxhist_patient` FOREIGN KEY (`patient_id`) REFERENCES `patient` (`patient_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 10 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

INSERT INTO
    `vaccination_history`
VALUES (
        1,
        1,
        'Influenza Vaccine',
        '2023-10-15',
        '2024-10-15'
    ),
    (
        2,
        1,
        'COVID-19 Bivalent',
        '2023-11-20',
        '2024-11-20'
    ),
    (
        3,
        2,
        'Influenza Vaccine',
        '2023-10-20',
        '2024-10-20'
    ),
    (
        4,
        3,
        'Tetanus Booster',
        '2022-05-10',
        '2032-05-10'
    ),
    (
        5,
        4,
        'Influenza Vaccine',
        '2023-10-25',
        '2024-10-25'
    ),
    (
        6,
        5,
        'Shingles Vaccine',
        '2023-09-15',
        NULL
    ),
    (
        7,
        6,
        'HPV Vaccine',
        '2023-08-10',
        '2024-02-10'
    ),
    (
        8,
        7,
        'Pneumococcal Vaccine',
        '2023-07-20',
        NULL
    ),
    (
        9,
        8,
        'Influenza Vaccine',
        '2023-10-30',
        '2024-10-30'
    );

-- Table: responsible_party
DROP TABLE IF EXISTS `responsible_party`;

CREATE TABLE `responsible_party` (
    `responsible_party_id` INT NOT NULL AUTO_INCREMENT,
    `first_name` VARCHAR(30) NOT NULL,
    `last_name` VARCHAR(30) NOT NULL,
    `apartment_no` VARCHAR(10) DEFAULT NULL,
    `building_no` VARCHAR(10) DEFAULT NULL,
    `state` VARCHAR(20) NOT NULL,
    `zipcode` VARCHAR(10) NOT NULL,
    `city` VARCHAR(30) NOT NULL,
    `responsible_party_pn` VARCHAR(20) NOT NULL,
    PRIMARY KEY (`responsible_party_id`),
    KEY `idx_resp_party_name` (`last_name`, `first_name`)
) ENGINE = InnoDB AUTO_INCREMENT = 4 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

INSERT INTO
    `responsible_party`
VALUES (
        1,
        'Robert',
        'Smith',
        'A',
        '1',
        'TX',
        '77002',
        'Houston',
        '555-2001'
    ),
    (
        2,
        'Carlos',
        'Garcia',
        'B',
        '2',
        'TX',
        '77024',
        'Houston',
        '555-2002'
    ),
    (
        3,
        'Susan',
        'Johnson',
        NULL,
        '3',
        'TX',
        '77007',
        'Houston',
        '555-2003'
    );

-- Table: user_account
DROP TABLE IF EXISTS `user_account`;

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
  CONSTRAINT `user_account_chk_1` CHECK ((`failed_login_count` >= 0))
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_account`
--

LOCK TABLES `user_account` WRITE;
/*!40000 ALTER TABLE `user_account` DISABLE KEYS */;
INSERT INTO `user_account` VALUES (1,'p101','john.smith@email.com','MedApp123!','PATIENT',0,NULL,0,1,'2025-10-22 04:54:59'),(2,'d201','echen@medconnect.com','MedApp123!','DOCTOR',0,NULL,0,1,'2025-10-22 04:54:59'),(3,'n301','tnguyen@medconnect.com','MedApp123!','NURSE',0,NULL,0,1,'2025-10-23 14:54:01'),(4,'a401','a.wilson@medconnect.com','MedApp123!','ADMIN',0,NULL,0,1,'2025-10-25 14:54:01');
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

-- Dump completed on 2025-10-27 19:45:06