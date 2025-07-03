#!/usr/bin/env python3

"""
Test runner for Redis error handling tests
Combines unit tests, integration tests, and CLI-based tests
"""

import sys
import os
import unittest
import subprocess
import argparse
import logging
from typing import List, Dict, Any

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from tests.test_config import RedisTestConfig


class RedisTestRunner:
    """Comprehensive test runner for Redis error handling"""
    
    def __init__(self, verbose: bool = False, debug: bool = False):
        self.verbose = verbose
        self.debug = debug
        self.logger = RedisTestConfig.setup_test_logging()
        
        if debug:
            self.logger.setLevel(logging.DEBUG)
        
        self.results = {
            'unit_tests': {'passed': 0, 'failed': 0, 'errors': []},
            'cli_tests': {'passed': 0, 'failed': 0, 'errors': []},
            'integration_tests': {'passed': 0, 'failed': 0, 'errors': []},
        }
    
    def run_unit_tests(self) -> bool:
        """Run unit tests for Redis error handling"""
        self.logger.info("🧪 Running unit tests...")
        
        try:
            # Discover and run unit tests
            from tests.test_secure_redis_client import TestLuknerSecureRedisClient, TestRedisJSONErrorRecovery
            
            # Create test suite
            suite = unittest.TestLoader().loadTestsFromTestCase(TestLuknerSecureRedisClient)
            suite.addTests(unittest.TestLoader().loadTestsFromTestCase(TestRedisJSONErrorRecovery))
            
            # Run tests
            stream = open('unit_test_results.txt', 'w') if not self.verbose else sys.stdout
            runner = unittest.TextTestRunner(
                verbosity=2 if self.verbose else 1,
                stream=stream
            )
            result = runner.run(suite)
            
            if stream != sys.stdout:
                stream.close()
            
            # Update results
            self.results['unit_tests']['passed'] = result.testsRun - len(result.failures) - len(result.errors)
            self.results['unit_tests']['failed'] = len(result.failures) + len(result.errors)
            
            for test, traceback in result.failures + result.errors:
                self.results['unit_tests']['errors'].append(f"{test}: {traceback}")
            
            if result.wasSuccessful():
                self.logger.info("✅ Unit tests passed")
                return True
            else:
                self.logger.error(f"❌ Unit tests failed: {len(result.failures)} failures, {len(result.errors)} errors")
                return False
                
        except Exception as e:
            self.logger.error(f"💥 Unit test execution failed: {e}")
            self.results['unit_tests']['errors'].append(f"Execution failed: {e}")
            return False
    
    def generate_report(self) -> None:
        """Generate comprehensive test report"""
        print("\n" + "="*60)
        print("🧪 REDIS ERROR HANDLING TEST REPORT")
        print("="*60)
        
        total_passed = 0
        total_failed = 0
        
        for test_type, results in self.results.items():
            passed = results['passed']
            failed = results['failed']
            total_passed += passed
            total_failed += failed
            
            status = "✅ PASS" if failed == 0 else "❌ FAIL"
            print(f"\n{status} {test_type.replace('_', ' ').title()}: {passed} passed, {failed} failed")
            
            if results['errors'] and self.verbose:
                print(f"  Errors:")
                for error in results['errors'][:3]:  # Limit to first 3 errors
                    print(f"    - {error[:100]}..." if len(error) > 100 else f"    - {error}")
                if len(results['errors']) > 3:
                    print(f"    ... and {len(results['errors']) - 3} more errors")
        
        print(f"\n📊 OVERALL RESULTS: {total_passed} passed, {total_failed} failed")
        
        if total_failed == 0:
            print("🎉 ALL TESTS PASSED! Redis error handling is working correctly.")
        else:
            print(f"⚠️  {total_failed} tests failed. Please review error handling implementation.")
        
        print("="*60)


def main():
    """Main test runner entry point"""
    parser = argparse.ArgumentParser(description='Run Redis error handling tests')
    parser.add_argument('--unit', action='store_true', help='Run only unit tests')
    parser.add_argument('--verbose', '-v', action='store_true', help='Verbose output')
    parser.add_argument('--debug', '-d', action='store_true', help='Debug output')
    
    args = parser.parse_args()
    
    runner = RedisTestRunner(verbose=args.verbose, debug=args.debug)
    
    success = runner.run_unit_tests()
    runner.generate_report()
    
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()