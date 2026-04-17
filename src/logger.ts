const ANSI_RESET = '\u001B[0m';

const ANSI_COLORS = {
  black: '\u001B[30m',
  red: '\u001B[31m',
  green: '\u001B[32m',
  yellow: '\u001B[33m',
  blue: '\u001B[34m',
  magenta: '\u001B[35m',
  cyan: '\u001B[36m',
  white: '\u001B[37m',
  gray: '\u001B[90m',
  brightRed: '\u001B[91m',
  brightGreen: '\u001B[92m',
  brightYellow: '\u001B[93m',
  brightBlue: '\u001B[94m',
  brightMagenta: '\u001B[95m',
  brightCyan: '\u001B[96m',
  brightWhite: '\u001B[97m',
} as const;

const BROWSER_COLORS = {
  black: '#000000',
  red: '#dc2626',
  green: '#16a34a',
  yellow: '#ca8a04',
  blue: '#2563eb',
  magenta: '#c026d3',
  cyan: '#0891b2',
  white: '#f8fafc',
  gray: '#6b7280',
  brightRed: '#ef4444',
  brightGreen: '#22c55e',
  brightYellow: '#eab308',
  brightBlue: '#3b82f6',
  brightMagenta: '#d946ef',
  brightCyan: '#06b6d4',
  brightWhite: '#ffffff',
} as const satisfies Record<keyof typeof ANSI_COLORS, string>;

type LogStream = 'stdout' | 'stderr';

export type LoggerColor = keyof typeof ANSI_COLORS;

export type LoggerColorizer =
  | LoggerColor
  | ((message: string) => string);

export type LoggerTypeDefinition = {
  color?: LoggerColorizer;
  enabled?: boolean;
  label?: string;
  stream?: LogStream;
  timestamp?: boolean;
};

export type ResolvedLoggerTypeDefinition = {
  color?: LoggerColorizer;
  enabled: boolean;
  label: string;
  stream: LogStream;
  timestamp: boolean;
};

export type LoggerTypeMap<TypeName extends string = string> = Record<
  TypeName,
  LoggerTypeDefinition
>;

export type CreateLoggerOptions<TypeName extends string = DefaultLogType> = {
  colors?: boolean;
  name?: string;
  timestamp?: boolean;
  types?: Partial<LoggerTypeMap<TypeName>> & Record<string, LoggerTypeDefinition>;
};

export type LogMethod = (...messages: readonly unknown[]) => void;

type LoggerCore<TypeName extends string> = {
  getTypes: () => Readonly<Record<string, ResolvedLoggerTypeDefinition>>;
  hasType: (type: string) => boolean;
  log: (type: TypeName | (string & {}), ...messages: readonly unknown[]) => void;
  registerType: <NextTypeName extends string>(
    type: NextTypeName,
    definition?: LoggerTypeDefinition,
  ) => Logger<NextTypeName | TypeName>;
  setColorsEnabled: (enabled: boolean) => void;
  setTypeEnabled: (type: TypeName | string, enabled: boolean) => void;
};

export type Logger<TypeName extends string> = LoggerCore<TypeName> &
  Record<TypeName, LogMethod>;

export type LoggerInstance<TypeName extends string = DefaultLogType> =
  Logger<TypeName>;

export const defaultLogTypes = {
  debug: {
    color: 'gray',
    label: 'DEBUG',
  },
  error: {
    color: 'brightRed',
    label: 'ERROR',
    stream: 'stderr',
  },
  info: {
    color: 'brightBlue',
    label: 'INFO',
  },
  success: {
    color: 'brightGreen',
    label: 'SUCCESS',
  },
  warn: {
    color: 'brightYellow',
    label: 'WARN',
    stream: 'stderr',
  },
} satisfies LoggerTypeMap;

export type DefaultLogType = keyof typeof defaultLogTypes;

const defaultOptions = {
  colors: shouldUseColors(),
  timestamp: true,
};

export function parseLogTypeDefinition(
  type: string,
  definition: LoggerTypeDefinition = {},
  fallbackTimestamp = defaultOptions.timestamp,
): ResolvedLoggerTypeDefinition {
  return {
    color: definition.color,
    enabled: definition.enabled ?? true,
    label: definition.label ?? type.toUpperCase(),
    stream: definition.stream ?? 'stdout',
    timestamp: definition.timestamp ?? fallbackTimestamp,
  };
}

