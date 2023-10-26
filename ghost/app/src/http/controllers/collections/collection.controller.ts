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
    UseInterceptors,
    UseGuards
} from "@nestjs/common";
import {JsonApiInterceptor} from "../../interceptors/json-api.interceptor";
import {PermissionsGuard} from "../../guards/permissions.guard";
import {Roles} from "../../decorators/roles.decorator";

@Controller("collections")
@UseInterceptors(new JsonApiInterceptor('collections'))
@UseGuards(PermissionsGuard)
export class CollectionController {
    constructor(
        @Inject('CollectionsService') private readonly collectionsService: CollectionsService
    ) {}

    @Roles(['Owner', 'Admin'])
    @Post()
    create(@Body() createCollectionDto: any) {
        return this.collectionsService.createCollection(createCollectionDto);
    }

    @Roles(['Owner', 'Admin', 'Editor', 'Author', 'Contributor'])
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

    @Roles(['Owner', 'Admin', 'Editor', 'Author', 'Contributor'])
    @Get(":id")
    async findOneById(@Param() id: string) {
        const result = await this.collectionsService.getById(id);

        if (!result) {
            throw new Error('Not Found');
        }

        return result;
    }

    @Roles(['Owner', 'Admin', 'Editor', 'Author', 'Contributor'])
    @Get("slug/:slug")
    async findOneBySlug(@Param() slug: string) {
        const result = await this.collectionsService.getBySlug(slug);

        if (!result) {
            throw new Error('Not Found');
        }

        return result;
    }

    @Roles(['Owner', 'Admin'])
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

    @Roles(['Owner', 'Admin'])
    @Delete(":id")
    async remove(@Param() id: string) {
        return this.collectionsService.destroy(id);
    }
}
