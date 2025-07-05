#!/bin/bash
# PHI Scanner - Pre-commit hook to detect and prevent PHI commits
# Part of HIPAA compliance for workflow-bolt project

set -e

echo "🔍 PHI Scanner: Checking for Protected Health Information..."

# Color codes for output
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# PHI Detection Patterns
PHI_PATTERNS=(
    # Realistic name patterns (avoid test data)
    "(?i)(john|jane|michael|sarah|alice|bob|mary|david|lisa|mark|emily|robert|jennifer|william|karen|thomas|susan|daniel|nancy|christopher|betty|matthew|helen|anthony|sandra|steven|donna|joshua|carol|andrew|ruth|kenneth|sharon|paul|michelle|joshua|laura|kevin|kimberly|brian|deborah|george|cynthia|edward|angela|ronald|brenda|timothy|emma|joseph|olivia|brandon|patricia)\s+(doe|smith|johnson|williams|brown|jones|garcia|miller|davis|rodriguez|martinez|hernandez|lopez|gonzalez|wilson|anderson|taylor|thomas|hernandez|moore|martin|jackson|thompson|white|lopez|lee|gonzalez|harris|clark|lewis|robinson|walker|perez|hall|young|allen)"
    
    # Email patterns (realistic domains)
    "[a-zA-Z0-9._%+-]+@(?!example\\.(?:com|local|org|net))[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}"
    
    # Phone number patterns (not test patterns)
    "(?<!000[.-]?000[.-]?000)[0-9]{3}[.-]?[0-9]{3}[.-]?[0-9]{4}"
    
    # SSN patterns
    "(?<!000[.-]?00[.-]?000)[0-9]{3}[.-]?[0-9]{2}[.-]?[0-9]{4}"
    
    # Medical record numbers
    "(?i)(mrn|medical.?record.?number|patient.?id)\\s*[:\\=]\\s*[a-zA-Z0-9]+"
    
    # DOB patterns (not obviously fake)
    "(?<!1900-01-01|2000-01-01|1980-01-01|1975-01-01|1990-01-01)[0-9]{4}[.-][0-9]{2}[.-][0-9]{2}"
    "(?<!01/01/1900|01/01/2000|01/01/1980|01/01/1975|01/01/1990)[0-9]{2}/[0-9]{2}/[0-9]{4}"
)

# Files to check (exclude directories and file types that shouldn't contain PHI)
INCLUDE_PATTERNS="--include=*.ts --include=*.js --include=*.py --include=*.json --include=*.md --include=*.txt"
EXCLUDE_DIRS="--exclude-dir=node_modules --exclude-dir=.git --exclude-dir=dist --exclude-dir=__pycache__ --exclude-dir=ai-agents"

# Function to check for PHI
check_phi() {
    local violations=0
    local files_checked=0
    
    echo "📋 Scanning files for PHI patterns..."
    
    # Check staged files if in git pre-commit context
    if git rev-parse --git-dir > /dev/null 2>&1 && [ "$1" = "--staged" ]; then
        echo "🔄 Checking staged files only..."
        local staged_files=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(ts|js|py|json|md|txt)$' || true)
        
        if [ -z "$staged_files" ]; then
            echo "✅ No relevant staged files to check"
            return 0
        fi
        
        for file in $staged_files; do
            if [ -f "$file" ]; then
                ((files_checked++))
                check_file_phi "$file" && ((violations++))
            fi
        done
    else
        # Check all files in the repository
        echo "🔄 Checking all repository files..."
        while IFS= read -r -d '' file; do
            ((files_checked++))
            check_file_phi "$file" && ((violations++))
        done < <(find . -type f \( -name "*.ts" -o -name "*.js" -o -name "*.py" -o -name "*.json" -o -name "*.md" -o -name "*.txt" \) \
                 ! -path "./node_modules/*" ! -path "./.git/*" ! -path "./dist/*" ! -path "./__pycache__/*" ! -path "./ai-agents/*" \
                 -print0)
    fi
    
    echo "📊 Scan complete: $files_checked files checked"
    
    if [ $violations -gt 0 ]; then
        echo -e "${RED}❌ PHI VIOLATIONS DETECTED: $violations files contain potential PHI${NC}"
        echo -e "${RED}🚨 COMMIT BLOCKED - Remove PHI before committing${NC}"
        echo ""
        echo -e "${YELLOW}📝 Remediation steps:${NC}"
        echo "1. Replace realistic names with synthetic ones (TestPatient A, TestProvider B)"
        echo "2. Use fake email domains (@example.local, @test.invalid)"
        echo "3. Use test phone numbers (000-000-0001, 000-000-0002)"
        echo "4. Use obviously fake dates (1980-01-01, 1990-01-01)"
        echo "5. Add comments marking data as synthetic: '⚠️ SYNTHETIC TEST DATA ONLY'"
        return 1
    else
        echo -e "${GREEN}✅ No PHI detected - Safe to commit${NC}"
        return 0
    fi
}

