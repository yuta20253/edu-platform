# frozen_string_literal: true

module Common
  class PostInterviewRequestMessageService
    def initialize(interview_request:, sender:, body:)
      @interview_request = interview_request
      @sender = sender
      @body = body
    end

    def call
      message = @interview_request.interview_request_messages.create!(sender: @sender, body: @body)

      advance_to_scheduling

      notify_message(message)

      message
    end

    private

    # ステータス遷移をメッセージ作成と同一トランザクションにすると、
    # 双方が同時にメッセージを送った場合など片方の更新がStaleObjectErrorに
    # なった際、既に保存されているはずのメッセージごとロールバックされてしまう。
    # ステータス更新は独立させ、競合時は「他の操作で既に進行済み」とみなして無視する。
    def advance_to_scheduling
      @interview_request.reload
      @interview_request.update!(status: :scheduling) if @interview_request.requested?
    rescue ActiveRecord::StaleObjectError
      nil
    end

    def notify_message(message)
      Common::CreateInterviewRequestMessageNotificationJob.perform_later(interview_request_message_id: message.id)
    end
  end
end
