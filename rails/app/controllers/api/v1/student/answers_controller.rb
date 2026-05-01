# frozen_string_literal: true

module Api
  module V1
    module Student
      class AnswersController < Api::V1::Student::BaseController
        def create
          form = ::Student::CreateQuestionHistoryForm.new(current_user: current_user,
                                                          **answer_params.to_h.symbolize_keys)

          result = form.save

          if result
            render json: result, status: :created
          else
            render json: { errors: form.errors }, status: :unprocessable_content
          end
        end

        def update
          form = ::Student::UpdateQuestionHistoryForm.new(current_user: current_user,
                                                          **answer_params.to_h.symbolize_keys)

          result = form.save

          if result
            render json: result, status: :ok
          else
            render json: { errors: form.errors }, status: :unprocessable_content
          end
        end

        private

        def answer_params
          params.permit(:task_id, :unit_id, :question_id, :question_choice_id, :answer_text, :time_spent_sec,
                        :explanation_viewed)
        end
      end
    end
  end
end
