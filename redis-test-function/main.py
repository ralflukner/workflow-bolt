import os
import redis
import functions_framework

@functions_framework.http
def test_redis_connection(request):
    host = os.environ.get('REDIS_HOST', '10.161.35.147')
    port = int(os.environ.get('REDIS_PORT', 6379))
    
    try:
        r = redis.Redis(host=host, port=port, decode_responses=True)
        r.ping()
        return {'status': 'success'}, 200
    except Exception as e:
        return {'status': 'error', 'message': str(e)}, 500