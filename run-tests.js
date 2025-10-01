const { spawn } = require('child_process')
const path = require('path')

// Simple test runner
console.log('🧪 Running Prepaid Production Model Tests...\n')

// Set test environment
process.env.NODE_ENV = 'test'
process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/limited-edition-test'

const testFiles = [
  'tests/api/echo/escrow.test.ts',
  'tests/api/production/triggers.test.ts', 
  'tests/api/press/approval.test.ts',
  'tests/api/payment/manual-confirmation.test.ts',
  'tests/integration/full-workflow.test.ts'
]

console.log('📋 Test Files:')
testFiles.forEach(file => console.log(`  ✓ ${file}`))
console.log('\n🚀 Starting tests...\n')

// Run with tsx for TypeScript support
const child = spawn('npx', ['tsx', '--test', ...testFiles], {
  stdio: 'inherit',
  shell: true
})

child.on('close', (code) => {
  if (code === 0) {
    console.log('\n✅ All tests completed successfully!')
  } else {
    console.log('\n❌ Some tests failed.')
    process.exit(code)
  }
})