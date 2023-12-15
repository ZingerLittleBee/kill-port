import { $, ProcessOutput, ProcessPromise } from 'zx';

export function $withoutEscaping(pieces: TemplateStringsArray, ...args: unknown[]): ProcessPromise<ProcessOutput> {
    const origQuote = $.quote
    try {
        $.quote = unescapedCmd => unescapedCmd
        return $(pieces, args)
    } finally {
        $.quote = origQuote
    }
  }