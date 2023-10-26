import {CollectionsService} from "../../../ghost/collections/CollectionsService";
import {
    Controller,
    Get,
    Post,
    Body,
    Put,
    Param,
    Delete,
    Query,
    Inject,
    UseInterceptors
} from "@nestjs/common";
import {JsonApiInterceptor} from "../../interceptors/json-api.interceptor";

@Controller("collections")
@UseInterceptors(new JsonApiInterceptor('collections'))
export class CollectionController {
    constructor(
        @Inject('CollectionsService') private readonly collectionsService: CollectionsService
    ) {}

    @Post()
    create(@Body() createCollectionDto: any) {
        return this.collectionsService.createCollection(createCollectionDto);
    }

    @Get()
    async findAll(
        @Query('page') page: number,
        @Query('limit') limit: number,
        @Query('filter') filter: string,
    ) {
        console.log({page, limit, filter});
        const result = await this.collectionsService.getAll({
            page, limit, filter
        });

        return result;
    }

    @Get(":id")
    async findOneById(@Param() id: string) {
        const result = await this.collectionsService.getById(id);

        if (!result) {
            throw new Error('Not Found');
        }

        return result;
    }

    @Get("slug/:slug")
    async findOneBySlug(@Param() slug: string) {
        const result = await this.collectionsService.getBySlug(slug);

        if (!result) {
            throw new Error('Not Found');
        }

        return result;
    }

    @Put(":id")
    async update(@Param("id") id: string, @Body() updateCollectionDto: any) {
        const result = await this.collectionsService.edit({
            id,
            ...updateCollectionDto
        });

        if (!result) {
            throw new Error('Not Found');
        }

        return result;
    }

    @Delete(":id")
    async remove(@Param() id: string) {
        return this.collectionsService.destroy(id);
    }
}
