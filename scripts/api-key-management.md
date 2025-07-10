# Multi-AI API Key Management & Cost Optimization

## 🔑 API Key Configuration

### **Available AI Services & Models**

#### **Google AI Platform**

```bash
# Google AI API Key Setup
export GOOGLE_AI_API_KEY="your-google-ai-key"

# Available Models:
# - Gemini Pro: Text and code generation
# - Gemini Ultra: Advanced reasoning and multimodal
# - PaLM: Large language model for text generation
# - Codey: Code generation and completion
```

#### **OpenAI Platform**  

```bash
# OpenAI API Key Setup
export OPENAI_API_KEY="your-openai-key"

# Available Models:
# - GPT-4: Advanced reasoning and problem solving
# - GPT-4 Turbo: Faster, more efficient GPT-4
# - GPT-3.5 Turbo: Cost-effective for simpler tasks
# - ChatGPT: Conversational AI
```

#### **Claude (Anthropic)**

```bash
# Claude API Key Setup  
export CLAUDE_API_KEY="your-claude-key"

# Available Models:
# - Claude 3 Opus: Highest performance, complex reasoning
# - Claude 3 Sonnet: Balanced performance and speed
# - Claude 3 Haiku: Fast, cost-effective
```

#### **Poe Platform**

```bash
# Poe API Key Setup
export POE_API_KEY="your-poe-key"

# Available Models:
# - Claude Opus (via Poe): Premium Claude access
# - GPT-4 (via Poe): Premium OpenAI access  
# - Gemini (via Poe): Google AI access
# - Custom bots: Specialized AI agents
```

#### **Sider.ai Platform**

```bash
# Sider AI API Key Setup
export SIDER_API_KEY="your-sider-key"

# Available Models:
# - Claude Sonnet 4: Analysis-focused, read-only
# - GPT-4: Analysis and review capabilities
# - Gemini: Multimodal analysis
```

### **Secure Key Storage in Google Secret Manager**

```bash
# Store all API keys securely
echo -n "$GOOGLE_AI_API_KEY" | gcloud secrets create google-ai-api-key --data-file=- --project="luknerlumina-firebase"
echo -n "$OPENAI_API_KEY" | gcloud secrets create openai-api-key --data-file=- --project="luknerlumina-firebase"
echo -n "$CLAUDE_API_KEY" | gcloud secrets create claude-api-key --data-file=- --project="luknerlumina-firebase"
echo -n "$POE_API_KEY" | gcloud secrets create poe-api-key --data-file=- --project="luknerlumina-firebase"
echo -n "$SIDER_API_KEY" | gcloud secrets create sider-api-key --data-file=- --project="luknerlumina-firebase"

# Load keys in .zshrc for development
echo 'export GOOGLE_AI_API_KEY="$(gcloud secrets versions access latest --secret=google-ai-api-key --project=luknerlumina-firebase --quiet)"' >> ~/.zshrc
echo 'export OPENAI_API_KEY="$(gcloud secrets versions access latest --secret=openai-api-key --project=luknerlumina-firebase --quiet)"' >> ~/.zshrc
echo 'export CLAUDE_API_KEY="$(gcloud secrets versions access latest --secret=claude-api-key --project=luknerlumina-firebase --quiet)"' >> ~/.zshrc
echo 'export POE_API_KEY="$(gcloud secrets versions access latest --secret=poe-api-key --project=luknerlumina-firebase --quiet)"' >> ~/.zshrc
echo 'export SIDER_API_KEY="$(gcloud secrets versions access latest --secret=sider-api-key --project=luknerlumina-firebase --quiet)"' >> ~/.zshrc
```

## 💰 Cost Management Strategy

### **Cost Tiers by AI Service**

| Service | Model | Cost per 1K tokens | Best Use Cases |
|---------|-------|-------------------|----------------|
| **OpenAI** | GPT-3.5 Turbo | $0.001 | Simple tasks, rapid iteration |
| **OpenAI** | GPT-4 | $0.03 | Complex reasoning, code generation |
| **Google AI** | Gemini Pro | $0.0005 | Multimodal, real-time analysis |
| **Google AI** | Gemini Ultra | $0.001 | Advanced reasoning, complex tasks |
| **Claude** | Haiku | $0.00025 | Fast, simple tasks |
| **Claude** | Sonnet | $0.003 | Balanced performance |
| **Claude** | Opus | $0.015 | Complex reasoning, long context |
| **Poe** | Various | Variable | Access to premium models |
| **Sider.ai** | Various | Variable | Analysis-focused tasks |

### **Intelligent Cost Optimization**

