class Auth::PasswordResetForm
  include ActiveModel::Model
  include ActiveModel::Attributes
  include ActiveModel::Validations

  attr_accessor :reset_password_token, :password, :password_confirmation

  validates :reset_password_token, presence: true
  validates :password, presence: true
  validates :password_confirmation, presence: true
end
