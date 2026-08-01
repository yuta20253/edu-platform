class Api::V1::Teacher::GradesController < Api::V1::Teacher::BaseController
  def index
    grades = current_user.high_school.grades

    render json: grades, each_serializer: GradeSerializer, status: :ok
  end
end
