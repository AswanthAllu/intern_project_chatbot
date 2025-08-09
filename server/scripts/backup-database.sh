#!/bin/bash

# =============================================================================
# AI Chatbot Application - Database Backup Script
# =============================================================================

set -e

echo "💾 Starting database backup..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '#' | awk '/=/ {print $1}')
fi

# Create backup directory
BACKUP_DIR="./backups"
mkdir -p $BACKUP_DIR

# Generate timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Check if MongoDB URI is set
if [ -z "$MONGO_URI" ]; then
    print_error "MONGO_URI not found in environment variables"
    exit 1
fi

# Determine backup method based on MongoDB URI
if [[ $MONGO_URI == mongodb+srv://* ]]; then
    # MongoDB Atlas backup
    print_status "Backing up MongoDB Atlas database..."
    
    # Extract database name from URI
    DB_NAME=$(echo $MONGO_URI | sed 's/.*\/\([^?]*\).*/\1/')
    
    # Use mongodump for Atlas
    BACKUP_FILE="$BACKUP_DIR/mongodb_atlas_backup_$TIMESTAMP"
    
    if command -v mongodump &> /dev/null; then
        mongodump --uri="$MONGO_URI" --out="$BACKUP_FILE"
        
        # Compress the backup
        tar -czf "$BACKUP_FILE.tar.gz" -C "$BACKUP_DIR" "mongodb_atlas_backup_$TIMESTAMP"
        rm -rf "$BACKUP_FILE"
        
        print_success "Atlas backup completed: $BACKUP_FILE.tar.gz"
    else
        print_error "mongodump not found. Install MongoDB tools: sudo apt install mongodb-database-tools"
        exit 1
    fi
    
elif [[ $MONGO_URI == mongodb://localhost* ]]; then
    # Local MongoDB backup
    print_status "Backing up local MongoDB database..."
    
    # Extract database name
    DB_NAME=$(echo $MONGO_URI | sed 's/.*\/\([^?]*\).*/\1/')
    
    BACKUP_FILE="$BACKUP_DIR/mongodb_local_backup_$TIMESTAMP"
    
    if command -v mongodump &> /dev/null; then
        mongodump --db="$DB_NAME" --out="$BACKUP_FILE"
        
        # Compress the backup
        tar -czf "$BACKUP_FILE.tar.gz" -C "$BACKUP_DIR" "mongodb_local_backup_$TIMESTAMP"
        rm -rf "$BACKUP_FILE"
        
        print_success "Local backup completed: $BACKUP_FILE.tar.gz"
    else
        print_error "mongodump not found. Install MongoDB tools: sudo apt install mongodb-database-tools"
        exit 1
    fi
else
    print_error "Unsupported MongoDB URI format"
    exit 1
fi

# Backup application files
print_status "Backing up application files..."
APP_BACKUP_FILE="$BACKUP_DIR/app_files_backup_$TIMESTAMP.tar.gz"

tar -czf "$APP_BACKUP_FILE" \
    --exclude='node_modules' \
    --exclude='logs' \
    --exclude='temp' \
    --exclude='backups' \
    --exclude='.git' \
    --exclude='ml_training/checkpoints' \
    .

print_success "Application files backup completed: $APP_BACKUP_FILE"

# Backup ML models
if [ -d "ml_training/models" ]; then
    print_status "Backing up ML models..."
    MODELS_BACKUP_FILE="$BACKUP_DIR/ml_models_backup_$TIMESTAMP.tar.gz"
    tar -czf "$MODELS_BACKUP_FILE" ml_training/models/
    print_success "ML models backup completed: $MODELS_BACKUP_FILE"
fi

# Clean up old backups (keep last 7 days)
print_status "Cleaning up old backups..."
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
print_success "Old backups cleaned up"

# Display backup summary
print_success "✅ Backup completed successfully!"
print_status "Backup files created:"
ls -lh $BACKUP_DIR/*$TIMESTAMP*

# Calculate total backup size
TOTAL_SIZE=$(du -sh $BACKUP_DIR | cut -f1)
print_status "Total backup directory size: $TOTAL_SIZE"

print_status "Backup location: $(pwd)/$BACKUP_DIR"
