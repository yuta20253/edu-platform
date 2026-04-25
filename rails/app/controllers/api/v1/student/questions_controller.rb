# frozen_string_literal: true

module Api
  module V1
    module Student
      class QuestionsController < Api::V1::Student::BaseController
        def index
          task = current_user.tasks.find(params[:task_id])
          unit = task.units.find(params[:unit_id])
          questions = unit.questions.includes(:question_hints, :question_choices)

          render json: questions, each_serializer: QuestionSerializer
        end
      end
    end
  end
end
