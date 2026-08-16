# frozen_string_literal: true

module Student
  class CompleteStudyLogService
    def initialize(study_log:)
      @study_log = study_log
    end

    def call
      raise AlreadyCompletedStudyLogError, ['この学習ログはすでに完了しています'] if @study_log.completed?

      ended_at = Time.current

      @study_log.update!(
        status: :completed,
        duration_minutes: duration_minutes(ended_at),
        ended_at: ended_at
      )

      @study_log
    end

    private

    def duration_minutes(ended_at)
      ((ended_at - @study_log.started_at) / 60).floor
    end
  end
end
