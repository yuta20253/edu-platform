class Api::V1::Student::CoursesController < Api::V1::Student::BaseController
  def index
    courses = Course.includes(:units)
    if params[:subject].present?
      courses = Course.joins(:subject).includes(:units).where(subjects: { name: params[:subject] })
    end

    render json: courses.as_json(include: :units), status: :ok
  end
end
