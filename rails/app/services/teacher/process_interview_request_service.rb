# frozen_string_literal: true

module Teacher
  class ProcessInterviewRequestService
    def initialize(user:, id:, status:, lock_version: nil, scheduled_at: nil)
      @user = user
      @interview_request_id = id
      @status = status
      @lock_version = lock_version
      @scheduled_at = scheduled_at
    end

    def call
      return false unless allowed_transition?

      raise_if_stale!
      interview_request.update!(update_attributes)
      notify_confirmed if @status == 'confirmed'

      true
    end

    private

    def allowed_transition?
      return false unless InterviewRequest::STATUS_TRANSITIONS[interview_request.status].include?(@status)
      return @scheduled_at.present? if @status == 'confirmed'

      true
    end

    # lock_versionを属性として渡すとActiveRecordの楽観ロックが
    # 「代入された値」をDB書き込み値として使ってしまい、
    # 本来検知すべき競合(クライアントが古いlock_versionを送ってきたケース)を
    # すり抜けてしまう。ここで明示的に比較し、それ以降の更新はActiveRecordが
    # 自前でロードした値に楽観ロックを任せる。
    def raise_if_stale!
      return if @lock_version.blank?
      return if @lock_version.to_i == interview_request.lock_version

      raise ActiveRecord::StaleObjectError.new(interview_request, 'update')
    end

    def update_attributes
      attributes = { status: @status }
      attributes[:scheduled_at] = @scheduled_at if @status == 'confirmed'
      attributes[:completed_at] = Time.current if @status == 'completed'
      attributes
    end

    def notify_confirmed
      Common::CreateInterviewConfirmedNotificationJob.perform_later(interview_request_id: interview_request.id)
    end

    def interview_request
      @interview_request ||= InterviewRequest.for_participant(@user).find_by!(id: @interview_request_id)
    end
  end
end
