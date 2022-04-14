import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import {
  CreateAccountInput,
  CreateAccountOutput,
} from '@src/users/dtos/create-account.dto';
import { User } from '@src/users/entities/user.entity';
import { UserService } from '@src/users/users.service';
import { LoginOutput, LoginInput } from '@src/users/dtos/login.dto';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '@src/auth/auth.guard';
import { AuthUser } from '@src/auth/auth-user.decorator';
import {
  EditPasswordOutput,
  EditPasswordInput,
} from './dtos/edit-password.dto';
import {
  SeeProfileInput,
  SeeProfileOutput,
} from '@src/users/dtos/see-profile.dto';
import {
  EditProfileOutput,
  EditProfileInput,
} from '@src/users/dtos/edit-profile.dto';
import {
  VerifyEmailOutput,
  VerifyEmailInput,
} from '@src/users/dtos/verify-email.dto';

@Resolver(of => User)
export class UserResolver {
  constructor(private readonly usersService: UserService) {}

  @Mutation(returns => CreateAccountOutput)
  createAccount(
    @Args('input') createAccountInput: CreateAccountInput,
  ): Promise<CreateAccountOutput> {
    return this.usersService.createAccount(createAccountInput);
  }

  @Mutation(returns => LoginOutput)
  login(@Args('input') loginInput: LoginInput): Promise<LoginOutput> {
    return this.usersService.login(loginInput);
  }

  @Query(returns => User)
  @UseGuards(AuthGuard)
  me(@AuthUser() authUser: User) {
    return authUser;
  }

  @Query(returns => SeeProfileOutput)
  @UseGuards(AuthGuard)
  seeProfile(
    @Args() seeProfileInput: SeeProfileInput,
  ): Promise<SeeProfileOutput> {
    return this.usersService.findById(seeProfileInput.userId);
  }

  @Mutation(returns => EditProfileOutput)
  @UseGuards(AuthGuard)
  editProfile(
    @AuthUser() authUser: User,
    @Args('input') editProfileInput: EditProfileInput,
  ): Promise<EditProfileOutput> {
    return this.usersService.editProfile(authUser.id, editProfileInput);
  }

  @Mutation(returns => EditPasswordOutput)
  @UseGuards(AuthGuard)
  editPassword(
    @AuthUser() authUser: User,
    @Args('input') editPasswordInput: EditPasswordInput,
  ): Promise<EditPasswordOutput> {
    return this.usersService.editPassword(authUser.id, editPasswordInput);
  }

  @Mutation(returns => VerifyEmailOutput)
  verifyEmail(
    @Args('input') { code }: VerifyEmailInput,
  ): Promise<VerifyEmailOutput> {
    return this.usersService.verifyEmail(code);
  }
}
