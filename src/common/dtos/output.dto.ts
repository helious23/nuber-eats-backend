import { Field, ObjectType } from '@nestjs/graphql';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

@ObjectType()
export class CoreOutput {
  @Field(type => Boolean)
  @IsBoolean()
  ok: boolean;

  @Field(type => String, { nullable: true })
  @IsString()
  @IsOptional()
  error?: string;
}
