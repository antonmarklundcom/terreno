CREATE TABLE `leads` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`tipo_lead` enum('listing_contact','valuation','service') NOT NULL,
	`vertical` varchar(40) NOT NULL DEFAULT 'terreno',
	`capture_site` varchar(80) NOT NULL,
	`origin_site` varchar(80),
	`listing_id` bigint unsigned,
	`listing_dedup_key` varchar(120),
	`contacto` json,
	`payload` json,
	`source_page` varchar(200),
	`crm_status` enum('pending','sent','failed') NOT NULL DEFAULT 'pending',
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `leads_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `listing_sources` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`listing_id` bigint unsigned NOT NULL,
	`source` enum('seed','admin','propia') NOT NULL,
	`source_id` varchar(120),
	`dedup_key` varchar(120) NOT NULL,
	`content_hash` char(64) NOT NULL,
	`first_seen_at` datetime NOT NULL,
	`last_seen_at` datetime NOT NULL,
	`last_changed_at` datetime NOT NULL,
	CONSTRAINT `listing_sources_id` PRIMARY KEY(`id`),
	CONSTRAINT `uq_dedup` UNIQUE(`dedup_key`)
);
--> statement-breakpoint
CREATE TABLE `listings` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`public_id` char(10) NOT NULL,
	`slug` varchar(180) NOT NULL,
	`origin` enum('local','propia') NOT NULL DEFAULT 'local',
	`owner_type` enum('broker','casa_propia') NOT NULL,
	`owner_id` bigint unsigned,
	`tipo` enum('lote_urbano','terreno_comercial','campo','quinta','loteamiento') NOT NULL,
	`titulo` varchar(180) NOT NULL,
	`descripcion` text NOT NULL,
	`location_id` bigint unsigned,
	`departamento` varchar(120) NOT NULL,
	`ciudad` varchar(120) NOT NULL,
	`barrio` varchar(120),
	`lat` decimal(9,6) NOT NULL,
	`lng` decimal(9,6) NOT NULL,
	`polygon` json,
	`superficie_m2` decimal(12,2) NOT NULL,
	`precio_monto` decimal(14,2) NOT NULL,
	`precio_moneda` enum('USD','PYG') NOT NULL,
	`price_usd` decimal(12,2) NOT NULL,
	`frente_m` decimal(8,2),
	`fondo_m` decimal(8,2),
	`esquina` boolean NOT NULL DEFAULT false,
	`servicios` json NOT NULL,
	`estado_titulo` enum('con_titulo','en_proceso') NOT NULL,
	`financiacion` enum('contado','cuotas') NOT NULL,
	`loteamiento` json,
	`images` json NOT NULL,
	`featured_until` datetime,
	`status` enum('published','paused','sold') NOT NULL DEFAULT 'published',
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `listings_id` PRIMARY KEY(`id`),
	CONSTRAINT `listings_public_id_unique` UNIQUE(`public_id`)
);
--> statement-breakpoint
CREATE TABLE `locations` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`parent_id` bigint unsigned,
	`level` enum('pais','departamento','ciudad','barrio') NOT NULL,
	`name` varchar(120) NOT NULL,
	`slug` varchar(140) NOT NULL,
	`full_slug` varchar(300) NOT NULL,
	`lat` decimal(9,6),
	`lng` decimal(9,6),
	`listing_counts` json,
	CONSTRAINT `locations_id` PRIMARY KEY(`id`),
	CONSTRAINT `locations_full_slug_unique` UNIQUE(`full_slug`)
);
--> statement-breakpoint
CREATE TABLE `owners` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`nombre` varchar(140) NOT NULL,
	`telefono_wa` varchar(30) NOT NULL,
	`inmobiliaria` varchar(160),
	`tipo` enum('broker','casa_propia') NOT NULL,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `owners_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `idx_listing` ON `leads` (`listing_id`);--> statement-breakpoint
CREATE INDEX `idx_crm` ON `leads` (`crm_status`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_listing` ON `listing_sources` (`listing_id`);--> statement-breakpoint
CREATE INDEX `idx_search` ON `listings` (`status`,`tipo`,`location_id`,`price_usd`);--> statement-breakpoint
CREATE INDEX `idx_geo` ON `listings` (`status`,`lat`,`lng`);--> statement-breakpoint
CREATE INDEX `idx_fresh` ON `listings` (`status`,`updated_at`);--> statement-breakpoint
CREATE INDEX `idx_slug` ON `listings` (`slug`);--> statement-breakpoint
CREATE INDEX `idx_owner` ON `listings` (`owner_id`);--> statement-breakpoint
CREATE INDEX `idx_parent` ON `locations` (`parent_id`,`level`);