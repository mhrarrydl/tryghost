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
            name: 'Updated Name',
            lexical: '{}',
            mobiledoc: '{}'
        });

        assert(updated);

        const pageOfSnippets = await service.getPage({
            page: 1,
            limit: 10
        });

        assert(pageOfSnippets.data[0].name === updated.name);

        const deleted = await service.delete(snippet.id);

        assert(deleted);

        const cannotDelete = await service.delete(deleted.id);

        assert(!cannotDelete);

        const cannotUpdate = await service.update(deleted.id, {
            name: 'Updated Again'
        });

        assert(!cannotUpdate);

        const notFound = await service.getOne(snippet.id);

        assert(!notFound);
    });
});
