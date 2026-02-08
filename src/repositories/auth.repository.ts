import EmailCode from '../models/auth.model';

export class AuthRepository {
  async upsertCode(email: string, codeHash: string, expiresAt: Date) {
    return EmailCode.findOneAndUpdate(
      { email },
      { codeHash, expiresAt },
      { upsert: true, new: true }
    );
  }

  async findByEmail(email: string) {
    return EmailCode.findOne({ email });
  }

  async deleteByEmail(email: string) {
    return EmailCode.deleteOne({ email });
  }
}
