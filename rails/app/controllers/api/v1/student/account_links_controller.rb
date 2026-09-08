# frozen_string_literal: true

module Api
  module V1
    module Student
      class AccountLinksController < Api::V1::Student::BaseController
        def create
          ::Student::AccountLinkService.new(user: current_user, student_number: params[:student_number]).call

          render json: { message: 'アカウントの紐付けが成功しました' }, status: :ok
        end
      end
    end
  end
end
