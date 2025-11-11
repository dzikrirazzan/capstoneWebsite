#!/bin/bash

# 🔄 Migration Script: MySQL (Railway) → PostgreSQL (Supabase)
# Run this script to switch database from Railway MySQL to Supabase PostgreSQL

set -e  # Exit on error

echo "🗄️  FuelSense Database Migration: MySQL → PostgreSQL"
echo "=================================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Backup current schema
echo "${YELLOW}Step 1: Backup current MySQL schema...${NC}"
if [ -f "backend/prisma/schema.prisma" ]; then
    cp backend/prisma/schema.prisma backend/prisma/schema.prisma.mysql.backup
    echo "${GREEN}✅ Backup saved to: backend/prisma/schema.prisma.mysql.backup${NC}"
else
    echo "${RED}❌ schema.prisma not found!${NC}"
    exit 1
fi
echo ""

# Step 2: Copy PostgreSQL schema
echo "${YELLOW}Step 2: Switch to PostgreSQL schema...${NC}"
if [ -f "backend/prisma/schema.prisma.supabase" ]; then
    cp backend/prisma/schema.prisma.supabase backend/prisma/schema.prisma
    echo "${GREEN}✅ PostgreSQL schema activated${NC}"
else
    echo "${RED}❌ schema.prisma.supabase not found!${NC}"
    exit 1
fi
echo ""

# Step 3: Copy environment example
echo "${YELLOW}Step 3: Setup environment variables...${NC}"
if [ -f "backend/.env.example.supabase" ]; then
    echo "${YELLOW}📝 Please update backend/.env with Supabase credentials:${NC}"
    cat backend/.env.example.supabase
    echo ""
    echo "${YELLOW}Copy template? (y/n)${NC}"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        cp backend/.env.example.supabase backend/.env.supabase
        echo "${GREEN}✅ Template copied to backend/.env.supabase${NC}"
        echo "${YELLOW}⚠️  IMPORTANT: Edit backend/.env.supabase and add your credentials!${NC}"
    fi
else
    echo "${YELLOW}⚠️  .env.example.supabase not found, skipping...${NC}"
fi
echo ""

# Step 4: Install dependencies
echo "${YELLOW}Step 4: Install dependencies...${NC}"
cd backend
npm install
echo "${GREEN}✅ Dependencies installed${NC}"
echo ""

# Step 5: Generate Prisma Client
echo "${YELLOW}Step 5: Generate Prisma Client...${NC}"
npx prisma generate
echo "${GREEN}✅ Prisma Client generated${NC}"
echo ""

# Step 6: Instructions for migration
echo "${GREEN}=================================================="
echo "✅ Migration setup complete!"
echo "==================================================${NC}"
echo ""
echo "${YELLOW}📋 Next steps:${NC}"
echo ""
echo "1. Create Supabase account: ${GREEN}https://supabase.com${NC}"
echo "2. Create new project in Supabase"
echo "3. Copy connection string from Supabase Dashboard"
echo "4. Update ${YELLOW}backend/.env${NC} with:"
echo "   ${YELLOW}DATABASE_URL${NC}=\"postgresql://...\" (port 6543)"
echo "   ${YELLOW}DIRECT_URL${NC}=\"postgresql://...\" (port 5432)"
echo ""
echo "5. Run migration:"
echo "   ${GREEN}cd backend${NC}"
echo "   ${GREEN}npx prisma migrate dev --name init${NC}"
echo ""
echo "6. (Optional) Seed sample data:"
echo "   ${GREEN}npm run seed${NC}"
echo ""
echo "7. Test the app:"
echo "   ${GREEN}npm run dev${NC}"
echo ""
echo "${YELLOW}📖 Full guide: ${GREEN}SETUP_SUPABASE.md${NC}"
echo ""

# Return to root
cd ..

echo "${GREEN}🎉 Done! Follow the steps above to complete migration.${NC}"
