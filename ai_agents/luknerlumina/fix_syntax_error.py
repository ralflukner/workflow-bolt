import re

# Fix the syntax error in ai_agent_collaboration.py
def fix_syntax_error():
    with open('ai_agent_collaboration.py', 'r') as f:
        content = f.read()
    
    # Fix the unterminated string literal
    content = content.replace('print("', 'print("\
🎯 SYSTEM READY FOR COLLABORATIVE WORK!")')
    
    with open('ai_agent_collaboration.py', 'w') as f:
        f.write(content)
    
    print("✅ Syntax error fixed!")

if __name__ == "__main__":
    fix_syntax_error()
