# frozen_string_literal: true

module Api
  module V1
    module Student
      class ConfirmationsController < Api::V1::Student::BaseController
        def show
          questions = Question.where(unit_id: confirmation_params[:unit_id])

          question_histories = current_user
                               .question_histories
                               .where(task_id: confirmation_params[:task_id], unit_id: confirmation_params[:unit_id])
                               .includes(:question_choice)
                               .index_by(&:question_id)

          return render json: { errors: '解答履歴がありません' }, status: :not_found if question_histories.empty?

          render json: questions,
                 each_serializer: QuestionConfirmationSerializer,
                 question_histories_by_question_id: question_histories,
                 status: :ok
        end

        private

        def confirmation_params
          params.permit(:task_id, :unit_id)
        end
      end
    end
  end
end
