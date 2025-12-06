/**
 * Manual Test Script for Split Validation
 * 
 * This script tests the new validation rules for split amounts
 * Run with: node backend/test-split-validation-manual.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const SplitService = require('./services/SplitService');

console.log('='.repeat(60));
console.log('SPLIT VALIDATION MANUAL TEST');
console.log('='.repeat(60));

// Test 1: Share exceeding total amount
console.log('\n📋 Test 1: Share exceeding total amount');
console.log('-'.repeat(60));
const test1 = SplitService.validateSplit(200, 'custom', [
  { user: 'user1', share: 250 }
]);
console.log('Amount: ₹200');
console.log('Participant share: ₹250');
console.log('Valid:', test1.isValid);
console.log('Errors:', test1.errors);
console.log('✓ Expected: Should reject (share > total)');

// Test 2: Multiple participants, one exceeds
console.log('\n📋 Test 2: Multiple participants, one exceeds total');
console.log('-'.repeat(60));
const test2 = SplitService.validateSplit(200, 'custom', [
  { user: 'user1', share: 50 },
  { user: 'user2', share: 250 },
  { user: 'user3', share: 50 }
]);
console.log('Amount: ₹200');
console.log('Participants: ₹50, ₹250, ₹50');
console.log('Valid:', test2.isValid);
console.log('Errors:', test2.errors);
console.log('✓ Expected: Should reject (participant 2 exceeds total)');

// Test 3: Share equals total (edge case)
console.log('\n📋 Test 3: Share equals total amount (edge case)');
console.log('-'.repeat(60));
const test3 = SplitService.validateSplit(200, 'custom', [
  { user: 'user1', share: 200 }
]);
console.log('Amount: ₹200');
console.log('Participant share: ₹200');
console.log('Valid:', test3.isValid);
console.log('Errors:', test3.errors);
console.log('✓ Expected: Should accept (share = total is valid)');

// Test 4: Negative share
console.log('\n📋 Test 4: Negative share value');
console.log('-'.repeat(60));
const test4 = SplitService.validateSplit(200, 'custom', [
  { user: 'user1', share: -50 }
]);
console.log('Amount: ₹200');
console.log('Participant share: ₹-50');
console.log('Valid:', test4.isValid);
console.log('Errors:', test4.errors);
console.log('✓ Expected: Should reject (negative share)');

// Test 5: Percentage exceeding 100%
console.log('\n📋 Test 5: Percentage exceeding 100%');
console.log('-'.repeat(60));
const test5 = SplitService.validateSplit(200, 'percentage', [
  { user: 'user1', share: 220, percentage: 110 }
]);
console.log('Amount: ₹200');
console.log('Participant: 110%, ₹220');
console.log('Valid:', test5.isValid);
console.log('Errors:', test5.errors);
console.log('✓ Expected: Should reject (percentage > 100%)');

// Test 6: Valid custom split
console.log('\n📋 Test 6: Valid custom split');
console.log('-'.repeat(60));
const test6 = SplitService.validateSplit(200, 'custom', [
  { user: 'user1', share: 80 },
  { user: 'user2', share: 70 },
  { user: 'user3', share: 50 }
]);
console.log('Amount: ₹200');
console.log('Participants: ₹80, ₹70, ₹50');
console.log('Valid:', test6.isValid);
console.log('Errors:', test6.errors);
console.log('✓ Expected: Should accept (all shares valid and sum to total)');

// Test 7: Valid percentage split
console.log('\n📋 Test 7: Valid percentage split');
console.log('-'.repeat(60));
const test7 = SplitService.validateSplit(200, 'percentage', [
  { user: 'user1', share: 100, percentage: 50 },
  { user: 'user2', share: 100, percentage: 50 }
]);
console.log('Amount: ₹200');
console.log('Participants: 50% (₹100), 50% (₹100)');
console.log('Valid:', test7.isValid);
console.log('Errors:', test7.errors);
console.log('✓ Expected: Should accept (valid percentage split)');

// Test 8: Multiple errors
console.log('\n📋 Test 8: Multiple validation errors');
console.log('-'.repeat(60));
const test8 = SplitService.validateSplit(200, 'custom', [
  { user: 'user1', share: 250 },
  { user: 'user2', share: 300 }
]);
console.log('Amount: ₹200');
console.log('Participants: ₹250, ₹300');
console.log('Valid:', test8.isValid);
console.log('Errors:', test8.errors);
console.log('✓ Expected: Should reject with multiple errors');

// Summary
console.log('\n' + '='.repeat(60));
console.log('TEST SUMMARY');
console.log('='.repeat(60));
const results = [test1, test2, test3, test4, test5, test6, test7, test8];
const expectedResults = [false, false, true, false, false, true, true, false];
const passed = results.filter((r, i) => r.isValid === expectedResults[i]).length;
console.log(`Tests Passed: ${passed}/${results.length}`);
console.log('='.repeat(60));

if (passed === results.length) {
  console.log('✅ All validation tests passed!');
} else {
  console.log('❌ Some tests failed. Review the output above.');
}
