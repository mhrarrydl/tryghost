import assert from 'assert';
import {describe, it} from 'mocha';
import {Snippet} from './snippet.entity';

describe('Snippet Entity', () => {
    let snippet: Snippet;

    beforeEach(() => {
        snippet = Snippet.create({
            name: 'Test Snippet',
            lexical: 'Test Lexical',
            mobiledoc: 'Test Mobiledoc'
        });
    });

    it('should create a snippet', () => {
        assert(snippet instanceof Snippet);
        assert.strictEqual(snippet.name, 'Test Snippet');
        assert.strictEqual(snippet.lexical, 'Test Lexical');
        assert.strictEqual(snippet.mobiledoc, 'Test Mobiledoc');
    });

    it('should update snippet name', () => {
        snippet.name = 'Updated Snippet';
        assert.strictEqual(snippet.name, 'Updated Snippet');
    });

    it('should update snippet lexical', () => {
        snippet.lexical = 'Updated Lexical';
        assert.strictEqual(snippet.lexical, 'Updated Lexical');
    });

    it('should update snippet mobiledoc', () => {
        snippet.mobiledoc = 'Updated Mobiledoc';
        assert.strictEqual(snippet.mobiledoc, 'Updated Mobiledoc');
    });
});
