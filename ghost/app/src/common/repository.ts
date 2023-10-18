import ObjectID from 'bson-objectid';

type Result<T> = T | null;

type GetAllOptions = {
  filter: string | undefined;
};

type GetSomeOptions = {
  filter: string | undefined;
  page: number;
  limit: number;
};

export interface Repository<Entity> {
  save(entity: Entity): Promise<void>;
  getOne(id: ObjectID): Promise<Result<Entity>>;
  getSome(options: GetSomeOptions): Promise<Entity[]>;
  getAll(options: GetAllOptions): Promise<Entity[]>;
}
