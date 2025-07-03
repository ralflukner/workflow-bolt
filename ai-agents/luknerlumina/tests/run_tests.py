#!/usr/bin/env python3
import unittest
import sys
import os
from datetime import datetime

class LuknerTestRunner:
    def __init__(self):
        self.test_dir = "tests"
        self.results_dir = "test_results"
        
    def run_all_tests(self):
        """Run all tests"""
        print("🧪 LUKNERLUMINA COMPREHENSIVE TEST SUITE")
        print("=" * 50)
        
        test_suites = [
            ("Unit Tests", f"{self.test_dir}/unit"),
            ("Integration Tests", f"{self.test_dir}/integration"),
            ("Performance Tests", f"{self.test_dir}/performance"),
            ("Security Tests", f"{self.test_dir}/security"),
            ("User Acceptance Tests", f"{self.test_dir}/user_acceptance")
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
            "unit": f"{self.test_dir}/unit",
            "integration": f"{self.test_dir}/integration",
            "performance": f"{self.test_dir}/performance",
            "security": f"{self.test_dir}/security",
            "user": f"{self.test_dir}/user_acceptance"
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
        report_file = f"{self.results_dir}/test_report_{timestamp}.txt"
        
        os.makedirs(self.results_dir, exist_ok=True)
        
        with open(report_file, "w") as f:
            f.write("LUKNERLUMINA TEST REPORT")
            f.write("=" * 50 + "")
            f.write(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
            
            total_tests = sum(r["tests_run"] for r in results)
            total_failures = sum(r["failures"] for r in results)
            total_errors = sum(r["errors"] for r in results)
            
            f.write(f"SUMMARY:")
            f.write(f"Total Tests: {total_tests}")
            f.write(f"Failures: {total_failures}")
            f.write(f"Errors: {total_errors}")
            f.write(f"Success Rate: {((total_tests - total_failures - total_errors) / total_tests * 100):.1f}%")
            
            f.write("DETAILED RESULTS:")
            for result in results:
                f.write(f"{result['suite']}:")
                f.write(f"  Tests Run: {result['tests_run']}")
                f.write(f"  Failures: {result['failures']}")
                f.write(f"  Errors: {result['errors']}")
                f.write(f"  Success: {'✅' if result['success'] else '❌'}")
        
        print(f"📊 Test report generated: {report_file}")

if __name__ == "__main__":
    runner = LuknerTestRunner()
    
    if len(sys.argv) > 1:
        test_type = sys.argv[1]
        runner.run_specific_test(test_type)
    else:
        runner.run_all_tests()
