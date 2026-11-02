export class NdjsonParser<T> {
  private buffer = '';

  push(chunk: string): T[] {
    this.buffer += chunk;
    const frames: T[] = [];
    let newline = this.buffer.indexOf('\n');

    while (newline >= 0) {
      const line = this.buffer.slice(0, newline);
      this.buffer = this.buffer.slice(newline + 1);
      const frame = parseLine<T>(line);
      if (frame) frames.push(frame);
      newline = this.buffer.indexOf('\n');
    }

    return frames;
  }

  flush(): T[] {
    const rest = this.buffer;
    this.buffer = '';
    const frame = parseLine<T>(rest);
    return frame ? [frame] : [];
  }
}

function parseLine<T>(rawLine: string): T | null {
  const line = rawLine.trim();
  if (!line || line === '[DONE]' || line.startsWith(':')) return null;

  const payload = line.startsWith('data:') ? line.slice(5).trim() : line;
  if (!payload || payload === '[DONE]') return null;

  try {
    return JSON.parse(payload) as T;
  } catch {
    return null;
  }
}

export function parseNdjson<T>(text: string): T[] {
  const parser = new NdjsonParser<T>();
  return [...parser.push(text), ...parser.flush()];
}
