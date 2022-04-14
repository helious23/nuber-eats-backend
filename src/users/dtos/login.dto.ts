import { Field, InputType, ObjectType, PickType } from '@nestjs/graphql';
import { User } from '@src/users/entities/user.entity';
import { CoreOutput } from '@src/common/dtos/output.dto';
import { IsOptional, IsString } from 'class-validator';

@InputType()
export class LoginInput extends PickType(User, ['email', 'password']) {}

@ObjectType()
export class LoginOutput extends CoreOutput {
  @Field(type => String, { nullable: true })
  @IsString()
  @IsOptional()
  token?: string;
}
