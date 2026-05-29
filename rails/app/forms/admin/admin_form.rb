# frozen_string_literal: true

module Admin
  class AdminForm
    include ActiveModel::Model
    include ActiveModel::Attributes

    attribute :name, :string
    attribute :email, :string

    attr_accessor :user

    validates :email, presence: true, unless: :updating?
    validates :name, presence: true, on: :update

    def save!
      validation_context = updating? ? :update : nil
      raise ActiveRecord::RecordInvalid.new(error_record) unless valid?(validation_context)

      updating? ? update_admin : create_admin
    end

    private

    def updating?
      @user.present?
    end

    def create_admin
      ::Admin::CreateAdminService.new(name: name, email: email).call
    end

    def update_admin
      @user.update!({ name: name, email: email }.compact)
      @user
    end

    def error_record
      record = User.new
      errors.each { |error| record.errors.add(error.attribute, error.message) }
      record
    end
  end
end
