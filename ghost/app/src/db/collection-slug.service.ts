import {Inject} from '@nestjs/common'

export class CollectionSlugService {
    constructor(@Inject('CollectionModel') private model: any) {}
}
