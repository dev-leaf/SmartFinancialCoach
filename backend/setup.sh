#!/bin/bash

# Smart Expense Manager Backend - Setup Guide

echo "🚀 Smart Expense Manager - Backend Setup"
echo "=========================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ from https://nodejs.org"
    exit 1
fi

echo "✓ Node.js installed: $(node --version)"

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "⚠️  PostgreSQL not found. Make sure PostgreSQL is installed and running"
    echo "   Download from: https://www.postgresql.org/download"
fi

echo ""
echo "📝 Next Steps:"
echo "=============="
echo ""
echo "1. Install dependencies:"
echo "   npm install"
echo ""
echo "2. Copy environment file:"
echo "   cp .env.example .env"
echo ""
echo "3. Update .env with your PostgreSQL credentials:"
echo "   DATABASE_URL='postgresql://user:password@localhost:5432/smart_expense_db'"
echo ""
echo "4. Create PostgreSQL database:"
echo "   createdb smart_expense_db"
echo ""
echo "5. Setup Prisma and run migrations:"
echo "   npm run prisma:generate"
echo "   npm run prisma:migrate"
echo ""
echo "6. Start development server:"
echo "   npm run start:dev"
echo ""
echo "✅ Backend will run on: http://localhost:3000"
echo ""
