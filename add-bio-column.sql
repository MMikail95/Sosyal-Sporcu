-- Migration: profiles tablosuna bio kolonu ekle
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio TEXT DEFAULT NULL;
