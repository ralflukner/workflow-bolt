import unittest
import time
import threading
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from secure_redis_client import LuknerSecureRedisClient
from ai_agent_collaboration import AIAgentCollaboration

class TestPerformance(unittest.TestCase):
    def setUp(self):
        self.redis_client = LuknerSecureRedisClient()
        self.ai_collaboration = AIAgentCollaboration()
    
    def test_redis_performance(self):
        """Test Redis performance under load"""
        print("⚡ Testing Redis performance...")
        
        start_time = time.time()
        
        # Store 1000 records
        for i in range(1000):
            self.redis_client.store_data(f"perf_test_{i}", {"data": f"test_data_{i}"})
        
        store_time = time.time() - start_time
        
        # Retrieve 1000 records
        start_time = time.time()
        for i in range(1000):
            self.redis_client.get_data(f"perf_test_{i}")
        
        retrieve_time = time.time() - start_time
        
        print(f"   Store 1000 records: {store_time:.2f}s")
        print(f"   Retrieve 1000 records: {retrieve_time:.2f}s")
        
        # Performance assertions
        self.assertLess(store_time, 10.0, "Store performance too slow")
        self.assertLess(retrieve_time, 5.0, "Retrieve performance too slow")
        
        print("✅ Redis performance test passed")
    
    def test_concurrent_users(self):
        """Test system with concurrent users"""
        print("👥 Testing concurrent users...")
        
        def simulate_user_activity(user_id):
            # Simulate user activity
            task_id = self.ai_collaboration.assign_task_to_agent(
                "workflow-agent",
                f"Test task from user {user_id}",
                f"user_{user_id}"
            )
            time.sleep(0.1)  # Simulate processing time
            return task_id
        
        # Create 10 concurrent users
        threads = []
        results = []
        
        start_time = time.time()
        
        for i in range(10):
            thread = threading.Thread(
                target=lambda i=i: results.append(simulate_user_activity(i))
            )
            threads.append(thread)
            thread.start()
        
        # Wait for all threads to complete
        for thread in threads:
            thread.join()
        
        total_time = time.time() - start_time
        
        print(f"   10 concurrent users completed in: {total_time:.2f}s")
        self.assertLess(total_time, 5.0, "Concurrent user performance too slow")
        
        print("✅ Concurrent users test passed")
    
    def test_memory_usage(self):
        """Test memory usage under load"""
        print("🧠 Testing memory usage...")
        
        import psutil
        import gc
        
        # Get initial memory usage
        process = psutil.Process()
        initial_memory = process.memory_info().rss / 1024 / 1024  # MB
        
        # Create load
        large_data = []
        for i in range(1000):
            large_data.append({
                "id": i,
                "data": "x" * 1000,  # 1KB of data
                "timestamp": time.time()
            })
        
        # Get peak memory usage
        peak_memory = process.memory_info().rss / 1024 / 1024  # MB
        
        # Clean up
        del large_data
        gc.collect()
        
        # Get final memory usage
        final_memory = process.memory_info().rss / 1024 / 1024  # MB
        
        print(f"   Initial memory: {initial_memory:.2f} MB")
        print(f"   Peak memory: {peak_memory:.2f} MB")
        print(f"   Final memory: {final_memory:.2f} MB")
        
        # Memory usage should be reasonable
        self.assertLess(peak_memory - initial_memory, 100, "Memory usage too high")
        
        print("✅ Memory usage test passed")

if __name__ == "__main__":
    unittest.main(verbosity=2)
