#!/usr/bin/env python3
import unittest
import sys
import os
from datetime import datetime

class LuknerTestRunner:
    def __init__(self):
        self.base_dir = os.path.dirname(os.path.abspath(__file__))
        self.test_dir = os.path.join(self.base_dir)
        self.results_dir = os.path.join(self.base_dir, "test_results")
        # Add parent directory to sys.path for import resolution
        sys.path.insert(0, os.path.dirname(self.base_dir))
        
    def run_all_tests(self):
        """Run all tests"""
        print("🧪 LUKNERLUMINA COMPREHENSIVE TEST SUITE")
        print("=" * 50)
        
        test_suites = [
            ("Unit Tests", os.path.join(self.test_dir, "unit")),
            ("Integration Tests", os.path.join(self.test_dir, "integration")),
            ("Performance Tests", os.path.join(self.test_dir, "performance")),
            ("Security Tests", os.path.join(self.test_dir, "security")),
            ("User Acceptance Tests", os.path.join(self.test_dir, "user_acceptance"))
        ]
        
        all_results = []
        
        for suite_name, suite_path in test_suites:
            print(f"🔍 Running {suite_name}...")
            print("-" * 30)
            
            # Discover and run tests
            loader = unittest.TestLoader()
            suite = loader.discover(suite_path, pattern="test_*.py")
            
            # Run tests
            runner = unittest.TextTestRunner(verbosity=2)
            result = runner.run(suite)
            
            # Store results
            all_results.append({
                "suite": suite_name,
                "tests_run": result.testsRun,
                "failures": len(result.failures),
                "errors": len(result.errors),
                "success": result.wasSuccessful()
            })
        
        # Generate report
        self.generate_test_report(all_results)
        
        return all_results
    
    def run_specific_test(self, test_type):
        """Run specific test type"""
        test_paths = {
            "unit": os.path.join(self.test_dir, "unit"),
            "integration": os.path.join(self.test_dir, "integration"),
            "performance": os.path.join(self.test_dir, "performance"),
            "security": os.path.join(self.test_dir, "security"),
            "user": os.path.join(self.test_dir, "user_acceptance")
        }
        
        if test_type not in test_paths:
            print(f"❌ Unknown test type: {test_type}")
            return False
        
        print(f"🔍 Running {test_type} tests...")
        
        loader = unittest.TestLoader()
        suite = loader.discover(test_paths[test_type], pattern="test_*.py")
        
        runner = unittest.TextTestRunner(verbosity=2)
        result = runner.run(suite)
        
        return result.wasSuccessful()
    
    def generate_test_report(self, results):
        """Generate comprehensive test report"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        report_file = os.path.join(self.results_dir, f"test_report_{timestamp}.txt")
        
        os.makedirs(self.results_dir, exist_ok=True)
        
        with open(report_file, "w") as f:
            f.write("LUKNERLUMINA TEST REPORT\n")
            f.write("=" * 50 + "\n")
            f.write(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
            
            total_tests = sum(r["tests_run"] for r in results)
            total_failures = sum(r["failures"] for r in results)
            total_errors = sum(r["errors"] for r in results)
            
            f.write(f"SUMMARY:\n")
            f.write(f"Total Tests: {total_tests}\n")
            f.write(f"Failures: {total_failures}\n")
            f.write(f"Errors: {total_errors}\n")
            f.write(f"Success Rate: {((total_tests - total_failures - total_errors) / total_tests * 100):.1f}%\n")
            
            f.write("DETAILED RESULTS:\n")
            for result in results:
                f.write(f"{result['suite']}:\n")
                f.write(f"  Tests Run: {result['tests_run']}\n")
                f.write(f"  Failures: {result['failures']}\n")
                f.write(f"  Errors: {result['errors']}\n")
                f.write(f"  Success: {'✅' if result['success'] else '❌'}\n")
        
        print(f"📊 Test report generated: {report_file}")

if __name__ == "__main__":
    runner = LuknerTestRunner()
    
    if len(sys.argv) > 1:
        test_type = sys.argv[1]
        runner.run_specific_test(test_type)
    else:
        runner.run_all_tests()
