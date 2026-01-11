class Api::V1::RoleRegistrationsController < ApplicationController
  def student
    signup_with_role("student")
  end

  def teacher
    signup_with_role("teacher")
  end

  def admin
    signup_with_role("admin")
  end

  private

  def signup_with_role(role_name)
    request.env["devise.mapping"] = Devise.mappings[:user]

    role = UserRole.find_by!(role_name: role_name)

    user = User.new(sign_up_params.merge(user_role_id: role.id, high_school_id: 1))

    if user.save
      token = Warden::JWTAuth::UserEncoder.new.call(user, :user, nil).first

      render json: { user:, token: }, status: :created
    else
      render json: { errors: user.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def sign_up_params
    params.require(:user).permit(:email, :name, :name_kana, :password, :password_confirmation)
  end
end
