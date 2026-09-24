# frozen_string_literal: true

module Student
  class CreateStudyLogService
    def initialize(user:, task:, unit:)
      @user = user
      @task = task
      @unit = unit
    end

    def call
      ActiveRecord::Base.transaction do
        study_log = StudyLog.create!(
          user: @user,
          task: @task,
          unit: @unit,
          status: :studying,
          started_at: Time.current
        )

        ::Student::TaskStartService.new(user: @user, task: @task).call

        study_log.id
      end
    end
  end
end
