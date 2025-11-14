DROP DATABASE IF EXISTS Finance_Manager;
CREATE DATABASE Finance_Manager;
USE Finance_Manager;

-- =============================================
-- SECTION 1: CORE TABLES (User Login & Profile Management)
-- =============================================

-- Users Table: Stores master login information.
CREATE TABLE Users (
    user_id         INT             PRIMARY KEY AUTO_INCREMENT,
    email           VARCHAR(100)    NOT NULL UNIQUE,
    password        VARCHAR(255)    NOT NULL,
    name            VARCHAR(50)     NOT NULL,
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_login      DATETIME
);

-- Profiles Table: The key to separating financial contexts for a user.
CREATE TABLE Profiles (
    profile_id      INT             PRIMARY KEY AUTO_INCREMENT,
    user_id         INT             NOT NULL,
    profile_name    VARCHAR(100)    NOT NULL,
    profile_type    ENUM('personal', 'business') NOT NULL,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
);

-- Payment Methods Table: Global and shared across all profiles.
CREATE TABLE Payment_Methods (
    payment_method_id   INT         PRIMARY KEY AUTO_INCREMENT,
    type                VARCHAR(50) NOT NULL UNIQUE
);

-- Insert default payment methods
INSERT INTO Payment_Methods (type) VALUES
    ('Credit Card'),
    ('Debit Card'),
    ('Cash'),
    ('Bank Transfer'),
    ('PayPal'),
    ('Venmo'),
    ('Zelle'),
    ('Check'),
    ('Apple Pay'),
    ('Google Pay');

-- =============================================
-- SECTION 2: GENERAL FINANCE TABLES (Linked to Profiles)
-- =============================================

-- Accounts Table: Financial accounts, each belonging to a specific profile.
CREATE TABLE Accounts (
    account_id  INT             PRIMARY KEY AUTO_INCREMENT,
    profile_id  INT             NOT NULL,
    name        VARCHAR(50)     NOT NULL,
    balance     DECIMAL(15, 2)  NOT NULL DEFAULT 0.00,
    FOREIGN KEY (profile_id) REFERENCES Profiles(profile_id) ON DELETE CASCADE
);

-- Categories Table: Profile-specific categories with subcategory support.
CREATE TABLE Categories (
    category_id         INT         PRIMARY KEY AUTO_INCREMENT,
    profile_id          INT         NOT NULL,
    name                VARCHAR(50) NOT NULL,
    parent_category_id  INT         NULL,
    FOREIGN KEY (profile_id) REFERENCES Profiles(profile_id) ON DELETE CASCADE,
    FOREIGN KEY (parent_category_id) REFERENCES Categories(category_id) ON DELETE SET NULL,
    UNIQUE(profile_id, name)
);

