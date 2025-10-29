#!/bin/bash

# FuelSense Monitor - Quick Setup Script

echo "🚗⚡ FuelSense Monitor - Setup Script"
echo "======================================"
echo ""

# Check if PostgreSQL is running
echo "📊 Checking PostgreSQL..."
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL not found. Please install PostgreSQL first."
    echo "   Download: https://www.postgresql.org/download/"
    exit 1
fi

if ! pg_isready &> /dev/null; then
    echo "❌ PostgreSQL is not running. Please start PostgreSQL first."
    exit 1
fi

echo "✅ PostgreSQL is running"
echo ""

# Database setup
echo "🗄️  Setting up database..."
read -p "PostgreSQL username (default: postgres): " DB_USER
DB_USER=${DB_USER:-postgres}

read -sp "PostgreSQL password: " DB_PASS
echo ""

read -p "Database name (default: fuelsense_db): " DB_NAME
DB_NAME=${DB_NAME:-fuelsense_db}

# Create database
echo "Creating database..."
PGPASSWORD=$DB_PASS psql -U $DB_USER -c "CREATE DATABASE $DB_NAME;" 2>/dev/null
if [ $? -eq 0 ]; then
    echo "✅ Database created"
else
    echo "⚠️  Database might already exist, continuing..."
fi

# Create .env file
echo ""
echo "📝 Creating .env file..."
cat > backend/.env << EOL
DATABASE_URL="postgresql://$DB_USER:$DB_PASS@localhost:5432/$DB_NAME?schema=public"
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
EOL

echo "✅ .env file created"
echo ""

# Run migrations
echo "🔄 Running database migrations..."
cd backend
npm run prisma:migrate -- --name init
npm run prisma:generate
cd ..

echo ""
echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Start backend:  cd backend && npm run dev"
echo "   2. Start frontend: cd frontend && npm run dev"
echo "   3. Open browser:   http://localhost:5173"
echo ""
echo "Or run both at once: npm run dev"
echo ""
