# frozen_string_literal: true

class ProfileUpdateForm
  include ActiveModel::Model
  include ActiveModel::Attributes

  attr_accessor :user

  attribute :name, :string
  attribute :name_kana, :string
  attribute :address_id, :integer
  attribute :gender, :string
  attribute :phone_number, :string
  attribute :birthday, :date

  validates :name, presence: true
  validates :name_kana, presence: true
  validates :phone_number, format: { with: /\A\d{10,11}\z/ }
  validates :gender, inclusion: { in: UserPersonalInfo.genders.keys }
  validate :birthday_cannot_be_future

  def save
    return false unless valid?

    ActiveRecord::Base.transaction do
      update_user!
      update_user_personal_info!
    end
    true
  rescue ActiveRecord::RecordInvalid => e
    e.record.errors.each do |error|
      errors.add(error.attribute, error.message)
    end
    false
  end

  private

  def update_user!
    user.update!(
      name: name,
      name_kana: name_kana,
      address_id: address_id
    )
  end

  def update_user_personal_info!
    info = user.user_personal_info || user.build_user_personal_info
    info.assign_attributes(
      phone_number: phone_number,
      birthday: birthday,
      gender: gender
    )
    info.save!
  end

  def birthday_cannot_be_future
    return if birthday.blank?

    errors.add(:birthday, 'は未来日付にできません。') if birthday > Time.zone.today
  end
end
