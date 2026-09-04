# frozen_string_literal: true

# includeするクラスは #email と #high_school を実装すること。
module ExistingUserValidatable
  extend ActiveSupport::Concern

  included do
    validate :email_not_used_by_other_high_school
    validate :email_not_used_by_non_student
  end

  def existing_user
    return @existing_user if defined?(@existing_user)
    return @existing_user = nil if email.blank?

    @existing_user = User.find_by(email: email)
  end

  private

  def email_not_used_by_other_high_school
    return if email.blank? || high_school.blank? || existing_user.blank?

    errors.add(:email, 'は他の高校のアカウントで使用されています') if existing_user.high_school_id != high_school.id
  end

  def email_not_used_by_non_student
    return if email.blank? || existing_user.blank?

    errors.add(:email, 'は生徒以外のアカウントで使用されています') unless existing_user.student?
  end
end
