-- Migration script to add account_id to Investment_Transactions table
-- Run this script to update your existing database
-- WARNING: This will set all existing investment transactions to have account_id = NULL temporarily
-- You may need to manually update existing transactions or delete them

USE PFMS;

-- Step 1: Add account_id column (nullable first, we'll make it NOT NULL later)
ALTER TABLE Investment_Transactions 
ADD COLUMN account_id INT NULL AFTER investment_id;

-- Step 2: Add foreign key constraint
ALTER TABLE Investment_Transactions
ADD CONSTRAINT investment_transactions_ibfk_account
FOREIGN KEY (account_id) REFERENCES Accounts(account_id) ON DELETE CASCADE;

-- Step 3: For existing transactions, you have two options:
-- Option A: Delete all existing investment transactions (recommended if you don't have important data)
-- DELETE FROM Investment_Transactions;

-- Option B: Manually set account_id for existing transactions (if you have data to preserve)
-- UPDATE Investment_Transactions IT
-- JOIN Investments I ON IT.investment_id = I.investment_id
-- JOIN Accounts A ON A.profile_id = I.profile_id
-- SET IT.account_id = A.account_id
-- WHERE IT.account_id IS NULL
-- LIMIT 1; -- Run this multiple times if you have multiple accounts per profile

-- Step 4: Make account_id NOT NULL (only after you've set account_id for all existing rows)
-- ALTER TABLE Investment_Transactions
-- MODIFY COLUMN account_id INT NOT NULL;

