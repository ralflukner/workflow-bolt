#!/usr/bin/env node

import { run, handle } from '@oclif/core';

// Pass the module URL so oclif can correctly locate the CLI root and discover commands
run(undefined, import.meta.url).catch(handle);