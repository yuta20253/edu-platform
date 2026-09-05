class Api::V1::Student::AccountLinksController < Api::V1::Student::BaseController
  def create
    ::Student::AccountLinkService.new(user: current_user, student_number: params[:student_number]).call

    render json: { message: 'アカウントの紐付けが成功しました' }, status: :ok
  end
end
