import { UserRepository } from './user.repository';
import { GetApplicantsQueryDTO, UpdateUserStatusDTO } from './user.schema';
import { AppError } from '@/common/errors/app.error';
import { MESSAGES } from '@/constants/messages';
import { ERROR_CODES } from '@/constants/error-codes';
import { RESOURCES } from '@/constants/resources';
import { PaginationMetaDto } from '@/data/dtos/pagination.dto';

export class UserService {
  private readonly userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  public async getApplicants(query: GetApplicantsQueryDTO) {
    const { total, data } = await this.userRepository.findApplicants(query);

    // Strip passwords before returning
    const safeData = data.map((user) => {
      const { password: _password, ...safeUser } = user;
      return safeUser;
    });

    const meta = PaginationMetaDto.create(query.page, query.limit, total);

    return { data: safeData, meta };
  }

  public async getProfile(id: string) {
    const user = await this.userRepository.findById(id);

    if (!user) {
      throw new AppError(
        404,
        MESSAGES.COMMON.ERROR.NOT_FOUND(RESOURCES.USER),
        ERROR_CODES.COMMON.RECORD_NOT_FOUND
      );
    }

    const { password: _password, ...safeUser } = user;
    return safeUser;
  }

  public async updateStatus(id: string, payload: UpdateUserStatusDTO) {
    // 1. Verify existence
    await this.getProfile(id);

    // 2. Update status
    const updatedUser = await this.userRepository.updateAccountStatus(id, payload.status);

    const { password: _password, ...safeUser } = updatedUser;
    return safeUser;
  }
}
