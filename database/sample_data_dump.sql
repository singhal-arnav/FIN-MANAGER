-- MySQL dump 10.13  Distrib 8.0.43, for Win64 (x86_64)
--
-- Host: localhost    Database: pfms
-- ------------------------------------------------------
-- Server version	8.0.43

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `accounts`
--

DROP TABLE IF EXISTS `accounts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `accounts` (
  `account_id` int NOT NULL AUTO_INCREMENT,
  `profile_id` int NOT NULL,
  `name` varchar(50) NOT NULL,
  `balance` decimal(15,2) NOT NULL DEFAULT '0.00',
  PRIMARY KEY (`account_id`),
  KEY `profile_id` (`profile_id`),
  CONSTRAINT `accounts_ibfk_1` FOREIGN KEY (`profile_id`) REFERENCES `profiles` (`profile_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=33 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `accounts`
--

LOCK TABLES `accounts` WRITE;
/*!40000 ALTER TABLE `accounts` DISABLE KEYS */;
INSERT INTO `accounts` VALUES (1,1,'Savings',0.00),(11,6,'Checking Account',0.00),(12,6,'Savings Account',0.00),(13,6,'Credit Card',6640.00),(14,7,'Joint Checking',2000.00),(15,7,'Family Savings',16311.02),(16,8,'Business Checking',4000.00),(17,8,'Business Savings',10385.00),(18,9,'Store Checking',4500.00),(19,9,'Store Savings',0.00),(29,14,'Savings',86959.45),(30,14,'Broking',21000.00),(31,15,'Business1',1000000.00),(32,15,'Business2',500000.00);
/*!40000 ALTER TABLE `accounts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `budgets`
--

DROP TABLE IF EXISTS `budgets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `budgets` (
  `budget_id` int NOT NULL AUTO_INCREMENT,
  `profile_id` int NOT NULL,
  `category_id` int NOT NULL,
  `budget` decimal(15,2) NOT NULL,
  `month` int NOT NULL,
  `year` int NOT NULL,
  PRIMARY KEY (`budget_id`),
  UNIQUE KEY `profile_id` (`profile_id`,`category_id`,`month`,`year`),
  KEY `category_id` (`category_id`),
  CONSTRAINT `budgets_ibfk_1` FOREIGN KEY (`profile_id`) REFERENCES `profiles` (`profile_id`) ON DELETE CASCADE,
  CONSTRAINT `budgets_ibfk_2` FOREIGN KEY (`category_id`) REFERENCES `categories` (`category_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `budgets`
--

LOCK TABLES `budgets` WRITE;
/*!40000 ALTER TABLE `budgets` DISABLE KEYS */;
INSERT INTO `budgets` VALUES (16,14,32,1000.00,11,2025),(17,14,33,12000.00,11,2025),(18,15,37,100000.00,11,2025);
/*!40000 ALTER TABLE `budgets` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `categories`
--

DROP TABLE IF EXISTS `categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `categories` (
  `category_id` int NOT NULL AUTO_INCREMENT,
  `profile_id` int NOT NULL,
  `name` varchar(50) NOT NULL,
  `parent_category_id` int DEFAULT NULL,
  PRIMARY KEY (`category_id`),
  UNIQUE KEY `profile_id` (`profile_id`,`name`),
  KEY `parent_category_id` (`parent_category_id`),
  CONSTRAINT `categories_ibfk_1` FOREIGN KEY (`profile_id`) REFERENCES `profiles` (`profile_id`) ON DELETE CASCADE,
  CONSTRAINT `categories_ibfk_2` FOREIGN KEY (`parent_category_id`) REFERENCES `categories` (`category_id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=43 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categories`
--

LOCK TABLES `categories` WRITE;
/*!40000 ALTER TABLE `categories` DISABLE KEYS */;
INSERT INTO `categories` VALUES (32,14,'Food',NULL),(33,14,'Rent',NULL),(34,14,'Medicine',NULL),(36,14,'Transport',NULL),(37,15,'Material',NULL),(38,15,'Labour',NULL),(39,15,'Business',NULL),(40,14,'Office supplies',NULL),(41,14,'Policy1',NULL),(42,14,'Policy2',NULL);
/*!40000 ALTER TABLE `categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `clients`
--

DROP TABLE IF EXISTS `clients`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `clients` (
  `client_id` int NOT NULL AUTO_INCREMENT,
  `profile_id` int NOT NULL,
  `client_name` varchar(255) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `address` text,
  PRIMARY KEY (`client_id`),
  KEY `profile_id` (`profile_id`),
  CONSTRAINT `clients_ibfk_1` FOREIGN KEY (`profile_id`) REFERENCES `profiles` (`profile_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `clients`
--

LOCK TABLES `clients` WRITE;
/*!40000 ALTER TABLE `clients` DISABLE KEYS */;
INSERT INTO `clients` VALUES (6,8,'ABC Corporation','contact@abccorp.com','123 Business St, New York, NY 10001'),(7,8,'XYZ Tech Solutions','billing@xyztech.com','456 Tech Avenue, San Francisco, CA 94102'),(8,8,'Global Industries Ltd','accounts@globalind.com','789 Corporate Blvd, Chicago, IL 60601'),(9,9,'Retail Chain Co','orders@retailchain.com','100 Retail Way, Los Angeles, CA 90001'),(10,9,'Boutique Store','info@boutiquestore.com','200 Fashion St, Miami, FL 33101'),(16,15,'Metal systems',NULL,'Pune'),(17,15,'One Entertainment',NULL,'Mumbai'),(18,15,'Coep',NULL,'Pune');
/*!40000 ALTER TABLE `clients` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `financial_goals`
--

DROP TABLE IF EXISTS `financial_goals`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `financial_goals` (
  `goal_id` int NOT NULL AUTO_INCREMENT,
  `profile_id` int NOT NULL,
  `goal_name` varchar(100) NOT NULL,
  `target_amount` decimal(15,2) NOT NULL,
  `current_amount` decimal(15,2) NOT NULL DEFAULT '0.00',
  `target_date` date DEFAULT NULL,
  `status` enum('In Progress','Achieved','Cancelled') NOT NULL DEFAULT 'In Progress',
  PRIMARY KEY (`goal_id`),
  UNIQUE KEY `profile_id` (`profile_id`,`goal_name`,`target_amount`,`target_date`),
  CONSTRAINT `financial_goals_ibfk_1` FOREIGN KEY (`profile_id`) REFERENCES `profiles` (`profile_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `financial_goals`
--

LOCK TABLES `financial_goals` WRITE;
/*!40000 ALTER TABLE `financial_goals` DISABLE KEYS */;
INSERT INTO `financial_goals` VALUES (6,6,'Emergency Fund',10000.00,3500.00,'2026-05-06','In Progress'),(7,6,'Vacation Fund',3000.00,1200.00,'2026-02-06','In Progress'),(8,6,'New Car Down Payment',5000.00,2500.00,'2026-07-06','In Progress'),(9,7,'College Fund',50000.00,12000.00,'2030-11-06','In Progress'),(10,7,'Home Down Payment',50000.00,15000.00,'2028-11-06','In Progress'),(16,14,'Car Down Payment',600000.00,6200.18,'2026-11-06','In Progress'),(17,15,'New Factory',10000000.00,7000000.00,'2031-07-01','In Progress'),(18,14,'education fee',1000000.00,50000.00,'2029-06-06','In Progress');
/*!40000 ALTER TABLE `financial_goals` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `investment_transactions`
--

DROP TABLE IF EXISTS `investment_transactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `investment_transactions` (
  `inv_transaction_id` int NOT NULL AUTO_INCREMENT,
  `investment_id` int NOT NULL,
  `account_id` int NOT NULL,
  `transaction_type` enum('Buy','Sell') NOT NULL,
  `quantity` decimal(18,8) NOT NULL,
  `price_per_unit` decimal(15,2) NOT NULL,
  `transaction_date` date NOT NULL,
  PRIMARY KEY (`inv_transaction_id`),
  KEY `investment_id` (`investment_id`),
  KEY `account_id` (`account_id`),
  CONSTRAINT `investment_transactions_ibfk_1` FOREIGN KEY (`investment_id`) REFERENCES `investments` (`investment_id`) ON DELETE CASCADE,
  CONSTRAINT `investment_transactions_ibfk_2` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`account_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `investment_transactions`
--

LOCK TABLES `investment_transactions` WRITE;
/*!40000 ALTER TABLE `investment_transactions` DISABLE KEYS */;
INSERT INTO `investment_transactions` VALUES (1,1,1,'Buy',20.00000000,100.00,'2025-11-05'),(2,1,1,'Sell',10.00000000,110.00,'2025-11-05'),(13,9,14,'Buy',1000.00000000,1.00,'2025-10-07'),(14,10,14,'Buy',25.00000000,200.00,'2025-10-17'),(21,17,30,'Buy',100.00000000,120.00,'2025-11-06'),(22,17,30,'Buy',50.00000000,100.00,'2025-11-06'),(23,18,30,'Buy',10.00000000,1200.00,'2025-11-06');
/*!40000 ALTER TABLE `investment_transactions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `investments`
--

DROP TABLE IF EXISTS `investments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `investments` (
  `investment_id` int NOT NULL AUTO_INCREMENT,
  `profile_id` int NOT NULL,
  `investment_name` varchar(100) NOT NULL,
  `investment_type` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`investment_id`),
  KEY `profile_id` (`profile_id`),
  CONSTRAINT `investments_ibfk_1` FOREIGN KEY (`profile_id`) REFERENCES `profiles` (`profile_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `investments`
--

LOCK TABLES `investments` WRITE;
/*!40000 ALTER TABLE `investments` DISABLE KEYS */;
INSERT INTO `investments` VALUES (1,1,'Apple Stock','Stock'),(7,6,'Apple Inc. (AAPL)','Stock'),(8,6,'S&P 500 Index Fund','Mutual Fund'),(9,6,'Bitcoin','Cryptocurrency'),(10,7,'529 College Savings Plan','Education Fund'),(11,7,'Vanguard Total Stock Market','Index Fund'),(17,14,'Apple Stock','Stock'),(18,14,'Gold','Metals');
/*!40000 ALTER TABLE `investments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `invoices`
--

DROP TABLE IF EXISTS `invoices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `invoices` (
  `invoice_id` int NOT NULL AUTO_INCREMENT,
  `client_id` int NOT NULL,
  `profile_id` int NOT NULL,
  `invoice_number` varchar(50) NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `issue_date` date NOT NULL,
  `due_date` date NOT NULL,
  `status` enum('draft','sent','paid','overdue','void') NOT NULL DEFAULT 'draft',
  PRIMARY KEY (`invoice_id`),
  KEY `client_id` (`client_id`),
  KEY `profile_id` (`profile_id`),
  CONSTRAINT `invoices_ibfk_1` FOREIGN KEY (`client_id`) REFERENCES `clients` (`client_id`) ON DELETE CASCADE,
  CONSTRAINT `invoices_ibfk_2` FOREIGN KEY (`profile_id`) REFERENCES `profiles` (`profile_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `invoices`
--

LOCK TABLES `invoices` WRITE;
/*!40000 ALTER TABLE `invoices` DISABLE KEYS */;
INSERT INTO `invoices` VALUES (10,8,9,'INV-ECOM-001',5000.00,'2025-09-27','2025-10-27','paid'),(11,8,9,'INV-ECOM-002',4200.00,'2025-10-22','2025-11-21','sent'),(12,9,9,'INV-ECOM-003',1800.00,'2025-10-29','2025-11-28','sent'),(13,9,9,'INV-ECOM-004',1500.00,'2025-11-05','2025-12-05','draft'),(23,16,15,'MS-0001',10000.00,'2025-11-06','2025-11-27','sent'),(24,17,15,'OE-0002',16000.00,'2025-10-09','2025-12-09','sent'),(25,18,15,'COEP1',10000.00,'2025-11-06','2025-12-06','sent');
/*!40000 ALTER TABLE `invoices` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
  `notification_id` int NOT NULL AUTO_INCREMENT,
  `profile_id` int NOT NULL,
  `message` text NOT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`notification_id`),
  KEY `profile_id` (`profile_id`),
  CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`profile_id`) REFERENCES `profiles` (`profile_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=37 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
INSERT INTO `notifications` VALUES (12,6,'Budget exceeded for Groceries this month',0,'2025-11-01 07:48:09'),(13,6,'New transaction: $125.50 - Weekly Groceries',0,'2025-11-04 07:48:09'),(14,6,'Financial Goal \"Emergency Fund\" is 35% complete',1,'2025-10-27 07:48:09'),(15,7,'Rent payment due in 3 days',0,'2025-11-04 07:48:10'),(16,7,'College Fund goal is 24% complete',1,'2025-11-01 07:48:10'),(17,8,'Invoice INV-2024-003 is due in 10 days',0,'2025-11-06 07:48:10'),(18,8,'New client payment received: $6000.00',1,'2025-11-01 07:48:10'),(19,8,'Marketing budget is 85% used this month',0,'2025-11-03 07:48:10'),(20,9,'Inventory levels are low - reorder needed',0,'2025-11-03 07:48:10'),(21,9,'Invoice INV-ECOM-002 is due in 15 days',0,'2025-11-06 07:48:10'),(22,9,'Monthly sales target achieved!',1,'2025-11-05 07:48:10'),(34,14,'Budget exceeded for Food: Spent ₹1350.00 out of ₹1000.00 budget for November 2025.',0,'2025-11-06 08:03:49'),(35,14,'Budget exceeded for Food: Spent ₹1850.00 out of ₹1000.00 budget for November 2025.',0,'2025-11-06 08:52:53'),(36,14,'Budget exceeded for Food: Spent ₹2350.00 out of ₹1000.00 budget for November 2025.',0,'2025-11-06 09:54:59');
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payment_methods`
--

DROP TABLE IF EXISTS `payment_methods`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payment_methods` (
  `payment_method_id` int NOT NULL AUTO_INCREMENT,
  `type` varchar(50) NOT NULL,
  PRIMARY KEY (`payment_method_id`),
  UNIQUE KEY `type` (`type`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payment_methods`
--

LOCK TABLES `payment_methods` WRITE;
/*!40000 ALTER TABLE `payment_methods` DISABLE KEYS */;
INSERT INTO `payment_methods` VALUES (9,'Apple Pay'),(4,'Bank Transfer'),(3,'Cash'),(8,'Check'),(1,'Credit Card'),(2,'Debit Card'),(10,'Google Pay'),(5,'PayPal'),(6,'Venmo'),(7,'Zelle');
/*!40000 ALTER TABLE `payment_methods` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `profiles`
--

DROP TABLE IF EXISTS `profiles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `profiles` (
  `profile_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `profile_name` varchar(100) NOT NULL,
  `profile_type` enum('personal','business') NOT NULL,
  PRIMARY KEY (`profile_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `profiles_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `profiles`
--

LOCK TABLES `profiles` WRITE;
/*!40000 ALTER TABLE `profiles` DISABLE KEYS */;
INSERT INTO `profiles` VALUES (1,1,'Personal Finances','personal'),(6,3,'Main Personal','personal'),(7,3,'Family Finance','personal'),(8,3,'Consulting Business','business'),(9,3,'E-commerce Store','business'),(14,5,'Ansh-Personal','personal'),(15,5,'Ansh-Business','business');
/*!40000 ALTER TABLE `profiles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `recurring_transactions`
--

DROP TABLE IF EXISTS `recurring_transactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `recurring_transactions` (
  `recurring_id` int NOT NULL AUTO_INCREMENT,
  `profile_id` int NOT NULL,
  `category_id` int DEFAULT NULL,
  `description` varchar(100) DEFAULT NULL,
  `amount` decimal(15,2) NOT NULL,
  `frequency` varchar(30) DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  PRIMARY KEY (`recurring_id`),
  KEY `profile_id` (`profile_id`),
  KEY `category_id` (`category_id`),
  CONSTRAINT `recurring_transactions_ibfk_1` FOREIGN KEY (`profile_id`) REFERENCES `profiles` (`profile_id`) ON DELETE CASCADE,
  CONSTRAINT `recurring_transactions_ibfk_2` FOREIGN KEY (`category_id`) REFERENCES `categories` (`category_id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=32 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `recurring_transactions`
--

LOCK TABLES `recurring_transactions` WRITE;
/*!40000 ALTER TABLE `recurring_transactions` DISABLE KEYS */;
INSERT INTO `recurring_transactions` VALUES (11,6,NULL,'Monthly Salary',4500.00,'Monthly','2026-11-06'),(12,6,NULL,'Electricity Bill',120.00,'Monthly',NULL),(13,6,NULL,'Netflix Subscription',15.99,'Monthly',NULL),(14,7,NULL,'Monthly Salary',6000.00,'Monthly',NULL),(15,7,NULL,'Rent Payment',1800.00,'Monthly',NULL),(16,7,NULL,'Monthly Savings Transfer',1000.00,'Monthly',NULL),(17,8,NULL,'Adobe Creative Cloud',29.99,'Monthly',NULL),(18,8,NULL,'Microsoft Office 365',99.00,'Monthly',NULL),(19,9,NULL,'E-commerce Platform Fees',450.00,'Monthly',NULL),(20,9,NULL,'Monthly Sales Revenue',8500.00,'Monthly',NULL),(31,14,33,'electricity bill',2000.00,'Monthly',NULL);
/*!40000 ALTER TABLE `recurring_transactions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `transactions`
--

DROP TABLE IF EXISTS `transactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `transactions` (
  `transaction_id` int NOT NULL AUTO_INCREMENT,
  `account_id` int NOT NULL,
  `category_id` int DEFAULT NULL,
  `payment_method_id` int DEFAULT NULL,
  `type` enum('income','expense') NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `description` varchar(100) DEFAULT NULL,
  `time_stamp` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`transaction_id`),
  KEY `account_id` (`account_id`),
  KEY `category_id` (`category_id`),
  KEY `payment_method_id` (`payment_method_id`),
  CONSTRAINT `transactions_ibfk_1` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`account_id`) ON DELETE CASCADE,
  CONSTRAINT `transactions_ibfk_2` FOREIGN KEY (`category_id`) REFERENCES `categories` (`category_id`) ON DELETE SET NULL,
  CONSTRAINT `transactions_ibfk_3` FOREIGN KEY (`payment_method_id`) REFERENCES `payment_methods` (`payment_method_id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=206 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `transactions`
--

LOCK TABLES `transactions` WRITE;
/*!40000 ALTER TABLE `transactions` DISABLE KEYS */;
INSERT INTO `transactions` VALUES (91,13,NULL,4,'income',6000.00,'Monthly Salary','2025-10-06 13:18:10'),(92,13,NULL,4,'income',6000.00,'Monthly Salary','2025-11-06 13:18:10'),(93,13,NULL,4,'expense',1800.00,'Rent Payment','2025-10-07 13:18:10'),(94,13,NULL,4,'expense',1800.00,'Rent Payment','2025-11-06 13:18:10'),(95,13,NULL,2,'expense',350.00,'School Tuition','2025-09-22 13:18:10'),(96,13,NULL,2,'expense',125.00,'School Supplies','2025-10-17 13:18:10'),(97,13,NULL,2,'expense',250.00,'Doctor Visit','2025-09-29 13:18:10'),(98,13,NULL,2,'expense',85.00,'Pharmacy','2025-10-22 13:18:10'),(99,13,NULL,1,'expense',450.00,'Clothing','2025-09-25 13:18:10'),(100,13,NULL,1,'expense',320.00,'Electronics','2025-10-09 13:18:10'),(101,13,NULL,1,'expense',180.00,'Home Decor','2025-10-25 13:18:10'),(102,14,NULL,4,'income',1000.00,'Monthly Savings','2025-10-06 13:18:10'),(103,14,NULL,4,'income',1000.00,'Monthly Savings','2025-11-06 13:18:10'),(104,15,NULL,4,'income',5000.00,'Client Project Payment','2025-09-17 13:18:10'),(105,15,NULL,4,'income',3500.00,'Client Project Payment','2025-10-02 13:18:10'),(106,15,NULL,4,'income',4500.00,'Client Project Payment','2025-10-17 13:18:10'),(107,15,NULL,4,'income',6000.00,'Client Project Payment','2025-11-01 13:18:10'),(108,15,NULL,2,'expense',250.00,'Office Supplies','2025-09-19 13:18:10'),(109,15,NULL,2,'expense',180.00,'Printer Paper & Ink','2025-10-12 13:18:10'),(110,15,NULL,1,'expense',29.99,'Adobe Creative Cloud','2025-10-07 13:18:10'),(111,15,NULL,1,'expense',99.00,'Microsoft Office 365','2025-10-07 13:18:10'),(112,15,NULL,1,'expense',29.99,'Adobe Creative Cloud','2025-11-06 13:18:10'),(113,15,NULL,1,'expense',500.00,'Google Ads Campaign','2025-09-27 13:18:10'),(114,15,NULL,1,'expense',350.00,'LinkedIn Premium','2025-10-22 13:18:10'),(115,15,NULL,2,'expense',800.00,'Legal Consultation','2025-09-25 13:18:10'),(116,15,NULL,2,'expense',450.00,'Accounting Services','2025-10-09 13:18:10'),(117,16,NULL,4,'income',2000.00,'Profit Transfer to Savings','2025-10-06 13:18:10'),(118,16,NULL,4,'income',2000.00,'Profit Transfer to Savings','2025-11-06 13:18:10'),(119,17,NULL,5,'income',8500.00,'Monthly Sales Revenue','2025-10-06 13:18:10'),(120,17,NULL,5,'income',9200.00,'Monthly Sales Revenue','2025-11-06 13:18:10'),(121,17,NULL,5,'income',1250.00,'Weekly Sales','2025-10-30 13:18:10'),(122,17,NULL,2,'expense',3200.00,'Inventory Purchase','2025-09-22 13:18:10'),(123,17,NULL,2,'expense',2800.00,'Inventory Purchase','2025-10-17 13:18:10'),(124,17,NULL,1,'expense',450.00,'Shipping Costs','2025-09-27 13:18:10'),(125,17,NULL,1,'expense',380.00,'Shipping Costs','2025-10-12 13:18:10'),(126,17,NULL,1,'expense',520.00,'Shipping Costs','2025-10-27 13:18:10'),(127,17,NULL,1,'expense',425.00,'E-commerce Platform Fees','2025-10-07 13:18:10'),(128,17,NULL,1,'expense',460.00,'E-commerce Platform Fees','2025-11-06 13:18:10'),(129,17,NULL,2,'expense',180.00,'Packaging Supplies','2025-10-02 13:18:10'),(130,17,NULL,2,'expense',150.00,'Packaging Supplies','2025-10-22 13:18:10'),(131,18,NULL,4,'income',2000.00,'Profit Transfer','2025-10-06 13:18:10'),(132,18,NULL,4,'income',2500.00,'Profit Transfer','2025-11-06 13:18:10'),(199,29,32,10,'expense',100.00,'Delicioso','2025-11-06 13:25:39'),(200,29,33,4,'expense',10000.00,'November rent','2025-11-06 13:26:04'),(202,29,34,10,'expense',690.55,'Crocin','2025-11-06 13:26:56'),(203,29,32,10,'expense',1250.00,'','2025-11-06 13:33:49'),(204,29,32,10,'expense',500.00,'coffee','2025-11-06 14:22:53'),(205,29,32,10,'expense',500.00,'Coffee','2025-11-06 15:24:59');
/*!40000 ALTER TABLE `transactions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `user_id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `name` varchar(50) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `last_login` datetime DEFAULT NULL,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'arnav.singhal@gmail.com','$2b$10$3SZbhTH4eKr7uYMlJdLhK.qRsl7HtyK75ZW5s86O/D4T/h08ZFHUm','Arnav Singhal','2025-11-05 21:16:33',NULL),(3,'test.user@gmail.com','$2b$10$3SZbhTH4eKr7uYMlJdLhK.qRsl7HtyK75ZW5s86O/D4T/h08ZFHUm','Test User','2025-09-06 13:18:09','2025-11-06 13:18:57'),(5,'ansh@gmail.com','$2b$10$zCNjWEGQ6WGdMNYFP2ERMOeeW3LEowqn8cfuziO.s72bs2YIC2Zlm','Ansh','2025-11-06 13:24:00','2025-11-06 15:24:27');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-11-14 11:29:50
