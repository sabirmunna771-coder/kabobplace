-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: May 20, 2026 at 04:45 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `sbkhaplu`
--

-- --------------------------------------------------------

--
-- Table structure for table `address`
--

CREATE TABLE `address` (
  `id` int(11) NOT NULL,
  `userId` int(11) NOT NULL,
  `label` varchar(191) NOT NULL,
  `street` varchar(191) NOT NULL,
  `city` varchar(191) NOT NULL,
  `state` varchar(191) NOT NULL,
  `postalCode` varchar(191) NOT NULL,
  `country` varchar(191) NOT NULL DEFAULT 'Pakistan',
  `isDefault` tinyint(1) NOT NULL DEFAULT 0,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `announcementbar`
--

CREATE TABLE `announcementbar` (
  `id` int(11) NOT NULL,
  `text` varchar(191) NOT NULL,
  `ctaLabel` varchar(191) DEFAULT NULL,
  `ctaHref` varchar(191) DEFAULT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `appsettings`
--

CREATE TABLE `appsettings` (
  `id` int(11) NOT NULL,
  `storeStatus` varchar(191) NOT NULL DEFAULT 'OPEN',
  `businessHours` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`businessHours`)),
  `enableAutoShutdown` tinyint(1) NOT NULL DEFAULT 1,
  `maintenanceMode` tinyint(1) NOT NULL DEFAULT 0,
  `taxPercentage` decimal(5,2) NOT NULL DEFAULT 0.00,
  `deliveryChargeType` enum('FLAT','DISTANCE_BASED') NOT NULL DEFAULT 'FLAT',
  `deliveryFlatFee` decimal(10,2) NOT NULL DEFAULT 50.00,
  `deliveryPerKmCharge` decimal(10,2) NOT NULL DEFAULT 10.00,
  `currencySymbol` varchar(191) NOT NULL DEFAULT 'Rs.',
  `decimalRounding` int(11) NOT NULL DEFAULT 2,
  `paymentMethods` varchar(191) NOT NULL DEFAULT 'CASH,MOBILE_WALLET',
  `mapApiKey` text DEFAULT NULL,
  `smsGatewayApiKey` text DEFAULT NULL,
  `paymentGatewayApiKey` text DEFAULT NULL,
  `siteName` varchar(191) NOT NULL DEFAULT 'Snow Bites',
  `siteTitle` varchar(191) NOT NULL DEFAULT 'Snow Bites - Premium Fast Food',
  `siteLogo` text DEFAULT NULL,
  `siteFavicon` text DEFAULT NULL,
  `sitePhone` varchar(32) DEFAULT NULL,
  `siteEmail` varchar(100) DEFAULT NULL,
  `siteAddress` text DEFAULT NULL,
  `seoMetaTitle` varchar(160) DEFAULT NULL,
  `seoMetaDescription` varchar(160) DEFAULT NULL,
  `facebookUrl` varchar(255) DEFAULT NULL,
  `instagramUrl` varchar(255) DEFAULT NULL,
  `whatsappNumber` varchar(32) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `homepageCms` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`homepageCms`)),
  `logoSuite` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`logoSuite`)),
  `themeConfig` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`themeConfig`)),
  `uiPreferences` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`uiPreferences`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `appsettings`
--