export function createLogger<TypeName extends string = DefaultLogType>(
  options: CreateLoggerOptions<TypeName> = {},
): Logger<TypeName | DefaultLogType> {
  const definitions = new Map<string, ResolvedLoggerTypeDefinition>();
  let colorsEnabled = options.colors ?? defaultOptions.colors;
  const loggerName = options.name?.trim();
  const globalTimestamp = options.timestamp ?? defaultOptions.timestamp;

  const logger = {} as Logger<TypeName | DefaultLogType>;

  const ensureMethod = (type: string): void => {
    if (type in logger) {
      return;
    }

    Object.defineProperty(logger, type, {
      configurable: true,
      enumerable: true,
      value: (...messages: readonly unknown[]) => {
        logger.log(type, ...messages);
      },
      writable: false,
    });
  };

  logger.hasType = (type: string): boolean => definitions.has(type);

  logger.getTypes = (): Readonly<Record<string, ResolvedLoggerTypeDefinition>> => {
    return Object.freeze(Object.fromEntries(definitions.entries()));
  };

  logger.setColorsEnabled = (enabled: boolean): void => {
    colorsEnabled = enabled;
  };

  logger.setTypeEnabled = (type: TypeName | string, enabled: boolean): void => {
    const current = definitions.get(type);

    if (!current) {
      throw new Error(`Unknown log type "${type}". Register it before updating.`);
    }

    definitions.set(type, {
      ...current,
      enabled,
    });
  };

  logger.registerType = <NextTypeName extends string>(
    type: NextTypeName,
    definition: LoggerTypeDefinition = {},
  ): Logger<NextTypeName | TypeName | DefaultLogType> => {
    definitions.set(
      type,
      parseLogTypeDefinition(type, definition, globalTimestamp),
    );
    ensureMethod(type);

    return logger as Logger<NextTypeName | TypeName | DefaultLogType>;
  };

  logger.log = (type: TypeName | DefaultLogType | (string & {}), ...messages) => {
    const definition = definitions.get(type);

    if (!definition) {
      throw new Error(`Unknown log type "${type}". Register it before logging.`);
    }

    if (!definition.enabled) {
      return;
    }

    const segments: string[] = [];

    if (definition.timestamp) {
      segments.push(new Date().toISOString());
    }

    if (loggerName) {
      segments.push(loggerName);
    }

    segments.push(definition.label);

    const prefix = `[${segments.join('] [')}]`;
    const content = messages.map(formatMessage).join(' ');

    writeLog(definition.stream, prefix, content, definition, colorsEnabled);
  };

  for (const [type, definition] of Object.entries(defaultLogTypes)) {
    logger.registerType(
      type,
      definition as LoggerTypeDefinition,
    );
  }

  if (options.types) {
    for (const [type, definition] of Object.entries(options.types)) {
      logger.registerType(type, definition);
    }
  }

  return logger;
}

export const logger = createLogger();

function colorize(
  message: string,
  color: LoggerColorizer | undefined,
  enabled: boolean,
): string {
  if (!enabled || !color) {
    return message;
  }

  if (typeof color === 'function') {
    return color(message);
  }

  return `${ANSI_COLORS[color]}${message}${ANSI_RESET}`;
}

function formatMessage(message: unknown): string {
  if (typeof message === 'string') {
    return message;
  }

  if (message instanceof Error) {
    return message.stack ?? `${message.name}: ${message.message}`;
  }

  if (typeof message === 'bigint' || typeof message === 'symbol') {
    return String(message);
  }

  if (typeof message === 'function') {
    return `[Function${message.name ? `: ${message.name}` : ''}]`;
  }

  if (message === undefined) {
    return 'undefined';
  }

  return serializeValue(message);
}

function shouldUseColors(): boolean {
  if (isNodeRuntime()) {
    if ('NO_COLOR' in process.env) {
      return false;
    }

    return Boolean(process.stdout?.isTTY);
  }

  if (isBrowserRuntime()) {
    return true;
  }

  return false;
}

function isNodeRuntime(): boolean {
  return typeof process !== 'undefined' && Boolean(process.versions?.node);
}

function isBrowserRuntime(): boolean {
  return (
    typeof globalThis === 'object' &&
    'console' in globalThis &&
    !isNodeRuntime()
  );
}

function serializeValue(value: unknown): string {
  try {
    return JSON.stringify(
      value,
      createJsonReplacer(),
    );
  } catch {
    return String(value);
  }
}

function createJsonReplacer() {
  const seen = new WeakSet<object>();

  return (_key: string, value: unknown) => {
    if (typeof value === 'bigint') {
      return value.toString();
    }

    if (typeof value === 'function') {
      return `[Function${value.name ? `: ${value.name}` : ''}]`;
    }

    if (typeof value === 'symbol') {
      return value.toString();
    }

    if (value instanceof Error) {
      return {
        name: value.name,
        message: value.message,
        stack: value.stack,
      };
    }

    if (value && typeof value === 'object') {
      if (seen.has(value)) {
        return '[Circular]';
      }

      seen.add(value);
    }

    return value;
  };
}

function writeLog(
  stream: LogStream,
  prefix: string,
  content: string,
  definition: ResolvedLoggerTypeDefinition,
  colorsEnabled: boolean,
): void {
  if (isNodeRuntime() && process.stdout && process.stderr) {
    writeNode(stream, `${colorize(prefix, definition.color, colorsEnabled)} ${content}`);
    return;
  }

  writeConsole(stream, prefix, content, definition, colorsEnabled);
}

function writeNode(stream: LogStream, line: string): void {
  if (stream === 'stderr') {
    process.stderr.write(`${line}\n`);
    return;
  }

  process.stdout.write(`${line}\n`);
}

function writeConsole(
  stream: LogStream,
  prefix: string,
  content: string,
  definition: ResolvedLoggerTypeDefinition,
  colorsEnabled: boolean,
): void {
  const method = stream === 'stderr' ? console.error : console.log;

  if (!colorsEnabled || !definition.color || typeof definition.color === 'function') {
    method(`${prefix} ${content}`);
    return;
  }

  method(
    `%c${prefix}%c ${content}`,
    `color: ${BROWSER_COLORS[definition.color]}; font-weight: 700;`,
    '',
  );
}
