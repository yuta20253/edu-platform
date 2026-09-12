# frozen_string_literal: true

module Common
  class CancelInterviewRequestService
    def initialize(interview_request:, cancelled_by:, reason: nil, lock_version: nil)
      @interview_request = interview_request
      @cancelled_by = cancelled_by
      @reason = reason
      @lock_version = lock_version
    end

    def call
      return false unless @interview_request.active?

      raise_if_stale!

      @interview_request.update!(
        status: :cancelled,
        cancelled_at: Time.current,
        cancelled_by_id: @cancelled_by.id,
        cancel_reason: @reason
      )

      notify_cancelled

      true
    end

    private

    # lock_versionを属性として渡すとActiveRecordの楽観ロックが
    # 「代入された値」をDB書き込み値として使ってしまい、
    # 本来検知すべき競合(クライアントが古いlock_versionを送ってきたケース)を
    # すり抜けてしまう。ここで明示的に比較し、それ以降の更新はActiveRecordが
    # 自前でロードした値に楽観ロックを任せる。
    def raise_if_stale!
      return if @lock_version.blank?
      return if @lock_version.to_i == @interview_request.lock_version

      raise ActiveRecord::StaleObjectError.new(@interview_request, 'update')
    end

    def notify_cancelled
      Common::CreateInterviewCancelledNotificationJob.perform_later(interview_request_id: @interview_request.id)
    end
  end
end
