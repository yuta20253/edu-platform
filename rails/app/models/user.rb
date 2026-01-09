# frozen_string_literal: true

# == Schema Information
#
# Table name: users
#
#  id                     :bigint           not null, primary key
#  email                  :string(255)      not null
#  encrypted_password     :string(255)      not null
#  reset_password_token   :string(255)
#  reset_password_sent_at :datetime
#  remember_created_at    :datetime
#  name                   :string(100)
#  name_kana              :string(100)
#  user_role_id           :bigint           not null
#  jti                    :string(255)      not null
#  deleted_at             :datetime
#  created_at             :datetime         not null
#  updated_at             :datetime         not null
#
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
