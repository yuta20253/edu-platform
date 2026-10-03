class Api::V1::Student::CalendarsController < Api::V1::Student::BaseController
  def show
   form = ::Student::CalendarForm.new(calendar_params)

   if form.valid?
     result = ::Student::CalendarService
      .new(
        user: current_user,
        from_date: form.from_date,
        to_date: form.to_date
      )
      .call

      render json: result, status: :ok
   else
    render json: { errors: form.errors.full_messages }, status: :unprocessable_content
   end
  end

  private

  def calendar_params
    params.permit(:from, :to).to_h.symbolize_keys
  end
end
