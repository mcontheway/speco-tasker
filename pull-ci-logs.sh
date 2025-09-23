#!/usr/bin/env bash
# pull-ci-logs.sh - Pull latest CI logs from GitHub Actions
# Usage: ./pull-ci-logs.sh [options]

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
LIMIT=1
OUTPUT_FILE="ci-log-latest.txt"
BRANCH=""
WORKFLOW=""
VERBOSE=false

# Function to print usage
usage() {
    cat << EOF
Usage: $0 [OPTIONS]

Pull the latest CI logs from GitHub Actions and save to a file.

OPTIONS:
    -l, --limit NUM       Number of recent runs to check (default: 1)
    -o, --output FILE     Output file name (default: ci-log-latest.txt)
    -b, --branch BRANCH   Filter by branch name
    -w, --workflow NAME   Filter by workflow name
    -v, --verbose         Enable verbose output
    -h, --help           Show this help message

EXAMPLES:
    $0                                    # Get latest CI run logs
    $0 -l 5 -o ci-logs.txt               # Get last 5 runs logs
    $0 -b develop -w "CI"                # Get CI workflow logs from develop branch
    $0 --verbose                         # Show detailed progress

REQUIREMENTS:
    - GitHub CLI (gh) must be installed and authenticated
    - Repository must have GitHub Actions enabled

EOF
}

# Function to log messages
log() {
    local level=$1
    local message=$2
    case $level in
        "INFO") echo -e "${BLUE}[INFO]${NC} $message" ;;
        "SUCCESS") echo -e "${GREEN}[SUCCESS]${NC} $message" ;;
        "WARNING") echo -e "${YELLOW}[WARNING]${NC} $message" ;;
        "ERROR") echo -e "${RED}[ERROR]${NC} $message" >&2 ;;
    esac
}

# Function to check if gh CLI is available
check_gh_cli() {
    if ! command -v gh &> /dev/null; then
        log "ERROR" "GitHub CLI (gh) is not installed or not in PATH"
        log "INFO" "Please install GitHub CLI from: https://cli.github.com/"
        exit 1
    fi

    if ! gh auth status &> /dev/null; then
        log "ERROR" "GitHub CLI is not authenticated"
        log "INFO" "Please run: gh auth login"
        exit 1
    fi
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -l|--limit)
            LIMIT="$2"
            shift 2
            ;;
        -o|--output)
            OUTPUT_FILE="$2"
            shift 2
            ;;
        -b|--branch)
            BRANCH="$2"
            shift 2
            ;;
        -w|--workflow)
            WORKFLOW="$2"
            shift 2
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        *)
            log "ERROR" "Unknown option: $1"
            usage
            exit 1
            ;;
    esac
done

# Check if GitHub CLI is available
check_gh_cli

# Build gh run list command
CMD="gh run list --limit $LIMIT --json databaseId,status,conclusion,headBranch,workflowName"

if [ -n "$BRANCH" ]; then
    CMD="$CMD --branch $BRANCH"
fi

if [ "$VERBOSE" = true ]; then
    log "INFO" "Executing: $CMD"
fi

# Get the latest run ID
if [ "$VERBOSE" = true ]; then
    RUN_ID=$(eval "$CMD -q '.[0].databaseId'")
else
    RUN_ID=$(eval "$CMD -q '.[0].databaseId'" 2>/dev/null)
fi

if [ -z "$RUN_ID" ]; then
    log "ERROR" "No CI runs found"
    if [ -n "$BRANCH" ]; then
        log "INFO" "Try without branch filter or check if branch '$BRANCH' exists"
    fi
    exit 1
fi

log "INFO" "Found CI run ID: $RUN_ID"

# Get run information for better output
if [ "$VERBOSE" = true ]; then
    RUN_INFO=$(eval "$CMD -q '.[0] | {databaseId, status, conclusion, headBranch, workflowName}'")
    log "INFO" "Run info: $RUN_INFO"
fi

# Pull the logs
log "INFO" "Pulling logs for run $RUN_ID..."

if gh run view --log "$RUN_ID" > "$OUTPUT_FILE" 2>/dev/null; then
    log "SUCCESS" "CI logs saved to: $OUTPUT_FILE"

    # Show file size
    FILE_SIZE=$(du -h "$OUTPUT_FILE" | cut -f1)
    log "INFO" "Log file size: $FILE_SIZE"

    # Show a preview of the log (first few lines)
    echo
    echo "=== LOG PREVIEW ==="
    head -20 "$OUTPUT_FILE"
    echo "=== END PREVIEW ==="
    echo
    log "INFO" "Use 'tail -f $OUTPUT_FILE' to monitor or search through logs"
else
    log "ERROR" "Failed to pull logs for run $RUN_ID"
    exit 1
fi
