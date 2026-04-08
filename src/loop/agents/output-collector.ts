import type { AgentRunOptions } from '../agents.js';

type OutputCollectorOptions = Pick<
  AgentRunOptions,
  'streamOutput' | 'onOutput' | 'maxOutputBytes' | 'headless'
>;

export type OutputCollector = {
  append: (text: string) => void;
  flush: () => void;
  getOutput: () => string;
};

export function createOutputCollector(options: OutputCollectorOptions): OutputCollector {
  let output = '';
  let outputBytes = 0;
  let lineBuffer = '';
  const maxOutputBytes = options.maxOutputBytes || 50 * 1024 * 1024;

  const append = (text: string) => {
    output += text;
    outputBytes += Buffer.byteLength(text);

    if (options.streamOutput && !options.headless) {
      process.stdout.write(text);
    }

    if (outputBytes > maxOutputBytes) {
      const keepBytes = Math.floor(maxOutputBytes * 0.8);
      output = output.slice(-keepBytes);
      outputBytes = Buffer.byteLength(output);
    }

    if (options.onOutput) {
      lineBuffer += text;
      const lines = lineBuffer.split('\n');
      lineBuffer = lines.pop() ?? '';
      for (const line of lines) {
        if (line) options.onOutput(line);
      }
    }
  };

  const flush = () => {
    if (lineBuffer && options.onOutput) {
      options.onOutput(lineBuffer);
    }
    lineBuffer = '';
  };

  return {
    append,
    flush,
    getOutput: () => output,
  };
}
