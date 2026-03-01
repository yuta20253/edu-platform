class Api::V1::Teacher::TeachersController < Api::V1::Teacher::BaseController
  def index
    teachers = TeachersQuery.new(current_user.high_school.users).colleagues.result
    render json: teachers, each_serializer: TeacherSerializer, status: :ok
  end

  def show
    teacher = TeachersQuery.new(current_user.high_school.users).colleagues.find(params[:id])
    render json: teacher, serializer: TeacherSerializer, status: :ok
  end
end
