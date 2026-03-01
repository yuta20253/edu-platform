class Api::V1::Teacher::BaseController < ApplicationController
  before_action :authorize_teacher_service

  private

  def authorize_teacher_service
    authorize :teacher_service, :access?
  end
end
