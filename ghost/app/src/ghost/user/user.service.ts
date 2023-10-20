console.log('Loaded UserService from disk');
import { CreateUserDto } from '../../http/controllers/dto/create-user.dto';
import { UpdateUserDto } from '../../http/controllers/dto/update-user.dto';
import { IUserRepository } from './user.repository';
import ObjectID from 'bson-objectid';
import { User } from './entities/user.entity';
import { Inject } from '../../common/inject';

export class UserService {
  constructor(
    @Inject('UserRepository') private readonly repository: IUserRepository,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const id = new ObjectID();
    const user = new User(
      id.toHexString(),
      createUserDto.email,
      createUserDto.name,
      createUserDto.age,
    );
    await this.repository.save(user);
    return user;
  }

  async findAll() {
    return `This action returns all user`;
  }

  async findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  async remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
