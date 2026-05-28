# frozen_string_literal: true

module Api
  module V1
    module Student
      class QuestionsController < Api::V1::Student::BaseController
        def index
          task = current_user.tasks.find(params[:task_id])
          unit = task.units.find(params[:unit_id])
          questions = unit
                      .questions
                      .includes(:question_hints, :question_choices)

          answered_ids = current_user
                          .question_histories
                          .where(question_id: unit.question_ids)
                          .pluck(:question_id).to_set

          render json: questions,
                 each_serializer: QuestionSerializer,
                 scope: { answered_ids: answered_ids }
        end
      end
    end
  end
end
