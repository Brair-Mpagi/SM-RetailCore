-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: Jun 12, 2026 at 12:08 PM
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
-- Database: `rstms_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `alerts`
--

CREATE TABLE `alerts` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `type` enum('low_stock','expiry','fraud','cash_discrepancy','high_velocity','system') NOT NULL,
  `product_id` bigint(20) UNSIGNED DEFAULT NULL,
  `message` text NOT NULL,
  `severity` enum('info','warning','critical') DEFAULT 'warning',
  `is_read` tinyint(1) DEFAULT 0,
  `auto_cleared_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `alerts`
--

INSERT INTO `alerts` (`id`, `type`, `product_id`, `message`, `severity`, `is_read`, `auto_cleared_at`, `created_at`) VALUES
(1, 'low_stock', 3, 'Amara — only -119 units remaining (reorder point: 50)', 'warning', 1, NULL, '2026-05-02 19:54:57'),
(2, 'low_stock', 8, 'nivana small — only 4 units remaining (reorder point: 4)', 'warning', 0, NULL, '2026-05-16 15:46:41'),
(3, 'low_stock', 15, 'nescafe — only 3 units remaining (reorder point: 33)', 'warning', 0, NULL, '2026-05-18 12:12:45'),
(4, 'low_stock', 14, 'guiness — only 4 units remaining (reorder point: 5)', 'warning', 1, NULL, '2026-05-22 10:20:02'),
(5, 'low_stock', 16, 'charger — only 9 units remaining (reorder point: 9)', 'warning', 1, NULL, '2026-06-11 08:55:13');

-- --------------------------------------------------------

--
-- Table structure for table `audit_logs`
--

CREATE TABLE `audit_logs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `action` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `entity_type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `entity_id` bigint(20) UNSIGNED DEFAULT NULL,
  `ip_address` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `device_id` bigint(20) UNSIGNED DEFAULT NULL,
  `meta` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `timestamp` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `audit_logs`
--

INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `entity_type`, `entity_id`, `ip_address`, `device_id`, `meta`, `timestamp`) VALUES
(1, 1, 'login_success', 'user', 1, '::1', NULL, NULL, '2026-04-26 18:59:53'),
(2, 1, 'login_success', 'user', 1, '::1', NULL, NULL, '2026-04-26 19:01:36'),
(3, 1, 'logout', 'user', 1, '::1', NULL, NULL, '2026-04-26 19:01:44'),
(4, 3, 'login_success', 'user', 3, '::1', NULL, NULL, '2026-04-26 19:01:48'),
(5, 1, 'login_success', 'user', 1, '::1', NULL, NULL, '2026-04-26 19:01:57'),
(6, 1, 'logout', 'user', 1, '::1', NULL, NULL, '2026-04-26 19:02:03'),
(7, 5, 'login_success', 'user', 5, '::1', NULL, NULL, '2026-04-26 19:02:07'),
(8, 5, 'logout', 'user', 5, '::1', NULL, NULL, '2026-04-26 19:02:59'),
(9, 1, 'login_success', 'user', 1, '::1', NULL, NULL, '2026-04-26 19:03:29'),
(10, 1, 'logout', 'user', 1, '::1', NULL, NULL, '2026-04-26 19:03:33'),
(11, 3, 'login_success', 'user', 3, '::1', NULL, NULL, '2026-04-26 19:03:36'),
(12, 3, 'logout', 'user', 3, '::1', NULL, NULL, '2026-04-26 19:04:01'),
(13, 5, 'login_success', 'user', 5, '::1', NULL, NULL, '2026-04-26 19:04:05'),
(14, 5, 'logout', 'user', 5, '::1', NULL, NULL, '2026-04-26 19:05:30'),
(15, 1, 'login_success', 'user', 1, '::1', NULL, NULL, '2026-04-26 19:05:33'),
(16, 1, 'logout', 'user', 1, '::1', NULL, NULL, '2026-04-26 19:07:44'),
(17, 5, 'login_success', 'user', 5, '::1', NULL, NULL, '2026-04-26 19:07:47'),
(18, 1, 'login_success', 'user', 1, '::1', NULL, NULL, '2026-04-26 19:12:46'),
(19, 5, 'logout', 'user', 5, '::1', NULL, NULL, '2026-04-26 19:19:18'),
(20, 1, 'login_success', 'user', 1, '::1', NULL, NULL, '2026-04-26 19:19:20'),
(21, 1, 'logout', 'user', 1, '::1', NULL, NULL, '2026-04-26 19:20:20'),
(22, 3, 'login_success', 'user', 3, '::1', NULL, NULL, '2026-04-26 19:20:25'),
(23, 3, 'logout', 'user', 3, '::1', NULL, NULL, '2026-04-26 19:49:32'),
(24, 5, 'login_success', 'user', 5, '::1', NULL, NULL, '2026-04-26 19:49:35'),
(25, 3, 'login_success', 'user', 3, '::1', NULL, NULL, '2026-04-30 09:16:24'),
(26, 3, 'logout', 'user', 3, '::1', NULL, NULL, '2026-04-30 09:32:38'),
(27, 5, 'login_success', 'user', 5, '::1', NULL, NULL, '2026-04-30 09:32:44'),
(28, 3, 'login_success', 'user', 3, '::1', NULL, NULL, '2026-04-30 13:03:35'),
(29, 3, 'logout', 'user', 3, '::1', NULL, NULL, '2026-04-30 13:04:29'),
(30, 5, 'login_success', 'user', 5, '::1', NULL, NULL, '2026-04-30 13:04:32'),
(31, 5, 'logout', 'user', 5, '::1', NULL, NULL, '2026-04-30 13:09:53'),
(32, 3, 'login_success', 'user', 3, '::1', NULL, NULL, '2026-04-30 13:09:57'),
(33, 3, 'logout', 'user', 3, '::1', NULL, NULL, '2026-04-30 13:21:04'),
(34, 5, 'login_success', 'user', 5, '::1', NULL, NULL, '2026-04-30 13:21:10'),
(35, 5, 'logout', 'user', 5, '::1', NULL, NULL, '2026-04-30 13:35:05'),
(36, 1, 'login_success', 'user', 1, '::1', NULL, NULL, '2026-04-30 13:35:09'),
(37, 1, 'logout', 'user', 1, '::1', NULL, NULL, '2026-04-30 13:35:30'),
(38, 3, 'login_success', 'user', 3, '::1', NULL, NULL, '2026-04-30 13:35:36'),
(39, 3, 'logout', 'user', 3, '::1', NULL, NULL, '2026-04-30 16:13:14'),
(40, 5, 'login_success', 'user', 5, '::1', NULL, NULL, '2026-04-30 16:13:17'),
(41, 5, 'logout', 'user', 5, '::1', NULL, NULL, '2026-04-30 16:53:12'),
(42, 3, 'login_success', 'user', 3, '::1', NULL, NULL, '2026-04-30 16:53:16'),
(43, 3, 'logout', 'user', 3, '::1', NULL, NULL, '2026-04-30 17:03:08'),
(44, 5, 'login_success', 'user', 5, '::1', NULL, NULL, '2026-04-30 17:03:12'),
(45, 5, 'logout', 'user', 5, '::1', NULL, NULL, '2026-04-30 17:04:24'),
(46, 3, 'login_success', 'user', 3, '::1', NULL, NULL, '2026-04-30 17:04:27'),
(47, 3, 'logout', 'user', 3, '::1', NULL, NULL, '2026-04-30 17:22:08'),
(48, 5, 'login_success', 'user', 5, '::1', NULL, NULL, '2026-04-30 17:22:12'),
(49, 5, 'logout', 'user', 5, '::1', NULL, NULL, '2026-04-30 17:22:32'),
(50, 3, 'login_success', 'user', 3, '::1', NULL, NULL, '2026-04-30 17:23:18'),
(51, 3, 'logout', 'user', 3, '::1', NULL, NULL, '2026-04-30 17:31:27'),
(52, 5, 'login_success', 'user', 5, '::1', NULL, NULL, '2026-04-30 17:31:32'),
(53, 5, 'logout', 'user', 5, '::1', NULL, NULL, '2026-04-30 17:35:25'),
(54, 3, 'login_success', 'user', 3, '::1', NULL, NULL, '2026-04-30 17:35:27'),
(55, 3, 'login_success', 'user', 3, '::1', NULL, NULL, '2026-05-01 07:07:09'),
(56, 3, 'login_success', 'user', 3, '::1', NULL, NULL, '2026-05-01 07:50:34'),
(57, 3, 'logout', 'user', 3, '::1', NULL, NULL, '2026-05-01 07:58:20'),
(58, 5, 'login_success', 'user', 5, '::1', NULL, NULL, '2026-05-01 07:58:24'),
(59, 5, 'logout', 'user', 5, '::1', NULL, NULL, '2026-05-01 08:06:45'),
(60, 3, 'login_success', 'user', 3, '::1', NULL, NULL, '2026-05-01 08:06:57'),
(61, 5, 'login_success', 'user', 5, '::1', NULL, NULL, '2026-05-01 08:21:24'),
(62, 3, 'logout', 'user', 3, '::1', NULL, NULL, '2026-05-01 08:46:26'),
(63, 5, 'login_success', 'user', 5, '::1', NULL, NULL, '2026-05-01 08:46:30'),
(64, 5, 'logout', 'user', 5, '::1', NULL, NULL, '2026-05-01 08:57:42'),
(65, 3, 'login_success', 'user', 3, '::1', NULL, NULL, '2026-05-01 08:57:46'),
(66, 3, 'logout', 'user', 3, '::1', NULL, NULL, '2026-05-01 09:10:53'),
(67, 3, 'login_success', 'user', 3, '::1', NULL, NULL, '2026-05-01 09:11:01'),
(68, 3, 'logout', 'user', 3, '::1', NULL, NULL, '2026-05-01 09:11:10'),
(69, 5, 'login_success', 'user', 5, '::1', NULL, NULL, '2026-05-01 09:11:21'),
(70, 5, 'logout', 'user', 5, '::1', NULL, NULL, '2026-05-01 09:54:57'),
(71, 1, 'login_success', 'user', 1, '::1', NULL, NULL, '2026-05-01 09:55:00'),
(72, 1, 'logout', 'user', 1, '::1', NULL, NULL, '2026-05-01 09:55:19'),
(73, 1, 'login_success', 'user', 1, '::1', NULL, NULL, '2026-05-01 09:55:26'),
(74, 1, 'logout', 'user', 1, '::1', NULL, NULL, '2026-05-01 09:58:41'),
(75, 5, 'login_success', 'user', 5, '::1', NULL, NULL, '2026-05-01 09:58:44'),
(76, 5, 'logout', 'user', 5, '::1', NULL, NULL, '2026-05-01 10:50:15'),
(77, 3, 'login_success', 'user', 3, '::1', NULL, NULL, '2026-05-01 10:50:18'),
(78, 3, 'logout', 'user', 3, '::1', NULL, NULL, '2026-05-01 10:50:22'),
(79, 5, 'login_success', 'user', 5, '::1', NULL, NULL, '2026-05-01 10:50:27'),
(80, 1, 'login_success', 'user', 1, '::1', NULL, NULL, '2026-05-01 11:00:24'),
(81, 1, 'logout', 'user', 1, '::1', NULL, NULL, '2026-05-01 11:00:28'),
(82, 5, 'login_success', 'user', 5, '::1', NULL, NULL, '2026-05-01 11:00:32'),
(83, 5, 'logout', 'user', 5, '::1', NULL, NULL, '2026-05-01 11:32:25'),
(84, 1, 'login_success', 'user', 1, '::1', NULL, NULL, '2026-05-01 11:32:28'),
(85, 1, 'logout', 'user', 1, '::1', NULL, NULL, '2026-05-01 11:32:37'),
(86, 1, 'login_success', 'user', 1, '::1', NULL, NULL, '2026-05-01 11:32:40'),
(87, 1, 'logout', 'user', 1, '::1', NULL, NULL, '2026-05-01 11:33:37'),
(88, 5, 'login_success', 'user', 5, '::1', NULL, NULL, '2026-05-01 11:33:42'),
(89, 5, 'logout', 'user', 5, '::1', NULL, NULL, '2026-05-01 11:34:41'),
(90, 1, 'login_success', 'user', 1, '::1', NULL, NULL, '2026-05-01 11:34:44'),
(91, 1, 'logout', 'user', 1, '::1', NULL, NULL, '2026-05-01 11:35:59'),
(92, 1, 'login_success', 'user', 1, '::1', NULL, NULL, '2026-05-01 11:37:41'),
(93, 1, 'logout', 'user', 1, '::1', NULL, NULL, '2026-05-01 13:12:23'),
(94, 1, 'login_success', 'user', 1, '::1', NULL, NULL, '2026-05-01 13:16:00'),
(95, 5, 'logout', 'user', 5, '::1', NULL, NULL, '2026-05-01 13:22:32'),
(96, 3, 'login_success', 'user', 3, '::1', NULL, NULL, '2026-05-01 13:22:36'),
(97, 1, 'logout', 'user', 1, '::1', NULL, NULL, '2026-05-01 13:24:13'),
(98, 1, 'login_success', 'user', 1, '::1', NULL, NULL, '2026-05-01 13:24:20'),
(99, 1, 'logout', 'user', 1, '::1', NULL, NULL, '2026-05-01 13:25:55'),
(100, 1, 'login_success', 'user', 1, '::1', NULL, NULL, '2026-05-01 13:26:02'),
(101, 1, 'logout', 'user', 1, '::1', NULL, NULL, '2026-05-01 13:44:45'),
(102, 3, 'login_success', 'user', 3, '::1', NULL, NULL, '2026-05-01 13:44:49'),
(103, 3, 'logout', 'user', 3, '::1', NULL, NULL, '2026-05-01 13:46:00'),
(104, 1, 'login_success', 'user', 1, '::1', NULL, NULL, '2026-05-01 13:46:11'),
(105, 3, 'login_success', 'user', 3, '::1', NULL, NULL, '2026-05-01 13:53:27'),
(106, 1, 'logout', 'user', 1, '::1', NULL, NULL, '2026-05-01 14:24:13'),
(107, 3, 'login_success', 'user', 3, '::1', NULL, NULL, '2026-05-01 14:24:17'),
(108, 1, 'login_success', 'user', 1, '::1', NULL, NULL, '2026-05-01 14:36:32'),
(109, 3, 'logout', 'user', 3, '::1', NULL, NULL, '2026-05-01 14:39:47'),
(110, 1, 'logout', 'user', 1, '::1', NULL, NULL, '2026-05-01 14:40:55'),
(111, 3, 'login_success', 'user', 3, '::1', NULL, NULL, '2026-05-01 14:43:05'),
(112, 3, 'login_success', 'user', 3, '::1', NULL, NULL, '2026-05-01 14:46:26'),
(113, 3, 'logout', 'user', 3, '::1', NULL, NULL, '2026-05-01 14:46:35'),
(114, 3, 'logout', 'user', 3, '::1', NULL, NULL, '2026-05-01 14:47:20'),
(115, 1, 'login_success', 'user', 1, '::1', NULL, NULL, '2026-05-01 14:47:27'),
(116, 1, 'logout', 'user', 1, '::1', NULL, NULL, '2026-05-01 14:48:06'),
(117, 5, 'login_success', 'user', 5, '::1', NULL, NULL, '2026-05-01 14:48:10'),
(118, 5, 'logout', 'user', 5, '::1', NULL, NULL, '2026-05-01 14:48:21'),
(119, 3, 'login_success', 'user', 3, '::1', NULL, NULL, '2026-05-01 16:51:53'),
(120, 3, 'logout', 'user', 3, '::1', NULL, NULL, '2026-05-01 16:53:41'),
(121, 5, 'login_success', 'user', 5, '::1', NULL, NULL, '2026-05-01 16:53:47'),
(122, 5, 'logout', 'user', 5, '::1', NULL, NULL, '2026-05-01 16:54:24'),
(123, 1, 'login_success', 'user', 1, '::1', NULL, NULL, '2026-05-01 16:54:28'),
(124, 1, 'logout', 'user', 1, '::1', NULL, NULL, '2026-05-01 16:54:35'),
(125, 1, 'login_success', 'user', 1, '::1', NULL, NULL, '2026-05-02 16:57:01'),
(126, 3, 'login_success', 'user', 3, '::1', NULL, NULL, '2026-05-02 16:57:28'),
(127, 1, 'logout', 'user', 1, '::1', NULL, NULL, '2026-05-02 17:15:36'),
(128, 3, 'login_success', 'user', 3, '::1', NULL, NULL, '2026-05-02 17:15:50'),
(129, 3, 'logout', 'user', 3, '::1', NULL, NULL, '2026-05-02 17:17:21'),
(130, 1, 'login_success', 'user', 1, '::1', NULL, NULL, '2026-05-02 17:17:24'),
(131, 1, 'logout', 'user', 1, '::1', NULL, NULL, '2026-05-02 17:34:36'),
(132, 3, 'login_success', 'user', 3, '::1', NULL, NULL, '2026-05-02 17:34:40'),
(133, 3, 'logout', 'user', 3, '::1', NULL, NULL, '2026-05-02 17:36:47'),
(134, 1, 'login_success', 'user', 1, '::1', NULL, NULL, '2026-05-02 17:36:51'),
(135, 3, 'logout', 'user', 3, '::1', NULL, NULL, '2026-05-02 17:51:17'),
(136, 1, 'login_success', 'user', 1, '::1', NULL, NULL, '2026-05-02 19:06:01'),
(137, 3, 'login_success', 'user', 3, '::1', NULL, NULL, '2026-05-02 19:06:05'),
(138, 3, 'logout', 'user', 3, '::1', NULL, NULL, '2026-05-02 19:10:46'),
(139, 1, 'login_success', 'user', 1, '::1', NULL, NULL, '2026-05-02 19:10:48'),
(140, 3, 'login_success', 'user', 3, '::1', NULL, NULL, '2026-05-02 19:12:38'),
(141, 3, 'logout', 'user', 3, '::1', NULL, NULL, '2026-05-02 19:16:16'),
(142, 1, 'login_success', 'user', 1, '::1', NULL, NULL, '2026-05-02 19:16:30'),
(143, 1, 'logout', 'user', 1, '::1', NULL, NULL, '2026-05-02 19:44:28'),
(144, 3, 'login_success', 'user', 3, '::1', NULL, NULL, '2026-05-02 19:44:36'),
(145, 3, 'logout', 'user', 3, '::1', NULL, NULL, '2026-05-02 19:45:17'),
(146, 1, 'login_success', 'user', 1, '::1', NULL, NULL, '2026-05-02 19:45:23'),
(147, 1, 'logout', 'user', 1, '::1', NULL, NULL, '2026-05-02 19:45:36'),
(148, 5, 'login_success', 'user', 5, '::1', NULL, NULL, '2026-05-02 19:45:40'),
(149, 5, 'logout', 'user', 5, '::1', NULL, NULL, '2026-05-02 19:54:16'),
(150, 3, 'login_success', 'user', 3, '::1', NULL, NULL, '2026-05-02 19:54:19'),
(151, 3, 'logout', 'user', 3, '::1', NULL, NULL, '2026-05-02 20:13:27'),
(152, 5, 'login_success', 'user', 5, '::1', NULL, NULL, '2026-05-02 20:13:32'),
(153, 5, 'logout', 'user', 5, '::1', NULL, NULL, '2026-05-02 20:14:20'),
(154, 3, 'login_success', 'user', 3, '::1', NULL, NULL, '2026-05-02 20:14:24'),
(155, 3, 'logout', 'user', 3, '::1', NULL, NULL, '2026-05-02 20:15:50'),
(156, 3, 'login_success', 'user', 3, '::1', NULL, NULL, '2026-05-02 20:21:21'),
(157, 5, 'login_success', 'user', 5, '::1', NULL, NULL, '2026-05-02 20:24:03'),
(158, 3, 'login_success', 'user', 3, '::1', NULL, NULL, '2026-05-03 12:01:30'),
(159, 3, 'logout', 'user', 3, '::1', NULL, NULL, '2026-05-03 12:58:19'),
(160, 1, 'login_success', 'user', 1, '::1', NULL, NULL, '2026-05-03 12:58:27'),
(161, 1, 'logout', 'user', 1, '::1', NULL, NULL, '2026-05-03 13:48:31'),
(162, 3, 'login_success', 'user', 3, '::1', NULL, NULL, '2026-05-03 13:48:41'),
(163, 3, 'logout', 'user', 3, '::1', NULL, NULL, '2026-05-03 13:51:47'),
(164, 3, 'login_success', 'user', 3, '::1', NULL, NULL, '2026-05-03 13:51:51'),
(165, 3, 'logout', 'user', 3, '::1', NULL, NULL, '2026-05-03 13:51:54'),
(166, 3, 'login_success', 'user', 3, '::1', NULL, NULL, '2026-05-03 13:52:36'),
(167, 3, 'logout', 'user', 3, '::1', NULL, NULL, '2026-05-03 13:52:38'),
(168, 5, 'login_success', 'user', 5, '::1', NULL, NULL, '2026-05-03 13:52:42'),
(169, 5, 'login_success', 'user', 5, '::1', NULL, NULL, '2026-05-03 15:23:35'),
(170, 5, 'login_success', 'user', 5, '::1', NULL, NULL, '2026-05-03 17:55:18'),
(171, 5, 'loss_recorded', 'loss', 5, '::1', NULL, '{\"product_id\":3,\"quantity\":6,\"reason\":\"damaged\"}', '2026-05-03 18:15:56'),
(172, 5, 'logout', 'user', 5, '::1', NULL, NULL, '2026-05-03 18:22:40'),
(173, 3, 'login_success', 'user', 3, '::1', NULL, NULL, '2026-05-03 18:22:43'),
(174, 3, 'logout', 'user', 3, '::1', NULL, NULL, '2026-05-03 18:22:54'),
(175, 1, 'login_success', 'user', 1, '::1', NULL, NULL, '2026-05-03 18:22:57'),
(176, 1, 'login_success', 'user', 1, '::1', NULL, NULL, '2026-05-04 10:46:08'),
(177, 5, 'login_success', 'user', 5, '::1', NULL, NULL, '2026-05-04 11:09:31'),
(178, 5, 'login_success', 'user', 5, '::1', NULL, NULL, '2026-05-04 12:13:07'),
(179, 5, 'create', 'purchase_request', 1, NULL, NULL, NULL, '2026-05-04 12:13:41'),
(180, 5, 'logout', 'user', 5, '::1', NULL, NULL, '2026-05-04 12:13:56'),
(181, 1, 'login_success', 'user', 1, '::1', NULL, NULL, '2026-05-04 12:13:59'),
(182, 1, 'update_status', 'purchase_request', 1, NULL, NULL, NULL, '2026-05-04 12:22:57'),
(183, 1, 'create', 'purchase_request', 2, NULL, NULL, NULL, '2026-05-04 12:29:01'),
(184, 1, 'update_status', 'purchase_request', 2, NULL, NULL, NULL, '2026-05-04 12:31:45'),
(185, 1, 'create', 'purchase_request', 3, NULL, NULL, NULL, '2026-05-04 12:32:11'),
(186, 1, 'update_status', 'purchase_request', 3, NULL, NULL, NULL, '2026-05-04 12:32:44'),
(187, 3, 'login_success', 'user', 3, '::1', NULL, NULL, '2026-05-05 14:50:36'),
(188, 3, 'login_success', 'user', 3, '::1', NULL, NULL, '2026-05-05 15:02:57'),
(189, 1, 'login_success', 'user', 1, '::1', NULL, NULL, '2026-05-05 15:03:38'),
(190, 3, 'logout', 'user', 3, '::1', NULL, NULL, '2026-05-05 15:03:57'),
(191, 3, 'login_success', 'user', 3, '::1', NULL, NULL, '2026-05-05 15:04:03'),
(192, 3, 'logout', 'user', 3, '::1', NULL, NULL, '2026-05-05 15:20:14'),
(193, 5, 'login_success', 'user', 5, '::1', NULL, NULL, '2026-05-05 15:20:19'),
(194, 1, 'logout', 'user', 1, '::1', NULL, NULL, '2026-05-05 15:21:50'),
(195, 1, 'login_success', 'user', 1, '::1', NULL, NULL, '2026-05-05 15:21:53'),
(196, 5, 'create', 'purchase_request', 4, NULL, NULL, NULL, '2026-05-05 15:22:45'),
(197, 1, 'update_status', 'purchase_request', 4, NULL, NULL, NULL, '2026-05-05 15:24:07'),
(198, 5, 'logout', 'user', 5, '::1', NULL, NULL, '2026-05-05 15:29:36'),
(199, 1, 'login_success', 'user', 1, '::1', NULL, NULL, '2026-05-05 15:29:39'),
(200, 1, 'logout', 'user', 1, '::1', NULL, NULL, '2026-05-05 15:29:58'),
(201, 5, 'login_success', 'user', 5, '::1', NULL, NULL, '2026-05-05 15:30:02'),
(202, 5, 'logout', 'user', 5, '::1', NULL, NULL, '2026-05-05 15:30:10'),
(203, 1, 'login_success', 'user', 1, '::1', NULL, NULL, '2026-05-05 15:30:13'),
(204, 3, 'login_success', 'user', 3, '::1', NULL, NULL, '2026-05-08 06:42:46'),
(205, 3, 'logout', 'user', 3, '::1', NULL, NULL, '2026-05-08 06:42:56'),
(206, 5, 'login_success', 'user', 5, '::1', NULL, NULL, '2026-05-08 06:43:01'),
(207, 5, 'logout', 'user', 5, '::1', NULL, NULL, '2026-05-08 06:44:13'),
(208, 1, 'login_success', 'user', 1, '::1', NULL, NULL, '2026-05-08 06:44:16'),
(209, 1, 'logout', 'user', 1, '::1', NULL, NULL, '2026-05-08 06:45:39'),
(210, 3, 'login_success', 'user', 3, '::1', NULL, NULL, '2026-05-08 06:45:43'),
(211, 3, 'logout', 'user', 3, '::1', NULL, NULL, '2026-05-08 06:46:56'),
(212, 1, 'login_success', 'user', 1, '::1', NULL, NULL, '2026-05-08 06:46:58'),
(213, 1, 'logout', 'user', 1, '::1', NULL, NULL, '2026-05-08 06:57:12'),
(214, 5, 'login_success', 'user', 5, '::1', NULL, NULL, '2026-05-08 06:57:18'),
(215, 5, 'logout', 'user', 5, '::1', NULL, NULL, '2026-05-08 06:58:20'),
(216, 3, 'login_success', 'user', 3, '::1', NULL, NULL, '2026-05-08 06:58:24'),
(217, 3, 'logout', 'user', 3, '::1', NULL, NULL, '2026-05-08 07:03:01'),
(218, 1, 'login_success', 'user', 1, '::1', NULL, NULL, '2026-05-08 07:03:12'),
(219, 1, 'logout', 'user', 1, '::1', NULL, NULL, '2026-05-08 07:09:57'),
(220, 5, 'login_success', 'user', 5, '::1', NULL, NULL, '2026-05-08 07:10:01'),
(221, 5, 'logout', 'user', 5, '::1', NULL, NULL, '2026-05-08 07:22:54'),
(222, 1, 'login_success', 'user', 1, '::1', NULL, NULL, '2026-05-08 07:29:16'),
(223, 3, 'login_success', 'user', 3, '::1', NULL, NULL, '2026-05-09 08:07:45'),
(224, 3, 'logout', 'user', 3, '::1', NULL, NULL, '2026-05-09 08:07:49'),
(225, 5, 'login_success', 'user', 5, '::1', NULL, NULL, '2026-05-09 08:08:01'),
(226, 3, 'login_success', 'user', 3, '::1', NULL, NULL, '2026-05-09 08:08:05'),
(227, 3, 'logout', 'user', 3, '::1', NULL, NULL, '2026-05-09 08:16:44'),
(228, 1, 'login_success', 'user', 1, '::1', NULL, NULL, '2026-05-09 08:53:44'),
(229, 1, 'logout', 'user', 1, '::1', NULL, NULL, '2026-05-09 09:01:52'),
(230, 5, 'login_success', 'user', 5, '::1', NULL, NULL, '2026-05-09 09:02:05'),
(231, 5, 'logout', 'user', 5, '::1', NULL, NULL, '2026-05-09 09:02:44'),
(232, 1, 'login_success', 'user', 1, '::1', NULL, NULL, '2026-05-09 09:04:11'),
(233, 1, 'login_success', 'user', 1, '::1', NULL, NULL, '2026-05-09 09:05:22'),
(234, 1, 'login_success', 'user', 1, '::1', NULL, NULL, '2026-05-09 09:07:16'),
(235, 1, 'logout', 'user', 1, '::1', NULL, NULL, '2026-05-09 09:29:36'),
(236, 1, 'login_failed', 'user', 1, '::1', NULL, '{\"email\":\"andrew@andrewbrothers.ug\"}', '2026-05-13 16:23:40'),
(237, 1, 'login_failed', 'user', 1, '::1', NULL, '{\"email\":\"andrew@andrewbrothers.ug\"}', '2026-05-13 16:25:15'),
(238, 5, 'login_success', 'user', 5, '::1', NULL, NULL, '2026-05-13 16:25:51'),
(239, 5, 'logout', 'user', 5, '::1', NULL, NULL, '2026-05-13 16:26:18'),
(240, 1, 'login_failed', 'user', 1, '::1', NULL, '{\"email\":\"andrew@andrewbrothers.ug\"}', '2026-05-13 16:28:08'),
(241, 2, 'login_success', 'user', 2, '::1', NULL, NULL, '2026-05-13 16:33:08'),
(242, 1, 'login_failed', 'user', 1, '::1', NULL, '{\"email\":\"andrew@andrewbrothers.ug\"}', '2026-05-13 17:46:03'),
(243, 3, 'login_success', 'user', 3, '::1', NULL, NULL, '2026-05-13 17:53:41'),
(244, 3, 'logout', 'user', 3, '::1', NULL, NULL, '2026-05-13 17:53:47'),
(245, 5, 'login_success', 'user', 5, '::1', NULL, NULL, '2026-05-13 17:54:07'),
(246, 5, 'logout', 'user', 5, '::1', NULL, NULL, '2026-05-13 17:54:13'),
(247, 2, 'login_success', 'user', 2, '::1', NULL, NULL, '2026-05-13 17:54:25'),
(248, 2, 'login_failed', 'user', 2, '::1', NULL, '{\"email\":\"grace@andrewbrothers.ug\"}', '2026-05-13 17:56:29'),
(249, 2, 'login_success', 'user', 2, '::1', NULL, NULL, '2026-05-13 17:56:56'),
(250, 2, 'logout', 'user', 2, '::1', NULL, NULL, '2026-05-13 17:58:13'),
(251, 2, 'login_success', 'user', 2, '::1', NULL, NULL, '2026-05-13 17:58:26'),
(252, 2, 'logout', 'user', 2, '::1', NULL, NULL, '2026-05-13 17:59:38'),
(253, 1, 'login_success', 'user', 1, '::1', NULL, NULL, '2026-05-13 17:59:46'),
(254, 2, 'login_success', 'user', 2, '::1', NULL, NULL, '2026-05-14 17:40:56'),
(255, 2, 'logout', 'user', 2, '::1', NULL, NULL, '2026-05-14 17:41:06'),
(256, 1, 'login_success', 'user', 1, '::1', NULL, NULL, '2026-05-14 17:55:18'),
(257, 1, 'login_success', 'user', 1, '::1', NULL, NULL, '2026-05-14 18:17:03'),
(258, 1, 'logout', 'user', 1, '::1', NULL, NULL, '2026-05-14 18:17:06'),
(259, 3, 'login_success', 'user', 3, '::1', NULL, NULL, '2026-05-14 18:17:18'),
(260, 3, 'login_success', 'user', 3, '::1', NULL, NULL, '2026-05-14 18:26:53'),
(261, 3, 'logout', 'user', 3, '::1', NULL, NULL, '2026-05-14 18:29:37'),
(262, 1, 'login_failed', 'user', 1, '::1', NULL, '{\"email\":\"andrew@andrewbrothers.ug\"}', '2026-05-14 18:36:58'),
(263, 1, 'login_success', 'user', 1, '::1', NULL, NULL, '2026-05-14 18:37:55'),
(264, 1, 'logout', 'user', 1, '::1', NULL, NULL, '2026-05-14 18:38:01'),
(265, 3, 'login_success', 'user', 3, '::1', NULL, NULL, '2026-05-14 18:39:43'),
(266, 3, 'logout', 'user', 3, '::1', NULL, NULL, '2026-05-14 18:54:39'),
(267, 5, 'login_success', 'user', 5, '::1', NULL, NULL, '2026-05-14 18:56:02'),
(268, 1, 'login_success', 'user', 1, '::1', NULL, NULL, '2026-05-15 07:45:57'),
(269, 3, 'login_success', 'user', 3, '::1', NULL, NULL, '2026-05-15 10:55:06'),
(270, 3, 'login_success', 'user', 3, '::1', NULL, NULL, '2026-05-15 10:58:50'),
(271, 3, 'login_failed', 'user', 3, '::1', NULL, '{\"email\":\"joshua@andrewbrothers.ug\"}', '2026-05-15 11:11:06'),
(272, 3, 'login_success', 'user', 3, '::1', NULL, NULL, '2026-05-15 11:11:17'),
(273, 3, 'login_success', 'user', 3, '::1', NULL, NULL, '2026-05-15 11:12:22'),
(274, 3, 'login_success', 'user', 3, '::1', NULL, NULL, '2026-05-15 11:17:19'),
(275, 3, 'logout', 'user', 3, '::1', NULL, NULL, '2026-05-15 11:18:32'),
(276, 5, 'login_success', 'user', 5, '::1', NULL, NULL, '2026-05-15 11:18:58'),
(277, 3, 'login_success', 'user', 3, '::1', NULL, NULL, '2026-05-15 11:21:15'),
(278, 3, 'logout', 'user', 3, '::1', NULL, NULL, '2026-05-15 11:22:20'),
(279, 1, 'login_success', 'user', 1, '::1', NULL, NULL, '2026-05-15 11:22:30'),
(280, 1, 'logout', 'user', 1, '::1', NULL, NULL, '2026-05-15 11:47:05'),
(281, 3, 'login_success', 'user', 3, '::1', NULL, NULL, '2026-05-15 11:48:08'),
(282, 3, 'login_success', 'user', 3, '::1', NULL, NULL, '2026-05-16 12:37:14'),
(283, 3, 'login_success', 'user', 3, '::1', NULL, NULL, '2026-05-16 13:11:55'),
(284, 3, 'login_success', 'user', 3, '::1', NULL, NULL, '2026-05-16 13:19:59'),
(285, 3, 'logout', 'user', 3, '::1', NULL, NULL, '2026-05-16 14:01:19'),
(286, 5, 'login_success', 'user', 5, '::1', NULL, NULL, '2026-05-16 14:01:40'),
(287, 3, 'logout', 'user', 3, '::1', NULL, NULL, '2026-05-16 15:33:56'),
(288, 5, 'login_success', 'user', 5, '::1', NULL, NULL, '2026-05-16 15:34:11'),
(289, 5, 'logout', 'user', 5, '::1', NULL, NULL, '2026-05-16 15:41:49'),
(290, 3, 'login_success', 'user', 3, '::1', NULL, NULL, '2026-05-16 15:42:01'),
(291, 3, 'logout', 'user', 3, '::1', NULL, NULL, '2026-05-16 15:55:14'),
(292, 1, 'login_success', 'user', 1, '::1', NULL, NULL, '2026-05-16 15:55:33'),
(293, 1, 'logout', 'user', 1, '::1', NULL, NULL, '2026-05-16 16:09:00'),
(294, 3, 'login_success', 'user', 3, '::1', NULL, NULL, '2026-05-16 17:17:25'),
(295, 3, 'logout', 'user', 3, '::1', NULL, NULL, '2026-05-16 17:19:51'),
(296, 5, 'login_success', 'user', 5, '::1', NULL, NULL, '2026-05-16 17:20:01'),
(297, 5, 'logout', 'user', 5, '::1', NULL, NULL, '2026-05-16 17:27:21'),
(298, 3, 'login_failed', 'user', 3, '::1', NULL, '{\"email\":\"joshua@andrewbrothers.ug\"}', '2026-05-16 17:27:32'),
(299, 3, 'login_failed', 'user', 3, '::1', NULL, '{\"email\":\"joshua@andrewbrothers.ug\"}', '2026-05-16 17:27:50'),
(300, 3, 'login_success', 'user', 3, '::1', NULL, NULL, '2026-05-16 17:28:37'),
(301, 5, 'login_success', 'user', 5, '::1', NULL, NULL, '2026-05-16 17:30:37'),
(302, 5, 'logout', 'user', 5, '::1', NULL, NULL, '2026-05-16 17:36:50'),
(303, 3, 'login_success', 'user', 3, '::1', NULL, NULL, '2026-05-16 17:37:26'),
(304, 5, 'login_success', 'user', 5, '::1', NULL, NULL, '2026-05-16 17:37:51'),
(305, 3, 'logout', 'user', 3, '::1', NULL, NULL, '2026-05-16 17:40:14'),
(306, 5, 'login_failed', 'user', 5, '::1', NULL, '{\"email\":\"samuel@andrewbrothers.ug\"}', '2026-05-16 17:40:23'),
(307, 5, 'login_success', 'user', 5, '::1', NULL, NULL, '2026-05-16 17:40:38'),
(308, 3, 'login_success', 'user', 3, '::1', NULL, NULL, '2026-05-16 17:40:52'),
(309, 3, 'logout', 'user', 3, '::1', NULL, NULL, '2026-05-16 17:44:09'),
(310, 5, 'login_success', 'user', 5, '::1', NULL, NULL, '2026-05-16 17:44:19'),
(311, 5, 'logout', 'user', 5, '::1', NULL, NULL, '2026-05-16 17:49:30'),
(312, 3, 'login_failed', 'user', 3, '::1', NULL, '{\"email\":\"joshua@andrewbrothers.ug\"}', '2026-05-16 17:49:37'),
(313, 3, 'login_success', 'user', 3, '::1', NULL, NULL, '2026-05-16 17:49:57'),
(314, 5, 'login_success', 'user', 5, '::1', NULL, NULL, '2026-05-17 18:52:51'),
(315, 5, 'login_failed', 'user', 5, '::1', NULL, '{\"email\":\"samuel@andrewbrothers.ug\"}', '2026-05-17 19:10:36'),
(316, 3, 'login_failed', 'user', 3, '::1', NULL, '{\"email\":\"joshua@andrewbrothers.ug\"}', '2026-05-17 19:10:46'),
(317, 5, 'login_failed', 'user', 5, '::1', NULL, '{\"email\":\"samuel@andrewbrothers.ug\"}', '2026-05-17 19:11:00'),
(318, 3, 'login_failed', 'user', 3, '::1', NULL, '{\"email\":\"joshua@andrewbrothers.ug\"}', '2026-05-17 19:11:15'),
(319, 5, 'login_failed', 'user', 5, '::1', NULL, '{\"email\":\"samuel@andrewbrothers.ug\"}', '2026-05-17 19:11:27'),
(320, 5, 'login_success', 'user', 5, '::1', NULL, NULL, '2026-05-17 19:11:45'),
(321, 5, 'logout', 'user', 5, '::1', NULL, NULL, '2026-05-17 19:16:46'),
(322, 3, 'login_failed', 'user', 3, '::1', NULL, '{\"email\":\"joshua@andrewbrothers.ug\"}', '2026-05-17 19:17:00'),
(323, 3, 'login_success', 'user', 3, '::1', NULL, NULL, '2026-05-17 19:17:23'),
(324, 3, 'logout', 'user', 3, '::1', NULL, NULL, '2026-05-17 19:23:10'),
(325, 5, 'login_success', 'user', 5, '::1', NULL, NULL, '2026-05-17 19:23:28'),
(326, 5, 'logout', 'user', 5, '::1', NULL, NULL, '2026-05-17 19:27:31'),
(327, 3, 'login_failed', 'user', 3, '::1', NULL, '{\"email\":\"joshua@andrewbrothers.ug\"}', '2026-05-17 19:27:47'),
(328, 3, 'login_success', 'user', 3, '::1', NULL, NULL, '2026-05-17 19:28:00'),
(329, 3, 'login_success', 'user', 3, '::1', NULL, NULL, '2026-05-18 06:30:57'),
(330, 5, 'login_success', 'user', 5, '::1', NULL, NULL, '2026-05-18 10:20:45'),
(331, 5, 'logout', 'user', 5, '::1', NULL, NULL, '2026-05-18 10:24:49'),
(332, 3, 'login_failed', 'user', 3, '::1', NULL, '{\"email\":\"joshua@andrewbrothers.ug\"}', '2026-05-18 10:25:02'),
(333, 3, 'login_success', 'user', 3, '::1', NULL, NULL, '2026-05-18 10:25:20'),
(334, 3, 'logout', 'user', 3, '::1', NULL, NULL, '2026-05-18 11:05:35'),
(335, 5, 'login_success', 'user', 5, '::1', NULL, NULL, '2026-05-18 12:00:31'),
(336, 5, 'logout', 'user', 5, '::1', NULL, NULL, '2026-05-18 12:07:49'),
(337, 3, 'login_success', 'user', 3, '::1', NULL, NULL, '2026-05-18 12:08:03'),
(338, 3, 'logout', 'user', 3, '::1', NULL, NULL, '2026-05-18 12:08:32'),
(339, 5, 'login_success', 'user', 5, '::1', NULL, NULL, '2026-05-18 12:08:41'),
(340, 5, 'logout', 'user', 5, '::1', NULL, NULL, '2026-05-18 12:10:55'),
(341, 3, 'login_failed', 'user', 3, '::1', NULL, '{\"email\":\"joshua@andrewbrothers.ug\"}', '2026-05-18 12:11:04'),
(342, 3, 'login_success', 'user', 3, '::1', NULL, NULL, '2026-05-18 12:11:16'),
(343, 3, 'logout', 'user', 3, '::1', NULL, NULL, '2026-05-18 12:18:29'),
(344, 1, 'login_failed', 'user', 1, '::1', NULL, '{\"email\":\"andrew@andrewbrothers.ug\"}', '2026-05-18 12:18:42'),
(345, 1, 'login_success', 'user', 1, '::1', NULL, NULL, '2026-05-18 12:18:56'),
(346, 3, 'login_success', 'user', 3, '::1', NULL, NULL, '2026-05-21 07:05:33'),
(347, 3, 'login_success', 'user', 3, '::1', NULL, NULL, '2026-05-22 10:04:06'),
(348, 3, 'login_success', 'user', 3, '::1', NULL, NULL, '2026-05-27 08:23:10'),
(349, 3, 'login_success', 'user', 3, '::1', NULL, NULL, '2026-06-09 18:41:33'),
(350, 3, 'logout', 'user', 3, '::1', NULL, NULL, '2026-06-09 18:43:02'),
(351, 1, 'login_success', 'user', 1, '::1', NULL, NULL, '2026-06-09 18:43:15'),
(352, 1, 'logout', 'user', 1, '::1', NULL, NULL, '2026-06-09 18:45:07'),
(353, 5, 'login_success', 'user', 5, '::1', NULL, NULL, '2026-06-09 18:45:17'),
(354, 5, 'logout', 'user', 5, '::1', NULL, NULL, '2026-06-09 18:46:12'),
(355, 1, 'login_failed', 'user', 1, '::1', NULL, '{\"email\":\"andrew@andrewbrothers.ug\"}', '2026-06-09 18:46:28'),
(356, 1, 'login_success', 'user', 1, '::1', NULL, NULL, '2026-06-09 18:46:40'),
(357, 3, 'login_success', 'user', 3, '::1', NULL, NULL, '2026-06-11 08:28:10'),
(358, 3, 'logout', 'user', 3, '::1', NULL, NULL, '2026-06-11 08:32:35'),
(359, 5, 'login_success', 'user', 5, '::1', NULL, NULL, '2026-06-11 08:34:19'),
(360, 5, 'logout', 'user', 5, '::1', NULL, NULL, '2026-06-11 08:51:27'),
(361, 3, 'login_success', 'user', 3, '::1', NULL, NULL, '2026-06-11 08:51:38'),
(362, 3, 'logout', 'user', 3, '::1', NULL, NULL, '2026-06-11 08:58:21'),
(363, 5, 'login_success', 'user', 5, '::1', NULL, NULL, '2026-06-11 08:58:35'),
(364, 3, 'login_success', 'user', 3, '::1', NULL, NULL, '2026-06-11 09:39:07'),
(365, 3, 'logout', 'user', 3, '::1', NULL, NULL, '2026-06-11 09:52:16'),
(366, 5, 'login_success', 'user', 5, '::1', NULL, NULL, '2026-06-11 09:54:07'),
(367, 3, 'login_success', 'user', 3, '::1', NULL, NULL, '2026-06-11 19:11:54'),
(368, 3, 'logout', 'user', 3, '::1', NULL, NULL, '2026-06-11 19:12:22'),
(369, 1, 'login_success', 'user', 1, '::1', NULL, NULL, '2026-06-11 19:13:07'),
(370, 1, 'logout', 'user', 1, '::1', NULL, NULL, '2026-06-11 19:17:47'),
(371, 5, 'login_success', 'user', 5, '::1', NULL, NULL, '2026-06-11 19:18:38'),
(372, 5, 'logout', 'user', 5, '::1', NULL, NULL, '2026-06-11 19:20:29'),
(373, 1, 'login_success', 'user', 1, '::1', NULL, NULL, '2026-06-11 19:20:50'),
(374, 1, 'login_success', 'user', 1, '::1', NULL, NULL, '2026-06-11 20:06:28'),
(375, 1, 'logout', 'user', 1, '::1', NULL, NULL, '2026-06-11 21:50:35'),
(376, 5, 'login_success', 'user', 5, '::1', NULL, NULL, '2026-06-11 21:54:47'),
(377, 5, 'logout', 'user', 5, '::1', NULL, NULL, '2026-06-11 21:54:51'),
(378, 3, 'login_success', 'user', 3, '::1', NULL, NULL, '2026-06-11 21:55:37'),
(379, 3, 'logout', 'user', 3, '::1', NULL, NULL, '2026-06-11 21:56:10'),
(380, 1, 'login_success', 'user', 1, '::1', NULL, NULL, '2026-06-11 21:56:53'),
(381, 3, 'login_success', 'user', 3, '::1', NULL, NULL, '2026-06-11 21:57:30'),
(382, 3, 'login_success', 'user', 3, '::1', NULL, NULL, '2026-06-12 00:28:35'),
(383, 3, 'login_success', 'user', 3, '::1', NULL, NULL, '2026-06-12 07:46:23'),
(384, 3, 'login_success', 'user', 3, '::1', NULL, NULL, '2026-06-12 09:25:36'),
(385, 3, 'logout', 'user', 3, '::1', NULL, NULL, '2026-06-12 09:34:56');

