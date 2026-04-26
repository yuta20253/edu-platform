# frozen_string_literal: true

module Api
  module V1
    module Student
      class AnswersController < Api::V1::Student::BaseController
        def create
          form = ::Student::CreateQuestionHistoryForm.new(current_user: current_user,
                                                          **create_question_history_params.to_h.symbolize_keys)

          if form.save
            render json: { message: '解答結果の保存に成功しました' }, status: :created
          else
            render json: { errors: form.errors }, status: :unprocessable_content
          end
        end

        def update
          form = ::Student::UpdateQuestionHistoryForm.new(current_user: current_user,
                                                          **update_question_history_params.to_h.symbolize_keys)

          if form.save
            render json: { message: '解答結果の更新に成功しました' }, status: :ok
          else
            render json: { errors: form.errors }, status: :unprocessable_content
          end
        end

        private

        def create_question_history_params
          params.permit(:task_id, :unit_id, :question_id, :question_choice_id, :answer_text, :time_spent_sec,
                        :is_correct, :explanation_viewed)
        end

        def update_question_history_params
          params.permit(:task_id, :unit_id, :question_id, :question_choice_id, :answer_text, :time_spent_sec,
                        :is_correct, :explanation_viewed)
        end
      end
    end
  end
end
