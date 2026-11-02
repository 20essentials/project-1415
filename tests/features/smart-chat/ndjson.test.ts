import { describe, expect, it } from 'vitest';
import { NdjsonParser, parseNdjson } from '@/features/smart-chat/ndjson';

describe('NdjsonParser', () => {
  it('parses fragmented JSON lines across pushes', () => {
    const parser = new NdjsonParser<Record<string, unknown>>();
    expect(parser.push('{"answerChunk":"Hel')).toEqual([]);
    expect(parser.push('lo"}\n{"answerChunk":" world"}')).toEqual([{ answerChunk: 'Hello' }]);
    expect(parser.flush()).toEqual([{ answerChunk: ' world' }]);
  });

  it('supports multiple frames in one chunk and SSE prefixes', () => {
    const frames = parseNdjson<Record<string, string>>(
      'data: {"answerChunk":"a"}\ndata: {"answerChunk":"b"}\n',
    );

    expect(frames).toEqual([{ answerChunk: 'a' }, { answerChunk: 'b' }]);
  });

  it('ignores comments, done markers and malformed lines', () => {
    const frames = parseNdjson<Record<string, string>>(
      ': keep-alive\nnot-json\n{"answerChunk":"ok"}\n[DONE]\n',
    );

    expect(frames).toEqual([{ answerChunk: 'ok' }]);
  });

  it('ignores empty lines and empty payloads', () => {
    expect(parseNdjson('data:\n\n   \n')).toEqual([]);
  });
});
