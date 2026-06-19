# frozen_string_literal: true

module Admin
  class AdminForm
    include ActiveModel::Model
    include ActiveModel::Attributes

    attribute :name, :string
    attribute :email, :string
    attribute :address_id, :integer
    attribute :phone_number, :string
    attribute :birthday, :date
    attribute :gender, :string

    attr_accessor :user

    validates :email, presence: true, unless: :updating?
    validates :name, presence: true, on: :update
    # 個人情報・住所は招待直後でプロフィール未設定の admin を弾かないよう全て任意。
    # 入力された場合のみ形式・整合性を検証する。
    validates :phone_number, format: { with: /\A\d{10,11}\z/ }, allow_blank: true, on: :update
    validates :gender, inclusion: { in: UserPersonalInfo.genders.keys }, allow_blank: true, on: :update
    validate :address_must_exist, on: :update
    validate :birthday_cannot_be_future, on: :update

    def save
      validation_context = updating? ? :update : nil
      return false unless valid?(validation_context)

      @result = updating? ? update_admin : create_admin
      true
    rescue ActiveRecord::RecordInvalid => e
      e.record.errors.each { |error| errors.add(error.attribute, error.message) }
      false
    end

    attr_reader :result

    private

    def updating?
      @user.present?
    end

    def create_admin
      ::Admin::CreateAdminService.new(name: name, email: email).call
    end

    def update_admin
      ActiveRecord::Base.transaction do
        @user.update!({ name: name, email: email, address_id: address_id }.compact)
        update_user_personal_info!
      end
      @user
    end

    def update_user_personal_info!
      info = @user.user_personal_info
      # 既存 info が無く個人情報も未入力なら、空レコードは作らない（name/email のみ更新時）
      return if info.nil? && personal_info_blank?

      info ||= @user.build_user_personal_info
      info.assign_attributes(
        phone_number: phone_number,
        birthday: birthday,
        gender: gender
      )
      info.save!
    end

    def personal_info_blank?
      phone_number.blank? && birthday.blank? && gender.blank?
    end

    def address_must_exist
      return if address_id.blank?

      errors.add(:address_id, 'が不正です。') unless Address.exists?(address_id)
    end

    def birthday_cannot_be_future
      return if birthday.blank?

      errors.add(:birthday, 'は未来日付にできません。') if birthday > Time.zone.today
    end
  end
end
