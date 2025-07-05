#!/usr/bin/env node

const VikunjaAPI = require('../ai-agents/cursor-gpt-4.1-max/scripts/vikunja-api.cjs');
const api = new VikunjaAPI();

const PROJECT_ID = 3; // cursor-gpt-4.1-max Tasks

async function aggressiveCleanup() {
  const tasks = await api.getTasks(PROJECT_ID);
  const openTasks = tasks.filter(t => !t.done);
  
  console.log(`Found ${openTasks.length} open tasks. Starting aggressive cleanup...\n`);
  
  const tasksToDelete = [];
  
  for (const task of openTasks) {
    const title = task.title.toLowerCase();
    const description = (task.description || '').toLowerCase();
    
    // Aggressive filtering criteria
    const shouldDelete = 
      // Very short or incomplete tasks
      title.length < 15 ||
      title.includes('implement') && title.length < 25 ||
      title.includes('todo') && title.length < 20 ||
      
      // Vendor/third-party indicators
      description.includes('site-packages') ||
      description.includes('venv') ||
      description.includes('vendor') ||
      description.includes('node_modules') ||
      description.includes('pip') ||
      description.includes('setuptools') ||
      description.includes('wheel') ||
      description.includes('google') ||
      description.includes('grpc') ||
      description.includes('protobuf') ||
      description.includes('urllib3') ||
      description.includes('requests') ||
      description.includes('certifi') ||
      description.includes('charset_normalizer') ||
      description.includes('idna') ||
      description.includes('pygments') ||
      description.includes('markupsafe') ||
      description.includes('jinja2') ||
      description.includes('werkzeug') ||
      description.includes('flask') ||
      description.includes('django') ||
      description.includes('fastapi') ||
      description.includes('pydantic') ||
      description.includes('sqlalchemy') ||
      description.includes('psycopg2') ||
      description.includes('mysqlclient') ||
      description.includes('redis') ||
      description.includes('celery') ||
      description.includes('boto3') ||
      description.includes('botocore') ||
      description.includes('aws') ||
      description.includes('azure') ||
      description.includes('googleapis') ||
      description.includes('firebase') ||
      description.includes('firebase-admin') ||
      description.includes('gunicorn') ||
      description.includes('uvicorn') ||
      description.includes('starlette') ||
      description.includes('click') ||
      description.includes('typer') ||
      description.includes('rich') ||
      description.includes('pytest') ||
      description.includes('nose') ||
      description.includes('coverage') ||
      description.includes('tox') ||
      description.includes('black') ||
      description.includes('flake8') ||
      description.includes('mypy') ||
      description.includes('isort') ||
      description.includes('pre-commit') ||
      description.includes('marshmallow') ||
      description.includes('alembic') ||
      description.includes('migrate') ||
      description.includes('fabric') ||
      description.includes('invoke') ||
      description.includes('paramiko') ||
      description.includes('cryptography') ||
      description.includes('bcrypt') ||
      description.includes('passlib') ||
      description.includes('itsdangerous') ||
      description.includes('blinker') ||
      description.includes('python-dateutil') ||
      description.includes('pytz') ||
      description.includes('six') ||
      description.includes('packaging') ||
      description.includes('pyparsing') ||
      description.includes('more-itertools') ||
      description.includes('zipp') ||
      description.includes('importlib-metadata') ||
      description.includes('importlib-resources') ||
      description.includes('pathlib2') ||
      description.includes('scandir') ||
      description.includes('contextlib2') ||
      description.includes('configparser') ||
      description.includes('enum34') ||
      description.includes('functools32') ||
      description.includes('futures') ||
      description.includes('ipaddress') ||
      description.includes('singledispatch') ||
      description.includes('typing-extensions') ||
      description.includes('backports') ||
      description.includes('backport') ||
      description.includes('compat') ||
      description.includes('compatibility') ||
      description.includes('vendor') ||
      description.includes('vendored') ||
      description.includes('_vendor') ||
      description.includes('_vendored') ||
      
      // Incomplete or placeholder tasks
      title.includes('well, crap') ||
      title.includes('should i do') ||
      title.includes('not sure') ||
      title.includes('this is a little') ||
      title.includes('clean up') && title.length < 25 ||
      title.includes('remove this') && title.length < 25 ||
      title.includes('update in line') ||
      title.includes('add a deadline') ||
      title.includes('response is the only one') ||
      title.includes('txtlexer') ||
      title.includes('delegatinglexer') ||
      title.includes('incomplete: a readable') ||
      title.includes('if already given') ||
      title.includes('for now favor') ||
      title.includes('deprecated, remove') ||
      title.includes('remove this when') ||
      title.includes('in v2 we can remove') ||
      title.includes('in v2.0') ||
      title.includes('in 3.0.0') ||
      title.includes('stop inheriting') ||
      title.includes('use inspect.value') ||
      title.includes('add generic type') ||
      title.includes('add optional support') ||
      title.includes('fix tunnel') ||
      title.includes('remove this except') ||
      title.includes('ist for time-blocking') ||
      title.includes('= [') ||
      title.includes(':') && title.length < 15 ||
      title.includes('this can be simplified') ||
      title.includes('make dispatcher') ||
      title.includes('investigate if') ||
      title.includes('tracking: maintained') ||
      title.includes('sync functionality') ||
      title.includes('implement') && !task.description ||
      
      // Code fragments and incomplete TODO comments
      title.includes('= []') ||
      title.includes('= [') ||
      title.includes(':') ||
      title.includes('.') ||
      title.includes('append') ||
      title.includes('pop') ||
      title.includes('extend') ||
      title.includes('add') ||
      title.includes('set') ||
      title.includes('graph') ||
      title.includes('dist') ||
      title.includes('succ') ||
      title.includes('pred') ||
      title.includes('final') ||
      title.includes('resource') ||
      title.includes('child') ||
      title.includes('provider') ||
      title.includes('nodes') ||
      title.includes('todo') && title.length < 10 ||
      
      // Very short or incomplete TODO comments
      title.length < 10 ||
      title.includes('TODO') && title.length < 15 ||
      
      // Placeholder tasks
      title.includes('fill this out') ||
      title.includes('document') && title.length < 20 ||
      title.includes('check') && title.length < 15 ||
      title.includes('verify') && title.length < 15 ||
      title.includes('test') && title.length < 15 ||
      title.includes('add') && title.length < 15 ||
      title.includes('implement') && title.length < 20 ||
      title.includes('fix') && title.length < 15 ||
      title.includes('remove') && title.length < 15 ||
      title.includes('update') && title.length < 15 ||
      title.includes('change') && title.length < 15 ||
      title.includes('improve') && title.length < 15 ||
      title.includes('refactor') && title.length < 15 ||
      title.includes('clean') && title.length < 15 ||
      title.includes('optimize') && title.length < 15 ||
      title.includes('enhance') && title.length < 15 ||
      title.includes('extend') && title.length < 15 ||
      title.includes('support') && title.length < 15 ||
      title.includes('handle') && title.length < 15 ||
      title.includes('process') && title.length < 15 ||
      title.includes('validate') && title.length < 15 ||
      title.includes('sanitize') && title.length < 15 ||
      title.includes('escape') && title.length < 15 ||
      title.includes('normalize') && title.length < 15 ||
      title.includes('can we') ||
      title.includes('should we') ||
      title.includes('need to') && title.length < 20 ||
      title.includes('check whether') ||
      title.includes('is the interaction') ||
      title.includes('version verification') ||
      title.includes('unintended side-effect') ||
      title.includes('check k, v') ||
      title.includes('document the mapping') ||
      title.includes('could add') ||
      title.includes('any other fields') ||
      title.includes('note: this cache') ||
      title.includes('sha256 digest') ||
      title.includes('list of nodes') ||
      title.includes('already added to todo') ||
      title.includes('add some logging') ||
      title.includes('there is an assumption') ||
      title.includes('use directurl.equivalent') ||
      title.includes('check already installed') ||
      title.includes('are there more cases') ||
      title.includes('performance: this means') ||
      title.includes('supply reason based') ||
      title.includes('remove this property') ||
      title.includes('replace this with') ||
      title.includes('handle space after') ||
      title.includes('the is_installable_dir test') ||
      title.includes('separate this part out') ||
      title.includes('get range requests') ||
      title.includes('this needs python') ||
      title.includes('currently, the resolver') ||
      title.includes('move definition here') ||
      title.includes('this property is relatively') ||
      title.includes('get project location') ||
      title.includes('in the future, it would') ||
      title.includes('tags? scheme?') ||
      title.includes('try to get these') ||
      title.includes('to avoid breaking changes') ||
      title.includes('remove this before next') ||
      title.includes('remove this method before') ||
      title.includes('once pkcs15token can be') ||
      title.includes('regarding the certificate') ||
      title.includes('remove when py2.5 support') ||
      title.includes('we should wrap componenttype') ||
      title.includes('fix possible comparison') ||
      title.includes('move out of sorting') ||
      title.includes('support nested choice') ||
      title.includes('prohibit non-canonical') ||
      title.includes('try to avoid asn.1') ||
      title.includes('handling three flavors') ||
      title.includes('seems more like a') ||
      title.includes('seems not to be tested') ||
      title.includes('weird') ||
      title.includes('revert to empty string') ||
      title.includes('revert these imports') ||
      title.includes('mypy does not recognize') ||
      title.includes('there is not currently') ||
      title.includes('add type hint') ||
      title.includes('update this list') ||
      title.includes('check if the namespace') ||
      title.includes('support logging multiple') ||
      title.includes('raise or log a warning') ||
      title.includes('expand documentation') ||
      title.includes('ensure that additional') ||
      title.includes('api_core should expose') ||
      title.includes('support max_attempts argument') ||
      title.includes('leverage retry') ||
      title.includes('add docstring for') ||
      title.includes('add support for') ||
      title.includes('remove type: ignore') ||
      title.includes('set always_use_jwt_access') ||
      title.includes('add wrap logic') ||
      title.includes('update incorrect use') ||
      title.includes('add retry parameter') ||
      title.includes('update type hint') ||
      title.includes('for backwards compatibility') ||
      title.includes('remove this check when') ||
      title.includes('management**: tracking') ||
      title.includes('s for sync testing') ||
      title.includes('implement error handling') ||
      title.includes('add input validation') ||
      title.includes('add data sanitization') ||
      title.includes('s from codebase with vikunja') ||
      title.includes('_project_id = 3') ||
      title.includes('patterns to search for') ||
      title.includes('_patterns = [') ||
      title.includes('s*(.+)/gi') ||
      title.includes('s*(.+?)\s*\*\//gi') ||
      title.includes('s*(.+)/gi') ||
      title.includes('sInFile(filePath)') ||
      title.includes('s = [];') ||
      title.includes('_patterns.forEach') ||
      title.includes('s.push({') ||
      title.includes('s;') ||
      title.includes('s(dir = ') ||
      title.includes('s = [];') ||
      title.includes('s = findTodosInFile') ||
      title.includes('s.push(...fileTodos)') ||
      title.includes('s;') ||
      title.includes('sToVikunja()') ||
      title.includes('s and fixmes') ||
      title.includes('s = await scanForTodos()') ||
      title.includes('s.length === 0') ||
      title.includes('s found in codebase') ||
      title.includes('s.length} todo/fixme items') ||
      title.includes('_project_id);') ||
      title.includes('of todos) {') ||
      title.includes('_project_id, {') ||
      title.includes('sToVikunja();') ||
      title.includes('sync tool') ||
      title.includes('s.cjs') ||
      title.includes('comments') ||
      title.includes('comments (python/shell)') ||
      title.includes('sToVikunja, scanForTodos') ||
      title.includes('s() {') ||
      title.includes('sToVikunja } = require') ||
      title.includes('sToVikunja();') ||
      title.includes('s from code') ||
      title.includes('s();') ||
      
      // GitHub issue references (vendor code)
      title.includes('github.com') ||
      title.includes('b/') ||
      title.includes('(https://') ||
      title.includes('(xuanwn)') ||
      title.includes('(yon-mg)') ||
      title.includes('(nathaniel)') ||
      title.includes('(lidiz)') ||
      title.includes('(dovs)') ||
      title.includes('(b/380481951)') ||
      title.includes('(b/380483756)') ||
      title.includes('(https://github.com/googleapis') ||
      title.includes('(https://github.com/grpc/grpc') ||
      title.includes('(https://github.com/googleapis/python-api-core') ||
      
      // Empty or very short tasks
      title.trim().length === 0 ||
      title === 'todo' ||
      title === 'implement' ||
      title === 'fix' ||
      title === 'add' ||
      title === 'remove' ||
      title === 'update' ||
      title === 'change' ||
      title === 'improve' ||
      title === 'refactor' ||
      title === 'clean' ||
      title === 'optimize' ||
      title === 'enhance' ||
      title === 'extend' ||
      title === 'support' ||
      title === 'handle' ||
      title === 'process' ||
      title === 'validate' ||
      title === 'sanitize' ||
      title === 'escape' ||
      title === 'normalize';
    
    if (shouldDelete) {
      tasksToDelete.push(task);
    }
  }
  
  console.log(`Found ${tasksToDelete.length} tasks to delete:\n`);
  
  for (const task of tasksToDelete) {
    console.log(`- [${task.priority}] ${task.title}`);
  }
  
  if (tasksToDelete.length === 0) {
    console.log('No tasks to delete.');
    return;
  }
  
  console.log(`\nDeleting ${tasksToDelete.length} tasks...\n`);
  
  let deletedCount = 0;
  for (const task of tasksToDelete) {
    try {
      await api.deleteTask(task.id);
      console.log(`✓ Deleted: ${task.title}`);
      deletedCount++;
    } catch (error) {
      console.log(`✗ Failed to delete task ${task.id}: ${error.message}`);
    }
  }
  
  console.log(`\nAggressive cleanup complete! Deleted ${deletedCount} tasks.`);
  console.log(`Remaining tasks: ${openTasks.length - deletedCount}`);
}

async function main() {
  const [cmd] = process.argv.slice(2);
  
  if (cmd === 'clean') {
    await aggressiveCleanup();
  } else {
    console.log('Usage:');
    console.log('  ./scripts/aggressive-cleanup.cjs clean  # Perform aggressive cleanup');
  }
}

main(); 