```python
class MultiAICostOptimizer:
    def __init__(self):
        self.cost_matrix = {
            'openai': {
                'gpt-3.5-turbo': 0.001,
                'gpt-4': 0.03,
                'gpt-4-turbo': 0.01
            },
            'google': {
                'gemini-pro': 0.0005,
                'gemini-ultra': 0.001,
                'palm': 0.0002
            },
            'claude': {
                'haiku': 0.00025,
                'sonnet': 0.003,
                'opus': 0.015
            },
            'poe': {
                'claude-opus': 0.02,  # Premium access
                'gpt-4': 0.035        # Premium access
            },
            'sider': {
                'claude-sonnet-4': 0.004,  # Analysis-focused
                'gpt-4': 0.025
            }
        }
        
        self.capability_matrix = {
            'complex_reasoning': ['claude-opus', 'gpt-4', 'poe-claude-opus'],
            'code_analysis': ['gemini-pro', 'claude-sonnet', 'sider-claude-sonnet-4'],
            'rapid_development': ['gpt-3.5-turbo', 'gemini-pro', 'claude-haiku'],
            'multimodal': ['gemini-pro', 'gemini-ultra', 'gpt-4'],
            'cost_effective': ['claude-haiku', 'gpt-3.5-turbo', 'palm']
        }
    
    def select_optimal_model(self, task_type, complexity, budget_limit):
        """
        Select the most cost-effective model for a given task
        """
        suitable_models = self.capability_matrix.get(task_type, [])
        
        # Filter by budget
        affordable_models = []
        for model in suitable_models:
            service, model_name = model.split('-', 1)
            cost = self.cost_matrix[service][model_name.replace('-', '_')]
            
            estimated_tokens = self.estimate_tokens(complexity)
            estimated_cost = cost * estimated_tokens / 1000
            
            if estimated_cost <= budget_limit:
                affordable_models.append({
                    'model': model,
                    'service': service,
                    'estimated_cost': estimated_cost,
                    'capability_score': self.get_capability_score(model, task_type)
                })
        
        # Sort by value (capability / cost)
        affordable_models.sort(
            key=lambda x: x['capability_score'] / x['estimated_cost'], 
            reverse=True
        )
        
        return affordable_models[0] if affordable_models else None
    
    def create_budget_allocation(self, monthly_budget):
        """
        Create optimal budget allocation across AI services
        """
        allocation = {
            'high_complexity_tasks': monthly_budget * 0.4,  # Claude Opus, GPT-4
            'medium_complexity_tasks': monthly_budget * 0.35,  # Claude Sonnet, Gemini Pro
            'rapid_development': monthly_budget * 0.15,  # GPT-3.5, Claude Haiku
            'analysis_tasks': monthly_budget * 0.08,   # Sider.ai, specialized analysis
            'emergency_reserve': monthly_budget * 0.02   # Unexpected complex tasks
        }
        
        return allocation
```

### **Automated Cost Tracking**

```python
class CostTracker:
    def __init__(self):
        self.usage_log = []
        self.budget_alerts = {}
    
    def track_api_call(self, service, model, tokens_used, task_type):
        """
        Track each API call for cost analysis
        """
        cost_per_token = self.get_cost_per_token(service, model)
        total_cost = (tokens_used / 1000) * cost_per_token
        
        usage_entry = {
            'timestamp': datetime.now(),
            'service': service,
            'model': model,
            'tokens_used': tokens_used,
            'cost': total_cost,
            'task_type': task_type
        }
        
        self.usage_log.append(usage_entry)
        self.check_budget_alerts(service, total_cost)
        
        return usage_entry
    
    def generate_cost_report(self, period='weekly'):
        """
        Generate detailed cost analysis report
        """
        report = {
            'total_cost': sum(entry['cost'] for entry in self.usage_log),
            'cost_by_service': {},
            'cost_by_task_type': {},
            'token_efficiency': {},
            'recommendations': []
        }
        
        # Analyze spending patterns
        for entry in self.usage_log:
            service = entry['service']
            task_type = entry['task_type']
            
            if service not in report['cost_by_service']:
                report['cost_by_service'][service] = 0
            report['cost_by_service'][service] += entry['cost']
            
            if task_type not in report['cost_by_task_type']:
                report['cost_by_task_type'][task_type] = 0
            report['cost_by_task_type'][task_type] += entry['cost']
        
        # Generate optimization recommendations
        report['recommendations'] = self.generate_optimization_recommendations(report)
        
        return report
```

## 🔄 Dynamic Model Routing

### **Intelligent Task Routing**

```python
class AITaskRouter:
    def __init__(self):
        self.cost_optimizer = MultiAICostOptimizer()
        self.performance_tracker = {}
        self.fallback_chains = {}
    
    def route_task(self, task_description, requirements):
        """
        Route task to optimal AI service based on requirements and constraints
        """
        # Analyze task characteristics
        task_analysis = self.analyze_task(task_description)
        
        # Determine optimal model
        optimal_model = self.cost_optimizer.select_optimal_model(
            task_analysis['type'],
            task_analysis['complexity'],
            requirements.get('budget_limit', float('inf'))
        )
        
        if not optimal_model:
            # No model fits budget, suggest alternatives
            return self.suggest_budget_alternatives(task_analysis, requirements)
        
        # Set up fallback chain in case of failure
        fallback_chain = self.create_fallback_chain(optimal_model, task_analysis)
        
        return {
            'primary_model': optimal_model,
            'fallback_chain': fallback_chain,
            'estimated_cost': optimal_model['estimated_cost'],
            'expected_quality': optimal_model['capability_score']
        }
    
    def create_fallback_chain(self, primary_model, task_analysis):
        """
        Create fallback options if primary model fails
        """
        fallback_options = []
        
        # Add progressively more expensive but capable models
        if primary_model['service'] == 'openai' and 'gpt-3.5' in primary_model['model']:
            fallback_options.append('openai-gpt-4')
        elif primary_model['service'] == 'claude' and 'haiku' in primary_model['model']:
            fallback_options.append('claude-sonnet')
            fallback_options.append('claude-opus')
        
        # Always include expert problem solver as final fallback
        fallback_options.append('poe-claude-opus')
        
        return fallback_options
```

