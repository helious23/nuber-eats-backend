import { v4 as uuidv4 } from 'uuid';
import { InputType, ObjectType, Field } from '@nestjs/graphql';
import { Entity, Column, OneToOne, JoinColumn, BeforeInsert } from 'typeorm';
import { CoreEntity } from '@src/common/entities/core.entity';
import { IsString, IsObject } from 'class-validator';
import { User } from '@src/users/entities/user.entity';

@InputType({ isAbstract: true })
@ObjectType()
@Entity()
export class Verification extends CoreEntity {
  @Column()
  @Field(type => String)
  @IsString()
  code: string;

  @OneToOne(type => User, { onDelete: 'CASCADE' })
  @JoinColumn()
  @IsObject()
  user: User;

  @BeforeInsert()
  createCode(): void {
    this.code = uuidv4().replace(/-/g, '');
  }
}