INSERT INTO `appsettings` (`id`, `storeStatus`, `businessHours`, `enableAutoShutdown`, `maintenanceMode`, `taxPercentage`, `deliveryChargeType`, `deliveryFlatFee`, `deliveryPerKmCharge`, `currencySymbol`, `decimalRounding`, `paymentMethods`, `mapApiKey`, `smsGatewayApiKey`, `paymentGatewayApiKey`, `siteName`, `siteTitle`, `siteLogo`, `siteFavicon`, `sitePhone`, `siteEmail`, `siteAddress`, `seoMetaTitle`, `seoMetaDescription`, `facebookUrl`, `instagramUrl`, `whatsappNumber`, `createdAt`, `updatedAt`, `homepageCms`, `logoSuite`, `themeConfig`, `uiPreferences`) VALUES
(1, 'OPEN', NULL, 1, 0, 0.00, 'FLAT', 50.00, 10.00, 'Rs.', 2, 'CASH,MOBILE_WALLET', NULL, NULL, NULL, 'Snow Bites', 'Snow Bites - Premium Fast Food', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-04-11 04:25:02.921', '2026-04-11 04:25:02.921', NULL, NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `branch`
--

CREATE TABLE `branch` (
  `id` int(11) NOT NULL,
  `code` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `address` varchar(191) DEFAULT NULL,
  `phone` varchar(32) DEFAULT NULL,
  `status` enum('ACTIVE','TEMPORARILY_CLOSED') NOT NULL DEFAULT 'ACTIVE',
  `isPrimary` tinyint(1) NOT NULL DEFAULT 0,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `managerStaffId` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `branch`
--

INSERT INTO `branch` (`id`, `code`, `name`, `address`, `phone`, `status`, `isPrimary`, `createdAt`, `updatedAt`, `managerStaffId`) VALUES
(1, '001', 'Khaplu Main', 'P/O khaplu main bazar ,Ghanche Gilgitbaltistan', '03554842245', 'TEMPORARILY_CLOSED', 0, '2026-04-11 06:43:16.658', '2026-04-11 14:51:20.111', NULL),
(2, 'KHP-001', 'Khaplu Main 1', NULL, NULL, 'TEMPORARILY_CLOSED', 0, '2026-04-11 09:12:27.296', '2026-04-11 14:51:18.455', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `branchingredientstock`
--

CREATE TABLE `branchingredientstock` (
  `id` int(11) NOT NULL,
  `branchId` int(11) NOT NULL,
  `ingredientId` int(11) NOT NULL,
  `currentQty` decimal(10,3) NOT NULL,
  `minQty` decimal(10,3) NOT NULL DEFAULT 0.000,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `category`
--

CREATE TABLE `category` (
  `id` int(11) NOT NULL,
  `slug` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `icon` varchar(191) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `category`
--

INSERT INTO `category` (`id`, `slug`, `name`, `icon`, `createdAt`, `updatedAt`) VALUES
(1, 'burgers', 'Burgers', '🍔', '2026-04-10 20:16:26.451', '2026-04-10 21:13:27.780'),
(2, 'pizza', 'Pizza', '🍕', '2026-04-10 20:16:26.462', '2026-04-10 21:13:27.788'),
(3, 'chinese', 'Chinese', '🥡', '2026-04-10 20:16:26.472', '2026-04-10 21:13:27.792'),
(4, 'noodles', 'Noodles', '🍜', '2026-04-10 20:16:26.476', '2026-04-10 21:13:27.796'),
(5, 'shawarma', 'Shawarma', '🌯', '2026-04-10 20:16:26.480', '2026-04-10 21:13:27.799'),
(6, 'sides', 'Sides & More', '🍟', '2026-04-10 20:16:26.485', '2026-04-10 21:13:27.803'),
(7, 'balti', 'Balti', 'soup', '2026-04-11 11:23:39.174', '2026-04-11 11:23:39.174');

-- --------------------------------------------------------

--
-- Table structure for table `coupon`
--

CREATE TABLE `coupon` (
  `id` int(11) NOT NULL,
  `code` varchar(191) NOT NULL,
  `discountType` enum('PERCENTAGE','FIXED') NOT NULL,
  `discountValue` decimal(10,2) NOT NULL,
  `minOrderValue` decimal(10,2) NOT NULL DEFAULT 0.00,
  `expiresAt` datetime(3) DEFAULT NULL,
  `usageLimit` int(11) DEFAULT NULL,
  `usageCount` int(11) NOT NULL DEFAULT 0,
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `deal`
--

CREATE TABLE `deal` (
  `id` int(11) NOT NULL,
  `publicId` varchar(191) NOT NULL,
  `slug` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `description` varchar(191) DEFAULT NULL,
  `imageUrl` varchar(191) DEFAULT NULL,
  `price` decimal(10,2) NOT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `expiresAt` datetime(3) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `deal`
--

INSERT INTO `deal` (`id`, `publicId`, `slug`, `name`, `description`, `imageUrl`, `price`, `isActive`, `expiresAt`, `createdAt`, `updatedAt`) VALUES
(1, 'deal-snowdeal1-411695', 'snowdeal1', 'Snow Deal', NULL, NULL, 200.00, 1, NULL, '2026-04-11 11:20:11.803', '2026-04-11 11:20:11.803');

-- --------------------------------------------------------

--
-- Table structure for table `dealitem`
--

CREATE TABLE `dealitem` (
  `id` int(11) NOT NULL,
  `dealId` int(11) NOT NULL,
  `productId` int(11) NOT NULL,
  `quantity` int(11) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `dealitem`
--

INSERT INTO `dealitem` (`id`, `dealId`, `productId`, `quantity`) VALUES
(1, 1, 1, 1),
(2, 1, 2, 1);

-- --------------------------------------------------------

--
-- Table structure for table `flashsale`
--

CREATE TABLE `flashsale` (
  `id` int(11) NOT NULL,
  `name` varchar(191) NOT NULL,
  `discountType` enum('PERCENTAGE','FIXED') NOT NULL DEFAULT 'PERCENTAGE',
  `discountValue` decimal(10,2) NOT NULL,
  `startsAt` datetime(3) NOT NULL,
  `endsAt` datetime(3) NOT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `herobanner`
--

CREATE TABLE `herobanner` (
  `id` int(11) NOT NULL,
  `title` varchar(191) NOT NULL,
  `subtitle` varchar(191) DEFAULT NULL,
  `imageUrl` varchar(191) NOT NULL,
  `ctaLabel` varchar(191) DEFAULT NULL,
  `ctaHref` varchar(191) DEFAULT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `sortOrder` int(11) NOT NULL DEFAULT 0,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `ingredient`
--

CREATE TABLE `ingredient` (
  `id` int(11) NOT NULL,
  `name` varchar(191) NOT NULL,
  `slug` varchar(191) NOT NULL,
  `unit` enum('KG','LITER','PIECE','CRATE','PACK') NOT NULL,
  `currentQty` decimal(10,3) NOT NULL,
  `minQty` decimal(10,3) NOT NULL,
  `isCore` tinyint(1) NOT NULL DEFAULT 1,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `ingredient`
--

INSERT INTO `ingredient` (`id`, `name`, `slug`, `unit`, `currentQty`, `minQty`, `isCore`, `createdAt`, `updatedAt`) VALUES
(1, 'Checken', 'checken', 'KG', 50.000, 50.000, 1, '2026-04-11 10:42:07.126', '2026-04-11 10:46:46.414');

-- --------------------------------------------------------

--
-- Table structure for table `inventoryrestocklog`
--

CREATE TABLE `inventoryrestocklog` (
  `id` int(11) NOT NULL,
  `ingredientId` int(11) NOT NULL,
  `vendorId` int(11) DEFAULT NULL,
  `quantity` decimal(10,3) NOT NULL,
  `unitCost` decimal(10,2) NOT NULL,
  `totalCost` decimal(10,2) NOT NULL,
  `note` varchar(191) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `inventoryrestocklog`
--

INSERT INTO `inventoryrestocklog` (`id`, `ingredientId`, `vendorId`, `quantity`, `unitCost`, `totalCost`, `note`, `createdAt`) VALUES
(1, 1, 1, 2000.000, 100.00, 200000.00, NULL, '2026-04-11 10:42:33.945');

-- --------------------------------------------------------

--
-- Table structure for table `inventorywastelog`
--

CREATE TABLE `inventorywastelog` (
  `id` int(11) NOT NULL,
  `ingredientId` int(11) NOT NULL,
  `quantity` decimal(10,3) NOT NULL,
  `reason` varchar(191) DEFAULT NULL,
  `note` varchar(191) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `inventorywastelog`
--

INSERT INTO `inventorywastelog` (`id`, `ingredientId`, `quantity`, `reason`, `note`, `createdAt`) VALUES
(1, 1, 50.000, 'Daily wastage', NULL, '2026-04-11 10:45:28.556'),
(2, 1, 200.000, 'Quality Issue', NULL, '2026-04-11 10:46:02.631'),
(3, 1, 1000.000, 'Spoiled', NULL, '2026-04-11 10:46:16.752'),
(4, 1, 890.000, 'Spoiled', NULL, '2026-04-11 10:46:37.381'),
(5, 1, 10.000, 'Damaged', NULL, '2026-04-11 10:46:46.447');

-- --------------------------------------------------------

--
-- Table structure for table `marketingnotification`
--

CREATE TABLE `marketingnotification` (
  `id` int(11) NOT NULL,
  `title` varchar(191) NOT NULL,
  `message` varchar(191) NOT NULL,
  `kind` varchar(191) NOT NULL DEFAULT 'GENERAL',
  `ctaLabel` varchar(191) DEFAULT NULL,
  `ctaHref` varchar(191) DEFAULT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `expiresAt` datetime(3) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `order`
--

CREATE TABLE `order` (
  `id` int(11) NOT NULL,
  `orderNumber` varchar(191) NOT NULL,
  `status` enum('PENDING','CONFIRMED','PREPARING','OUT_FOR_DELIVERY','COMPLETED','CANCELLED') NOT NULL DEFAULT 'PENDING',
  `customerName` varchar(191) NOT NULL,
  `customerEmail` varchar(191) DEFAULT NULL,
  `customerPhone` varchar(191) NOT NULL,
  `deliveryAddress` varchar(191) NOT NULL,
  `notes` varchar(191) DEFAULT NULL,
  `subtotal` decimal(10,2) NOT NULL,
  `total` decimal(10,2) NOT NULL,
  `source` varchar(191) NOT NULL DEFAULT 'WEB',
  `customerId` int(11) DEFAULT NULL,
  `handledById` int(11) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `assignedRiderId` int(11) DEFAULT NULL,
  `couponCode` varchar(191) DEFAULT NULL,
  `couponId` int(11) DEFAULT NULL,
  `discountAmount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `discountLabel` varchar(191) DEFAULT NULL,
  `orderType` varchar(191) NOT NULL DEFAULT 'DELIVERY',
  `paymentMethod` varchar(191) NOT NULL DEFAULT 'CASH',
  `tableNumber` varchar(191) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `order`
--

INSERT INTO `order` (`id`, `orderNumber`, `status`, `customerName`, `customerEmail`, `customerPhone`, `deliveryAddress`, `notes`, `subtotal`, `total`, `source`, `customerId`, `handledById`, `createdAt`, `updatedAt`, `assignedRiderId`, `couponCode`, `couponId`, `discountAmount`, `discountLabel`, `orderType`, `paymentMethod`, `tableNumber`) VALUES
(1, 'SB-20260410203117-N6RI', 'COMPLETED', 'Snow Bites Admin', 'admin@snowbites.local', '+923555556080', 'P/O khaplu main bazar ,Ghanche Gilgitbaltistan\nP/O khaplu main bazar ,Ghanche Gilgitbaltistan', NULL, 250.00, 250.00, 'WEB', NULL, 1, '2026-04-10 20:31:17.373', '2026-04-11 10:40:34.820', NULL, NULL, NULL, 0.00, NULL, 'DELIVERY', 'CASH', NULL),
(2, 'SB-20260410203614-686H', 'COMPLETED', 'Muhammad Atiq', 'ateeqbaltee@gmail.com', '03482925780', 'J5QJ+298\nMain Street\nHamdani Town Ali Pur', NULL, 400.00, 400.00, 'WEB', NULL, 1, '2026-04-10 20:36:14.150', '2026-04-11 10:40:34.820', NULL, NULL, NULL, 0.00, NULL, 'DELIVERY', 'CASH', NULL),
(3, 'SB-20260410210519-0E91', 'COMPLETED', 'Snow Bites Admin', 'admin@snowbites.local', '+923555556080', 'J5QJ+298\nMain Street\nHamdani Town Ali Pur', NULL, 900.00, 900.00, 'WEB', NULL, 1, '2026-04-10 21:05:19.510', '2026-04-11 10:40:34.820', 3, NULL, NULL, 0.00, NULL, 'DELIVERY', 'CASH', NULL),
(4, 'SB-20260410215644-A8G8', 'COMPLETED', 'Snow Bites Admin', 'admin@snowbites.local', '+923555556080', 'P/O khaplu main bazar ,Ghanche Gilgitbaltistan\nP/O khaplu main bazar ,Ghanche Gilgitbaltistan', NULL, 350.00, 350.00, 'WEB', NULL, 1, '2026-04-10 21:56:44.913', '2026-04-11 10:40:34.820', 1, NULL, NULL, 0.00, NULL, 'DELIVERY', 'CASH', NULL),
(5, 'SB-20260411084550-4FTJ', 'COMPLETED', 'Admin', 'admin@snowbites.local', '+923555556080', 'P/O khaplu main bazar ,Ghanche Gilgitbaltistan', NULL, 250.00, 250.00, 'WEB', NULL, 1, '2026-04-11 08:45:50.763', '2026-04-11 10:40:34.820', NULL, NULL, NULL, 0.00, NULL, 'DELIVERY', 'CASH', NULL),
(6, 'SB-20260411123310-MDIU', 'COMPLETED', 'Admin', 'admin@snowbites.local', '+923555556080', 'P/O khaplu main bazar ,Ghanche Gilgitbaltistan\nP/O khaplu main bazar ,Ghanche Gilgitbaltistan', NULL, 5000.00, 5000.00, 'WEB', NULL, 1, '2026-04-11 12:33:10.453', '2026-04-11 12:35:14.337', 2, NULL, NULL, 0.00, NULL, 'DELIVERY', 'CASH', NULL),
(7, 'SB-20260411124746-OAO5', 'COMPLETED', 'Muhammad Atiq', NULL, '03482925780', 'House no 10', NULL, 400.00, 400.00, 'WEB', NULL, 1, '2026-04-11 12:47:46.864', '2026-04-11 14:11:02.796', NULL, NULL, NULL, 0.00, NULL, 'DELIVERY', 'CASH', NULL),
(8, 'SB-20260411125012-OP62', 'COMPLETED', 'Admin', NULL, '+923555556080', 'auto 121 321', NULL, 250.00, 250.00, 'WEB', NULL, 1, '2026-04-11 12:50:12.267', '2026-04-11 14:11:02.796', NULL, NULL, NULL, 0.00, NULL, 'DELIVERY', 'CASH', NULL),
(9, 'SB-20260411125132-6KJ6', 'COMPLETED', 'Admin', NULL, '+923555556080', 'hello', 'wwedd', 250.00, 250.00, 'WEB', NULL, 1, '2026-04-11 12:51:32.076', '2026-04-11 14:11:02.796', NULL, NULL, NULL, 0.00, NULL, 'DELIVERY', 'CASH', NULL),
(10, 'SB-20260411131747-L5CD', 'COMPLETED', 'Test user 12', NULL, '123456789', 'house 1213', NULL, 750.00, 750.00, 'WEB', NULL, 1, '2026-04-11 13:17:47.866', '2026-04-11 14:11:02.796', NULL, NULL, NULL, 0.00, NULL, 'DELIVERY', 'CASH', NULL),
(11, 'SB-20260411132204-RNCX', 'COMPLETED', 'Atiq', NULL, '12345678910', 'Hello word test', 'kadhksk', 400.00, 400.00, 'WEB', NULL, 1, '2026-04-11 13:22:04.278', '2026-04-11 14:11:02.796', NULL, NULL, NULL, 0.00, NULL, 'DELIVERY', 'CASH', NULL),
(12, 'SB-20260411132314-VJE7', 'COMPLETED', 'Test user 444', NULL, '12345678', 'Test 1234 ghdf', NULL, 400.00, 400.00, 'WEB', NULL, 1, '2026-04-11 13:23:14.493', '2026-04-11 14:11:02.796', NULL, NULL, NULL, 0.00, NULL, 'DELIVERY', 'CASH', NULL),
(13, 'SB-20260411132720-WIZE', 'COMPLETED', 'Atiq', NULL, '12345678', 'djdjdbjs  26683', NULL, 400.00, 400.00, 'WEB', NULL, 1, '2026-04-11 13:27:20.372', '2026-04-11 14:11:02.796', NULL, NULL, NULL, 0.00, NULL, 'DELIVERY', 'CASH', NULL),
(14, 'SB-20260411140403-ZU70', 'COMPLETED', 'Admin', NULL, '+923555556080', 'dUIDUIDU', 'ACDUIADAU', 250.00, 250.00, 'WEB', NULL, 1, '2026-04-11 14:04:03.964', '2026-04-11 14:10:35.871', NULL, NULL, NULL, 0.00, NULL, 'DELIVERY', 'CASH', NULL),
(15, 'SB-20260411142605-CJXT', 'PENDING', 'Admin', NULL, '+923555556080', 'fuhfuigui5466r768', 'fuifuigui', 880.00, 880.00, 'WEB', NULL, NULL, '2026-04-11 14:26:05.963', '2026-04-11 14:26:05.963', NULL, NULL, NULL, 0.00, NULL, 'DELIVERY', 'CASH', NULL),
(16, 'SB-20260411153231-0HDW', 'OUT_FOR_DELIVERY', 'Test', NULL, '031234455566', 'Walk-In Counter', NULL, 2250.00, 2250.00, 'POS', NULL, 1, '2026-04-11 15:32:31.290', '2026-04-28 15:17:18.585', NULL, NULL, NULL, 0.00, NULL, 'WALK_IN', 'CASH', NULL),
(17, 'SB-20260411153445-RR29', 'OUT_FOR_DELIVERY', 'Walk-In Customer', NULL, '03555556080', 'Walk-In Counter', NULL, 4000.00, 4000.00, 'POS', NULL, 1, '2026-04-11 15:34:45.842', '2026-04-28 15:17:18.627', NULL, NULL, NULL, 0.00, NULL, 'WALK_IN', 'CASH', NULL),
(18, 'SB-20260416203137-BF26', 'COMPLETED', 'Muhammad Atiq', NULL, '03482925780', 'Dine-In — Table Table No 7', 'Test User', 1880.00, 1880.00, 'POS', NULL, 1, '2026-04-16 20:31:37.987', '2026-04-16 20:35:45.592', NULL, NULL, NULL, 0.00, NULL, 'DINE_IN', 'CASH', 'Table No 7'),
(19, 'SB-20260416203855-FT7C', 'COMPLETED', 'Test', NULL, '123456789', 'Dine-In — Table Table 1', NULL, 2200.00, 2200.00, 'POS', NULL, 1, '2026-04-16 20:38:55.417', '2026-04-16 20:39:28.626', NULL, NULL, NULL, 0.00, NULL, 'DINE_IN', 'CASH', 'Table 1'),
(20, 'SB-20260416205544-RZLK', 'OUT_FOR_DELIVERY', 'Atiq', NULL, '03482925780', 'Walk-In Counter', NULL, 1400.00, 1400.00, 'POS', NULL, 1, '2026-04-16 20:55:44.660', '2026-04-28 15:17:18.646', NULL, NULL, NULL, 0.00, NULL, 'WALK_IN', 'CASH', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `orderitem`
--

CREATE TABLE `orderitem` (
  `id` int(11) NOT NULL,
  `orderId` int(11) NOT NULL,
  `productId` int(11) DEFAULT NULL,
  `productName` varchar(191) NOT NULL,
  `productPrice` decimal(10,2) NOT NULL,
  `quantity` int(11) NOT NULL,
  `lineTotal` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `orderitem`
--

INSERT INTO `orderitem` (`id`, `orderId`, `productId`, `productName`, `productPrice`, `quantity`, `lineTotal`) VALUES
(1, 1, 17, 'Chicken Shawarma', 250.00, 1, 250.00),
(2, 2, 11, 'Chicken Chilli Dry', 400.00, 1, 400.00),
(3, 3, 8, 'Pepperoni Pizza (M)', 900.00, 1, 900.00),
(4, 4, 1, 'Classic Smash Burger', 350.00, 1, 350.00),
(5, 5, 17, 'Chicken Shawarma', 250.00, 1, 250.00),
(6, 6, 27, 'Test Atiq', 4000.00, 1, 4000.00),
(7, 6, 17, 'Chicken Shawarma', 250.00, 1, 250.00),
(8, 6, 1, 'Classic Smash Burger', 350.00, 1, 350.00),
(9, 6, 11, 'Chicken Chilli Dry', 400.00, 1, 400.00),
(10, 7, 11, 'Chicken Chilli Dry', 400.00, 1, 400.00),
(11, 8, 17, 'Chicken Shawarma', 250.00, 1, 250.00),
(12, 9, 17, 'Chicken Shawarma', 250.00, 1, 250.00),
(13, 10, 17, 'Chicken Shawarma', 250.00, 3, 750.00),
(14, 11, 11, 'Chicken Chilli Dry', 400.00, 1, 400.00),
(15, 12, 11, 'Chicken Chilli Dry', 400.00, 1, 400.00),
(16, 13, 2, 'Zinger Burger', 400.00, 1, 400.00),
(17, 14, 17, 'Chicken Shawarma', 250.00, 1, 250.00),
(18, 15, 17, 'Chicken Shawarma', 250.00, 2, 500.00),
(19, 15, 15, 'Spicy Noodles', 380.00, 1, 380.00),
(20, 16, 4, 'BBQ Bacon Burger', 500.00, 1, 500.00),
(21, 16, 1, 'Classic Smash Burger', 350.00, 1, 350.00),
(22, 16, 3, 'Double Trouble Burger', 550.00, 1, 550.00),
(23, 16, 11, 'Chicken Chilli Dry', 400.00, 1, 400.00),
(24, 16, 10, 'Chicken Manchurian', 450.00, 1, 450.00),
(25, 17, 27, 'Test Atiq', 4000.00, 1, 4000.00),
(26, 18, 3, 'Double Trouble Burger', 550.00, 1, 550.00),
(27, 18, 1, 'Classic Smash Burger', 350.00, 1, 350.00),
(28, 18, 4, 'BBQ Bacon Burger', 500.00, 1, 500.00),
(29, 18, 13, 'Dragon Chicken', 480.00, 1, 480.00),
(30, 19, 4, 'BBQ Bacon Burger', 500.00, 1, 500.00),
(31, 19, 1, 'Classic Smash Burger', 350.00, 1, 350.00),
(32, 19, 3, 'Double Trouble Burger', 550.00, 1, 550.00),
(33, 19, 11, 'Chicken Chilli Dry', 400.00, 1, 400.00),
(34, 19, 2, 'Zinger Burger', 400.00, 1, 400.00),
(35, 20, 3, 'Double Trouble Burger', 550.00, 1, 550.00),
(36, 20, 1, 'Classic Smash Burger', 350.00, 1, 350.00),
(37, 20, 4, 'BBQ Bacon Burger', 500.00, 1, 500.00);

-- --------------------------------------------------------

--
-- Table structure for table `orderstatushistory`
--

CREATE TABLE `orderstatushistory` (
  `id` int(11) NOT NULL,
  `orderId` int(11) NOT NULL,
  `fromStatus` enum('PENDING','CONFIRMED','PREPARING','OUT_FOR_DELIVERY','COMPLETED','CANCELLED') DEFAULT NULL,
  `toStatus` enum('PENDING','CONFIRMED','PREPARING','OUT_FOR_DELIVERY','COMPLETED','CANCELLED') NOT NULL,
  `note` varchar(191) DEFAULT NULL,
  `changedById` int(11) DEFAULT NULL,
  `changedAt` datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `orderstatushistory`
--

INSERT INTO `orderstatushistory` (`id`, `orderId`, `fromStatus`, `toStatus`, `note`, `changedById`, `changedAt`) VALUES
(1, 3, 'CONFIRMED', 'PREPARING', NULL, 1, '2026-04-10 21:17:00.073'),
(2, 2, 'CONFIRMED', 'PREPARING', NULL, 1, '2026-04-10 21:17:02.658'),
(3, 1, 'CONFIRMED', 'PREPARING', NULL, 1, '2026-04-10 21:17:03.870'),
(4, 3, 'PREPARING', 'OUT_FOR_DELIVERY', NULL, 1, '2026-04-10 21:18:18.801'),
(5, 2, 'PREPARING', 'OUT_FOR_DELIVERY', NULL, 1, '2026-04-10 21:18:20.673'),
(6, 1, 'PREPARING', 'OUT_FOR_DELIVERY', NULL, 1, '2026-04-10 21:18:22.264'),
(7, 3, 'OUT_FOR_DELIVERY', 'COMPLETED', NULL, 1, '2026-04-10 21:18:38.130'),
(8, 2, 'OUT_FOR_DELIVERY', 'COMPLETED', NULL, 1, '2026-04-10 21:18:39.564'),
(9, 1, 'OUT_FOR_DELIVERY', 'COMPLETED', NULL, 1, '2026-04-10 21:18:40.820'),
(10, 4, NULL, 'PENDING', 'Order created', NULL, '2026-04-10 21:56:44.913'),
(11, 4, 'PENDING', 'CONFIRMED', NULL, 1, '2026-04-10 21:57:37.913'),
(12, 4, 'CONFIRMED', 'PREPARING', NULL, 1, '2026-04-10 21:57:39.563'),
(13, 4, 'PREPARING', 'OUT_FOR_DELIVERY', NULL, 1, '2026-04-10 21:57:40.624'),
(14, 4, 'OUT_FOR_DELIVERY', 'COMPLETED', NULL, 1, '2026-04-10 21:57:41.737'),
(15, 5, NULL, 'PENDING', 'Order created', NULL, '2026-04-11 08:45:50.763'),
(16, 5, 'PENDING', 'CONFIRMED', NULL, 1, '2026-04-11 08:46:05.394'),
(17, 5, 'CONFIRMED', 'PREPARING', NULL, 1, '2026-04-11 08:46:09.396'),
(18, 5, 'PREPARING', 'OUT_FOR_DELIVERY', NULL, 1, '2026-04-11 08:46:11.244'),
(19, 5, 'OUT_FOR_DELIVERY', 'COMPLETED', NULL, 1, '2026-04-11 08:46:13.640'),
(20, 1, 'COMPLETED', 'OUT_FOR_DELIVERY', NULL, 1, '2026-04-11 10:40:21.693'),
(21, 2, 'COMPLETED', 'OUT_FOR_DELIVERY', NULL, 1, '2026-04-11 10:40:21.693'),
(22, 3, 'COMPLETED', 'OUT_FOR_DELIVERY', NULL, 1, '2026-04-11 10:40:21.693'),
(23, 4, 'COMPLETED', 'OUT_FOR_DELIVERY', NULL, 1, '2026-04-11 10:40:21.693'),
(24, 5, 'COMPLETED', 'OUT_FOR_DELIVERY', NULL, 1, '2026-04-11 10:40:21.693'),
(25, 1, 'OUT_FOR_DELIVERY', 'COMPLETED', NULL, 1, '2026-04-11 10:40:34.823'),
(26, 2, 'OUT_FOR_DELIVERY', 'COMPLETED', NULL, 1, '2026-04-11 10:40:34.823'),
(27, 3, 'OUT_FOR_DELIVERY', 'COMPLETED', NULL, 1, '2026-04-11 10:40:34.823'),
(28, 4, 'OUT_FOR_DELIVERY', 'COMPLETED', NULL, 1, '2026-04-11 10:40:34.823'),
(29, 5, 'OUT_FOR_DELIVERY', 'COMPLETED', NULL, 1, '2026-04-11 10:40:34.823'),
(30, 6, NULL, 'PENDING', 'Order created', NULL, '2026-04-11 12:33:10.453'),
(31, 6, 'PENDING', 'PREPARING', NULL, 1, '2026-04-11 12:33:49.600'),
(32, 6, 'PREPARING', 'OUT_FOR_DELIVERY', NULL, 1, '2026-04-11 12:34:35.369'),
(33, 6, 'OUT_FOR_DELIVERY', 'COMPLETED', NULL, 1, '2026-04-11 12:35:14.353'),
(34, 7, NULL, 'PENDING', 'Order created', NULL, '2026-04-11 12:47:46.864'),
(35, 8, NULL, 'PENDING', 'Order created', NULL, '2026-04-11 12:50:12.267'),
(36, 9, NULL, 'PENDING', 'Order created', NULL, '2026-04-11 12:51:32.076'),
(37, 10, NULL, 'PENDING', 'Order created', NULL, '2026-04-11 13:17:47.866'),
(38, 11, NULL, 'PENDING', 'Order created', NULL, '2026-04-11 13:22:04.278'),
(39, 12, NULL, 'PENDING', 'Order created', NULL, '2026-04-11 13:23:14.493'),
(40, 13, NULL, 'PENDING', 'Order created', NULL, '2026-04-11 13:27:20.372'),
(41, 7, 'PENDING', 'PREPARING', NULL, 1, '2026-04-11 14:02:11.977'),
(42, 8, 'PENDING', 'PREPARING', NULL, 1, '2026-04-11 14:02:11.977'),
(43, 9, 'PENDING', 'PREPARING', NULL, 1, '2026-04-11 14:02:11.977'),
(44, 10, 'PENDING', 'PREPARING', NULL, 1, '2026-04-11 14:02:11.977'),
(45, 11, 'PENDING', 'PREPARING', NULL, 1, '2026-04-11 14:02:11.977'),
(46, 12, 'PENDING', 'PREPARING', NULL, 1, '2026-04-11 14:02:11.977'),
(47, 13, 'PENDING', 'PREPARING', NULL, 1, '2026-04-11 14:02:11.977'),
(48, 14, NULL, 'PENDING', 'Order created', NULL, '2026-04-11 14:04:03.964'),
(49, 14, 'PENDING', 'COMPLETED', NULL, 1, '2026-04-11 14:10:35.880'),
(50, 7, 'PREPARING', 'COMPLETED', NULL, 1, '2026-04-11 14:11:02.799'),
(51, 8, 'PREPARING', 'COMPLETED', NULL, 1, '2026-04-11 14:11:02.799'),
(52, 9, 'PREPARING', 'COMPLETED', NULL, 1, '2026-04-11 14:11:02.799'),
(53, 10, 'PREPARING', 'COMPLETED', NULL, 1, '2026-04-11 14:11:02.799'),
(54, 11, 'PREPARING', 'COMPLETED', NULL, 1, '2026-04-11 14:11:02.799'),
(55, 12, 'PREPARING', 'COMPLETED', NULL, 1, '2026-04-11 14:11:02.799'),
(56, 13, 'PREPARING', 'COMPLETED', NULL, 1, '2026-04-11 14:11:02.799'),
(57, 15, NULL, 'PENDING', 'Order created', NULL, '2026-04-11 14:26:05.963'),
(58, 16, NULL, 'PENDING', 'Order created', 1, '2026-04-11 15:32:31.290'),
(59, 17, NULL, 'PENDING', 'Order created', 1, '2026-04-11 15:34:45.842'),
(60, 17, 'PENDING', 'CONFIRMED', NULL, 1, '2026-04-11 15:54:42.190'),
(61, 16, 'PENDING', 'CONFIRMED', NULL, 1, '2026-04-11 15:54:43.309'),
(62, 18, NULL, 'PENDING', 'Order created', 1, '2026-04-16 20:31:37.987'),
(63, 18, 'PENDING', 'CONFIRMED', NULL, 1, '2026-04-16 20:35:25.617'),
(64, 18, 'CONFIRMED', 'PREPARING', NULL, 1, '2026-04-16 20:35:43.583'),
(65, 18, 'PREPARING', 'COMPLETED', NULL, 1, '2026-04-16 20:35:45.603'),
(66, 19, NULL, 'PENDING', 'Order created', 1, '2026-04-16 20:38:55.417'),
(67, 19, 'PENDING', 'CONFIRMED', NULL, 1, '2026-04-16 20:39:25.559'),
(68, 19, 'CONFIRMED', 'PREPARING', NULL, 1, '2026-04-16 20:39:26.990'),
(69, 19, 'PREPARING', 'COMPLETED', NULL, 1, '2026-04-16 20:39:28.635'),
(70, 20, NULL, 'PENDING', 'Order created', 1, '2026-04-16 20:55:44.660'),
(71, 20, 'PENDING', 'CONFIRMED', NULL, 1, '2026-04-16 20:56:22.536'),
(72, 17, 'CONFIRMED', 'PREPARING', NULL, 1, '2026-04-28 15:17:06.572'),
(73, 20, 'CONFIRMED', 'PREPARING', NULL, 1, '2026-04-28 15:17:08.119'),
(74, 16, 'CONFIRMED', 'PREPARING', NULL, 1, '2026-04-28 15:17:09.965'),
(75, 16, 'PREPARING', 'OUT_FOR_DELIVERY', NULL, 1, '2026-04-28 15:17:18.608'),
(76, 17, 'PREPARING', 'OUT_FOR_DELIVERY', NULL, 1, '2026-04-28 15:17:18.636'),
(77, 20, 'PREPARING', 'OUT_FOR_DELIVERY', NULL, 1, '2026-04-28 15:17:18.665');

-- --------------------------------------------------------

--
-- Table structure for table `product`
--

CREATE TABLE `product` (
  `id` int(11) NOT NULL,
  `publicId` varchar(191) NOT NULL,
  `slug` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `description` varchar(191) DEFAULT NULL,
  `price` decimal(10,2) NOT NULL,
  `imageUrl` longtext DEFAULT NULL,
  `badge` varchar(191) DEFAULT NULL,
  `isFeatured` tinyint(1) NOT NULL DEFAULT 0,
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `categoryId` int(11) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `badges` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`badges`)),
  `isInStock` tinyint(1) NOT NULL DEFAULT 1,
  `bestSeller` tinyint(1) NOT NULL DEFAULT 0,
  `isSpicy` tinyint(1) NOT NULL DEFAULT 0,
  `isVegetarian` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `product`
--

INSERT INTO `product` (`id`, `publicId`, `slug`, `name`, `description`, `price`, `imageUrl`, `badge`, `isFeatured`, `isActive`, `categoryId`, `createdAt`, `updatedAt`, `badges`, `isInStock`, `bestSeller`, `isSpicy`, `isVegetarian`) VALUES
(1, 'b1', 'classic-smash-burger', 'Classic Smash Burger', 'Juicy beef patty with cheese', 350.00, '/src/assets/burger2.jpg', '🔥 Bestseller', 1, 1, 1, '2026-04-10 20:16:26.492', '2026-04-10 21:13:27.813', NULL, 1, 0, 0, 0),
(2, 'b2', 'zinger-burger', 'Zinger Burger', 'Crispy chicken with spicy mayo', 400.00, '/src/assets/burger2.jpg', NULL, 0, 1, 1, '2026-04-10 20:16:26.499', '2026-04-10 21:13:27.822', NULL, 1, 0, 0, 0),
(3, 'b3', 'double-trouble-burger', 'Double Trouble Burger', 'Double patty, double cheese', 550.00, '/src/assets/burger2.jpg', '⭐ Premium', 1, 1, 1, '2026-04-10 20:16:26.504', '2026-04-10 21:13:27.828', NULL, 1, 0, 0, 0),
(4, 'b4', 'bbq-bacon-burger', 'BBQ Bacon Burger', 'Smoky BBQ with crispy bacon', 500.00, '/src/assets/burger2.jpg', NULL, 0, 1, 1, '2026-04-10 20:16:26.508', '2026-04-10 21:13:27.832', NULL, 1, 0, 0, 0),
(5, 'p1', 'fajita-pizza-small', 'Fajita Pizza (S)', 'Chicken fajita loaded', 600.00, '/src/assets/pizza.jpg', NULL, 0, 1, 2, '2026-04-10 20:16:26.512', '2026-04-10 21:13:27.838', NULL, 1, 0, 0, 0),
(6, 'p2', 'fajita-pizza-medium', 'Fajita Pizza (M)', NULL, 1000.00, '/src/assets/pizza.jpg', '🔥 Popular', 1, 1, 2, '2026-04-10 20:16:26.517', '2026-04-10 21:13:27.846', NULL, 1, 0, 0, 0),
(7, 'p3', 'fajita-pizza-large', 'Fajita Pizza (L)', NULL, 1400.00, '/src/assets/pizza.jpg', NULL, 0, 1, 2, '2026-04-10 20:16:26.522', '2026-04-10 21:13:27.853', NULL, 1, 0, 0, 0),
(8, 'p4', 'pepperoni-pizza-medium', 'Pepperoni Pizza (M)', NULL, 900.00, '/src/assets/pizza.jpg', NULL, 0, 1, 2, '2026-04-10 20:16:26.527', '2026-04-10 21:13:27.858', NULL, 1, 0, 0, 0),
(9, 'p5', 'tikka-pizza-medium', 'Tikka Pizza (M)', NULL, 950.00, '/src/assets/pizza.jpg', NULL, 0, 1, 2, '2026-04-10 20:16:26.531', '2026-04-10 21:13:27.863', NULL, 1, 0, 0, 0),
(10, 'c1', 'chicken-manchurian', 'Chicken Manchurian', 'Sweet & tangy sauce', 450.00, '/src/assets/chicken.jpg', NULL, 0, 1, 3, '2026-04-10 20:16:26.536', '2026-04-10 21:13:27.867', NULL, 1, 0, 0, 0),
(11, 'c2', 'chicken-chilli-dry', 'Chicken Chilli Dry', NULL, 400.00, '/src/assets/chicken.jpg', '🌶️ Spicy', 1, 1, 3, '2026-04-10 20:16:26.540', '2026-04-10 21:13:27.871', NULL, 1, 0, 0, 0),
(12, 'c3', 'sweet-sour-chicken', 'Sweet & Sour Chicken', NULL, 420.00, '/src/assets/chicken.jpg', NULL, 0, 1, 3, '2026-04-10 20:16:26.545', '2026-04-10 21:13:27.876', NULL, 1, 0, 0, 0),
(13, 'c4', 'dragon-chicken', 'Dragon Chicken', NULL, 480.00, '/src/assets/chicken.jpg', NULL, 0, 1, 3, '2026-04-10 20:16:26.549', '2026-04-10 21:13:27.881', NULL, 1, 0, 0, 0),
(14, 'n1', 'chow-mein', 'Chow Mein', 'Classic stir-fried noodles', 350.00, '/src/assets/noodles.jpg', NULL, 0, 1, 4, '2026-04-10 20:16:26.553', '2026-04-10 21:13:27.885', NULL, 1, 0, 0, 0),
(15, 'n2', 'spicy-noodles', 'Spicy Noodles', NULL, 380.00, '/src/assets/noodles.jpg', '🌶️ Hot', 1, 1, 4, '2026-04-10 20:16:26.557', '2026-04-10 21:13:27.890', NULL, 1, 0, 0, 0),
(16, 'n3', 'egg-fried-noodles', 'Egg Fried Noodles', NULL, 320.00, '/src/assets/noodles.jpg', NULL, 0, 1, 4, '2026-04-10 20:16:26.561', '2026-04-10 21:13:27.894', NULL, 1, 0, 0, 0),
(17, 's1', 'chicken-shawarma', 'Chicken Shawarma', 'Classic wrap', 250.00, '/src/assets/shawarma.jpg', '🔥 Bestseller', 1, 1, 5, '2026-04-10 20:16:26.565', '2026-04-10 21:13:27.898', NULL, 1, 0, 0, 0),
(18, 's2', 'shawarma-platter', 'Shawarma Platter', 'With fries & dip', 500.00, '/src/assets/shawarma.jpg', NULL, 0, 1, 5, '2026-04-10 20:16:26.570', '2026-04-10 21:13:27.903', NULL, 1, 0, 0, 0),
(19, 's3', 'double-shawarma', 'Double Shawarma', NULL, 400.00, '/src/assets/shawarma.jpg', NULL, 0, 1, 5, '2026-04-10 20:16:26.574', '2026-04-10 21:13:27.908', NULL, 1, 0, 0, 0),
(20, 'f1', 'french-fries', 'French Fries', NULL, 200.00, '/src/assets/fries.jpg', NULL, 0, 1, 6, '2026-04-10 20:16:26.579', '2026-04-10 21:13:27.912', NULL, 1, 0, 0, 0),
(21, 'f2', 'loaded-fries', 'Loaded Fries', NULL, 350.00, '/src/assets/fries.jpg', '⭐ Popular', 1, 1, 6, '2026-04-10 20:16:26.583', '2026-04-10 21:13:27.917', NULL, 1, 0, 0, 0),
(22, 'f3', 'nuggets-6pc', 'Nuggets (6pc)', NULL, 300.00, '/src/assets/chicken.jpg', NULL, 0, 1, 6, '2026-04-10 20:16:26.587', '2026-04-10 21:13:27.922', NULL, 1, 0, 0, 0),
(23, 'f4', 'coleslaw', 'Coleslaw', NULL, 100.00, '/src/assets/fries.jpg', NULL, 0, 1, 6, '2026-04-10 20:16:26.591', '2026-04-10 21:13:27.927', NULL, 1, 0, 0, 0),
(27, 'prd-tapizza-494411', 'tapizza', 'Test Atiq', NULL, 4000.00, 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMEAAAA8CAIAAABQLEkMAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAFSmlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSfvu78nIGlkPSdXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQnPz4KPHg6eG1wbWV0YSB4bWxuczp4PSdhZG9iZTpuczptZXRhLyc+CjxyZGY6UkRGIHhtbG5zOnJkZj0naHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyc+CgogPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9JycKICB4bWxuczpBdHRyaWI9J2h0dHA6Ly9ucy5hdHRyaWJ1dGlvbi5jb20vYWRzLzEuMC8nPgogIDxBdHRyaWI6QWRzPgogICA8cmRmOlNlcT4KICAgIDxyZGY6bGkgcmRmOnBhcnNlVHlwZT0nUmVzb3VyY2UnPgogICAgIDxBdHRyaWI6Q3JlYXRlZD4yMDI2LTAzLTMxPC9BdHRyaWI6Q3JlYXRlZD4KICAgICA8QXR0cmliOkRhdGE+eyZxdW90O2RvYyZxdW90OzomcXVvdDtEQUhGaGpVWW1FSSZxdW90OywmcXVvdDt1c2VyJnF1b3Q7OiZxdW90O1VBRzhXZVlnZnNBJnF1b3Q7LCZxdW90O2JyYW5kJnF1b3Q7OiZxdW90O0JBRzhXVVo1QjFJJnF1b3Q7fTwvQXR0cmliOkRhdGE+CiAgICAgPEF0dHJpYjpFeHRJZD4xMmI3MmE5Zi1lYmZjLTRjZDktODllOC0wMjAxODEzYjRkM2I8L0F0dHJpYjpFeHRJZD4KICAgICA8QXR0cmliOkZiSWQ+NTI1MjY1OTE0MTc5NTgwPC9BdHRyaWI6RmJJZD4KICAgICA8QXR0cmliOlRvdWNoVHlwZT4yPC9BdHRyaWI6VG91Y2hUeXBlPgogICAgPC9yZGY6bGk+CiAgIDwvcmRmOlNlcT4KICA8L0F0dHJpYjpBZHM+CiA8L3JkZjpEZXNjcmlwdGlvbj4KCiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0nJwogIHhtbG5zOmRjPSdodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4x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', NULL, 0, 1, 7, '2026-04-11 12:28:14.577', '2026-04-11 12:28:14.577', '[]', 1, 0, 0, 0);

-- --------------------------------------------------------

--
-- Table structure for table `productmodifier`
--

CREATE TABLE `productmodifier` (
  `id` int(11) NOT NULL,
  `productId` int(11) NOT NULL,
  `name` varchar(191) NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `productrecipeitem`
--

CREATE TABLE `productrecipeitem` (
  `id` int(11) NOT NULL,
  `productId` int(11) NOT NULL,
  `ingredientId` int(11) NOT NULL,
  `quantity` decimal(10,3) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `review`
--

CREATE TABLE `review` (
  `id` int(11) NOT NULL,
  `userId` int(11) DEFAULT NULL,
  `customerName` varchar(191) NOT NULL,
  `customerEmail` varchar(191) DEFAULT NULL,
  `rating` int(11) NOT NULL,
  `comment` varchar(191) NOT NULL,
  `status` enum('PENDING','APPROVED','HIDDEN') NOT NULL DEFAULT 'PENDING',
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `review`
--

INSERT INTO `review` (`id`, `userId`, `customerName`, `customerEmail`, `rating`, `comment`, `status`, `createdAt`, `updatedAt`) VALUES
(1, 1, 'Muhammad Atiq', 'admin@snowbites.local', 5, 'Test By atiq', 'HIDDEN', '2026-04-11 04:56:22.248', '2026-04-11 04:56:46.424'),
(2, 2, 'Muhammad Atiq', 'ateeqbaltee@gmail.com', 5, 'The loaded fries are amazing and the delivery is super fast. My go-to place for fast food!', 'APPROVED', '2026-04-11 04:57:32.519', '2026-04-11 04:57:44.911');

-- --------------------------------------------------------

--
-- Table structure for table `rider`
--

CREATE TABLE `rider` (
  `id` int(11) NOT NULL,
  `fullName` varchar(191) NOT NULL,
  `phone` varchar(32) NOT NULL,
  `vehicle` varchar(191) DEFAULT NULL,
  `availability` enum('AVAILABLE','BUSY','OFFLINE') NOT NULL DEFAULT 'AVAILABLE',
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `branchId` int(11) DEFAULT NULL,
  `profileImageUrl` longtext DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `rider`
--

INSERT INTO `rider` (`id`, `fullName`, `phone`, `vehicle`, `availability`, `createdAt`, `updatedAt`, `branchId`, `profileImageUrl`) VALUES
(1, 'Ali Raza', '+923001112233', 'Bike - GLT-101', 'AVAILABLE', '2026-04-10 21:13:27.941', '2026-04-28 15:51:45.312', NULL, 'data:image/jpeg;base64,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AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAASACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAASAACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAASACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAASACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAASCAAAAAAAAAAAAAAAAAAAAAAAAAASAACAAASCAAAAAAAAAAAP/aAAwDAQACAAMAAAAh/wD+9+888888/wD/AP8A888888/+88/+88//AP8A/wA9/wD/APzzTDTzSz/7z3//AM//AP8Azzzz3/8A/wD/AP8A/wD/AP8A88//AP8A/wD/AP8A/wD/AP8A/wD889//AP8A7zz/AP8A/wD/AIww0wwww084wxywww8wwwwwww0888ww1/4ww1//AMMMNMMMPf8A/rzjDDDDT373j3//AP8A/wDDDD3/AP8A/wDzzTz/AM4ww1/wwwww/wDf/wDjDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDf/wD4wwwwwww1/wDuMMMMc8MMMMMMMPf/ADzDDDDzjDDDDDDDDDDDXvDDDDX/ACwwwwwww1/ywwwwwwwwwwwgwwwwwwwwwwwwwwww1/4/wwwwwww3/wAsMMMsOMMMMMMMMMMMMMcsMMMMMMMMMMMMMMNMMMMMP/8A/DDDDDPDDjXDDDDDDDDDDDDDDDDDDDDDDDDDDD//AP8A/wD/AOwwwwz/AP8AjDDDDDDDPLDDDDDDDDD/AOwwzywwwwwwwwwwwwwwwww9/wD+MMMMNMMMMMMMO8MMMMM88MMMMMMMMMMMMMMMPPf/AP8A/wAMMMcPPeMMMMMMMNP/AP8A+/ww1/ww94ww04wwwwxzwwwwwwwwwwww/wD8sMMMMMMMMMMMOMMMNf8A/wD7wwwwwwwwwwwwwwwww01//wAMMNesMMMMMMMMMNf/APzDDDD7jDDDDDDDDDDDX/8Aw8wwwwwwwwwg0/7wwwwwwwwwwwwwwwx//wD/APzDDDDDDDDDDDDDDDDDDDDDPDDDDDDDDDDDDDDDXjDDDDf/ACwwwwwwwwwww8//AO8MMMMMMMMMMNf/APDDDDDDDDDDDDDDDTz/AP8A/wDjHPLDDDDDDDDDPLDDDDDH/DDDDDDDDDDDDDDDDDDDDDzzDDDDDDDPPjDDDDDDDDDDDDDDDHP/AP4wwwww0wwwwxzywwwwww0www84wwwwwwwwx/8A8sMMMNP8MMMMMMMMMMMMMMMMN8sM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MsMMMd8MMMMMMOMP/wDDDDX/AP6www889w80wwwww04w3/6www1//wC8MMMMMMMMMINeMNMMMMMMMMMMMNOMMMMMMMMMMMMMMMcMc8Mc8PMMMMMMMMMNeMMMMP8A/LDDDDDDDDDDHDDH/wD3/wD/APLDDTzzzDDDDDDDDDDfjDDDDDDDDTDDDDDDDDDDDDCDDDDDDDX/AO/7w08wwwwwwwwwwwwwwwww/wD+sMMMMMMMMMNOMNf/AP8A/wD/AP8A7wwwwwwzwwwwwwwwwwwwwwwwwwwwwgwwwwwwwwwwwwwwwwww8w04wwwwwwwwwwwwwwwwwwwx/wD+sMMMMMMMNcte9/vf/wD/AIw084wwww1/zwwwwwwwwwwwwwwwwwwwggwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwz16wwwww0/wD+8MMN+sMMNN//AHjD/wD/AOMMMMMMMMMNd/8ADDDDDDDDDDDDDDDDDDDCDDDDDDDDzjDDDDDDDDDDDDDDDDDDDDDDDDzDDTDDDDD/AP8A/wD/AA//AMsMMNOMMMPP/sMMMMMMf988/wD7DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDHfLDDDDDDDDH/AP8A/wDjD3zDDDXLDDDDDTjDDDDDDX//AP8A+sMMMMMIIMMMMMMMMMMMMMMMMMMMMMMMMMcMMMN/8sMMMMMMMMMMMNf8MMMMMMMMf/8A/wD4wwwwwwwwwwwwwwwwwwwwzzyww08wwwwwwwwwwwwwwxy3wwwwwwwwxwwwwwww04www88wwwwwwwwwwwwww14wwwwwwww//wD+MMMMMMMMMMMMMMMMMMMMMv8A/rDDDDDHLDDDDPDDDDDD3/8A4wwwwwww03ywwwwwwwwwwwwgggwwwwwwwwwwwwwwwwwww0//AP8A/DDDDDDDDDDDDDDDDDDDDzjTzjDDDDDX7DDD/wDwwwwwww9/wwwwwwwww04wwwwwwwwwwwwwggwwwwwwwwwwwwzwwwwwww9//wD8sMMMMMMMsMMMMMMMOMMMMMMMMMMMMNOMMMPf8sMMcsMcsMMMMMM/+8MMMNf8MN+98MMMMMMMMMcsMMMMMMMPcMM8MMMMNf8A/wDwwwwwz/8A+sMMMMsMMMMMMMMN+8MM+8MMMMN//sIIOMNfsMMMMMf+MMMMMNf8f/8A7jDDXrDDDLDf/DDDDDDDDDDDzDDDDT//AP8A8MMMMNf/APDDDHf/AAzzwwwwww88w3//AMsMMMf/AP8Ax37yw8w1ywww3/wwwwwww83/AP8ArDDD/DDDDjDDDDDLLDDDDDDDDDDDDDX/AP8A8MMMMMPPMMM8f8Nf/wD/AAwwwwww1/8A/P8ADDDTzzzX/wD/AP8ADDDDDD/7zDDDDD/DDT//AMwwwwzywwwwwwwww4wwwwwwwwwwwww0/wD+sMMMMMMMMMPffsMPfOMMMMMMMMMMMMMMMMMMMd//AP7DDDDXrDXDDDDfPDDDDDDDH/LDDTjDDDDDDTDDDDDDDDDDDDDDDDH/APywwwwwwwww04wwwwwwwwwwwwwwwwwwwwwwwwww9/8A8MMMMMMMMMMMNf8A/LDDDTHLDDjDDDDX/LDDDDDDDDDDDDDDDDDDDDf/AP6wwwwwwwwwwwwww0wxw4wwwwwwwwwwwww1/wD+sMNPMMMMMMMMMMMMMNf/APDDDDTjDDDDDDDf/LDDDDDDDDDDDDDDDDDDDD//AP7wwwwwwwwwwwwwwww84wwwwx//AN/8MMMMNPfP8Mf988MP88MMMMf88N//APrDDDDDDfLHLDX/AP6wwwwwwwxywwwwwxwwwww//wD/AP8A/wD/APvPPDH/AP73/wC9/wD/APzz7/8A/wD/AP7zz3zzzz73/wD/AP8A/wD/AP8A/wD+sJf/APP/AP8A/wDf/wD/AP8A/wD/AP8A/wD/AP8A/wDzzzwgghzywhz3/wD/AP8Azzz/AP8A/9oADAMBAAIAAwAAABD/APHLHPfPPPPX/wD+zzz3/wA8Mc88cc89f/8ArPb3/wAzz7/7z7jxxz2/6z1/yzzzzy33/wD988//APrPPX/vX/8A/wA9e8MNs88sMcMc89f/APPbf/8A7/8A/wD/ALz3/wDv/wD/APz/AP8A/wD/AP8A/vPPv/8A++3/AP8AvPL/AP8A+/8A/wD3/wB/d9//AP8A/wC9vdt9vf8A/wD6/wD/APb/AP8AvP8A/v8A8/3/AP8A/wD/AP8A/wD/AN9vPN//AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A5/63/wD/AP8A/wD/APr/AJ3/AP8A/wC+/wD/AP8A/wD/AP8A2+zz/wD/AP8Az3//AP8A/wD/AP8A/wD/AP8Av7//AP8A+/8A3/8A/wD/AP8A/wDuvf8A/wD/AP8A/wD/AP8A/wDv/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A++3w/wD/AP8A/wD/APnv3/8A/wDf9/8A/wD/AP8A/wD/AP8A/wD/APvf/wD/AP8A/wD/AP8A/wD/AP8A/wD/AL//AP8A/wD1/wC//wD/AP8A/P8A/fv/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A8c/O9+8f/wD/AP8Ad/t//wD/AP8A/wD/AM9//wD/AP8A/wD/AP8A15//APff/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A9v8A/f8A/wD/APv/AP8A/wD/AP8A9P8A/wD/AP8Azz//AP8A/wD/AP8A/wD/AP8A/wD/AP8A8/vf/wD/AP8A/wD7/P7/AP8A/wD/AP8A/wDv3vPHD/8A6y//ANt//wD/AH//AP8A/wC8/wD/AP8A/wD/AP8A/wD/AP8A1/8Af/8A/wD/AP8A/wD/AP8A/wD3/wD/APrP/wD+/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wC/vOP/AP8A69//AP8A/wD/AP8A/wD/AOv/ADv/AP8A/wDHf/8A/wD/AP8A/wD/AP8A/wCv+/8AP/8A/wD/AP8A/wD/AO/v/b//AP8A/wD/AP8A/wD/AP8A/wD/AP8At/8A/wD7/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wDP/wD/AP8A/wD/AP8A/wD/AP8A/wD/AO3/AP8A/wD5z9//AP8A/wD/AP8A/f8A/wB/Ptv/AP8A/wD/AP8A/wD/AP8A6/6//wD/AP8A/wD/AP8A/wD/AP8A/wD++/PP+t/v/f8A/wD/AP8A/wD/AP8Az3//AP8A/wD7L/8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/APPP/wD/AP8A/wD/APPN/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8AvN/9/wD/AP8A/wDv/wD/AP8A7z3/AP8A/wD/AP7/AP8A/Pf/AP8A/wD/AP8A/wD7fv3/AP8A/wDvX/8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/APn3/wD/AP8A/wD/AP8A/r/z/vf/AP8A/wD/AP8A/v8A/rT/AP79/wDvf/8A/wD/AP8A/wC/+9//AO9v/wDz3/8A+/8A/wD/AP8A/wD/AP8A/wDb/wD/AP8A/wD/AP8Avr//AP8A/wD/AP8A/wD/AP8A/wD/AP8Av9f/AP8A/wD/AP8A/wDOf/8AX/8A3/8AvPPf/e//AP8A/wD/APr/AF1//wD/AP8A/wD/APPfX/nLH/v/AP8Af99//wD/AP8A/wD/AP8A/wDvzvf/AP8A7/8A/wD/AP8A/wC//wD/AO//AP8A/wD/AP8A+/8A/wD/AP8A/wA//wDOf/8Ar/n/AP4891//AP8A/wD/AP8A/wD+153/AP8A/wD/AP8A/wD85/8At/8A3/v37/8A7/8A/wD/AP8A/wD/AP8A+/8A/wD/AP8A/wDv/wD/AP8A/wD+/wD/AP8A/wD7/wD/AP8A/wD/AP8A/wD/AL+/d/8A/wD/AP8Ar/7/AP8A/wD/AP8A/wD/AP8A/wD/AP8A++df/wD/AP8A/wD/AP8Av/8A/v8A/wB//wDTv/8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8Av/8A/wD/AP8A/wD/AP8A/wDT/wC9/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wC/ef8A/wD/AP8A/wD/AP8A/wD/AP8A/wDx/wB9v/8A/wD/AP8A/wC/+zz/AP8A/wD/AP8A/wD+/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A9/8A/wD/AP8Avf8Az3//AP8A/wD/AP8A/wD/AP7/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD1/wB+v/8A/wD/AP8A/wD24/8A/wD/AJ29/wDs+P8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8Az7PxNzz/AP8A/wD7/wD/AP8A/vfb/r//AP8A/wD/AP8A/wDvP/8A/wD/AP8A/wD/AP8A1/8A/wD/AP8A/f8A3vP73/8A/wD/AP8A/wD/AP8A7+/6/wDt/wDX/wD/AP8A/wD/AP8AvHL/AP8A/wD73/8A4xVfqV8qFl//AP8A/wD+/wD/AP8A/wB+/wD/AP8A/wD/AP67y/8A/wD/AP8A/Off/wD/AP8A/wD/AP8At/8A/wD/AP8Ar/8A/wD/AP8A/wDs8/ePN/8A/wC3/wD/AP8A+4//AP8A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AP8A/wD/AP8A/v8A/wD/AP8A/wD/AD3/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wDz/wD+/wD/AP8A/wDX/wD/AMv9+/f/AP8A73//AP8Af3n/AP8A/wD/AP8As+/vNuf/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A+59//wD/AP8A/wD/AP7f/wD+3/8As/8A/wD69/8A/wD/AP73/wD/AP8A/wD+vPPf/f8A/wD/AP8A++//AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD7/wD/AP8AnP3/AP8A/wD/AP8A/wD/AP8A/wD7j/8A/wD/AP8A/wD/ALX/AP8At/8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/APPPf/8AvP8A/wD/AP8A/wD/AP8A/wD/AP8A/wDvef8A/wD/AP8A/wD/APv/AP8A/wD/AP8A/wB//wD/AH7/AP8A/wD/AP8A/wD/AP8A/wD/AP8Arf8A/wD/AP8A/wD/APXv/f8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP3X/X//AP8A/wD73/8A/wD/AH//AP8A/wD/AG//AN//AP8A/wD/AP8A759//wD/AP8A/wD/AP8A/wD/AO++/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8AvX//AA//AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/PfvPf8A/wD/AP8A/wC//wD/AH//AP8A/wD/AP8A/b7/AP8A/wD/AP8A/wD/AL3/AP8A/wD/AP8A/wD/AP8A/wD/AL7/AP8A/wD/AP8A/wD/AP8A/wD/AD//AP8A/wD/AP29+39//wD/AP8A/wD/AH//AP8A/wD/AP8A9/8A/wD/AP8A/wD/AP8A/wD/AO9//wD/AG/9/wD/AL3/AO9//wD/AP8A/wDctP8A/wD/AOs//wDvfr//AP8A/wD/AP8A/wD73/8A/wD/AP8A/wD8v/8Az/8A/wD/APv7/r//AP8A/wDzfvX/AP8A/wD3/wD/AP8A/wD/AP8A/n7/AP8ANv8A/wD/AP8A3/H++/f/AK5//wD/AP8A+2//AP8A/wD/APuv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');
INSERT INTO `rider` (`id`, `fullName`, `phone`, `vehicle`, `availability`, `createdAt`, `updatedAt`, `branchId`, `profileImageUrl`) VALUES
(2, 'Hassan Khan', '+923009998877', 'Bike - GLT-202', 'AVAILABLE', '2026-04-10 21:13:27.947', '2026-04-11 12:35:14.362', NULL, NULL),
(3, 'Bilal Ahmed', '+923456667788', 'Scooter - GLT-303', 'AVAILABLE', '2026-04-10 21:13:27.955', '2026-04-11 10:40:34.830', NULL, NULL),
(4, 'Test By Atiq', '03482925780', 'GLT-007', 'AVAILABLE', '2026-04-10 21:17:53.857', '2026-04-11 05:08:11.559', NULL, NULL),
(5, 'Test User 2', '123456789', 'BLN 2110', 'AVAILABLE', '2026-04-11 05:07:10.906', '2026-04-11 05:07:10.906', NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `rolepermissionconfig`
--

CREATE TABLE `rolepermissionconfig` (
  `id` int(11) NOT NULL,
  `role` enum('SUPER_ADMIN','BRANCH_MANAGER','KITCHEN_STAFF','DELIVERY_RIDER') NOT NULL,
  `permissions` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`permissions`)),
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `rolepermissionconfig`
--

INSERT INTO `rolepermissionconfig` (`id`, `role`, `permissions`, `createdAt`, `updatedAt`) VALUES
(1, 'BRANCH_MANAGER', '[\"MANAGE_BRANCH_PROFILE\",\"MANAGE_STAFF\",\"VIEW_BRANCH_ANALYTICS\",\"MANAGE_BRANCH_INVENTORY\",\"UPDATE_ORDER_STATUS\",\"VIEW_RIDER_PERFORMANCE\",\"MANAGE_MENU\",\"VIEW_ACTIVITY_LOGS\"]', '2026-04-11 06:43:53.923', '2026-04-11 06:43:59.231');

-- --------------------------------------------------------

--
-- Table structure for table `staffactivitylog`
--

CREATE TABLE `staffactivitylog` (
  `id` int(11) NOT NULL,
  `branchId` int(11) DEFAULT NULL,
  `staffMemberId` int(11) DEFAULT NULL,
  `action` varchar(191) NOT NULL,
  `entityType` varchar(191) DEFAULT NULL,
  `entityId` varchar(191) DEFAULT NULL,
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`metadata`)),
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `staffactivitylog`
--

INSERT INTO `staffactivitylog` (`id`, `branchId`, `staffMemberId`, `action`, `entityType`, `entityId`, `metadata`, `createdAt`) VALUES
(1, 1, NULL, 'BRANCH_CREATED', 'Branch', '1', '{\"code\":\"001\",\"name\":\"Khaplu Main\"}', '2026-04-11 06:43:16.685'),
(2, 1, NULL, 'STAFF_MEMBER_CREATED', 'StaffMember', '1', '{\"role\":\"BRANCH_MANAGER\",\"fullName\":\"Muhammad Atiq\"}', '2026-04-11 06:43:32.791'),
(3, NULL, NULL, 'ROLE_PERMISSIONS_UPDATED', 'RolePermissionConfig', 'BRANCH_MANAGER', '{\"role\":\"BRANCH_MANAGER\",\"permissions\":[\"MANAGE_BRANCH_PROFILE\",\"MANAGE_STAFF\",\"VIEW_BRANCH_ANALYTICS\",\"MANAGE_BRANCH_INVENTORY\",\"UPDATE_ORDER_STATUS\",\"VIEW_RIDER_PERFORMANCE\",\"MANAGE_MENU\",\"VIEW_ACTIVITY_LOGS\",\"MANAGE_PROMOTIONS\"]}', '2026-04-11 06:43:53.957'),
(4, NULL, NULL, 'ROLE_PERMISSIONS_UPDATED', 'RolePermissionConfig', 'BRANCH_MANAGER', '{\"role\":\"BRANCH_MANAGER\",\"permissions\":[\"MANAGE_BRANCH_PROFILE\",\"MANAGE_STAFF\",\"VIEW_BRANCH_ANALYTICS\",\"MANAGE_BRANCH_INVENTORY\",\"UPDATE_ORDER_STATUS\",\"VIEW_RIDER_PERFORMANCE\",\"MANAGE_MENU\",\"VIEW_ACTIVITY_LOGS\"]}', '2026-04-11 06:43:59.257'),
(5, 1, NULL, 'BRANCH_STATUS_UPDATED', 'Branch', '1', '{\"from\":\"ACTIVE\",\"to\":\"TEMPORARILY_CLOSED\"}', '2026-04-11 06:51:06.766'),
(6, 1, NULL, 'BRANCH_STATUS_UPDATED', 'Branch', '1', '{\"from\":\"TEMPORARILY_CLOSED\",\"to\":\"ACTIVE\"}', '2026-04-11 06:51:11.067'),
(7, NULL, NULL, 'ORDER_STATUS_UPDATED', 'Order', '5', '{\"from\":\"PENDING\",\"to\":\"CONFIRMED\"}', '2026-04-11 08:46:05.439'),
(8, NULL, NULL, 'ORDER_STATUS_UPDATED', 'Order', '5', '{\"from\":\"CONFIRMED\",\"to\":\"PREPARING\"}', '2026-04-11 08:46:09.445'),
(9, NULL, NULL, 'ORDER_STATUS_UPDATED', 'Order', '5', '{\"from\":\"PREPARING\",\"to\":\"OUT_FOR_DELIVERY\"}', '2026-04-11 08:46:11.282'),
(10, NULL, NULL, 'ORDER_STATUS_UPDATED', 'Order', '5', '{\"from\":\"OUT_FOR_DELIVERY\",\"to\":\"COMPLETED\"}', '2026-04-11 08:46:13.710'),
(11, 2, NULL, 'BRANCH_CREATED', 'Branch', '2', '{\"code\":\"KHP-001\",\"name\":\"Khaplu Main 1\"}', '2026-04-11 09:12:27.326'),
(12, 2, NULL, 'STAFF_MEMBER_CREATED', 'StaffMember', '2', '{\"role\":\"BRANCH_MANAGER\",\"fullName\":\"Test KHP1\"}', '2026-04-11 09:12:49.349'),
(13, NULL, NULL, 'ORDER_STATUS_BULK_UPDATED', 'Order', '1,2,3,4,5', '{\"orderIds\":[1,2,3,4,5],\"status\":\"OUT_FOR_DELIVERY\"}', '2026-04-11 10:40:21.752'),
(14, NULL, NULL, 'ORDER_STATUS_BULK_UPDATED', 'Order', '1,2,3,4,5', '{\"orderIds\":[1,2,3,4,5],\"status\":\"COMPLETED\"}', '2026-04-11 10:40:34.866'),
(15, NULL, NULL, 'MENU_DEAL_CREATED', 'Deal', '1', '{\"name\":\"Snow Deal\",\"publicId\":\"deal-snowdeal1-411695\"}', '2026-04-11 11:20:11.949'),
(16, NULL, NULL, 'MENU_CATEGORY_CREATED', 'Category', '7', '{\"name\":\"Balti\",\"slug\":\"balti\"}', '2026-04-11 11:23:39.209'),
(17, NULL, NULL, 'MENU_PRODUCT_CREATED', 'Product', '24', '{\"name\":\"Test Debug Product\",\"categoryId\":1}', '2026-04-11 12:19:05.558'),
(18, NULL, NULL, 'MENU_PRODUCT_CREATED', 'Product', '25', '{\"name\":\"Test\",\"categoryId\":1}', '2026-04-11 12:23:02.511'),
(19, NULL, NULL, 'MENU_PRODUCT_CREATED', 'Product', '27', '{\"name\":\"Test Atiq\",\"categoryId\":7}', '2026-04-11 12:28:14.609'),
(20, NULL, NULL, 'ORDER_STATUS_UPDATED', 'Order', '6', '{\"from\":\"PENDING\",\"to\":\"PREPARING\"}', '2026-04-11 12:33:49.666'),
(21, NULL, NULL, 'ORDER_STATUS_UPDATED', 'Order', '6', '{\"from\":\"PREPARING\",\"to\":\"OUT_FOR_DELIVERY\"}', '2026-04-11 12:34:35.411'),
(22, NULL, NULL, 'ORDER_STATUS_UPDATED', 'Order', '6', '{\"from\":\"OUT_FOR_DELIVERY\",\"to\":\"COMPLETED\"}', '2026-04-11 12:35:14.388'),
(23, NULL, NULL, 'ORDER_STATUS_BULK_UPDATED', 'Order', '7,8,9,10,11,12,13', '{\"orderIds\":[7,8,9,10,11,12,13],\"status\":\"PREPARING\"}', '2026-04-11 14:02:12.063'),
(24, NULL, NULL, 'ORDER_STATUS_UPDATED', 'Order', '14', '{\"from\":\"PENDING\",\"to\":\"COMPLETED\"}', '2026-04-11 14:10:35.902'),
(25, NULL, NULL, 'ORDER_STATUS_BULK_UPDATED', 'Order', '7,8,9,10,11,12,13', '{\"orderIds\":[7,8,9,10,11,12,13],\"status\":\"COMPLETED\"}', '2026-04-11 14:11:02.826'),
(26, 2, NULL, 'BRANCH_STATUS_UPDATED', 'Branch', '2', '{\"from\":\"ACTIVE\",\"to\":\"TEMPORARILY_CLOSED\"}', '2026-04-11 14:51:18.489'),
(27, 1, NULL, 'BRANCH_STATUS_UPDATED', 'Branch', '1', '{\"from\":\"ACTIVE\",\"to\":\"TEMPORARILY_CLOSED\"}', '2026-04-11 14:51:20.133'),
(28, NULL, NULL, 'ORDER_STATUS_UPDATED', 'Order', '17', '{\"from\":\"PENDING\",\"to\":\"CONFIRMED\"}', '2026-04-11 15:54:42.215'),
(29, NULL, NULL, 'ORDER_STATUS_UPDATED', 'Order', '16', '{\"from\":\"PENDING\",\"to\":\"CONFIRMED\"}', '2026-04-11 15:54:43.330'),
(30, NULL, NULL, 'ORDER_STATUS_UPDATED', 'Order', '18', '{\"from\":\"PENDING\",\"to\":\"CONFIRMED\"}', '2026-04-16 20:35:25.627'),
(31, NULL, NULL, 'ORDER_STATUS_UPDATED', 'Order', '18', '{\"from\":\"CONFIRMED\",\"to\":\"PREPARING\"}', '2026-04-16 20:35:43.625'),
(32, NULL, NULL, 'ORDER_STATUS_UPDATED', 'Order', '18', '{\"from\":\"PREPARING\",\"to\":\"COMPLETED\"}', '2026-04-16 20:35:45.624'),
(33, NULL, NULL, 'ORDER_STATUS_UPDATED', 'Order', '19', '{\"from\":\"PENDING\",\"to\":\"CONFIRMED\"}', '2026-04-16 20:39:25.576'),
(34, NULL, NULL, 'ORDER_STATUS_UPDATED', 'Order', '19', '{\"from\":\"CONFIRMED\",\"to\":\"PREPARING\"}', '2026-04-16 20:39:27.010'),
(35, NULL, NULL, 'ORDER_STATUS_UPDATED', 'Order', '19', '{\"from\":\"PREPARING\",\"to\":\"COMPLETED\"}', '2026-04-16 20:39:28.663'),
(36, NULL, NULL, 'ORDER_STATUS_UPDATED', 'Order', '20', '{\"from\":\"PENDING\",\"to\":\"CONFIRMED\"}', '2026-04-16 20:56:22.575'),
(37, NULL, NULL, 'ORDER_STATUS_UPDATED', 'Order', '17', '{\"from\":\"CONFIRMED\",\"to\":\"PREPARING\"}', '2026-04-28 15:17:06.628'),
(38, NULL, NULL, 'ORDER_STATUS_UPDATED', 'Order', '20', '{\"from\":\"CONFIRMED\",\"to\":\"PREPARING\"}', '2026-04-28 15:17:08.174'),
(39, NULL, NULL, 'ORDER_STATUS_UPDATED', 'Order', '16', '{\"from\":\"CONFIRMED\",\"to\":\"PREPARING\"}', '2026-04-28 15:17:10.021'),
(40, NULL, NULL, 'KDS_BULK_ADVANCED', 'Order', '16,17,20', '{\"orderIds\":[16,17,20]}', '2026-04-28 15:17:18.735');

-- --------------------------------------------------------

--
-- Table structure for table `staffmember`
--

CREATE TABLE `staffmember` (
  `id` int(11) NOT NULL,
  `userId` int(11) DEFAULT NULL,
  `branchId` int(11) DEFAULT NULL,
  `fullName` varchar(191) NOT NULL,
  `email` varchar(191) DEFAULT NULL,
  `phone` varchar(32) DEFAULT NULL,
  `role` enum('SUPER_ADMIN','BRANCH_MANAGER','KITCHEN_STAFF','DELIVERY_RIDER') NOT NULL,
  `permissions` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`permissions`)),
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `profileImageUrl` longtext DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `staffmember`
--

INSERT INTO `staffmember` (`id`, `userId`, `branchId`, `fullName`, `email`, `phone`, `role`, `permissions`, `isActive`, `createdAt`, `updatedAt`, `profileImageUrl`) VALUES
(1, NULL, 1, 'Muhammad Atiq', 'ateeqbaltee@gmail.com', '03482925780', 'BRANCH_MANAGER', '[\"MANAGE_BRANCH_PROFILE\",\"MANAGE_STAFF\",\"VIEW_BRANCH_ANALYTICS\",\"MANAGE_BRANCH_INVENTORY\",\"UPDATE_ORDER_STATUS\",\"VIEW_RIDER_PERFORMANCE\",\"MANAGE_MENU\",\"VIEW_ACTIVITY_LOGS\"]', 1, '2026-04-11 06:43:32.770', '2026-04-11 06:43:59.245', NULL),
(2, NULL, 2, 'Test KHP1', 'contact@ecoxraft.com', NULL, 'BRANCH_MANAGER', '[\"MANAGE_BRANCH_PROFILE\",\"MANAGE_STAFF\",\"VIEW_BRANCH_ANALYTICS\",\"MANAGE_BRANCH_INVENTORY\",\"UPDATE_ORDER_STATUS\",\"VIEW_RIDER_PERFORMANCE\",\"MANAGE_MENU\",\"VIEW_ACTIVITY_LOGS\"]', 1, '2026-04-11 09:12:49.326', '2026-04-11 09:12:49.326', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `user`
--

CREATE TABLE `user` (
  `id` int(11) NOT NULL,
  `fullName` varchar(191) NOT NULL,
  `email` varchar(191) NOT NULL,
  `phone` varchar(32) DEFAULT NULL,
  `passwordHash` varchar(191) NOT NULL,
  `role` enum('ADMIN','CUSTOMER') NOT NULL DEFAULT 'CUSTOMER',
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `profile_picture_url` longtext DEFAULT NULL,
  `defaultAddressId` int(11) DEFAULT NULL,
  `snowPoints` int(11) NOT NULL DEFAULT 0,
  `totalSpent` decimal(10,2) NOT NULL DEFAULT 0.00
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `user`
--

INSERT INTO `user` (`id`, `fullName`, `email`, `phone`, `passwordHash`, `role`, `createdAt`, `updatedAt`, `profile_picture_url`, `defaultAddressId`, `snowPoints`, `totalSpent`) VALUES
(1, 'Admin', 'admin@snowbites.local', '+923555556080', '$2a$10$TG6qSANK07s97FY1oGBoIegyOPNv3nXnlbiFBH.0fv7ad.FIjrYcy', 'ADMIN', '2026-04-10 20:16:26.596', '2026-04-11 08:35:17.537', '/uploads/avatars/user-1-1775896338348.png', NULL, 0, 0.00),
(2, 'Muhammad Atiq', 'ateeqbaltee@gmail.com', '03482925780', '$2a$10$QGUlQR61yml4vGFXDzOIN.dzwAqBySTbJOyqKfNhNGerMp1R.YVuC', 'CUSTOMER', '2026-04-10 20:35:48.362', '2026-04-10 20:35:48.362', NULL, NULL, 0, 0.00),
(3, 'Muhammad Atiq', 'customer@cs.com', '03482925780', '$2a$10$OZ0zfGRO.n5qs9k7BACXwOlL9slLyU4WF9KWniUYCEXinztGDHYC6', 'CUSTOMER', '2026-04-11 17:56:02.392', '2026-04-11 17:56:02.392', NULL, NULL, 0, 0.00),
(4, 'Test Customer', 'testcustomer@test.com', NULL, '$2a$10$DV5XaahogwEOApk2i1uM2u2q/upSDOwQIfp72RA22aFWoEYFdjKxG', 'CUSTOMER', '2026-04-11 18:07:03.169', '2026-04-11 18:07:03.169', NULL, NULL, 0, 0.00),
(5, 'Fresh Customer', 'fresh@test.com', '03001234567', '$2a$10$fAzRv8OxSh9E.gVttmuvme/nWIgNFdlpII7rtVaOn3q7vvi31SuRC', 'CUSTOMER', '2026-04-11 18:10:56.972', '2026-04-11 18:10:56.972', NULL, NULL, 0, 0.00);

-- --------------------------------------------------------

--
-- Table structure for table `vendor`
--

CREATE TABLE `vendor` (
  `id` int(11) NOT NULL,
  `name` varchar(191) NOT NULL,
  `contactName` varchar(191) DEFAULT NULL,
  `phone` varchar(32) DEFAULT NULL,
  `email` varchar(191) DEFAULT NULL,
  `notes` varchar(191) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `vendor`
--

INSERT INTO `vendor` (`id`, `name`, `contactName`, `phone`, `email`, `notes`, `createdAt`, `updatedAt`) VALUES
(1, 'Atiq Test', 'Atiq', '10933977', 'ateeqbaltee@gmail.com', 'Test', '2026-04-10 22:08:24.453', '2026-04-10 22:08:24.453');

-- --------------------------------------------------------

--
-- Table structure for table `vendorsupply`
--

CREATE TABLE `vendorsupply` (
  `id` int(11) NOT NULL,
  `vendorId` int(11) NOT NULL,
  `ingredientId` int(11) NOT NULL,
  `itemName` varchar(191) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `vendorsupply`
--

INSERT INTO `vendorsupply` (`id`, `vendorId`, `ingredientId`, `itemName`, `createdAt`, `updatedAt`) VALUES
(1, 1, 1, 'Atiq-checken', '2026-04-11 10:47:25.796', '2026-04-11 10:47:25.796');

-- --------------------------------------------------------

--
-- Table structure for table `_prisma_migrations`
--

CREATE TABLE `_prisma_migrations` (
  `id` varchar(36) NOT NULL,
  `checksum` varchar(64) NOT NULL,
  `finished_at` datetime(3) DEFAULT NULL,
  `migration_name` varchar(255) NOT NULL,
  `logs` text DEFAULT NULL,
  `rolled_back_at` datetime(3) DEFAULT NULL,
  `started_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `applied_steps_count` int(10) UNSIGNED NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `_prisma_migrations`
--

INSERT INTO `_prisma_migrations` (`id`, `checksum`, `finished_at`, `migration_name`, `logs`, `rolled_back_at`, `started_at`, `applied_steps_count`) VALUES
('0920f021-c890-4653-90c8-123d22044e89', '6217cd77e14375db4969fe2e15c211f4b89f43aa52c9a514c414c46c1bb93a34', '2026-04-10 21:28:52.935', '20260410212852_menu_catalog_control', NULL, NULL, '2026-04-10 21:28:52.676', 1),
('0b688724-7e05-4726-9255-250885d62eee', '5a9e5b58d45c6cca3648ebdc77f82d7f9ef586022c7fa907cdb278d6747351cd', '2026-04-11 08:23:18.286', '20260411113000_user_profile_security', NULL, NULL, '2026-04-11 08:23:18.266', 1),
('18818181-c680-4853-be0c-e2bd218d78b5', 'bd0c5b0b87e4caa43664bbcc792223539dd77d74bd295a4fe4ec9fc5fd2312c0', '2026-04-10 23:19:36.602', '20260410231936_app_settings', NULL, NULL, '2026-04-10 23:19:36.514', 1),
('2e072989-a9ec-4cd1-bcbb-ef38693a1250', 'fae9129d44286c376b069e894ff04aeaf7a36cba75709e1e5190de1438d21c59', '2026-04-10 21:13:11.154', '20260410211310_', NULL, NULL, '2026-04-10 21:13:10.952', 1),
('395c7884-3cf2-4b68-af77-84b8ce289a2a', 'aeab5a99b58a0c2cbbcabeaea31bef7864a321fc526a5af289a29b836c8820d6', '2026-04-10 23:19:27.880', '20260411093000_app_settings', NULL, NULL, '2026-04-10 23:19:27.846', 1),
('495e8478-f91c-497a-971e-d0d0dbda8a2a', 'd99e6b83b44378033ed0fb9d768310639069474fb22b3dd07bbf2ab4914f92de', '2026-04-10 23:10:57.769', '20260411091500_branch_staff_management', NULL, NULL, '2026-04-10 23:10:56.815', 1),
('627bd5ce-4427-4e1e-81aa-61caf9b6d27f', 'a7731490e3ded3490af912935bcd4b5516eb0a940af33d467081441fa7d7ed22', '2026-04-10 21:50:39.708', '20260410214901_inventory_supply_chain', NULL, NULL, '2026-04-10 21:50:38.626', 1),
('8f2c28a4-e49d-4f47-9267-38208e272376', 'a85dfcc176a62dc4265d7f5ea3d1c2099895ba9ee4fe690446e5ca3267e783a7', '2026-04-10 22:16:12.039', '20260410221611_marketing_customer_engagement', NULL, NULL, '2026-04-10 22:16:11.689', 1),
('c1fd19e6-2199-4673-86cd-86b37d44e65b', '4e853415a1feb1606cf48c07d0423266e5dffd16feb33392b752511fd7b94fda', '2026-04-10 20:08:08.927', '20260410200808_init', NULL, NULL, '2026-04-10 20:08:08.606', 1);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `address`
--
ALTER TABLE `address`
  ADD PRIMARY KEY (`id`),
  ADD KEY `Address_userId_idx` (`userId`);

--
-- Indexes for table `announcementbar`
--
ALTER TABLE `announcementbar`
  ADD PRIMARY KEY (`id`),
  ADD KEY `AnnouncementBar_isActive_createdAt_idx` (`isActive`,`createdAt`);

--
-- Indexes for table `appsettings`
--
ALTER TABLE `appsettings`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `branch`
--
ALTER TABLE `branch`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `Branch_code_key` (`code`),
  ADD KEY `Branch_status_idx` (`status`),
  ADD KEY `Branch_managerStaffId_idx` (`managerStaffId`);

--
-- Indexes for table `branchingredientstock`
--
ALTER TABLE `branchingredientstock`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `BranchIngredientStock_branchId_ingredientId_key` (`branchId`,`ingredientId`),
  ADD KEY `BranchIngredientStock_branchId_idx` (`branchId`),
  ADD KEY `BranchIngredientStock_ingredientId_idx` (`ingredientId`);

--
-- Indexes for table `category`
--
ALTER TABLE `category`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `Category_slug_key` (`slug`);

--
-- Indexes for table `coupon`
--
ALTER TABLE `coupon`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `Coupon_code_key` (`code`),
  ADD KEY `Coupon_code_idx` (`code`),
  ADD KEY `Coupon_isActive_expiresAt_idx` (`isActive`,`expiresAt`);

--
-- Indexes for table `deal`
--
ALTER TABLE `deal`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `Deal_publicId_key` (`publicId`),
  ADD UNIQUE KEY `Deal_slug_key` (`slug`),
  ADD KEY `Deal_isActive_idx` (`isActive`),
  ADD KEY `Deal_expiresAt_idx` (`expiresAt`);

--
-- Indexes for table `dealitem`
--
ALTER TABLE `dealitem`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `DealItem_dealId_productId_key` (`dealId`,`productId`),
  ADD KEY `DealItem_dealId_idx` (`dealId`),
  ADD KEY `DealItem_productId_idx` (`productId`);

--
-- Indexes for table `flashsale`
--
ALTER TABLE `flashsale`
  ADD PRIMARY KEY (`id`),
  ADD KEY `FlashSale_isActive_startsAt_endsAt_idx` (`isActive`,`startsAt`,`endsAt`);

--
-- Indexes for table `herobanner`
--
ALTER TABLE `herobanner`
  ADD PRIMARY KEY (`id`),
  ADD KEY `HeroBanner_isActive_sortOrder_idx` (`isActive`,`sortOrder`);

--
-- Indexes for table `ingredient`
--
ALTER TABLE `ingredient`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `Ingredient_slug_key` (`slug`),
  ADD KEY `Ingredient_slug_idx` (`slug`);

--
-- Indexes for table `inventoryrestocklog`
--
ALTER TABLE `inventoryrestocklog`
  ADD PRIMARY KEY (`id`),
  ADD KEY `InventoryRestockLog_ingredientId_createdAt_idx` (`ingredientId`,`createdAt`),
  ADD KEY `InventoryRestockLog_vendorId_idx` (`vendorId`);

--
-- Indexes for table `inventorywastelog`
--
ALTER TABLE `inventorywastelog`
  ADD PRIMARY KEY (`id`),
  ADD KEY `InventoryWasteLog_ingredientId_createdAt_idx` (`ingredientId`,`createdAt`);

--
-- Indexes for table `marketingnotification`
--
ALTER TABLE `marketingnotification`
  ADD PRIMARY KEY (`id`),
  ADD KEY `MarketingNotification_isActive_expiresAt_idx` (`isActive`,`expiresAt`);

--
-- Indexes for table `order`
--
ALTER TABLE `order`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `Order_orderNumber_key` (`orderNumber`),
  ADD KEY `Order_customerId_idx` (`customerId`),
  ADD KEY `Order_handledById_idx` (`handledById`),
  ADD KEY `Order_status_idx` (`status`),
  ADD KEY `Order_assignedRiderId_idx` (`assignedRiderId`),
  ADD KEY `Order_couponId_idx` (`couponId`);

--
-- Indexes for table `orderitem`
--
ALTER TABLE `orderitem`
  ADD PRIMARY KEY (`id`),
  ADD KEY `OrderItem_orderId_idx` (`orderId`),
  ADD KEY `OrderItem_productId_idx` (`productId`);

--
-- Indexes for table `orderstatushistory`
--
ALTER TABLE `orderstatushistory`
  ADD PRIMARY KEY (`id`),
  ADD KEY `OrderStatusHistory_orderId_changedAt_idx` (`orderId`,`changedAt`),
  ADD KEY `OrderStatusHistory_toStatus_idx` (`toStatus`),
  ADD KEY `OrderStatusHistory_changedById_fkey` (`changedById`);

--
-- Indexes for table `product`
--
ALTER TABLE `product`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `Product_publicId_key` (`publicId`),
  ADD UNIQUE KEY `Product_slug_key` (`slug`),
  ADD KEY `Product_categoryId_idx` (`categoryId`);

--
-- Indexes for table `productmodifier`
--
ALTER TABLE `productmodifier`
  ADD PRIMARY KEY (`id`),
  ADD KEY `ProductModifier_productId_idx` (`productId`);

--
-- Indexes for table `productrecipeitem`
--
ALTER TABLE `productrecipeitem`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `ProductRecipeItem_productId_ingredientId_key` (`productId`,`ingredientId`),
  ADD KEY `ProductRecipeItem_productId_idx` (`productId`),
  ADD KEY `ProductRecipeItem_ingredientId_idx` (`ingredientId`);

--
-- Indexes for table `review`
--
ALTER TABLE `review`
  ADD PRIMARY KEY (`id`),
  ADD KEY `Review_userId_idx` (`userId`),
  ADD KEY `Review_status_createdAt_idx` (`status`,`createdAt`);

--
-- Indexes for table `rider`
--
ALTER TABLE `rider`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `Rider_phone_key` (`phone`),
  ADD KEY `Rider_availability_idx` (`availability`),
  ADD KEY `Rider_branchId_idx` (`branchId`);

--
-- Indexes for table `rolepermissionconfig`
--
ALTER TABLE `rolepermissionconfig`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `RolePermissionConfig_role_key` (`role`);

--
-- Indexes for table `staffactivitylog`
--
ALTER TABLE `staffactivitylog`
  ADD PRIMARY KEY (`id`),
  ADD KEY `StaffActivityLog_branchId_createdAt_idx` (`branchId`,`createdAt`),
  ADD KEY `StaffActivityLog_staffMemberId_createdAt_idx` (`staffMemberId`,`createdAt`);

--
-- Indexes for table `staffmember`
--
ALTER TABLE `staffmember`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `StaffMember_userId_key` (`userId`),
  ADD UNIQUE KEY `StaffMember_email_key` (`email`),
  ADD KEY `StaffMember_branchId_idx` (`branchId`),
  ADD KEY `StaffMember_role_idx` (`role`),
  ADD KEY `StaffMember_isActive_idx` (`isActive`);

--
-- Indexes for table `user`
--
ALTER TABLE `user`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `User_email_key` (`email`);

--
-- Indexes for table `vendor`
--
ALTER TABLE `vendor`
  ADD PRIMARY KEY (`id`),
  ADD KEY `Vendor_name_idx` (`name`);

--
-- Indexes for table `vendorsupply`
--
ALTER TABLE `vendorsupply`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `VendorSupply_vendorId_ingredientId_key` (`vendorId`,`ingredientId`),
  ADD KEY `VendorSupply_vendorId_idx` (`vendorId`),
  ADD KEY `VendorSupply_ingredientId_idx` (`ingredientId`);

--
-- Indexes for table `_prisma_migrations`
--
ALTER TABLE `_prisma_migrations`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `address`
--
ALTER TABLE `address`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `announcementbar`
--
ALTER TABLE `announcementbar`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `appsettings`
--
ALTER TABLE `appsettings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `branch`
--
ALTER TABLE `branch`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `branchingredientstock`
--
ALTER TABLE `branchingredientstock`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `category`
--
ALTER TABLE `category`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `coupon`
--
ALTER TABLE `coupon`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `deal`
--
ALTER TABLE `deal`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `dealitem`
--
ALTER TABLE `dealitem`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `flashsale`
--
ALTER TABLE `flashsale`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `herobanner`
--
ALTER TABLE `herobanner`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `ingredient`
--
ALTER TABLE `ingredient`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `inventoryrestocklog`
--
ALTER TABLE `inventoryrestocklog`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `inventorywastelog`
--
ALTER TABLE `inventorywastelog`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `marketingnotification`
--
ALTER TABLE `marketingnotification`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `order`
--
ALTER TABLE `order`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT for table `orderitem`
--
ALTER TABLE `orderitem`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=38;

--
-- AUTO_INCREMENT for table `orderstatushistory`
--
ALTER TABLE `orderstatushistory`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=78;

--
-- AUTO_INCREMENT for table `product`
--
ALTER TABLE `product`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=28;

--
-- AUTO_INCREMENT for table `productmodifier`
--
ALTER TABLE `productmodifier`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `productrecipeitem`
--
ALTER TABLE `productrecipeitem`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `review`
--
ALTER TABLE `review`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `rider`
--
ALTER TABLE `rider`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `rolepermissionconfig`
--
ALTER TABLE `rolepermissionconfig`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `staffactivitylog`
--
ALTER TABLE `staffactivitylog`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=41;

--
-- AUTO_INCREMENT for table `staffmember`
--
ALTER TABLE `staffmember`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `user`
--
ALTER TABLE `user`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `vendor`
--
ALTER TABLE `vendor`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `vendorsupply`
--
ALTER TABLE `vendorsupply`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `address`
--
ALTER TABLE `address`
  ADD CONSTRAINT `Address_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `branch`
--
ALTER TABLE `branch`
  ADD CONSTRAINT `Branch_managerStaffId_fkey` FOREIGN KEY (`managerStaffId`) REFERENCES `staffmember` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `branchingredientstock`
--
ALTER TABLE `branchingredientstock`
  ADD CONSTRAINT `BranchIngredientStock_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `branch` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `BranchIngredientStock_ingredientId_fkey` FOREIGN KEY (`ingredientId`) REFERENCES `ingredient` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `dealitem`
--
ALTER TABLE `dealitem`
  ADD CONSTRAINT `DealItem_dealId_fkey` FOREIGN KEY (`dealId`) REFERENCES `deal` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `DealItem_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `product` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `inventoryrestocklog`
--
ALTER TABLE `inventoryrestocklog`
  ADD CONSTRAINT `InventoryRestockLog_ingredientId_fkey` FOREIGN KEY (`ingredientId`) REFERENCES `ingredient` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `InventoryRestockLog_vendorId_fkey` FOREIGN KEY (`vendorId`) REFERENCES `vendor` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `inventorywastelog`
--
ALTER TABLE `inventorywastelog`
  ADD CONSTRAINT `InventoryWasteLog_ingredientId_fkey` FOREIGN KEY (`ingredientId`) REFERENCES `ingredient` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `order`
--
ALTER TABLE `order`
  ADD CONSTRAINT `Order_assignedRiderId_fkey` FOREIGN KEY (`assignedRiderId`) REFERENCES `rider` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `Order_couponId_fkey` FOREIGN KEY (`couponId`) REFERENCES `coupon` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `Order_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `user` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `Order_handledById_fkey` FOREIGN KEY (`handledById`) REFERENCES `user` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `orderitem`
--
ALTER TABLE `orderitem`
  ADD CONSTRAINT `OrderItem_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `order` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `OrderItem_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `product` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `orderstatushistory`
--
ALTER TABLE `orderstatushistory`
  ADD CONSTRAINT `OrderStatusHistory_changedById_fkey` FOREIGN KEY (`changedById`) REFERENCES `user` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `OrderStatusHistory_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `order` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `product`
--
ALTER TABLE `product`
  ADD CONSTRAINT `Product_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `category` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `productmodifier`
--
ALTER TABLE `productmodifier`
  ADD CONSTRAINT `ProductModifier_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `product` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `productrecipeitem`
--
ALTER TABLE `productrecipeitem`
  ADD CONSTRAINT `ProductRecipeItem_ingredientId_fkey` FOREIGN KEY (`ingredientId`) REFERENCES `ingredient` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `ProductRecipeItem_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `product` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `review`
--
ALTER TABLE `review`
  ADD CONSTRAINT `Review_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `rider`
--
ALTER TABLE `rider`
  ADD CONSTRAINT `Rider_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `branch` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `staffactivitylog`
--
ALTER TABLE `staffactivitylog`
  ADD CONSTRAINT `StaffActivityLog_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `branch` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `StaffActivityLog_staffMemberId_fkey` FOREIGN KEY (`staffMemberId`) REFERENCES `staffmember` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `staffmember`
--
ALTER TABLE `staffmember`
  ADD CONSTRAINT `StaffMember_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `branch` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `StaffMember_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `vendorsupply`
--
ALTER TABLE `vendorsupply`
  ADD CONSTRAINT `VendorSupply_ingredientId_fkey` FOREIGN KEY (`ingredientId`) REFERENCES `ingredient` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `VendorSupply_vendorId_fkey` FOREIGN KEY (`vendorId`) REFERENCES `vendor` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
