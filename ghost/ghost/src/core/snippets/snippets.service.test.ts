import assert from 'assert';
import {SnippetsService} from './snippets.service';
import {SnippetsRepositoryInMemory} from '../../db/in-memory/snippets.repository.inmemory';

describe('SnippetService', () => {
    it('Can do some basic service stuff', async () => {
        const repository = new SnippetsRepositoryInMemory();
        const service = new SnippetsService(repository);

        const snippet = await service.create({
            name: 'Test Snippet',
            lexical: '',
            mobiledoc: '{}'
        });

        const allSnippets = await service.getAll({});

        assert(allSnippets[0].name === snippet.name);

        const updated = await service.update(snippet.id, {
            name: 'Updated Name'
        });

        assert(updated);

        const pageOfSnippets = await service.getPage({
            page: 1,
            limit: 10
        });

        assert(pageOfSnippets.data[0].name === updated.name);

        await service.delete(snippet.id);

        const notFound = await service.getOne(snippet.id);

        assert(notFound === null);
    });
});
