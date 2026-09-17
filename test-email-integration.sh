#!/bin/bash
echo "=== TESTING EMAIL INTEGRATION ==="
echo ""

# Test 1: Environment Variables
echo "Test 1: Checking environment variables..."
if grep -q "GAS_EMAIL_WEBHOOK_URL" .env; then
  echo "✅ GAS_EMAIL_WEBHOOK_URL is set"
else
  echo "❌ GAS_EMAIL_WEBHOOK_URL is missing in .env"
fi

if grep -q "NEXT_PUBLIC_APP_URL" .env; then
  echo "✅ NEXT_PUBLIC_APP_URL is set"
else
  echo "❌ NEXT_PUBLIC_APP_URL is missing in .env"
fi
echo ""

# Test 2: File Existence
echo "Test 2: Checking files..."
files=(
  "src/lib/email-gas.ts"
  "src/app/(dashboard)/workspace/[workspaceId]/team/actions.ts"
  "src/components/invite-member-dialog.tsx"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "✅ $file exists"
  else
    echo "❌ $file is missing"
  fi
done
echo ""

# Test 3: TypeScript Compilation
echo "Test 3: Checking TypeScript compilation..."
if npx tsc --noEmit; then
  echo "✅ TypeScript compilation passed"
else
  echo "❌ TypeScript compilation failed"
fi
echo ""

# Test 4: Manual Testing Checklist
echo "=== MANUAL TESTING CHECKLIST ==="
echo "1. Run your dev server: npm run dev"
echo "2. Login as a workspace ADMIN"
echo "3. Navigate to the Team page: /workspace/[YOUR_WORKSPACE_ID]/team"
echo "4. Verify 'Invite Member' button is visible"
echo "5. Click 'Invite Member' and submit an email address"
echo "6. Verify loading spinner appears on the submit button"
echo "7. Verify success toast appears and dialog closes"
echo "8. Check your email inbox / GAS logs for the sent invitation"
