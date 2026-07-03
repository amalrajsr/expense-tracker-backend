CREATE TABLE `expense_categories` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(64) NOT NULL,
  `slug` VARCHAR(80) NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  UNIQUE INDEX `expense_categories_name_key`(`name`),
  UNIQUE INDEX `expense_categories_slug_key`(`slug`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `expenses` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `category_id` BIGINT UNSIGNED NOT NULL,
  `amount` DECIMAL(12, 2) NOT NULL,
  `expense_date` DATETIME(3) NOT NULL,
  `note` VARCHAR(500) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  INDEX `idx_expenses_date`(`expense_date`, `id`),
  INDEX `idx_expenses_category_date`(`category_id`, `expense_date`, `id`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `expenses`
  ADD CONSTRAINT `expenses_category_id_fkey`
  FOREIGN KEY (`category_id`) REFERENCES `expense_categories`(`id`)
  ON DELETE RESTRICT ON UPDATE CASCADE;
