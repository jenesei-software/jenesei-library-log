# @jenesei-software/jenesei-library-log

A lightweight logging library for Node.js and browser projects written in TypeScript or JavaScript.

Features:

- built-in log types;
- colored console output based on log type;
- `stdout` and `stderr` routing per message type;
- browser-friendly console output;
- custom log types;
- separate logger instances for different services or modules.

## Installation

```bash
npm i @jenesei-software/jenesei-library-log
```

## Quick Start

```ts
import { logger } from '@jenesei-software/jenesei-library-log';

logger.info('Server started');
logger.success('Database connected');
logger.warn('Cache is disabled');
logger.error('Unexpected error', { code: 'E_DB' });
logger.debug('Payload', { page: 1, limit: 20 });
```

Example output:

```txt
[2026-04-18T03:10:52.109Z] [INFO] Server started
[2026-04-18T03:10:52.111Z] [SUCCESS] Database connected
[2026-04-18T03:10:52.112Z] [WARN] Cache is disabled
```

## Default Types

The library ships with these log types:

- `info`
- `success`
- `warn`
- `error`
- `debug`

Each type can be configured with:

- `label` - console label text;
- `color` - output color;
- `stream` - `stdout` or `stderr`;
- `enabled` - whether the type is enabled;
- `timestamp` - whether this type includes a timestamp.

## Creating a Custom Logger

```ts
import { createLogger } from '@jenesei-software/jenesei-library-log';

const appLogger = createLogger({
  name: 'api',
  timestamp: true,
});

appLogger.info('HTTP server is ready');
appLogger.error('Cannot connect to Redis');
```

Output will look like this:

```txt
[2026-04-18T03:12:41.000Z] [api] [INFO] HTTP server is ready
```

## Overriding Default Types

```ts
import { createLogger } from '@jenesei-software/jenesei-library-log';

const logger = createLogger({
  types: {
    info: {
      label: 'LOG',
      color: 'cyan',
    },
    debug: {
      enabled: false,
    },
  },
});

logger.info('Custom info message');
logger.debug('This line will not be printed');
```

## Adding Custom Types

You can add your own types when creating the logger:

```ts
import { createLogger } from '@jenesei-software/jenesei-library-log';

const logger = createLogger({
  types: {
    http: {
      label: 'HTTP',
      color: 'magenta',
    },
    audit: {
      label: 'AUDIT',
      color: 'white',
    },
  },
});

logger.log('http', 'GET /users', 200);
logger.log('audit', 'User deleted', { id: 42 });
```

Or register a new type later:

```ts
import { createLogger } from '@jenesei-software/jenesei-library-log';

const logger = createLogger();

logger.registerType('queue', {
  label: 'QUEUE',
  color: 'brightMagenta',
});

logger.queue('Job started', { id: 'job-1' });
logger.log('queue', 'Job finished');
```

## Available Colors

Supported values:

- `black`
- `red`
- `green`
- `yellow`
- `blue`
- `magenta`
- `cyan`
- `white`
- `gray`
- `brightRed`
- `brightGreen`
- `brightYellow`
- `brightBlue`
- `brightMagenta`
- `brightCyan`
- `brightWhite`

You can also pass your own color function:

```ts
import { createLogger } from '@jenesei-software/jenesei-library-log';

const logger = createLogger({
  types: {
    metric: {
      label: 'METRIC',
      color: (message) => `\u001B[36m${message}\u001B[0m`,
    },
  },
});

logger.log('metric', 'Requests per second', 128);
```

## Runtime Control

```ts
import { createLogger } from '@jenesei-software/jenesei-library-log';

const logger = createLogger();

logger.setTypeEnabled('debug', false);
logger.setColorsEnabled(false);
```

Useful methods:

- `logger.log(type, ...messages)` - log a message by type name;
- `logger.registerType(type, config)` - add a new type;
- `logger.hasType(type)` - check whether a type is registered;
- `logger.getTypes()` - get the current type map;
- `logger.setTypeEnabled(type, enabled)` - enable or disable a type;
- `logger.setColorsEnabled(enabled)` - enable or disable colors.

## Using It in Node.js

Example for a simple Node.js service:

```ts
import { createServer } from 'node:http';
import { createLogger } from '@jenesei-software/jenesei-library-log';

const logger = createLogger({
  name: 'node-app',
  types: {
    http: {
      label: 'HTTP',
      color: 'brightCyan',
    },
  },
});

const server = createServer((request, response) => {
  logger.log('http', request.method, request.url);
  response.end('ok');
});

server.listen(3000, () => {
  logger.success('Server started on port 3000');
});
```

## Using It in the Browser

```ts
import { createLogger } from '@jenesei-software/jenesei-library-log';

const logger = createLogger({
  name: 'web-app',
  types: {
    ui: {
      label: 'UI',
      color: 'brightMagenta',
    },
  },
});

logger.info('Application booted');
logger.log('ui', 'Sidebar opened');
logger.error('Unexpected client error', new Error('Network timeout'));
```

In the browser, the logger uses `console.log` and `console.error`, and built-in colors are rendered with `%c` styles.

## Notes

- In Node.js, colors are automatically disabled when the console does not support TTY.
- If the `NO_COLOR` environment variable is set, colored output is disabled.
- `error` and `warn` use `stderr` by default.
- In the browser, `stdout` maps to `console.log` and `stderr` maps to `console.error`.
