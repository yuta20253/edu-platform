# frozen_string_literal: true

module Api
  module V1
    module Student
      class ConfirmationsController < Api::V1::Student::BaseController
        before_action :set_questions, only: :show
        def show
          render json: @questions,
                 each_serializer: QuestionConfirmationSerializer,
                 question_histories_by_question_id: question_histories,
                 status: :ok
        end

        private

        def question_histories
          return {} if answered_question_ids.blank?

          current_user
            .question_histories
            .where(
              task_id: params[:task_id],
              unit_id: params[:unit_id],
              question_id: answered_question_ids
            )
            .includes(:question_choice)
            .index_by(&:question_id)
        end

        def answered_question_ids
          return [] if params[:answered_question_ids].blank?

          params[:answered_question_ids]
            .split(',')
            .map(&:to_i)
        end

        def set_questions
          task = current_user.tasks.find(params[:task_id])
          unit = task.units.find(params[:unit_id])
          @questions = unit.questions
        rescue ActiveRecord::RecordNotFound
          render json: { errors: '対象データが見つかりません' }, status: :not_found
        end
      end
    end
  end
end
