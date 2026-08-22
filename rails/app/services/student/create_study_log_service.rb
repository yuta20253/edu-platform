# frozen_string_literal: true

module Student
  class CreateStudyLogService
    def initialize(user:, task:, unit:)
      @user = user
      @task = task
      @unit = unit
    end

    def call
      study_log = StudyLog.create!(
        user: @user,
        task: @task,
        unit: @unit,
        status: :studying,
        started_at: Time.current
      )

      study_log.id
    end
  end
end
