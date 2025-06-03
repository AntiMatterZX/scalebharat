#!/bin/bash

# Production Deployment Script for StartupConnect
# Usage: ./deploy.sh [environment]

set -e  # Exit on any error

# Configuration
PROJECT_NAME="startup-connect"
DOCKER_COMPOSE_FILE="docker-compose.yml"
BACKUP_DIR="./backups"
ENV_FILE=".env.production"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

# Check if running as root
check_root() {
    if [ "$EUID" -eq 0 ]; then
        error "Do not run this script as root"
    fi
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed"
    fi
    
    # Check if Docker Compose is installed
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose is not installed"
    fi
    
    # Check if environment file exists
    if [ ! -f "$ENV_FILE" ]; then
        error "Environment file $ENV_FILE not found. Copy from env.production.template"
    fi
    
    log "Prerequisites check passed ✓"
}

# Create backup
create_backup() {
    log "Creating backup..."
    
    mkdir -p "$BACKUP_DIR"
    BACKUP_FILE="$BACKUP_DIR/backup-$(date +%Y%m%d-%H%M%S).tar.gz"
    
    # Backup current deployment
    if [ -d ".next" ]; then
        tar -czf "$BACKUP_FILE" .next/ public/ package.json || warn "Backup creation failed"
        log "Backup created: $BACKUP_FILE"
    else
        warn "No previous deployment found to backup"
    fi
}

# Build and deploy
deploy() {
    log "Starting deployment..."
    
    # Pull latest changes (if using git)
    if [ -d ".git" ]; then
        log "Pulling latest changes..."
        git pull origin main || warn "Git pull failed"
    fi
    
    # Build the application
    log "Building Docker images..."
    docker-compose -f "$DOCKER_COMPOSE_FILE" build --no-cache
    
    # Stop existing containers
    log "Stopping existing containers..."
    docker-compose -f "$DOCKER_COMPOSE_FILE" down --remove-orphans
    
    # Start new containers
    log "Starting containers..."
    docker-compose -f "$DOCKER_COMPOSE_FILE" up -d
    
    # Wait for services to be ready
    wait_for_health_check
}

# Health check
wait_for_health_check() {
    log "Waiting for services to be healthy..."
    
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if docker-compose -f "$DOCKER_COMPOSE_FILE" ps | grep -q "healthy"; then
            log "Health check passed ✓"
            return 0
        fi
        
        log "Attempt $attempt/$max_attempts - Waiting for services..."
        sleep 10
        ((attempt++))
    done
    
    error "Health check failed after $max_attempts attempts"
}

# Verify deployment
verify_deployment() {
    log "Verifying deployment..."
    
    # Check if containers are running
    if ! docker-compose -f "$DOCKER_COMPOSE_FILE" ps | grep -q "Up"; then
        error "Containers are not running properly"
    fi
    
    # Test health endpoint
    if command -v curl &> /dev/null; then
        if curl -f http://localhost:3000/api/health &> /dev/null; then
            log "Health endpoint check passed ✓"
        else
            error "Health endpoint is not responding"
        fi
    fi
    
    log "Deployment verification completed ✓"
}

# Rollback function
rollback() {
    log "Rolling back deployment..."
    
    # Stop current containers
    docker-compose -f "$DOCKER_COMPOSE_FILE" down
    
    # Find latest backup
    LATEST_BACKUP=$(ls -t "$BACKUP_DIR"/backup-*.tar.gz 2>/dev/null | head -n 1)
    
    if [ -n "$LATEST_BACKUP" ]; then
        log "Restoring from backup: $LATEST_BACKUP"
        tar -xzf "$LATEST_BACKUP" || error "Failed to restore backup"
        
        # Restart with previous version
        docker-compose -f "$DOCKER_COMPOSE_FILE" up -d
        
        log "Rollback completed ✓"
    else
        error "No backup found for rollback"
    fi
}

# Cleanup old backups and Docker images
cleanup() {
    log "Cleaning up..."
    
    # Remove old backups (keep last 5)
    ls -t "$BACKUP_DIR"/backup-*.tar.gz 2>/dev/null | tail -n +6 | xargs rm -f || true
    
    # Remove unused Docker images
    docker image prune -f || warn "Docker image cleanup failed"
    
    log "Cleanup completed ✓"
}

# Display help
show_help() {
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  deploy     Deploy the application (default)"
    echo "  rollback   Rollback to previous deployment"
    echo "  cleanup    Clean up old backups and Docker images"
    echo "  help       Show this help message"
    echo ""
    echo "Environment variables:"
    echo "  ENV_FILE   Environment file to use (default: .env.production)"
}

# Main function
main() {
    local command=${1:-deploy}
    
    case $command in
        deploy)
            check_root
            check_prerequisites
            create_backup
            deploy
            verify_deployment
            cleanup
            log "🚀 Deployment completed successfully!"
            ;;
        rollback)
            check_root
            rollback
            ;;
        cleanup)
            cleanup
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            error "Unknown command: $command. Use 'help' for usage information."
            ;;
    esac
}

# Run main function with all arguments
main "$@" 