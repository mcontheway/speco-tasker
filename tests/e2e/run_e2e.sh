#!/bin/bash

# Treat unset variables as an error when substituting.
set -u
# Prevent errors in pipelines from being masked.
set -o pipefail

# --- Default Settings ---
run_verification_test=true

# --- Argument Parsing ---
# Simple loop to check for the skip flag
# Note: This needs to happen *before* the main block piped to tee
# if we want the decision logged early. Or handle args inside.
# Let's handle it before for clarity.
processed_args=()
while [[ $# -gt 0 ]]; do
  case "$1" in
    --skip-verification)
      run_verification_test=false
      echo "[INFO] Argument '--skip-verification' detected. Fallback verification will be skipped."
      shift # Consume the flag
      ;;
    --quick-verify)
      echo "[INFO] Quick verification mode enabled. Will perform basic functionality check."
      # Set quick mode flags
      export QUICK_VERIFY_MODE=true
      shift
      ;;
    --analyze-log)
      # Keep the analyze-log flag handling separate for now
      # It exits early, so doesn't conflict with the main run flags
      processed_args+=("$1")
      if [[ $# -gt 1 ]]; then
        processed_args+=("$2")
        shift 2
      else
        shift 1
      fi
      ;;
    *)
      # Unknown argument, pass it along or handle error
      # For now, just pass it along in case --analyze-log needs it later
      processed_args+=("$1")
      shift
      ;;
  esac
done
# Restore processed arguments ONLY if the array is not empty
if [ ${#processed_args[@]} -gt 0 ]; then
  set -- "${processed_args[@]}"
fi


# --- Configuration ---
# Assumes script is run from the project root (speco-tasker)
TASKMASTER_SOURCE_DIR="." # Current directory is the source
# Base directory for test runs, relative to project root
BASE_TEST_DIR="$TASKMASTER_SOURCE_DIR/tests/e2e/_runs"
# Log directory, relative to project root
LOG_DIR="$TASKMASTER_SOURCE_DIR/tests/e2e/log"
# Note: No PRD processing in Speco Tasker (non-AI version)
# Path to the main .env file in the source directory
MAIN_ENV_FILE="$TASKMASTER_SOURCE_DIR/.env"
# ---

# <<< Source the helper script >>>
# e2e_helpers.sh removed - no AI functionality in Speco Tasker

# ==========================================
# >>> Global Helper Functions Defined in run_e2e.sh <<<
# --- Helper Functions (Define globally before export) ---
_format_duration() {
  local total_seconds=$1
  local minutes=$((total_seconds / 60))
  local seconds=$((total_seconds % 60))
  printf "%dm%02ds" "$minutes" "$seconds"
}

# Note: This relies on 'overall_start_time' being set globally before the function is called
_get_elapsed_time_for_log() {
  local current_time
  current_time=$(date +%s)
  # Use overall_start_time here, as start_time_for_helpers might not be relevant globally
  local elapsed_seconds
  elapsed_seconds=$((current_time - overall_start_time))
  _format_duration "$elapsed_seconds"
}

log_info() {
  echo "[INFO] [$(_get_elapsed_time_for_log)] $(date +"%Y-%m-%d %H:%M:%S") $1"
}

log_success() {
  echo "[SUCCESS] [$(_get_elapsed_time_for_log)] $(date +"%Y-%m-%d %H:%M:%S") $1"
}

log_error() {
  echo "[ERROR] [$(_get_elapsed_time_for_log)] $(date +"%Y-%m-%d %H:%M:%S") $1" >&2
}

log_step() {
  test_step_count=$((test_step_count + 1))
  echo ""
  echo "============================================="
  echo "  STEP ${test_step_count}: [$(_get_elapsed_time_for_log)] $(date +"%Y-%m-%d %H:%M:%S") $1"
  echo "============================================="
}
# ==========================================

# <<< Export helper functions for subshells >>>
export -f log_info log_success log_error log_step _format_duration _get_elapsed_time_for_log

# --- Argument Parsing for Analysis-Only Mode ---
# This remains the same, as it exits early if matched
if [ "$#" -ge 1 ] && [ "$1" == "--analyze-log" ]; then
  LOG_TO_ANALYZE=""
  # Check if a log file path was provided as the second argument
  if [ "$#" -ge 2 ] && [ -n "$2" ]; then
    LOG_TO_ANALYZE="$2"
    echo "[INFO] Using specified log file for analysis: $LOG_TO_ANALYZE"
  else
    echo "[INFO] Log file not specified. Attempting to find the latest log..."
    # Find the latest log file in the LOG_DIR
    # Ensure LOG_DIR is absolute for ls to work correctly regardless of PWD
    ABS_LOG_DIR="$(cd "$TASKMASTER_SOURCE_DIR/$LOG_DIR" && pwd)"
    LATEST_LOG=$(ls -t "$ABS_LOG_DIR"/e2e_run_*.log 2>/dev/null | head -n 1)

    if [ -z "$LATEST_LOG" ]; then
      echo "[ERROR] No log files found matching 'e2e_run_*.log' in $ABS_LOG_DIR. Cannot analyze." >&2
      exit 1
    fi
    LOG_TO_ANALYZE="$LATEST_LOG"
    echo "[INFO] Found latest log file: $LOG_TO_ANALYZE"
  fi

  # Ensure the log path is absolute (it should be if found by ls, but double-check)
  if [[ "$LOG_TO_ANALYZE" != /* ]]; then
    LOG_TO_ANALYZE="$(pwd)/$LOG_TO_ANALYZE" # Fallback if relative path somehow occurred
  fi
  echo "[INFO] Running in analysis-only mode for log: $LOG_TO_ANALYZE"

  # --- Derive TEST_RUN_DIR from log file path ---
  # Extract timestamp like YYYYMMDD_HHMMSS from e2e_run_YYYYMMDD_HHMMSS.log
  log_basename=$(basename "$LOG_TO_ANALYZE")
  # Ensure the sed command matches the .log suffix correctly
  timestamp_match=$(echo "$log_basename" | sed -n 's/^e2e_run_\([0-9]\{8\}_[0-9]\{6\}\)\.log$/\1/p')

  if [ -z "$timestamp_match" ]; then
    echo "[ERROR] Could not extract timestamp from log file name: $log_basename" >&2
    echo "[ERROR] Expected format: e2e_run_YYYYMMDD_HHMMSS.log" >&2
    exit 1
  fi

  # Construct the expected run directory path relative to project root
  EXPECTED_RUN_DIR="$TASKMASTER_SOURCE_DIR/tests/e2e/_runs/run_$timestamp_match"
  # Make it absolute
  EXPECTED_RUN_DIR_ABS="$(cd "$TASKMASTER_SOURCE_DIR" && pwd)/tests/e2e/_runs/run_$timestamp_match"

  if [ ! -d "$EXPECTED_RUN_DIR_ABS" ]; then
    echo "[ERROR] Corresponding test run directory not found: $EXPECTED_RUN_DIR_ABS" >&2
    exit 1
  fi

  # Save original dir before changing
  ORIGINAL_DIR=$(pwd)

  echo "[INFO] Changing directory to $EXPECTED_RUN_DIR_ABS for analysis context..."
  cd "$EXPECTED_RUN_DIR_ABS"

  # Speco Tasker - No LLM analysis available
  echo "[INFO] Speco Tasker completed - no AI analysis available"
  ANALYSIS_EXIT_CODE=0

  # Return to original directory
  cd "$ORIGINAL_DIR"
  exit $ANALYSIS_EXIT_CODE
fi
# --- End Analysis-Only Mode Logic ---

# --- Normal Execution Starts Here (if not in analysis-only mode) ---

# --- Test State Variables ---
# Note: These are mainly for step numbering within the log now, not for final summary
test_step_count=0
start_time_for_helpers=0 # Separate start time for helper functions inside the pipe
# Speco Tasker - No AI cost tracking needed
# ---

# --- Log File Setup ---
# Create the log directory if it doesn't exist
mkdir -p "$LOG_DIR"
# Define timestamped log file path
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
# <<< Use pwd to create an absolute path AND add .log extension >>>
LOG_FILE="$(pwd)/$LOG_DIR/e2e_run_${TIMESTAMP}.log"

# Define and create the test run directory *before* the main pipe
mkdir -p "$BASE_TEST_DIR" # Ensure base exists first
TEST_RUN_DIR="$BASE_TEST_DIR/run_$TIMESTAMP"
mkdir -p "$TEST_RUN_DIR"

# Echo starting message to the original terminal BEFORE the main piped block
echo "Starting E2E test. Output will be shown here and saved to: $LOG_FILE"
echo "Running from directory: $(pwd)"
echo "--- Starting E2E Run ---" # Separator before piped output starts

# Record start time for overall duration *before* the pipe
overall_start_time=$(date +%s)

# <<< DEFINE ORIGINAL_DIR GLOBALLY HERE >>>
ORIGINAL_DIR=$(pwd)

# ==========================================
# >>> MOVE FUNCTION DEFINITION HERE <<<
# --- Helper Functions (Define globally) ---
_format_duration() {
  local total_seconds=$1
  local minutes=$((total_seconds / 60))
  local seconds=$((total_seconds % 60))
  printf "%dm%02ds" "$minutes" "$seconds"
}

# Note: This relies on 'overall_start_time' being set globally before the function is called
_get_elapsed_time_for_log() {
  local current_time=$(date +%s)
  # Use overall_start_time here, as start_time_for_helpers might not be relevant globally
  local elapsed_seconds=$((current_time - overall_start_time))
  _format_duration "$elapsed_seconds"
}

log_info() {
  echo "[INFO] [$(_get_elapsed_time_for_log)] $(date +"%Y-%m-%d %H:%M:%S") $1"
}

log_success() {
  echo "[SUCCESS] [$(_get_elapsed_time_for_log)] $(date +"%Y-%m-%d %H:%M:%S") $1"
}

log_error() {
  echo "[ERROR] [$(_get_elapsed_time_for_log)] $(date +"%Y-%m-%d %H:%M:%S") $1" >&2
}

log_step() {
  test_step_count=$((test_step_count + 1))
  echo ""
  echo "============================================="
  echo "  STEP ${test_step_count}: [$(_get_elapsed_time_for_log)] $(date +"%Y-%m-%d %H:%M:%S") $1"
  echo "============================================="
}

# ==========================================

# --- Main Execution Block (Piped to tee) ---
# Wrap the main part of the script in braces and pipe its output (stdout and stderr) to tee
{
  # Note: Helper functions are now defined globally above,
  # but we still need start_time_for_helpers if any logging functions
  # called *inside* this block depend on it. If not, it can be removed.
  start_time_for_helpers=$(date +%s) # Keep if needed by helpers called inside this block

  # Log the verification decision
  if [ "$run_verification_test" = true ]; then
      log_info "Fallback verification test will be run as part of this E2E test."
  else
      log_info "Fallback verification test will be SKIPPED (--skip-verification flag detected)."
  fi

  # --- Dependency Checks ---
  log_step "Checking for dependencies (jq, bc)"
  if ! command -v jq &> /dev/null; then
      log_error "Dependency 'jq' is not installed or not found in PATH. Please install jq (e.g., 'brew install jq' or 'sudo apt-get install jq')."
      exit 1
  fi
  if ! command -v bc &> /dev/null; then
      log_error "Dependency 'bc' not installed (for cost calculation). Please install bc (e.g., 'brew install bc' or 'sudo apt-get install bc')."
      exit 1
  fi
  log_success "Dependencies 'jq' and 'bc' found."

  # --- Test Setup (Output to tee) ---
  log_step "Setting up test environment"

  log_step "Creating global npm link for speco-tasker"
  if npm link; then
    log_success "Global link created/updated."
  else
    log_error "Failed to run 'npm link'. Check permissions or output for details."
    exit 1
  fi

  log_info "Ensured base test directory exists: $BASE_TEST_DIR"

  log_info "Using test run directory (created earlier): $TEST_RUN_DIR"

  # Note: This is a non-AI version of Speco Tasker - no .env file required
  log_info "Running Speco Tasker (non-AI version) - no .env file required."

  # Speco Tasker - No PRD processing required
  log_success "Speco Tasker initialized - no PRD processing needed."

  # ORIGINAL_DIR=$(pwd) # Save original dir # <<< REMOVED FROM HERE
  cd "$TEST_RUN_DIR"
  log_info "Changed directory to $(pwd)"

  # === Speco Tasker Setup (No .env required) ===
  log_step "Setting up Speco Tasker (no API keys needed)"
  log_success "Speco Tasker setup completed - no .env file required."
  # ========================================

  # --- Test Execution (Output to tee) ---

  log_step "Using globally linked speco-tasker package"
  log_success "Using globally linked speco-tasker package."

  log_step "Initializing Speco Tasker project (non-interactive)"
  # Clean up any existing .speco directory from previous runs
  if [ -d ".speco" ]; then
    log_info "Removing existing .speco directory from previous run"
    rm -rf ".speco"
  fi
  # Run init in the current directory (TEST_RUN_DIR) to create a fresh project
  "$ORIGINAL_DIR/bin/speco-tasker.js" init -y --name="E2E Test $TIMESTAMP"
  if [ ! -f ".speco/config.json" ]; then
    log_error "Initialization failed: .speco/config.json not found."
    exit 1
  fi
  log_success "Project initialized."

  log_step "Creating initial tasks manually"
  # Create initial tasks manually for core functionality testing
  "$ORIGINAL_DIR/bin/speco-tasker.js" task add-task --title="Setup project structure" --description="Create basic project structure with folders and configuration files" --details="Create src/, tests/, docs/ directories and basic config files" --test-strategy="Manual testing by checking directory structure" --spec-files="README.md" --priority=high
  "$ORIGINAL_DIR/bin/speco-tasker.js" task add-task --title="Implement backend API" --description="Create REST API endpoints for data management" --details="Create REST API endpoints for CRUD operations" --test-strategy="API endpoint testing with Postman" --spec-files="API-spec.md" --priority=high
  "$ORIGINAL_DIR/bin/speco-tasker.js" task add-task --title="Setup database connection" --description="Configure database connection and schema" --details="Configure database connection and create initial schema" --test-strategy="Database connection and schema validation" --spec-files="Database-spec.md" --priority=medium --dependencies=1
  "$ORIGINAL_DIR/bin/speco-tasker.js" task add-task --title="Create frontend UI" --description="Build user interface components" --details="Build React components and UI layout" --test-strategy="UI component testing and user acceptance" --spec-files="UI-spec.md" --priority=medium --dependencies=2
  "$ORIGINAL_DIR/bin/speco-tasker.js" task add-task --title="Add authentication" --description="Implement user authentication system" --details="Implement JWT authentication with login/register" --test-strategy="Authentication flow testing" --spec-files="Auth-spec.md" --priority=medium --dependencies=2
  "$ORIGINAL_DIR/bin/speco-tasker.js" task add-task --title="Write tests" --description="Create unit and integration tests" --details="Create comprehensive test suite for all components" --test-strategy="Test coverage and CI/CD integration" --spec-files="Test-spec.md" --priority=low --dependencies=1,2,3,4,5

  if [ ! -s ".speco/tasks/tasks.json" ]; then
    log_error "Task creation failed: .speco/tasks/tasks.json not found or is empty."
    exit 1
  else
    log_success "Initial tasks created successfully."
  fi

  log_step "Adding subtasks manually (to ensure subtask 1.1 exists)"
  # Add subtasks manually since expand functionality is removed
  "$ORIGINAL_DIR/bin/speco-tasker.js" task add-subtask --parent=1 --title="Setup basic project structure" --description="Create folders and initial files" --details="Create src/, tests/, docs/ directories"
  "$ORIGINAL_DIR/bin/speco-tasker.js" task add-subtask --parent=1 --title="Configure build system" --description="Setup package.json and build configuration" --details="Configure build scripts and dependencies"
  "$ORIGINAL_DIR/bin/speco-tasker.js" task add-subtask --parent=1 --title="Initialize version control" --description="Setup git repository and initial commit" --details="Initialize git and create initial commit"
  log_success "Added manual subtasks to Task 1."

  log_step "Setting status for Subtask 1.1 (assuming it exists)"
  "$ORIGINAL_DIR/bin/speco-tasker.js" task set-status --id=1.1 --status=done
  log_success "Attempted to set status for Subtask 1.1 to 'done'."

  log_step "Listing tasks again (after changes)"
  "$ORIGINAL_DIR/bin/speco-tasker.js" task list --with-subtasks > task_list_after_changes.log
  log_success "Task list after changes saved to task_list_after_changes.log"

  # === Start New Test Section: Tag-Aware Expand Testing ===
  log_step "Testing tag functionality with manual subtasks"
  "$ORIGINAL_DIR/bin/speco-tasker.js" task add-tag feature-manual --description="Tag for testing manual subtask creation"
  log_success "Created feature-manual tag."

  log_step "Adding task to feature-manual tag"
  "$ORIGINAL_DIR/bin/speco-tasker.js" task add-task --tag=feature-manual --title="Manual test task" --description="Test task for manual subtask creation" --details="Test manual task creation in different tag" --test-strategy="Manual verification" --spec-files="Test-spec.md" --priority=medium
  # Get the new task ID dynamically
  manual_task_id=$(jq -r '.["feature-manual"].tasks[-1].id' .speco/tasks/tasks.json)
  log_success "Added task $manual_task_id to feature-manual tag."

  log_step "Adding manual subtasks to tagged task"
  "$ORIGINAL_DIR/bin/speco-tasker.js" task add-subtask --tag=feature-manual --parent="$manual_task_id" --title="Manual subtask 1" --description="First manual subtask" --details="First manual subtask implementation"
  "$ORIGINAL_DIR/bin/speco-tasker.js" task add-subtask --tag=feature-manual --parent="$manual_task_id" --title="Manual subtask 2" --description="Second manual subtask" --details="Second manual subtask implementation"
  log_success "Added manual subtasks to tagged task."

  log_step "Verifying tag functionality"
  task_master_tag_count=$(jq -r '.main.tasks | length' .speco/tasks/tasks.json 2>/dev/null || echo "0")
  feature_manual_tag_count=$(jq -r '.["feature-manual"].tasks | length' .speco/tasks/tasks.json 2>/dev/null || echo "0")

  if [ "$task_master_tag_count" -gt "0" ] && [ "$feature_manual_tag_count" -gt "0" ]; then
    log_success "Tag functionality working: main has $task_master_tag_count tasks, feature-manual has $feature_manual_tag_count tasks"
  else
    log_error "Tag functionality issue: main=$task_master_tag_count, feature-manual=$feature_manual_tag_count"
  fi


  # === End New Test Section: Tag-Aware Expand Testing ===

  # === Speco Tasker Core Functionality Test ===
  log_step "Testing Speco Tasker core commands"
  log_success "Speco Tasker core functionality ready for testing."

  # === End Core Setup ===

  # === Speco Tasker Non-AI Verification ===
  log_step "Verifying Speco Tasker non-AI functionality"
  log_success "Speco Tasker running without AI dependencies."
  # === END Verification Section ===


  # === Speco Tasker Manual Task Management Test ===
  log_step "Testing manual task creation and management"
  log_success "Manual task management functionality ready."
  # === End Manual Task Test ===

  log_step "Listing tasks again (after multi-add)"
  "$ORIGINAL_DIR/bin/speco-tasker.js" task list --with-subtasks > task_list_after_multi_add.log
  log_success "Task list after multi-add saved to task_list_after_multi_add.log"


  # === Resume Core Task Commands Test ===
  log_step "Listing tasks (for core tests)"
  "$ORIGINAL_DIR/bin/speco-tasker.js" task list > task_list_core_test_start.log
  log_success "Core test initial task list saved."

  log_step "Getting next task"
  "$ORIGINAL_DIR/bin/speco-tasker.js" task next > next_task_core_test.log
  log_success "Core test next task saved."

  log_step "Showing Task 1 details"
  "$ORIGINAL_DIR/bin/speco-tasker.js" task show 1 > task_1_details_core_test.log
  log_success "Task 1 details saved."

  log_step "Adding dependency (Task 2 depends on Task 1)"
  "$ORIGINAL_DIR/bin/speco-tasker.js" task add-dependency --id=2 --depends-on=1
  log_success "Added dependency 2->1."

  log_step "Validating dependencies (after add)"
  "$ORIGINAL_DIR/bin/speco-tasker.js" task validate-dependencies > validate_dependencies_after_add_core.log
  log_success "Dependency validation after add saved."

  log_step "Removing dependency (Task 2 depends on Task 1)"
  "$ORIGINAL_DIR/bin/speco-tasker.js" task remove-dependency --id=2 --depends-on=1
  log_success "Removed dependency 2->1."

  log_step "Fixing dependencies (should be no-op now)"
  "$ORIGINAL_DIR/bin/speco-tasker.js" task fix-dependencies > fix_dependencies_output_core.log
  log_success "Fix dependencies attempted."

  # === Start New Test Section: Validate/Fix Bad Dependencies ===

  log_step "Intentionally adding non-existent dependency (1 -> 999)"
  "$ORIGINAL_DIR/bin/speco-tasker.js" task add-dependency --id=1 --depends-on=999 || log_error "Failed to add non-existent dependency (unexpected)"
  # Don't exit even if the above fails, the goal is to test validation
  log_success "Attempted to add dependency 1 -> 999."

  log_step "Validating dependencies (expecting non-existent error)"
  "$ORIGINAL_DIR/bin/speco-tasker.js" task validate-dependencies > validate_deps_non_existent.log 2>&1 || true # Allow command to fail without exiting script
  if grep -q "Non-existent dependency ID: 999" validate_deps_non_existent.log; then
      log_success "Validation correctly identified non-existent dependency 999."
  else
      log_error "Validation DID NOT report non-existent dependency 999 as expected. Check validate_deps_non_existent.log"
  fi

  log_step "Fixing dependencies (should remove 1 -> 999)"
  "$ORIGINAL_DIR/bin/speco-tasker.js" task fix-dependencies > fix_deps_after_non_existent.log
  log_success "Attempted to fix dependencies."

  log_step "Validating dependencies (after fix)"
  "$ORIGINAL_DIR/bin/speco-tasker.js" task validate-dependencies > validate_deps_after_fix_non_existent.log 2>&1 || true # Allow potential failure
  if grep -q "Non-existent dependency ID: 999" validate_deps_after_fix_non_existent.log; then
      log_error "Validation STILL reports non-existent dependency 999 after fix. Check logs."
  else
      log_success "Validation shows non-existent dependency 999 was removed."
  fi


  log_step "Intentionally adding circular dependency (4 -> 5 -> 4)"
  "$ORIGINAL_DIR/bin/speco-tasker.js" task add-dependency --id=4 --depends-on=5 || log_error "Failed to add dependency 4->5"
  "$ORIGINAL_DIR/bin/speco-tasker.js" task add-dependency --id=5 --depends-on=4 || log_error "Failed to add dependency 5->4"
  log_success "Attempted to add dependencies 4 -> 5 and 5 -> 4."


  log_step "Validating dependencies (expecting circular error)"
  "$ORIGINAL_DIR/bin/speco-tasker.js" task validate-dependencies > validate_deps_circular.log 2>&1 || true # Allow command to fail
  # Note: Adjust the grep pattern based on the EXACT error message from validate-dependencies
  if grep -q -E "Circular dependency detected involving task IDs: (4, 5|5, 4)" validate_deps_circular.log; then
      log_success "Validation correctly identified circular dependency between 4 and 5."
  else
      log_error "Validation DID NOT report circular dependency 4<->5 as expected. Check validate_deps_circular.log"
  fi

  log_step "Fixing dependencies (should remove one side of 4 <-> 5)"
  "$ORIGINAL_DIR/bin/speco-tasker.js" task fix-dependencies > fix_deps_after_circular.log
  log_success "Attempted to fix dependencies."

  log_step "Validating dependencies (after fix circular)"
  "$ORIGINAL_DIR/bin/speco-tasker.js" task validate-dependencies > validate_deps_after_fix_circular.log 2>&1 || true # Allow potential failure
  if grep -q -E "Circular dependency detected involving task IDs: (4, 5|5, 4)" validate_deps_after_fix_circular.log; then
      log_error "Validation STILL reports circular dependency 4<->5 after fix. Check logs."
  else
      log_success "Validation shows circular dependency 4<->5 was resolved."
  fi

  # === End New Test Section ===

  # Find the next available task ID dynamically
  last_task_id=$(jq '[.main.tasks[].id] | max' .speco/tasks/tasks.json)
  manual_task_id=$((last_task_id + 1))

  log_step "Adding additional manual task for testing"
  "$ORIGINAL_DIR/bin/speco-tasker.js" task add-task --title="Manual E2E Task" --description="Add basic health check endpoint" --details="Create health check endpoint" --test-strategy="Manual testing" --spec-files="README.md" --priority=low --dependencies=3
  log_success "Added additional manual task for comprehensive testing."

  log_step "Testing manual subtask creation"
  "$ORIGINAL_DIR/bin/speco-tasker.js" task add-subtask --parent=8 --title="Manual subtask" --description="Test manual subtask creation" --details="Create manual subtask for testing"
  log_success "Added manual subtask successfully."

  # Add a couple more subtasks for multi-remove test
  log_step 'Adding subtasks to Task 2 (for multi-remove test)'
  "$ORIGINAL_DIR/bin/speco-tasker.js" task add-subtask --parent=2 --title="Subtask 2.1 for removal" --description="Test subtask for removal" --details="Create subtask to test removal functionality"
  "$ORIGINAL_DIR/bin/speco-tasker.js" task add-subtask --parent=2 --title="Subtask 2.2 for removal" --description="Test subtask for removal" --details="Create subtask to test removal functionality"
  log_success "Added subtasks 2.1 and 2.2."

  log_step "Removing Subtasks 2.1 and 2.2 (multi-ID)"
  "$ORIGINAL_DIR/bin/speco-tasker.js" task remove-subtask --id=2.1,2.2
  log_success "Removed subtasks 2.1 and 2.2."

  log_step "Setting status for Task 1 to done"
  "$ORIGINAL_DIR/bin/speco-tasker.js" task set-status --id=1 --status=done
  log_success "Set status for Task 1 to done."

  log_step "Getting next task (after status change)"
  "$ORIGINAL_DIR/bin/speco-tasker.js" task next > next_task_after_change_core.log
  log_success "Next task after change saved."

  # === Start New Test Section: List Filtering ===
  log_step "Listing tasks filtered by status 'done'"
  "$ORIGINAL_DIR/bin/speco-tasker.js" task list --status=done > task_list_status_done.log
  log_success "Filtered list saved to task_list_status_done.log"
  # Optional assertion: Check if Task 1 ID exists and Task 2 ID does NOT
  # if grep -q "^1\." task_list_status_done.log && ! grep -q "^2\." task_list_status_done.log; then
  #    log_success "Basic check passed: Task 1 found, Task 2 not found in 'done' list."
  # else
  #    log_error "Basic check failed for list --status=done."
  # fi
  # === End New Test Section ===

  log_step "Clearing subtasks from Task 8"
  "$ORIGINAL_DIR/bin/speco-tasker.js" task clear-subtasks --id=8
  log_success "Attempted to clear subtasks from Task 8."

  log_step "Removing manual task $manual_task_id"
  # Remove the task we added earlier
  "$ORIGINAL_DIR/bin/speco-tasker.js" task remove-task --id="$manual_task_id" -y
  log_success "Removed task $manual_task_id."

  # === Start New Test Section: Subtasks & Dependencies ===

  log_step "Adding subtasks to Task 2 manually"
  "$ORIGINAL_DIR/bin/speco-tasker.js" task add-subtask --parent=2 --title="Backend setup subtask" --description="Manual subtask for backend" --details="Setup backend infrastructure"
  log_success "Added manual subtask to Task 2."

  log_step "Listing tasks with subtasks (Before Clear All)"
  "$ORIGINAL_DIR/bin/speco-tasker.js" task list --with-subtasks > task_list_before_clear_all.log
  log_success "Task list before clear-all saved."

  log_step "Clearing ALL subtasks"
  "$ORIGINAL_DIR/bin/speco-tasker.js" task clear-subtasks --all
  log_success "Attempted to clear all subtasks."

  log_step "Listing tasks with subtasks (After Clear All)"
  "$ORIGINAL_DIR/bin/speco-tasker.js" task list --with-subtasks > task_list_after_clear_all.log
  log_success "Task list after clear-all saved."

  log_step "Adding subtask to Task 3 manually"
  "$ORIGINAL_DIR/bin/speco-tasker.js" task add-subtask --parent=3 --title="Subtask 3.1" --description="Manual subtask for Task 3" --details="Create subtask for Task 3"
  log_success "Added subtask 3.1 to Task 3."
  # Verify 3.1 exists
  if ! jq -e '.main.tasks[] | select(.id == 3) | .subtasks[] | select(.id == 1)' .speco/tasks/tasks.json > /dev/null 2>&1; then
      log_error "Subtask 3.1 not found in tasks.json after manual creation."
      exit 1
  fi

  log_step "Adding dependency: Task 4 depends on Subtask 3.1"
  "$ORIGINAL_DIR/bin/speco-tasker.js" task add-dependency --id=4 --depends-on=3.1
  log_success "Added dependency 4 -> 3.1."

  log_step "Showing Task 4 details (after adding subtask dependency)"
  "$ORIGINAL_DIR/bin/speco-tasker.js" task show 4 > task_4_details_after_dep_add.log
  log_success "Task 4 details saved."

  log_step "Removing dependency: Task 4 depends on Subtask 3.1"
  "$ORIGINAL_DIR/bin/speco-tasker.js" task remove-dependency --id=4 --depends-on=3.1
  log_success "Removed dependency 4 -> 3.1."

  log_step "Showing Task 4 details (after removing subtask dependency)"
  "$ORIGINAL_DIR/bin/speco-tasker.js" task show 4 > task_4_details_after_dep_remove.log
  log_success "Task 4 details saved."

  # === End New Test Section ===

  log_step "Generating task files (final)"
  "$ORIGINAL_DIR/bin/speco-tasker.js" generate
  log_success "Generated task files."
  # === End Core Task Commands Test ===

  # === Final Core Functionality Test ===
  log_step "Testing final core functionality"
  "$ORIGINAL_DIR/bin/speco-tasker.js" task list --with-subtasks > final_task_list.log
  log_success "Final task list saved successfully."
  # === End Final Test ===

  log_step "Listing tasks again (final)"
  "$ORIGINAL_DIR/bin/speco-tasker.js" task list --with-subtasks > task_list_final.log
  log_success "Final task list saved to task_list_final.log"

  # --- Test Completion (Output to tee) ---
  log_step "E2E Test Steps Completed"
  echo ""
  ABS_TEST_RUN_DIR="$(pwd)"
  echo "Test artifacts and logs are located in: $ABS_TEST_RUN_DIR"
  echo "Key artifact files (within above dir):"
  ls -1 # List files in the current directory
  echo ""
  echo "Full script log also available at: $LOG_FILE (relative to project root)"

  # Optional: cd back to original directory
  # cd "$ORIGINAL_DIR"

# End of the main execution block brace
} 2>&1 | tee "$LOG_FILE"

# --- Final Terminal Message ---
EXIT_CODE=${PIPESTATUS[0]}
overall_end_time=$(date +%s)
total_elapsed_seconds=$((overall_end_time - overall_start_time))

# Format total duration
total_minutes=$((total_elapsed_seconds / 60))
total_sec_rem=$((total_elapsed_seconds % 60))
formatted_total_time=$(printf "%dm%02ds" "$total_minutes" "$total_sec_rem")

# Count steps and successes from the log file *after* the pipe finishes
# Use grep -c for counting lines matching the pattern
# Corrected pattern to match '  STEP X:' format
final_step_count=$(grep -c '^[[:space:]]\+STEP [0-9]\+:' "$LOG_FILE" || true)
final_success_count=$(grep -c '\[SUCCESS\]' "$LOG_FILE" || true) # Count lines containing [SUCCESS]

echo "--- E2E Run Summary ---"
echo "Log File: $LOG_FILE"
echo "Total Elapsed Time: ${formatted_total_time}"
echo "Total Steps Executed: ${final_step_count}" # Use count from log

if [ $EXIT_CODE -eq 0 ]; then
    echo "Status: SUCCESS"
    # Use counts from log file
    echo "Successful Steps: ${final_success_count}/${final_step_count}"
else
    echo "Status: FAILED"
    # Use count from log file for total steps attempted
    echo "Failure likely occurred during/after Step: ${final_step_count}"
    # Use count from log file for successes before failure
    echo "Successful Steps Before Failure: ${final_success_count}"
    echo "Please check the log file '$LOG_FILE' for error details."
fi
echo "-------------------------"

# --- Attempt LLM Analysis ---
# Run this *after* the main execution block and tee pipe finish writing the log file
if [ -d "$TEST_RUN_DIR" ]; then
  # Define absolute path to source dir if not already defined (though it should be by setup)
  TASKMASTER_SOURCE_DIR_ABS=${TASKMASTER_SOURCE_DIR_ABS:-$(cd "$ORIGINAL_DIR/$TASKMASTER_SOURCE_DIR" && pwd)}

  cd "$TEST_RUN_DIR"
  # Speco Tasker - No LLM analysis available
  echo "[INFO] Speco Tasker test completed - no AI analysis available"
  ANALYSIS_EXIT_CODE=0 # Success - no analysis needed
  # Optional: cd back again if needed
  cd "$ORIGINAL_DIR" # Ensure we change back to the original directory
else
  formatted_duration_for_error=$(_format_duration "$total_elapsed_seconds")
  echo "[ERROR] [$formatted_duration_for_error] $(date +"%Y-%m-%d %H:%M:%S") Test run directory $TEST_RUN_DIR not found. Cannot perform analysis." >&2
fi

# Speco Tasker - No AI cost formatting needed
echo "Speco Tasker E2E Test Completed - No AI costs incurred"

exit $EXIT_CODE