-- --------------------------------------------------------

--
-- Table structure for table `cash_sessions`
--

CREATE TABLE `cash_sessions` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `cashier_id` bigint(20) UNSIGNED NOT NULL,
  `device_id` bigint(20) UNSIGNED DEFAULT NULL,
  `opening_balance` decimal(12,2) NOT NULL,
  `expected_cash` decimal(12,2) DEFAULT NULL,
  `actual_cash` decimal(12,2) DEFAULT NULL,
  `difference` decimal(12,2) DEFAULT NULL,
  `status` enum('open','closed','force_closed') DEFAULT 'open',
  `started_at` datetime DEFAULT NULL,
  `ended_at` datetime DEFAULT NULL,
  `closed_by` bigint(20) UNSIGNED DEFAULT NULL,
  `notes` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `cash_sessions`
--

INSERT INTO `cash_sessions` (`id`, `cashier_id`, `device_id`, `opening_balance`, `expected_cash`, `actual_cash`, `difference`, `status`, `started_at`, `ended_at`, `closed_by`, `notes`) VALUES
(10, 3, NULL, 0.00, 82600.00, 82600.00, 0.00, 'closed', '2026-04-30 17:26:38', '2026-05-01 08:58:17', NULL, NULL),
(11, 3, NULL, 200000.00, 10539160.00, 9539160.00, -1000000.00, 'closed', '2026-05-01 14:36:54', '2026-05-02 17:51:05', NULL, 'manager requested for funds to do stocking'),
(12, 3, NULL, 500000.00, 6513280.00, 6513280.00, 0.00, 'closed', '2026-05-02 19:11:43', '2026-05-03 13:51:42', NULL, 'clean'),
(13, 1, NULL, 500000.00, 502000.00, NULL, NULL, 'force_closed', '2026-05-02 19:44:12', '2026-06-11 21:00:00', NULL, 'Auto-closed by system at midnight'),
(14, 3, NULL, 200000.00, 200000.00, 200000.00, 0.00, 'closed', '2026-05-03 18:23:23', '2026-05-05 15:03:55', NULL, 'd'),
(15, 3, NULL, 500000.00, 673319.00, NULL, NULL, 'force_closed', '2026-05-05 15:04:54', '2026-06-11 21:00:00', NULL, 'Auto-closed by system at midnight'),
(16, 3, NULL, 1000000.00, NULL, NULL, NULL, 'open', '2026-06-11 21:57:13', NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `categories`
--

CREATE TABLE `categories` (
  `id` int(10) UNSIGNED NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `categories`
--

INSERT INTO `categories` (`id`, `name`, `description`) VALUES
(1, 'Beverages', 'Soft drinks, juices, water'),
(2, 'Dairy & Eggs', 'Milk, cheese, yogurt, eggs'),
(3, 'Bakery', 'Bread, cakes, pastries'),
(4, 'Snacks', 'Chips, biscuits, candy'),
(5, 'Personal Care', 'Soap, shampoo, toothpaste'),
(6, 'Household', 'Cleaning supplies, detergents'),
(7, 'stationary', 'office work items, pens, books'),
(8, 'Cakes', 'bakery'),
(9, 'water', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `devices`
--

CREATE TABLE `devices` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(100) NOT NULL,
  `location` varchar(100) DEFAULT NULL,
  `last_seen_at` datetime DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `forecast_data`
--

CREATE TABLE `forecast_data` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `product_id` bigint(20) UNSIGNED NOT NULL,
  `forecast_date` date NOT NULL,
  `predicted_quantity` decimal(10,2) NOT NULL,
  `model_version` varchar(50) DEFAULT NULL,
  `mae_score` decimal(8,4) DEFAULT NULL,
  `created_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `inventory`
--

CREATE TABLE `inventory` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `product_id` bigint(20) UNSIGNED NOT NULL,
  `quantity_on_hand` int(11) NOT NULL DEFAULT 0,
  `last_updated` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `inventory`
--

INSERT INTO `inventory` (`id`, `product_id`, `quantity_on_hand`, `last_updated`) VALUES
(1, 1, 1987, '2026-04-26 19:19:59'),
(2, 2, 478, '2026-04-30 13:08:10'),
(3, 3, 359, '2026-05-03 18:15:56'),
(4, 4, 100, '2026-05-03 18:12:15'),
(5, 5, 193, '2026-05-05 15:14:30'),
(6, 6, 3, '2026-05-15 08:05:00'),
(7, 7, 199, '2026-05-15 11:21:01'),
(8, 8, 4, '2026-05-16 15:39:04'),
(9, 9, 6, '2026-05-16 17:26:57'),
(10, 10, 45, '2026-05-16 17:47:29'),
(11, 11, 26, '2026-05-17 19:15:50'),
(12, 12, 36, '2026-05-17 19:27:20'),
(13, 13, 62, '2026-05-18 10:24:34'),
(14, 14, 4, '2026-05-18 12:05:10'),
(15, 15, 3, '2026-05-18 12:10:34'),
(16, 16, 9, '2026-06-11 08:50:31');

-- --------------------------------------------------------

--
-- Table structure for table `losses`
--

CREATE TABLE `losses` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `product_id` bigint(20) UNSIGNED NOT NULL,
  `quantity` int(10) UNSIGNED NOT NULL,
  `reason` enum('expired','stolen','damaged','vendor_return','other') NOT NULL,
  `notes` text DEFAULT NULL,
  `recorded_by` bigint(20) UNSIGNED NOT NULL,
  `created_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `losses`
--

INSERT INTO `losses` (`id`, `product_id`, `quantity`, `reason`, `notes`, `recorded_by`, `created_at`) VALUES
(5, 3, 6, 'damaged', NULL, 5, '2026-05-03 18:15:56');

-- --------------------------------------------------------

--
-- Table structure for table `permissions`
--

CREATE TABLE `permissions` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `role` enum('admin','manager','cashier','stock') NOT NULL,
  `action` varchar(100) NOT NULL,
  `is_allowed` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `pesapal_transactions`
--

CREATE TABLE `pesapal_transactions` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `pesapal_order_tracking_id` varchar(100) DEFAULT NULL,
  `merchant_reference` varchar(100) NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `currency` varchar(10) DEFAULT 'UGX',
  `status` enum('pending','paid','failed') DEFAULT 'pending',
  `phone_number` varchar(20) NOT NULL,
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`metadata`)),
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `pesapal_transactions`
--

INSERT INTO `pesapal_transactions` (`id`, `pesapal_order_tracking_id`, `merchant_reference`, `amount`, `currency`, `status`, `phone_number`, `metadata`, `created_at`, `updated_at`) VALUES
(1, NULL, 'TXN-1781216205535-3045', 8260.00, 'UGX', 'pending', '0758644682', '{\"description\":\"POS Checkout for Andrew & Brothers Supermarket\"}', '2026-06-11 22:16:45', '2026-06-11 22:16:45'),
(2, NULL, 'TXN-1781216520649-9514', 1180.00, 'UGX', 'pending', '0758644682', '{\"description\":\"POS Checkout for Andrew & Brothers Supermarket\"}', '2026-06-11 22:22:00', '2026-06-11 22:22:00'),
(3, NULL, 'TXN-1781219911948-4860', 8260.00, 'UGX', 'pending', '0758644682', '{\"description\":\"POS Checkout for Andrew & Brothers Supermarket\"}', '2026-06-11 23:18:31', '2026-06-11 23:18:31'),
(4, NULL, 'TXN-1781220964285-5505', 1770.00, 'UGX', 'pending', '0758644682', '{\"description\":\"POS Checkout for Andrew & Brothers Supermarket\"}', '2026-06-11 23:36:04', '2026-06-11 23:36:04'),
(5, 'ebecd9d6-9a33-482e-8c7b-da4599514597', 'TXN-1781221524015-6835', 8260.00, 'UGX', 'failed', '0758644682', '{\"0\":\"{\",\"1\":\"\\\"\",\"2\":\"d\",\"3\":\"e\",\"4\":\"s\",\"5\":\"c\",\"6\":\"r\",\"7\":\"i\",\"8\":\"p\",\"9\":\"t\",\"10\":\"i\",\"11\":\"o\",\"12\":\"n\",\"13\":\"\\\"\",\"14\":\":\",\"15\":\"\\\"\",\"16\":\"P\",\"17\":\"O\",\"18\":\"S\",\"19\":\" \",\"20\":\"C\",\"21\":\"h\",\"22\":\"e\",\"23\":\"c\",\"24\":\"k\",\"25\":\"o\",\"26\":\"u\",\"27\":\"t\",\"28\":\" \",\"29\":\"f\",\"30\":\"o\",\"31\":\"r\",\"32\":\" \",\"33\":\"A\",\"34\":\"n\",\"35\":\"d\",\"36\":\"r\",\"37\":\"e\",\"38\":\"w\",\"39\":\" \",\"40\":\"&\",\"41\":\" \",\"42\":\"B\",\"43\":\"r\",\"44\":\"o\",\"45\":\"t\",\"46\":\"h\",\"47\":\"e\",\"48\":\"r\",\"49\":\"s\",\"50\":\" \",\"51\":\"S\",\"52\":\"u\",\"53\":\"p\",\"54\":\"e\",\"55\":\"r\",\"56\":\"m\",\"57\":\"a\",\"58\":\"r\",\"59\":\"k\",\"60\":\"e\",\"61\":\"t\",\"62\":\"\\\"\",\"63\":\",\",\"64\":\"\\\"\",\"65\":\"r\",\"66\":\"e\",\"67\":\"d\",\"68\":\"i\",\"69\":\"r\",\"70\":\"e\",\"71\":\"c\",\"72\":\"t\",\"73\":\"U\",\"74\":\"r\",\"75\":\"l\",\"76\":\"\\\"\",\"77\":\":\",\"78\":\"\\\"\",\"79\":\"h\",\"80\":\"t\",\"81\":\"t\",\"82\":\"p\",\"83\":\"s\",\"84\":\":\",\"85\":\"/\",\"86\":\"/\",\"87\":\"p\",\"88\":\"a\",\"89\":\"y\",\"90\":\".\",\"91\":\"p\",\"92\":\"e\",\"93\":\"s\",\"94\":\"a\",\"95\":\"p\",\"96\":\"a\",\"97\":\"l\",\"98\":\".\",\"99\":\"c\",\"100\":\"o\",\"101\":\"m\",\"102\":\"/\",\"103\":\"i\",\"104\":\"f\",\"105\":\"r\",\"106\":\"a\",\"107\":\"m\",\"108\":\"e\",\"109\":\"/\",\"110\":\"P\",\"111\":\"e\",\"112\":\"s\",\"113\":\"a\",\"114\":\"p\",\"115\":\"a\",\"116\":\"l\",\"117\":\"I\",\"118\":\"f\",\"119\":\"r\",\"120\":\"a\",\"121\":\"m\",\"122\":\"e\",\"123\":\"3\",\"124\":\"/\",\"125\":\"I\",\"126\":\"n\",\"127\":\"d\",\"128\":\"e\",\"129\":\"x\",\"130\":\"?\",\"131\":\"O\",\"132\":\"r\",\"133\":\"d\",\"134\":\"e\",\"135\":\"r\",\"136\":\"T\",\"137\":\"r\",\"138\":\"a\",\"139\":\"c\",\"140\":\"k\",\"141\":\"i\",\"142\":\"n\",\"143\":\"g\",\"144\":\"I\",\"145\":\"d\",\"146\":\"=\",\"147\":\"e\",\"148\":\"b\",\"149\":\"e\",\"150\":\"c\",\"151\":\"d\",\"152\":\"9\",\"153\":\"d\",\"154\":\"6\",\"155\":\"-\",\"156\":\"9\",\"157\":\"a\",\"158\":\"3\",\"159\":\"3\",\"160\":\"-\",\"161\":\"4\",\"162\":\"8\",\"163\":\"2\",\"164\":\"e\",\"165\":\"-\",\"166\":\"8\",\"167\":\"c\",\"168\":\"7\",\"169\":\"b\",\"170\":\"-\",\"171\":\"d\",\"172\":\"a\",\"173\":\"4\",\"174\":\"5\",\"175\":\"9\",\"176\":\"9\",\"177\":\"5\",\"178\":\"1\",\"179\":\"4\",\"180\":\"5\",\"181\":\"9\",\"182\":\"7\",\"183\":\"\\\"\",\"184\":\"}\",\"verificationRaw\":{\"payment_method\":\"\",\"amount\":8260,\"created_date\":\"2026-06-12T02:45:26.94\",\"confirmation_code\":\"\",\"order_tracking_id\":\"ebecd9d6-9a33-482e-8c7b-da4599514597\",\"payment_status_description\":\"INVALID\",\"description\":null,\"message\":\"Request processed successfully\",\"payment_account\":\"\",\"call_back_url\":\"http://localhost:3000/api/v1/payments/webhook?OrderTrackingId=ebecd9d6-9a33-482e-8c7b-da4599514597&OrderMerchantReference=TXN-1781221524015-6835\",\"status_code\":0,\"merchant_reference\":\"TXN-1781221524015-6835\",\"account_number\":null,\"payment_status_code\":\"\",\"currency\":\"UGX\",\"error\":{\"error_type\":\"api_error\",\"code\":\"payment_details_not_found\",\"message\":\"Pending Payment\",\"call_back_url\":\"http://localhost:3000/api/v1/payments/webhook?OrderTrackingId=ebecd9d6-9a33-482e-8c7b-da4599514597&OrderMerchantReference=TXN-1781221524015-6835\"},\"status\":\"500\"},\"paymentMethod\":\"\"}', '2026-06-11 23:45:24', '2026-06-11 23:45:33'),
(6, '60cdec01-27b2-4f34-a147-da45264d9bd4', 'TXN-1781221569277-5577', 8260.00, 'UGX', 'failed', '0758644682', '{\"0\":\"{\",\"1\":\"\\\"\",\"2\":\"d\",\"3\":\"e\",\"4\":\"s\",\"5\":\"c\",\"6\":\"r\",\"7\":\"i\",\"8\":\"p\",\"9\":\"t\",\"10\":\"i\",\"11\":\"o\",\"12\":\"n\",\"13\":\"\\\"\",\"14\":\":\",\"15\":\"\\\"\",\"16\":\"P\",\"17\":\"O\",\"18\":\"S\",\"19\":\" \",\"20\":\"C\",\"21\":\"h\",\"22\":\"e\",\"23\":\"c\",\"24\":\"k\",\"25\":\"o\",\"26\":\"u\",\"27\":\"t\",\"28\":\" \",\"29\":\"f\",\"30\":\"o\",\"31\":\"r\",\"32\":\" \",\"33\":\"A\",\"34\":\"n\",\"35\":\"d\",\"36\":\"r\",\"37\":\"e\",\"38\":\"w\",\"39\":\" \",\"40\":\"&\",\"41\":\" \",\"42\":\"B\",\"43\":\"r\",\"44\":\"o\",\"45\":\"t\",\"46\":\"h\",\"47\":\"e\",\"48\":\"r\",\"49\":\"s\",\"50\":\" \",\"51\":\"S\",\"52\":\"u\",\"53\":\"p\",\"54\":\"e\",\"55\":\"r\",\"56\":\"m\",\"57\":\"a\",\"58\":\"r\",\"59\":\"k\",\"60\":\"e\",\"61\":\"t\",\"62\":\"\\\"\",\"63\":\",\",\"64\":\"\\\"\",\"65\":\"r\",\"66\":\"e\",\"67\":\"d\",\"68\":\"i\",\"69\":\"r\",\"70\":\"e\",\"71\":\"c\",\"72\":\"t\",\"73\":\"U\",\"74\":\"r\",\"75\":\"l\",\"76\":\"\\\"\",\"77\":\":\",\"78\":\"\\\"\",\"79\":\"h\",\"80\":\"t\",\"81\":\"t\",\"82\":\"p\",\"83\":\"s\",\"84\":\":\",\"85\":\"/\",\"86\":\"/\",\"87\":\"p\",\"88\":\"a\",\"89\":\"y\",\"90\":\".\",\"91\":\"p\",\"92\":\"e\",\"93\":\"s\",\"94\":\"a\",\"95\":\"p\",\"96\":\"a\",\"97\":\"l\",\"98\":\".\",\"99\":\"c\",\"100\":\"o\",\"101\":\"m\",\"102\":\"/\",\"103\":\"i\",\"104\":\"f\",\"105\":\"r\",\"106\":\"a\",\"107\":\"m\",\"108\":\"e\",\"109\":\"/\",\"110\":\"P\",\"111\":\"e\",\"112\":\"s\",\"113\":\"a\",\"114\":\"p\",\"115\":\"a\",\"116\":\"l\",\"117\":\"I\",\"118\":\"f\",\"119\":\"r\",\"120\":\"a\",\"121\":\"m\",\"122\":\"e\",\"123\":\"3\",\"124\":\"/\",\"125\":\"I\",\"126\":\"n\",\"127\":\"d\",\"128\":\"e\",\"129\":\"x\",\"130\":\"?\",\"131\":\"O\",\"132\":\"r\",\"133\":\"d\",\"134\":\"e\",\"135\":\"r\",\"136\":\"T\",\"137\":\"r\",\"138\":\"a\",\"139\":\"c\",\"140\":\"k\",\"141\":\"i\",\"142\":\"n\",\"143\":\"g\",\"144\":\"I\",\"145\":\"d\",\"146\":\"=\",\"147\":\"6\",\"148\":\"0\",\"149\":\"c\",\"150\":\"d\",\"151\":\"e\",\"152\":\"c\",\"153\":\"0\",\"154\":\"1\",\"155\":\"-\",\"156\":\"2\",\"157\":\"7\",\"158\":\"b\",\"159\":\"2\",\"160\":\"-\",\"161\":\"4\",\"162\":\"f\",\"163\":\"3\",\"164\":\"4\",\"165\":\"-\",\"166\":\"a\",\"167\":\"1\",\"168\":\"4\",\"169\":\"7\",\"170\":\"-\",\"171\":\"d\",\"172\":\"a\",\"173\":\"4\",\"174\":\"5\",\"175\":\"2\",\"176\":\"6\",\"177\":\"4\",\"178\":\"d\",\"179\":\"9\",\"180\":\"b\",\"181\":\"d\",\"182\":\"4\",\"183\":\"\\\"\",\"184\":\"}\",\"verificationRaw\":{\"payment_method\":\"\",\"amount\":8260,\"created_date\":\"2026-06-12T02:46:15.31\",\"confirmation_code\":\"\",\"order_tracking_id\":\"60cdec01-27b2-4f34-a147-da45264d9bd4\",\"payment_status_description\":\"INVALID\",\"description\":null,\"message\":\"Request processed successfully\",\"payment_account\":\"\",\"call_back_url\":\"http://localhost:3000/api/v1/payments/webhook?OrderTrackingId=60cdec01-27b2-4f34-a147-da45264d9bd4&OrderMerchantReference=TXN-1781221569277-5577\",\"status_code\":0,\"merchant_reference\":\"TXN-1781221569277-5577\",\"account_number\":null,\"payment_status_code\":\"\",\"currency\":\"UGX\",\"error\":{\"error_type\":\"api_error\",\"code\":\"payment_details_not_found\",\"message\":\"Pending Payment\",\"call_back_url\":\"http://localhost:3000/api/v1/payments/webhook?OrderTrackingId=60cdec01-27b2-4f34-a147-da45264d9bd4&OrderMerchantReference=TXN-1781221569277-5577\"},\"status\":\"500\"},\"paymentMethod\":\"\"}', '2026-06-11 23:46:09', '2026-06-11 23:46:21'),
(7, '5250320c-5796-463e-8bce-da45cdc9287f', 'TXN-1781221851976-1784', 5900.00, 'UGX', 'failed', '0758644682', '{\"0\":\"{\",\"1\":\"\\\"\",\"2\":\"d\",\"3\":\"e\",\"4\":\"s\",\"5\":\"c\",\"6\":\"r\",\"7\":\"i\",\"8\":\"p\",\"9\":\"t\",\"10\":\"i\",\"11\":\"o\",\"12\":\"n\",\"13\":\"\\\"\",\"14\":\":\",\"15\":\"\\\"\",\"16\":\"P\",\"17\":\"O\",\"18\":\"S\",\"19\":\" \",\"20\":\"C\",\"21\":\"h\",\"22\":\"e\",\"23\":\"c\",\"24\":\"k\",\"25\":\"o\",\"26\":\"u\",\"27\":\"t\",\"28\":\" \",\"29\":\"f\",\"30\":\"o\",\"31\":\"r\",\"32\":\" \",\"33\":\"A\",\"34\":\"n\",\"35\":\"d\",\"36\":\"r\",\"37\":\"e\",\"38\":\"w\",\"39\":\" \",\"40\":\"&\",\"41\":\" \",\"42\":\"B\",\"43\":\"r\",\"44\":\"o\",\"45\":\"t\",\"46\":\"h\",\"47\":\"e\",\"48\":\"r\",\"49\":\"s\",\"50\":\" \",\"51\":\"S\",\"52\":\"u\",\"53\":\"p\",\"54\":\"e\",\"55\":\"r\",\"56\":\"m\",\"57\":\"a\",\"58\":\"r\",\"59\":\"k\",\"60\":\"e\",\"61\":\"t\",\"62\":\"\\\"\",\"63\":\",\",\"64\":\"\\\"\",\"65\":\"r\",\"66\":\"e\",\"67\":\"d\",\"68\":\"i\",\"69\":\"r\",\"70\":\"e\",\"71\":\"c\",\"72\":\"t\",\"73\":\"U\",\"74\":\"r\",\"75\":\"l\",\"76\":\"\\\"\",\"77\":\":\",\"78\":\"\\\"\",\"79\":\"h\",\"80\":\"t\",\"81\":\"t\",\"82\":\"p\",\"83\":\"s\",\"84\":\":\",\"85\":\"/\",\"86\":\"/\",\"87\":\"p\",\"88\":\"a\",\"89\":\"y\",\"90\":\".\",\"91\":\"p\",\"92\":\"e\",\"93\":\"s\",\"94\":\"a\",\"95\":\"p\",\"96\":\"a\",\"97\":\"l\",\"98\":\".\",\"99\":\"c\",\"100\":\"o\",\"101\":\"m\",\"102\":\"/\",\"103\":\"i\",\"104\":\"f\",\"105\":\"r\",\"106\":\"a\",\"107\":\"m\",\"108\":\"e\",\"109\":\"/\",\"110\":\"P\",\"111\":\"e\",\"112\":\"s\",\"113\":\"a\",\"114\":\"p\",\"115\":\"a\",\"116\":\"l\",\"117\":\"I\",\"118\":\"f\",\"119\":\"r\",\"120\":\"a\",\"121\":\"m\",\"122\":\"e\",\"123\":\"3\",\"124\":\"/\",\"125\":\"I\",\"126\":\"n\",\"127\":\"d\",\"128\":\"e\",\"129\":\"x\",\"130\":\"?\",\"131\":\"O\",\"132\":\"r\",\"133\":\"d\",\"134\":\"e\",\"135\":\"r\",\"136\":\"T\",\"137\":\"r\",\"138\":\"a\",\"139\":\"c\",\"140\":\"k\",\"141\":\"i\",\"142\":\"n\",\"143\":\"g\",\"144\":\"I\",\"145\":\"d\",\"146\":\"=\",\"147\":\"5\",\"148\":\"2\",\"149\":\"5\",\"150\":\"0\",\"151\":\"3\",\"152\":\"2\",\"153\":\"0\",\"154\":\"c\",\"155\":\"-\",\"156\":\"5\",\"157\":\"7\",\"158\":\"9\",\"159\":\"6\",\"160\":\"-\",\"161\":\"4\",\"162\":\"6\",\"163\":\"3\",\"164\":\"e\",\"165\":\"-\",\"166\":\"8\",\"167\":\"b\",\"168\":\"c\",\"169\":\"e\",\"170\":\"-\",\"171\":\"d\",\"172\":\"a\",\"173\":\"4\",\"174\":\"5\",\"175\":\"c\",\"176\":\"d\",\"177\":\"c\",\"178\":\"9\",\"179\":\"2\",\"180\":\"8\",\"181\":\"7\",\"182\":\"f\",\"183\":\"\\\"\",\"184\":\"}\",\"verificationRaw\":{\"payment_method\":\"\",\"amount\":5900,\"created_date\":\"2026-06-12T02:50:57.243\",\"confirmation_code\":\"\",\"order_tracking_id\":\"5250320c-5796-463e-8bce-da45cdc9287f\",\"payment_status_description\":\"INVALID\",\"description\":null,\"message\":\"Request processed successfully\",\"payment_account\":\"\",\"call_back_url\":\"http://localhost:3000/api/v1/payments/webhook?OrderTrackingId=5250320c-5796-463e-8bce-da45cdc9287f&OrderMerchantReference=TXN-1781221851976-1784\",\"status_code\":0,\"merchant_reference\":\"TXN-1781221851976-1784\",\"account_number\":null,\"payment_status_code\":\"\",\"currency\":\"UGX\",\"error\":{\"error_type\":\"api_error\",\"code\":\"payment_details_not_found\",\"message\":\"Pending Payment\",\"call_back_url\":\"http://localhost:3000/api/v1/payments/webhook?OrderTrackingId=5250320c-5796-463e-8bce-da45cdc9287f&OrderMerchantReference=TXN-1781221851976-1784\"},\"status\":\"500\"},\"paymentMethod\":\"\"}', '2026-06-11 23:50:51', '2026-06-11 23:51:03'),
(8, 'f0f3ffa1-5750-4ef6-91a0-da45930b1527', 'TXN-1781223217650-7795', 30680.00, 'UGX', 'failed', '0758644682', '{\"0\":\"{\",\"1\":\"\\\"\",\"2\":\"d\",\"3\":\"e\",\"4\":\"s\",\"5\":\"c\",\"6\":\"r\",\"7\":\"i\",\"8\":\"p\",\"9\":\"t\",\"10\":\"i\",\"11\":\"o\",\"12\":\"n\",\"13\":\"\\\"\",\"14\":\":\",\"15\":\"\\\"\",\"16\":\"P\",\"17\":\"O\",\"18\":\"S\",\"19\":\" \",\"20\":\"C\",\"21\":\"h\",\"22\":\"e\",\"23\":\"c\",\"24\":\"k\",\"25\":\"o\",\"26\":\"u\",\"27\":\"t\",\"28\":\" \",\"29\":\"f\",\"30\":\"o\",\"31\":\"r\",\"32\":\" \",\"33\":\"A\",\"34\":\"n\",\"35\":\"d\",\"36\":\"r\",\"37\":\"e\",\"38\":\"w\",\"39\":\" \",\"40\":\"&\",\"41\":\" \",\"42\":\"B\",\"43\":\"r\",\"44\":\"o\",\"45\":\"t\",\"46\":\"h\",\"47\":\"e\",\"48\":\"r\",\"49\":\"s\",\"50\":\" \",\"51\":\"S\",\"52\":\"u\",\"53\":\"p\",\"54\":\"e\",\"55\":\"r\",\"56\":\"m\",\"57\":\"a\",\"58\":\"r\",\"59\":\"k\",\"60\":\"e\",\"61\":\"t\",\"62\":\"\\\"\",\"63\":\",\",\"64\":\"\\\"\",\"65\":\"r\",\"66\":\"e\",\"67\":\"d\",\"68\":\"i\",\"69\":\"r\",\"70\":\"e\",\"71\":\"c\",\"72\":\"t\",\"73\":\"U\",\"74\":\"r\",\"75\":\"l\",\"76\":\"\\\"\",\"77\":\":\",\"78\":\"\\\"\",\"79\":\"h\",\"80\":\"t\",\"81\":\"t\",\"82\":\"p\",\"83\":\"s\",\"84\":\":\",\"85\":\"/\",\"86\":\"/\",\"87\":\"p\",\"88\":\"a\",\"89\":\"y\",\"90\":\".\",\"91\":\"p\",\"92\":\"e\",\"93\":\"s\",\"94\":\"a\",\"95\":\"p\",\"96\":\"a\",\"97\":\"l\",\"98\":\".\",\"99\":\"c\",\"100\":\"o\",\"101\":\"m\",\"102\":\"/\",\"103\":\"i\",\"104\":\"f\",\"105\":\"r\",\"106\":\"a\",\"107\":\"m\",\"108\":\"e\",\"109\":\"/\",\"110\":\"P\",\"111\":\"e\",\"112\":\"s\",\"113\":\"a\",\"114\":\"p\",\"115\":\"a\",\"116\":\"l\",\"117\":\"I\",\"118\":\"f\",\"119\":\"r\",\"120\":\"a\",\"121\":\"m\",\"122\":\"e\",\"123\":\"3\",\"124\":\"/\",\"125\":\"I\",\"126\":\"n\",\"127\":\"d\",\"128\":\"e\",\"129\":\"x\",\"130\":\"?\",\"131\":\"O\",\"132\":\"r\",\"133\":\"d\",\"134\":\"e\",\"135\":\"r\",\"136\":\"T\",\"137\":\"r\",\"138\":\"a\",\"139\":\"c\",\"140\":\"k\",\"141\":\"i\",\"142\":\"n\",\"143\":\"g\",\"144\":\"I\",\"145\":\"d\",\"146\":\"=\",\"147\":\"f\",\"148\":\"0\",\"149\":\"f\",\"150\":\"3\",\"151\":\"f\",\"152\":\"f\",\"153\":\"a\",\"154\":\"1\",\"155\":\"-\",\"156\":\"5\",\"157\":\"7\",\"158\":\"5\",\"159\":\"0\",\"160\":\"-\",\"161\":\"4\",\"162\":\"e\",\"163\":\"f\",\"164\":\"6\",\"165\":\"-\",\"166\":\"9\",\"167\":\"1\",\"168\":\"a\",\"169\":\"0\",\"170\":\"-\",\"171\":\"d\",\"172\":\"a\",\"173\":\"4\",\"174\":\"5\",\"175\":\"9\",\"176\":\"3\",\"177\":\"0\",\"178\":\"b\",\"179\":\"1\",\"180\":\"5\",\"181\":\"2\",\"182\":\"7\",\"183\":\"\\\"\",\"184\":\"}\",\"verificationRaw\":{\"payment_method\":\"\",\"amount\":30680,\"created_date\":\"2026-06-12T03:13:46.367\",\"confirmation_code\":\"\",\"order_tracking_id\":\"f0f3ffa1-5750-4ef6-91a0-da45930b1527\",\"payment_status_description\":\"INVALID\",\"description\":null,\"message\":\"Request processed successfully\",\"payment_account\":\"\",\"call_back_url\":\"http://localhost:3000/api/v1/payments/webhook?OrderTrackingId=f0f3ffa1-5750-4ef6-91a0-da45930b1527&OrderMerchantReference=TXN-1781223217650-7795\",\"status_code\":0,\"merchant_reference\":\"TXN-1781223217650-7795\",\"account_number\":null,\"payment_status_code\":\"\",\"currency\":\"UGX\",\"error\":{\"error_type\":\"api_error\",\"code\":\"payment_details_not_found\",\"message\":\"Pending Payment\",\"call_back_url\":\"http://localhost:3000/api/v1/payments/webhook?OrderTrackingId=f0f3ffa1-5750-4ef6-91a0-da45930b1527&OrderMerchantReference=TXN-1781223217650-7795\"},\"status\":\"500\"},\"paymentMethod\":\"\"}', '2026-06-12 00:13:37', '2026-06-12 00:13:52'),
(9, 'aef315e8-f07a-4078-8169-da45235bc635', 'TXN-1781224138983-7074', 5900.00, 'UGX', 'failed', '0758644682', '{\"0\":\"{\",\"1\":\"\\\"\",\"2\":\"d\",\"3\":\"e\",\"4\":\"s\",\"5\":\"c\",\"6\":\"r\",\"7\":\"i\",\"8\":\"p\",\"9\":\"t\",\"10\":\"i\",\"11\":\"o\",\"12\":\"n\",\"13\":\"\\\"\",\"14\":\":\",\"15\":\"\\\"\",\"16\":\"P\",\"17\":\"O\",\"18\":\"S\",\"19\":\" \",\"20\":\"C\",\"21\":\"h\",\"22\":\"e\",\"23\":\"c\",\"24\":\"k\",\"25\":\"o\",\"26\":\"u\",\"27\":\"t\",\"28\":\" \",\"29\":\"f\",\"30\":\"o\",\"31\":\"r\",\"32\":\" \",\"33\":\"A\",\"34\":\"n\",\"35\":\"d\",\"36\":\"r\",\"37\":\"e\",\"38\":\"w\",\"39\":\" \",\"40\":\"&\",\"41\":\" \",\"42\":\"B\",\"43\":\"r\",\"44\":\"o\",\"45\":\"t\",\"46\":\"h\",\"47\":\"e\",\"48\":\"r\",\"49\":\"s\",\"50\":\" \",\"51\":\"S\",\"52\":\"u\",\"53\":\"p\",\"54\":\"e\",\"55\":\"r\",\"56\":\"m\",\"57\":\"a\",\"58\":\"r\",\"59\":\"k\",\"60\":\"e\",\"61\":\"t\",\"62\":\"\\\"\",\"63\":\",\",\"64\":\"\\\"\",\"65\":\"r\",\"66\":\"e\",\"67\":\"d\",\"68\":\"i\",\"69\":\"r\",\"70\":\"e\",\"71\":\"c\",\"72\":\"t\",\"73\":\"U\",\"74\":\"r\",\"75\":\"l\",\"76\":\"\\\"\",\"77\":\":\",\"78\":\"\\\"\",\"79\":\"h\",\"80\":\"t\",\"81\":\"t\",\"82\":\"p\",\"83\":\"s\",\"84\":\":\",\"85\":\"/\",\"86\":\"/\",\"87\":\"p\",\"88\":\"a\",\"89\":\"y\",\"90\":\".\",\"91\":\"p\",\"92\":\"e\",\"93\":\"s\",\"94\":\"a\",\"95\":\"p\",\"96\":\"a\",\"97\":\"l\",\"98\":\".\",\"99\":\"c\",\"100\":\"o\",\"101\":\"m\",\"102\":\"/\",\"103\":\"i\",\"104\":\"f\",\"105\":\"r\",\"106\":\"a\",\"107\":\"m\",\"108\":\"e\",\"109\":\"/\",\"110\":\"P\",\"111\":\"e\",\"112\":\"s\",\"113\":\"a\",\"114\":\"p\",\"115\":\"a\",\"116\":\"l\",\"117\":\"I\",\"118\":\"f\",\"119\":\"r\",\"120\":\"a\",\"121\":\"m\",\"122\":\"e\",\"123\":\"3\",\"124\":\"/\",\"125\":\"I\",\"126\":\"n\",\"127\":\"d\",\"128\":\"e\",\"129\":\"x\",\"130\":\"?\",\"131\":\"O\",\"132\":\"r\",\"133\":\"d\",\"134\":\"e\",\"135\":\"r\",\"136\":\"T\",\"137\":\"r\",\"138\":\"a\",\"139\":\"c\",\"140\":\"k\",\"141\":\"i\",\"142\":\"n\",\"143\":\"g\",\"144\":\"I\",\"145\":\"d\",\"146\":\"=\",\"147\":\"a\",\"148\":\"e\",\"149\":\"f\",\"150\":\"3\",\"151\":\"1\",\"152\":\"5\",\"153\":\"e\",\"154\":\"8\",\"155\":\"-\",\"156\":\"f\",\"157\":\"0\",\"158\":\"7\",\"159\":\"a\",\"160\":\"-\",\"161\":\"4\",\"162\":\"0\",\"163\":\"7\",\"164\":\"8\",\"165\":\"-\",\"166\":\"8\",\"167\":\"1\",\"168\":\"6\",\"169\":\"9\",\"170\":\"-\",\"171\":\"d\",\"172\":\"a\",\"173\":\"4\",\"174\":\"5\",\"175\":\"2\",\"176\":\"3\",\"177\":\"5\",\"178\":\"b\",\"179\":\"c\",\"180\":\"6\",\"181\":\"3\",\"182\":\"5\",\"183\":\"\\\"\",\"184\":\"}\",\"verificationRaw\":{\"payment_method\":\"\",\"amount\":5900,\"created_date\":\"2026-06-12T03:29:01.803\",\"confirmation_code\":\"\",\"order_tracking_id\":\"aef315e8-f07a-4078-8169-da45235bc635\",\"payment_status_description\":\"INVALID\",\"description\":null,\"message\":\"Request processed successfully\",\"payment_account\":\"\",\"call_back_url\":\"http://172.20.10.4:3000/api/v1/payments/webhook?OrderTrackingId=aef315e8-f07a-4078-8169-da45235bc635&OrderMerchantReference=TXN-1781224138983-7074\",\"status_code\":0,\"merchant_reference\":\"TXN-1781224138983-7074\",\"account_number\":null,\"payment_status_code\":\"\",\"currency\":\"UGX\",\"error\":{\"error_type\":\"api_error\",\"code\":\"payment_details_not_found\",\"message\":\"Pending Payment\",\"call_back_url\":\"http://172.20.10.4:3000/api/v1/payments/webhook?OrderTrackingId=aef315e8-f07a-4078-8169-da45235bc635&OrderMerchantReference=TXN-1781224138983-7074\"},\"status\":\"500\"},\"paymentMethod\":\"\"}', '2026-06-12 00:28:58', '2026-06-12 00:29:07'),
(10, '0fc74a49-d61a-4557-9000-da453edf41ad', 'TXN-1781250422633-1012', 2950.00, 'UGX', 'failed', '0758644682', '{\"0\":\"{\",\"1\":\"\\\"\",\"2\":\"d\",\"3\":\"e\",\"4\":\"s\",\"5\":\"c\",\"6\":\"r\",\"7\":\"i\",\"8\":\"p\",\"9\":\"t\",\"10\":\"i\",\"11\":\"o\",\"12\":\"n\",\"13\":\"\\\"\",\"14\":\":\",\"15\":\"\\\"\",\"16\":\"P\",\"17\":\"O\",\"18\":\"S\",\"19\":\" \",\"20\":\"C\",\"21\":\"h\",\"22\":\"e\",\"23\":\"c\",\"24\":\"k\",\"25\":\"o\",\"26\":\"u\",\"27\":\"t\",\"28\":\" \",\"29\":\"f\",\"30\":\"o\",\"31\":\"r\",\"32\":\" \",\"33\":\"A\",\"34\":\"n\",\"35\":\"d\",\"36\":\"r\",\"37\":\"e\",\"38\":\"w\",\"39\":\" \",\"40\":\"&\",\"41\":\" \",\"42\":\"B\",\"43\":\"r\",\"44\":\"o\",\"45\":\"t\",\"46\":\"h\",\"47\":\"e\",\"48\":\"r\",\"49\":\"s\",\"50\":\" \",\"51\":\"S\",\"52\":\"u\",\"53\":\"p\",\"54\":\"e\",\"55\":\"r\",\"56\":\"m\",\"57\":\"a\",\"58\":\"r\",\"59\":\"k\",\"60\":\"e\",\"61\":\"t\",\"62\":\"\\\"\",\"63\":\",\",\"64\":\"\\\"\",\"65\":\"r\",\"66\":\"e\",\"67\":\"d\",\"68\":\"i\",\"69\":\"r\",\"70\":\"e\",\"71\":\"c\",\"72\":\"t\",\"73\":\"U\",\"74\":\"r\",\"75\":\"l\",\"76\":\"\\\"\",\"77\":\":\",\"78\":\"\\\"\",\"79\":\"h\",\"80\":\"t\",\"81\":\"t\",\"82\":\"p\",\"83\":\"s\",\"84\":\":\",\"85\":\"/\",\"86\":\"/\",\"87\":\"p\",\"88\":\"a\",\"89\":\"y\",\"90\":\".\",\"91\":\"p\",\"92\":\"e\",\"93\":\"s\",\"94\":\"a\",\"95\":\"p\",\"96\":\"a\",\"97\":\"l\",\"98\":\".\",\"99\":\"c\",\"100\":\"o\",\"101\":\"m\",\"102\":\"/\",\"103\":\"i\",\"104\":\"f\",\"105\":\"r\",\"106\":\"a\",\"107\":\"m\",\"108\":\"e\",\"109\":\"/\",\"110\":\"P\",\"111\":\"e\",\"112\":\"s\",\"113\":\"a\",\"114\":\"p\",\"115\":\"a\",\"116\":\"l\",\"117\":\"I\",\"118\":\"f\",\"119\":\"r\",\"120\":\"a\",\"121\":\"m\",\"122\":\"e\",\"123\":\"3\",\"124\":\"/\",\"125\":\"I\",\"126\":\"n\",\"127\":\"d\",\"128\":\"e\",\"129\":\"x\",\"130\":\"?\",\"131\":\"O\",\"132\":\"r\",\"133\":\"d\",\"134\":\"e\",\"135\":\"r\",\"136\":\"T\",\"137\":\"r\",\"138\":\"a\",\"139\":\"c\",\"140\":\"k\",\"141\":\"i\",\"142\":\"n\",\"143\":\"g\",\"144\":\"I\",\"145\":\"d\",\"146\":\"=\",\"147\":\"0\",\"148\":\"f\",\"149\":\"c\",\"150\":\"7\",\"151\":\"4\",\"152\":\"a\",\"153\":\"4\",\"154\":\"9\",\"155\":\"-\",\"156\":\"d\",\"157\":\"6\",\"158\":\"1\",\"159\":\"a\",\"160\":\"-\",\"161\":\"4\",\"162\":\"5\",\"163\":\"5\",\"164\":\"7\",\"165\":\"-\",\"166\":\"9\",\"167\":\"0\",\"168\":\"0\",\"169\":\"0\",\"170\":\"-\",\"171\":\"d\",\"172\":\"a\",\"173\":\"4\",\"174\":\"5\",\"175\":\"3\",\"176\":\"e\",\"177\":\"d\",\"178\":\"f\",\"179\":\"4\",\"180\":\"1\",\"181\":\"a\",\"182\":\"d\",\"183\":\"\\\"\",\"184\":\"}\",\"verificationRaw\":{\"payment_method\":\"\",\"amount\":2950,\"created_date\":\"2026-06-12T10:47:05.673\",\"confirmation_code\":\"\",\"order_tracking_id\":\"0fc74a49-d61a-4557-9000-da453edf41ad\",\"payment_status_description\":\"INVALID\",\"description\":null,\"message\":\"Request processed successfully\",\"payment_account\":\"\",\"call_back_url\":\"http://172.20.10.4:3000/api/v1/payments/webhook?OrderTrackingId=0fc74a49-d61a-4557-9000-da453edf41ad&OrderMerchantReference=TXN-1781250422633-1012\",\"status_code\":0,\"merchant_reference\":\"TXN-1781250422633-1012\",\"account_number\":null,\"payment_status_code\":\"\",\"currency\":\"UGX\",\"error\":{\"error_type\":\"api_error\",\"code\":\"payment_details_not_found\",\"message\":\"Pending Payment\",\"call_back_url\":\"http://172.20.10.4:3000/api/v1/payments/webhook?OrderTrackingId=0fc74a49-d61a-4557-9000-da453edf41ad&OrderMerchantReference=TXN-1781250422633-1012\"},\"status\":\"500\"},\"paymentMethod\":\"\"}', '2026-06-12 07:47:02', '2026-06-12 07:47:11'),
(11, NULL, 'TXN-1781250625213-1377', 8260.00, 'UGX', 'pending', '0782943973', '{\"description\":\"POS Checkout for Andrew & Brothers Supermarket\"}', '2026-06-12 07:50:25', '2026-06-12 07:50:25'),
(12, NULL, 'TXN-1781250652113-1494', 8260.00, 'UGX', 'pending', '0758644682', '{\"description\":\"POS Checkout for Andrew & Brothers Supermarket\"}', '2026-06-12 07:50:52', '2026-06-12 07:50:52'),
(13, '9b46a3f5-047e-43ab-bcef-da45fbf48b51', 'TXN-1781250717061-6760', 8260.00, 'UGX', 'failed', '0782943973', '{\"0\":\"{\",\"1\":\"\\\"\",\"2\":\"d\",\"3\":\"e\",\"4\":\"s\",\"5\":\"c\",\"6\":\"r\",\"7\":\"i\",\"8\":\"p\",\"9\":\"t\",\"10\":\"i\",\"11\":\"o\",\"12\":\"n\",\"13\":\"\\\"\",\"14\":\":\",\"15\":\"\\\"\",\"16\":\"P\",\"17\":\"O\",\"18\":\"S\",\"19\":\" \",\"20\":\"C\",\"21\":\"h\",\"22\":\"e\",\"23\":\"c\",\"24\":\"k\",\"25\":\"o\",\"26\":\"u\",\"27\":\"t\",\"28\":\" \",\"29\":\"f\",\"30\":\"o\",\"31\":\"r\",\"32\":\" \",\"33\":\"A\",\"34\":\"n\",\"35\":\"d\",\"36\":\"r\",\"37\":\"e\",\"38\":\"w\",\"39\":\" \",\"40\":\"&\",\"41\":\" \",\"42\":\"B\",\"43\":\"r\",\"44\":\"o\",\"45\":\"t\",\"46\":\"h\",\"47\":\"e\",\"48\":\"r\",\"49\":\"s\",\"50\":\" \",\"51\":\"S\",\"52\":\"u\",\"53\":\"p\",\"54\":\"e\",\"55\":\"r\",\"56\":\"m\",\"57\":\"a\",\"58\":\"r\",\"59\":\"k\",\"60\":\"e\",\"61\":\"t\",\"62\":\"\\\"\",\"63\":\",\",\"64\":\"\\\"\",\"65\":\"r\",\"66\":\"e\",\"67\":\"d\",\"68\":\"i\",\"69\":\"r\",\"70\":\"e\",\"71\":\"c\",\"72\":\"t\",\"73\":\"U\",\"74\":\"r\",\"75\":\"l\",\"76\":\"\\\"\",\"77\":\":\",\"78\":\"\\\"\",\"79\":\"h\",\"80\":\"t\",\"81\":\"t\",\"82\":\"p\",\"83\":\"s\",\"84\":\":\",\"85\":\"/\",\"86\":\"/\",\"87\":\"p\",\"88\":\"a\",\"89\":\"y\",\"90\":\".\",\"91\":\"p\",\"92\":\"e\",\"93\":\"s\",\"94\":\"a\",\"95\":\"p\",\"96\":\"a\",\"97\":\"l\",\"98\":\".\",\"99\":\"c\",\"100\":\"o\",\"101\":\"m\",\"102\":\"/\",\"103\":\"i\",\"104\":\"f\",\"105\":\"r\",\"106\":\"a\",\"107\":\"m\",\"108\":\"e\",\"109\":\"/\",\"110\":\"P\",\"111\":\"e\",\"112\":\"s\",\"113\":\"a\",\"114\":\"p\",\"115\":\"a\",\"116\":\"l\",\"117\":\"I\",\"118\":\"f\",\"119\":\"r\",\"120\":\"a\",\"121\":\"m\",\"122\":\"e\",\"123\":\"3\",\"124\":\"/\",\"125\":\"I\",\"126\":\"n\",\"127\":\"d\",\"128\":\"e\",\"129\":\"x\",\"130\":\"?\",\"131\":\"O\",\"132\":\"r\",\"133\":\"d\",\"134\":\"e\",\"135\":\"r\",\"136\":\"T\",\"137\":\"r\",\"138\":\"a\",\"139\":\"c\",\"140\":\"k\",\"141\":\"i\",\"142\":\"n\",\"143\":\"g\",\"144\":\"I\",\"145\":\"d\",\"146\":\"=\",\"147\":\"9\",\"148\":\"b\",\"149\":\"4\",\"150\":\"6\",\"151\":\"a\",\"152\":\"3\",\"153\":\"f\",\"154\":\"5\",\"155\":\"-\",\"156\":\"0\",\"157\":\"4\",\"158\":\"7\",\"159\":\"e\",\"160\":\"-\",\"161\":\"4\",\"162\":\"3\",\"163\":\"a\",\"164\":\"b\",\"165\":\"-\",\"166\":\"b\",\"167\":\"c\",\"168\":\"e\",\"169\":\"f\",\"170\":\"-\",\"171\":\"d\",\"172\":\"a\",\"173\":\"4\",\"174\":\"5\",\"175\":\"f\",\"176\":\"b\",\"177\":\"f\",\"178\":\"4\",\"179\":\"8\",\"180\":\"b\",\"181\":\"5\",\"182\":\"1\",\"183\":\"\\\"\",\"184\":\"}\",\"verificationRaw\":{\"payment_method\":\"\",\"amount\":8260,\"created_date\":\"2026-06-12T10:52:00.61\",\"confirmation_code\":\"\",\"order_tracking_id\":\"9b46a3f5-047e-43ab-bcef-da45fbf48b51\",\"payment_status_description\":\"INVALID\",\"description\":null,\"message\":\"Request processed successfully\",\"payment_account\":\"\",\"call_back_url\":\"https://yoursite.com/webhook?OrderTrackingId=9b46a3f5-047e-43ab-bcef-da45fbf48b51&OrderMerchantReference=TXN-1781250717061-6760\",\"status_code\":0,\"merchant_reference\":\"TXN-1781250717061-6760\",\"account_number\":null,\"payment_status_code\":\"\",\"currency\":\"UGX\",\"error\":{\"error_type\":\"api_error\",\"code\":\"payment_details_not_found\",\"message\":\"Pending Payment\",\"call_back_url\":\"https://yoursite.com/webhook?OrderTrackingId=9b46a3f5-047e-43ab-bcef-da45fbf48b51&OrderMerchantReference=TXN-1781250717061-6760\"},\"status\":\"500\"},\"paymentMethod\":\"\",\"lastPolled\":\"2026-06-12T07:52:06.453Z\"}', '2026-06-12 07:51:57', '2026-06-12 07:52:06'),
(14, '4def4582-d9f7-4582-ac08-da4557cd363b', 'TXN-1781256391675-1781', 588.00, 'UGX', 'failed', '0754351556', '{\"0\":\"{\",\"1\":\"\\\"\",\"2\":\"d\",\"3\":\"e\",\"4\":\"s\",\"5\":\"c\",\"6\":\"r\",\"7\":\"i\",\"8\":\"p\",\"9\":\"t\",\"10\":\"i\",\"11\":\"o\",\"12\":\"n\",\"13\":\"\\\"\",\"14\":\":\",\"15\":\"\\\"\",\"16\":\"P\",\"17\":\"O\",\"18\":\"S\",\"19\":\" \",\"20\":\"C\",\"21\":\"h\",\"22\":\"e\",\"23\":\"c\",\"24\":\"k\",\"25\":\"o\",\"26\":\"u\",\"27\":\"t\",\"28\":\" \",\"29\":\"f\",\"30\":\"o\",\"31\":\"r\",\"32\":\" \",\"33\":\"A\",\"34\":\"n\",\"35\":\"d\",\"36\":\"r\",\"37\":\"e\",\"38\":\"w\",\"39\":\" \",\"40\":\"&\",\"41\":\" \",\"42\":\"B\",\"43\":\"r\",\"44\":\"o\",\"45\":\"t\",\"46\":\"h\",\"47\":\"e\",\"48\":\"r\",\"49\":\"s\",\"50\":\" \",\"51\":\"S\",\"52\":\"u\",\"53\":\"p\",\"54\":\"e\",\"55\":\"r\",\"56\":\"m\",\"57\":\"a\",\"58\":\"r\",\"59\":\"k\",\"60\":\"e\",\"61\":\"t\",\"62\":\"\\\"\",\"63\":\",\",\"64\":\"\\\"\",\"65\":\"r\",\"66\":\"e\",\"67\":\"d\",\"68\":\"i\",\"69\":\"r\",\"70\":\"e\",\"71\":\"c\",\"72\":\"t\",\"73\":\"U\",\"74\":\"r\",\"75\":\"l\",\"76\":\"\\\"\",\"77\":\":\",\"78\":\"\\\"\",\"79\":\"h\",\"80\":\"t\",\"81\":\"t\",\"82\":\"p\",\"83\":\"s\",\"84\":\":\",\"85\":\"/\",\"86\":\"/\",\"87\":\"p\",\"88\":\"a\",\"89\":\"y\",\"90\":\".\",\"91\":\"p\",\"92\":\"e\",\"93\":\"s\",\"94\":\"a\",\"95\":\"p\",\"96\":\"a\",\"97\":\"l\",\"98\":\".\",\"99\":\"c\",\"100\":\"o\",\"101\":\"m\",\"102\":\"/\",\"103\":\"i\",\"104\":\"f\",\"105\":\"r\",\"106\":\"a\",\"107\":\"m\",\"108\":\"e\",\"109\":\"/\",\"110\":\"P\",\"111\":\"e\",\"112\":\"s\",\"113\":\"a\",\"114\":\"p\",\"115\":\"a\",\"116\":\"l\",\"117\":\"I\",\"118\":\"f\",\"119\":\"r\",\"120\":\"a\",\"121\":\"m\",\"122\":\"e\",\"123\":\"3\",\"124\":\"/\",\"125\":\"I\",\"126\":\"n\",\"127\":\"d\",\"128\":\"e\",\"129\":\"x\",\"130\":\"?\",\"131\":\"O\",\"132\":\"r\",\"133\":\"d\",\"134\":\"e\",\"135\":\"r\",\"136\":\"T\",\"137\":\"r\",\"138\":\"a\",\"139\":\"c\",\"140\":\"k\",\"141\":\"i\",\"142\":\"n\",\"143\":\"g\",\"144\":\"I\",\"145\":\"d\",\"146\":\"=\",\"147\":\"4\",\"148\":\"d\",\"149\":\"e\",\"150\":\"f\",\"151\":\"4\",\"152\":\"5\",\"153\":\"8\",\"154\":\"2\",\"155\":\"-\",\"156\":\"d\",\"157\":\"9\",\"158\":\"f\",\"159\":\"7\",\"160\":\"-\",\"161\":\"4\",\"162\":\"5\",\"163\":\"8\",\"164\":\"2\",\"165\":\"-\",\"166\":\"a\",\"167\":\"c\",\"168\":\"0\",\"169\":\"8\",\"170\":\"-\",\"171\":\"d\",\"172\":\"a\",\"173\":\"4\",\"174\":\"5\",\"175\":\"5\",\"176\":\"7\",\"177\":\"c\",\"178\":\"d\",\"179\":\"3\",\"180\":\"6\",\"181\":\"3\",\"182\":\"b\",\"183\":\"\\\"\",\"184\":\"}\",\"verificationRaw\":{\"payment_method\":\"\",\"amount\":588,\"created_date\":\"2026-06-12T12:26:33.853\",\"confirmation_code\":\"\",\"order_tracking_id\":\"4def4582-d9f7-4582-ac08-da4557cd363b\",\"payment_status_description\":\"INVALID\",\"description\":null,\"message\":\"Request processed successfully\",\"payment_account\":\"\",\"call_back_url\":\"https://yoursite.com/webhook?OrderTrackingId=4def4582-d9f7-4582-ac08-da4557cd363b&OrderMerchantReference=TXN-1781256391675-1781\",\"status_code\":0,\"merchant_reference\":\"TXN-1781256391675-1781\",\"account_number\":null,\"payment_status_code\":\"\",\"currency\":\"UGX\",\"error\":{\"error_type\":\"api_error\",\"code\":\"payment_details_not_found\",\"message\":\"Pending Payment\",\"call_back_url\":\"https://yoursite.com/webhook?OrderTrackingId=4def4582-d9f7-4582-ac08-da4557cd363b&OrderMerchantReference=TXN-1781256391675-1781\"},\"status\":\"500\"},\"paymentMethod\":\"\",\"lastPolled\":\"2026-06-12T09:26:39.670Z\"}', '2026-06-12 09:26:31', '2026-06-12 09:26:39'),
(15, '902e7202-1901-4611-8e76-da454803764f', 'TXN-1781256613127-2328', 1062.00, 'UGX', 'failed', '0754351556', '{\"0\":\"{\",\"1\":\"\\\"\",\"2\":\"d\",\"3\":\"e\",\"4\":\"s\",\"5\":\"c\",\"6\":\"r\",\"7\":\"i\",\"8\":\"p\",\"9\":\"t\",\"10\":\"i\",\"11\":\"o\",\"12\":\"n\",\"13\":\"\\\"\",\"14\":\":\",\"15\":\"\\\"\",\"16\":\"P\",\"17\":\"O\",\"18\":\"S\",\"19\":\" \",\"20\":\"C\",\"21\":\"h\",\"22\":\"e\",\"23\":\"c\",\"24\":\"k\",\"25\":\"o\",\"26\":\"u\",\"27\":\"t\",\"28\":\" \",\"29\":\"f\",\"30\":\"o\",\"31\":\"r\",\"32\":\" \",\"33\":\"A\",\"34\":\"n\",\"35\":\"d\",\"36\":\"r\",\"37\":\"e\",\"38\":\"w\",\"39\":\" \",\"40\":\"&\",\"41\":\" \",\"42\":\"B\",\"43\":\"r\",\"44\":\"o\",\"45\":\"t\",\"46\":\"h\",\"47\":\"e\",\"48\":\"r\",\"49\":\"s\",\"50\":\" \",\"51\":\"S\",\"52\":\"u\",\"53\":\"p\",\"54\":\"e\",\"55\":\"r\",\"56\":\"m\",\"57\":\"a\",\"58\":\"r\",\"59\":\"k\",\"60\":\"e\",\"61\":\"t\",\"62\":\"\\\"\",\"63\":\",\",\"64\":\"\\\"\",\"65\":\"r\",\"66\":\"e\",\"67\":\"d\",\"68\":\"i\",\"69\":\"r\",\"70\":\"e\",\"71\":\"c\",\"72\":\"t\",\"73\":\"U\",\"74\":\"r\",\"75\":\"l\",\"76\":\"\\\"\",\"77\":\":\",\"78\":\"\\\"\",\"79\":\"h\",\"80\":\"t\",\"81\":\"t\",\"82\":\"p\",\"83\":\"s\",\"84\":\":\",\"85\":\"/\",\"86\":\"/\",\"87\":\"p\",\"88\":\"a\",\"89\":\"y\",\"90\":\".\",\"91\":\"p\",\"92\":\"e\",\"93\":\"s\",\"94\":\"a\",\"95\":\"p\",\"96\":\"a\",\"97\":\"l\",\"98\":\".\",\"99\":\"c\",\"100\":\"o\",\"101\":\"m\",\"102\":\"/\",\"103\":\"i\",\"104\":\"f\",\"105\":\"r\",\"106\":\"a\",\"107\":\"m\",\"108\":\"e\",\"109\":\"/\",\"110\":\"P\",\"111\":\"e\",\"112\":\"s\",\"113\":\"a\",\"114\":\"p\",\"115\":\"a\",\"116\":\"l\",\"117\":\"I\",\"118\":\"f\",\"119\":\"r\",\"120\":\"a\",\"121\":\"m\",\"122\":\"e\",\"123\":\"3\",\"124\":\"/\",\"125\":\"I\",\"126\":\"n\",\"127\":\"d\",\"128\":\"e\",\"129\":\"x\",\"130\":\"?\",\"131\":\"O\",\"132\":\"r\",\"133\":\"d\",\"134\":\"e\",\"135\":\"r\",\"136\":\"T\",\"137\":\"r\",\"138\":\"a\",\"139\":\"c\",\"140\":\"k\",\"141\":\"i\",\"142\":\"n\",\"143\":\"g\",\"144\":\"I\",\"145\":\"d\",\"146\":\"=\",\"147\":\"9\",\"148\":\"0\",\"149\":\"2\",\"150\":\"e\",\"151\":\"7\",\"152\":\"2\",\"153\":\"0\",\"154\":\"2\",\"155\":\"-\",\"156\":\"1\",\"157\":\"9\",\"158\":\"0\",\"159\":\"1\",\"160\":\"-\",\"161\":\"4\",\"162\":\"6\",\"163\":\"1\",\"164\":\"1\",\"165\":\"-\",\"166\":\"8\",\"167\":\"e\",\"168\":\"7\",\"169\":\"6\",\"170\":\"-\",\"171\":\"d\",\"172\":\"a\",\"173\":\"4\",\"174\":\"5\",\"175\":\"4\",\"176\":\"8\",\"177\":\"0\",\"178\":\"3\",\"179\":\"7\",\"180\":\"6\",\"181\":\"4\",\"182\":\"f\",\"183\":\"\\\"\",\"184\":\"}\",\"verificationRaw\":{\"payment_method\":\"\",\"amount\":1062,\"created_date\":\"2026-06-12T12:30:14.613\",\"confirmation_code\":\"\",\"order_tracking_id\":\"902e7202-1901-4611-8e76-da454803764f\",\"payment_status_description\":\"INVALID\",\"description\":null,\"message\":\"Request processed successfully\",\"payment_account\":\"\",\"call_back_url\":\"https://yoursite.com/webhook?OrderTrackingId=902e7202-1901-4611-8e76-da454803764f&OrderMerchantReference=TXN-1781256613127-2328\",\"status_code\":0,\"merchant_reference\":\"TXN-1781256613127-2328\",\"account_number\":null,\"payment_status_code\":\"\",\"currency\":\"UGX\",\"error\":{\"error_type\":\"api_error\",\"code\":\"payment_details_not_found\",\"message\":\"Pending Payment\",\"call_back_url\":\"https://yoursite.com/webhook?OrderTrackingId=902e7202-1901-4611-8e76-da454803764f&OrderMerchantReference=TXN-1781256613127-2328\"},\"status\":\"500\"},\"paymentMethod\":\"\",\"lastPolled\":\"2026-06-12T09:30:20.211Z\"}', '2026-06-12 09:30:13', '2026-06-12 09:30:20'),
(16, 'd8992795-3977-45d0-a384-da450813b4f6', 'TXN-1781256679207-1092', 1062.00, 'UGX', 'failed', '0754351556', '{\"0\":\"{\",\"1\":\"\\\"\",\"2\":\"d\",\"3\":\"e\",\"4\":\"s\",\"5\":\"c\",\"6\":\"r\",\"7\":\"i\",\"8\":\"p\",\"9\":\"t\",\"10\":\"i\",\"11\":\"o\",\"12\":\"n\",\"13\":\"\\\"\",\"14\":\":\",\"15\":\"\\\"\",\"16\":\"P\",\"17\":\"O\",\"18\":\"S\",\"19\":\" \",\"20\":\"C\",\"21\":\"h\",\"22\":\"e\",\"23\":\"c\",\"24\":\"k\",\"25\":\"o\",\"26\":\"u\",\"27\":\"t\",\"28\":\" \",\"29\":\"f\",\"30\":\"o\",\"31\":\"r\",\"32\":\" \",\"33\":\"A\",\"34\":\"n\",\"35\":\"d\",\"36\":\"r\",\"37\":\"e\",\"38\":\"w\",\"39\":\" \",\"40\":\"&\",\"41\":\" \",\"42\":\"B\",\"43\":\"r\",\"44\":\"o\",\"45\":\"t\",\"46\":\"h\",\"47\":\"e\",\"48\":\"r\",\"49\":\"s\",\"50\":\" \",\"51\":\"S\",\"52\":\"u\",\"53\":\"p\",\"54\":\"e\",\"55\":\"r\",\"56\":\"m\",\"57\":\"a\",\"58\":\"r\",\"59\":\"k\",\"60\":\"e\",\"61\":\"t\",\"62\":\"\\\"\",\"63\":\",\",\"64\":\"\\\"\",\"65\":\"r\",\"66\":\"e\",\"67\":\"d\",\"68\":\"i\",\"69\":\"r\",\"70\":\"e\",\"71\":\"c\",\"72\":\"t\",\"73\":\"U\",\"74\":\"r\",\"75\":\"l\",\"76\":\"\\\"\",\"77\":\":\",\"78\":\"\\\"\",\"79\":\"h\",\"80\":\"t\",\"81\":\"t\",\"82\":\"p\",\"83\":\"s\",\"84\":\":\",\"85\":\"/\",\"86\":\"/\",\"87\":\"p\",\"88\":\"a\",\"89\":\"y\",\"90\":\".\",\"91\":\"p\",\"92\":\"e\",\"93\":\"s\",\"94\":\"a\",\"95\":\"p\",\"96\":\"a\",\"97\":\"l\",\"98\":\".\",\"99\":\"c\",\"100\":\"o\",\"101\":\"m\",\"102\":\"/\",\"103\":\"i\",\"104\":\"f\",\"105\":\"r\",\"106\":\"a\",\"107\":\"m\",\"108\":\"e\",\"109\":\"/\",\"110\":\"P\",\"111\":\"e\",\"112\":\"s\",\"113\":\"a\",\"114\":\"p\",\"115\":\"a\",\"116\":\"l\",\"117\":\"I\",\"118\":\"f\",\"119\":\"r\",\"120\":\"a\",\"121\":\"m\",\"122\":\"e\",\"123\":\"3\",\"124\":\"/\",\"125\":\"I\",\"126\":\"n\",\"127\":\"d\",\"128\":\"e\",\"129\":\"x\",\"130\":\"?\",\"131\":\"O\",\"132\":\"r\",\"133\":\"d\",\"134\":\"e\",\"135\":\"r\",\"136\":\"T\",\"137\":\"r\",\"138\":\"a\",\"139\":\"c\",\"140\":\"k\",\"141\":\"i\",\"142\":\"n\",\"143\":\"g\",\"144\":\"I\",\"145\":\"d\",\"146\":\"=\",\"147\":\"d\",\"148\":\"8\",\"149\":\"9\",\"150\":\"9\",\"151\":\"2\",\"152\":\"7\",\"153\":\"9\",\"154\":\"5\",\"155\":\"-\",\"156\":\"3\",\"157\":\"9\",\"158\":\"7\",\"159\":\"7\",\"160\":\"-\",\"161\":\"4\",\"162\":\"5\",\"163\":\"d\",\"164\":\"0\",\"165\":\"-\",\"166\":\"a\",\"167\":\"3\",\"168\":\"8\",\"169\":\"4\",\"170\":\"-\",\"171\":\"d\",\"172\":\"a\",\"173\":\"4\",\"174\":\"5\",\"175\":\"0\",\"176\":\"8\",\"177\":\"1\",\"178\":\"3\",\"179\":\"b\",\"180\":\"4\",\"181\":\"f\",\"182\":\"6\",\"183\":\"\\\"\",\"184\":\"}\",\"verificationRaw\":{\"payment_method\":\"\",\"amount\":1062,\"created_date\":\"2026-06-12T12:31:20.67\",\"confirmation_code\":\"\",\"order_tracking_id\":\"d8992795-3977-45d0-a384-da450813b4f6\",\"payment_status_description\":\"INVALID\",\"description\":null,\"message\":\"Request processed successfully\",\"payment_account\":\"\",\"call_back_url\":\"https://yoursite.com/webhook?OrderTrackingId=d8992795-3977-45d0-a384-da450813b4f6&OrderMerchantReference=TXN-1781256679207-1092\",\"status_code\":0,\"merchant_reference\":\"TXN-1781256679207-1092\",\"account_number\":null,\"payment_status_code\":\"\",\"currency\":\"UGX\",\"error\":{\"error_type\":\"api_error\",\"code\":\"payment_details_not_found\",\"message\":\"Pending Payment\",\"call_back_url\":\"https://yoursite.com/webhook?OrderTrackingId=d8992795-3977-45d0-a384-da450813b4f6&OrderMerchantReference=TXN-1781256679207-1092\"},\"status\":\"500\"},\"paymentMethod\":\"\",\"lastPolled\":\"2026-06-12T09:31:27.528Z\"}', '2026-06-12 09:31:19', '2026-06-12 09:31:27'),
(17, NULL, 'TXN-1781256869667-6096', 1062.00, 'UGX', 'pending', '0754351556', '{\"description\":\"POS Checkout for Andrew & Brothers Supermarket\"}', '2026-06-12 09:34:29', '2026-06-12 09:34:29'),
(18, NULL, 'TXN-1781256881809-7255', 1062.00, 'UGX', 'pending', '0754351556', '{\"description\":\"POS Checkout for Andrew & Brothers Supermarket\"}', '2026-06-12 09:34:41', '2026-06-12 09:34:41');

-- --------------------------------------------------------

--
-- Table structure for table `price_history`
--

CREATE TABLE `price_history` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `product_id` bigint(20) UNSIGNED NOT NULL,
  `old_price` decimal(12,2) NOT NULL,
  `new_price` decimal(12,2) NOT NULL,
  `changed_by` bigint(20) UNSIGNED NOT NULL,
  `changed_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `price_history`
--

INSERT INTO `price_history` (`id`, `product_id`, `old_price`, `new_price`, `changed_by`, `changed_at`) VALUES
(1, 1, 0.00, 4000.00, 1, '2026-04-26 19:19:59'),
(2, 2, 0.00, 1000.00, 5, '2026-04-30 13:08:10'),
(3, 1, 4000.00, 4000.00, 5, '2026-05-01 10:49:07'),
(4, 3, 0.00, 26000.00, 1, '2026-05-02 17:00:56'),
(5, 3, 26000.00, 26000.00, 1, '2026-05-02 17:03:07'),
(6, 4, 0.00, 2000.00, 5, '2026-05-03 18:12:15'),
(7, 5, 0.00, 1500.00, 1, '2026-05-05 15:14:30'),
(8, 6, 0.00, 500.00, 1, '2026-05-15 08:05:00'),
(9, 7, 0.00, 2000.00, 5, '2026-05-15 11:21:01'),
(10, 8, 0.00, 900.00, 5, '2026-05-16 15:39:04'),
(11, 9, 0.00, 498.00, 5, '2026-05-16 17:26:57'),
(12, 10, 0.00, 2500.00, 5, '2026-05-16 17:47:29'),
(13, 11, 0.00, 7000.00, 5, '2026-05-17 19:15:50'),
(14, 12, 0.00, 5000.00, 5, '2026-05-17 19:27:20'),
(15, 13, 0.00, 994.00, 5, '2026-05-18 10:24:34'),
(16, 14, 0.00, 5000.00, 5, '2026-05-18 12:05:10'),
(17, 15, 0.00, 7000.00, 5, '2026-05-18 12:10:34'),
(18, 16, 0.00, 3000.00, 5, '2026-06-11 08:50:31');

-- --------------------------------------------------------

--
-- Table structure for table `products`
--

CREATE TABLE `products` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(200) NOT NULL,
  `sku` varchar(100) NOT NULL,
  `barcode` varchar(100) DEFAULT NULL,
  `category_id` int(10) UNSIGNED NOT NULL,
  `unit_price` decimal(12,2) NOT NULL,
  `cost_price` decimal(12,2) NOT NULL,
  `supplier_id` int(10) UNSIGNED DEFAULT NULL,
  `reorder_point` int(10) UNSIGNED DEFAULT 5,
  `unit_of_measure` varchar(30) DEFAULT 'pcs',
  `expiry_date` date DEFAULT NULL,
  `location` varchar(100) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `is_deleted` tinyint(1) DEFAULT 0,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `products`
--

INSERT INTO `products` (`id`, `name`, `sku`, `barcode`, `category_id`, `unit_price`, `cost_price`, `supplier_id`, `reorder_point`, `unit_of_measure`, `expiry_date`, `location`, `is_active`, `is_deleted`, `created_at`, `updated_at`) VALUES
(1, 'dolo', '2', '345678', 3, 4000.00, 2000.00, 1, 80, 'pcs', '2026-08-08', 'shelf A', 1, 0, '2026-04-26 19:19:59', '2026-05-01 10:49:07'),
(2, 'sugar kakira', 'dev001', '10000001', 6, 1000.00, 25000.00, 1, 50, 'kg', '2026-04-30', 'Shelf A', 1, 0, '2026-04-30 13:08:10', '2026-04-30 13:08:10'),
(3, 'Amara', 'dev-2', '6161100043671', 5, 26000.00, 20000.00, 4, 50, 'pcs', '2027-07-23', 'Shelf B', 1, 0, '2026-05-02 17:00:56', '2026-05-02 17:03:07'),
(4, 'Rwenzori water', 'water', NULL, 9, 2000.00, 1800.00, 1, 20, 'pcs', NULL, 'L2', 1, 0, '2026-05-03 18:12:15', '2026-05-03 18:12:15'),
(5, 'nivana water bootle', 'SKU-1777994070037-77', '6164001011480', 9, 1500.00, 1000.00, 1, 50, 'pcs', '2027-05-07', 'shelf b', 1, 0, '2026-05-05 15:14:30', '2026-05-05 15:14:30'),
(6, 'pens', 'SKU-1778832300185-0-86', '6164001011481', 7, 500.00, 1000.00, 3, 5, 'box', NULL, NULL, 1, 0, '2026-05-15 08:05:00', '2026-05-15 08:05:00'),
(7, 'book', 'SKU-1778844061783-419', '608119536221', 7, 2000.00, 20000.00, 5, 47, 'box', '2030-11-15', 'shelf D', 1, 0, '2026-05-15 11:21:01', '2026-05-15 11:21:01'),
(8, 'nivana small', 'SKU-1778945944579-464', '140401011301', 9, 900.00, 500.00, 1, 4, 'box', '2027-03-11', 'shelfE', 1, 0, '2026-05-16 15:39:04', '2026-05-16 15:39:04'),
(9, 'nivana katoto', 'SKU-1778952417669-509', '9730861011051', 1, 498.00, 300.00, 1, 2, 'box', '2026-12-05', 'shelf F', 1, 0, '2026-05-16 17:26:57', '2026-05-16 17:26:57'),
(10, 'water', 'SKU-1778953649497-499', '6164001011305', 9, 2500.00, 1800.00, 3, 20, 'pcs', '2026-05-16', 'shelfq', 1, 0, '2026-05-16 17:47:29', '2026-05-16 17:47:29'),
(11, 'rebina juice', 'SKU-1779045350418-63', '6164003477444', 1, 7000.00, 5000.00, 1, 11, 'pcs', '2026-05-31', 'shelf G', 1, 0, '2026-05-17 19:15:50', '2026-05-17 19:15:50'),
(12, 'yorghut', 'SKU-1779046040392-811', '6009636790563', 2, 5000.00, 3000.00, NULL, 7, 'pcs', '2026-09-30', 'shelf G', 1, 0, '2026-05-17 19:27:20', '2026-05-17 19:27:20'),
(13, 'cococola', 'SKU-1779099874553-16', '42105244', 1, 994.00, 700.00, 1, 3, 'carton', '2026-10-14', 'shelf G', 1, 0, '2026-05-18 10:24:34', '2026-05-18 10:24:34'),
(14, 'guiness', 'SKU-1779105910421-375', NULL, 1, 5000.00, 3000.00, 2, 5, 'carton', '2026-06-11', 'shelf H', 1, 0, '2026-05-18 12:05:10', '2026-05-18 12:05:10'),
(15, 'nescafe', 'SKU-1779106234680-906', '7891000260449', 2, 7000.00, 5000.00, 5, 33, 'box', '2026-06-24', 'shelf G', 1, 0, '2026-05-18 12:10:34', '2026-05-18 12:10:34'),
(16, 'charger', 'SKU-1781167831872-553', NULL, 7, 3000.00, 5000.00, 5, 9, 'box', '2026-06-19', 'shelf g', 1, 0, '2026-06-11 08:50:31', '2026-06-11 08:50:31');

-- --------------------------------------------------------

--
-- Table structure for table `promotions`
--

CREATE TABLE `promotions` (
  `id` int(10) UNSIGNED NOT NULL,
  `name` varchar(150) NOT NULL,
  `product_id` bigint(20) UNSIGNED DEFAULT NULL,
  `category_id` int(10) UNSIGNED DEFAULT NULL,
  `discount_type` enum('percentage','fixed') NOT NULL,
  `discount_value` decimal(10,2) NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_by` bigint(20) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `promotions`
--

INSERT INTO `promotions` (`id`, `name`, `product_id`, `category_id`, `discount_type`, `discount_value`, `start_date`, `end_date`, `is_active`, `created_by`) VALUES
(1, 'nivana pro', 5, NULL, 'percentage', 20.00, '2026-05-08', '2026-05-15', 1, 1),
(2, 'dondolo', 4, NULL, 'percentage', 4.00, '2026-05-15', '2026-05-26', 1, 1);

-- --------------------------------------------------------

--
-- Table structure for table `purchase_orders`
--

CREATE TABLE `purchase_orders` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `supplier_id` int(10) UNSIGNED NOT NULL,
  `created_by` bigint(20) UNSIGNED NOT NULL,
  `status` enum('draft','confirmed','partially_received','received','cancelled') NOT NULL DEFAULT 'draft',
  `notes` text DEFAULT NULL,
  `expected_at` date DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `request_id` bigint(20) UNSIGNED DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `purchase_orders`
--

INSERT INTO `purchase_orders` (`id`, `supplier_id`, `created_by`, `status`, `notes`, `expected_at`, `created_at`, `updated_at`, `request_id`) VALUES
(1, 1, 1, 'draft', 'tmr', '2026-02-05', '2026-05-04 12:44:38', '2026-05-04 12:44:38', 3);

-- --------------------------------------------------------

--
-- Table structure for table `purchase_order_items`
--

CREATE TABLE `purchase_order_items` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `po_id` bigint(20) UNSIGNED NOT NULL,
  `product_id` bigint(20) UNSIGNED NOT NULL,
  `quantity_ordered` int(10) UNSIGNED NOT NULL,
  `quantity_received` int(10) UNSIGNED DEFAULT 0,
  `cost_price` decimal(12,2) NOT NULL,
  `batch_number` varchar(100) DEFAULT NULL,
  `expiry_date` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `purchase_order_items`
--

INSERT INTO `purchase_order_items` (`id`, `po_id`, `product_id`, `quantity_ordered`, `quantity_received`, `cost_price`, `batch_number`, `expiry_date`) VALUES
(1, 1, 4, 20, 0, 2000.00, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `purchase_requests`
--

CREATE TABLE `purchase_requests` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `created_by` bigint(20) UNSIGNED NOT NULL,
  `approved_by` bigint(20) UNSIGNED DEFAULT NULL,
  `status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  `notes` text DEFAULT NULL,
  `reason` text DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT 0,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `purchase_requests`
--

INSERT INTO `purchase_requests` (`id`, `created_by`, `approved_by`, `status`, `notes`, `reason`, `is_deleted`, `created_at`, `updated_at`) VALUES
(1, 5, 1, 'approved', 'Priority: medium', 'urgent', 0, '2026-05-04 12:13:41', '2026-05-04 12:22:57'),
(2, 1, 1, 'rejected', 'Priority: urgent', 'needed', 0, '2026-05-04 12:29:01', '2026-05-04 12:31:45'),
(3, 1, 1, 'approved', 'Priority: medium', 'needed', 0, '2026-05-04 12:32:11', '2026-05-04 12:32:44'),
(4, 5, 1, 'approved', 'Priority: medium', 'urgent', 0, '2026-05-05 15:22:45', '2026-05-05 15:24:07');

-- --------------------------------------------------------

--
-- Table structure for table `purchase_request_items`
--

CREATE TABLE `purchase_request_items` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `request_id` bigint(20) UNSIGNED NOT NULL,
  `product_id` bigint(20) UNSIGNED NOT NULL,
  `quantity_requested` int(10) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `purchase_request_items`
--

INSERT INTO `purchase_request_items` (`id`, `request_id`, `product_id`, `quantity_requested`) VALUES
(1, 1, 3, 100),
(2, 2, 1, 100),
(3, 3, 4, 20),
(4, 4, 5, 4000);

-- --------------------------------------------------------

--
-- Table structure for table `returns`
--

CREATE TABLE `returns` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `transaction_id` bigint(20) UNSIGNED NOT NULL,
  `product_id` bigint(20) UNSIGNED NOT NULL,
  `quantity` int(10) UNSIGNED NOT NULL,
  `condition_type` enum('resale','damaged') NOT NULL,
  `reason` varchar(255) NOT NULL,
  `refund_amount` decimal(12,2) NOT NULL,
  `processed_by` bigint(20) UNSIGNED NOT NULL,
  `authorized_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `sales_transactions`
--

CREATE TABLE `sales_transactions` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `receipt_number` varchar(30) NOT NULL,
  `cashier_id` bigint(20) UNSIGNED NOT NULL,
  `cash_session_id` bigint(20) UNSIGNED DEFAULT NULL,
  `device_id` bigint(20) UNSIGNED DEFAULT NULL,
  `total_amount` decimal(12,2) NOT NULL,
  `tax_amount` decimal(12,2) NOT NULL,
  `discount_amount` decimal(12,2) DEFAULT 0.00,
  `payment_method` enum('cash','mtn_momo','airtel_money') NOT NULL,
  `momo_reference` varchar(100) DEFAULT NULL,
  `amount_tendered` decimal(12,2) DEFAULT NULL,
  `change_given` decimal(12,2) DEFAULT NULL,
  `status` enum('completed','voided','refunded') DEFAULT 'completed',
  `void_reason` text DEFAULT NULL,
  `voided_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `sales_transactions`
--

INSERT INTO `sales_transactions` (`id`, `receipt_number`, `cashier_id`, `cash_session_id`, `device_id`, `total_amount`, `tax_amount`, `discount_amount`, `payment_method`, `momo_reference`, `amount_tendered`, `change_given`, `status`, `void_reason`, `voided_by`, `created_at`, `updated_at`) VALUES
(10, 'REC-20260430-0001', 3, 10, NULL, 1180.00, 180.00, 0.00, 'cash', NULL, 1180.00, 0.00, 'completed', NULL, NULL, '2026-04-30 17:26:38', '2026-04-30 17:26:38'),
(11, 'REC-20260501-0001', 3, 10, NULL, -1180.00, -180.00, 0.00, 'cash', NULL, -1180.00, 1180.00, 'completed', NULL, NULL, '2026-05-01 07:12:33', '2026-05-01 07:12:33'),
(12, 'REC-20260501-0002', 3, 10, NULL, 59000.00, 9000.00, 0.00, 'cash', NULL, 59000.00, 0.00, 'completed', NULL, NULL, '2026-05-01 08:23:50', '2026-05-01 08:23:50'),
(13, 'REC-20260501-0003', 3, 10, NULL, 23600.00, 3600.00, 0.00, 'cash', NULL, 23600.00, 0.00, 'completed', NULL, NULL, '2026-05-01 08:25:45', '2026-05-01 08:25:45'),
(14, 'REC-20260502-0001', 3, 11, NULL, 245440.00, 37440.00, 0.00, 'cash', NULL, 245440.00, 0.00, 'completed', NULL, NULL, '2026-05-02 17:13:07', '2026-05-02 17:13:07'),
(15, 'REC-20260502-0002', 3, 11, NULL, 61360.00, 9360.00, 0.00, 'airtel_money', NULL, 61360.00, 0.00, 'completed', NULL, NULL, '2026-05-02 17:23:33', '2026-05-02 17:23:33'),
(16, 'REC-20260502-0003', 3, 11, NULL, 10093720.00, 1539720.00, 0.00, 'cash', NULL, 12241320.00, 2147600.00, 'completed', NULL, NULL, '2026-05-02 17:38:36', '2026-05-02 17:38:36'),
(17, 'REC-20260502-0004', 3, 12, NULL, 5522400.00, 842400.00, 0.00, 'cash', NULL, 5522400.00, 0.00, 'completed', NULL, NULL, '2026-05-02 19:54:57', '2026-05-02 19:54:57'),
(18, 'REC-20260502-0005', 3, 12, NULL, 490880.00, 74880.00, 0.00, 'cash', NULL, 490880.00, 0.00, 'completed', NULL, NULL, '2026-05-02 20:14:42', '2026-05-02 20:14:42'),
(19, 'REC-20260505-0001', 3, 15, NULL, 1180.00, 180.00, 0.00, 'cash', NULL, 1180.00, 0.00, 'completed', NULL, NULL, '2026-05-05 15:07:09', '2026-05-05 15:07:09'),
(20, 'REC-20260505-0002', 3, 15, NULL, 1180.00, 180.00, 0.00, 'cash', NULL, 50000.00, 48820.00, 'completed', NULL, NULL, '2026-05-05 15:08:16', '2026-05-05 15:08:16'),
(21, 'REC-20260505-0003', 3, 15, NULL, 12390.00, 1890.00, 0.00, 'cash', NULL, 12390.00, 0.00, 'completed', NULL, NULL, '2026-05-05 15:16:16', '2026-05-05 15:16:16'),
(22, 'REC-20260515-0001', 1, 13, NULL, 2000.00, 0.00, 0.00, 'cash', NULL, 2000.00, 0.00, 'completed', NULL, NULL, '2026-05-15 11:24:57', '2026-05-15 11:24:57'),
(23, 'REC-20260516-0001', 3, 15, NULL, 1062.00, 162.00, 0.00, 'cash', NULL, 10000.00, 8938.00, 'completed', NULL, NULL, '2026-05-16 15:46:41', '2026-05-16 15:46:41'),
(24, 'REC-20260517-0001', 3, 15, NULL, 107380.00, 16380.00, 0.00, 'cash', NULL, 200000.00, 92620.00, 'completed', NULL, NULL, '2026-05-17 19:19:14', '2026-05-17 19:19:14'),
(25, 'REC-20260518-0001', 3, 15, NULL, 3519.00, 537.00, 0.00, 'cash', NULL, 10000.00, 6481.00, 'completed', NULL, NULL, '2026-05-18 10:27:20', '2026-05-18 10:27:20'),
(26, 'REC-20260518-0002', 3, 15, NULL, 11800.00, 1800.00, 0.00, 'cash', NULL, 20000.00, 8200.00, 'completed', NULL, NULL, '2026-05-18 10:28:39', '2026-05-18 10:28:39'),
(27, 'REC-20260518-0003', 3, 15, NULL, 24780.00, 3780.00, 0.00, 'cash', NULL, 50000.00, 25220.00, 'completed', NULL, NULL, '2026-05-18 12:12:45', '2026-05-18 12:12:45'),
(28, 'REC-20260522-0001', 3, 15, NULL, 588.00, 90.00, 0.00, 'cash', NULL, 5000.00, 4412.00, 'completed', NULL, NULL, '2026-05-22 10:15:55', '2026-05-22 10:15:55'),
(29, 'REC-20260522-0002', 3, 15, NULL, 5900.00, 900.00, 0.00, 'cash', NULL, 10000.00, 4100.00, 'completed', NULL, NULL, '2026-05-22 10:20:02', '2026-05-22 10:20:02'),
(30, 'REC-20260611-0001', 3, 15, NULL, 3540.00, 540.00, 0.00, 'cash', NULL, 10000.00, 6460.00, 'completed', NULL, NULL, '2026-06-11 08:55:13', '2026-06-11 08:55:13'),
(33, 'REC-20260612-0001', 3, 16, NULL, 2950.00, 450.00, 0.00, 'cash', NULL, 2950.00, 0.00, 'completed', NULL, NULL, '2026-06-12 07:48:13', '2026-06-12 07:48:13');

-- --------------------------------------------------------

--
-- Table structure for table `sale_items`
--

CREATE TABLE `sale_items` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `transaction_id` bigint(20) UNSIGNED NOT NULL,
  `product_id` bigint(20) UNSIGNED NOT NULL,
  `quantity` int(10) UNSIGNED NOT NULL,
  `unit_price` decimal(12,2) NOT NULL,
  `cost_price` decimal(12,2) NOT NULL,
  `discount_amount` decimal(12,2) DEFAULT 0.00,
  `subtotal` decimal(12,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `sale_items`
--

INSERT INTO `sale_items` (`id`, `transaction_id`, `product_id`, `quantity`, `unit_price`, `cost_price`, `discount_amount`, `subtotal`) VALUES
(2, 10, 2, 1, 1000.00, 25000.00, 0.00, 1000.00),
(3, 11, 2, 1, -1000.00, 25000.00, 0.00, -1000.00),
(4, 12, 1, 10, 4000.00, 2000.00, 0.00, 40000.00),
(5, 12, 2, 10, 1000.00, 25000.00, 0.00, 10000.00),
(6, 13, 1, 3, 4000.00, 2000.00, 0.00, 12000.00),
(7, 13, 2, 8, 1000.00, 25000.00, 0.00, 8000.00),
(8, 14, 3, 8, 26000.00, 20000.00, 0.00, 208000.00),
(9, 15, 3, 2, 26000.00, 20000.00, 0.00, 52000.00),
(10, 16, 3, 329, 26000.00, 20000.00, 0.00, 8554000.00),
(11, 17, 3, 180, 26000.00, 20000.00, 0.00, 4680000.00),
(12, 18, 3, 16, 26000.00, 20000.00, 0.00, 416000.00),
(13, 19, 2, 1, 1000.00, 25000.00, 0.00, 1000.00),
(14, 20, 2, 1, 1000.00, 25000.00, 0.00, 1000.00),
(15, 21, 5, 7, 1500.00, 1000.00, 0.00, 10500.00),
(16, 22, 7, 1, 2000.00, 20000.00, 0.00, 2000.00),
(17, 23, 8, 1, 900.00, 500.00, 0.00, 900.00),
(18, 24, 11, 13, 7000.00, 5000.00, 0.00, 91000.00),
(19, 25, 13, 3, 994.00, 700.00, 0.00, 2982.00),
(20, 26, 10, 4, 2500.00, 1800.00, 0.00, 10000.00),
(21, 27, 15, 3, 7000.00, 5000.00, 0.00, 21000.00),
(22, 28, 9, 1, 498.00, 300.00, 0.00, 498.00),
(23, 29, 14, 1, 5000.00, 3000.00, 0.00, 5000.00),
(24, 30, 16, 1, 3000.00, 5000.00, 0.00, 3000.00),
(25, 33, 10, 1, 2500.00, 1800.00, 0.00, 2500.00);

-- --------------------------------------------------------

--
-- Table structure for table `sequelizemeta`
--

CREATE TABLE `sequelizemeta` (
  `name` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

--
-- Dumping data for table `sequelizemeta`
--

INSERT INTO `sequelizemeta` (`name`) VALUES
('20260502192759-create-system-settings.js'),
('20260504144500-create-purchase-requests.js'),
('20260504144501-add-request-id-to-purchase-orders.js');

-- --------------------------------------------------------

--
-- Table structure for table `shelf_tags`
--

CREATE TABLE `shelf_tags` (
  `id` int(10) UNSIGNED NOT NULL,
  `product_id` bigint(20) UNSIGNED DEFAULT NULL,
  `product_name` varchar(200) NOT NULL,
  `price` decimal(12,2) NOT NULL DEFAULT 0.00,
  `barcode` varchar(100) DEFAULT NULL,
  `shelf_location` varchar(100) DEFAULT NULL,
  `label_text` varchar(300) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `shelf_tags`
--

INSERT INTO `shelf_tags` (`id`, `product_id`, `product_name`, `price`, `barcode`, `shelf_location`, `label_text`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 2, 'sugar kakira', 1000.00, '10000001', NULL, NULL, 0, '2026-05-01 10:24:38', '2026-05-01 11:30:01'),
(2, 1, 'dolo', 4000.00, '345678', 'A2', 'dec', 1, '2026-05-01 10:25:04', '2026-05-01 10:25:04'),
(3, 1, 'dolo', 4000.00, '345678', 'A3-shelf', 'dec', 0, '2026-05-01 10:32:25', '2026-05-01 11:29:55'),
(4, 2, 'sugar kakira', 1000.00, '10000001', NULL, NULL, 1, '2026-05-01 10:49:45', '2026-05-01 10:49:45'),
(5, 8, 'nivana small', 900.00, '140401011301', 'shelf E', 'best before 03/11/2027', 1, '2026-05-16 16:02:36', '2026-05-16 16:02:36');

-- --------------------------------------------------------

--
-- Table structure for table `stocktakes`
--

CREATE TABLE `stocktakes` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `created_by` bigint(20) UNSIGNED NOT NULL,
  `status` enum('open','committed','cancelled') DEFAULT 'open',
  `started_at` datetime DEFAULT NULL,
  `committed_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `stocktakes`
--

INSERT INTO `stocktakes` (`id`, `created_by`, `status`, `started_at`, `committed_at`) VALUES
(1, 1, 'open', '2026-05-03 18:33:45', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `stocktake_items`
--

CREATE TABLE `stocktake_items` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `stocktake_id` bigint(20) UNSIGNED NOT NULL,
  `product_id` bigint(20) UNSIGNED NOT NULL,
  `system_qty` int(11) NOT NULL,
  `counted_qty` int(11) NOT NULL,
  `difference` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `stocktake_items`
--

INSERT INTO `stocktake_items` (`id`, `stocktake_id`, `product_id`, `system_qty`, `counted_qty`, `difference`) VALUES
(1, 1, 1, 1987, 0, 0),
(2, 1, 2, 480, 0, 0),
(3, 1, 3, 359, 0, 0),
(4, 1, 4, 100, 0, 0);

-- --------------------------------------------------------

--
-- Table structure for table `stock_movements`
--

CREATE TABLE `stock_movements` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `product_id` bigint(20) UNSIGNED NOT NULL,
  `type` enum('in','out','adjust','stocktake','loss') NOT NULL,
  `quantity` int(11) NOT NULL,
  `reference_id` bigint(20) UNSIGNED DEFAULT NULL,
  `reason` varchar(200) DEFAULT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `device_id` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `stock_movements`
--

INSERT INTO `stock_movements` (`id`, `product_id`, `type`, `quantity`, `reference_id`, `reason`, `user_id`, `device_id`, `created_at`) VALUES
(1, 2, 'out', -1, 10, 'Sale REC-20260430-0001', 3, NULL, '2026-04-30 17:26:38'),
(2, 2, 'out', -1, 11, 'Sale REC-20260501-0001', 3, NULL, '2026-05-01 07:12:33'),
(3, 1, 'out', -10, 12, 'Sale REC-20260501-0002', 3, NULL, '2026-05-01 08:23:51'),
(4, 2, 'out', -10, 12, 'Sale REC-20260501-0002', 3, NULL, '2026-05-01 08:23:51'),
(5, 1, 'out', -3, 13, 'Sale REC-20260501-0003', 3, NULL, '2026-05-01 08:25:45'),
(6, 2, 'out', -8, 13, 'Sale REC-20260501-0003', 3, NULL, '2026-05-01 08:25:46'),
(7, 3, 'out', -8, 14, 'Sale REC-20260502-0001', 3, NULL, '2026-05-02 17:13:07'),
(8, 3, 'out', -2, 15, 'Sale REC-20260502-0002', 3, NULL, '2026-05-02 17:23:33'),
(9, 3, 'out', -329, 16, 'Sale REC-20260502-0003', 3, NULL, '2026-05-02 17:38:36'),
(10, 3, 'out', -180, 17, 'Sale REC-20260502-0004', 3, NULL, '2026-05-02 19:54:57'),
(11, 3, 'adjust', 500, NULL, 'Manual adjustment', 5, NULL, '2026-05-02 20:14:08'),
(12, 3, 'out', -16, 18, 'Sale REC-20260502-0005', 3, NULL, '2026-05-02 20:14:42'),
(13, 3, 'loss', -6, 5, 'Loss: damaged', 5, NULL, '2026-05-03 18:15:56'),
(14, 2, 'out', -1, 19, 'Sale REC-20260505-0001', 3, NULL, '2026-05-05 15:07:09'),
(15, 2, 'out', -1, 20, 'Sale REC-20260505-0002', 3, NULL, '2026-05-05 15:08:16'),
(16, 5, 'out', -7, 21, 'Sale REC-20260505-0003', 3, NULL, '2026-05-05 15:16:16'),
(17, 7, 'out', -1, 22, 'Sale REC-20260515-0001', 1, NULL, '2026-05-15 11:24:57'),
(18, 8, 'out', -1, 23, 'Sale REC-20260516-0001', 3, NULL, '2026-05-16 15:46:41'),
(19, 11, 'out', -13, 24, 'Sale REC-20260517-0001', 3, NULL, '2026-05-17 19:19:14'),
(20, 13, 'out', -3, 25, 'Sale REC-20260518-0001', 3, NULL, '2026-05-18 10:27:20'),
(21, 10, 'out', -4, 26, 'Sale REC-20260518-0002', 3, NULL, '2026-05-18 10:28:39'),
(22, 15, 'out', -3, 27, 'Sale REC-20260518-0003', 3, NULL, '2026-05-18 12:12:45'),
(23, 9, 'out', -1, 28, 'Sale REC-20260522-0001', 3, NULL, '2026-05-22 10:15:55'),
(24, 14, 'out', -1, 29, 'Sale REC-20260522-0002', 3, NULL, '2026-05-22 10:20:02'),
(25, 16, 'out', -1, 30, 'Sale REC-20260611-0001', 3, NULL, '2026-06-11 08:55:13'),
(26, 10, 'out', -1, 33, 'Sale REC-20260612-0001', 3, NULL, '2026-06-12 07:48:13');

-- --------------------------------------------------------

--
-- Table structure for table `suppliers`
--

CREATE TABLE `suppliers` (
  `id` int(10) UNSIGNED NOT NULL,
  `name` varchar(150) NOT NULL,
  `contact_phone` varchar(30) DEFAULT NULL,
  `contact_email` varchar(255) DEFAULT NULL,
  `lead_time_days` tinyint(3) UNSIGNED DEFAULT 1,
  `is_active` tinyint(1) DEFAULT 1,
  `contact_person` varchar(150) DEFAULT NULL,
  `address` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `suppliers`
--

INSERT INTO `suppliers` (`id`, `name`, `contact_phone`, `contact_email`, `lead_time_days`, `is_active`, `contact_person`, `address`) VALUES
(1, 'Coca-Cola Uganda', '+256700000001', 'orders@cocacola.ug', 2, 1, NULL, NULL),
(2, 'Nile Breweries', '+256700000002', 'sales@nile.ug', 3, 1, NULL, NULL),
(3, 'Mukwano Industries', '+256700000003', 'orders@mukwano.ug', 5, 1, NULL, NULL),
(4, 'AT technologies', '256 798789056', '', 1, 1, NULL, NULL),
(5, 'mmu', '256 709945673', 'tiaradavanz@gmail.com', 1, 1, 'Mpagi Brair', 'gt');

-- --------------------------------------------------------

--
-- Table structure for table `systemsettings`
--

CREATE TABLE `systemsettings` (
  `key` varchar(255) NOT NULL,
  `value` text DEFAULT NULL,
  `category` varchar(255) NOT NULL DEFAULT 'General',
  `type` varchar(255) NOT NULL DEFAULT 'string',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `systemsettings`
--

INSERT INTO `systemsettings` (`key`, `value`, `category`, `type`, `created_at`, `updated_at`) VALUES
('auto_backup', 'true', 'Backup', 'boolean', '2026-05-08 06:49:27', '2026-05-08 06:49:27'),
('backup_frequency', 'daily', 'Backup', 'string', '2026-05-09 08:47:29', '2026-05-09 08:47:29'),
('backup_location', '/var/backups/rstms', 'Backup', 'string', '2026-05-09 08:47:29', '2026-05-09 08:47:29'),
('backup_time', '02:00', 'Backup', 'string', '2026-05-09 08:47:29', '2026-05-09 08:47:29'),
('currency', 'UGX', 'General', 'string', '2026-05-08 06:49:26', '2026-05-08 06:49:26'),
('expiry_days_warning', '20', 'Alerts', 'string', '2026-05-08 06:49:27', '2026-05-08 06:55:54'),
('fraud_alert_enabled', 'true', 'Alerts', 'boolean', '2026-05-08 06:49:27', '2026-05-08 06:49:27'),
('frequency', 'daily', 'Backup', 'string', '2026-05-08 06:49:27', '2026-05-08 06:49:27'),
('jwt_expiry', '8h', 'Security', 'string', '2026-05-08 06:49:26', '2026-05-08 06:49:26'),
('location', 'Fort Portal, Uganda', 'General', 'string', '2026-05-08 06:49:26', '2026-05-08 06:55:54'),
('lockout_duration', '15', 'Security', 'string', '2026-05-08 06:49:26', '2026-05-08 06:49:26'),
('low_stock_threshold', '80', 'Alerts', 'string', '2026-05-08 06:49:27', '2026-05-08 06:49:27'),
('max_login_attempts', '5', 'Security', 'string', '2026-05-08 06:49:26', '2026-05-08 06:49:26'),
('receipt_footer', 'Thank you - Karibu Tena!', 'General', 'string', '2026-05-08 06:49:26', '2026-05-08 06:49:26'),
('refund_rate_threshold', '5', 'Alerts', 'string', '2026-05-08 06:49:27', '2026-05-08 06:49:27'),
('retention_days', '30', 'Backup', 'string', '2026-05-08 06:49:27', '2026-05-08 06:49:27'),
('session_timeout', '480', 'Security', 'string', '2026-05-08 06:49:26', '2026-05-08 06:49:26'),
('shop_name', 'Andrew & Brothers Supermarket', 'General', 'string', '2026-05-08 06:49:26', '2026-05-08 06:49:26'),
('time', '02:00', 'Backup', 'string', '2026-05-08 06:49:27', '2026-05-08 06:49:27'),
('timezone', 'Africa/Nairobi', 'General', 'string', '2026-05-08 06:49:26', '2026-05-08 06:49:26'),
('vat_rate', '0', 'General', 'string', '2026-05-08 06:49:26', '2026-05-08 06:50:00');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(150) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('admin','manager','cashier','stock') NOT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `is_deleted` tinyint(1) DEFAULT 0,
  `failed_attempts` tinyint(3) UNSIGNED DEFAULT 0,
  `device_id` varchar(100) DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `reset_pin` varchar(255) DEFAULT NULL,
  `reset_pin_expires_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `password_hash`, `role`, `is_active`, `is_deleted`, `failed_attempts`, `device_id`, `created_at`, `updated_at`, `reset_pin`, `reset_pin_expires_at`) VALUES
(1, 'Andrew Byamugisha', 'andrew@andrewbrothers.ug', '$2a$10$UNNdVfPau8/VQhIcu5WnbuoclZdz5WhdOhZqcH5Z4PN7ueiMP7jWG', 'manager', 1, 0, 0, 'PC-MAIN-01', '2026-04-26 18:59:29', '2026-06-09 18:46:40', NULL, NULL),
(2, 'Grace Tumwebaze', 'grace@andrewbrothers.ug', '$2a$10$MPPwRuMTyo6Fl.Dgv8sau.VjoSpIuaq5I0Zjlv6FdMkh2MF/2jMgW', 'manager', 1, 0, 0, 'LAPTOP-MGR', '2026-04-26 18:59:29', '2026-05-13 17:56:56', NULL, NULL),
(3, 'Joshua Kato', 'joshua@andrewbrothers.ug', '$2a$10$DUbruGiusHTyjaF8.0aWzeczPQ3RyNDvTMfRxJ8CT7Y9agvxylIjy', 'cashier', 1, 0, 0, 'POS-01', '2026-04-26 18:59:29', '2026-05-18 12:11:16', NULL, NULL),
(4, 'Birungi Mackline', 'birungi@andrewbrothers.ug', '$2a$10$DUbruGiusHTyjaF8.0aWzeczPQ3RyNDvTMfRxJ8CT7Y9agvxylIjy', 'cashier', 1, 0, 0, 'POS-02', '2026-04-26 18:59:29', '2026-04-26 18:59:29', NULL, NULL),
(5, 'Samuel Byaruhanga', 'samuel@andrewbrothers.ug', '$2a$10$0OWcJvzFDboheFrmXRdYZeJy99tz84wXTBZKtGWtAHQ4ffnPD9Q8G', 'stock', 1, 0, 0, 'STOCK-DEV-01', '2026-04-26 18:59:29', '2026-05-17 19:11:45', NULL, NULL),
(6, 'mackie', 'mackie@gmail.com', '$2a$10$VRsmQ1ga6ITz94GQl6AfgOUTJ7z.2NSVnC3Z.T9j8igYLdPd.Ig8G', 'cashier', 1, 0, 0, 'dev', '2026-04-26 19:07:32', '2026-04-26 19:07:32', NULL, NULL);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `alerts`
--
ALTER TABLE `alerts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `alerts_is_read` (`is_read`),
  ADD KEY `alerts_created_at` (`created_at`),
  ADD KEY `alerts_type` (`type`),
  ADD KEY `product_id` (`product_id`);

--
-- Indexes for table `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `audit_logs_user_id` (`user_id`),
  ADD KEY `audit_logs_timestamp` (`timestamp`),
  ADD KEY `audit_logs_entity_type` (`entity_type`);

--
-- Indexes for table `cash_sessions`
--
ALTER TABLE `cash_sessions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `cash_sessions_cashier_id` (`cashier_id`),
  ADD KEY `cash_sessions_status` (`status`),
  ADD KEY `cash_sessions_started_at` (`started_at`);

--
-- Indexes for table `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`),
  ADD UNIQUE KEY `name_2` (`name`),
  ADD UNIQUE KEY `name_3` (`name`),
  ADD UNIQUE KEY `name_4` (`name`),
  ADD UNIQUE KEY `name_5` (`name`),
  ADD UNIQUE KEY `name_6` (`name`);

--
-- Indexes for table `devices`
--
ALTER TABLE `devices`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `forecast_data`
--
ALTER TABLE `forecast_data`
  ADD PRIMARY KEY (`id`),
  ADD KEY `forecast_data_product_id` (`product_id`),
  ADD KEY `forecast_data_forecast_date` (`forecast_date`);

--
-- Indexes for table `inventory`
--
ALTER TABLE `inventory`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `product_id` (`product_id`),
  ADD UNIQUE KEY `inventory_product_id` (`product_id`);

--
-- Indexes for table `losses`
--
ALTER TABLE `losses`
  ADD PRIMARY KEY (`id`),
  ADD KEY `product_id` (`product_id`),
  ADD KEY `recorded_by` (`recorded_by`);

--
-- Indexes for table `permissions`
--
ALTER TABLE `permissions`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `pesapal_transactions`
--
ALTER TABLE `pesapal_transactions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `merchant_reference` (`merchant_reference`),
  ADD UNIQUE KEY `pesapal_transactions_merchant_reference` (`merchant_reference`),
  ADD KEY `pesapal_transactions_pesapal_order_tracking_id` (`pesapal_order_tracking_id`),
  ADD KEY `pesapal_transactions_status` (`status`);

--
-- Indexes for table `price_history`
--
ALTER TABLE `price_history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `product_id` (`product_id`),
  ADD KEY `changed_by` (`changed_by`);

--
-- Indexes for table `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `sku` (`sku`),
  ADD UNIQUE KEY `products_sku` (`sku`),
  ADD UNIQUE KEY `sku_2` (`sku`),
  ADD UNIQUE KEY `sku_3` (`sku`),
  ADD UNIQUE KEY `sku_4` (`sku`),
  ADD UNIQUE KEY `sku_5` (`sku`),
  ADD UNIQUE KEY `sku_6` (`sku`),
  ADD UNIQUE KEY `barcode` (`barcode`),
  ADD UNIQUE KEY `products_barcode` (`barcode`),
  ADD UNIQUE KEY `barcode_2` (`barcode`),
  ADD UNIQUE KEY `barcode_3` (`barcode`),
  ADD UNIQUE KEY `barcode_4` (`barcode`),
  ADD UNIQUE KEY `barcode_5` (`barcode`),
  ADD UNIQUE KEY `barcode_6` (`barcode`),
  ADD KEY `products_category_id` (`category_id`),
  ADD KEY `products_supplier_id` (`supplier_id`),
  ADD KEY `products_is_active` (`is_active`);

--
-- Indexes for table `promotions`
--
ALTER TABLE `promotions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `product_id` (`product_id`),
  ADD KEY `category_id` (`category_id`);

--
-- Indexes for table `purchase_orders`
--
ALTER TABLE `purchase_orders`
  ADD PRIMARY KEY (`id`),
  ADD KEY `supplier_id` (`supplier_id`),
  ADD KEY `created_by` (`created_by`),
  ADD KEY `purchase_orders_request_id_foreign_idx` (`request_id`);

--
-- Indexes for table `purchase_order_items`
--
ALTER TABLE `purchase_order_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `po_id` (`po_id`),
  ADD KEY `product_id` (`product_id`);

--
-- Indexes for table `purchase_requests`
--
ALTER TABLE `purchase_requests`
  ADD PRIMARY KEY (`id`),
  ADD KEY `created_by` (`created_by`),
  ADD KEY `approved_by` (`approved_by`);

--
-- Indexes for table `purchase_request_items`
--
ALTER TABLE `purchase_request_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `request_id` (`request_id`),
  ADD KEY `product_id` (`product_id`);

--
-- Indexes for table `returns`
--
ALTER TABLE `returns`
  ADD PRIMARY KEY (`id`),
  ADD KEY `transaction_id` (`transaction_id`),
  ADD KEY `product_id` (`product_id`);

--
-- Indexes for table `sales_transactions`
--
ALTER TABLE `sales_transactions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `receipt_number` (`receipt_number`),
  ADD UNIQUE KEY `sales_transactions_receipt_number` (`receipt_number`),
  ADD UNIQUE KEY `receipt_number_2` (`receipt_number`),
  ADD UNIQUE KEY `receipt_number_3` (`receipt_number`),
  ADD UNIQUE KEY `receipt_number_4` (`receipt_number`),
  ADD UNIQUE KEY `receipt_number_5` (`receipt_number`),
  ADD UNIQUE KEY `receipt_number_6` (`receipt_number`),
  ADD KEY `sales_transactions_cashier_id` (`cashier_id`),
  ADD KEY `sales_transactions_created_at` (`created_at`),
  ADD KEY `sales_transactions_status` (`status`),
  ADD KEY `cash_session_id` (`cash_session_id`);

--
-- Indexes for table `sale_items`
--
ALTER TABLE `sale_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `sale_items_transaction_id` (`transaction_id`),
  ADD KEY `sale_items_product_id` (`product_id`);

--
-- Indexes for table `sequelizemeta`
--
ALTER TABLE `sequelizemeta`
  ADD PRIMARY KEY (`name`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `shelf_tags`
--
ALTER TABLE `shelf_tags`
  ADD PRIMARY KEY (`id`),
  ADD KEY `shelf_tags_product_id` (`product_id`),
  ADD KEY `shelf_tags_barcode` (`barcode`);

--
-- Indexes for table `stocktakes`
--
ALTER TABLE `stocktakes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `created_by` (`created_by`);

--
-- Indexes for table `stocktake_items`
--
ALTER TABLE `stocktake_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `stocktake_id` (`stocktake_id`),
  ADD KEY `product_id` (`product_id`);

--
-- Indexes for table `stock_movements`
--
ALTER TABLE `stock_movements`
  ADD PRIMARY KEY (`id`),
  ADD KEY `stock_movements_product_id` (`product_id`),
  ADD KEY `stock_movements_created_at` (`created_at`),
  ADD KEY `stock_movements_type` (`type`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `suppliers`
--
ALTER TABLE `suppliers`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `systemsettings`
--
ALTER TABLE `systemsettings`
  ADD PRIMARY KEY (`key`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `email_2` (`email`),
  ADD UNIQUE KEY `email_3` (`email`),
  ADD UNIQUE KEY `email_4` (`email`),
  ADD UNIQUE KEY `email_5` (`email`),
  ADD UNIQUE KEY `email_6` (`email`),
  ADD KEY `users_email` (`email`),
  ADD KEY `users_role` (`role`),
  ADD KEY `users_is_active` (`is_active`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `alerts`
--
ALTER TABLE `alerts`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `audit_logs`
--
ALTER TABLE `audit_logs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=386;

--
-- AUTO_INCREMENT for table `cash_sessions`
--
ALTER TABLE `cash_sessions`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT for table `categories`
--
ALTER TABLE `categories`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `devices`
--
ALTER TABLE `devices`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `forecast_data`
--
ALTER TABLE `forecast_data`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `inventory`
--
ALTER TABLE `inventory`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT for table `losses`
--
ALTER TABLE `losses`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `permissions`
--
ALTER TABLE `permissions`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `pesapal_transactions`
--
ALTER TABLE `pesapal_transactions`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

--
-- AUTO_INCREMENT for table `price_history`
--
ALTER TABLE `price_history`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

--
-- AUTO_INCREMENT for table `products`
--
ALTER TABLE `products`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT for table `promotions`
--
ALTER TABLE `promotions`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `purchase_orders`
--
ALTER TABLE `purchase_orders`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `purchase_order_items`
--
ALTER TABLE `purchase_order_items`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `purchase_requests`
--
ALTER TABLE `purchase_requests`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `purchase_request_items`
--
ALTER TABLE `purchase_request_items`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `returns`
--
ALTER TABLE `returns`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `sales_transactions`
--
ALTER TABLE `sales_transactions`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=34;

--
-- AUTO_INCREMENT for table `sale_items`
--
ALTER TABLE `sale_items`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=26;

--
-- AUTO_INCREMENT for table `shelf_tags`
--
ALTER TABLE `shelf_tags`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `stocktakes`
--
ALTER TABLE `stocktakes`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `stocktake_items`
--
ALTER TABLE `stocktake_items`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `stock_movements`
--
ALTER TABLE `stock_movements`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=27;

--
-- AUTO_INCREMENT for table `suppliers`
--
ALTER TABLE `suppliers`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `alerts`
--
ALTER TABLE `alerts`
  ADD CONSTRAINT `alerts_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD CONSTRAINT `audit_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `cash_sessions`
--
ALTER TABLE `cash_sessions`
  ADD CONSTRAINT `cash_sessions_ibfk_1` FOREIGN KEY (`cashier_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `forecast_data`
--
ALTER TABLE `forecast_data`
  ADD CONSTRAINT `forecast_data_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `inventory`
--
ALTER TABLE `inventory`
  ADD CONSTRAINT `inventory_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `losses`
--
ALTER TABLE `losses`
  ADD CONSTRAINT `losses_ibfk_11` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `losses_ibfk_12` FOREIGN KEY (`recorded_by`) REFERENCES `users` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `price_history`
--
ALTER TABLE `price_history`
  ADD CONSTRAINT `price_history_ibfk_11` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `price_history_ibfk_12` FOREIGN KEY (`changed_by`) REFERENCES `users` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `products`
--
ALTER TABLE `products`
  ADD CONSTRAINT `products_ibfk_11` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `products_ibfk_12` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `promotions`
--
ALTER TABLE `promotions`
  ADD CONSTRAINT `promotions_ibfk_11` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `promotions_ibfk_12` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `purchase_orders`
--
ALTER TABLE `purchase_orders`
  ADD CONSTRAINT `purchase_orders_ibfk_11` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `purchase_orders_ibfk_12` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `purchase_orders_request_id_foreign_idx` FOREIGN KEY (`request_id`) REFERENCES `purchase_requests` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `purchase_order_items`
--
ALTER TABLE `purchase_order_items`
  ADD CONSTRAINT `purchase_order_items_ibfk_11` FOREIGN KEY (`po_id`) REFERENCES `purchase_orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `purchase_order_items_ibfk_12` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `purchase_requests`
--
ALTER TABLE `purchase_requests`
  ADD CONSTRAINT `purchase_requests_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `purchase_requests_ibfk_2` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `purchase_request_items`
--
ALTER TABLE `purchase_request_items`
  ADD CONSTRAINT `purchase_request_items_ibfk_1` FOREIGN KEY (`request_id`) REFERENCES `purchase_requests` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `purchase_request_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `returns`
--
ALTER TABLE `returns`
  ADD CONSTRAINT `returns_ibfk_11` FOREIGN KEY (`transaction_id`) REFERENCES `sales_transactions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `returns_ibfk_12` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `sales_transactions`
--
ALTER TABLE `sales_transactions`
  ADD CONSTRAINT `sales_transactions_ibfk_11` FOREIGN KEY (`cashier_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `sales_transactions_ibfk_12` FOREIGN KEY (`cash_session_id`) REFERENCES `cash_sessions` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `sale_items`
--
ALTER TABLE `sale_items`
  ADD CONSTRAINT `sale_items_ibfk_11` FOREIGN KEY (`transaction_id`) REFERENCES `sales_transactions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `sale_items_ibfk_12` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `stocktakes`
--
ALTER TABLE `stocktakes`
  ADD CONSTRAINT `stocktakes_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `stocktake_items`
--
ALTER TABLE `stocktake_items`
  ADD CONSTRAINT `stocktake_items_ibfk_11` FOREIGN KEY (`stocktake_id`) REFERENCES `stocktakes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `stocktake_items_ibfk_12` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `stock_movements`
--
ALTER TABLE `stock_movements`
  ADD CONSTRAINT `stock_movements_ibfk_11` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `stock_movements_ibfk_12` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
