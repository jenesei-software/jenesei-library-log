# @jenesei-software/jenesei-library-log

Легкая библиотека логирования для Node.js-проектов на TypeScript и JavaScript.

Поддерживает:

- разные типы логов из коробки;
- цветной вывод в консоль в зависимости от типа;
- `stdout` и `stderr` для разных сообщений;
- кастомные типы логов;
- отдельные экземпляры логгера под разные сервисы или модули.

## Установка

```bash
npm i @jenesei-software/jenesei-library-log
```

## Быстрый старт

```ts
import { logger } from '@jenesei-software/jenesei-library-log';

logger.info('Server started');
logger.success('Database connected');
logger.warn('Cache is disabled');
logger.error('Unexpected error', { code: 'E_DB' });
logger.debug('Payload', { page: 1, limit: 20 });
```

Пример вывода:

```txt
[2026-04-18T03:10:52.109Z] [INFO] Server started
[2026-04-18T03:10:52.111Z] [SUCCESS] Database connected
[2026-04-18T03:10:52.112Z] [WARN] Cache is disabled
```

## Типы по умолчанию

В библиотеке уже есть типы:

- `info`
- `success`
- `warn`
- `error`
- `debug`

У каждого типа можно настроить:

- `label` - текст метки в консоли;
- `color` - цвет;
- `stream` - `stdout` или `stderr`;
- `enabled` - включен ли тип;
- `timestamp` - нужен ли timestamp у этого типа.

## Создание своего логгера

```ts
import { createLogger } from '@jenesei-software/jenesei-library-log';

const appLogger = createLogger({
  name: 'api',
  timestamp: true,
});

appLogger.info('HTTP server is ready');
appLogger.error('Cannot connect to Redis');
```

Вывод будет таким:

```txt
[2026-04-18T03:12:41.000Z] [api] [INFO] HTTP server is ready
```

## Переопределение стандартных типов

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

## Добавление своих типов

Можно добавить собственный тип при создании:

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

Или зарегистрировать новый тип позже:

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

## Доступные цвета

Поддерживаются значения:

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

Также можно передать свою функцию:

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

## Управление логированием во время работы

```ts
import { createLogger } from '@jenesei-software/jenesei-library-log';

const logger = createLogger();

logger.setTypeEnabled('debug', false);
logger.setColorsEnabled(false);
```

Полезные методы:

- `logger.log(type, ...messages)` - вывести сообщение по имени типа;
- `logger.registerType(type, config)` - добавить новый тип;
- `logger.hasType(type)` - проверить, зарегистрирован ли тип;
- `logger.getTypes()` - получить текущую карту типов;
- `logger.setTypeEnabled(type, enabled)` - включить или выключить тип;
- `logger.setColorsEnabled(enabled)` - включить или выключить цвета.

## Использование в Node.js

Пример для простого Node.js-сервиса:

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

## Примечания

- Цвета автоматически отключаются, если консоль не поддерживает TTY.
- Если задана переменная окружения `NO_COLOR`, цветной вывод отключается.
- Для ошибок и предупреждений по умолчанию используется `stderr`.