-- Transactions Table: All income/expense records, linked to an account.
CREATE TABLE Transactions (
    transaction_id      INT             PRIMARY KEY AUTO_INCREMENT,
    account_id          INT             NOT NULL,
    category_id         INT,
    payment_method_id   INT,
    type                ENUM('income', 'expense') NOT NULL,
    amount              DECIMAL(15, 2)  NOT NULL,
    description         VARCHAR(100),
    time_stamp          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (account_id) REFERENCES Accounts(account_id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES Categories(category_id) ON DELETE SET NULL,
    FOREIGN KEY (payment_method_id) REFERENCES Payment_Methods(payment_method_id) ON DELETE SET NULL
);

-- Budgets Table: Profile-specific monthly budgets.
CREATE TABLE Budgets (
    budget_id   INT             PRIMARY KEY AUTO_INCREMENT,
    profile_id  INT             NOT NULL,
    category_id INT             NOT NULL,
    budget      DECIMAL(15, 2)  NOT NULL,
    month       INT             NOT NULL,
    year        INT             NOT NULL,
    FOREIGN KEY (profile_id) REFERENCES Profiles(profile_id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES Categories(category_id) ON DELETE CASCADE,
    UNIQUE(profile_id, category_id, month, year)
);

-- Recurring Transactions Table: Automated transactions for a profile.
CREATE TABLE Recurring_Transactions (
    recurring_id    INT             PRIMARY KEY AUTO_INCREMENT,
    profile_id      INT             NOT NULL,
    category_id     INT,
    description     VARCHAR(100),
    amount          DECIMAL(15, 2)  NOT NULL,
    frequency       VARCHAR(30),
    end_date        DATE,
    FOREIGN KEY (profile_id) REFERENCES Profiles(profile_id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES Categories(category_id) ON DELETE SET NULL
);


-- =============================================
-- SECTION 3: PERSONAL FINANCE FEATURES (Goals, Investments)
-- =============================================

CREATE TABLE Financial_Goals (
    goal_id         INT             PRIMARY KEY AUTO_INCREMENT,
    profile_id      INT             NOT NULL,
    goal_name       VARCHAR(100)    NOT NULL,
    target_amount   DECIMAL(15, 2)  NOT NULL,
    current_amount  DECIMAL(15, 2)  NOT NULL DEFAULT 0.00,
    target_date     DATE,
    status          ENUM('In Progress', 'Achieved', 'Cancelled') NOT NULL DEFAULT 'In Progress',
    FOREIGN KEY (profile_id) REFERENCES Profiles(profile_id) ON DELETE CASCADE,
    UNIQUE(profile_id, goal_name, target_amount, target_date)
);

CREATE TABLE Investments (
    investment_id   INT             PRIMARY KEY AUTO_INCREMENT,
    profile_id      INT             NOT NULL,
    investment_name VARCHAR(100)    NOT NULL,
    investment_type VARCHAR(50),
    FOREIGN KEY (profile_id) REFERENCES Profiles(profile_id) ON DELETE CASCADE
);

CREATE TABLE Investment_Transactions (
    inv_transaction_id  INT             PRIMARY KEY AUTO_INCREMENT,
    investment_id       INT             NOT NULL,
    account_id          INT             NOT NULL,
    transaction_type    ENUM('Buy', 'Sell') NOT NULL,
    quantity            DECIMAL(18, 8)  NOT NULL,
    price_per_unit      DECIMAL(15, 2)  NOT NULL,
    transaction_date    DATE            NOT NULL,
    FOREIGN KEY (investment_id) REFERENCES Investments(investment_id) ON DELETE CASCADE,
    FOREIGN KEY (account_id) REFERENCES Accounts(account_id) ON DELETE CASCADE
);

-- =============================================
-- SECTION 4: BUSINESS FEATURES (Clients, Invoices)
-- =============================================

CREATE TABLE Clients (
    client_id       INT             PRIMARY KEY AUTO_INCREMENT,
    profile_id      INT             NOT NULL, -- Must belong to a 'business' profile
    client_name     VARCHAR(255)    NOT NULL,
    email           VARCHAR(255),
    address         TEXT,
    FOREIGN KEY (profile_id) REFERENCES Profiles(profile_id) ON DELETE CASCADE
);

CREATE TABLE Invoices (
    invoice_id      INT             PRIMARY KEY AUTO_INCREMENT,
    client_id       INT             NOT NULL,
    profile_id      INT             NOT NULL,
    invoice_number  VARCHAR(50)     NOT NULL,
    amount          DECIMAL(15, 2)  NOT NULL,
    issue_date      DATE            NOT NULL,
    due_date        DATE            NOT NULL,
    status          ENUM('draft', 'sent', 'paid', 'overdue', 'void') NOT NULL DEFAULT 'draft',
    FOREIGN KEY (client_id) REFERENCES Clients(client_id) ON DELETE CASCADE,
    FOREIGN KEY (profile_id) REFERENCES Profiles(profile_id) ON DELETE CASCADE
);

-- =============================================
-- SECTION 5: UTILITY TABLE (Notifications)
-- =============================================

-- Notifications are linked to the profile, making them profile-specific.
CREATE TABLE Notifications (
    notification_id INT             PRIMARY KEY AUTO_INCREMENT,
    profile_id      INT             NOT NULL,
    message         TEXT            NOT NULL,
    is_read         BOOLEAN         NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (profile_id) REFERENCES Profiles(profile_id) ON DELETE CASCADE
);