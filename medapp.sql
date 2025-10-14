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

-- Dumping structure for table med-app-db.Specialty
DROP TABLE IF EXISTS `Specialty`;
CREATE TABLE IF NOT EXISTS `Specialty` (
  `specialty_id` int NOT NULL AUTO_INCREMENT,
  `specialty_name` varchar(100) NOT NULL,
  PRIMARY KEY (`specialty_id`) USING BTREE,
  UNIQUE KEY `ux_specialty_name` (`specialty_name`)
) ENGINE=InnoDB AUTO_INCREMENT=37 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table med-app-db.Specialty: ~18 rows (approximately)
INSERT INTO `Specialty` (`specialty_id`, `specialty_name`) VALUES
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

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
