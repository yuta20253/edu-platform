# frozen_string_literal: true

module Api
  module V1
    module Admin
      class AnalyticsController < BaseController
        def show
          form = ::Admin::AnalyticsFilterForm.new(filter_params)
          return render json: { errors: form.errors.full_messages }, status: :unprocessable_content if form.invalid?

          query = ::Admin::AnalyticsQuery.new(
            from: form.from_date,
            to: form.to_date,
            high_school_id: form.high_school_id,
            subject_id: form.subject_id
          )

          render json: {
            kpis: query.kpis,
            daily_activity: query.daily_activity,
            low_accuracy_units: query.low_accuracy_units,
            low_accuracy_questions: query.low_accuracy_questions,
            high_school_usage: query.high_school_usage,
            content_coverage: query.content_coverage,
            meta: query.meta
          }
        end

        private

        def filter_params
          params.permit(:from, :to, :high_school_id, :subject_id)
        end
      end
    end
  end
end
