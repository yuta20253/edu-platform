class Api::V1::Student::Analytics::SummariesController < Api::V1::Student::BaseController
  def show
    form = ::Student::AnalyticsPeriodForm.new(summary_params)

    if form.valid?
      result = ::Student::Analytics::Summary
        .new(current_user, from: form.from_date, to: form.to_date)
        .call

      render json: result, status: :ok
    else
      render json: { errors: form.errors.full_messages }, status: :unprocessable_content
    end
  end

  private

  def summary_params
    params.permit(:from, :to)
  end
end


