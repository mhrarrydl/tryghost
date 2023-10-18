import { IsPositive, IsEmail, IsString } from "class-validator";
export class CreateUserDto {
    @IsString()
    name!: string;

    @IsEmail()
    email!: string;

    @IsPositive()
    age!: number;
}
