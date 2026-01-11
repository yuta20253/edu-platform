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
#  user_role_id           :bigint
#  jti                    :string(255)      not null
#  deleted_at             :datetime
#  created_at             :datetime         not null
#  updated_at             :datetime         not null
#  high_school_id         :bigint
#  address_id             :bigint
#
class User < ApplicationRecord
  before_create :set_jti

  belongs_to :user_role, optional: true
  belongs_to :address, optional: true
  belongs_to :high_school

  has_one :user_personal_info, dependent: :destroy
  has_one :user_overall_question_stat, dependent: :destroy

  has_many :goals, dependent: :destroy
  has_many :tasks, dependent: :destroy
  has_many :study_logs, dependent: :destroy
  has_many :reflections, dependent: :destroy
  has_many :question_histories, dependent: :destroy
  has_many :user_subject_question_stats, dependent: :destroy
  has_many :subjects, through: :user_subject_question_stats
  has_many :user_unit_question_stats, dependent: :destroy

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

  def set_jti
    self.jti ||= SecureRandom.uuid
  end
end
