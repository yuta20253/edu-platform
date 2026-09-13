# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Common::CreateInterviewRequestMessageNotificationService do
  subject(:service) { described_class.new(message: message) }

  let!(:interview_request) { create(:interview_request, :initiated_by_teacher) }

  describe '#call' do
    context '教員が送信した場合' do
      let!(:message) do
        create(:interview_request_message, interview_request: interview_request, sender: interview_request.teacher)
      end

      it '生徒宛にアナウンスサービスが呼ばれる' do
        service_double = instance_double(Teacher::CreateSystemAnnouncementService, call: true)
        allow(Teacher::CreateSystemAnnouncementService).to receive(:new).and_return(service_double)

        service.call

        expect(Teacher::CreateSystemAnnouncementService).to have_received(:new).with(
          publisher: interview_request.teacher,
          title: '面談に新しいメッセージが届いています',
          content: "#{interview_request.teacher.name}さんからメッセージが届きました。",
          announcement_targets: [
            { 'target_type' => 'by_user', 'user_id' => interview_request.student_id }
          ]
        )
      end
    end

    context '生徒が送信した場合' do
      let!(:message) do
        create(:interview_request_message, interview_request: interview_request, sender: interview_request.student)
      end

      it '教員宛にアナウンスサービスが呼ばれる' do
        service_double = instance_double(Teacher::CreateSystemAnnouncementService, call: true)
        allow(Teacher::CreateSystemAnnouncementService).to receive(:new).and_return(service_double)

        service.call

        expect(Teacher::CreateSystemAnnouncementService).to have_received(:new).with(
          publisher: interview_request.student,
          title: '面談に新しいメッセージが届いています',
          content: "#{interview_request.student.name}さんからメッセージが届きました。",
          announcement_targets: [
            { 'target_type' => 'by_user', 'user_id' => interview_request.teacher_id }
          ]
        )
      end
    end
  end
end