# Function to check individual file for PHI
check_file_phi() {
    local file="$1"
    local file_violations=0
    
    # Skip binary files
    if file "$file" | grep -q "binary"; then
        return 0
    fi
    
    # Check each PHI pattern
    for pattern in "${PHI_PATTERNS[@]}"; do
        local matches=$(grep -Pn "$pattern" "$file" 2>/dev/null || true)
        if [ -n "$matches" ]; then
            if [ $file_violations -eq 0 ]; then
                echo -e "${RED}❌ PHI VIOLATION: $file${NC}"
                ((file_violations++))
            fi
            echo -e "${YELLOW}   Pattern matches:${NC}"
            echo "$matches" | head -5 | sed 's/^/      /'
            if [ $(echo "$matches" | wc -l) -gt 5 ]; then
                echo "      ... and $(( $(echo "$matches" | wc -l) - 5 )) more matches"
            fi
        fi
    done
    
    # Check for obviously realistic data combinations
    if grep -qPi "(john|jane|alice|bob|mary|david|lisa|mark).*?(doe|smith|johnson|williams|brown)" "$file" 2>/dev/null; then
        if [ $file_violations -eq 0 ]; then
            echo -e "${RED}❌ PHI VIOLATION: $file${NC}"
            ((file_violations++))
        fi
        echo -e "${YELLOW}   Contains realistic name combinations${NC}"
    fi
    
    return $file_violations
}

# Function to install as git pre-commit hook
install_hook() {
    local git_dir=$(git rev-parse --git-dir 2>/dev/null)
    if [ -z "$git_dir" ]; then
        echo -e "${RED}❌ Not in a git repository${NC}"
        return 1
    fi
    
    local hook_file="$git_dir/hooks/pre-commit"
    local script_path=$(realpath "$0")
    
    echo "🔧 Installing PHI scanner as git pre-commit hook..."
    
    # Create pre-commit hook
    cat > "$hook_file" << EOF
#!/bin/bash
# Auto-generated PHI scanner pre-commit hook
# Generated on $(date)

exec "$script_path" --staged
EOF
    
    chmod +x "$hook_file"
    echo -e "${GREEN}✅ PHI scanner installed as pre-commit hook${NC}"
    echo "ℹ️  Hook location: $hook_file"
}

# Function to show help
show_help() {
    echo "PHI Scanner - Protect against committing PHI data"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --staged          Check only staged files (for git pre-commit)"
    echo "  --install-hook    Install as git pre-commit hook"
    echo "  --help           Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                # Check all files in repository"
    echo "  $0 --staged       # Check only staged files"
    echo "  $0 --install-hook # Install as git pre-commit hook"
}

# Main execution
case "${1:-}" in
    --staged)
        check_phi --staged
        ;;
    --install-hook)
        install_hook
        ;;
    --help)
        show_help
        ;;
    "")
        check_phi
        ;;
    *)
        echo -e "${RED}❌ Unknown option: $1${NC}"
        show_help
        exit 1
        ;;
esac