#!/bin/bash

# DailyLesson Offline Package Generator
# This script generates a complete offline package of all 365 daily lessons

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default configuration
OUTPUT_DIR="./offline-lessons"
GENERATE_LESSONS=true
BUILD_INDEXES=true
START_SERVER=false
SERVER_PORT=3000
SKIP_EXISTING=true
MAX_CONCURRENT=3

# Function to print colored output
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Function to show usage
show_usage() {
    echo "DailyLesson Offline Package Generator"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --output=DIR          Output directory (default: ./offline-lessons)"
    echo "  --no-lessons          Skip lesson generation"
    echo "  --no-indexes          Skip index building"
    echo "  --start-server        Start server after generation"
    echo "  --port=PORT           Server port (default: 3000)"
    echo "  --force               Force regeneration (don't skip existing)"
    echo "  --concurrent=N        Max concurrent generations (default: 3)"
    echo "  --help                Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                                    # Generate complete package"
    echo "  $0 --output=/path/to/lessons          # Custom output directory"
    echo "  $0 --start-server --port=8080         # Generate and start server"
    echo "  $0 --no-lessons --no-indexes          # Only start server"
    echo ""
}

# Function to check prerequisites
check_prerequisites() {
    print_info "Checking prerequisites..."
    
    # Check if Node.js is installed
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 16 or higher."
        exit 1
    fi
    
    # Check Node.js version
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 16 ]; then
        print_error "Node.js version 16 or higher is required. Current version: $(node -v)"
        exit 1
    fi
    
    # Check if TypeScript is available
    if ! command -v npx &> /dev/null; then
        print_error "npx is not available. Please install npm."
        exit 1
    fi
    
    # Check if ts-node is available
    if ! npx ts-node --version &> /dev/null; then
        print_warning "ts-node not found. Installing..."
        npm install -g ts-node typescript
    fi
    
    print_success "Prerequisites check passed"
}

# Function to parse command line arguments
parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --output=*)
                OUTPUT_DIR="${1#*=}"
                shift
                ;;
            --no-lessons)
                GENERATE_LESSONS=false
                shift
                ;;
            --no-indexes)
                BUILD_INDEXES=false
                shift
                ;;
            --start-server)
                START_SERVER=true
                shift
                ;;
            --port=*)
                SERVER_PORT="${1#*=}"
                shift
                ;;
            --force)
                SKIP_EXISTING=false
                shift
                ;;
            --concurrent=*)
                MAX_CONCURRENT="${1#*=}"
                shift
                ;;
            --help)
                show_usage
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                show_usage
                exit 1
                ;;
        esac
    done
}

# Function to show configuration
show_configuration() {
    echo ""
    echo "🎯 Configuration:"
    echo "=================="
    echo "📁 Output directory: $OUTPUT_DIR"
    echo "🔄 Generate lessons: $GENERATE_LESSONS"
    echo "🔍 Build indexes: $BUILD_INDEXES"
    echo "🚀 Start server: $START_SERVER"
    echo "🌐 Server port: $SERVER_PORT"
    echo "⏭️  Skip existing: $SKIP_EXISTING"
    echo "⚡ Max concurrent: $MAX_CONCURRENT"
    echo ""
}

# Function to build TypeScript arguments
build_ts_args() {
    local args=""
    
    if [ "$OUTPUT_DIR" != "./offline-lessons" ]; then
        args="$args --output=$OUTPUT_DIR"
    fi
    
    if [ "$GENERATE_LESSONS" = false ]; then
        args="$args --no-lessons"
    fi
    
    if [ "$BUILD_INDEXES" = false ]; then
        args="$args --no-indexes"
    fi
    
    if [ "$START_SERVER" = true ]; then
        args="$args --start-server"
    fi
    
    if [ "$SERVER_PORT" != 3000 ]; then
        args="$args --port=$SERVER_PORT"
    fi
    
    if [ "$SKIP_EXISTING" = false ]; then
        args="$args --force"
    fi
    
    if [ "$MAX_CONCURRENT" != 3 ]; then
        args="$args --concurrent=$MAX_CONCURRENT"
    fi
    
    echo "$args"
}

# Function to estimate generation time
estimate_time() {
    local total_lessons=27375  # 365 * 5 ages * 3 tones * 5 languages
    local lessons_per_second=2  # Conservative estimate
    local total_seconds=$((total_lessons / lessons_per_second))
    local hours=$((total_seconds / 3600))
    local minutes=$(((total_seconds % 3600) / 60))
    
    echo "Estimated generation time: ${hours}h ${minutes}m"
}

# Main execution
main() {
    echo "🎯 DailyLesson Offline Package Generator"
    echo "========================================"
    
    # Parse arguments
    parse_arguments "$@"
    
    # Check prerequisites
    check_prerequisites
    
    # Show configuration
    show_configuration
    
    # Confirm if user wants to proceed
    if [ "$GENERATE_LESSONS" = true ]; then
        print_warning "This will generate 27,375 lessons (365 days × 5 ages × 3 tones × 5 languages)"
        estimate_time
        echo ""
        read -p "Do you want to continue? (y/N): " -n 1 -r
        echo ""
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_info "Generation cancelled"
            exit 0
        fi
    fi
    
    # Build TypeScript arguments
    TS_ARGS=$(build_ts_args)
    
    # Run the TypeScript generator
    print_info "Starting offline package generation..."
    echo "Command: npx ts-node scripts/generate_offline_package.ts $TS_ARGS"
    echo ""
    
    npx ts-node scripts/generate_offline_package.ts $TS_ARGS
    
    if [ $? -eq 0 ]; then
        print_success "Offline package generation completed successfully!"
        
        if [ "$START_SERVER" = false ]; then
            echo ""
            echo "📋 Next steps:"
            echo "  1. Navigate to: $OUTPUT_DIR"
            echo "  2. Start the server: npx ts-node scripts/offline_server.ts"
            echo "  3. Open browser to: http://localhost:$SERVER_PORT"
        fi
    else
        print_error "Generation failed. Check the error messages above."
        exit 1
    fi
}

# Run main function with all arguments
main "$@" 