import { CoreOutput } from '../../common/dtos/output.dto';
import { ArgsType, Field, ObjectType } from '@nestjs/graphql';
import { User } from '../entities/user.entity';
import { IsNumber, IsObject } from 'class-validator';

@ArgsType()
export class SeeProfileInput {
  @Field(type => Number)
  @IsNumber()
  userId: number;
}

@ObjectType()
export class SeeProfileOutput extends CoreOutput {
  @Field(type => User, { nullable: true })
  @IsObject()
  user?: User;
}
