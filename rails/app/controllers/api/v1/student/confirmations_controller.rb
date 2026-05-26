# frozen_string_literal: true

module Api
  module V1
    module Student
      class ConfirmationsController < Api::V1::Student::BaseController
        before_action :set_questions, only: :show
        def show
          question_histories = current_user
                               .question_histories
                               .where(
                                 task_id: confirmation_params[:task_id],
                                 unit_id: confirmation_params[:unit_id],
                                 question_id: answered_question_ids
                               )
                               .includes(:question_choice)
                               .index_by(&:question_id)

          return render json: { errors: '解答履歴がありません' }, status: :not_found if question_histories.empty?

          render json: @questions,
                 each_serializer: QuestionConfirmationSerializer,
                 question_histories_by_question_id: question_histories,
                 status: :ok
        end

        private

        def confirmation_params
          params.permit(:task_id, :unit_id, :answered_question_ids)
        end

        def answered_question_ids
          return [] if confirmation_params[:answered_question_ids].blank?

          confirmation_params[:answered_question_ids]
            .split(',')
            .map(&:to_i)
        end

        def set_questions
          task = current_user.tasks.find(confirmation_params[:task_id])
          unit = task.units.find(confirmation_params[:unit_id])
          @questions = unit.questions
        rescue ActiveRecord::RecordNotFound
          render json: { errors: '対象データが見つかりません' }, status: :not_found
        end
      end
    end
  end
end