### **API Integration Layer**

```python
class UnifiedAIInterface:
    def __init__(self):
        self.clients = {
            'openai': self.init_openai_client(),
            'google': self.init_google_client(),
            'claude': self.init_claude_client(),
            'poe': self.init_poe_client(),
            'sider': self.init_sider_client()
        }
        
        self.cost_tracker = CostTracker()
        self.router = AITaskRouter()
    
    def execute_task(self, task_description, requirements=None):
        """
        Execute task using optimal AI service
        """
        requirements = requirements or {}
        
        # Route to optimal service
        routing_decision = self.router.route_task(task_description, requirements)
        
        # Execute with primary model
        try:
            result = self.call_ai_service(
                routing_decision['primary_model'],
                task_description,
                requirements
            )
            
            if result['success']:
                return result
                
        except Exception as e:
            print(f"Primary model failed: {e}")
        
        # Try fallback chain
        for fallback_model in routing_decision['fallback_chain']:
            try:
                print(f"Trying fallback: {fallback_model}")
                result = self.call_ai_service(
                    fallback_model,
                    task_description,
                    requirements
                )
                
                if result['success']:
                    return result
                    
            except Exception as e:
                print(f"Fallback {fallback_model} failed: {e}")
                continue
        
        return {'success': False, 'error': 'All models failed'}
    
    def call_ai_service(self, model_info, task, requirements):
        """
        Make API call to specific AI service
        """
        service = model_info['service']
        model = model_info['model']
        
        start_time = time.time()
        
        try:
            if service == 'openai':
                response = self.clients['openai'].completions.create(
                    model=model,
                    prompt=task,
                    max_tokens=requirements.get('max_tokens', 1000)
                )
                result_text = response.choices[0].text
                tokens_used = response.usage.total_tokens
                
            elif service == 'google':
                response = self.clients['google'].generate_text(
                    model=model,
                    prompt=task,
                    max_output_tokens=requirements.get('max_tokens', 1000)
                )
                result_text = response.result
                tokens_used = response.usage.total_tokens
                
            elif service == 'claude':
                response = self.clients['claude'].messages.create(
                    model=model,
                    max_tokens=requirements.get('max_tokens', 1000),
                    messages=[{"role": "user", "content": task}]
                )
                result_text = response.content[0].text
                tokens_used = response.usage.input_tokens + response.usage.output_tokens
            
            # Track costs
            cost_entry = self.cost_tracker.track_api_call(
                service, model, tokens_used, requirements.get('task_type', 'unknown')
            )
            
            execution_time = time.time() - start_time
            
            return {
                'success': True,
                'result': result_text,
                'tokens_used': tokens_used,
                'cost': cost_entry['cost'],
                'execution_time': execution_time,
                'model_used': f"{service}-{model}"
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'execution_time': time.time() - start_time
            }
```

## 📊 Usage Monitoring Dashboard

### **Real-time Cost Monitoring**

```python
class CostMonitoringDashboard:
    def __init__(self):
        self.cost_tracker = CostTracker()
        self.budget_limits = {}
        self.alert_thresholds = {}
    
    def create_dashboard_data(self):
        """
        Create data for real-time cost monitoring dashboard
        """
        current_usage = self.cost_tracker.get_current_month_usage()
        
        dashboard_data = {
            'total_spent': current_usage['total_cost'],
            'budget_utilization': self.calculate_budget_utilization(),
            'cost_by_service': current_usage['cost_by_service'],
            'daily_spend_trend': self.get_daily_spend_trend(),
            'top_expensive_tasks': self.get_top_expensive_tasks(),
            'efficiency_metrics': self.calculate_efficiency_metrics(),
            'alerts': self.get_active_alerts()
        }
        
        return dashboard_data
    
    def set_budget_alert(self, service, threshold_percentage):
        """
        Set up budget alerts for specific services
        """
        self.alert_thresholds[service] = threshold_percentage
    
    def check_budget_health(self):
        """
        Check overall budget health and provide recommendations
        """
        utilization = self.calculate_budget_utilization()
        
        recommendations = []
        
        if utilization > 0.8:
            recommendations.append("High budget utilization - consider optimizing model selection")
        
        if self.cost_tracker.get_inefficient_tasks():
            recommendations.append("Some tasks using expensive models for simple operations")
        
        return {
            'health_status': 'good' if utilization < 0.7 else 'warning' if utilization < 0.9 else 'critical',
            'utilization': utilization,
            'recommendations': recommendations
        }
```

---

**Ready to optimize costs across multiple AI services! 💰🤖**
