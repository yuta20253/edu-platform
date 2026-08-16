# frozen_string_literal: true

module Api
  module V1
    module Student
      class StudyLogsController < Api::V1::Student::BaseController
        def create
          study_log_id = ::Student::CreateStudyLogService
                         .new(
                           user: current_user,
                           task: task,
                           unit: unit
                         )
                         .call

          render json: { study_log_id: study_log_id }, status: :ok
        end

        def update
          study_log = StudyLog.find_by!(id: params[:id], user: current_user, task: task, unit: unit)
          ::Student::CompleteStudyLogService.new(study_log: study_log).call

          render json: study_log, serializer: StudyLogSerializer, status: :ok
        end

        private

        def task
          Task.find_by!(id: params[:task_id], user: current_user)
        end

        def unit
          task.units.find(params[:unit_id])
        end
      end
    end
  end
end
