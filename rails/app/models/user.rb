# frozen_string_literal: true

class User < ApplicationRecord
  belongs_to :user_role, optional: true
  has_one :user_personal_info

  # Include default devise modules. Others available are:
  # :confirmable, :lockable, :timeoutable, :trackable and :omniauthable
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :validatable,
         :jwt_authenticatable, jwt_revocation_strategy: JwtDenylist

  def student?
    user_role&.role_name == 'student'
  end

  def teacher?
    user_role&.role_name == 'teacher'
  end

  def parent?
    user_role&.role_name == 'parent'
  end
end
