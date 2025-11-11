#!/bin/bash

# 🚀 Quick Setup Supabase untuk Project: znsaybpfjnhgecasgizk
# Script ini akan setup database Supabase untuk FuelSense Monitor

set -e  # Exit on error

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo ""
echo "${BLUE}🗄️  FuelSense - Supabase PostgreSQL Setup${NC}"
echo "${BLUE}============================================${NC}"
echo ""
echo "Project Ref: ${GREEN}znsaybpfjnhgecasgizk${NC}"
echo "Host: ${GREEN}db.znsaybpfjnhgecasgizk.supabase.co${NC}"
echo "Region: ${GREEN}Singapore${NC}"
echo ""

# Step 1: Check if password is set
echo "${YELLOW}Step 1: Database Password${NC}"
echo "----------------------------------------"
echo ""
echo "Kamu perlu password database Supabase."
echo "Password ini yang kamu set waktu buat project."
echo ""
echo "${YELLOW}Cara cari password:${NC}"
echo "1. Buka: ${BLUE}https://supabase.com/dashboard${NC}"
echo "2. Pilih project: ${GREEN}znsaybpfjnhgecasgizk${NC}"
echo "3. Settings → Database → Database Password"
echo ""
echo "${YELLOW}Atau pakai password yang kamu ingat waktu buat project${NC}"
echo ""
read -p "Masukkan password database: " DB_PASSWORD
echo ""

if [ -z "$DB_PASSWORD" ]; then
    echo "${RED}❌ Password tidak boleh kosong!${NC}"
    exit 1
fi

echo "${GREEN}✅ Password received${NC}"
echo ""

# Step 2: Create .env file
echo "${YELLOW}Step 2: Setup Environment Variables${NC}"
echo "----------------------------------------"

cd backend

# Backup existing .env if exists
if [ -f ".env" ]; then
    echo "${YELLOW}⚠️  Backing up existing .env to .env.backup.mysql${NC}"
    cp .env .env.backup.mysql
fi

# Create new .env with Supabase config
cat > .env << EOF
# 🗄️ Supabase PostgreSQL Database
# Project: znsaybpfjnhgecasgizk
# Generated: $(date)

# Connection Pooling (untuk app runtime)
DATABASE_URL="postgresql://postgres.znsaybpfjnhgecasgizk:${DB_PASSWORD}@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

# Direct Connection (untuk migrations)
DIRECT_URL="postgresql://postgres:${DB_PASSWORD}@db.znsaybpfjnhgecasgizk.supabase.co:5432/postgres"

# Server Configuration
PORT=3001
NODE_ENV=development

# CORS Configuration
FRONTEND_URL=http://localhost:5173
EOF

echo "${GREEN}✅ .env file created${NC}"
echo ""

# Step 3: Install dependencies
echo "${YELLOW}Step 3: Install Dependencies${NC}"
echo "----------------------------------------"
npm install
echo "${GREEN}✅ Dependencies installed${NC}"
echo ""

# Step 4: Generate Prisma Client
echo "${YELLOW}Step 4: Generate Prisma Client${NC}"
echo "----------------------------------------"
npx prisma generate
echo "${GREEN}✅ Prisma Client generated for PostgreSQL${NC}"
echo ""

# Step 5: Test connection
echo "${YELLOW}Step 5: Test Database Connection${NC}"
echo "----------------------------------------"
echo "Testing connection to Supabase..."

if npx prisma db pull --force 2>/dev/null; then
    echo "${GREEN}✅ Connection successful!${NC}"
else
    echo "${YELLOW}⚠️  Cannot pull schema (expected - database masih kosong)${NC}"
    echo "This is normal for new database."
fi
echo ""

# Step 6: Run migration
echo "${YELLOW}Step 6: Run Database Migration${NC}"
echo "----------------------------------------"
echo "Creating sensor_data table..."
echo ""

npx prisma migrate dev --name init

echo ""
echo "${GREEN}✅ Migration completed!${NC}"
echo ""

# Step 7: Seed data
echo "${YELLOW}Step 7: Seed Sample Data (Optional)${NC}"
echo "----------------------------------------"
echo "Generate sample sensor data?"
echo ""
read -p "Seed database with sample data? (y/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Generating 480 sample records..."
    npm run seed
    echo "${GREEN}✅ Sample data generated!${NC}"
else
    echo "${YELLOW}⏭️  Skipped seeding${NC}"
fi
echo ""

# Step 8: Summary
cd ..
echo ""
echo "${GREEN}============================================${NC}"
echo "${GREEN}🎉 Setup Complete!${NC}"
echo "${GREEN}============================================${NC}"
echo ""
echo "${BLUE}📊 Database Info:${NC}"
echo "  Project: ${GREEN}znsaybpfjnhgecasgizk${NC}"
echo "  Host: ${GREEN}db.znsaybpfjnhgecasgizk.supabase.co${NC}"
echo "  Database: ${GREEN}postgres${NC}"
echo "  Table: ${GREEN}sensor_data${NC}"
echo ""
echo "${BLUE}🔗 Useful Links:${NC}"
echo "  Dashboard: ${GREEN}https://supabase.com/dashboard/project/znsaybpfjnhgecasgizk${NC}"
echo "  Table Editor: ${GREEN}https://supabase.com/dashboard/project/znsaybpfjnhgecasgizk/editor${NC}"
echo "  SQL Editor: ${GREEN}https://supabase.com/dashboard/project/znsaybpfjnhgecasgizk/sql${NC}"
echo ""
echo "${BLUE}🚀 Next Steps:${NC}"
echo ""
echo "1. Test the app locally:"
echo "   ${GREEN}cd backend && npm run dev${NC}"
echo ""
echo "2. View data di Supabase Dashboard:"
echo "   ${GREEN}https://supabase.com/dashboard/project/znsaybpfjnhgecasgizk/editor${NC}"
echo ""
echo "3. Deploy to Vercel:"
echo "   - Add environment variables di Vercel:"
echo "     ${YELLOW}DATABASE_URL${NC} = (from backend/.env)"
echo "     ${YELLOW}DIRECT_URL${NC} = (from backend/.env)"
echo "   - Read: ${GREEN}VERCEL_QUICKSTART.md${NC}"
echo ""
echo "${GREEN}✨ Happy coding!${NC}"
echo ""
