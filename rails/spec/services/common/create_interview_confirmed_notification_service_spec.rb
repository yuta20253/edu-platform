# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Common::CreateInterviewConfirmedNotificationService do
  subject(:service) { described_class.new(interview_request: interview_request) }

  let!(:interview_request) do
    create(
      :interview_request, :initiated_by_teacher, status: :confirmed,
                                                 scheduled_at: Time.zone.local(2026, 9, 10, 16, 0)
    )
  end

  describe '#call' do
    it '生徒宛にアナウンスサービスが呼ばれる' do
      service_double = instance_double(Teacher::CreateSystemAnnouncementService, call: true)
      allow(Teacher::CreateSystemAnnouncementService).to receive(:new).and_return(service_double)

      service.call

      expect(Teacher::CreateSystemAnnouncementService).to have_received(:new).with(
        publisher: interview_request.teacher,
        title: '面談日程が確定しました',
        content: '面談日程が2026年09月10日 16:00に確定しました。',
        announcement_targets: [
          { 'target_type' => 'by_user', 'user_id' => interview_request.student_id }
        ]
      )
      expect(service_double).to have_received(:call)
    end
  end
end
