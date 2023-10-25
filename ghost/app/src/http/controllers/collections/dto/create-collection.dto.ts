import { IsPositive, IsEmail, IsString } from "class-validator";

export class CreateCollectionDTO {
    @IsString()
    name!: string;

    @IsEmail()
    email!: string;

    @IsPositive()
    age!: number;
}
