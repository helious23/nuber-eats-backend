import { InputType, ObjectType, PartialType, PickType } from '@nestjs/graphql';
import { CoreOutput } from '@src/common/dtos/output.dto';
import { User } from '@src/users/entities/user.entity';

@ObjectType()
export class EditPasswordOutput extends CoreOutput {}

@InputType()
export class EditPasswordInput extends PartialType(
  PickType(User, ['password']),
) {}
