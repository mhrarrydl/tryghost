import {CollectionRepository} from "../ghost/collections/CollectionRepository";
import {Collection} from "../ghost/collections/entities/Collection";
import * as Sentry from '@sentry/node';
import ObjectID from 'bson-objectid';
import {Inject} from "@nestjs/common";

export class BookshelfCollectionsRepository implements CollectionRepository {
    constructor(
        @Inject('CollectionModel') private model: any,
        @Inject('CollectionPostModel') private relationModel: any,
        @Inject('DomainEvents') private DomainEvents: any,
        @Inject('Logger') private logger: any,
        @Inject('Sentry') private sentry: typeof Sentry
    ) {}

    async createTransaction(cb: any) {
        return this.model.transaction(cb);
    }

    async getById(id: string, options: any = {}) {
        const model = await this.model.findOne(
            { id },
            {
                require: false,
                transacting: options.transaction,
            }
        );
        if (!model) {
            return null;
        }

        model.collectionPostIds = await this.#fetchCollectionPostIds(
            model.id,
            options
        );

        return this.#modelToCollection(model);
    }

    async getBySlug(slug: string, options: any = {}) {
        const model = await this.model.findOne(
            { slug },
            {
                require: false,
                transacting: options.transaction,
            }
        );

        if (!model) {
            return null;
        }

        model.collectionPostIds = await this.#fetchCollectionPostIds(
            model.id,
            options
        );

        return this.#modelToCollection(model);
    }

    /**
     * NOTE: we are only fetching post_id column here to save memory on
     *       instances with a large amount of posts
     *
     *       The method could be further optimized to fetch posts for
     *       multiple collections at a time.
     */
    async #fetchCollectionPostIds(collectionId: string, options: any = {}) {
        const toSelect = options.columns || ["post_id"];

        const query = this.relationModel.query();
        if (options.transaction) {
            query.transacting(options.transaction);
        }

        return await query
            .select(toSelect)
            .where("collection_id", collectionId);
    }

    async getAll(options: any = {}) {
        const models = await this.model.findAll({
            ...options,
            transacting: options.transaction,
        });

        for (const model of models) {
            // NOTE: Ideally collection posts would be fetching as a part of findAll query.
            //       Because bookshelf introduced a massive processing and memory overhead
            //       we are fetching collection post ids separately using raw knex query
            model.collectionPostIds = await this.#fetchCollectionPostIds(
                model.id,
                options
            );
        }

        return (
            await Promise.all(
                models.map((model: any) => this.#modelToCollection(model))
            )
        ).filter((entity) => !!entity);
    }

    async #modelToCollection(model: any) {
        const json = model.toJSON();
        let filter = json.filter;

        if (json.type === "automatic" && typeof filter !== "string") {
            filter = "";
        }

        try {
            // NOTE: collectionPosts are not a part of serialized model
            //       and are fetched separately to save memory
            const posts = model.collectionPostIds;

            return await Collection.create({
                id: json.id,
                slug: json.slug,
                title: json.title,
                description: json.description,
                filter: filter,
                type: json.type,
                featureImage: json.feature_image,
                posts: posts.map((collectionPost: any) => collectionPost.post_id),
                createdAt: json.created_at,
                updatedAt: json.updated_at,
            });
        } catch (err) {
            this.logger.error(err);
            this.sentry.captureException(err);
            return null;
        }
    }

    async save(collection: any, options: any = {}) {
        if (!options.transaction) {
            return this.createTransaction((transaction: any) => {
                return this.save(collection, {
                    ...options,
                    transaction,
                });
            });
        }

        if (collection.deleted) {
            await this.relationModel
                .query()
                .delete()
                .where("collection_id", collection.id)
                .transacting(options.transaction);
            await this.model
                .query()
                .delete()
                .where("id", collection.id)
                .transacting(options.transaction);
            return;
        }

        const data = {
            id: collection.id,
            slug: collection.slug,
            title: collection.title,
            description: collection.description,
            filter: collection.filter,
            type: collection.type,
            feature_image: collection.featureImage || null,
            created_at: collection.createdAt,
            updated_at: collection.updatedAt,
        };

        const existing = await this.model.findOne(
            { id: data.id },
            {
                require: false,
                transacting: options.transaction,
            }
        );

        if (!existing) {
            await this.model.add(data, {
                transacting: options.transaction,
            });
            const collectionPostsRelations = collection.posts.map(
                (postId: any, index: any) => {
                    return {
                        id: new ObjectID().toHexString(),
                        sort_order: collection.type === "manual" ? index : 0,
                        collection_id: collection.id,
                        post_id: postId,
                    };
                }
            );
            if (collectionPostsRelations.length > 0) {
                await this.relationModel
                    .query()
                    .insert(collectionPostsRelations)
                    .transacting(options.transaction);
            }
        } else {
            await this.model.edit(data, {
                id: data.id,
                transacting: options.transaction,
            });

            if (collection.type === "manual") {
                const collectionPostsRelations = collection.posts.map(
                    (postId: any, index: any) => {
                        return {
                            id: new ObjectID().toHexString(),
                            sort_order: index,
                            collection_id: collection.id,
                            post_id: postId,
                        };
                    }
                );
                await this.relationModel
                    .query()
                    .delete()
                    .where("collection_id", collection.id)
                    .transacting(options.transaction);
                if (collectionPostsRelations.length > 0) {
                    await this.relationModel
                        .query()
                        .insert(collectionPostsRelations)
                        .transacting(options.transaction);
                }
            } else {
                const collectionPostsToDelete = collection.events
                    .filter((event: any) => event.type === "CollectionPostRemoved")
                    .map((event: any) => {
                        return event.data.post_id;
                    });

                const collectionPostsToInsert = collection.events
                    .filter((event: any) => event.type === "CollectionPostAdded")
                    .map((event: any) => {
                        return {
                            id: new ObjectID().toHexString(),
                            sort_order: 0,
                            collection_id: collection.id,
                            post_id: event.data.post_id,
                        };
                    });

                if (collectionPostsToDelete.length > 0) {
                    await this.relationModel
                        .query()
                        .delete()
                        .where("collection_id", collection.id)
                        .whereIn("post_id", collectionPostsToDelete)
                        .transacting(options.transaction);
                }
                if (collectionPostsToInsert.length > 0) {
                    await this.relationModel
                        .query()
                        .insert(collectionPostsToInsert)
                        .transacting(options.transaction);
                }
            }

            options.transaction.executionPromise.then(() => {
                for (const event of collection.events) {
                    this.DomainEvents.dispatch(event);
                }
            });
        }
    }
};
